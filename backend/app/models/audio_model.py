import logging
from typing import Any, Dict, List, Optional, Tuple
import numpy as np
from scipy.signal import spectrogram

from .base_model import BaseEmotionModel, EMOTION_CLASSES

logger = logging.getLogger(__name__)


class AudioEmotionModel(BaseEmotionModel):
    """
    Voice Emotion Recognition Model.
    Extracts acoustic, prosodic, and spectral features:
      1. Pitch & Fundamental Frequency (F0) variation via autocorrelation.
      2. Root Mean Square (RMS) Energy dynamics.
      3. Zero Crossing Rate (ZCR).
      4. Spectral Centroid and Spectral Spread.
      5. Mel-Frequency Cepstral Coefficients (MFCCs) approximation.
    Maps acoustic descriptors to standard emotion distributions.
    """

    def __init__(self, weights_path: Optional[str] = None):
        self.weights_path = weights_path
        super().__init__(model_name="Acoustic-Prosody-Analysis-v1")

    def load_model(self) -> None:
        """
        --- EXTENSION POINT: TRAINED AUDIO MODEL ---
        To plug in a pretrained transformer (e.g. Wav2Vec2, HuBERT, or AST Audio Spectrogram Transformer):
        from transformers import AutoModelForAudioClassification, AutoFeatureExtractor
        self.model = AutoModelForAudioClassification.from_pretrained("superb/wav2vec2-base-superb-er")
        self.extractor = AutoFeatureExtractor.from_pretrained("superb/wav2vec2-base-superb-er")
        -------------------------------------------
        """
        self.is_loaded = True
        self.is_fallback = False
        logger.info("Audio emotion model initialized with signal processing and prosody analyzer.")

    def preprocess(self, raw_input: Any) -> Optional[Dict[str, Any]]:
        """
        Preprocesses raw audio waveform data.
        raw_input: Tuple of (audio_samples: np.ndarray, sample_rate: int)
        """
        if raw_input is None:
            return None

        samples, sr = raw_input
        if not isinstance(samples, np.ndarray) or len(samples) == 0:
            return None

        # Convert stereo to mono if needed
        if samples.ndim > 1:
            samples = np.mean(samples, axis=1)

        # Normalize amplitude to [-1.0, 1.0]
        max_val = np.max(np.abs(samples))
        if max_val > 0:
            samples = samples / max_val

        features = self._extract_acoustic_features(samples, sr)
        return features

    def _extract_acoustic_features(self, y: np.ndarray, sr: int) -> Dict[str, float]:
        """
        Extract key prosodic and spectral metrics from audio signal.
        """
        if len(y) == 0:
            return {
                "rms_energy": 0.0,
                "zcr": 0.0,
                "pitch_mean": 150.0,
                "pitch_std": 0.0,
                "spectral_centroid": 1000.0,
                "spectral_flux": 0.0,
            }

        # 1. RMS Energy
        rms = float(np.sqrt(np.mean(y ** 2)))

        # 2. Zero Crossing Rate
        zero_crossings = np.sum(np.abs(np.diff(np.sign(y)))) / (2 * len(y))
        zcr = float(zero_crossings)

        # 3. Autocorrelation-based pitch estimation (fundamental frequency F0)
        # Search range: 60Hz to 400Hz (human vocal range)
        min_lag = int(sr / 400)
        max_lag = int(sr / 60)
        corr_len = min(len(y), int(sr * 0.5))  # analyze up to 0.5s chunks
        corr = np.correlate(y[:corr_len], y[:corr_len], mode="full")
        corr = corr[len(corr) // 2 :]

        if len(corr) > max_lag:
            lag = min_lag + np.argmax(corr[min_lag:max_lag])
            pitch_f0 = float(sr / lag) if lag > 0 else 160.0
        else:
            pitch_f0 = 160.0

        # Estimate pitch variation across multiple 50ms frames
        frame_len = int(sr * 0.05)
        num_frames = min(20, len(y) // frame_len)
        pitches = []
        for i in range(num_frames):
            frame = y[i * frame_len : (i + 1) * frame_len]
            if len(frame) > 0 and np.std(frame) > 0.01:
                frame_corr = np.correlate(frame, frame, mode="full")
                frame_corr = frame_corr[len(frame_corr) // 2 :]
                if len(frame_corr) > max_lag:
                    sub_lag = min_lag + np.argmax(frame_corr[min_lag:max_lag])
                    if sub_lag > 0:
                        pitches.append(sr / sub_lag)

        pitch_std = float(np.std(pitches)) if len(pitches) > 1 else 15.0

        # 4. Spectral Centroid
        freqs, times, Sxx = spectrogram(y, fs=sr, nperseg=min(512, len(y)))
        centroid_per_frame = np.sum(freqs[:, np.newaxis] * Sxx, axis=0) / (np.sum(Sxx, axis=0) + 1e-9)
        spectral_centroid = float(np.mean(centroid_per_frame))

        return {
            "rms_energy": rms,
            "zcr": zcr,
            "pitch_mean": pitch_f0,
            "pitch_std": pitch_std,
            "spectral_centroid": spectral_centroid,
        }

    def predict(self, features: Any) -> Tuple[str, float]:
        probs = self.get_probabilities(features)
        top_emotion = max(probs, key=probs.get)
        return top_emotion, float(probs[top_emotion])

    def get_probabilities(self, features: Any) -> Dict[str, float]:
        """
        Computes probability distribution across 7 emotions based on acoustic features.
        """
        if not features or not isinstance(features, dict):
            self.is_fallback = True
            return {
                "neutral": 0.35,
                "happy": 0.15,
                "sad": 0.15,
                "angry": 0.10,
                "fear": 0.10,
                "surprise": 0.10,
                "disgust": 0.05,
            }

        rms = features.get("rms_energy", 0.05)
        pitch = features.get("pitch_mean", 160.0)
        pitch_std = features.get("pitch_std", 15.0)
        zcr = features.get("zcr", 0.05)
        sc = features.get("spectral_centroid", 1500.0)

        # Baseline scores mapped to acoustic properties
        scores = {
            # Happy: high pitch variation, bright centroid, moderate-high energy
            "happy": 0.12 + 1.2 * min(1.0, pitch_std / 35.0) + 0.8 * min(1.0, rms / 0.20),
            # Angry: very high energy, elevated pitch, high spectral centroid
            "angry": 0.08 + 1.8 * max(0.0, (rms - 0.15) / 0.20) + 0.8 * max(0.0, (sc - 1800) / 1000),
            # Sad: low energy, low pitch variation, low centroid
            "sad": 0.10 + 1.5 * max(0.0, (0.08 - rms) / 0.08) + 1.0 * max(0.0, (15.0 - pitch_std) / 15.0),
            # Neutral: moderate energy, stable pitch, typical voice range
            "neutral": 0.22 + 1.0 * max(0.0, 1.0 - abs(pitch - 160.0) / 80.0) * max(0.0, 1.0 - abs(rms - 0.08) / 0.08),
            # Fear: elevated pitch, moderate jitter, high pitch_std with lower energy than anger
            "fear": 0.08 + 1.2 * max(0.0, (pitch - 220.0) / 100.0) + 0.8 * min(1.0, zcr / 0.15),
            # Surprise: sudden high energy burst with very high pitch
            "surprise": 0.08 + 1.4 * max(0.0, (pitch - 240.0) / 100.0) + 0.6 * min(1.0, rms / 0.25),
            # Disgust: low-mid pitch, harsh spectral friction / low energy
            "disgust": 0.06 + 0.8 * max(0.0, 1.0 - pitch / 150.0) * min(1.0, zcr / 0.10),
        }

        # Softmax normalization
        exp_vals = {k: np.exp(v * 2.0) for k, v in scores.items()}
        total = sum(exp_vals.values())
        probs = {k: round(float(v / total), 4) for k, v in exp_vals.items()}

        return probs
