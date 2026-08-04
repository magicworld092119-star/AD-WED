# Software Requirements Specification (SRS) & Architecture Spec

## 1. Introduction
**AD-WEB (Alzheimer's Disease Web Application)** is an enterprise-grade Explainable AI platform designed to predict Alzheimer's Disease stages (CN, MCI, AD) from 3D structural MRI scans (`.nii` / `.nii.gz`) and render 3D Grad-CAM class activation maps.

---

## 2. Architectural Design Principles

AD-WEB strictly adheres to **Clean Architecture** and **Domain-Driven Design (DDD)** principles:

1. **Separation of Concerns**:
   - `ai/`: Independent Deep Learning core containing preprocessing pipelines, PyTorch/MONAI model architectures, inference loops, and Grad-CAM explainability generators.
   - `backend/`: FastAPI Web API layer exposing RESTful endpoints, validating incoming payloads, and orchestrating requests via services.
   - `frontend/`: Single Page Application (SPA) built with React, Vite, and Tailwind CSS.
   - `storage/`: Isolated persistent storage layer for uploads, heatmaps, and logs.
   - `config/`: Centralized single source of truth for runtime configurations.

2. **Scalability & Extension Readiness**:
   - **User Authentication**: Micro-modular `auth/` directory ready for JWT OAuth2 / RBAC integration.
   - **Database Support**: Schema structure ready for SQLAlchemy / PostgreSQL patient record integration.
   - **Model Versioning**: `ai/deep_learning/saved_models/` organized for dynamic multi-model loading.

---

## 3. Module Breakdown

### 3.1 Preprocessing Pipeline (`ai/preprocessing/`)
- **Loader**: NiBabel & TorchIO loading of `.nii` / `.nii.gz` volumetric arrays.
- **Skull Stripping**: Extraction of brain tissue removing extra-cranial voxels.
- **Registration**: MNI152 template spatial alignment.
- **Normalization**: Z-score and Min-Max intensity voxel scaling.

### 3.2 Explainability (`ai/explainability/`)
- **GradCAM3D**: Computes activation maps with respect to the final 3D convolutional layer.
- **Overlay**: Blends Grad-CAM heatmaps with structural MRI slices using custom opacity controls.
