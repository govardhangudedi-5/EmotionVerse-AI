import re
from typing import Dict, Tuple


def sanitize_text(text: str) -> str:
    """Trims whitespace and normalizes internal spaces."""
    if not text:
        return ""
    return re.sub(r"\s+", " ", text.strip())


def get_text_statistics(text: str) -> Tuple[int, int]:
    """Returns (character_count, word_count)."""
    clean = sanitize_text(text)
    if not clean:
        return 0, 0
    words = clean.split(" ")
    return len(clean), len(words)
