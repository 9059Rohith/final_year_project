"""Therapist router — dashboard, assigned children, notes, module assignment."""
from datetime import date
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from ..database import get_db
from ..models.user import User, UserRole, TherapistProfile
from ..models.child import Child
from ..models.content import TherapyModule
from ..models.program import AssignedProgram, ProgramStatus
from ..models.session import TherapySession, ProgressSnapshot
from ..models.social import TherapistNote
from ..utils.jwt_handler import get_current_user, require_role

router = APIRouter()


class NoteCreate(BaseModel):
    child_id: str
    content: str
    note_type: str = "general"  # general | milestone | concern


class NoteResponse(BaseModel):
    id: str
    child_id: str
    therapist_id: str
    content: str
    note_type: str
    created_at: str


class AssignProgramRequest(BaseModel):
    child_id: str
    module_id: str
    target_sessions_per_week: int = 3


# ── Dashboard ─────────────────────────────────────────────────────────────────

@router.get("/dashboard")
async def therapist_dashboard(
    current_user: User = Depends(require_role("therapist")),
    db: AsyncSession = Depends(get_db),
):
    """Summary stats for the therapist's dashboard."""
    # Children under this therapist
    children_result = await db.execute(
        select(Child).where(Child.therapist_id == current_user.id)
    )
    children = children_result.scalars().all()
    child_ids = [c.id for c in children]

    total_sessions = 0
    if child_ids:
        sess_count = await db.execute(
            select(func.count(TherapySession.id)).where(
                TherapySession.child_id.in_(child_ids)
            )
        )
        total_sessions = sess_count.scalar() or 0

    # Recent sessions
    recent_sessions = []
    if child_ids:
        recent_result = await db.execute(
            select(TherapySession)
            .where(TherapySession.child_id.in_(child_ids))
            .order_by(TherapySession.created_at.desc())
            .limit(10)
        )
        for s in recent_result.scalars().all():
            child = next((c for c in children if c.id == s.child_id), None)
            recent_sessions.append({
                "session_id": str(s.id),
                "child_name": child.name if child else "Unknown",
                "status": s.status.value,
                "average_score": s.average_score,
                "created_at": s.created_at.isoformat() if s.created_at else None,
            })

    return {
        "therapist_name": current_user.full_name,
        "total_children": len(children),
        "total_sessions": total_sessions,
        "recent_sessions": recent_sessions,
        "children": [
            {
                "id": str(c.id),
                "name": c.name,
                "age": c.age,
                "avatar_color": c.avatar_color,
            }
            for c in children
        ],
    }


# ── Children management ───────────────────────────────────────────────────────

@router.get("/children")
async def list_my_children(
    current_user: User = Depends(require_role("therapist")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Child).where(Child.therapist_id == current_user.id)
    )
    children = result.scalars().all()
    out = []
    for c in children:
        # Latest progress snapshot
        snap_result = await db.execute(
            select(ProgressSnapshot)
            .where(ProgressSnapshot.child_id == c.id)
            .order_by(ProgressSnapshot.snapshot_date.desc())
            .limit(1)
        )
        snap = snap_result.scalar_one_or_none()
        out.append({
            "id": str(c.id),
            "name": c.name,
            "age": c.age,
            "gender": c.gender,
            "avatar_color": c.avatar_color,
            "diagnosis_notes": c.diagnosis_notes,
            "parent_id": str(c.parent_id),
            "latest_mastery_score": snap.mastery_score if snap else None,
            "latest_trend": snap.trend if snap else None,
        })
    return out


# ── Notes ─────────────────────────────────────────────────────────────────────

