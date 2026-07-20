"""Tamil ASR service using OpenAI Whisper."""
import os
import tempfile
import subprocess
from typing import Optional


_whisper_model = None


def _get_model():
    """Lazy-load the Whisper model (heavy, load once)."""
    global _whisper_model
    if _whisper_model is None:
        try:
            import whisper
            from ..config import settings
            model_size = getattr(settings, "WHISPER_MODEL", "base")
            print(f"[ASR] Loading Whisper model: {model_size}")
            _whisper_model = whisper.load_model(model_size)
            print("[ASR] Whisper model loaded successfully")
        except Exception as e:
            print(f"[ASR] Failed to load Whisper model: {e}")
            raise
    return _whisper_model


def _convert_to_wav(input_path: str) -> str:
    """Convert audio file to WAV format using ffmpeg."""
    output_path = input_path.rsplit(".", 1)[0] + "_converted.wav"
    try:
        result = subprocess.run(
            [
                "ffmpeg", "-y", "-i", input_path,
                "-ar", "16000",  # 16kHz sample rate for Whisper
                "-ac", "1",      # Mono
                "-f", "wav",
                output_path,
            ],
            capture_output=True,
            timeout=30,
        )
        if result.returncode != 0:
            raise RuntimeError(f"ffmpeg failed: {result.stderr.decode()}")
        return output_path
    except FileNotFoundError:
        # ffmpeg not available — return original path and hope Whisper handles it
        return input_path


def transcribe_tamil(audio_path: str) -> dict:
    """
    Transcribe audio file to Tamil text using Whisper.

    Returns:
        dict with keys: transcript, language, segments
    """
    if not os.path.exists(audio_path):
        return {"transcript": "", "language": "ta", "segments": [], "error": "Audio file not found"}

    converted_path = None
    try:
        model = _get_model()

        # Convert to WAV if needed
        if not audio_path.endswith(".wav"):
            converted_path = _convert_to_wav(audio_path)
        else:
            converted_path = audio_path

        # Transcribe with Tamil language hint
        result = model.transcribe(
            converted_path,
            language="ta",
            task="transcribe",
            fp16=False,
            verbose=False,
        )

        transcript = result.get("text", "").strip()
        segments = result.get("segments", [])

        return {
            "transcript": transcript,
            "language": result.get("language", "ta"),
            "segments": [
                {
                    "start": s.get("start", 0),
                    "end": s.get("end", 0),
                    "text": s.get("text", "").strip(),
                }
                for s in segments
            ],
        }

    except Exception as e:
        print(f"[ASR] Transcription error: {e}")
        return {
            "transcript": "",
            "language": "ta",
            "segments": [],
            "error": str(e),
        }
    finally:
        # Clean up converted file if different from input
        if converted_path and converted_path != audio_path and os.path.exists(converted_path):
            try:
                os.remove(converted_path)
            except OSError:
                pass
