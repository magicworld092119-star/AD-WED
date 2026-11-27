"""
========================================================================================
3D CONVOLUTIONAL NEURAL NETWORK (CNN) ARCHITECTURE FOR BRAIN MRI CLASSIFICATION
========================================================================================
This module defines a baseline 3D CNN (Simple3DCNN) tailored for volumetric neuroimaging.
Unlike 2D CNNs that process single slices in isolation, 3D CNNs evaluate depth, height,
and width simultaneously (D x H x W), preserving critical through-plane neuroanatomical
relationships (e.g., hippocampal volume, ventricle expansion, and cortical sulcal depth).

Class Staging Output:
    - Class 0: Cognitively Normal (CN)
    - Class 1: Mild Cognitive Impairment (MCI)
    - Class 2: Alzheimer's Disease (AD)
========================================================================================
"""

import torch
import torch.nn as nn
import torch.nn.functional as F


class Simple3DCNN(nn.Module):
    """
    Three-dimensional Convolutional Neural Network for tri-class Alzheimer's disease staging.
    
    Architecture Overview:
    ----------------------
    - Conv Block 1: Conv3d(1 -> 32) + BatchNorm3d + ReLU + MaxPool3d(2)
        Input shape:  (Batch, 1, 96, 96, 96)
        Output shape: (Batch, 32, 48, 48, 48)
        Captures low-level spatial features (edges, tissue contrast boundaries, skull borders).
        
    - Conv Block 2: Conv3d(32 -> 64) + BatchNorm3d + ReLU + MaxPool3d(2)
        Input shape:  (Batch, 32, 48, 48, 48)
        Output shape: (Batch, 64, 24, 24, 24)
        Captures mid-level anatomical patterns (ventricular boundaries, cortical gyri).
        
    - Conv Block 3: Conv3d(64 -> 128) + BatchNorm3d + ReLU + MaxPool3d(2)
        Input shape:  (Batch, 64, 24, 24, 24)
        Output shape: (Batch, 128, 12, 12, 12)
        Captures high-level pathological biomarkers (hippocampal shrinkage, lateral ventricle dilation).
        
    - Global Average Pooling (GAP):
        Compresses spatial coordinates (12, 12, 12) down to (1, 1, 1), producing a 128-dimensional latent vector.
        GAP significantly reduces model parameters, prevents overfitting, and enables CAM attribution.
        
    - Linear Classifier:
        Maps the 128-dimensional embedding to 3 diagnostic stage logits: [CN, MCI, AD].
    """

    def __init__(self, in_channels: int = 1, num_classes: int = 3):
        """
        Initializes the 3D CNN layers.

        Args:
            in_channels (int): Number of input channels (1 for single-channel grayscale sMRI).
            num_classes (int): Number of classification target stages (default: 3 for CN, MCI, AD).
        """
        super(Simple3DCNN, self).__init__()
        
        # ---------------------------------------------------------------------
        # Layer 1: Feature Extraction (Low-Level Edges and Boundaries)
        # ---------------------------------------------------------------------
        self.conv1 = nn.Conv3d(in_channels, 32, kernel_size=3, padding=1)
        self.bn1 = nn.BatchNorm3d(32)  # Stabilizes training and accelerates gradient convergence
        
        # ---------------------------------------------------------------------
        # Layer 2: Intermediate Representation (Tissue Morphology & Sulci)
        # ---------------------------------------------------------------------
        self.conv2 = nn.Conv3d(32, 64, kernel_size=3, padding=1)
        self.bn2 = nn.BatchNorm3d(64)
        
        # ---------------------------------------------------------------------
        # Layer 3: High-Level Pathological Semantics (Ventricles & Hippocampus)
        # ---------------------------------------------------------------------
        self.conv3 = nn.Conv3d(64, 128, kernel_size=3, padding=1)
        self.bn3 = nn.BatchNorm3d(128)
        
        # ---------------------------------------------------------------------
        # Pooling & Classification Head
        # ---------------------------------------------------------------------
        self.pool = nn.MaxPool3d(kernel_size=2, stride=2)       # Halves spatial dimensions
        self.gap = nn.AdaptiveAvgPool3d((1, 1, 1))               # Pools (12, 12, 12) to (1, 1, 1)
        self.fc = nn.Linear(128, num_classes)                   # Maps features to [CN, MCI, AD] logits

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """
        Executes forward propagation through the 3D CNN.

        Args:
            x (torch.Tensor): Input batch of 3D brain scans with shape (Batch, 1, 96, 96, 96).

        Returns:
            torch.Tensor: Unnormalized diagnostic logits with shape (Batch, 3).
        """
        # Block 1: Conv -> BatchNorm -> ReLU -> MaxPool
        x = self.pool(F.relu(self.bn1(self.conv1(x))))
        
        # Block 2: Conv -> BatchNorm -> ReLU -> MaxPool
        x = self.pool(F.relu(self.bn2(self.conv2(x))))
        
        # Block 3: Conv -> BatchNorm -> ReLU -> MaxPool
        x = self.pool(F.relu(self.bn3(self.conv3(x))))
        
        # Global Average Pooling: (Batch, 128, D', H', W') -> (Batch, 128, 1, 1, 1)
        x = self.gap(x)
        
        # Flatten spatial dimensions: (Batch, 128, 1, 1, 1) -> (Batch, 128)
        x = torch.flatten(x, 1)
        
        # Fully Connected Classifier: (Batch, 128) -> (Batch, 3)
        logits = self.fc(x)
        return logits
