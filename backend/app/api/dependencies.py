from functools import lru_cache
from ..database.session import get_db
from ..services.audio_service import AudioEmotionService
from ..services.face_service import FaceEmotionService
from ..services.fusion_service import MultimodalFusionService
from ..services.text_service import TextEmotionService


@lru_cache()
def get_face_service() -> FaceEmotionService:
    return FaceEmotionService()


@lru_cache()
def get_audio_service() -> AudioEmotionService:
    return AudioEmotionService()


@lru_cache()
def get_text_service() -> TextEmotionService:
    return TextEmotionService()


@lru_cache()
def get_fusion_service() -> MultimodalFusionService:
    return MultimodalFusionService()
