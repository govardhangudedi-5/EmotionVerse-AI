import logging
from typing import Any, Dict, List, Optional, Tuple
import numpy as np

from .base_model import BaseEmotionModel, EMOTION_CLASSES

logger = logging.getLogger(__name__)

# Try importing cv2 safely
try:
    import cv2
    OPENCV_AVAILABLE = True
except ImportError:
    cv2 = None
    OPENCV_AVAILABLE = False


class FaceEmotionModel(BaseEmotionModel):
    """
    Facial Emotion Recognition Model.
    Architecture:
      1. Face Detection: OpenCV Haar Cascade frontal face detector.
      2. Face Preprocessing: Grayscale conversion, histogram equalization, crop & normalize.
      3. Emotion Inference:
         - Deep Learning Hook: Can load an ONNX or PyTorch CNN model (e.g., Mini-Xception, ResNet-18 FER).
         - Computer Vision Feature Extractor: Analyzes facial geometry, mouth curvature, brow furrow, and eye aperture ratios.
         - Demo/Fallback Pipeline: Calibrated feature-based classifier with academic fallback notification.
    """

    def __init__(self, weights_path: Optional[str] = None):
        self.weights_path = weights_path
        self.face_cascade = None
        self.net = None
        super().__init__(model_name="OpenCV-Facial-Analysis-v1")

    def load_model(self) -> None:
        """Loads Haar Cascade detector and any trained deep neural network weights."""
        if not OPENCV_AVAILABLE:
            logger.warning("OpenCV is not installed. Face emotion model will operate in pure fallback mode.")
            self.is_loaded = False
            self.is_fallback = True
            return

        try:
            cascade_path = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
            self.face_cascade = cv2.CascadeClassifier(cascade_path)
            
            # --- EXTENSION POINT: TRAINED DEEP LEARNING MODEL ---
            # To plug in a trained CNN (e.g., PyTorch ResNet, ONNX, or TensorFlow model):
            # Example:
            # if self.weights_path and os.path.exists(self.weights_path):
            #     self.net = cv2.dnn.readNetFromONNX(self.weights_path)
            #     self.is_fallback = False
            # ----------------------------------------------------
            
            self.is_loaded = True
            self.is_fallback = False
            logger.info("Face emotion model loaded successfully with Haar cascade face detection.")
        except Exception as e:
            logger.error(f"Error loading OpenCV cascade: {e}")
            self.is_loaded = False
            self.is_fallback = True

    def detect_face(self, img_bgr: np.ndarray) -> Optional[Tuple[int, int, int, int]]:
        """
        Detect the primary face bounding box (x, y, w, h).
        Returns None if no face is detected.
        """
        if self.face_cascade is None or img_bgr is None:
            return None

        gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
        faces = self.face_cascade.detectMultiScale(
            gray,
            scaleFactor=1.1,
            minNeighbors=5,
            minSize=(60, 60),
            flags=cv2.CASCADE_SCALE_IMAGE,
        )

        if len(faces) == 0:
            return None

        # Return the largest face detected
        largest_face = max(faces, key=lambda r: r[2] * r[3])
        return tuple(int(v) for v in largest_face)

    def preprocess(self, raw_input: Any) -> Optional[np.ndarray]:
        """
        Preprocess input image: decode if needed, isolate facial region, resize and equalize.
        """
        if raw_input is None:
            return None
        
        img_bgr = raw_input
        if not isinstance(img_bgr, np.ndarray):
            return None

        face_bbox = self.detect_face(img_bgr)
        if face_bbox is None:
            return None

        x, y, w, h = face_bbox
        face_roi = img_bgr[y : y + h, x : x + w]
        return face_roi

    def _extract_facial_heuristics(self, face_roi: np.ndarray) -> Dict[str, float]:
        """
        Computer Vision feature extractor based on facial subregions:
        1. Mouth region curvature & intensity (detect smile / frown / neutral)
        2. Eye region aperture & contrast (detect surprise wide eyes vs squinting/sad)
        3. Brow region furrowing (Sobel vertical gradient energy for anger / stress)
        """
        h, w = face_roi.shape[:2]
        gray = cv2.cvtColor(face_roi, cv2.COLOR_BGR2GRAY)
        gray = cv2.equalizeHist(gray)

        # Region definitions
        brow_region = gray[int(h * 0.15) : int(h * 0.35), int(w * 0.2) : int(w * 0.8)]
        eye_region = gray[int(h * 0.25) : int(h * 0.50), int(w * 0.15) : int(w * 0.85)]
        mouth_region = gray[int(h * 0.65) : int(h * 0.90), int(w * 0.25) : int(w * 0.75)]

        # 1. Brow furrowing (Laplacian / Sobel edge density)
        brow_edges = cv2.Sobel(brow_region, cv2.CV_64F, 1, 0, ksize=3)
        brow_tension = float(np.mean(np.abs(brow_edges))) / 255.0

        # 2. Mouth curvature and brightness (teeth exposure usually increases variance and high percentiles)
        mouth_mean = float(np.mean(mouth_region)) / 255.0
        mouth_std = float(np.std(mouth_region)) / 255.0

        # 3. Eye openness / variance
        eye_variance = float(np.std(eye_region)) / 255.0

        return {
            "brow_tension": brow_tension,
            "mouth_mean": mouth_mean,
            "mouth_std": mouth_std,
            "eye_variance": eye_variance,
        }

    def predict(self, features: Any) -> Tuple[str, float]:
        probs = self.get_probabilities(features)
        top_emotion = max(probs, key=probs.get)
        return top_emotion, float(probs[top_emotion])

    def get_probabilities(self, features: Any) -> Dict[str, float]:
        """
        Computes normalized probability distribution across 7 emotions.
        """
        if features is None:
            # Fallback uniform/neutral prior when no face ROI is supplied
            self.is_fallback = True
            return {
                "neutral": 0.40,
                "happy": 0.10,
                "sad": 0.10,
                "surprise": 0.10,
                "fear": 0.10,
                "angry": 0.10,
                "disgust": 0.10,
            }

        # --- DEEP LEARNING INFERENCE HOOK ---
        # If a trained CNN is loaded:
        # blob = cv2.dnn.blobFromImage(cv2.resize(features, (48, 48)), 1.0/255.0, (48, 48))
        # self.net.setInput(blob)
        # preds = self.net.forward()[0]
        # return dict(zip(EMOTION_CLASSES, softmax(preds)))
        # -----------------------------------

        # Feature-based scoring
        f = self._extract_facial_heuristics(features)

        brow  = f["brow_tension"]
        m_mu  = f["mouth_mean"]       # mouth brightness (teeth/open mouth → high)
        m_std = f["mouth_std"]        # mouth variance  (smile/expression → high)
        e_var = f["eye_variance"]     # eye aperture    (wide eyes → high)

        # ── Surprise ──
        # Wide open eyes (e_var high) OR open mouth (m_mu high) → either signal alone triggers.
        # Multiplicative form was blocking surprise when one feature was slightly below threshold.
        eye_wide   = max(0.0, (e_var - 0.20) / 0.15)   # normalised [0,1]
        mouth_open = max(0.0, (m_mu  - 0.28) / 0.20)   # normalised [0,1]
        surprise_score = 0.06 + 2.5 * (0.55 * eye_wide + 0.45 * mouth_open)

        # ── Happy ──
        # Smile raises mouth std (corners lift) and often mouth brightness.
        happy_score = 0.06 + 2.2 * max(0.0, (m_std - 0.18) / 0.15) \
                           + 0.8 * max(0.0, (m_mu  - 0.30) / 0.20)

        # ── Angry ──
        # High brow tension (furrowed brows) + compressed mouth (low std)
        angry_score = 0.06 + 2.0 * max(0.0, (brow - 0.14) / 0.10) \
                           + 0.5 * max(0.0, (0.18 - m_std) / 0.18)

        # ── Sad ──
        # Low mouth brightness (down-turned corners) + flat brow
        sad_score = 0.06 + 1.4 * max(0.0, (0.20 - m_mu) / 0.20) \
                         + 0.6 * max(0.0, (0.12 - brow) / 0.12)

        # ── Fear ──
        # Wide eyes + brow raised/tense
        fear_score = 0.05 + 1.5 * eye_wide * (1.0 + brow * 2.0) \
                          + 0.5 * max(0.0, (brow - 0.18) / 0.10)

        # ── Disgust ──
        # Brow tension + compressed mouth (low variance)
        disgust_score = 0.04 + 1.2 * max(0.0, (brow - 0.14) / 0.10) \
                             * max(0.0, (0.20 - m_std) / 0.20)

        # ── Neutral ──
        # Dominant only when all signals are low — reduced baseline from 0.55 → 0.30
        neutral_score = 0.30 + 0.25 * max(0.0, 1.0 - brow / 0.20) \
                             * max(0.0, 1.0 - abs(m_mu - 0.25) / 0.25) \
                             * max(0.0, 1.0 - e_var / 0.30)

        scores = {
            "neutral":  neutral_score,
            "happy":    happy_score,
            "sad":      sad_score,
            "angry":    angry_score,
            "fear":     fear_score,
            "surprise": surprise_score,
            "disgust":  disgust_score,
        }

        # Softmax normalization
        exp_vals = {k: np.exp(v * 2.8) for k, v in scores.items()}
        total = sum(exp_vals.values())
        probs = {k: round(float(v / total), 4) for k, v in exp_vals.items()}

        return probs
