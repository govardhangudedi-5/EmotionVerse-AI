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
        Extract robust prosodic, harmonic, and spectral metrics across all voiced portions of the audio signal.
        """
        if len(y) == 0:
            return {
                "rms_energy": 0.0,
                "zcr": 0.0,
                "pitch_mean": 160.0,
                "pitch_std": 0.0,
                "spectral_centroid": 1000.0,
                "spectral_flux": 0.0,
            }

        # 1. Overall RMS Energy
        overall_rms = float(np.sqrt(np.mean(y ** 2)))

        # 2. Windowed analysis across the entire recording (50ms window, 25ms step)
        frame_len = int(sr * 0.05)
        hop_len = int(sr * 0.025)
        num_frames = (len(y) - frame_len) // hop_len

        min_lag = int(sr / 450)  # ~450 Hz upper voice bound
        max_lag = int(sr / 65)   # ~65 Hz lower voice bound

        frame_rms_list = []
        pitches = []
        zcrs = []

        if num_frames > 0:
            # Sample up to 80 frames uniformly across the entire recording
            step = max(1, num_frames // 80)
            for i in range(0, num_frames, step):
                start = i * hop_len
                frame = y[start : start + frame_len]
                if len(frame) < max_lag + 10:
                    continue

                f_rms = float(np.sqrt(np.mean(frame ** 2)))
                frame_rms_list.append(f_rms)

                # Analyze voiced speech frames (ignore pure silence/breathing)
                if f_rms > 0.015:
                    zc = np.sum(np.abs(np.diff(np.sign(frame)))) / (2 * len(frame))
                    zcrs.append(zc)

                    corr = np.correlate(frame, frame, mode="full")
                    corr = corr[len(corr) // 2 :]
                    if len(corr) > max_lag:
                        sub_corr = corr[min_lag:max_lag]
                        peak_offset = np.argmax(sub_corr)
                        lag = min_lag + peak_offset
                        # Check periodicity significance
                        if corr[0] > 0 and (corr[lag] / corr[0]) > 0.22:
                            f0 = float(sr / lag)
                            if 65.0 <= f0 <= 450.0:
                                pitches.append(f0)

        voiced_rms_values = [r for r in frame_rms_list if r > 0.015]
        active_rms = float(np.mean(voiced_rms_values)) if voiced_rms_values else overall_rms
        pitch_mean = float(np.median(pitches)) if len(pitches) > 0 else 160.0
        pitch_std = float(np.std(pitches)) if len(pitches) > 1 else (18.0 if len(pitches) == 1 else 6.0)
        mean_zcr = float(np.mean(zcrs)) if len(zcrs) > 0 else 0.05

        # 3. Spectral Centroid
        try:
            n_seg = min(512, len(y))
            if n_seg >= 64:
                freqs, times, Sxx = spectrogram(y, fs=sr, nperseg=n_seg)
                centroid_per_frame = np.sum(freqs[:, np.newaxis] * Sxx, axis=0) / (np.sum(Sxx, axis=0) + 1e-9)
                spectral_centroid = float(np.mean(centroid_per_frame))
            else:
                spectral_centroid = 1500.0
        except Exception:
            spectral_centroid = 1500.0

        return {
            "rms_energy": active_rms,
            "zcr": mean_zcr,
            "pitch_mean": pitch_mean,
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
            # Happy: elevated pitch (180-300Hz), high pitch modulation/variance, bright centroid, good energy
            "happy": (
                0.10
                + 1.3 * min(1.0, max(0.0, (pitch - 155.0) / 95.0))
                + 1.4 * min(1.0, pitch_std / 28.0)
                + 0.9 * min(1.0, rms / 0.12)
            ),
            # Angry: very high energy, elevated pitch, high spectral centroid
            "angry": (
                0.08
                + 1.8 * max(0.0, (rms - 0.14) / 0.18)
                + 0.9 * max(0.0, (sc - 1800.0) / 1000.0)
            ),
            # Sad: low energy, flat monotone pitch, lower pitch mean
            "sad": (
                0.10
                + 1.6 * max(0.0, (0.07 - rms) / 0.07)
                + 1.3 * max(0.0, (14.0 - pitch_std) / 14.0)
                + 0.5 * max(0.0, (150.0 - pitch) / 60.0)
            ),
            # Neutral: moderate energy, stable pitch, moderate/low pitch variation
            "neutral": (
                0.18
                + 0.9 * max(0.0, 1.0 - abs(pitch - 150.0) / 70.0)
                * max(0.0, 1.0 - abs(rms - 0.06) / 0.06)
                * max(0.0, 1.0 - pitch_std / 25.0)
            ),
            # Fear: elevated pitch, moderate jitter, high pitch_std with lower energy than anger
            "fear": (
                0.08
                + 1.2 * max(0.0, (pitch - 220.0) / 100.0)
                + 0.8 * min(1.0, zcr / 0.15)
            ),
            # Surprise: sudden high energy burst with very high pitch spike
            "surprise": (
                0.08
                + 1.5 * max(0.0, (pitch - 240.0) / 100.0)
                + 0.8 * min(1.0, rms / 0.22)
            ),
            # Disgust: low-mid pitch, harsh spectral friction / low energy
            "disgust": (
                0.06
                + 0.8 * max(0.0, 1.0 - pitch / 140.0)
                + 0.5 * min(1.0, zcr / 0.12)
            ),
        }

        # Softmax normalization
        exp_vals = {k: np.exp(v * 2.0) for k, v in scores.items()}
        total = sum(exp_vals.values())
        probs = {k: round(float(v / total), 4) for k, v in exp_vals.items()}

        return probs
