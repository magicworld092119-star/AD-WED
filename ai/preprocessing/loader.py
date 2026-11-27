"""
========================================================================================
3D MRI PREPROCESSING & NIFTI VOLUME STANDARDIZATION PIPELINE (AD-WEB)
========================================================================================
This module handles all preprocessing steps required to prepare raw 3D T1-weighted
brain MRI scans (NIfTI format `.nii` / `.nii.gz`) for inference with the 3D DenseNet-121 model.

Standardization Pipeline:
1. NIfTI Loading: Uses NiBabel to parse 3D/4D cranial volumes and retain spatial affine matrices.
2. 4D-to-3D Squeezing: Flattens multi-frame or singleton time-series volumes to 3D.
3. RAS Reorientation: Reorients brain volumes to standard Right-Anterior-Superior coordinates.
4. Resizing / Padding / Cropping: Standardizes all scans into uniform isotropic 96 x 96 x 96 voxels.
5. Intensity Normalization: Zero-mean unit-variance scaling on non-zero brain tissue.
6. Visualization Volume Generation: Creates a normalized uint8 [0, 255] volume for web rendering.
========================================================================================
"""

import nibabel as nib
import numpy as np
import torch
from pathlib import Path
from typing import Tuple

from monai.data import MetaTensor
from monai.transforms import (
    Compose,
    EnsureChannelFirst,
    Orientation,
    ResizeWithPadOrCrop,
    NormalizeIntensity,
    EnsureType
)

# ======================================================================================
# CONFIGURATION CONSTANTS
# ======================================================================================

# Target isotropic spatial dimensions expected by the trained 3D DenseNet-121
DEFAULT_SPATIAL_SIZE = (96, 96, 96)

# Set to True only if artificial edge cleaning was applied during training
ENABLE_ARTIFACT_CLEANING = False


# ======================================================================================
# 1. LOAD NIFTI IMAGE
# ======================================================================================

def load_nifti_image(
    file_path: str | Path
) -> Tuple[np.ndarray, np.ndarray]:
    """
    Loads a raw 3D or 4D NIfTI neuroimaging file from disk using NiBabel.

    Functionality:
    - Reads the voxel intensity array and affine coordinate transformation matrix.
    - Handles 4D volumes (e.g., fMRI or multi-channel scans) by squeezing singleton
      dimensions or extracting the first 3D structural frame.
    - Replaces NaNs, positive infinities, and negative infinities with 0.0.

    Args:
        file_path (str or Path): Path to the `.nii` or `.nii.gz` file.

    Returns:
        Tuple[np.ndarray, np.ndarray]:
            - volume: 3D float32 numpy array of brain intensities (D, H, W).
            - affine: 4x4 coordinate transformation matrix mapping voxel indices to millimeter space.
    """
    file_path = Path(file_path)

    if not file_path.exists():
        raise FileNotFoundError(f"MRI file not found: {file_path}")

    # Load NIfTI image proxy via NiBabel
    nimg = nib.load(str(file_path))

    # Extract voxel data as 32-bit floating point numbers
    volume = nimg.get_fdata(dtype=np.float32)
    affine = nimg.affine

    # -------------------------------------------------------------------------
    # Handle 4D NIfTI volumes (e.g. multi-channel, time-series, or singleton 4th dim)
    # -------------------------------------------------------------------------
    if volume.ndim == 4:
        if volume.shape[-1] == 1:
            volume = np.squeeze(volume, axis=-1)  # Remove trailing singleton
        elif volume.shape[0] == 1:
            volume = np.squeeze(volume, axis=0)   # Remove leading singleton
        else:
            volume = volume[..., 0]               # Select the first 3D structural frame

    if volume.ndim != 3:
        raise ValueError(f"Expected a 3D MRI volume, but received shape: {volume.shape}")

    # Sanitize invalid non-numerical values (NaNs and Infs)
    volume = np.nan_to_num(
        volume,
        nan=0.0,
        posinf=0.0,
        neginf=0.0
    )

    return volume, affine


# ======================================================================================
# 2. OPTIONAL ARTIFACT CLEANING
# ======================================================================================

def clean_artificial_label_artifacts(
    volume: np.ndarray
) -> np.ndarray:
    """
    Optional filter to suppress edge artifacts or scanner acquisition labels.
    
    Note: Disabled by default to preserve authentic native MRI tissue intensities.

    Args:
        volume (np.ndarray): 3D brain intensity array.

    Returns:
        np.ndarray: Cleaned 3D volume.
    """
    volume = volume.copy()

    if volume.ndim == 4:
        volume = volume[..., 0]

    if volume.ndim != 3:
        return volume

    if not np.isfinite(volume).all():
        volume = np.nan_to_num(volume)

    return volume


# ======================================================================================
# 3. PREPROCESSING TRANSFORMS (MONAI PIPELINE)
# ======================================================================================

