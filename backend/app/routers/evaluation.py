"""Evaluation router for speech and face analysis."""
from fastapi import (
    APIRouter, UploadFile, File, Form, WebSocket, WebSocketDisconnect,
    Depends, HTTPException, status,
)
from datetime import datetime
import json
from ..services.speech_evaluator import speech_evaluator
from ..services.face_analyzer import face_analyzer
from ..database import get_database
from ..utils.jwt_handler import get_current_user
from ..utils.rate_limit import RateLimiter


router = APIRouter(prefix="/api/evaluate", tags=["evaluation"])

# Speech evaluation runs ML models and is expensive — throttle per client.
speech_rate_limit = RateLimiter(times=30, seconds=60)

# Accept common browser/mobile recording formats only.
ALLOWED_AUDIO_TYPES = {
    "audio/webm", "audio/wav", "audio/x-wav", "audio/wave",
    "audio/mpeg", "audio/mp4", "audio/m4a", "audio/x-m4a",
    "audio/ogg", "audio/3gpp", "application/octet-stream",
}
MAX_AUDIO_BYTES = 10 * 1024 * 1024  # 10 MB


@router.post("/speech", dependencies=[Depends(speech_rate_limit)])
async def evaluate_speech(
    audio: UploadFile = File(...),
    target_phoneme: str = Form(..., min_length=1, max_length=64),
    lesson_id: int = Form(..., ge=1),
    current_user: dict = Depends(get_current_user)
):
    """
    Evaluate speech pronunciation.
    
    Args:
        audio: Audio file (webm, wav, etc.)
        target_phoneme: Target phoneme to evaluate against
        lesson_id: ID of the lesson
        current_user: Authenticated user
        
    Returns:
        Evaluation results with accuracy, feedback, transcription, etc.
    """
    print("\n" + "="*60)
    print(f"🎯 NEW EVALUATION REQUEST")
    print(f"   User: {current_user.get('email', 'Unknown')}")
    print(f"   Target: {target_phoneme}")
    print(f"   Lesson: {lesson_id}")
    print("="*60)
    
    # Validate content type (reject obviously wrong uploads before reading).
    if audio.content_type and audio.content_type not in ALLOWED_AUDIO_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported audio type: {audio.content_type}",
        )

    try:
        # Read audio bytes
        audio_bytes = await audio.read()
        print(f"📦 Audio received: {len(audio_bytes)} bytes")

        # Validate size: reject empty and oversized uploads.
        if not audio_bytes:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Empty audio file.",
            )
        if len(audio_bytes) > MAX_AUDIO_BYTES:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail="Audio file too large (max 10 MB).",
            )

        # Evaluate pronunciation
        result = speech_evaluator.evaluate_pronunciation(
            audio_bytes,
            target_phoneme
        )
        
        # Add user and lesson context
        result["user_id"] = str(current_user["_id"])
        result["lesson_id"] = lesson_id
        result["evaluated_at"] = datetime.utcnow().isoformat()
        result["target_phoneme"] = target_phoneme
        
        print("\n" + "="*60)
        print(f"✅ EVALUATION COMPLETE")
        print(f"   Transcription: '{result.get('transcription', 'N/A')}'")
        print(f"   Phoneme Match: {result.get('phoneme_match', False)}")
        print(f"   Accuracy: {result.get('accuracy', 0)}%")
        print(f"   MFCC Score: {result.get('mfcc_score', 0)}")
        print("="*60 + "\n")
        
        return result

    except HTTPException:
        # Validation errors (size/type) should surface as real HTTP errors.
        raise
    except Exception as e:
        print(f"\n❌ ERROR in evaluate_speech: {e}")
        import traceback
        traceback.print_exc()
        
        return {
            "error": str(e),
            "accuracy": 0,
            "phoneme_match": False,
            "mfcc_score": 0,
            "transcription": "",
            "feedback": f"Could not process audio: {str(e)}"
        }


@router.websocket("/ws/face/{session_id}")
async def face_analysis_websocket(websocket: WebSocket, session_id: str):
    """
    WebSocket endpoint for real-time face analysis.
    
    Receives video frames and sends back face analysis results.
    """
    await websocket.accept()
    
    try:
        while True:
            # Receive frame data from client
            data = await websocket.receive_bytes()
            
            # Analyze frame
            result = face_analyzer.analyze_frame(data)
            
            # Send results back to client
            await websocket.send_json({
                "face_detected": result.face_detected,
                "mouth_open_ratio": result.mouth_open_ratio,
                "mouth_is_open": result.mouth_is_open,
                "stress_level": result.stress_level,
                "emotion": result.emotion,
                "timestamp": datetime.utcnow().isoformat()
            })
            
    except WebSocketDisconnect:
        print(f"WebSocket disconnected: {session_id}")
    except Exception as e:
        print(f"WebSocket error: {e}")
        await websocket.close()
