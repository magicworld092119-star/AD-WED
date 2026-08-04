# AD-WEB: Alzheimer's Disease Explainable AI Web Application

![License](https://img.shields.io/badge/License-MIT-blue.svg)
![Python](https://img.shields.io/badge/Python-3.10%2B-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-0.110.0-green)
![React](https://img.shields.io/badge/React-18.2.0-blue)
![PyTorch](https://img.shields.io/badge/PyTorch-2.2.0-red)
![MONAI](https://img.shields.io/badge/MONAI-1.3.0-purple)

## 📌 Project Overview

**AD-WEB** is a state-of-the-art, production-grade Explainable AI (XAI) web application engineered to assist clinicians and researchers in predicting Alzheimer's Disease (AD) stages from 3D structural Magnetic Resonance Imaging (sMRI) scans (`.nii` / `.nii.gz`).

### Key Features
* 🧠 **3D Medical MRI Preprocessing**: Skull stripping, affine registration, intensity normalization, and resizing via MONAI, TorchIO, & NiBabel.
* 🔮 **Deep Learning Classification**: 3D CNN (ResNet-3D / DenseNet-3D) predicting Cognitively Normal (**CN**), Mild Cognitive Impairment (**MCI**), and Alzheimer's Disease (**AD**).
* 🔥 **Grad-CAM Explainability**: Real-time 3D class activation mapping providing transparent visual heatmaps highlighting affected brain regions (e.g., Hippocampus, Ventricles).
* 🖥️ **Interactive Web Interface**: Medical-grade slice viewer powered by React, Tailwind CSS, and Cornerstone.js/Nifti canvas rendering.
* ⚡ **High-Performance REST API**: Asynchronous prediction endpoints built with FastAPI, Uvicorn, & Pydantic.
* 📐 **Enterprise Clean Architecture**: Decoupled AI pipeline, Backend API, Frontend UI, and Modular Storage layers.

---

## 🏗️ Architecture & Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **AI / Medical Imaging** | PyTorch, MONAI, NiBabel, TorchIO, NumPy, OpenCV, SciPy, Matplotlib |
| **Backend API** | FastAPI, Uvicorn, Pydantic, Python 3.10+ |
| **Frontend UI** | React 18, Vite, Tailwind CSS, Axios, Cornerstone.js |
| **Storage & Data** | Structured Local Storage (`uploads`, `heatmaps`, `temp`), PostgreSQL ready |
| **DevOps & Testing** | Docker, Docker Compose, PyTest, GitHub Actions CI/CD |

---

## 📁 Repository Structure

```
AD-WEB/
├── .github/ workflows CI pipelines
├── ai/ Deep Learning, Preprocessing & Grad-CAM Explainability
├── backend/ FastAPI REST API & Controller Services
├── frontend/ React + Vite + Tailwind Medical Dashboard
├── config/ Environment & System Configuration Loader
├── storage/ Uploaded MRIs, Generated Heatmaps, Logs
├── docs/ SRS, Architecture Diagrams, API Specs
├── tests/ Unit & Integration Tests (Backend, Model, UI)
└── deployment/ Docker Compose, Nginx & Deployment Scripts
```

For a detailed walkthrough of every folder and clean architecture principles, see [DOCUMENTATION.md](docs/SRS/Software_Requirements_Specification.md).

---

## 🚀 Quick Start Guide

### Prerequisites
* Python 3.10+
* Node.js 18+ & npm
* Docker & Docker Compose (Optional)

### Option 1: Docker Compose (Recommended)

```bash
docker-compose -f deployment/docker-compose.yml up --build
```
Access the application at:
* **Frontend**: `http://localhost:3000`
* **FastAPI Docs**: `http://localhost:8000/docs`

### Option 2: Local Development

#### 1. Backend Setup
```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Launch FastAPI Server
uvicorn backend.app.main:app --reload --port 8000
```

#### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

---

## 🧪 Running Tests

```bash
# Run backend & AI tests
pytest tests/

# Run frontend tests
cd frontend && npm test
```

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.
