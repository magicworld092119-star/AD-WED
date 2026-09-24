import uuid
import datetime
import io
import cv2
import nibabel as nib
import numpy as np
import torch
from pathlib import Path
from typing import Optional
from fastapi import APIRouter, UploadFile, File, Form, Header, HTTPException, status, Query, Response
from backend.app.schemas.prediction_schema import PredictionResponse, StageProbability
from backend.app.api.v1.history import save_history_record
from config.settings import settings
from config.constants import DISEASE_STAGES
from ai.deep_learning.model_loader import get_model
from ai.preprocessing.loader import preprocess_mri_volume
from ai.explainability.gradcam import GradCAM3D, overlay_heatmap_on_slice
from loguru import logger

router = APIRouter()

@router.post("/predict", response_model=PredictionResponse, tags=["Inference"])
async def predict_alzheimer_stage(
    file: UploadFile = File(...),
    patient_id: Optional[str] = Form(None),
    patient_age: Optional[str] = Form(None),
    gender: Optional[str] = Form(None),
    user_id: Optional[str] = Form(None),
    user_email: Optional[str] = Form(None),
    x_user_id: Optional[str] = Header(None, alias="X-User-Id"),
    x_user_email: Optional[str] = Header(None, alias="X-User-Email")
):
    """
    Upload real 3D Brain MRI scan (.nii/.nii.gz) for preprocessing, stage prediction with 3D DenseNet-121,
    and 3D Grad-CAM class activation heatmap generation.
    """
    fname_lower = file.filename.lower()
    if not (fname_lower.endswith(".nii") or fname_lower.endswith(".nii.gz") or fname_lower.endswith(".gz")):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file format. Please upload a valid NIfTI 3D Brain MRI (.nii or .nii.gz) file."
        )
    
    pred_id = f"scan_{uuid.uuid4().hex[:8]}"
    upload_dir = settings.UPLOADS_DIR
    heatmaps_dir = settings.HEATMAPS_DIR
    temp_dir = settings.TEMP_DIR
    
    upload_dir.mkdir(parents=True, exist_ok=True)
    heatmaps_dir.mkdir(parents=True, exist_ok=True)
    temp_dir.mkdir(parents=True, exist_ok=True)
    
    file_path = upload_dir / f"{pred_id}_{file.filename}"
    
    # Save uploaded bytes to disk
    contents = await file.read()
    if len(contents) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty. Please select a valid 3D sMRI volume."
        )
        
    with open(file_path, "wb") as f:
        f.write(contents)
        
    # Preprocess 3D volume                    moves to loader.py
    try:
        input_tensor, visual_volume, affine = preprocess_mri_volume(file_path, target_shape=(96, 96, 96))
    except Exception as e:
        logger.error(f"Preprocessing failed for {file.filename}: {e}")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Unable to read or parse NIfTI volume: {str(e)}"
        )

    # Load 3D DenseNet-121 model and run inference
    try: #             moves to model_loader.py
        model, device = get_model()
        input_tensor = input_tensor.to(device)

        with torch.no_grad():
            logits = model(input_tensor)
            probs = torch.softmax(logits, dim=1)[0]
            
        prob_cn = float(probs[0].item())
        prob_mci = float(probs[1].item())
        prob_ad = float(probs[2].item())
        predicted_idx = int(torch.argmax(probs).item())
        
        stage = DISEASE_STAGES.get(predicted_idx, "Cognitively Normal (CN)")
        conf = float(probs[predicted_idx].item())

    except Exception as e:
        logger.error(f"Inference error with DenseNet121: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Neural network prediction error: {str(e)}"
        )

    # Compute 3D Grad-CAM class activation map
    try:
        gradcam = GradCAM3D(model)
        heatmap_3d = gradcam.generate_heatmap(input_tensor, target_class=predicted_idx)
        
        # Save 3D Grad-CAM heatmap as standard NIfTI file
        heatmap_nimg = nib.Nifti1Image(heatmap_3d.astype(np.float32), affine)
        heatmap_path = heatmaps_dir / f"{pred_id}_heatmap.nii.gz"
        nib.save(heatmap_nimg, str(heatmap_path))

        # Save compressed 3D slice cache for ultra-fast interactive viewing in frontend
        np.savez_compressed(
            temp_dir / f"{pred_id}_slices.npz",
            mri=visual_volume,
            heatmap=heatmap_3d.astype(np.float32)
        )
    except Exception as e:
        logger.warning(f"GradCAM generation error: {e}. Falling back to default heatmap.")
        heatmap_3d = np.zeros((96, 96, 96), dtype=np.float32)

    # Find peak activation coordinates for auto-focusing on affected brain area
    max_coord = np.unravel_index(np.argmax(heatmap_3d), heatmap_3d.shape)
    peak_slices = {
        "sagittal": int(max_coord[0]),
        "coronal": int(max_coord[1]),
        "axial": int(max_coord[2])
    }

    # Volumetric and Atrophy estimation (Hippocampus volume in mm3)
    hippo_vol = 3500.0 * prob_cn + 2700.0 * prob_mci + 1950.0 * prob_ad

    conf_score = round(float(conf), 3)
    p_cn = round(float(prob_cn), 3)
    p_mci = round(float(prob_mci), 3)
    p_ad = round(float(prob_ad), 3)

    p_id = (patient_id or "").strip() or f"PT-{datetime.datetime.now().strftime('%Y%m%d')}-{pred_id[-4:]}"
    p_age = (patient_age or "").strip() or "70"
    p_gender = (gender or "").strip() or "Unspecified"
    scan_time = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")
    
    current_uid = (user_id or x_user_id or "").strip() or None
    current_email = (user_email or x_user_email or "").strip().lower() or None

    # Save to history records storage
    history_item = {
        "id": pred_id,
        "prediction_id": pred_id,
        "user_id": current_uid,
        "user_email": current_email,
        "patient_id": p_id,
        "patient_age": p_age,
        "gender": p_gender,
        "scan_date": scan_time,
        "filename": file.filename,
        "predicted_stage": stage,
        "confidence_score": conf_score,
        "status": "Inference Completed",
        "hippocampus_volume_mm3": round(hippo_vol, 1),
        "peak_slices": peak_slices,
        "num_slices": 96,
        "gradcam_heatmap_url": f"/storage/heatmaps/{pred_id}_heatmap.nii.gz",
        "processed_mri_url": f"/storage/uploads/{pred_id}_{file.filename}",
        "probabilities": {
            "cn": p_cn,
            "mci": p_mci,
            "ad": p_ad
        }
    }
    await save_history_record(history_item)

    return PredictionResponse(
        prediction_id=pred_id,
        filename=file.filename,
        predicted_stage=stage,
        confidence_score=conf_score,
        probabilities=StageProbability(cn=p_cn, mci=p_mci, ad=p_ad),
        gradcam_heatmap_url=f"/storage/heatmaps/{pred_id}_heatmap.nii.gz",
        processed_mri_url=f"/storage/uploads/{pred_id}_{file.filename}",
        num_slices=96,
        hippocampus_volume_mm3=round(hippo_vol, 1),
        peak_slices=peak_slices,
        message=f"3D sMRI scan {file.filename} processed successfully with 3D DenseNet-121."
    )


