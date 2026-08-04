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
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add Global Exception Handlers
add_exception_handlers(app)

# Register API Routes
app.include_router(api_v1_router, prefix=settings.API_V1_STR)

@app.get("/", tags=["Root"])
def root():
    return {
        "message": "Welcome to AD-WEB AI API",
        "docs": "/docs",
        "version": settings.VERSION
    }
