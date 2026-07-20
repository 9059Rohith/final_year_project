"""Tamil TTS service using gTTS with SHA-256 file caching."""
import hashlib
import os
from typing import Optional


def _cache_key(text: str, lang: str = "ta") -> str:
    return hashlib.sha256(f"{lang}:{text}".encode("utf-8")).hexdigest()


def get_or_generate_tts(text: str, lang: str = "ta", cache_dir: str = "uploads/tts_cache") -> str:
    """
    Return path to cached MP3 or generate and cache it.
    Uses SHA-256 of (lang:text) as filename to avoid regeneration.
    """
    os.makedirs(cache_dir, exist_ok=True)
    cache_file = os.path.join(cache_dir, f"{_cache_key(text, lang)}.mp3")

    if os.path.exists(cache_file):
        return cache_file

    from gtts import gTTS
    tts = gTTS(text=text, lang=lang, slow=False)
    tts.save(cache_file)
    return cache_file


def pregenerate_module_tts(items: list, lang: str = "ta", cache_dir: str = "uploads/tts_cache") -> dict:
    """
    Pre-generate TTS for a list of module items.
    items: list of dicts with 'tamil_word' key
    Returns dict mapping tamil_word -> cache_path
    """
    results = {}
    for item in items:
        word = item.get("tamil_word", "")
        if word:
            try:
                path = get_or_generate_tts(word, lang, cache_dir)
                results[word] = path
            except Exception as e:
                print(f"[TTS] Failed to generate TTS for '{word}': {e}")
                results[word] = None
    return results
