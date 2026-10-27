import logging
import re
from typing import Any, Dict, List, Optional, Tuple
import numpy as np

from .base_model import BaseEmotionModel, EMOTION_CLASSES

logger = logging.getLogger(__name__)

# ─────────────────────────────────────────────────────────────────────────────
# EMOTION LEXICONS — word-level signals
# Extended with healthcare and education vocabulary
# ─────────────────────────────────────────────────────────────────────────────
EMOTION_LEXICONS: Dict[str, set] = {
    "happy": {
        # Core positive affect
        "happy", "happiness", "joy", "joyful", "joyous", "excited", "exciting", "excitement",
        "delight", "delighted", "delightful", "glad", "wonderful", "amazing", "great", "fantastic",
        "love", "loving", "pleased", "pleasing", "cheerful", "optimistic", "proud", "content",
        "thrilled", "blessed", "enjoy", "enjoyable", "enjoying", "enjoyment", "fun", "awesome",
        "celebrate", "celebration", "laugh", "laughing", "laughter", "smiling", "smile", "grin",
        "success", "successful", "victorious", "victory", "radiant", "elated", "relieved", "relief",
        "grateful", "gratitude", "thankful", "thankfulness", "positive", "confident", "confidence",
        "hopeful", "energetic", "enthusiastic", "enthusiasm", "inspired", "inspiring", "motivation",
        "motivated", "accomplished", "accomplishment", "satisfied", "satisfaction", "fulfilling",
        # Recovery / progress words
        "better", "improved", "improvement", "healing", "healed", "recovered", "recovery",
        "progress", "breakthrough", "finally", "worked", "effective", "useful", "helps",
        "excellent", "brilliant", "outstanding", "superb", "perfect", "wonderful",
        # Learning success words
        "learned", "mastered", "achieved", "achievement", "understood", "clear", "clarity",
        "makes sense", "clicked", "got it", "figured",
        # Everyday positive phrases as single tokens
        "good", "well", "nice", "fine", "okay", "comfy", "comfortable", "pleasant", "enjoy",
        "refreshed", "renewed", "peaceful", "calm", "relaxed", "rested",
        # Social positives
        "appreciate", "appreciated", "welcome", "supported", "heard", "valued",
        "connected", "belonged", "included", "respected",
    },
    "sad": {
        # Core negative affect / low arousal
        "sad", "depressed", "unhappy", "sorrow", "grief", "heartbroken", "down", "lonely",
        "hopeless", "miserable", "crying", "cry", "tear", "tears", "gloomy", "melancholy",
        "regret", "disappointed", "disappointment", "hurting", "lost", "empty", "despair",
        "blue", "mourning", "defeated", "downcast", "heavyhearted", "exhausted", "drained",
        "helpless", "worthless", "powerless", "isolated", "abandoned", "ignored", "unheard",
        "invisible", "forgotten", "broken", "shattered", "devastated", "crushed", "overwhelmed",
        # Healthcare-specific sadness
        "suffering", "pain", "painful", "chronic", "terminal", "incurable", "worsening",
        "deteriorating", "declining", "nobody", "nothing",
        # Education-specific sadness
        "failing", "failed", "failed", "gave up", "giving up", "quitting", "pointless",
        "useless", "incompetent", "dumb", "stupid", "behind", "falling behind", "left out",
    },
    "angry": {
        # Core anger
        "angry", "mad", "furious", "outraged", "irritated", "irritating", "annoyed", "annoying",
        "rage", "hostile", "bitter", "resentful", "hate", "frustrated", "frustration",
        "infuriated", "fuming", "agitated", "provoked", "indignant", "offended", "wrath",
        "hateful", "aggravated", "livid", "enraged", "vexed", "disrespected", "bullied",
        "unfair", "unjust", "wrong",
        # Healthcare
        "dismissed", "neglected", "mistreated", "overcharged", "misdiagnosed",
        # Education / frustration
        "impossible", "unclear", "confusing", "confusion", "contradictory", "nonsense",
        "absurd", "ridiculous", "pointless", "waste", "incompetent", "unacceptable",
        "unreasonable", "illogical", "ridiculous", "drives", "driving", "maddening",
    },
    "fear": {
        # Core fear / anxiety
        "fear", "afraid", "scared", "terrified", "anxious", "anxiety", "worried", "worry",
        "panic", "panicking", "stress", "stressed", "nervous", "nervousness", "dread",
        "frightened", "horrified", "tense", "alarmed", "apprehensive", "jittery",
        "petrified", "uneasy", "intimidated", "overwhelmed", "dreading", "dreaded",
        # Healthcare — treatment anxiety
        "treatment", "surgery", "operation", "procedure", "diagnosis", "prognosis",
        "hospital", "medication", "injection", "results", "test", "scan", "biopsy",
        "chemotherapy", "radiation", "side effects", "complications", "risk",
        "uncertain", "uncertainty", "unknown", "unsure", "worried", "concerns", "concern",
        # Education — exam anxiety
        "exam", "exams", "test", "deadline", "assignment", "grade", "fail", "pressure",
        "performance", "evaluated", "assessment", "judged",
    },
    "surprise": {
        "surprise", "surprised", "shocked", "shock", "amazed", "astonished", "stunned",
        "unexpected", "unbelievable", "speechless", "startled", "wow", "unreal",
        "staggering", "sudden", "suddenly", "unexpectedly", "out of nowhere",
        "incredible", "unimaginable", "unprecedented", "discovery", "realized",
        "never knew", "had no idea", "cannot believe",
    },
    "disgust": {
        "disgust", "disgusted", "gross", "revolting", "nauseated", "repulsed", "sickening",
        "vile", "distasteful", "nasty", "abhorrent", "loathsome", "foul", "offensive",
        "cringe", "repulsive", "horrible", "dreadful", "appalling",
        # Healthcare
        "unbearable", "intolerable", "horrible symptoms", "side effects",
    },
    "neutral": {
        "okay", "fine", "normal", "average", "standard", "routine", "neutral", "indifferent",
        "alright", "moderate", "ordinary", "regular", "common", "usual", "fair", "plain",
        "typical", "scheduled", "update", "information", "report", "status", "noted",
        "understood", "acknowledged", "received", "recorded",
    },
}

