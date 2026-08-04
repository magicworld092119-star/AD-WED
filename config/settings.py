from pydantic_settings import BaseSettings
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

class Settings(BaseSettings):
    PROJECT_NAME: str = "AD-WEB (Alzheimer's Disease Web Application)"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Environment
    ENV: str = "development"
    DEBUG: bool = True
    
    # Storage Paths
    STORAGE_DIR: Path = BASE_DIR / "storage"
    UPLOADS_DIR: Path = STORAGE_DIR / "uploads"
    HEATMAPS_DIR: Path = STORAGE_DIR / "heatmaps"
    TEMP_DIR: Path = STORAGE_DIR / "temp"
    HISTORY_DIR: Path = STORAGE_DIR / "history"
    LOGS_DIR: Path = STORAGE_DIR / "logs"
    
    # AI / Model Configs
    MODEL_DIR: Path = BASE_DIR / "ai" / "deep_learning" / "saved_models"
    DEFAULT_MODEL_NAME: str = "ad_classifier_v1.pth"
    INPUT_SHAPE: tuple = (1, 128, 128, 128)
    
    # CORS
    ALLOWED_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
        "http://localhost:5173"
    ]
    
    # MongoDB Config
    MONGODB_URL: str = "mongodb://localhost:27017/adweb"
    MONGODB_DB_NAME: str = "adweb"
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