def get_preprocessing_transforms(
    spatial_size: tuple[int, int, int] = DEFAULT_SPATIAL_SIZE
) -> Compose:
    """
    Constructs the standardized MONAI neuroimaging transformation pipeline.

    Sequential Operations:
    1. EnsureChannelFirst: Adds channel dimension (no_channel -> 1, D, H, W).
    2. Orientation("RAS"): Reorients spatial coordinate axes to Right-Anterior-Superior standard.
       This guarantees anatomical consistency across scans acquired from different MRI vendors (Siemens, GE, Philips).
    3. ResizeWithPadOrCrop: Center-crops or zero-pads the volume to exactly (96, 96, 96) voxels.
    4. NormalizeIntensity: Zero-mean, unit-variance intensity normalization applied exclusively to
       non-zero brain parenchyma voxels (ignoring background black space).
    5. EnsureType: Ensures tensor format is PyTorch float32.

    Args:
        spatial_size (tuple[int, int, int]): Target isotropic dimensions (default: 96, 96, 96).

    Returns:
        monai.transforms.Compose: Composed transformation pipeline.
    """
    return Compose([
        # 1. Add channel dimension: (D, H, W) -> (1, D, H, W)
        EnsureChannelFirst(channel_dim="no_channel"),

        # 2. Reorient spatial coordinates to standard neurological RAS orientation
        Orientation(axcodes="RAS"),

        # 3. Uniform spatial standardization via center cropping or symmetric padding
        ResizeWithPadOrCrop(spatial_size=spatial_size),

        # 4. Standardize intensity distribution on non-zero tissue: (x - mean) / std
        NormalizeIntensity(nonzero=True, channel_wise=True),

        # 5. Convert array to PyTorch FloatTensor
        EnsureType(dtype=torch.float32)
    ])


# ======================================================================================
# 4. PREPROCESS MRI FOR MODEL INFERENCE & VISUALIZATION
# ======================================================================================

def preprocess_mri_volume(
    file_path: str | Path,
    target_shape: tuple[int, int, int] = DEFAULT_SPATIAL_SIZE
) -> Tuple[torch.Tensor, np.ndarray, np.ndarray]:
    """
    Executes the full end-to-end preprocessing workflow on an uploaded MRI scan.

    Returns:
        Tuple containing:
        1. input_tensor (torch.Tensor):
           Shape = (1, 1, 96, 96, 96), dtype = float32.
           Normalized 5D batch tensor ready for 3D DenseNet-121 forward inference.
        2. visual_volume (np.ndarray):
           Shape = (96, 96, 96), dtype = uint8 (0 to 255).
           High-contrast volume ready for extracting 2D PNG slices in Axial, Coronal, and Sagittal planes.
        3. affine (np.ndarray):
           Original 4x4 coordinate affine matrix.
    """
    # -------------------------------------------------------------------------
    # STEP 1: Load NIfTI scan from disk
    # -------------------------------------------------------------------------
    raw_vol, affine = load_nifti_image(file_path)

    print("\n========== MRI PREPROCESSING PIPELINE ==========")
    print("File:", Path(file_path).name)
    print("Original shape:", raw_vol.shape)
    print("Original intensity range:", float(np.min(raw_vol)), "to", float(np.max(raw_vol)))

    # -------------------------------------------------------------------------
    # STEP 2: Optional artifact cleaning
    # -------------------------------------------------------------------------
    if ENABLE_ARTIFACT_CLEANING:
        clean_vol = clean_artificial_label_artifacts(raw_vol)
    else:
        clean_vol = raw_vol.copy()

    clean_vol = np.nan_to_num(clean_vol, nan=0.0, posinf=0.0, neginf=0.0)

    # -------------------------------------------------------------------------
    # STEP 3: Wrap volume in MONAI MetaTensor with original affine
    # -------------------------------------------------------------------------
    tensor_in = MetaTensor(clean_vol, affine=affine)

    # -------------------------------------------------------------------------
    # STEP 4: Apply MONAI transformations (RAS orientation, 96^3 crop/pad, normalization)
    # -------------------------------------------------------------------------
    transforms = get_preprocessing_transforms(spatial_size=target_shape)
    tensor_volume = transforms(tensor_in)

    if not isinstance(tensor_volume, torch.Tensor):
        tensor_volume = torch.as_tensor(tensor_volume, dtype=torch.float32)

    tensor_volume = tensor_volume.float()
    expected_shape = (1,) + tuple(target_shape)  # (1, 96, 96, 96)

    if tuple(tensor_volume.shape) != expected_shape:
        raise ValueError(
            f"Incorrect preprocessed shape: {tuple(tensor_volume.shape)}. "
            f"Expected: {expected_shape}"
        )

    if not torch.isfinite(tensor_volume).all():
        raise ValueError("Preprocessed MRI contains NaN or infinite values.")

    # -------------------------------------------------------------------------
    # STEP 5: Create uint8 visualization volume for web browser multi-slice display
    # -------------------------------------------------------------------------
    vol_np = tensor_volume[0].detach().cpu().numpy()
    non_zero = vol_np[vol_np != 0]

    # Percentile clipping (1st to 99.5th percentile) ensures optimal contrast for brain tissue
    if non_zero.size > 0:
        p1 = np.percentile(non_zero, 1)
        p99 = np.percentile(non_zero, 99.5)
    else:
        p1 = float(np.min(vol_np))
        p99 = float(np.max(vol_np))

    clipped = np.clip(vol_np, p1, p99)
    norm = (clipped - p1) / (p99 - p1 + 1e-8)
    visual_volume = (norm * 255.0).astype(np.uint8)

    # -------------------------------------------------------------------------
    # STEP 6: Add batch dimension for PyTorch model input
    # Shape transition: (1, 96, 96, 96) -> (1, 1, 96, 96, 96) [Batch, Channel, D, H, W]
    # -------------------------------------------------------------------------
    input_tensor = tensor_volume.unsqueeze(0)

    if input_tensor.ndim != 5:
        raise ValueError(f"Invalid model input dimensions: {input_tensor.shape}")

    # -------------------------------------------------------------------------
    # STEP 7: Print diagnostic summary
    # -------------------------------------------------------------------------
    print("Final Model Input Tensor shape:", input_tensor.shape)
    print("Visualization Volume shape:", visual_volume.shape)
    print("Normalized intensity range:", float(tensor_volume.min()), "to", float(tensor_volume.max()))
    print("Preprocessing completed successfully.")
    print("================================================\n")

    return input_tensor, visual_volume, affine
