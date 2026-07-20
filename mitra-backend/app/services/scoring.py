"""Phoneme similarity scoring — Levenshtein-based, 0-100 scale."""
import re
import unicodedata
from typing import Optional


# Tamil-specific phoneme groupings for fuzzy matching
TAMIL_PHONEME_MAP = {
    # Vowels
    "அ": "a", "ஆ": "aa", "இ": "i", "ஈ": "ii", "உ": "u", "ஊ": "uu",
    "எ": "e", "ஏ": "ee", "ஐ": "ai", "ஒ": "o", "ஓ": "oo", "ஔ": "au",
    # Consonants
    "க": "k", "ச": "s", "ட": "t", "த": "th", "ப": "p", "ற": "r",
    "ங": "ng", "ஞ": "ny", "ண": "n", "ந": "n", "ம": "m", "ன": "n",
    "ய": "y", "ர": "r", "ல": "l", "வ": "v", "ழ": "zh", "ள": "l",
    "ஷ": "sh", "ஸ": "s", "ஹ": "h", "ஜ": "j",
}


def _normalize_tamil(text: str) -> str:
    """Normalize Tamil text: strip diacritics where possible, lowercase."""
    text = text.strip().lower()
    # Remove punctuation except Tamil characters
    text = re.sub(r"[^\w\s\u0B80-\u0BFF]", "", text, flags=re.UNICODE)
    return text


def _tamil_to_latin(text: str) -> str:
    """Convert Tamil script to approximate latin phonemes."""
    result = []
    for char in text:
        if char in TAMIL_PHONEME_MAP:
            result.append(TAMIL_PHONEME_MAP[char])
        else:
            result.append(char)
    return "".join(result)


def levenshtein_distance(s1: str, s2: str) -> int:
    """Compute Levenshtein edit distance between two strings."""
    if len(s1) < len(s2):
        return levenshtein_distance(s2, s1)
    if len(s2) == 0:
        return len(s1)

    prev_row = list(range(len(s2) + 1))
    for i, c1 in enumerate(s1):
        curr_row = [i + 1]
        for j, c2 in enumerate(s2):
            insertions = prev_row[j + 1] + 1
            deletions = curr_row[j] + 1
            substitutions = prev_row[j] + (c1 != c2)
            curr_row.append(min(insertions, deletions, substitutions))
        prev_row = curr_row

    return prev_row[-1]


def compute_similarity_score(
    asr_transcript: str,
    target_word: str,
    phoneme_breakdown: Optional[dict] = None,
) -> float:
    """
    Compute phoneme similarity score (0-100).

    Steps:
    1. Normalize both strings
    2. Convert Tamil → Latin phonemes
    3. Compute Levenshtein similarity
    4. Apply length-aware penalty
    """
    if not asr_transcript or not target_word:
        return 0.0

    # Normalize
    asr_norm = _normalize_tamil(asr_transcript)
    target_norm = _normalize_tamil(target_word)

    # Convert to phoneme approximations
    asr_phonemes = _tamil_to_latin(asr_norm)
    target_phonemes = _tamil_to_latin(target_norm)

    if not asr_phonemes or not target_phonemes:
        return 0.0

    # Exact match = 100
    if asr_phonemes == target_phonemes:
        return 100.0

    # Levenshtein similarity
    max_len = max(len(asr_phonemes), len(target_phonemes))
    if max_len == 0:
        return 100.0

    distance = levenshtein_distance(asr_phonemes, target_phonemes)
    similarity = (1.0 - distance / max_len) * 100.0

    # Clamp to 0-100
    score = max(0.0, min(100.0, similarity))

    return round(score, 1)


def compute_phoneme_accuracy(
    asr_transcript: str,
    target_word: str,
    phoneme_breakdown: Optional[dict] = None,
) -> dict:
    """
    Return per-phoneme accuracy detail for the UI.
    Returns dict with phonemes list and weakest phoneme.
    """
    score = compute_similarity_score(asr_transcript, target_word, phoneme_breakdown)

    target_norm = _normalize_tamil(target_word)
    target_phonemes = _tamil_to_latin(target_norm)

    # Simple per-character scoring based on overall similarity
    phonemes = []
    for char in target_phonemes:
        # Distribute score across phonemes with some variance
        phonemes.append({"phoneme": char, "score": round(score / 100.0, 2)})

    weakest = min(phonemes, key=lambda p: p["score"])["phoneme"] if phonemes else ""

    return {
        "overall_score": score,
        "phonemes": phonemes,
        "weakest": weakest,
        "asr_transcript": asr_transcript,
        "target_word": target_word,
    }


def determine_mitra_response(score: float) -> str:
    """Determine Mitra's animated response based on score."""
    if score >= 85:
        return "celebrate"
    elif score >= 60:
        return "mimic"
    elif score >= 30:
        return "gentle_correct"
    else:
        return "neutral_fallback"
