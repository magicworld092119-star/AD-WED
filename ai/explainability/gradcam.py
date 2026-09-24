import torch
import torch.nn as nn
import torch.nn.functional as F
import numpy as np
import cv2
from typing import Optional, Union

class GradCAM3D:
    """
    Enhanced 3D Grad-CAM implementation for 3D DenseNet-121.
    Generates class activation heatmaps clearly highlighting affected atrophy/disease brain regions.
    """
    def __init__(self, model: nn.Module, target_layer: Optional[Union[nn.Module, str]] = None):
        self.model = model
        
        # If target layer is not explicitly provided, default to last convolutional denseblock in DenseNet
        if target_layer is None or target_layer == "features.denseblock4":
            if hasattr(model, "features") and hasattr(model.features, "denseblock4"):
                self.target_layer = model.features.denseblock4
            else:
                conv_layers = [m for m in model.modules() if isinstance(m, (nn.Conv3d, nn.Sequential))]
                self.target_layer = conv_layers[-1]
        elif isinstance(target_layer, str):
            curr = model
            for part in target_layer.split("."):
                curr = getattr(curr, part)
            self.target_layer = curr
        else:
            self.target_layer = target_layer

        self.gradients = None
        self.activations = None
        self.hook_handles = []

    def _register_hooks(self):
        self._remove_hooks()

        def forward_hook(module, input, output):
            self.activations = output

        def backward_hook(module, grad_in, grad_out):
            self.gradients = grad_out[0]

        h1 = self.target_layer.register_forward_hook(forward_hook)
        h2 = self.target_layer.register_full_backward_hook(backward_hook)
        self.hook_handles.extend([h1, h2])

    def _remove_hooks(self):
        for h in self.hook_handles:
            h.remove()
        self.hook_handles.clear()

    def generate_heatmap(
        self,
        input_tensor: torch.Tensor,
        target_class: Optional[int] = None
    ) -> np.ndarray:
        """
        Computes 3D Grad-CAM class activation map with enhanced contrast.
        """
        self._register_hooks()
        try:
            self.model.eval()
            
            if not input_tensor.requires_grad:
                input_tensor = input_tensor.clone().detach().requires_grad_(True)
                
            output = self.model(input_tensor)
            
            if target_class is None:
                target_class = torch.argmax(output, dim=1).item()
                
            self.model.zero_grad()
            score = output[0, target_class]
            score.backward(retain_graph=True)
            
            if self.gradients is None or self.activations is None:
                raise RuntimeError("Failed to capture gradients or activations during GradCAM backward pass.")

            # Global average pooling of gradients along spatial dimensions (D, H, W)
            weights = torch.mean(self.gradients, dim=(2, 3, 4), keepdim=True)
            
            # Weighted combination of forward activation maps
            cam = torch.sum(weights * self.activations, dim=1, keepdim=True)
            cam = F.relu(cam)
            
            # Trilinear interpolation upsample to match input 3D volume dimensions
            spatial_size = input_tensor.shape[2:]
            cam = F.interpolate(cam, size=spatial_size, mode="trilinear", align_corners=False)
            
            cam_np = cam.squeeze().detach().cpu().numpy()
            
            # Robust percentile normalization to bring out affected areas clearly
            pmin = np.min(cam_np)
            p99 = np.percentile(cam_np, 99.5)
            if p99 > pmin + 1e-6:
                cam_norm = np.clip((cam_np - pmin) / (p99 - pmin), 0.0, 1.0)
            else:
                cam_norm = cam_np - pmin

            # Gamma contrast adjustment so affected regions glow vividly
            cam_enhanced = np.power(cam_norm, 0.75)
            
            return cam_enhanced.astype(np.float32)
        finally:
            self._remove_hooks()


def overlay_heatmap_on_slice(
    mri_slice: np.ndarray,
    heatmap_slice: np.ndarray,
    opacity: float = 0.75,
    colormap_name: str = "turbo"
) -> np.ndarray:
    """
    Overlays a 2D Grad-CAM heatmap onto a 2D MRI grayscale slice with CLAHE brain sharpening.
    
    Args:
        mri_slice: 2D numpy array uint8 (0-255)
        heatmap_slice: 2D numpy array float (0.0-1.0)
        opacity: Heatmap blending alpha factor (0.0 to 1.0)
        colormap_name: 'turbo' (default modern rainbow), 'jet', 'inferno', 'hot'
        
    Returns:
        RGB uint8 image of shape (H, W, 3) ready for PNG encoding.
    """
    # 1. Normalize and sharpen MRI slice using CLAHE
    if mri_slice.dtype != np.uint8:
        pmin, pmax = np.percentile(mri_slice, 1), np.percentile(mri_slice, 99.5)
        mri_slice = np.clip(mri_slice, pmin, pmax)
        mri_slice = ((mri_slice - pmin) / (pmax - pmin + 1e-8) * 255.0).astype(np.uint8)

    # Enhance structural brain contrast (sulci, gyri, ventricles)
    clahe = cv2.createCLAHE(clipLimit=2.2, tileGridSize=(8, 8))
    mri_sharpened = clahe.apply(mri_slice)
    mri_rgb = cv2.cvtColor(mri_sharpened, cv2.COLOR_GRAY2RGB)

    if opacity <= 0.02:
        return mri_rgb

    # 2. Resize heatmap slice if shapes differ
    if heatmap_slice.shape != mri_slice.shape:
        heatmap_slice = cv2.resize(
            heatmap_slice,
            (mri_slice.shape[1], mri_slice.shape[0]),
            interpolation=cv2.INTER_CUBIC
        )

    # 3. Resolve colormap
    colormaps = {
        "turbo": cv2.COLORMAP_TURBO,
        "jet": cv2.COLORMAP_JET,
        "inferno": cv2.COLORMAP_INFERNO,
        "hot": cv2.COLORMAP_HOT
    }
    cmap = colormaps.get(colormap_name.lower(), cv2.COLORMAP_TURBO)

    hm_norm = np.clip(heatmap_slice, 0.0, 1.0)

    # 4. Only highlight areas with meaningful activation on brain tissue (exclude air/background)
    brain_mask = (mri_slice > 15)
    activation_threshold = 0.25
    active_mask = brain_mask & (hm_norm > activation_threshold)

    blended = mri_rgb.copy()
    if np.any(active_mask):
        # Scale active range to [0, 1] so the entire colormap spectrum highlights the affected area
        hm_active = np.zeros_like(hm_norm)
        hm_active[active_mask] = (hm_norm[active_mask] - activation_threshold) / (1.0 - activation_threshold)
        hm_uint8 = (hm_active * 255.0).astype(np.uint8)

        heatmap_colored = cv2.applyColorMap(hm_uint8, cmap)
        heatmap_rgb = cv2.cvtColor(heatmap_colored, cv2.COLOR_BGR2RGB)

        # Alpha blend proportional to activation intensity and user opacity slider
        alpha = (hm_active[:, :, np.newaxis] * float(np.clip(opacity, 0.0, 1.0)))
        blended[active_mask] = (
            alpha[active_mask] * heatmap_rgb[active_mask] + (1.0 - alpha[active_mask]) * mri_rgb[active_mask]
        ).astype(np.uint8)

    return blended