# ─────────────────────────────────────────────────────────────────────────────
# CONTEXTUAL PHRASE PATTERNS
# Multi-word expressions that carry stronger signal than single keywords.
# Each entry: (regex_pattern, emotion, weight_multiplier)
# Patterns are matched against the full lowercased sentence.
# ─────────────────────────────────────────────────────────────────────────────
PHRASE_PATTERNS: List[Tuple[str, str, float]] = [
    # ── FEAR / ANXIETY ──
    (r"\b(worried|worrying|worry)\s+about\b",           "fear", 3.5),
    (r"\b(anxious|nervous)\s+about\b",                  "fear", 3.5),
    (r"\bdon['']?t\s+know\s+what\s+to\s+expect\b",     "fear", 3.0),
    (r"\bnot\s+sure\s+(what|how|if|whether)\b",         "fear", 2.5),
    (r"\b(scared|afraid)\s+of\b",                       "fear", 3.5),
    (r"\bwhat\s+if\b",                                  "fear", 2.0),
    (r"\b(upcoming|next)\s+(treatment|surgery|procedure|session|appointment)\b", "fear", 3.0),
    (r"\bside\s+effects?\b",                            "fear", 2.5),
    (r"\b(feel|feeling)\s+(tense|uneasy|apprehensive)\b", "fear", 3.0),
    (r"\bmakes?\s+me\s+(anxious|nervous|worried|uneasy)\b", "fear", 3.5),
    (r"\bcan['']?t\s+(sleep|concentrate|focus)\b",     "fear", 2.5),

    # ── SADNESS ──
    (r"\bnobody\s+(listens?|cares?|understands?|hears?)\b", "sad", 4.0),
    (r"\bno\s+one\s+(listens?|cares?|understands?|hears?)\b", "sad", 4.0),
    (r"\b(feel|feeling|felt)\s+(ignored|unheard|invisible|dismissed)\b", "sad", 4.0),
    (r"\b(tried|trying)\s+(to\s+explain|explaining)\b", "sad", 2.5),
    (r"\b(months|weeks|years)\s+(but|and)\s+(nothing|nobody|no one)\b", "sad", 3.5),
    (r"\b(feel|felt)\s+(helpless|hopeless|powerless|worthless|useless)\b", "sad", 4.0),
    (r"\bgave?\s+up\b",                                "sad", 3.0),
    (r"\bno\s+(hope|point|purpose)\b",                 "sad", 3.5),
    (r"\bmiss\b.*\b(them|her|him|my|home)\b",          "sad", 2.5),

    # ── ANGER / FRUSTRATION ──
    (r"\b(so\s+)?frustrated\b",                        "angry", 3.5),
    (r"\b(not\s+)?(at\s+all\s+)?clear\b.*\b(instructions?|guidance|explanation)\b", "angry", 3.0),
    (r"\b(instructions?|guidance|explanation|policy)\s+.{0,30}\b(unclear|confusing|unfair)\b", "angry", 3.0),
    (r"\b(never|not)\s+(clear|easy|helpful|good)\b",    "angry", 2.5),
    (r"\b(so|very|really)\s+(annoying|irritating|maddening)\b", "angry", 3.5),
    (r"\bunfair\b",                                    "angry", 3.0),
    (r"\b(treated|being\s+treated)\s+(unfairly|poorly|badly)\b", "angry", 4.0),
    (r"\bnever\s+listen",                              "angry", 3.5),
    (r"\bignor(ed|ing)\s+me\b",                        "angry", 3.0),
    (r"\bdon['']?t\s+listen\b",                        "angry", 3.0),
    (r"\btoo\s+(hard|difficult|strict|much)\b",        "angry", 2.5),

    # ── CONFUSION / DIFFICULTY (maps to "fear" for low-arousal worry, or "sad" for helplessness) ──
    # "still cannot understand" → frustration-adjacent fear
    (r"\b(still\s+)?(cannot|can['']?t)\s+understand\b", "fear", 3.5),
    (r"\b(don['']?t|cannot|can['']?t)\s+understand\b",  "fear", 3.0),
    (r"\b(read|studied|reviewed)\s+(it\s+)?\d+\s+times?\b", "fear", 3.0),
    (r"\b(read|studied|reviewed)\s+(it\s+)?(many|several|multiple|numerous)\s+times?\b", "fear", 2.5),
    (r"\bstill\s+(struggling|stuck|confused|lost)\b",  "fear", 3.5),
    (r"\b(confused|confusing|confused)\s+about\b",     "fear", 2.5),
    (r"\bdon['']?t\s+(get|follow|grasp)\s+(it|this|the|how|what|why)\b", "fear", 2.5),
    (r"\bnot\s+(making|making)\s+sense\b",             "fear", 2.5),
    (r"\bmakes?\s+no\s+sense\b",                       "fear", 3.0),
    (r"\blost\s+(on|in|at)\s+(this|that|the)\b",       "fear", 2.5),
    (r"\bwhere\s+(do\s+I|should\s+I)\s+even\s+start\b", "fear", 2.5),

    # ── HAPPINESS / RELIEF ──
    (r"\bfinally\s+(understood?|got\s+it|figured\s+out|makes?\s+sense|clicked)\b", "happy", 4.5),
    (r"\b(feel|feeling|felt)\s+(so\s+)?(much\s+)?(better|good|great|wonderful|relieved|happy|glad)\b", "happy", 4.0),
    (r"\b(really|truly|so)\s+(helped?|helpful|useful|clear|good|great)\b",         "happy", 3.5),
    (r"\b(thank\s+you|thanks|grateful|thankful|appreciate)\b",                     "happy", 3.0),
    (r"\b(great|amazing|excellent|wonderful|fantastic|brilliant)\s+(help|explanation|session|teacher|class|lesson)\b", "happy", 4.0),
    (r"\b(love|enjoy|enjoying|enjoyed)\s+(this|the|learning|class|session|it)\b",  "happy", 3.5),
    (r"\b(medication|treatment|therapy)\s+is\s+(really\s+)?(helping|working|effective)\b", "happy", 4.0),
    (r"\bso\s+(happy|glad|relieved|excited|grateful|thankful|pleased)\b",          "happy", 4.0),
    (r"\b(i am|i'm|feeling)\s+(happy|glad|excited|thrilled|great|wonderful|good)\b", "happy", 4.0),
    (r"\b(this|it)\s+(really\s+)?(helped?|makes?\s+sense|clicked|worked)\b",       "happy", 3.5),
    (r"\bmade\s+(so\s+much\s+)?sense\b",                                            "happy", 3.5),
    (r"\b(good|great|nice|wonderful)\s+(news|progress|results?|outcome)\b",         "happy", 3.5),
    (r"\b(i\s+)?(got|get)\s+it\s+(now)?\b",                                        "happy", 3.0),
    (r"\bmaking\s+(great|good|excellent|solid)\s+(progress|improvement)\b",         "happy", 3.5),
    (r"\b(feel|feeling)\s+(much\s+)?better\s+(now|today|after)\b",                 "happy", 4.0),
    (r"\b(loving|enjoying)\s+(every|this|the|it)\b",                               "happy", 3.0),
    (r"\bcan('t|not)?\s+wait\b",                                                    "happy", 2.5),
    (r"\b(i\s+)?(passed|aced|nailed|crushed)\b",                                   "happy", 4.0),
    (r"\bno\s+(more\s+)?(pain|symptoms?|issues?)\b",                               "happy", 3.5),

    # ── SURPRISE ──
    (r"\bout\s+of\s+nowhere\b",                                                     "surprise", 3.5),
    (r"\bcompletely\s+(unexpected|surprised|shocked|stunned)\b",                    "surprise", 4.0),
    (r"\bhad\s+no\s+idea\b",                                                        "surprise", 3.5),
    (r"\bnever\s+(expected|thought|imagined|knew|realized)\b",                      "surprise", 3.5),
    (r"\bcould(n['']?t|\s+not)\s+believe\b",                                       "surprise", 3.5),
    (r"\bcan(not|['']?t)\s+believe\b",                                             "surprise", 3.5),
    (r"\b(what|oh)\s+wow\b",                                                        "surprise", 3.5),
    (r"\bblew\s+(me|my)\s+(away|mind)\b",                                          "surprise", 4.0),
    (r"\b(totally|completely|absolutely)\s+(shocked|surprised|stunned|astonished)\b", "surprise", 4.0),
    (r"\bdidn['']?t\s+(expect|see\s+that|know\s+that|realize)\b",                  "surprise", 3.0),
    (r"\bso\s+(shocked|surprised|stunned|amazed|astonished)\b",                    "surprise", 4.0),
    (r"\b(i\s+)?(am|was)\s+(shocked|surprised|stunned|amazed|astonished)\b",       "surprise", 3.5),
    (r"\bwow,?\s+(i\s+)?never\b",                                                   "surprise", 3.5),
    (r"\bunbelievable\b",                                                            "surprise", 3.0),
]

