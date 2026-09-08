import logging
from typing import Optional
import numpy as np

try:
    import cv2
except ImportError:
    cv2 = None

from ..config import settings
from ..models.face_model import FaceEmotionModel
from ..schemas.emotion import FaceAnalysisResponse, FaceBoundingBox, MoodCategory
from ..utils.image_utils import decode_base64_image, draw_detection_overlay, encode_image_to_base64

logger = logging.getLogger(__name__)


class FaceEmotionService:
    def __init__(self):
        self.model = FaceEmotionModel()

    def analyze_image_bytes(self, image_bytes: bytes) -> FaceAnalysisResponse:
        """Processes raw image bytes from an uploaded multipart file."""
        try:
            nparr = np.frombuffer(image_bytes, np.uint8)
            img_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            return self._process_cv_image(img_bgr)
        except Exception as e:
            logger.error(f"Error processing image bytes: {e}")
            return self._fallback_response(f"Image decoding error: {str(e)}")

    def analyze_base64(self, image_base64: str) -> FaceAnalysisResponse:
        """Processes base64 encoded image string from webcam snapshot."""
        try:
            img_bgr = decode_base64_image(image_base64)
            if img_bgr is None:
                return self._fallback_response("Could not decode base64 image data")
            return self._process_cv_image(img_bgr)
        except Exception as e:
            logger.error(f"Error processing base64 image: {e}")
            return self._fallback_response(f"Base64 error: {str(e)}")

    def _process_cv_image(self, img_bgr: np.ndarray) -> FaceAnalysisResponse:
        if img_bgr is None:
            return self._fallback_response("Invalid or empty image matrix")

        # Detect face
        face_bbox = self.model.detect_face(img_bgr)
        face_detected = face_bbox is not None

        if face_detected:
            x, y, w, h = face_bbox
            face_roi = img_bgr[y : y + h, x : x + w]
            probabilities = self.model.get_probabilities(face_roi)
            top_emotion, confidence = self.model.predict(face_roi)

            # Draw overlay bounding box on the image
            annotated_img = draw_detection_overlay(img_bgr, face_bbox, top_emotion, confidence)
            processed_b64 = encode_image_to_base64(annotated_img)

            bbox_obj = FaceBoundingBox(x=x, y=y, width=w, height=h)
            mood_category = MoodCategory(self.model.get_mood(top_emotion))

            return FaceAnalysisResponse(
                modality="face",
                emotion=top_emotion,
                confidence=confidence,
                probabilities=probabilities,
                mood_category=mood_category,
                face_detected=True,
                bounding_box=bbox_obj,
                processed_image_base64=processed_b64,
                is_fallback=self.model.is_fallback,
                model_name=self.model.model_name,
                metadata={
                    "resolution": f"{img_bgr.shape[1]}x{img_bgr.shape[0]}",
                    "face_area": w * h,
                },
            )
        else:
            # When no face is detected in the frame, return gentle neutral distribution
            probs = self.model.get_probabilities(None)
            top_emotion = "neutral"
            confidence = 0.50
            annotated_b64 = encode_image_to_base64(img_bgr)

            return FaceAnalysisResponse(
                modality="face",
                emotion=top_emotion,
                confidence=confidence,
                probabilities=probs,
                mood_category=MoodCategory.NEUTRAL,
                face_detected=False,
                bounding_box=None,
                processed_image_base64=annotated_b64,
                is_fallback=True,
                model_name=self.model.model_name,
                metadata={"note": "No frontal face detected in input frame"},
            )

    def _fallback_response(self, error_msg: str) -> FaceAnalysisResponse:
        probs = {
            "neutral": 0.50, "happy": 0.10, "sad": 0.10,
            "surprise": 0.10, "fear": 0.10, "angry": 0.05, "disgust": 0.05
        }
        return FaceAnalysisResponse(
            modality="face",
            emotion="neutral",
            confidence=0.50,
            probabilities=probs,
            mood_category=MoodCategory.NEUTRAL,
            face_detected=False,
            bounding_box=None,
            processed_image_base64=None,
            is_fallback=True,
            model_name="Fallback-Face-Pipeline",
            metadata={"error": error_msg},
        )
