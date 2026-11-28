"""
========================================================================================
3D GRAD-CAM & VOLUMETRIC EXPLAINABILITY MODULE FOR ALZHEIMER'S DISEASE STAGING (AD-WEB)
========================================================================================
This module provides Explainable AI (XAI) capabilities for 3D brain MRI volumes.
It produces 3D attribution heatmaps highlighting the exact anatomical brain regions 
(such as the hippocampus, medial temporal lobe, and lateral ventricles) that lead the
model to classify a scan as:
    - Cognitively Normal (CN)
    - Mild Cognitive Impairment (MCI)
    - Alzheimer's Disease (AD)

Key Capabilities:
1. GradCAM3D: Computes 3D gradient-weighted class activation maps across depth, height, and width.
2. Weight-Based CAM: Fast feed-forward activation map using classifier weights without backprop.
3. overlay_heatmap_on_slice: Slices the 3D heatmap and overlays it onto 2D MRI cross-sections
   with CLAHE contrast enhancement, tissue masking, and colormap blending (Turbo / Jet).
========================================================================================
"""

import torch
import torch.nn as nn
import torch.nn.functional as F
import numpy as np
import cv2
from typing import Optional, Union


class GradCAM3D:
    """
    Volumetric 3D Gradient-weighted Class Activation Mapping (Grad-CAM).
    
    Mathematical Formulation:
    -------------------------
    1. Gradients of output score y_c with respect to feature maps A^k are captured:
           d(y_c) / d(A^k_{d, h, w})
    2. Importance weights alpha_k^c are computed via 3D Global Average Pooling:
           alpha_k^c = (1 / Z) * sum_d sum_h sum_w [ d(y_c) / d(A^k_{d, h, w}) ]
    3. Weighted linear combination followed by ReLU activation:
           L_GradCAM^c = ReLU( sum_k alpha_k^c * A^k )
    4. Trilinear upsampling expands the lower-resolution feature maps back to (96, 96, 96).
    """

    def __init__(
        self,
        model: nn.Module,
        target_layer: Optional[Union[nn.Module, str]] = None
    ):
        """
        Initializes the 3D Grad-CAM generator.

        Args:
            model (nn.Module): The trained 3D DenseNet-121 classification model.
            target_layer (nn.Module or str, optional): The convolutional layer from which
                activations and gradients will be captured. Defaults to the terminal dense block
                ('features.denseblock4') which holds the highest-level semantic representations.
        """
        self.model = model
        
        # -------------------------------------------------------------------------
        # Identify Target Convolutional Layer
        # DenseNet-121 has 4 dense blocks; denseblock4 is the last and most informative.
        # -------------------------------------------------------------------------
        if target_layer is None or target_layer == "features.denseblock4":
            if hasattr(model, "features") and hasattr(model.features, "denseblock4"):
                self.target_layer = model.features.denseblock4
            else:
                # Fallback: Locate the last Conv3D or Sequential layer in the model
                conv_layers = [m for m in model.modules() if isinstance(m, (nn.Conv3d, nn.Sequential))]
                self.target_layer = conv_layers[-1]
        elif isinstance(target_layer, str):
            # Parse dot-separated string layer paths (e.g. 'features.denseblock4')
            curr = model
            for part in target_layer.split("."):
                curr = getattr(curr, part)
            self.target_layer = curr
        else:
            self.target_layer = target_layer

        # Storage buffers for captured forward activations and backward gradients
        self.gradients = None
        self.activations = None
        self.hook_handles = []

    def _register_hooks(self):
        """
        Registers PyTorch forward and backward hooks on the target convolutional layer.
        - Forward hook: captures feature map activations (A^k) during forward inference.
        - Backward hook: captures output gradients (d(y_c)/dA^k) during backpropagation.
        """
        self._remove_hooks()

        def forward_hook(module, input, output):
            # Save a detached clone of the layer's output activations
            self.activations = output.detach().clone()

        def backward_hook(module, grad_in, grad_out):
            # Save a detached clone of incoming gradients flowing back through this layer
            self.gradients = grad_out[0].detach().clone()

        # Attach hooks to target layer and store handles so they can be cleanly deregistered
        h1 = self.target_layer.register_forward_hook(forward_hook)
        h2 = self.target_layer.register_full_backward_hook(backward_hook)
        self.hook_handles.extend([h1, h2])

    def _remove_hooks(self):
        """
        Removes all registered hooks to avoid GPU memory leaks and unwanted side effects.
        """
        for h in self.hook_handles:
            h.remove()
        self.hook_handles.clear()

    def generate_cam_from_weights(
        self,
        input_tensor: torch.Tensor,
        target_class: int
    ) -> np.ndarray:
        """
        Computes 3D Class Activation Map (CAM) directly using output layer linear weights.
        
        Formula:
            CAM_c(x, y, z) = ReLU( sum_k [ w_{c, k} * A_k(x, y, z) ] )
            
        Why this is useful:
            - Avoids backpropagation overhead entirely (10x faster than standard Grad-CAM).
            - Perfectly suited for low-latency web inference environments.
            - Uses the exact connection weights from the final classification neuron.

        Args:
            input_tensor (torch.Tensor): 5D input tensor of shape (1, 1, D, H, W).
            target_class (int): Integer class index (0: CN, 1: MCI, 2: AD).

        Returns:
            np.ndarray: Normalized 3D activation array of shape (D, H, W) in range [0.0, 1.0].
        """
        self.model.eval()
        device = input_tensor.device
        
        from ai.deep_learning.model_loader import get_output_layer, get_feature_extractor
        
        # 1. Extract classification weights for the target diagnostic class
        out_layer = get_output_layer(self.model)
        class_weights = out_layer.weight[target_class].detach().to(device)

        with torch.no_grad():
            # 2. Extract 3D feature maps from the convolutional backbone
            feat_extractor = get_feature_extractor(self.model)
            feature_maps = feat_extractor(input_tensor)
            feature_maps = F.relu(feature_maps)
            
            # 3. Linearly combine feature maps weighted by the class-specific output weights
            # Reshape weights from (C,) to (1, C, 1, 1, 1) for broadcasting across 3D space
            w = class_weights.view(1, -1, 1, 1, 1)
            cam = torch.sum(w * feature_maps, dim=1, keepdim=True)
            cam = F.relu(cam)  # Suppress negative contributions
            
            # 4. Trilinear upsampling: expand low-res CAM back to original volume shape (96, 96, 96)
            spatial_size = input_tensor.shape[2:]
            cam_up = F.interpolate(cam, size=spatial_size, mode="trilinear", align_corners=False)
            cam_np = cam_up.squeeze().cpu().numpy()

        # 5. Robust percentile normalization: scale values to [0.0, 1.0] while ignoring extreme outliers
        p99 = np.percentile(cam_np, 99.5)
        if p99 > 1e-6:
            cam_norm = np.clip(cam_np / p99, 0.0, 1.0)
        else:
            cam_norm = np.zeros_like(cam_np)

        return cam_norm.astype(np.float32)

    def generate_heatmap(
        self,
        input_tensor: torch.Tensor,
        target_class: Optional[int] = None,
        method: str = "weights"
    ) -> np.ndarray:
        """
        Generates the full 3D class activation heatmap.
        
        Execution Flow:
            1. If target_class is None, runs forward inference and selects the winning class.
            2. Attempts fast Weight-Based CAM first if method='weights'.
            3. Falls back to standard Gradient-Weighted Backprop CAM if required.

        Args:
            input_tensor (torch.Tensor): 5D MRI tensor of shape (1, 1, 96, 96, 96).
            target_class (int, optional): Disease stage (0: CN, 1: MCI, 2: AD).
            method (str): 'weights' for weight-based CAM or 'gradcam' for gradient backprop.

        Returns:
            np.ndarray: 3D float32 volume of shape (96, 96, 96) with normalized values [0.0, 1.0].
        """
        # Determine target class from model predictions if not provided
        if target_class is None:
            with torch.no_grad():
                out = self.model(input_tensor)
                target_class = int(torch.argmax(out, dim=1).item())

        # Preferred fast execution path: Weight-based CAM
        if method == "weights":
            try:
                return self.generate_cam_from_weights(input_tensor, target_class)
            except Exception:
                pass  # Gracefully fall back to gradient-based Grad-CAM

        # -------------------------------------------------------------------------
        # Standard Gradient-Based Grad-CAM Execution Path
        # -------------------------------------------------------------------------
        self._register_hooks()
        try:
            self.model.eval()
            
            # Ensure input tensor tracks gradients for backpropagation
            if not input_tensor.requires_grad:
                input_tensor = input_tensor.clone().detach().requires_grad_(True)
                
            # Forward pass: execute through model to record forward activations
            output = self.model(input_tensor)
            
            # Target output score for the desired diagnostic stage
            self.model.zero_grad()
            score = output[0, target_class]
            
            # Backward pass: compute gradients d(score) / d(feature_maps)
            score.backward(retain_graph=True)
            
            if self.gradients is None or self.activations is None:
                raise RuntimeError("Failed to capture gradients or activations during GradCAM backward pass.")

            # Step A: 3D Global Average Pooling of gradients along Depth, Height, Width
            # Shape transition: (1, Channels, D, H, W) -> (1, Channels, 1, 1, 1)
            weights = torch.mean(self.gradients, dim=(2, 3, 4), keepdim=True)
            
            # Step B: Weighted summation across all feature map channels
            cam = torch.sum(weights * self.activations, dim=1, keepdim=True)
            cam = F.relu(cam)  # ReLU isolates features that positively impact target class
            
            # Step C: Trilinear interpolation to upsample from coarse feature grid to full (96, 96, 96)
            spatial_size = input_tensor.shape[2:]
            cam = F.interpolate(cam, size=spatial_size, mode="trilinear", align_corners=False)
            
            cam_np = cam.squeeze().detach().cpu().numpy()
            
            # Step D: Robust min-max percentile normalization
            pmin = np.min(cam_np)
            p99 = np.percentile(cam_np, 99.5)
            if p99 > pmin + 1e-6:
                cam_norm = np.clip((cam_np - pmin) / (p99 - pmin), 0.0, 1.0)
            else:
                cam_norm = cam_np - pmin

            cam_norm = np.clip(cam_norm, 0.0, 1.0)
            return cam_norm.astype(np.float32)

        finally:
            # Always clean up hooks to prevent memory leaks
            self._remove_hooks()


