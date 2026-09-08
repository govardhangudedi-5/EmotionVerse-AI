import io
import logging
from typing import List, Optional, Tuple
import numpy as np

try:
    import soundfile as sf
    SOUNDFILE_AVAILABLE = True
except ImportError:
    sf = None
    SOUNDFILE_AVAILABLE = False

logger = logging.getLogger(__name__)


def load_audio_from_bytes(file_bytes: bytes) -> Tuple[Optional[np.ndarray], int]:
    """
    Decodes audio bytes into float32 numpy array and sample rate.
    Supports WAV, FLAC, OGG, etc.
    """
    if not SOUNDFILE_AVAILABLE:
        logger.warning("soundfile library not installed. Falling back to synthetic signal.")
        return None, 16000

    try:
        with io.BytesIO(file_bytes) as bio:
            data, sr = sf.read(bio, dtype="float32")
            if data.ndim > 1:
                data = np.mean(data, axis=1)
            return data, sr
    except Exception as e:
        logger.error(f"Error decoding audio with soundfile: {e}")
        # Try raw PCM fallback if header failed
        try:
            pcm_data = np.frombuffer(file_bytes, dtype=np.int16).astype(np.float32) / 32768.0
            if len(pcm_data) > 1000:
                return pcm_data, 16000
        except Exception:
            pass
        return None, 16000


def extract_waveform_points(samples: np.ndarray, num_points: int = 80) -> List[float]:
    """
    Downsamples audio signal to a fixed number of normalized peak energy points
    for frontend audio waveform visualization.
    """
    if samples is None or len(samples) == 0:
        return [0.1] * num_points

    abs_samples = np.abs(samples)
    chunk_size = max(1, len(abs_samples) // num_points)
    points = []

    for i in range(num_points):
        chunk = abs_samples[i * chunk_size : (i + 1) * chunk_size]
        if len(chunk) > 0:
            peak = float(np.max(chunk))
        else:
            peak = 0.05
        points.append(round(min(1.0, max(0.05, peak)), 3))

    return points
