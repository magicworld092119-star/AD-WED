import torch
import torch.nn as nn
from pathlib import Path
from typing import Optional
from monai.networks.nets import DenseNet121
from config.settings import settings
from loguru import logger

_CACHED_MODEL: Optional[nn.Module] = None
_CACHED_DEVICE: Optional[torch.device] = None

def get_device() -> torch.device:
    """
    Select best available compute device for 3D convolutions.
    Note: PyTorch MPS does not yet implement 3D convolution kernels ('aten::slow_conv3d_forward'),
    so CPU (or CUDA if available) is used. CPU execution takes <0.5s per volume.
    """
    if torch.cuda.is_available():
        return torch.device("cuda")
    return torch.device("cpu")

def get_model(model_name: Optional[str] = None, device: Optional[torch.device] = None) -> tuple[nn.Module, torch.device]:
    """
    Retrieve cached 3D DenseNet-121 model or load from disk.
    Matches trained MONAI 3D DenseNet121 architecture (CN, MCI, AD).
    """
    global _CACHED_MODEL, _CACHED_DEVICE

    if device is None:
        device = get_device()

    if _CACHED_MODEL is not None and _CACHED_DEVICE == device:
        return _CACHED_MODEL, _CACHED_DEVICE

    target_name = model_name or settings.DEFAULT_MODEL_NAME
    model_path = settings.MODEL_DIR / target_name

    if not model_path.exists():
        raise FileNotFoundError(
            f"Trained model checkpoint not found at {model_path}. "
            f"Please ensure {target_name} exists in {settings.MODEL_DIR}."
        )

    logger.info(f"Loading 3D DenseNet-121 model from: {model_path} onto {device}...")

    # Instantiate MONAI DenseNet121 (spatial_dims=3, in_channels=1, out_channels=3)
    model = DenseNet121(
        spatial_dims=3,
        in_channels=1,
        out_channels=3,
    )

    checkpoint = torch.load(str(model_path), map_location=device)

    # Load weights
    if isinstance(checkpoint, dict) and "state_dict" in checkpoint:
        state_dict = checkpoint["state_dict"]
    elif isinstance(checkpoint, dict):
        state_dict = checkpoint
    else:
        state_dict = checkpoint.state_dict()

    # Clean potential prefix if saved from DataParallel/DistributedDataParallel
    clean_state_dict = {}
    for k, v in state_dict.items():
        clean_key = k[7:] if k.startswith("module.") else k
        clean_state_dict[clean_key] = v

    missing_keys, unexpected_keys = model.load_state_dict(clean_state_dict, strict=False)
    if missing_keys:
        logger.warning(f"DenseNet121 missing keys: {missing_keys[:5]} (total {len(missing_keys)})")
    if unexpected_keys:
        logger.warning(f"DenseNet121 unexpected keys: {unexpected_keys[:5]} (total {len(unexpected_keys)})")

    model.to(device)
    model.eval()

    _CACHED_MODEL = model
    _CACHED_DEVICE = device
    logger.info("3D DenseNet-121 model loaded successfully.")

    return _CACHED_MODEL, _CACHED_DEVICE
