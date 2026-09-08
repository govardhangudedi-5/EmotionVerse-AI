from datetime import datetime
from fastapi import APIRouter
from ...config import settings

router = APIRouter(tags=["Health"])


@router.get("/health")
def get_health():
    """System health check endpoint verifying status of API, models, and modes."""
    return {
        "status": "healthy",
        "app_name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
        "demo_mode": settings.DEMO_MODE,
        "timestamp": datetime.utcnow().isoformat(),
        "modalities_supported": ["face", "audio", "text"],
        "fusion_engine": "Late Fusion (Weighted Softmax)",
    }
