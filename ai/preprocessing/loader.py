import nibabel as nib
import numpy as np
import torch
import scipy.ndimage as ndi
from pathlib import Path
from typing import Tuple
from monai.transforms import (
    Compose,
    LoadImage,
    EnsureChannelFirst,
    Orientation,
    ResizeWithPadOrCrop,
    NormalizeIntensity,
    EnsureType
)

def load_nifti_image(file_path: str | Path) -> Tuple[np.ndarray, np.ndarray]:
    """
    Load 3D structural MRI NIfTI scan (.nii or .nii.gz) using NiBabel.
    Returns voxel volume array and 4x4 affine matrix.
    """
    nimg = nib.load(str(file_path))
    volume = nimg.get_fdata(dtype=np.float32)
    affine = nimg.affine
    return volume, affine

def clean_artificial_label_artifacts(volume: np.ndarray) -> np.ndarray:
    """
    Detects and inpaints burned-in artificial marker labels (such as the white 'L' and 'R'
    orientation text markers present in MNI templates like avg152T1_LR_nifti.nii).
    """
    v_max = np.max(volume)
    if v_max <= 0:
        return volume

    sat_count = np.count_nonzero(volume >= 240.0)
    
    # If substantial saturated voxels exist inside brain tissue (typical for burned-in LR labels)
    if 500 < sat_count < 250000:
        # Estimate real brain tissue 99th percentile excluding artificial markers
        real_brain = volume[(volume > 10) & (volume < 200)]
        if len(real_brain) > 0:
            tissue_p99 = np.percentile(real_brain, 99)
        else:
            tissue_p99 = 185.0
            
        label_mask = (volume >= tissue_p99)
        # Dilate label mask by 2 voxels to eliminate all edge anti-aliasing
        label_mask = ndi.binary_dilation(label_mask, iterations=2)
        indices = ndi.distance_transform_edt(label_mask, return_distances=False, return_indices=True)
        cleaned = volume[tuple(indices)]
        return cleaned

    return volume

def get_preprocessing_transforms(spatial_size: tuple[int, int, int] = (96, 96, 96)) -> Compose:
    """
    Returns the exact preprocessing pipeline used to train best_densenet121_3d.pth.
    """
    return Compose([
        EnsureChannelFirst(channel_dim="no_channel"),
        Orientation(axcodes="RAS"),
        ResizeWithPadOrCrop(spatial_size=spatial_size),
        NormalizeIntensity(nonzero=True, channel_wise=True),
        EnsureType()
    ])

def preprocess_mri_volume(
    file_path: str | Path,
    target_shape: tuple[int, int, int] = (96, 96, 96)
) -> Tuple[torch.Tensor, np.ndarray, np.ndarray]:
    """
    Preprocess NIfTI MRI scan for model inference and high-definition visualization.
    
    Returns:
        - input_tensor: torch.Tensor of shape (1, 1, D, H, W) for DenseNet-121
        - visual_volume: np.ndarray uint8 of shape (D, H, W) normalized to [0, 255] with artifact removal
        - affine: 4x4 affine transformation matrix
    """
    from monai.data import MetaTensor

    nimg = nib.load(str(file_path))
    affine = nimg.affine
    raw_vol = nimg.get_fdata(dtype=np.float32)

    # 1. Clean artificial burned-in text labels (such as MNI 'L'/'R' markers)
    clean_vol = clean_artificial_label_artifacts(raw_vol)
    clean_vol = np.nan_to_num(clean_vol, nan=0.0, posinf=0.0, neginf=0.0)

    # 2. Prepare PyTorch MetaTensor with affine for MONAI pipeline
    tensor_in = MetaTensor(clean_vol, affine=affine)
    
    # Apply MONAI transforms
    transforms = get_preprocessing_transforms(spatial_size=target_shape)
    tensor_volume = transforms(tensor_in) # shape: (1, 96, 96, 96)

    # 3. Create high-contrast visualization volume (0-255 uint8)
    vol_np = tensor_volume[0].detach().cpu().numpy()
    non_zero = vol_np[vol_np > 0]
    if len(non_zero) > 0:
        p1 = np.percentile(non_zero, 1)
        p99 = np.percentile(non_zero, 99.5)
    else:
        p1, p99 = np.min(vol_np), np.max(vol_np)

    clipped = np.clip(vol_np, p1, p99)
    norm = (clipped - p1) / (p99 - p1 + 1e-8)
    visual_volume = (norm * 255.0).astype(np.uint8)

    input_tensor = tensor_volume.unsqueeze(0) # shape: (1, 1, 96, 96, 96)
    return input_tensor, visual_volume, affine
