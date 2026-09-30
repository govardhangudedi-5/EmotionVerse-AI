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
    Supports WAV, FLAC, OGG, and uncompressed PCM streams.
    """
    if not file_bytes or len(file_bytes) == 0:
        return None, 16000

    # 1. Primary: soundfile
    if SOUNDFILE_AVAILABLE:
        try:
            with io.BytesIO(file_bytes) as bio:
                data, sr = sf.read(bio, dtype="float32")
                if data.ndim > 1:
                    data = np.mean(data, axis=1)
                return data, int(sr)
        except Exception as sf_err:
            logger.debug(f"soundfile decode attempt: {sf_err}")

    # 2. Secondary: scipy.io.wavfile
    try:
        from scipy.io import wavfile
        with io.BytesIO(file_bytes) as bio:
            sr, raw_data = wavfile.read(bio)
            if raw_data.dtype == np.int16:
                data = raw_data.astype(np.float32) / 32768.0
            elif raw_data.dtype == np.int32:
                data = raw_data.astype(np.float32) / 2147483648.0
            elif raw_data.dtype == np.uint8:
                data = (raw_data.astype(np.float32) - 128.0) / 128.0
            else:
                data = raw_data.astype(np.float32)
            if data.ndim > 1:
                data = np.mean(data, axis=1)
            return data, int(sr)
    except Exception:
        pass

    # 3. Tertiary: standard library wave module
    try:
        import wave
        with io.BytesIO(file_bytes) as bio:
            with wave.open(bio, "rb") as wf:
                sr = wf.getframerate()
                n_frames = wf.getnframes()
                sampwidth = wf.getsampwidth()
                n_channels = wf.getnchannels()
                frames = wf.readframes(n_frames)
                if sampwidth == 2:
                    data = np.frombuffer(frames, dtype=np.int16).astype(np.float32) / 32768.0
                elif sampwidth == 1:
                    data = (np.frombuffer(frames, dtype=np.uint8).astype(np.float32) - 128.0) / 128.0
                else:
                    data = np.frombuffer(frames, dtype=np.int32).astype(np.float32) / 2147483648.0

                if n_channels > 1:
                    data = data.reshape(-1, n_channels).mean(axis=1)
                return data, int(sr)
    except Exception:
        pass

    # 4. Quaternary: raw PCM fallback if header stripped
    try:
        pcm_data = np.frombuffer(file_bytes, dtype=np.int16).astype(np.float32) / 32768.0
        if len(pcm_data) > 1000:
            return pcm_data, 16000
    except Exception:
        pass

    logger.warning("Could not decode audio with any available decoder.")
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
