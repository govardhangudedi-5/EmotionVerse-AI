from enum import Enum
from typing import Dict, List, Optional
from pydantic import BaseModel, Field


class EmotionType(str, Enum):
    HAPPY = "happy"
    SAD = "sad"
    ANGRY = "angry"
    FEAR = "fear"
    SURPRISE = "surprise"
    DISGUST = "disgust"
    NEUTRAL = "neutral"


class MoodCategory(str, Enum):
    POSITIVE = "positive"
    NEUTRAL = "neutral"
    NEGATIVE = "negative"


class EngagementLevel(str, Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class ContextMode(str, Enum):
    EDUCATION = "education"
    HEALTHCARE = "healthcare"


class FaceAnalysisRequest(BaseModel):
    image_base64: Optional[str] = Field(None, description="Base64 encoded image data (data:image/...;base64,...)")


class FaceBoundingBox(BaseModel):
    x: int
    y: int
    width: int
    height: int


class ModalityResult(BaseModel):
    modality: str  # "face", "audio", "text"
    emotion: str
    confidence: float
    probabilities: Dict[str, float]
    mood_category: MoodCategory
    is_fallback: bool = False
    model_name: str = "Standard Model"
    metadata: Optional[Dict[str, object]] = None


class FaceAnalysisResponse(ModalityResult):
    face_detected: bool = False
    bounding_box: Optional[FaceBoundingBox] = None
    processed_image_base64: Optional[str] = None


class AudioAnalysisResponse(ModalityResult):
    waveform_points: Optional[List[float]] = None
    duration_seconds: Optional[float] = None
    sample_rate: Optional[int] = None
    pitch_estimate: Optional[float] = None
    energy_level: Optional[float] = None


class TextAnalysisRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=5000, description="Text to analyze for emotional sentiment")


class TextAnalysisResponse(ModalityResult):
    character_count: int
    word_count: int
    sentiment_polarity: float = 0.0


class MultimodalFusionRequest(BaseModel):
    face_result: Optional[FaceAnalysisResponse] = None
    audio_result: Optional[AudioAnalysisResponse] = None
    text_result: Optional[TextAnalysisResponse] = None
    context_mode: ContextMode = ContextMode.EDUCATION
    custom_weights: Optional[Dict[str, float]] = None


class RecommendationItem(BaseModel):
    title: str
    description: str
    category: str
    action_type: str  # e.g., "activity", "mindfulness", "resource", "alert"


class MultimodalFusionResponse(BaseModel):
    final_emotion: str
    confidence: float
    engagement_level: EngagementLevel
    mood_category: MoodCategory
    modalities_used: List[str]
    effective_weights: Dict[str, float]
    fusion_probabilities: Dict[str, float]
    agreement_score: float
    is_mixed_emotion: bool = False
    disagreement_detected: bool = False
    context_mode: ContextMode
    recommendations: List[RecommendationItem]
    medical_disclaimer: str = (
        "EmotionVerse AI provides supportive insights only and is not a medical diagnostic system."
    )
