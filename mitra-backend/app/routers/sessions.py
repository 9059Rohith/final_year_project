"""Sessions router — create, manage, submit attempts, poll scores."""
import os
import uuid
import shutil
from datetime import datetime, timezone
from typing import Optional, List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from ..database import get_db
from ..models.user import User, UserRole
from ..models.child import Child
from ..models.content import ModuleItem
from ..models.program import AssignedProgram, ProgramStatus
from ..models.session import TherapySession, SessionAttempt, SessionStatus, MitraResponseType
from ..config import settings
from ..utils.jwt_handler import get_current_user

router = APIRouter()


# ── Schemas ───────────────────────────────────────────────────────────────────

class SessionCreate(BaseModel):
    child_id: str
    program_id: str


class SessionResponse(BaseModel):
    id: str
    child_id: str
    assigned_program_id: Optional[str]
    status: str
    total_items: int
    completed_items: int
    average_score: Optional[float]
    created_at: str


class AttemptStatusResponse(BaseModel):
    attempt_id: str
    scoring_status: str
    similarity_score: Optional[float]
    asr_transcript: Optional[str]
    phoneme_accuracy: Optional[dict]
    mitra_response_type: Optional[str]


# ── Helper ────────────────────────────────────────────────────────────────────

async def _verify_child_belongs_to_user(child_id: UUID, current_user: User, db: AsyncSession) -> Child:
    """Ensure the child is accessible by this parent (or therapist/admin)."""
    result = await db.execute(select(Child).where(Child.id == child_id))
    child = result.scalar_one_or_none()
    if not child:
        raise HTTPException(status_code=404, detail="Child not found")
    if current_user.role == UserRole.parent and child.parent_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    if current_user.role == UserRole.therapist and child.therapist_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    return child


# ── Routes ────────────────────────────────────────────────────────────────────

