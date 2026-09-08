import json
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from .session import Base


class UserSession(Base):
    __tablename__ = "user_sessions"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(64), unique=True, index=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_active_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    analyses = relationship("EmotionAnalysis", back_populates="session", cascade="all, delete-orphan")


class EmotionAnalysis(Base):
    __tablename__ = "emotion_analyses"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(64), ForeignKey("user_sessions.session_id"), index=True, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    context_mode = Column(String(32), default="education")

    # Modality-level summary
    face_emotion = Column(String(32), nullable=True)
    face_confidence = Column(Float, nullable=True)

    audio_emotion = Column(String(32), nullable=True)
    audio_confidence = Column(Float, nullable=True)

    text_emotion = Column(String(32), nullable=True)
    text_confidence = Column(Float, nullable=True)

    # Fusion results
    final_emotion = Column(String(32), nullable=False)
    confidence = Column(Float, nullable=False)
    engagement_level = Column(String(32), nullable=False)
    mood_category = Column(String(32), nullable=False)
    agreement_score = Column(Float, nullable=False)

    # Serialized details
    modalities_used_json = Column(Text, default="[]")
    probabilities_json = Column(Text, default="{}")
    notes = Column(Text, nullable=True)

    session = relationship("UserSession", back_populates="analyses")
    modality_results = relationship("ModalityDetail", back_populates="analysis", cascade="all, delete-orphan")
    recommendations = relationship("RecommendationHistory", back_populates="analysis", cascade="all, delete-orphan")

    @property
    def modalities_used(self):
        try:
            return json.loads(self.modalities_used_json or "[]")
        except Exception:
            return []

    @modalities_used.setter
    def modalities_used(self, value):
        self.modalities_used_json = json.dumps(value)


class ModalityDetail(Base):
    __tablename__ = "modality_details"

    id = Column(Integer, primary_key=True, index=True)
    analysis_id = Column(Integer, ForeignKey("emotion_analyses.id"), nullable=False)
    modality_type = Column(String(32), nullable=False)  # "face", "audio", "text"
    predicted_emotion = Column(String(32), nullable=False)
    confidence = Column(Float, nullable=False)
    probabilities_json = Column(Text, default="{}")
    features_json = Column(Text, default="{}")

    analysis = relationship("EmotionAnalysis", back_populates="modality_results")


class RecommendationHistory(Base):
    __tablename__ = "recommendation_history"

    id = Column(Integer, primary_key=True, index=True)
    analysis_id = Column(Integer, ForeignKey("emotion_analyses.id"), nullable=False)
    title = Column(String(256), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String(64), nullable=False)
    action_type = Column(String(64), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)

    analysis = relationship("EmotionAnalysis", back_populates="recommendations")
