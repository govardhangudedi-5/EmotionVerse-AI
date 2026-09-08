import logging
from typing import Dict, List, Optional, Tuple
import numpy as np

from .base_model import EMOTION_CLASSES, MOOD_MAPPING

logger = logging.getLogger(__name__)


class MultimodalFusionModel:
    """
    Multimodal Late Fusion Engine with Dynamic Normalization & Uncertainty Estimation.
    
    Combines heterogeneous modalities (Face, Voice, Text):
      P_final(e) = sum_{m in M} (w_m * P_m(e))
    where:
      w_m = raw_weight_m / sum_{k in M} raw_weight_k
    
    Features:
      - Dynamic weight normalization for missing modalities (1, 2, or 3 inputs).
      - Cross-modality agreement score (based on cosine similarity / divergence).
      - Mixed emotion & conflict detection when modalities strongly disagree.
      - Dynamic engagement level estimation (High / Medium / Low).
    """

    def __init__(
        self,
        default_face_weight: float = 0.35,
        default_audio_weight: float = 0.35,
        default_text_weight: float = 0.30,
        agreement_threshold: float = 0.45,
    ):
        self.default_weights = {
            "face": default_face_weight,
            "audio": default_audio_weight,
            "text": default_text_weight,
        }
        self.agreement_threshold = agreement_threshold

    def normalize_weights(
        self,
        available_modalities: List[str],
        custom_weights: Optional[Dict[str, float]] = None,
    ) -> Dict[str, float]:
        """
        Dynamically normalizes weights across whatever subset of modalities is present.
        Sum of weights is guaranteed to be 1.0.
        """
        if not available_modalities:
            return {}

        base_weights = custom_weights if custom_weights else self.default_weights
        raw_sum = sum(base_weights.get(m, 0.33) for m in available_modalities)

        if raw_sum <= 0:
            uniform_w = 1.0 / len(available_modalities)
            return {m: round(uniform_w, 4) for m in available_modalities}

        normalized = {
            m: round(base_weights.get(m, 0.33) / raw_sum, 4) for m in available_modalities
        }
        # Correct any minor rounding delta to ensure exact sum == 1.0
        delta = 1.0 - sum(normalized.values())
        first_key = available_modalities[0]
        normalized[first_key] = round(normalized[first_key] + delta, 4)

        return normalized

    def calculate_agreement_score(
        self, modality_distributions: Dict[str, Dict[str, float]]
    ) -> float:
        """
        Calculates cross-modal agreement score in [0.0, 1.0].
        If only 1 modality is present, agreement is defined as 1.0 (self-consistent).
        For >=2 modalities, computes average pairwise cosine similarity of probability vectors.
        """
        modalities = list(modality_distributions.keys())
        if len(modalities) <= 1:
            return 1.0

        vectors = []
        for m in modalities:
            dist = modality_distributions[m]
            vec = np.array([dist.get(e, 0.0) for e in EMOTION_CLASSES], dtype=np.float64)
            norm = np.linalg.norm(vec)
            if norm > 0:
                vec = vec / norm
            vectors.append(vec)

        pairwise_similarities = []
        for i in range(len(vectors)):
            for j in range(i + 1, len(vectors)):
                sim = float(np.dot(vectors[i], vectors[j]))
                pairwise_similarities.append(max(0.0, min(1.0, sim)))

        return round(float(np.mean(pairwise_similarities)), 3)

    def calculate_engagement(
        self,
        final_emotion: str,
        confidence: float,
        modality_distributions: Dict[str, Dict[str, float]],
        agreement_score: float,
    ) -> str:
        """
        Modular engagement calculation using multi-signal heuristics:
          - High: Strong positive or alert emotions, high confidence, strong coherence
          - Medium: Moderate confidence, balanced/neutral expressions
          - Low: High boredom/sadness/disengagement or very low interaction signals
        """
        score = 0.5  # Base neutral engagement

        # Confidence contribution
        score += (confidence - 0.5) * 0.4

        # Emotion-specific engagement valence
        if final_emotion in ["happy", "surprise"]:
            score += 0.25
        elif final_emotion in ["angry", "fear"]:
            score += 0.15  # High arousal / stress
        elif final_emotion == "sad":
            score -= 0.20
        elif final_emotion == "disgust":
            score -= 0.15
        elif final_emotion == "neutral":
            score += 0.0

        # Modality richness bonus (using multiple modalities reflects active engagement)
        if len(modality_distributions) >= 3:
            score += 0.15
        elif len(modality_distributions) == 2:
            score += 0.08

        # Agreement contribution
        score += (agreement_score - 0.5) * 0.15

        if score >= 0.65:
            return "high"
        elif score >= 0.40:
            return "medium"
        else:
            return "low"

    def fuse(
        self,
        modality_distributions: Dict[str, Dict[str, float]],
        custom_weights: Optional[Dict[str, float]] = None,
    ) -> Tuple[str, float, Dict[str, float], Dict[str, float], float, bool, bool, str, str]:
        """
        Executes Late Fusion.
        Returns:
          (final_emotion, confidence, fused_probabilities, effective_weights,
           agreement_score, is_mixed_emotion, disagreement_detected, mood_category, engagement_level)
        """
        available = list(modality_distributions.keys())
        if not available:
            # Degenerate empty input case
            neutral_probs = {e: (1.0 if e == "neutral" else 0.0) for e in EMOTION_CLASSES}
            return "neutral", 0.5, neutral_probs, {}, 1.0, False, False, "neutral", "medium"

        effective_weights = self.normalize_weights(available, custom_weights)

        # Calculate weighted probability sum for each emotion class
        fused_probs = {e: 0.0 for e in EMOTION_CLASSES}
        for modality, dist in modality_distributions.items():
            w = effective_weights.get(modality, 0.0)
            for e in EMOTION_CLASSES:
                fused_probs[e] += w * dist.get(e, 0.0)

        # Normalize fused probabilities
        prob_sum = sum(fused_probs.values())
        if prob_sum > 0:
            fused_probs = {k: round(v / prob_sum, 4) for k, v in fused_probs.items()}

        # Top emotion and runner up
        sorted_emotions = sorted(fused_probs.items(), key=lambda x: x[1], reverse=True)
        top_emotion, top_prob = sorted_emotions[0]
        runner_up_emotion, runner_up_prob = sorted_emotions[1] if len(sorted_emotions) > 1 else ("neutral", 0.0)

        # Cross-modality agreement
        agreement_score = self.calculate_agreement_score(modality_distributions)

        # Conflict / Mixed emotion detection:
        # Detected if agreement is below threshold OR top two fused probabilities are within 10% of each other
        disagreement_detected = (agreement_score < self.agreement_threshold) and (len(available) > 1)
        is_mixed_emotion = disagreement_detected or ((top_prob - runner_up_prob) < 0.08 and top_prob < 0.45)

        # Overall confidence
        overall_confidence = round(float(top_prob * (0.7 + 0.3 * agreement_score)), 4)
        overall_confidence = max(0.20, min(0.99, overall_confidence))

        # Higher level category
        mood_category = MOOD_MAPPING.get(top_emotion, "neutral")

        # Engagement level
        engagement_level = self.calculate_engagement(
            top_emotion, overall_confidence, modality_distributions, agreement_score
        )

        return (
            top_emotion,
            overall_confidence,
            fused_probs,
            effective_weights,
            agreement_score,
            is_mixed_emotion,
            disagreement_detected,
            mood_category,
            engagement_level,
        )
