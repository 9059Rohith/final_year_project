"""Progress analytics router."""
from typing import Optional, List
from uuid import UUID
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from ..database import get_db
from ..models.user import User, UserRole
from ..models.child import Child
from ..models.session import TherapySession, SessionAttempt, ProgressSnapshot
from ..models.content import TherapyModule, ModuleItem
from ..utils.jwt_handler import get_current_user

router = APIRouter()


async def _verify_access(child_id: UUID, current_user: User, db: AsyncSession) -> Child:
    result = await db.execute(select(Child).where(Child.id == child_id))
    child = result.scalar_one_or_none()
    if not child:
        raise HTTPException(status_code=404, detail="Child not found")
    if current_user.role == UserRole.parent and child.parent_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    if current_user.role == UserRole.therapist and child.therapist_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    return child


@router.get("/child/{child_id}/summary")
async def child_progress_summary(
    child_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Overall progress summary for a child."""
    child = await _verify_access(child_id, current_user, db)

    # Session stats
    all_sessions = await db.execute(
        select(TherapySession).where(TherapySession.child_id == child_id)
    )
    sessions = all_sessions.scalars().all()
    completed = [s for s in sessions if s.status.value == "completed"]
    scores = [s.average_score for s in completed if s.average_score is not None]

    # Attempts stats
    all_attempts = await db.execute(
        select(SessionAttempt).where(
            SessionAttempt.child_id == child_id,
            SessionAttempt.scoring_status == "done",
        )
    )
    attempts = all_attempts.scalars().all()
    attempt_scores = [a.similarity_score for a in attempts if a.similarity_score is not None]

    # Last 7 days sessions
    week_ago = datetime.now(timezone.utc) - timedelta(days=7)
    recent_sessions = [s for s in sessions if s.created_at and s.created_at >= week_ago]

    # Module breakdown
    module_snap_result = await db.execute(
        select(ProgressSnapshot)
        .where(ProgressSnapshot.child_id == child_id)
        .order_by(ProgressSnapshot.snapshot_date.desc())
    )
    all_snaps = module_snap_result.scalars().all()
    # Latest per module
    latest_per_module = {}
    for snap in all_snaps:
        mid = str(snap.module_id)
        if mid not in latest_per_module:
            latest_per_module[mid] = snap

    module_summaries = []
    for mid, snap in latest_per_module.items():
        mod_result = await db.execute(
            select(TherapyModule).where(TherapyModule.id == snap.module_id)
        )
        mod = mod_result.scalar_one_or_none()
        module_summaries.append({
            "module_id": mid,
            "module_name": mod.name if mod else "Unknown",
            "mastery_score": snap.mastery_score,
            "trend": snap.trend,
            "items_mastered": snap.items_mastered,
            "session_count": snap.session_count,
        })

    return {
        "child_id": str(child_id),
        "child_name": child.name,
        "total_sessions": len(sessions),
        "completed_sessions": len(completed),
        "overall_average_score": round(sum(scores) / len(scores), 1) if scores else None,
        "overall_attempt_average": round(sum(attempt_scores) / len(attempt_scores), 1) if attempt_scores else None,
        "sessions_this_week": len(recent_sessions),
        "total_attempts": len(attempts),
        "module_progress": module_summaries,
    }


@router.get("/child/{child_id}/timeseries")
async def child_progress_timeseries(
    child_id: UUID,
    days: int = Query(30, ge=7, le=365),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Daily score timeseries for charting."""
    await _verify_access(child_id, current_user, db)

    since = datetime.now(timezone.utc) - timedelta(days=days)
    result = await db.execute(
        select(TherapySession)
        .where(
            TherapySession.child_id == child_id,
            TherapySession.created_at >= since,
            TherapySession.status == "completed",
        )
        .order_by(TherapySession.created_at)
    )
    sessions = result.scalars().all()

    # Group by date
    daily: dict = {}
    for s in sessions:
        if s.created_at and s.average_score is not None:
            date_key = s.created_at.date().isoformat()
            if date_key not in daily:
                daily[date_key] = []
            daily[date_key].append(s.average_score)

    return {
        "child_id": str(child_id),
        "days": days,
        "timeseries": [
            {
                "date": date,
                "average_score": round(sum(scores) / len(scores), 1),
                "session_count": len(scores),
            }
            for date, scores in sorted(daily.items())
        ],
    }


@router.get("/child/{child_id}/by-module")
async def child_progress_by_module(
    child_id: UUID,
    module_id: Optional[UUID] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Per-word performance within a module."""
    await _verify_access(child_id, current_user, db)

    # Get module items
    query = select(ModuleItem)
    if module_id:
        query = query.where(ModuleItem.module_id == module_id)

    items_result = await db.execute(query.order_by(ModuleItem.order_index))
    items = items_result.scalars().all()

    word_stats = []
    for item in items:
        attempts_result = await db.execute(
            select(SessionAttempt).where(
                SessionAttempt.module_item_id == item.id,
                SessionAttempt.child_id == child_id,
                SessionAttempt.scoring_status == "done",
            )
        )
        attempts = attempts_result.scalars().all()
        scores = [a.similarity_score for a in attempts if a.similarity_score is not None]

        word_stats.append({
            "item_id": str(item.id),
            "tamil_word": item.target_word,
            "transliteration": item.transliteration,
            "total_attempts": len(attempts),
            "average_score": round(sum(scores) / len(scores), 1) if scores else None,
            "best_score": max(scores) if scores else None,
            "mastered": (sum(scores) / len(scores)) >= 80 if len(scores) >= 3 else False,
        })

    return {"child_id": str(child_id), "word_stats": word_stats}


@router.get("/child/{child_id}/streaks")
async def child_streaks(
    child_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Calculate current and best practice streaks."""
    await _verify_access(child_id, current_user, db)

    result = await db.execute(
        select(TherapySession)
        .where(
            TherapySession.child_id == child_id,
            TherapySession.status == "completed",
        )
        .order_by(TherapySession.created_at.desc())
        .limit(365)
    )
    sessions = result.scalars().all()

    if not sessions:
        return {"current_streak": 0, "best_streak": 0, "total_practice_days": 0}

    practice_days = sorted(
        set(s.created_at.date() for s in sessions if s.created_at),
        reverse=True,
    )

    # Current streak
    current_streak = 0
    today = datetime.now(timezone.utc).date()
    check_date = today
    for day in practice_days:
        if day == check_date or day == check_date - timedelta(days=1):
            current_streak += 1
            check_date = day
        else:
            break

    # Best streak
    best_streak = 1
    temp_streak = 1
    for i in range(1, len(practice_days)):
        if (practice_days[i - 1] - practice_days[i]).days == 1:
            temp_streak += 1
            best_streak = max(best_streak, temp_streak)
        else:
            temp_streak = 1

    return {
        "current_streak": current_streak,
        "best_streak": best_streak,
        "total_practice_days": len(practice_days),
    }
