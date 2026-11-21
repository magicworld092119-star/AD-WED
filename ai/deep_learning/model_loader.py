
import torch
import torch.nn as nn

from pathlib import Path
from typing import Optional
from monai.networks.nets import DenseNet121
from config.settings import settings
from loguru import logger

_CACHED_MODEL: Optional[nn.Module] = None
_CACHED_DEVICE: Optional[torch.device] = None
_CACHED_PATH: Optional[Path] = None


def get_output_layer(model: nn.Module) -> nn.Linear:
    """
    Introspects the model to locate the final Linear classification layer.
    """
    if hasattr(model, "class_layers") and hasattr(model.class_layers, "out"):
        return model.class_layers.out
    if hasattr(model, "fc") and isinstance(model.fc, nn.Linear):
        return model.fc
    if hasattr(model, "classifier"):
        if isinstance(model.classifier, nn.Linear):
            return model.classifier
        if isinstance(model.classifier, nn.Sequential):
            for layer in reversed(model.classifier):
                if isinstance(layer, nn.Linear):
                    return layer
    for module in reversed(list(model.modules())):
        if isinstance(module, nn.Linear):
            return module
    raise AttributeError("Could not identify the final linear classification layer in the model.")


def get_classifier_weights(model: nn.Module, target_class: int) -> torch.Tensor:
    """
    Extracts the weight vector of the output layer corresponding to target_class.
    Shape: (in_features,)
    """
    out_linear = get_output_layer(model)
    return out_linear.weight[target_class].detach().clone()


def get_feature_extractor(model: nn.Module) -> nn.Module:
    """
    Returns the submodule responsible for extracting 3D convolutional feature maps.
    """
    if hasattr(model, "features"):
        return model.features
    if hasattr(model, "backbone"):
        return model.backbone
    raise AttributeError("Could not identify the feature extraction backbone in the model.")


def get_device() -> torch.device:
    if torch.cuda.is_available():
        return torch.device("cuda")
    return torch.device("cpu")


def get_model(
    model_name: Optional[str] = None,
    device: Optional[torch.device] = None
) -> tuple[nn.Module, torch.device]:

    global _CACHED_MODEL, _CACHED_DEVICE, _CACHED_PATH

    if device is None:
        device = get_device()

    target_name = model_name or settings.DEFAULT_MODEL_NAME
    model_path = (settings.MODEL_DIR / target_name).resolve()

    if not model_path.exists():
        raise FileNotFoundError(f"Checkpoint not found: {model_path}")

    # Return cached model only if path AND device match
    if (
        _CACHED_MODEL is not None
        and _CACHED_DEVICE == device
        and _CACHED_PATH == model_path
    ):
        return _CACHED_MODEL, _CACHED_DEVICE

    logger.info(f"Loading model: {model_path}")

    model = DenseNet121(
        spatial_dims=3,
        in_channels=1,
        out_channels=3
    )

    checkpoint = torch.load(
        str(model_path),
        map_location=device,
        weights_only=True
    )

    # Extract trained weights from common checkpoint formats
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
                logger.info(f"Found model weights under key: {key}")
                break

        # Check whether checkpoint itself is a raw state_dict
        if state_dict is None:
            if all(torch.is_tensor(v) for v in checkpoint.values()):
                state_dict = checkpoint
            else:
                raise ValueError(
                    f"Could not identify model weights in checkpoint. "
                    f"Available keys: {list(checkpoint.keys())}"
                )

    else:
        raise ValueError("Unsupported checkpoint format.")

    # Remove DataParallel prefix if present
    clean_state_dict = {}

    for key, value in state_dict.items():
        clean_key = key.replace("module.", "", 1) if key.startswith("module.") else key
        clean_state_dict[clean_key] = value

    # IMPORTANT: Fail if the checkpoint doesn't match the architecture
    model.load_state_dict(clean_state_dict, strict=True)

    model.to(device)
    model.eval()

    _CACHED_MODEL = model
    _CACHED_DEVICE = device
    _CACHED_PATH = model_path

    logger.info("All trained weights loaded successfully.")
    logger.info(f"Model device: {device}")
    logger.info(f"Model checkpoint: {model_path}")

    return model, device
