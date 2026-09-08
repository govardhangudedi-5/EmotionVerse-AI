import logging
from typing import Optional
import numpy as np

from ..config import settings
from ..models.audio_model import AudioEmotionModel
from ..schemas.emotion import AudioAnalysisResponse, MoodCategory
from ..utils.audio_utils import extract_waveform_points, load_audio_from_bytes

logger = logging.getLogger(__name__)


class AudioEmotionService:
    def __init__(self):
        self.model = AudioEmotionModel()

    def analyze_audio_bytes(self, audio_bytes: bytes) -> AudioAnalysisResponse:
        """Processes raw audio bytes from microphone recording or uploaded sound file."""
        try:
            samples, sr = load_audio_from_bytes(audio_bytes)
            if samples is None or len(samples) == 0:
                return self._fallback_response("Unable to decode audio format. Supported formats: WAV, FLAC, OGG.")

            # Extract waveform bars for UI audio visualizer
            waveform_points = extract_waveform_points(samples, num_points=80)
            duration = float(len(samples) / sr)

            # Preprocess acoustic features
            features = self.model.preprocess((samples, sr))
            probabilities = self.model.get_probabilities(features)
            top_emotion, confidence = self.model.predict(features)

            mood_category = MoodCategory(self.model.get_mood(top_emotion))

            return AudioAnalysisResponse(
                modality="audio",
                emotion=top_emotion,
                confidence=confidence,
                probabilities=probabilities,
                mood_category=mood_category,
                waveform_points=waveform_points,
                duration_seconds=round(duration, 2),
                sample_rate=sr,
                pitch_estimate=round(features.get("pitch_mean", 160.0), 1),
                energy_level=round(features.get("rms_energy", 0.05), 3),
                is_fallback=self.model.is_fallback,
                model_name=self.model.model_name,
                metadata={
                    "zero_crossing_rate": round(features.get("zcr", 0.0), 4),
                    "spectral_centroid": round(features.get("spectral_centroid", 1000.0), 1),
                },
            )
        except Exception as e:
            logger.error(f"Error analyzing audio: {e}")
            return self._fallback_response(f"Audio analysis error: {str(e)}")

    def _fallback_response(self, error_msg: str) -> AudioAnalysisResponse:
        probs = {
            "neutral": 0.40, "happy": 0.15, "sad": 0.15,
            "angry": 0.10, "fear": 0.10, "surprise": 0.05, "disgust": 0.05
        }
        return AudioAnalysisResponse(
            modality="audio",
            emotion="neutral",
            confidence=0.50,
            probabilities=probs,
            mood_category=MoodCategory.NEUTRAL,
            waveform_points=[0.1] * 80,
            duration_seconds=0.0,
            sample_rate=16000,
            pitch_estimate=160.0,
            energy_level=0.05,
            is_fallback=True,
            model_name="Fallback-Audio-Pipeline",
            metadata={"error": error_msg},
        )
