import logging
import re
from typing import Any, Dict, List, Optional, Tuple
import numpy as np

from .base_model import BaseEmotionModel, EMOTION_CLASSES

logger = logging.getLogger(__name__)

# Comprehensive emotion keyword and phrase lexicon calibrated for academic NLP tasks
EMOTION_LEXICONS = {
    "happy": {
        "happy", "joy", "excited", "delighted", "glad", "wonderful", "amazing", "great", "fantastic",
        "love", "pleased", "cheerful", "optimistic", "proud", "content", "thrilled", "blessed", "enjoy",
        "fun", "awesome", "celebrate", "laugh", "smiling", "success", "victorious", "radiant", "elated"
    },
    "sad": {
        "sad", "depressed", "unhappy", "sorrow", "grief", "heartbroken", "down", "lonely", "hopeless",
        "miserable", "crying", "tear", "gloomy", "melancholy", "regret", "disappointed", "hurting", "lost",
        "empty", "despair", "blue", "mourning", "defeated", "downcast", "heavyhearted", "exhausted"
    },
    "angry": {
        "angry", "mad", "furious", "outraged", "irritated", "annoyed", "pissed", "rage", "hostile",
        "bitter", "resentful", "hate", "frustrated", "infuriated", "fuming", "agitated", "provoked",
        "disgusted", "indignant", "offended", "wrath", "screaming", "hateful", "aggravated"
    },
    "fear": {
        "fear", "afraid", "scared", "terrified", "anxious", "anxiety", "worried", "panic", "stress",
        "stressed", "nervous", "dread", "frightened", "horrified", "tense", "alarmed", "apprehensive",
        "jittery", "petrified", "uneasy", "intimidation", "overwhelmed", "exam", "exams", "pressure"
    },
    "surprise": {
        "surprise", "surprised", "shocked", "amazed", "astonished", "stunned", "unexpected", "unbelievable",
        "speechless", "startled", "flabbergasted", "wow", "unreal", "staggering", "eye-opening"
    },
    "disgust": {
        "disgust", "disgusted", "gross", "revolting", "nauseated", "repulsed", "sickening", "vile",
        "distasteful", "nasty", "abhorrent", "loathsome", "foul", "offensive", "cringe"
    },
    "neutral": {
        "okay", "fine", "normal", "average", "standard", "routine", "neutral", "indifferent", "alright",
        "moderate", "ordinary", "regular", "common", "usual", "fair", "plain", "typical"
    },
}

INTENSIFIERS = {
    "very": 1.5, "extremely": 2.0, "so": 1.3, "really": 1.4, "incredibly": 1.8,
    "super": 1.5, "deeply": 1.6, "immensely": 1.8, "terribly": 1.7, "totally": 1.4
}

NEGATORS = {"not", "never", "no", "hardly", "barely", "scarcely", "without"}


class TextEmotionModel(BaseEmotionModel):
    """
    Text-based Emotion Analysis Model.
    Architecture:
      1. Preprocessing: Tokenization, negation handling, intensifier detection.
      2. Semantic Lexicon & Valence Scoring: Computes energy distribution across 7 emotion dimensions.
      3. Deep Transformer Pipeline Hook: Ready for Hugging Face distilbert-base-uncased-emotion.
    """

    def __init__(self, model_name_or_path: Optional[str] = None):
        self.transformer_pipeline = None
        super().__init__(model_name="NLP-Semantic-Emotion-v1")

    def load_model(self) -> None:
        """
        --- EXTENSION POINT: HUGGING FACE TRANSFORMER PIPELINE ---
        To load a full deep learning Transformer:
        try:
            from transformers import pipeline
            self.transformer_pipeline = pipeline(
                "text-classification",
                model="bhadresh-psavani/distilbert-base-uncased-emotion",
                top_k=None
            )
            self.model_name = "DistilBERT-Emotion-Transformer"
            self.is_loaded = True
            self.is_fallback = False
            return
        except Exception:
            pass
        ----------------------------------------------------------
        """
        self.is_loaded = True
        self.is_fallback = False
        logger.info("Text emotion model loaded with semantic valence-arousal lexicon.")

    def preprocess(self, raw_input: Any) -> Tuple[List[str], str]:
        """Cleans input string, removes special chars, splits tokens."""
        if not isinstance(raw_input, str):
            raw_input = str(raw_input or "")
        
        cleaned = raw_input.lower().strip()
        tokens = re.findall(r"\b[a-z']+\b", cleaned)
        return tokens, cleaned

    def compute_polarity(self, tokens: List[str]) -> float:
        """Computes approximate sentiment polarity score between -1.0 and +1.0."""
        pos_words = EMOTION_LEXICONS["happy"] | EMOTION_LEXICONS["surprise"]
        neg_words = EMOTION_LEXICONS["sad"] | EMOTION_LEXICONS["angry"] | EMOTION_LEXICONS["fear"] | EMOTION_LEXICONS["disgust"]

        pos_count = sum(1 for t in tokens if t in pos_words)
        neg_count = sum(1 for t in tokens if t in neg_words)
        total = pos_count + neg_count

        if total == 0:
            return 0.0
        return round((pos_count - neg_count) / total, 3)

    def predict(self, features: Any) -> Tuple[str, float]:
        probs = self.get_probabilities(features)
        top_emotion = max(probs, key=probs.get)
        return top_emotion, float(probs[top_emotion])

    def get_probabilities(self, features: Any) -> Dict[str, float]:
        """
        Computes probability distribution across 7 emotions.
        features: Tuple of (tokens, raw_text) or raw text string.
        """
        if isinstance(features, tuple):
            tokens, raw_text = features
        else:
            tokens, raw_text = self.preprocess(features)

        # Baseline uniform / neutral prior
        base_scores = {
            "happy": 0.05,
            "sad": 0.05,
            "angry": 0.05,
            "fear": 0.05,
            "surprise": 0.05,
            "disgust": 0.05,
            "neutral": 0.15,
        }

        multiplier = 1.0
        is_negated = False

        for i, word in enumerate(tokens):
            if word in NEGATORS:
                is_negated = True
                continue

            if word in INTENSIFIERS:
                multiplier = INTENSIFIERS[word]
                continue

            for emotion, keywords in EMOTION_LEXICONS.items():
                if word in keywords:
                    weight = 1.0 * multiplier
                    if is_negated:
                        # Inverting meaning shifts toward neutral/opposite
                        base_scores["neutral"] += 0.5
                    else:
                        base_scores[emotion] += weight * 2.5
            
            # Reset modifiers after evaluating token
            multiplier = 1.0
            is_negated = False

        # Softmax normalization with temperature scaling
        exp_vals = {k: np.exp(v * 1.8) for k, v in base_scores.items()}
        total = sum(exp_vals.values())
        probs = {k: round(float(v / total), 4) for k, v in exp_vals.items()}

        return probs