@router.post("/notes", response_model=NoteResponse, status_code=201)
async def create_note(
    body: NoteCreate,
    current_user: User = Depends(require_role("therapist")),
    db: AsyncSession = Depends(get_db),
):
    # Verify the child belongs to this therapist
    child_result = await db.execute(
        select(Child).where(
            Child.id == UUID(body.child_id),
            Child.therapist_id == current_user.id,
        )
    )
    child = child_result.scalar_one_or_none()
    if not child:
        raise HTTPException(status_code=404, detail="Child not found or not assigned to you")

    # Get therapist profile
    prof_result = await db.execute(
        select(TherapistProfile).where(TherapistProfile.user_id == current_user.id)
    )
    profile = prof_result.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=400, detail="Therapist profile not found")

    note = TherapistNote(
        therapist_id=profile.id,
        child_id=child.id,
        content=body.content,
        note_type=body.note_type,
    )
    db.add(note)
    await db.commit()
    await db.refresh(note)

    return NoteResponse(
        id=str(note.id),
        child_id=str(note.child_id),
        therapist_id=str(note.therapist_id),
        content=note.content,
        note_type=note.note_type,
        created_at=note.created_at.isoformat(),
    )


@router.get("/notes/{child_id}", response_model=List[NoteResponse])
async def get_child_notes(
    child_id: UUID,
    current_user: User = Depends(require_role("therapist")),
    db: AsyncSession = Depends(get_db),
):
    child_result = await db.execute(
        select(Child).where(Child.id == child_id, Child.therapist_id == current_user.id)
    )
    if not child_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Child not found")

    prof_result = await db.execute(
        select(TherapistProfile).where(TherapistProfile.user_id == current_user.id)
    )
    profile = prof_result.scalar_one_or_none()

    result = await db.execute(
        select(TherapistNote)
        .where(
            TherapistNote.child_id == child_id,
            TherapistNote.therapist_id == profile.id,
        )
        .order_by(TherapistNote.created_at.desc())
    )
    notes = result.scalars().all()
    return [
        NoteResponse(
            id=str(n.id),
            child_id=str(n.child_id),
            therapist_id=str(n.therapist_id),
            content=n.content,
            note_type=n.note_type,
            created_at=n.created_at.isoformat(),
        )
        for n in notes
    ]


# ── Program assignment ────────────────────────────────────────────────────────

@router.post("/assign-program", status_code=201)
async def assign_program(
    body: AssignProgramRequest,
    current_user: User = Depends(require_role("therapist")),
    db: AsyncSession = Depends(get_db),
):
    child_result = await db.execute(
        select(Child).where(
            Child.id == UUID(body.child_id),
            Child.therapist_id == current_user.id,
        )
    )
    child = child_result.scalar_one_or_none()
    if not child:
        raise HTTPException(status_code=404, detail="Child not found")

    module_result = await db.execute(
        select(TherapyModule).where(TherapyModule.id == UUID(body.module_id))
    )
    if not module_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Module not found")

    # target_sessions_per_week has no dedicated column on assigned_programs (see
    # migration 0001) — stash it in `notes` rather than silently dropping it.
    program = AssignedProgram(
        child_id=child.id,
        module_id=UUID(body.module_id),
        assigned_by_id=current_user.id,
        status=ProgramStatus.not_started,
        start_date=date.today(),
        notes=f"target_sessions_per_week={body.target_sessions_per_week}",
    )
    db.add(program)
    await db.commit()
    await db.refresh(program)

    return {
        "id": str(program.id),
        "child_id": str(program.child_id),
        "module_id": str(program.module_id),
        "status": program.status.value,
        "target_sessions_per_week": body.target_sessions_per_week,
    }


@router.get("/profile")
async def get_therapist_profile(
    current_user: User = Depends(require_role("therapist")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(TherapistProfile).where(TherapistProfile.user_id == current_user.id)
    )
    profile = result.scalar_one_or_none()
    return {
        "user_id": str(current_user.id),
        "email": current_user.email,
        "full_name": current_user.full_name,
        "license_number": profile.license_number if profile else None,
        "specialization": profile.specialization if profile else None,
        "bio": profile.bio if profile else None,
        "years_of_experience": profile.years_of_experience if profile else 0,
    }
