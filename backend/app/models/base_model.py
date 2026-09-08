from abc import ABC, abstractmethod
from typing import Any, Dict, Tuple


# Standard canonical 7 emotion categories
EMOTION_CLASSES = ["happy", "sad", "angry", "fear", "surprise", "disgust", "neutral"]

# Higher-level mood mapping
MOOD_MAPPING = {
    "happy": "positive",
    "surprise": "positive",
    "neutral": "neutral",
    "sad": "negative",
    "angry": "negative",
    "fear": "negative",
    "disgust": "negative",
}


class BaseEmotionModel(ABC):
    """
    Abstract Base Class for Emotion Detection Models across all modalities.
    Enables plug-and-play architecture for swapping in trained deep neural networks
    (e.g., PyTorch ResNet/ViT, Hugging Face BERT/RoBERTa, Wav2Vec2/AST) or lightweight pipelines.
    """

    def __init__(self, model_name: str = "BaseModel"):
        self.model_name = model_name
        self.is_loaded = False
        self.is_fallback = False
        self.load_model()

    @abstractmethod
    def load_model(self) -> None:
        """Load pretrained weights, neural network architectures, or fallback pipelines."""
        pass

    @abstractmethod
    def preprocess(self, raw_input: Any) -> Any:
        """Preprocess raw incoming modality data (e.g. normalize image, compute MFCCs, tokenize text)."""
        pass

    @abstractmethod
    def predict(self, features: Any) -> Tuple[str, float]:
        """
        Run inference on preprocessed features.
        Returns:
            Tuple of (predicted_emotion_label, confidence_score)
        """
        pass

    @abstractmethod
    def get_probabilities(self, features: Any) -> Dict[str, float]:
        """
        Compute softmax or normalized probability distribution across all 7 standard emotions.
        Returns:
            Dict mapping each emotion name (e.g., 'happy', 'sad') to probability in [0.0, 1.0].
        """
        pass

    def get_mood(self, emotion: str) -> str:
        """Map predicted emotion to higher-level mood category: positive, neutral, negative."""
        return MOOD_MAPPING.get(emotion.lower(), "neutral")
