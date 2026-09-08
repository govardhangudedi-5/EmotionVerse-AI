from collections import Counter
import json
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from ...database.models import EmotionAnalysis, ModalityDetail, RecommendationHistory, UserSession
from ...database.session import get_db
from ...schemas.analysis import (
    AnalysisHistoryStats,
    AnalysisRecordCreate,
    AnalysisRecordResponse,
)

router = APIRouter(prefix="/analysis", tags=["History & Analytics"])


@router.post(
    "/save",
    response_model=AnalysisRecordResponse,
    summary="Save a multimodal emotion analysis result",
)
def save_analysis(
    payload: AnalysisRecordCreate,
    db: Session = Depends(get_db),
):
    """Stores the analysis record, linking or creating a user session."""
    session_id = payload.session_id or f"session_{uuid.uuid4().hex[:12]}"

    user_session = db.query(UserSession).filter(UserSession.session_id == session_id).first()
    if not user_session:
        user_session = UserSession(session_id=session_id)
        db.add(user_session)
        db.flush()

    record = EmotionAnalysis(
        session_id=session_id,
        context_mode=payload.context_mode.value,
        face_emotion=payload.face_emotion,
        face_confidence=payload.face_confidence,
        audio_emotion=payload.audio_emotion,
        audio_confidence=payload.audio_confidence,
        text_emotion=payload.text_emotion,
        text_confidence=payload.text_confidence,
        final_emotion=payload.final_emotion,
        confidence=payload.confidence,
        engagement_level=payload.engagement_level.value,
        mood_category=payload.mood_category.value,
        agreement_score=payload.agreement_score,
        modalities_used_json=json.dumps(payload.modalities_used),
        notes=payload.notes,
    )

    db.add(record)
    db.commit()
    db.refresh(record)

    return record


@router.get(
    "/history",
    response_model=List[AnalysisRecordResponse],
    summary="Retrieve emotion analysis history",
)
def get_history(
    limit: int = Query(50, ge=1, le=500),
    context_mode: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """Returns past emotion analyses sorted by newest first."""
    query = db.query(EmotionAnalysis)
    if context_mode:
        query = query.filter(EmotionAnalysis.context_mode == context_mode)
    records = query.order_by(EmotionAnalysis.timestamp.desc()).limit(limit).all()
    return records


@router.get(
    "/stats",
    response_model=AnalysisHistoryStats,
    summary="Get aggregated statistics across historical analyses",
)
def get_analysis_stats(db: Session = Depends(get_db)):
    """Computes summary distributions for emotions, mood, engagement, and modalities."""
    records = db.query(EmotionAnalysis).all()
    total = len(records)

    if total == 0:
        return AnalysisHistoryStats(
            total_analyses=0,
            most_frequent_emotion="none",
            average_confidence=0.0,
            emotion_distribution={},
            mood_distribution={},
            engagement_distribution={},
            modalities_frequency={},
        )

    emotions = [r.final_emotion for r in records if r.final_emotion]
    moods = [r.mood_category for r in records if r.mood_category]
    engagements = [r.engagement_level for r in records if r.engagement_level]
    confidences = [r.confidence for r in records if r.confidence is not None]

    emotion_counts = dict(Counter(emotions))
    mood_counts = dict(Counter(moods))
    engagement_counts = dict(Counter(engagements))

    modality_list = []
    for r in records:
        modality_list.extend(r.modalities_used)
    modality_counts = dict(Counter(modality_list))

    most_frequent = Counter(emotions).most_common(1)[0][0] if emotions else "none"
    avg_conf = round(sum(confidences) / len(confidences), 3) if confidences else 0.0

    return AnalysisHistoryStats(
        total_analyses=total,
        most_frequent_emotion=most_frequent,
        average_confidence=avg_conf,
        emotion_distribution=emotion_counts,
        mood_distribution=mood_counts,
        engagement_distribution=engagement_counts,
        modalities_frequency=modality_counts,
    )


@router.delete(
    "/{record_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete an analysis record",
)
def delete_record(record_id: int, db: Session = Depends(get_db)):
    """Deletes an analysis record by its primary key ID."""
    record = db.query(EmotionAnalysis).filter(EmotionAnalysis.id == record_id).first()
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Record not found")
    db.delete(record)
    db.commit()
    return None
