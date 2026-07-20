"""Parent router — dashboard, progress overview, assigned programs."""
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from ..database import get_db
from ..models.user import User, UserRole, ParentProfile
from ..models.child import Child
from ..models.program import AssignedProgram, ProgramStatus
from ..models.session import TherapySession, ProgressSnapshot
from ..models.content import TherapyModule, ModuleItem
from ..utils.jwt_handler import require_role

router = APIRouter()


@router.get("/dashboard")
async def parent_dashboard(
    current_user: User = Depends(require_role("parent")),
    db: AsyncSession = Depends(get_db),
):
    """Parent dashboard — children overview and recent activity."""
    children_result = await db.execute(
        select(Child).where(Child.parent_id == current_user.id)
    )
    children = children_result.scalars().all()

    children_data = []
    for child in children:
        # Active programs
        prog_result = await db.execute(
            select(AssignedProgram).where(
                AssignedProgram.child_id == child.id,
                AssignedProgram.status.in_([ProgramStatus.not_started, ProgramStatus.in_progress]),
            )
        )
        programs = prog_result.scalars().all()

        # Last session
        last_sess_result = await db.execute(
            select(TherapySession)
            .where(TherapySession.child_id == child.id)
            .order_by(TherapySession.created_at.desc())
            .limit(1)
        )
        last_session = last_sess_result.scalar_one_or_none()

        # Latest snapshot
        snap_result = await db.execute(
            select(ProgressSnapshot)
            .where(ProgressSnapshot.child_id == child.id)
            .order_by(ProgressSnapshot.snapshot_date.desc())
            .limit(1)
        )
        snap = snap_result.scalar_one_or_none()

        children_data.append({
            "id": str(child.id),
            "name": child.name,
            "age": child.age,
            "avatar_color": child.avatar_color,
            "active_programs": len(programs),
            "last_session_at": last_session.created_at.isoformat() if last_session else None,
            "last_session_score": last_session.average_score if last_session else None,
            "mastery_score": snap.mastery_score if snap else None,
            "trend": snap.trend if snap else None,
        })

    return {
        "parent_name": current_user.full_name,
        "children": children_data,
        "total_children": len(children),
    }


@router.get("/children/{child_id}/programs")
async def get_programs_for_child(
    child_id: UUID,
    current_user: User = Depends(require_role("parent")),
    db: AsyncSession = Depends(get_db),
):
    """Get all active programs for a child, with module details and items."""
    child_result = await db.execute(
        select(Child).where(Child.id == child_id, Child.parent_id == current_user.id)
    )
    child = child_result.scalar_one_or_none()
    if not child:
        raise HTTPException(status_code=404, detail="Child not found")

    prog_result = await db.execute(
        select(AssignedProgram).where(
            AssignedProgram.child_id == child.id,
            AssignedProgram.status.in_([ProgramStatus.not_started, ProgramStatus.in_progress]),
        )
    )
    programs = prog_result.scalars().all()

    out = []
    for p in programs:
        mod_result = await db.execute(
            select(TherapyModule).where(TherapyModule.id == p.module_id)
        )
        module = mod_result.scalar_one_or_none()
        if not module:
            continue

        items_result = await db.execute(
            select(ModuleItem)
            .where(ModuleItem.module_id == module.id)
            .order_by(ModuleItem.order_index)
        )
        items = items_result.scalars().all()

        out.append({
            "program_id": str(p.id),
            "module_id": str(module.id),
            "module_name": module.title,
            "module_description": module.description,
            "module_level": module.difficulty.value,
            "status": p.status.value,
            "item_count": len(items),
            "items": [
                {
                    "id": str(item.id),
                    "tamil_word": item.target_word,
                    "transliteration": item.transliteration,
                    "english_translation": item.meaning,
                    "image_url": item.image_url,
                    "order_index": item.order_index,
                }
                for item in items
            ],
        })

    return out


@router.get("/children/{child_id}/progress")
async def get_child_progress(
    child_id: UUID,
    current_user: User = Depends(require_role("parent")),
    db: AsyncSession = Depends(get_db),
):
    """Parent view of a child's progress."""
    child_result = await db.execute(
        select(Child).where(Child.id == child_id, Child.parent_id == current_user.id)
    )
    child = child_result.scalar_one_or_none()
    if not child:
        raise HTTPException(status_code=404, detail="Child not found")

    # Recent sessions
    sess_result = await db.execute(
        select(TherapySession)
        .where(TherapySession.child_id == child.id)
        .order_by(TherapySession.created_at.desc())
        .limit(30)
    )
    sessions = sess_result.scalars().all()

    scores = [s.average_score for s in sessions if s.average_score is not None]

    # Snapshots (last 30 days)
    snap_result = await db.execute(
        select(ProgressSnapshot)
        .where(ProgressSnapshot.child_id == child.id)
        .order_by(ProgressSnapshot.snapshot_date.desc())
        .limit(30)
    )
    snapshots = snap_result.scalars().all()

    return {
        "child_id": str(child.id),
        "child_name": child.name,
        "overall_average_score": sum(scores) / len(scores) if scores else None,
        "total_sessions": len(sessions),
        "recent_sessions": [
            {
                "id": str(s.id),
                "average_score": s.average_score,
                "completed_items": s.completed_items,
                "total_items": s.total_items,
                "created_at": s.created_at.isoformat() if s.created_at else None,
            }
            for s in sessions[:10]
        ],
        "progress_snapshots": [
            {
                "date": snap.snapshot_date.isoformat(),
                "mastery_score": snap.mastery_score,
                "trend": snap.trend,
                "items_mastered": snap.items_mastered,
            }
            for snap in snapshots
        ],
    }


@router.get("/profile")
async def get_parent_profile(
    current_user: User = Depends(require_role("parent")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ParentProfile).where(ParentProfile.user_id == current_user.id)
    )
    profile = result.scalar_one_or_none()
    return {
        "user_id": str(current_user.id),
        "email": current_user.email,
        "full_name": current_user.full_name,
        "phone": profile.phone if profile else None,
        "preferred_language": profile.preferred_language if profile else "ta",
    }