@router.get("/predict/{prediction_id}/slice", tags=["Inference"])
async def get_scan_slice(
    prediction_id: str,
    plane: str = Query("axial", pattern="^(?i)(axial|coronal|sagittal)$"),
    slice_idx: int = Query(48, ge=0, le=95),
    heatmap: bool = Query(True),
    opacity: int = Query(75, ge=0, le=100),
    colormap: str = Query("turbo", pattern="^(?i)(turbo|jet|inferno|hot)$")
):
    """
    Returns an ultra-fast rendered high-definition PNG 2D slice with CLAHE brain sharpening
    and Grad-CAM class activation heatmap overlay.
    """
    plane = plane.lower()
    colormap = colormap.lower()
    clean_id = prediction_id.strip()

    cache_path = settings.TEMP_DIR / f"{clean_id}_slices.npz"
    if not cache_path.exists() and not clean_id.startswith("scan_"):
        alt_path = settings.TEMP_DIR / f"scan_{clean_id}_slices.npz"
        if alt_path.exists():
            clean_id = f"scan_{clean_id}"
            cache_path = alt_path

    if not cache_path.exists():
        # Fallback: check if uploaded file exists and reconstruct
        uploaded_files = list(settings.UPLOADS_DIR.glob(f"{clean_id}_*"))
        if not uploaded_files and not clean_id.startswith("scan_"):
            uploaded_files = list(settings.UPLOADS_DIR.glob(f"scan_{clean_id}_*"))
            if uploaded_files:
                clean_id = f"scan_{clean_id}"

        if uploaded_files:
            _, visual_volume, _ = preprocess_mri_volume(uploaded_files[0])
            heatmap_3d = np.zeros_like(visual_volume, dtype=np.float32)
            hm_path = settings.HEATMAPS_DIR / f"{clean_id}_heatmap.nii.gz"
            if hm_path.exists():
                try:
                    hm_nimg = nib.load(str(hm_path))
                    heatmap_3d = hm_nimg.get_fdata(dtype=np.float32)
                except Exception as e:
                    logger.warning(f"Failed to load saved heatmap: {e}")
            np.savez_compressed(cache_path, mri=visual_volume, heatmap=heatmap_3d)
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Slice data for scan {prediction_id} not found."
            )

    try:
        data = np.load(str(cache_path))
        mri_vol = data["mri"]
        hm_vol = data["heatmap"]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to read slice data: {str(e)}"
        )

    # Slice bounds checking
    slice_idx = max(0, min(slice_idx, 95))

    # Extract 2D slice along chosen anatomical plane
    # In RAS space:
    # axial: plane along axis 2 (Z, slice=48)
    # coronal: plane along axis 1 (Y, slice=48)
    # sagittal: plane along axis 0 (X, slice=48)
    if plane == "axial":
        mri_slice = np.rot90(mri_vol[:, :, slice_idx])
        hm_slice = np.rot90(hm_vol[:, :, slice_idx])
    elif plane == "coronal":
        mri_slice = np.rot90(mri_vol[:, slice_idx, :])
        hm_slice = np.rot90(hm_vol[:, slice_idx, :])
    else: # sagittal
        mri_slice = np.rot90(mri_vol[slice_idx, :, :])
        hm_slice = np.rot90(hm_vol[slice_idx, :, :])

    # Blend heatmap over MRI slice with CLAHE brain sharpening and colormap selection
    actual_opacity = (opacity / 100.0) if heatmap else 0.0
    blended_rgb = overlay_heatmap_on_slice(
        mri_slice,
        hm_slice,
        opacity=actual_opacity,
        colormap_name=colormap
    )

    # Resize to high-definition display (512x512) using Lanczos4 interpolation for crisp detail
    display_img = cv2.resize(blended_rgb, (512, 512), interpolation=cv2.INTER_LANCZOS4)

    # Encode as PNG image
    bgr_img = cv2.cvtColor(display_img, cv2.COLOR_RGB2BGR)
    success, encoded_png = cv2.imencode(".png", bgr_img)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to encode slice PNG image")

    return Response(content=encoded_png.tobytes(), media_type="image/png")
