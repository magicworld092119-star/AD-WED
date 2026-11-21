
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


# ============================================================
# CONFIGURATION
# ============================================================

DEFAULT_SPATIAL_SIZE = (96, 96, 96)

# Keep False unless this exact cleaning operation was also
# applied to the training dataset.
ENABLE_ARTIFACT_CLEANING = False


# ============================================================
# 1. LOAD NIFTI IMAGE
# ============================================================

def load_nifti_image(
    file_path: str | Path
) -> Tuple[np.ndarray, np.ndarray]:

    file_path = Path(file_path)

    if not file_path.exists():
        raise FileNotFoundError(
            f"MRI file not found: {file_path}"
        )

    nimg = nib.load(str(file_path))

    volume = nimg.get_fdata(dtype=np.float32)
    affine = nimg.affine

    # Handle 4D NIfTI volumes (e.g. multi-channel, multi-frame, or singleton 4th dimension)
    if volume.ndim == 4:
        if volume.shape[-1] == 1:
            volume = np.squeeze(volume, axis=-1)
        elif volume.shape[0] == 1:
            volume = np.squeeze(volume, axis=0)
        else:
            volume = volume[..., 0]

    if volume.ndim != 3:
        raise ValueError(
            f"Expected a 3D MRI volume, but received shape: {volume.shape}"
        )

    volume = np.nan_to_num(
        volume,
        nan=0.0,
        posinf=0.0,
        neginf=0.0
    )

    return volume, affine


# ============================================================
# 2. OPTIONAL ARTIFACT CLEANING
# ============================================================

def clean_artificial_label_artifacts(
    volume: np.ndarray
) -> np.ndarray:

    """
    Optional artifact cleaning.

    WARNING:
    This function should only be enabled if the same
    preprocessing was applied during model training.
    """

    volume = volume.copy()

    if volume.ndim == 4:
        volume = volume[..., 0]

    if volume.ndim != 3:
        return volume

    if not np.isfinite(volume).all():
        volume = np.nan_to_num(volume)

    # Do not automatically remove high-intensity voxels.
    # They may represent legitimate MRI tissue.

    return volume


# ============================================================
# 3. PREPROCESSING TRANSFORMS
# ============================================================

def get_preprocessing_transforms(
    spatial_size: tuple[int, int, int] = DEFAULT_SPATIAL_SIZE
) -> Compose:

    """
    MONAI preprocessing pipeline.

    IMPORTANT:
    These transforms must match the training pipeline.
    """

    return Compose([

        # Add channel dimension
        EnsureChannelFirst(
            channel_dim="no_channel"
        ),

        # Convert orientation to RAS
        Orientation(
            axcodes="RAS"
        ),

        # Resize or pad/crop to 96 x 96 x 96
        ResizeWithPadOrCrop(
            spatial_size=spatial_size
        ),

        # Normalize non-zero voxels
        NormalizeIntensity(
            nonzero=True,
            channel_wise=True
        ),

        # Convert to PyTorch tensor
        EnsureType(
            dtype=torch.float32
        )

    ])


# ============================================================
# 4. PREPROCESS MRI FOR MODEL INFERENCE
# ============================================================

def preprocess_mri_volume(
    file_path: str | Path,
    target_shape: tuple[int, int, int] = DEFAULT_SPATIAL_SIZE
) -> Tuple[torch.Tensor, np.ndarray, np.ndarray]:

    """
    Preprocess one MRI scan for 3D DenseNet121 inference.

    Returns:

        input_tensor:
            Shape = (1, 1, 96, 96, 96)
            Ready for DenseNet121.

        visual_volume:
            Shape = (96, 96, 96)
            uint8 volume for visualization.

        affine:
            Original NIfTI affine matrix.
    """

    # --------------------------------------------------------
    # STEP 1: LOAD MRI
    # --------------------------------------------------------

    raw_vol, affine = load_nifti_image(file_path)

    print("\n========== MRI PREPROCESSING ==========")

    print("File:", Path(file_path).name)
    print("Original shape:", raw_vol.shape)
    print("Original dtype:", raw_vol.dtype)

    print(
        "Original intensity range:",
        float(np.min(raw_vol)),
        "to",
        float(np.max(raw_vol))
    )

    # --------------------------------------------------------
    # STEP 2: OPTIONAL ARTIFACT CLEANING
    # --------------------------------------------------------

    if ENABLE_ARTIFACT_CLEANING:

        clean_vol = clean_artificial_label_artifacts(
            raw_vol
        )

    else:

        clean_vol = raw_vol.copy()

    clean_vol = np.nan_to_num(
        clean_vol,
        nan=0.0,
        posinf=0.0,
        neginf=0.0
    )

    # --------------------------------------------------------
    # STEP 3: CREATE METATENSOR
    # --------------------------------------------------------

    tensor_in = MetaTensor(
        clean_vol,
        affine=affine
    )

    # --------------------------------------------------------
    # STEP 4: APPLY MONAI TRANSFORMS
    # --------------------------------------------------------

    transforms = get_preprocessing_transforms(
        spatial_size=target_shape
    )

    tensor_volume = transforms(tensor_in)

    # Expected shape: (1, 96, 96, 96)

    if not isinstance(tensor_volume, torch.Tensor):
        tensor_volume = torch.as_tensor(
            tensor_volume,
            dtype=torch.float32
        )

    tensor_volume = tensor_volume.float()

    expected_shape = (1,) + tuple(target_shape)

    if tuple(tensor_volume.shape) != expected_shape:

        raise ValueError(
            f"Incorrect preprocessed shape: {tuple(tensor_volume.shape)}. "
            f"Expected: {expected_shape}"
        )

    if not torch.isfinite(tensor_volume).all():

        raise ValueError(
            "Preprocessed MRI contains NaN or infinite values."
        )

    # --------------------------------------------------------
    # STEP 5: CREATE VISUALIZATION VOLUME
    # --------------------------------------------------------

    vol_np = (
        tensor_volume[0]
        .detach()
        .cpu()
        .numpy()
    )

    non_zero = vol_np[vol_np != 0]

    if non_zero.size > 0:

        p1 = np.percentile(non_zero, 1)
        p99 = np.percentile(non_zero, 99.5)

    else:

        p1 = float(np.min(vol_np))
        p99 = float(np.max(vol_np))

    clipped = np.clip(
        vol_np,
        p1,
        p99
    )

    norm = (
        (clipped - p1) /
        (p99 - p1 + 1e-8)
    )

    visual_volume = (
        norm * 255.0
    ).astype(np.uint8)

    # --------------------------------------------------------
    # STEP 6: ADD BATCH DIMENSION
    # --------------------------------------------------------

    input_tensor = tensor_volume.unsqueeze(0)

    # Expected shape: (1, 1, 96, 96, 96)

    if input_tensor.ndim != 5:

        raise ValueError(
            f"Invalid model input dimensions: {input_tensor.shape}"
        )

    # --------------------------------------------------------
    # STEP 7: PRINT DIAGNOSTIC INFORMATION
    # --------------------------------------------------------

    print("Processed shape:", tensor_volume.shape)

    print("Final input shape:", input_tensor.shape)

    print(
        "Processed intensity range:",
        float(tensor_volume.min()),
        "to",
        float(tensor_volume.max())
    )

    print(
        "Mean intensity:",
        float(tensor_volume.mean())
    )

    print(
        "Standard deviation:",
        float(tensor_volume.std())
    )

    print("Visualization shape:", visual_volume.shape)

    print("Preprocessing completed successfully.")

    print("=======================================\n")

    return input_tensor, visual_volume, affine
