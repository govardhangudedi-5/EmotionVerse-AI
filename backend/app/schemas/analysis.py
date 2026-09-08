from datetime import datetime
from typing import Dict, List, Optional
from pydantic import BaseModel
from .emotion import EngagementLevel, MoodCategory, ContextMode, RecommendationItem


class AnalysisRecordCreate(BaseModel):
    session_id: Optional[str] = None
    context_mode: ContextMode = ContextMode.EDUCATION
    face_emotion: Optional[str] = None
    face_confidence: Optional[float] = None
    audio_emotion: Optional[str] = None
    audio_confidence: Optional[float] = None
    text_emotion: Optional[str] = None
    text_confidence: Optional[float] = None
    final_emotion: str
    confidence: float
    engagement_level: EngagementLevel
    mood_category: MoodCategory
    agreement_score: float
    modalities_used: List[str]
    notes: Optional[str] = None


class AnalysisRecordResponse(BaseModel):
    id: int
    session_id: str
    timestamp: datetime
    context_mode: str
    face_emotion: Optional[str] = None
    face_confidence: Optional[float] = None
    audio_emotion: Optional[str] = None
    audio_confidence: Optional[float] = None
    text_emotion: Optional[str] = None
    text_confidence: Optional[float] = None
    final_emotion: str
    confidence: float
    engagement_level: str
    mood_category: str
    agreement_score: float
    modalities_used: List[str]
    notes: Optional[str] = None

    class Config:
        from_attributes = True


class AnalysisHistoryStats(BaseModel):
    total_analyses: int
    most_frequent_emotion: str
    average_confidence: float
    emotion_distribution: Dict[str, int]
    mood_distribution: Dict[str, int]
    engagement_distribution: Dict[str, int]
    modalities_frequency: Dict[str, int]
