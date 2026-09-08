import base64
import io
import logging
from typing import Optional, Tuple
import numpy as np

try:
    import cv2
    OPENCV_AVAILABLE = True
except ImportError:
    cv2 = None
    OPENCV_AVAILABLE = False

logger = logging.getLogger(__name__)


def decode_base64_image(base64_str: str) -> Optional[np.ndarray]:
    """Decodes a base64 string (with or without data URI scheme) to an OpenCV BGR image."""
    try:
        if "," in base64_str:
            base64_str = base64_str.split(",", 1)[1]
        image_bytes = base64.b64decode(base64_str)
        nparr = np.frombuffer(image_bytes, np.uint8)
        if OPENCV_AVAILABLE:
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            return img
        return None
    except Exception as e:
        logger.error(f"Failed to decode base64 image: {e}")
        return None


def encode_image_to_base64(img_bgr: np.ndarray, format: str = ".jpg") -> Optional[str]:
    """Encodes an OpenCV BGR image into a base64 data URI string."""
    if not OPENCV_AVAILABLE or img_bgr is None:
        return None
    try:
        success, encoded_img = cv2.imencode(format, img_bgr)
        if not success:
            return None
        b64_str = base64.b64encode(encoded_img).decode("utf-8")
        return f"data:image/jpeg;base64,{b64_str}"
    except Exception as e:
        logger.error(f"Failed to encode image to base64: {e}")
        return None


def draw_detection_overlay(
    img_bgr: np.ndarray,
    bbox: Tuple[int, int, int, int],
    label: str,
    confidence: float,
) -> np.ndarray:
    """Draws a stylish bounding box and emotion label on the face image."""
    if not OPENCV_AVAILABLE or img_bgr is None or bbox is None:
        return img_bgr

    annotated = img_bgr.copy()
    x, y, w, h = bbox

    # Cyberpunk / Neon Teal color (BGR: 255, 200, 0)
    color = (255, 200, 0)
    thickness = 2
    corner_len = int(min(w, h) * 0.2)

    # Base rectangle
    cv2.rectangle(annotated, (x, y), (x + w, y + h), (60, 60, 60), 1)

    # Highlighted corners
    # Top-left
    cv2.line(annotated, (x, y), (x + corner_len, y), color, thickness)
    cv2.line(annotated, (x, y), (x, y + corner_len), color, thickness)
    # Top-right
    cv2.line(annotated, (x + w, y), (x + w - corner_len, y), color, thickness)
    cv2.line(annotated, (x + w, y), (x + w, y + corner_len), color, thickness)
    # Bottom-left
    cv2.line(annotated, (x, y + h), (x + corner_len, y + h), color, thickness)
    cv2.line(annotated, (x, y + h), (x, y + h - corner_len), color, thickness)
    # Bottom-right
    cv2.line(annotated, (x + w, y + h), (x + w - corner_len, y + h), color, thickness)
    cv2.line(annotated, (x + w, y + h), (x + w, y + h - corner_len), color, thickness)

    # Label text banner
    text = f"{label.upper()} ({confidence * 100:.1f}%)"
    font = cv2.FONT_HERSHEY_SIMPLEX
    font_scale = 0.55
    text_size, _ = cv2.getTextSize(text, font, font_scale, 1)
    
    text_bg_y1 = max(0, y - text_size[1] - 8)
    text_bg_y2 = y
    cv2.rectangle(annotated, (x, text_bg_y1), (x + text_size[0] + 10, text_bg_y2), (20, 20, 30), cv2.FILLED)
    cv2.putText(
        annotated,
        text,
        (x + 5, y - 5),
        font,
        font_scale,
        color,
        1,
        cv2.LINE_AA,
    )

    return annotated
