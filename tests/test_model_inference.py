import sys
from pathlib import Path

# Add project root to sys.path
ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

import pytest
import torch
import numpy as np
from fastapi.testclient import TestClient

from ai.deep_learning.model_loader import get_model
from ai.preprocessing.loader import preprocess_mri_volume
from ai.explainability.gradcam import GradCAM3D, overlay_heatmap_on_slice
from backend.app.main import app

def test_model_loading():
    """Verify that the trained DenseNet121 model loads successfully."""
    model, device = get_model()
    assert model is not None
    assert str(device) in ["cpu", "cuda"]
    assert not model.training  # Should be in eval mode

def test_gradcam_3d_generation():
    """Verify that 3D Grad-CAM produces a valid 3D activation map."""
    model, device = get_model()
    gradcam = GradCAM3D(model)
    dummy_input = torch.randn(1, 1, 96, 96, 96, requires_grad=True, device=device)
    
    heatmap = gradcam.generate_heatmap(dummy_input, target_class=1)
    assert isinstance(heatmap, np.ndarray)
    assert heatmap.shape == (96, 96, 96)
    assert heatmap.min() >= 0.0
    assert heatmap.max() <= 1.0

def test_overlay_heatmap():
    """Verify slice overlay blends correctly without dimension distortion."""
    mri_slice = np.random.randint(0, 256, (96, 96), dtype=np.uint8)
    hm_slice = np.random.rand(96, 96).astype(np.float32)
    
    blended = overlay_heatmap_on_slice(mri_slice, hm_slice, opacity=0.7)
    assert blended.shape == (96, 96, 3)
    assert blended.dtype == np.uint8

def test_api_predict_and_slice():
    """Verify end-to-end API upload, prediction, Grad-CAM generation and slice retrieval."""
    client = TestClient(app)
    sample_scan = Path("../avg152T1_LR_nifti.nii")
    
    if not sample_scan.exists():
        pytest.skip("Sample NIfTI file not found for test.")

    with open(sample_scan, "rb") as f:
        response = client.post(
            "/api/v1/predict",
            files={"file": ("avg152T1_LR_nifti.nii", f, "application/octet-stream")},
            data={"patient_id": "TEST-CI", "patient_age": "70", "gender": "Female"}
        )

    assert response.status_code == 200
    data = response.json()
    assert "prediction_id" in data
    assert "predicted_stage" in data
    assert "probabilities" in data
    assert "gradcam_heatmap_url" in data
    assert data["num_slices"] == 96

    # Verify slice endpoint returns PNG
    pred_id = data["prediction_id"]
    slice_resp = client.get(f"/api/v1/predict/{pred_id}/slice?plane=axial&slice_idx=48&heatmap=true&opacity=70")
    assert slice_resp.status_code == 200
    assert slice_resp.headers["content-type"] == "image/png"
    assert len(slice_resp.content) > 1000
