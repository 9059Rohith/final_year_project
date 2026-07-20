"""TTS router — Tamil text-to-speech with SHA-256 caching."""
import hashlib
import os
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import FileResponse
from pydantic import BaseModel

from ..config import settings
from ..utils.jwt_handler import get_current_user
from ..models.user import User

router = APIRouter()


class TTSRequest(BaseModel):
    text: str
    lang: str = "ta"


def _cache_path(text: str, lang: str) -> str:
    h = hashlib.sha256(f"{lang}:{text}".encode("utf-8")).hexdigest()
    return os.path.join(settings.TTS_CACHE_DIR, f"{h}.mp3")


@router.get("/speak")
async def tts_get(
    text: str = Query(..., min_length=1, max_length=200),
    lang: str = Query("ta"),
    current_user: User = Depends(get_current_user),
):
    """GET endpoint — generate or return cached Tamil TTS audio."""
    return await _generate_tts(text, lang)


@router.post("/speak")
async def tts_post(
    body: TTSRequest,
    current_user: User = Depends(get_current_user),
):
    """POST endpoint — generate or return cached Tamil TTS audio."""
    return await _generate_tts(body.text, body.lang)


async def _generate_tts(text: str, lang: str = "ta"):
    os.makedirs(settings.TTS_CACHE_DIR, exist_ok=True)
    cache_file = _cache_path(text, lang)

    if not os.path.exists(cache_file):
        try:
            from gtts import gTTS
            tts = gTTS(text=text, lang=lang, slow=False)
            tts.save(cache_file)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"TTS generation failed: {str(e)}")

    return FileResponse(
        cache_file,
        media_type="audio/mpeg",
        headers={
            "Cache-Control": "public, max-age=86400",
            "Content-Disposition": f'inline; filename="tts.mp3"',
        },
    )


@router.delete("/cache")
async def clear_tts_cache(
    current_user: User = Depends(get_current_user),
):
    """Admin: clear all cached TTS files."""
    if current_user.role.value != "admin":
        raise HTTPException(status_code=403, detail="Admin only")

    count = 0
    if os.path.exists(settings.TTS_CACHE_DIR):
        for f in os.listdir(settings.TTS_CACHE_DIR):
            if f.endswith(".mp3"):
                os.remove(os.path.join(settings.TTS_CACHE_DIR, f))
                count += 1

    return {"deleted": count, "message": f"Cleared {count} TTS cache files"}


@router.get("/cache/info")
async def tts_cache_info(
    current_user: User = Depends(get_current_user),
):
    """Info about the TTS cache."""
    if not os.path.exists(settings.TTS_CACHE_DIR):
        return {"count": 0, "total_size_kb": 0}

    files = [f for f in os.listdir(settings.TTS_CACHE_DIR) if f.endswith(".mp3")]
    total_size = sum(
        os.path.getsize(os.path.join(settings.TTS_CACHE_DIR, f)) for f in files
    )
    return {
        "count": len(files),
        "total_size_kb": round(total_size / 1024, 1),
    }
