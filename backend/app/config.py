from typing import List
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_NAME: str = "EmotionVerse AI"
    APP_VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    # ML & Inference Configuration
    DEMO_MODE: bool = False  # If True, flags fallback pipelines; if False, runs full local feature extractors & AI models
    
    # Multimodal late fusion default weights
    DEFAULT_FACE_WEIGHT: float = 0.35
    DEFAULT_AUDIO_WEIGHT: float = 0.35
    DEFAULT_TEXT_WEIGHT: float = 0.30

    # Agreement threshold for detecting conflicting / mixed emotions
    AGREEMENT_THRESHOLD: float = 0.45

    # Database
    DATABASE_URL: str = "sqlite:///./emotionverse.db"

    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "*",
    ]

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
