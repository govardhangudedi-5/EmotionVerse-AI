import logging
from typing import Dict, List, Optional

from ..config import settings
from ..models.fusion_model import MultimodalFusionModel
from ..schemas.emotion import (
    EngagementLevel,
    MoodCategory,
    MultimodalFusionRequest,
    MultimodalFusionResponse,
)
from .recommendation_service import RecommendationService

logger = logging.getLogger(__name__)


class MultimodalFusionService:
    def __init__(self):
        self.fusion_model = MultimodalFusionModel(
            default_face_weight=settings.DEFAULT_FACE_WEIGHT,
            default_audio_weight=settings.DEFAULT_AUDIO_WEIGHT,
            default_text_weight=settings.DEFAULT_TEXT_WEIGHT,
            agreement_threshold=settings.AGREEMENT_THRESHOLD,
        )

    def fuse_modalities(self, request: MultimodalFusionRequest) -> MultimodalFusionResponse:
        """
        Gathers available modality outputs, normalizes weights, executes late fusion,
        calculates agreement score and engagement, and produces personalized recommendations.
        """
        distributions: Dict[str, Dict[str, float]] = {}
        modalities_used: List[str] = []

        if request.face_result and request.face_result.probabilities:
            distributions["face"] = request.face_result.probabilities
            modalities_used.append("face")

        if request.audio_result and request.audio_result.probabilities:
            distributions["audio"] = request.audio_result.probabilities
            modalities_used.append("audio")

        if request.text_result and request.text_result.probabilities:
            distributions["text"] = request.text_result.probabilities
            modalities_used.append("text")

        # Late fusion calculation
        (
            final_emotion,
            confidence,
            fused_probs,
            effective_weights,
            agreement_score,
            is_mixed_emotion,
            disagreement_detected,
            mood_category_str,
            engagement_level_str,
        ) = self.fusion_model.fuse(distributions, request.custom_weights)

        mood_category = MoodCategory(mood_category_str)
        engagement_level = EngagementLevel(engagement_level_str)

        # Generate contextual recommendations
        recommendations = RecommendationService.generate_recommendations(
            final_emotion=final_emotion,
            mood_category=mood_category,
            engagement_level=engagement_level,
            context_mode=request.context_mode,
            is_mixed_emotion=is_mixed_emotion,
        )

        return MultimodalFusionResponse(
            final_emotion=final_emotion,
            confidence=confidence,
            engagement_level=engagement_level,
            mood_category=mood_category,
            modalities_used=modalities_used,
            effective_weights=effective_weights,
            fusion_probabilities=fused_probs,
            agreement_score=agreement_score,
            is_mixed_emotion=is_mixed_emotion,
            disagreement_detected=disagreement_detected,
            context_mode=request.context_mode,
            recommendations=recommendations,
        )
