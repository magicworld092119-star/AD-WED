import sys
from pathlib import Path

# Automatically add project root to Python search path so 'config' is always found
ROOT_DIR = Path(__file__).resolve().parent.parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config.settings import settings
from backend.app.api.v1.router import api_v1_router
from backend.app.middleware.error_handler import add_exception_handlers
from backend.app.db.database import db

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Connect to database (with JSON fallback)
    await db.connect()
    yield
    # Shutdown: Clean up connections
    await db.close()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Explainable AI API for Alzheimer's Disease Stage Prediction from 3D sMRI",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan
)

# CORS Middleware Setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:[0-9]+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

from fastapi.staticfiles import StaticFiles

# Add Global Exception Handlers
add_exception_handlers(app)

# Ensure storage directories exist
settings.STORAGE_DIR.mkdir(parents=True, exist_ok=True)
settings.UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
settings.HEATMAPS_DIR.mkdir(parents=True, exist_ok=True)
settings.TEMP_DIR.mkdir(parents=True, exist_ok=True)

# Mount static storage for downloads & heatmap NIfTI files
app.mount("/storage", StaticFiles(directory=str(settings.STORAGE_DIR)), name="storage")

# Register API Routes
app.include_router(api_v1_router, prefix=settings.API_V1_STR)

@app.get("/", tags=["Root"])
def root():
    return {
        "message": "Welcome to AD-WEB AI API",
        "docs": "/docs",
        "version": settings.VERSION
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
