"""
========================================================================================
3D MODEL LOADER & WEIGHT EXTRACTION SERVICE (AD-WEB)
========================================================================================
This module is responsible for initializing, loading, and managing the 3D DenseNet-121
neural network weights for Alzheimer's disease staging.

Key Responsibilities:
1. get_model: Loads the trained PyTorch checkpoint, cleans DataParallel prefixes,
   verifies architecture compatibility, sets evaluation mode, and caches the model in memory.
2. get_device: Automatically detects hardware acceleration (NVIDIA CUDA GPU vs. CPU).
3. get_output_layer: Locates the terminal Linear classification layer across varying DenseNet wrappers.
4. get_classifier_weights: Extracts connection weights for target classes, enabling instant
   weight-based Class Activation Mapping (CAM) without backpropagation.
5. get_feature_extractor: Extracts the 3D convolutional backbone for intermediate feature map inspection.
========================================================================================
"""

import torch
import torch.nn as nn
from pathlib import Path
from typing import Optional
from monai.networks.nets import DenseNet121
from config.settings import settings
from loguru import logger

# Global in-memory cache to avoid re-reading large .pth weight files from disk on every HTTP request
_CACHED_MODEL: Optional[nn.Module] = None
_CACHED_DEVICE: Optional[torch.device] = None
_CACHED_PATH: Optional[Path] = None


def get_output_layer(model: nn.Module) -> nn.Linear:
    """
    Introspects the neural network to locate the final Linear classification layer.
    
    Why this is needed:
        Different libraries wrap classification layers under different attributes:
        - MONAI DenseNet121 uses: `model.class_layers.out`
        - Standard PyTorch torchvision models use: `model.classifier` or `model.fc`
        This function dynamically resolves the correct layer regardless of wrapper.

    Args:
        model (nn.Module): The 3D classification model.

    Returns:
        nn.Linear: The terminal fully-connected layer.
    """
    # 1. Check standard MONAI DenseNet classification head
    if hasattr(model, "class_layers") and hasattr(model.class_layers, "out"):
        return model.class_layers.out
    
    # 2. Check standard torchvision fully-connected attribute (fc)
    if hasattr(model, "fc") and isinstance(model.fc, nn.Linear):
        return model.fc
        
    # 3. Check classifier attribute (single Linear or Sequential of Linear layers)
    if hasattr(model, "classifier"):
        if isinstance(model.classifier, nn.Linear):
            return model.classifier
        if isinstance(model.classifier, nn.Sequential):
            for layer in reversed(model.classifier):
                if isinstance(layer, nn.Linear):
                    return layer
                    
    # 4. Fallback: Search all model modules in reverse to find the last Linear layer
    for module in reversed(list(model.modules())):
        if isinstance(module, nn.Linear):
            return module
            
    raise AttributeError("Could not identify the final linear classification layer in the model.")


def get_classifier_weights(model: nn.Module, target_class: int) -> torch.Tensor:
    """
    Extracts the weight vector of the output layer corresponding to a specific target class.
    
    Shape: (in_features,) e.g., (1024,) for DenseNet-121.
    
    Used by: Weight-Based Class Activation Mapping (CAM) to compute feature channel importance
    directly without requiring a backward gradient pass.

    Args:
        model (nn.Module): The classification network.
        target_class (int): Index of the target stage (0: CN, 1: MCI, 2: AD).

    Returns:
        torch.Tensor: Detached 1D weight vector for the chosen class.
    """
    out_linear = get_output_layer(model)
    return out_linear.weight[target_class].detach().clone()


def get_feature_extractor(model: nn.Module) -> nn.Module:
    """
    Returns the submodule responsible for extracting 3D convolutional feature maps.
    
    For DenseNet-121:
        Returns `model.features`, which contains all 4 dense blocks and transition layers,
        prior to Global Average Pooling.

    Args:
        model (nn.Module): The classification network.

    Returns:
        nn.Module: The 3D convolutional feature extractor backbone.
    """
    if hasattr(model, "features"):
        return model.features
    if hasattr(model, "backbone"):
        return model.backbone
    raise AttributeError("Could not identify the feature extraction backbone in the model.")


