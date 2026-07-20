"""Children router — scoped to parent or therapist."""
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from ..database import get_db
from ..models.user import User, UserRole
from ..models.child import Child
from ..models.program import AssignedProgram
from ..models.session import TherapySession, ProgressSnapshot
from ..utils.jwt_handler import get_current_user

router = APIRouter()


class ChildDetail(BaseModel):
    id: str
    name: str
    age: int
    gender: Optional[str] = None
    avatar_color: Optional[str] = None
    diagnosis_notes: Optional[str] = None
    parent_id: str
    therapist_id: Optional[str] = None
    total_sessions: int = 0
    average_score: Optional[float] = None


async def _get_child_or_403(child_id: UUID, current_user: User, db: AsyncSession) -> Child:
    """Return child if the current user is its parent OR assigned therapist."""
    result = await db.execute(select(Child).where(Child.id == child_id))
    child = result.scalar_one_or_none()
    if not child:
        raise HTTPException(status_code=404, detail="Child not found")

    if current_user.role == UserRole.parent and child.parent_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    if current_user.role == UserRole.therapist and child.therapist_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    # Admin can access everything
    return child


@router.get("/{child_id}", response_model=ChildDetail)
async def get_child(
    child_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    child = await _get_child_or_403(child_id, current_user, db)

    # Count sessions
    sess_result = await db.execute(
        select(TherapySession).where(TherapySession.child_id == child_id)
    )
    sessions = sess_result.scalars().all()
    total_sessions = len(sessions)
    scores = [s.average_score for s in sessions if s.average_score is not None]
    avg_score = sum(scores) / len(scores) if scores else None

    return ChildDetail(
        id=str(child.id),
        name=child.name,
        age=child.age,
        gender=child.gender,
        avatar_color=child.avatar_color,
        diagnosis_notes=child.diagnosis_notes,
        parent_id=str(child.parent_id),
        therapist_id=str(child.therapist_id) if child.therapist_id else None,
        total_sessions=total_sessions,
        average_score=avg_score,
    )


@router.get("/{child_id}/programs")
async def get_child_programs(
    child_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    child = await _get_child_or_403(child_id, current_user, db)
    result = await db.execute(
        select(AssignedProgram).where(AssignedProgram.child_id == child.id)
    )
    programs = result.scalars().all()
    return [
        {
            "id": str(p.id),
            "module_id": str(p.module_id),
            "child_id": str(p.child_id),
            "assigned_by_id": str(p.assigned_by_id) if p.assigned_by_id else None,
            "status": p.status.value,
            "start_date": p.start_date.isoformat() if p.start_date else None,
            "created_at": p.created_at.isoformat() if p.created_at else None,
        }
        for p in programs
    ]


@router.get("/{child_id}/sessions")
async def get_child_sessions(
    child_id: UUID,
    limit: int = 20,
    offset: int = 0,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    child = await _get_child_or_403(child_id, current_user, db)
    result = await db.execute(
        select(TherapySession)
        .where(TherapySession.child_id == child.id)
        .order_by(TherapySession.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    sessions = result.scalars().all()
    return [
        {
            "id": str(s.id),
            "status": s.status.value,
            "total_items": s.total_items,
            "completed_items": s.completed_items,
            "average_score": s.average_score,
            "session_duration_seconds": s.session_duration_seconds,
            "created_at": s.created_at.isoformat() if s.created_at else None,
            "completed_at": s.completed_at.isoformat() if s.completed_at else None,
        }
        for s in sessions
    ]


@router.get("/{child_id}/progress-snapshots")
async def get_child_progress_snapshots(
    child_id: UUID,
    module_id: Optional[UUID] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    child = await _get_child_or_403(child_id, current_user, db)
    query = select(ProgressSnapshot).where(ProgressSnapshot.child_id == child.id)
    if module_id:
        query = query.where(ProgressSnapshot.module_id == module_id)
    query = query.order_by(ProgressSnapshot.snapshot_date.desc()).limit(90)
    result = await db.execute(query)
    snapshots = result.scalars().all()
    return [
        {
            "id": str(s.id),
            "module_id": str(s.module_id),
            "snapshot_date": s.snapshot_date.isoformat(),
            "mastery_score": s.mastery_score,
            "trend": s.trend,
            "items_mastered": s.items_mastered,
            "total_attempts": s.total_attempts,
            "average_score": s.average_score,
            "session_count": s.session_count,
        }
        for s in snapshots
    ]