INTENSIFIERS = {
    "very": 1.5, "extremely": 2.0, "so": 1.3, "really": 1.4, "incredibly": 1.8,
    "super": 1.5, "deeply": 1.6, "immensely": 1.8, "terribly": 1.7, "totally": 1.4,
    "absolutely": 1.9, "completely": 1.7, "utterly": 1.8, "quite": 1.2, "rather": 1.1,
    "too": 1.3, "much": 1.2, "more": 1.1, "highly": 1.4, "truly": 1.5, "literally": 1.4,
}

NEGATORS = {"not", "never", "no", "hardly", "barely", "scarcely", "without", "cant", "cannot",
            "wont", "shouldnt", "couldnt", "wouldnt", "doesnt", "didnt", "isnt", "wasnt"}


class TextEmotionModel(BaseEmotionModel):
    """
    Text-based Emotion Analysis Model.
    Architecture:
      1. Phrase-level pattern matching: Detects multi-word contextual expressions
         (e.g. "worried about my treatment", "still cannot understand").
      2. Lexicon scoring with negation and intensifier handling.
      3. Combined softmax normalization with temperature scaling.
      4. Extension point: Hugging Face distilbert-base-uncased-emotion transformer.
    """

    def __init__(self, model_name_or_path: Optional[str] = None):
        self.transformer_pipeline = None
        super().__init__(model_name="NLP-Context-Emotion-v2")

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
        logger.info("Text emotion model v2 loaded — context phrases + extended lexicon.")

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
        neg_words = (EMOTION_LEXICONS["sad"] | EMOTION_LEXICONS["angry"]
                     | EMOTION_LEXICONS["fear"] | EMOTION_LEXICONS["disgust"])
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

        Two-stage analysis:
          Stage 1 — phrase patterns: match multi-word contextual signals on the full text.
          Stage 2 — token lexicon: score individual words with intensifier/negation handling.
        """
        if isinstance(features, tuple):
            tokens, raw_text = features
        else:
            tokens, raw_text = self.preprocess(features)

        # ── Baseline neutral prior ──
        base_scores: Dict[str, float] = {
            "happy": 0.05, "sad": 0.05, "angry": 0.05, "fear": 0.05,
            "surprise": 0.05, "disgust": 0.05, "neutral": 0.15,
        }

        # ── Stage 1: Phrase-level context patterns ──
        for pattern, emotion, weight in PHRASE_PATTERNS:
            if re.search(pattern, raw_text, re.IGNORECASE):
                base_scores[emotion] += weight
                logger.debug("Phrase match: pattern=%r emotion=%s weight=%.1f", pattern, emotion, weight)

        # ── Stage 2: Token-level lexicon scoring ──
        multiplier = 1.0
        is_negated = False

        for word in tokens:
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
                        # Negation of positive → neutral / slight negative
                        if emotion == "happy":
                            base_scores["sad"] += weight * 1.0
                            base_scores["neutral"] += weight * 0.5
                        # Negation of negative → slight positive
                        elif emotion in ("sad", "fear", "angry", "disgust"):
                            base_scores["neutral"] += weight * 1.0
                        else:
                            base_scores["neutral"] += weight * 0.5
                    else:
                        base_scores[emotion] += weight * 2.5

            # Reset modifiers per token
            multiplier = 1.0
            is_negated = False

        # ── Softmax normalization with temperature ──
        exp_vals = {k: np.exp(v * 1.8) for k, v in base_scores.items()}
        total = sum(exp_vals.values())
        probs = {k: round(float(v / total), 4) for k, v in exp_vals.items()}

        return probs

    def get_mood(self, emotion: str) -> str:
        positive = {"happy", "surprise"}
        negative = {"sad", "angry", "fear", "disgust"}
        if emotion in positive:
            return "positive"
        if emotion in negative:
            return "negative"
        return "neutral"