def get_device() -> torch.device:
    """
    Detects and returns the best available computing device.
    Prioritizes NVIDIA CUDA GPU for accelerated 3D tensor math; falls back to CPU.

    Returns:
        torch.device: 'cuda' or 'cpu'.
    """
    if torch.cuda.is_available():
        return torch.device("cuda")
    return torch.device("cpu")


def get_model(
    model_name: Optional[str] = None,
    device: Optional[torch.device] = None
) -> tuple[nn.Module, torch.device]:
    """
    Loads and caches the 3D DenseNet-121 model.
    
    Loading Procedure:
    ------------------
    1. Memory Cache Check: If model is already loaded on the requested device, returns it instantly.
    2. Architecture Construction: Builds a 3D DenseNet-121 with:
           - spatial_dims = 3 (volumetric D x H x W)
           - in_channels  = 1 (single-channel grayscale sMRI)
           - out_channels = 3 (CN, MCI, AD)
    3. Checkpoint Parsing: Safely reads `.pth` file and extracts weights from dictionary keys
       ('state_dict', 'model_state_dict', etc.).
    4. Key Sanitization: Strips 'module.' prefix caused by PyTorch torch.nn.DataParallel multi-GPU training.
    5. Strict Weight Assignment: Loads state dictionary with strict=True to prevent mismatched weights.
    6. Evaluation Mode: Sets model.eval() to disable dropout and lock batch normalization running statistics.

    Args:
        model_name (str, optional): Filename of the checkpoint (defaults to settings.DEFAULT_MODEL_NAME).
        device (torch.device, optional): Target hardware device.

    Returns:
        tuple[nn.Module, torch.device]: (model, device) ready for inference.
    """
    global _CACHED_MODEL, _CACHED_DEVICE, _CACHED_PATH

    # Resolve hardware execution device
    if device is None:
        device = get_device()

    # Resolve checkpoint absolute file path
    target_name = model_name or settings.DEFAULT_MODEL_NAME
    model_path = (settings.MODEL_DIR / target_name).resolve()

    if not model_path.exists():
        raise FileNotFoundError(f"Checkpoint not found: {model_path}")

    # Return cached singleton instance if available on the same device and path
    if (
        _CACHED_MODEL is not None
        and _CACHED_DEVICE == device
        and _CACHED_PATH == model_path
    ):
        return _CACHED_MODEL, _CACHED_DEVICE

    logger.info(f"Loading model checkpoint from disk: {model_path}")

    # Step 1: Instantiate empty 3D DenseNet-121 architecture
    model = DenseNet121(
        spatial_dims=3,
        in_channels=1,
        out_channels=3
    )

    # Step 2: Load binary checkpoint file
    checkpoint = torch.load(
        str(model_path),
        map_location=device,
        weights_only=True
    )

    # Step 3: Extract state_dict from dictionary if wrapped
    if isinstance(checkpoint, dict):
        possible_keys = [
            "state_dict",
            "model_state_dict",
            "model",
            "weights"
        ]

        state_dict = None
        for key in possible_keys:
            if key in checkpoint and isinstance(checkpoint[key], dict):
                state_dict = checkpoint[key]
                logger.info(f"Found model weights under key: '{key}'")
                break

        # Check whether checkpoint itself is a flat state_dict mapping
        if state_dict is None:
            if all(torch.is_tensor(v) for v in checkpoint.values()):
                state_dict = checkpoint
            else:
                raise ValueError(
                    f"Could not identify model weights in checkpoint. "
                    f"Available keys: {list(checkpoint.keys())}"
                )
    else:
        raise ValueError("Unsupported checkpoint format: expected dictionary or state_dict.")

    # Step 4: Sanitize keys: remove 'module.' prefix added during multi-GPU DataParallel training
    clean_state_dict = {}
    for key, value in state_dict.items():
        clean_key = key.replace("module.", "", 1) if key.startswith("module.") else key
        clean_state_dict[clean_key] = value

    # Step 5: Assign weights strictly to guarantee architectural integrity
    model.load_state_dict(clean_state_dict, strict=True)

    # Step 6: Transfer to target device and lock in evaluation mode
    model.to(device)
    model.eval()

    # Update in-memory singleton cache
    _CACHED_MODEL = model
    _CACHED_DEVICE = device
    _CACHED_PATH = model_path

    logger.info("All trained weights loaded successfully into memory.")
    logger.info(f"Model executing on device: {device}")
    logger.info(f"Active checkpoint: {model_path}")

    return model, device