def overlay_heatmap_on_slice(
    mri_slice: np.ndarray,
    heatmap_slice: np.ndarray,
    opacity: float = 0.75,
    colormap_name: str = "turbo",
    target_size: tuple = (512, 512)
) -> np.ndarray:
    """
    Blends a 2D Grad-CAM heatmap slice onto a 2D grayscale MRI slice for clinical display
    with high-fidelity bicubic upsampling, edge-preserving bilateral filtering, and CLAHE contrast.
    
    Processing Steps:
    -----------------
    1. Grayscale Normalization: Robust percentile scaling [1st, 99.5th] to [0, 255] uint8.
    2. High-Definition Upsampling: Bicubic interpolation to target_size (512x512) for smooth tone.
    3. Edge-Preserving Denoising: Bilateral filter removes voxel stepping artifacts while keeping
       anatomical boundaries (cortex, sulci, ventricles, skull bone) razor-sharp.
    4. CLAHE Contrast Enhancement: Optimized contrast enhancement across brain anatomy without
       amplifying high-frequency grain or speckle noise.
    5. Continuous Heatmap Smoothing: Gaussian spatial filter for organic medical radiation hotspot.
    6. Tissue Masking & Alpha Blending: Retains clean grayscale brain anatomy outside active regions.

    Args:
        mri_slice (np.ndarray): 2D array of MRI voxel values (H, W).
        heatmap_slice (np.ndarray): 2D float array of Grad-CAM activations (0.0 to 1.0).
        opacity (float): Heatmap opacity factor (0.0 = MRI only, 1.0 = solid heatmap).
        colormap_name (str): Color palette ('turbo', 'jet', 'inferno', 'hot').
        target_size (tuple): Output resolution (height, width), defaults to (512, 512).

    Returns:
        np.ndarray: Blended RGB image of shape (target_size[0], target_size[1], 3).
    """
    # -------------------------------------------------------------------------
    # 1. Normalize raw MRI voxel slice to [0, 255] uint8 with robust percentile clipping
    # -------------------------------------------------------------------------
    if mri_slice.dtype != np.uint8:
        pmin = float(np.percentile(mri_slice, 1))
        pmax = float(np.percentile(mri_slice, 99.5))
        if pmax <= pmin:
            pmax = pmin + 1.0
        mri_clipped = np.clip(mri_slice, pmin, pmax)
        mri_slice = ((mri_clipped - pmin) / (pmax - pmin) * 255.0).astype(np.uint8)

    # -------------------------------------------------------------------------
    # 2. High-Definition Upsampling & Edge-Preserving Denoising
    # -------------------------------------------------------------------------
    if target_size and (mri_slice.shape[0] != target_size[0] or mri_slice.shape[1] != target_size[1]):
        mri_high_res = cv2.resize(mri_slice, (target_size[1], target_size[0]), interpolation=cv2.INTER_CUBIC)
    else:
        mri_high_res = mri_slice.copy()

    # Bilateral filter smooths voxel stepping while retaining sharp anatomical edges
    mri_smooth = cv2.bilateralFilter(mri_high_res, d=5, sigmaColor=25, sigmaSpace=25)

    # -------------------------------------------------------------------------
    # 3. Structural Brain Contrast Enhancement (CLAHE on 512x512)
    # -------------------------------------------------------------------------
    clahe = cv2.createCLAHE(clipLimit=1.6, tileGridSize=(8, 8))
    mri_enhanced = clahe.apply(mri_smooth)
    mri_rgb = cv2.cvtColor(mri_enhanced, cv2.COLOR_GRAY2RGB)

    # If opacity is negligible, return pure high-def grayscale MRI immediately
    if opacity <= 0.02:
        return mri_rgb

    # -------------------------------------------------------------------------
    # 4. Heatmap Upscaling and Organic Gaussian Smoothing
    # -------------------------------------------------------------------------
    if target_size and (heatmap_slice.shape[0] != target_size[0] or heatmap_slice.shape[1] != target_size[1]):
        hm_high_res = cv2.resize(heatmap_slice, (target_size[1], target_size[0]), interpolation=cv2.INTER_CUBIC)
    else:
        hm_high_res = heatmap_slice.copy()

    hm_norm = np.clip(hm_high_res, 0.0, 1.0)
    hm_smoothed = cv2.GaussianBlur(hm_norm, (15, 15), 3.0)

    # -------------------------------------------------------------------------
    # 5. Resolve Colormap Palette
    # -------------------------------------------------------------------------
    colormaps = {
        "turbo": cv2.COLORMAP_TURBO,      # Perceptually uniform rainbow (standard)
        "jet": cv2.COLORMAP_JET,          # Classic blue-to-red medical palette
        "inferno": cv2.COLORMAP_INFERNO,  # Black-to-yellow thermal palette
        "hot": cv2.COLORMAP_HOT           # Black-red-yellow thermal palette
    }
    cmap = colormaps.get(colormap_name.lower(), cv2.COLORMAP_TURBO)

    # -------------------------------------------------------------------------
    # 6. Highlight focal hotspots (ventricles, temporal lobes, hippocampus)
    # Background brain tissue below 0.20 threshold remains clean grayscale MRI.
    # -------------------------------------------------------------------------
    brain_mask = (mri_enhanced > 18)               # Exclude background black space
    activation_threshold = 0.20                    # Exclude low-confidence noise
    active_mask = brain_mask & (hm_smoothed > activation_threshold)

    blended = mri_rgb.copy()
    if np.any(active_mask):
        # Rescale active range [threshold, 1.0] -> [0.0, 1.0] to utilize the full colormap spectrum
        hm_active = np.zeros_like(hm_smoothed)
        hm_active[active_mask] = (hm_smoothed[active_mask] - activation_threshold) / (1.0 - activation_threshold + 1e-6)
        hm_uint8 = (hm_active * 255.0).astype(np.uint8)

        # Apply OpenCV colormap
        heatmap_colored = cv2.applyColorMap(hm_uint8, cmap)
        heatmap_rgb = cv2.cvtColor(heatmap_colored, cv2.COLOR_BGR2RGB)

        # Alpha blend proportional to activation intensity and user opacity slider
        alpha = (hm_active[:, :, np.newaxis] * float(np.clip(opacity, 0.0, 1.0)))
        blended[active_mask] = (
            alpha[active_mask] * heatmap_rgb[active_mask] + (1.0 - alpha[active_mask]) * mri_rgb[active_mask]
        ).astype(np.uint8)

    return blended