@router.post("", status_code=201, response_model=SessionResponse)
async def create_session(
    body: SessionCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Start a new therapy session for a child."""
    child = await _verify_child_belongs_to_user(UUID(body.child_id), current_user, db)

    # Validate program
    prog_result = await db.execute(
        select(AssignedProgram).where(
            AssignedProgram.id == UUID(body.program_id),
            AssignedProgram.child_id == child.id,
            AssignedProgram.status.in_([ProgramStatus.not_started, ProgramStatus.in_progress]),
        )
    )
    program = prog_result.scalar_one_or_none()
    if not program:
        raise HTTPException(status_code=404, detail="Active program not found for this child")

    if program.status == ProgramStatus.not_started:
        program.status = ProgramStatus.in_progress

    # Count items in the module
    items_result = await db.execute(
        select(ModuleItem).where(ModuleItem.module_id == program.module_id)
    )
    items = items_result.scalars().all()

    session = TherapySession(
        child_id=child.id,
        assigned_program_id=program.id,
        started_by_parent_id=current_user.id if current_user.role == UserRole.parent else None,
        status=SessionStatus.in_progress,
        total_items=len(items),
        completed_items=0,
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)

    return SessionResponse(
        id=str(session.id),
        child_id=str(session.child_id),
        assigned_program_id=str(session.assigned_program_id) if session.assigned_program_id else None,
        status=session.status.value,
        total_items=session.total_items,
        completed_items=session.completed_items,
        average_score=session.average_score,
        created_at=session.created_at.isoformat(),
    )


@router.get("/{session_id}", response_model=SessionResponse)
async def get_session(
    session_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(TherapySession).where(TherapySession.id == session_id))
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Verify access
    await _verify_child_belongs_to_user(session.child_id, current_user, db)

    return SessionResponse(
        id=str(session.id),
        child_id=str(session.child_id),
        assigned_program_id=str(session.assigned_program_id) if session.assigned_program_id else None,
        status=session.status.value,
        total_items=session.total_items,
        completed_items=session.completed_items,
        average_score=session.average_score,
        created_at=session.created_at.isoformat(),
    )


@router.post("/{session_id}/complete")
async def complete_session(
    session_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Mark a session as completed, compute average score."""
    result = await db.execute(select(TherapySession).where(TherapySession.id == session_id))
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    await _verify_child_belongs_to_user(session.child_id, current_user, db)

    # Compute average score from done attempts
    attempts_result = await db.execute(
        select(SessionAttempt).where(
            SessionAttempt.session_id == session_id,
            SessionAttempt.scoring_status == "done",
        )
    )
    attempts = attempts_result.scalars().all()
    scores = [a.similarity_score for a in attempts if a.similarity_score is not None]

    session.status = SessionStatus.completed
    session.completed_at = datetime.now(timezone.utc)
    session.completed_items = len(attempts)
    session.average_score = sum(scores) / len(scores) if scores else None
    if scores:
        best = max(attempts, key=lambda a: a.similarity_score or 0)
        item_res = await db.execute(
            select(ModuleItem).where(ModuleItem.id == best.module_item_id)
        )
        item = item_res.scalar_one_or_none()
        session.best_word = item.target_word if item else None

    await db.commit()
    return {"status": "completed", "average_score": session.average_score}


@router.post("/{session_id}/abandon")
async def abandon_session(
    session_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(TherapySession).where(TherapySession.id == session_id))
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    await _verify_child_belongs_to_user(session.child_id, current_user, db)
    session.status = SessionStatus.abandoned
    session.completed_at = datetime.now(timezone.utc)
    await db.commit()
    return {"status": "abandoned"}


# ── Attempt submission (Track B — Celery ASR scoring) ────────────────────────

@router.post("/{session_id}/attempts", status_code=202)
async def submit_attempt(
    session_id: UUID,
    module_item_id: str = Form(...),
    attempt_number: int = Form(1),
    mimic_played: bool = Form(True),
    audio: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Submit an audio recording for scoring.
    Track A (mimic) has already fired client-side.
    This endpoint saves the audio and fires a Celery task for Whisper Tamil ASR.
    Returns immediately with attempt_id; poll /attempts/{id}/status for score.
    """
    sess_result = await db.execute(select(TherapySession).where(TherapySession.id == session_id))
    session = sess_result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    await _verify_child_belongs_to_user(session.child_id, current_user, db)

    if session.status != SessionStatus.in_progress:
        raise HTTPException(status_code=400, detail="Session is not in progress")

    # Validate module item exists
    item_result = await db.execute(
        select(ModuleItem).where(ModuleItem.id == UUID(module_item_id))
    )
    item = item_result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Module item not found")

    # Save audio file
    audio_filename = f"{uuid.uuid4()}.webm"
    audio_path = os.path.join(settings.UPLOAD_DIR, "audio", audio_filename)
    os.makedirs(os.path.dirname(audio_path), exist_ok=True)
    with open(audio_path, "wb") as f:
        shutil.copyfileobj(audio.file, f)

    # Create attempt record
    attempt = SessionAttempt(
        session_id=session.id,
        module_item_id=item.id,
        child_id=session.child_id,
        attempt_number=attempt_number,
        mimic_played=mimic_played,
        audio_file_path=audio_path,
        scoring_status="pending",
    )
    db.add(attempt)
    await db.flush()

    # Fire Celery task
    try:
        from ..worker.tasks import score_attempt_task
        task = score_attempt_task.delay(
            str(attempt.id),
            audio_path,
            item.target_word,
            item.phoneme_breakdown or {},
        )
        attempt.celery_task_id = task.id
        attempt.scoring_status = "processing"
    except Exception:
        # Celery not available — mark as pending, will be retried
        attempt.scoring_status = "pending"

    await db.commit()
    await db.refresh(attempt)

    return {
        "attempt_id": str(attempt.id),
        "scoring_status": attempt.scoring_status,
        "message": "Audio received. Score will be available shortly.",
    }


@router.get("/{session_id}/attempts/{attempt_id}/status", response_model=AttemptStatusResponse)
async def get_attempt_status(
    session_id: UUID,
    attempt_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Poll for the scoring result of an attempt (Track B result)."""
    result = await db.execute(
        select(SessionAttempt).where(
            SessionAttempt.id == attempt_id,
            SessionAttempt.session_id == session_id,
        )
    )
    attempt = result.scalar_one_or_none()
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")

    sess_result = await db.execute(
        select(TherapySession).where(TherapySession.id == session_id)
    )
    session = sess_result.scalar_one_or_none()
    await _verify_child_belongs_to_user(session.child_id, current_user, db)

    return AttemptStatusResponse(
        attempt_id=str(attempt.id),
        scoring_status=attempt.scoring_status,
        similarity_score=attempt.similarity_score,
        asr_transcript=attempt.asr_transcript,
        phoneme_accuracy=attempt.phoneme_accuracy,
        mitra_response_type=attempt.mitra_response_type.value if attempt.mitra_response_type else None,
    )


@router.get("/{session_id}/attempts")
async def list_session_attempts(
    session_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all attempts in a session with their scores."""
    sess_result = await db.execute(select(TherapySession).where(TherapySession.id == session_id))
    session = sess_result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    await _verify_child_belongs_to_user(session.child_id, current_user, db)

    attempts_result = await db.execute(
        select(SessionAttempt)
        .where(SessionAttempt.session_id == session_id)
        .order_by(SessionAttempt.created_at)
    )
    attempts = attempts_result.scalars().all()
    return [
        {
            "attempt_id": str(a.id),
            "module_item_id": str(a.module_item_id),
            "attempt_number": a.attempt_number,
            "mimic_played": a.mimic_played,
            "scoring_status": a.scoring_status,
            "similarity_score": a.similarity_score,
            "asr_transcript": a.asr_transcript,
            "mitra_response_type": a.mitra_response_type.value if a.mitra_response_type else None,
            "created_at": a.created_at.isoformat() if a.created_at else None,
        }
        for a in attempts
    ]
