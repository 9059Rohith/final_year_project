"""Admin router — user management, system stats, seed trigger."""
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from ..database import get_db
from ..models.user import User, UserRole
from ..models.child import Child
from ..models.session import TherapySession, SessionAttempt
from ..models.content import TherapyModule
from ..utils.jwt_handler import require_role

router = APIRouter()


class UserUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    is_active: Optional[bool] = None
    role: Optional[UserRole] = None


@router.get("/stats")
async def system_stats(
    current_user: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    """Overall system statistics."""
    user_count = await db.execute(select(func.count(User.id)))
    child_count = await db.execute(select(func.count(Child.id)))
    session_count = await db.execute(select(func.count(TherapySession.id)))
    attempt_count = await db.execute(select(func.count(SessionAttempt.id)))
    module_count = await db.execute(select(func.count(TherapyModule.id)))

    # Role breakdown
    therapist_count = await db.execute(
        select(func.count(User.id)).where(User.role == UserRole.therapist)
    )
    parent_count = await db.execute(
        select(func.count(User.id)).where(User.role == UserRole.parent)
    )

    return {
        "total_users": user_count.scalar(),
        "therapists": therapist_count.scalar(),
        "parents": parent_count.scalar(),
        "total_children": child_count.scalar(),
        "total_sessions": session_count.scalar(),
        "total_attempts": attempt_count.scalar(),
        "total_modules": module_count.scalar(),
    }


@router.get("/users")
async def list_users(
    role: Optional[str] = None,
    is_active: Optional[bool] = None,
    limit: int = 50,
    offset: int = 0,
    current_user: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    query = select(User)
    if role:
        query = query.where(User.role == role)
    if is_active is not None:
        query = query.where(User.is_active == is_active)
    query = query.order_by(User.created_at.desc()).limit(limit).offset(offset)
    result = await db.execute(query)
    users = result.scalars().all()
    return [
        {
            "id": str(u.id),
            "email": u.email,
            "full_name": u.full_name,
            "role": u.role.value,
            "is_active": u.is_active,
            "email_verified": u.email_verified,
            "created_at": u.created_at.isoformat() if u.created_at else None,
        }
        for u in users
    ]


@router.get("/users/{user_id}")
async def get_user(
    user_id: UUID,
    current_user: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "id": str(user.id),
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role.value,
        "is_active": user.is_active,
        "email_verified": user.email_verified,
        "created_at": user.created_at.isoformat() if user.created_at else None,
    }


@router.patch("/users/{user_id}")
async def update_user(
    user_id: UUID,
    body: UserUpdateRequest,
    current_user: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if body.full_name is not None:
        user.full_name = body.full_name
    if body.is_active is not None:
        user.is_active = body.is_active
    if body.role is not None:
        user.role = body.role

    await db.commit()
    return {"id": str(user.id), "is_active": user.is_active, "role": user.role.value}


@router.delete("/users/{user_id}", status_code=204)
async def delete_user(
    user_id: UUID,
    current_user: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    await db.delete(user)
    await db.commit()


@router.post("/seed")
async def run_seed(
    current_user: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    """Run the database seed script (idempotent — skips if already seeded)."""
    try:
        from ..db.seed import seed
        await seed(db)
        return {"message": "Seed completed successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Seed failed: {str(e)}")


@router.get("/children")
async def list_all_children(
    limit: int = 50,
    offset: int = 0,
    current_user: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Child).order_by(Child.created_at.desc()).limit(limit).offset(offset)
    )
    children = result.scalars().all()
    return [
        {
            "id": str(c.id),
            "name": c.name,
            "age": c.age,
            "parent_id": str(c.parent_id),
            "therapist_id": str(c.therapist_id) if c.therapist_id else None,
            "created_at": c.created_at.isoformat() if c.created_at else None,
        }
        for c in children
    ]
