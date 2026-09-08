import logging
from ..config import settings
from ..models.text_model import TextEmotionModel
from ..schemas.emotion import MoodCategory, TextAnalysisResponse
from ..utils.text_utils import get_text_statistics, sanitize_text

logger = logging.getLogger(__name__)


class TextEmotionService:
    def __init__(self):
        self.model = TextEmotionModel()

    def analyze_text(self, raw_text: str) -> TextAnalysisResponse:
        """Analyzes textual input for emotion probabilities, polarity, and mood."""
        clean_text = sanitize_text(raw_text)
        char_count, word_count = get_text_statistics(clean_text)

        if not clean_text:
            return TextAnalysisResponse(
                modality="text",
                emotion="neutral",
                confidence=0.50,
                probabilities={
                    "neutral": 0.70, "happy": 0.05, "sad": 0.05,
                    "fear": 0.05, "angry": 0.05, "surprise": 0.05, "disgust": 0.05
                },
                mood_category=MoodCategory.NEUTRAL,
                character_count=0,
                word_count=0,
                sentiment_polarity=0.0,
                is_fallback=True,
                model_name=self.model.model_name,
                metadata={"note": "Empty text provided"},
            )

        tokens, _ = self.model.preprocess(clean_text)
        polarity = self.model.compute_polarity(tokens)
        probabilities = self.model.get_probabilities((tokens, clean_text))
        top_emotion, confidence = self.model.predict((tokens, clean_text))

        mood_category = MoodCategory(self.model.get_mood(top_emotion))

        return TextAnalysisResponse(
            modality="text",
            emotion=top_emotion,
            confidence=confidence,
            probabilities=probabilities,
            mood_category=mood_category,
            character_count=char_count,
            word_count=word_count,
            sentiment_polarity=polarity,
            is_fallback=self.model.is_fallback,
            model_name=self.model.model_name,
            metadata={
                "tokens_analyzed": len(tokens),
            },
        )
