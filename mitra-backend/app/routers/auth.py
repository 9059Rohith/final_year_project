"""Authentication router: register, login, refresh, logout, child profile CRUD."""
from datetime import timedelta
from typing import Optional, List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Response, Cookie, status
from pydantic import BaseModel, EmailStr, field_validator
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from passlib.context import CryptContext

from ..database import get_db
from ..config import settings
from ..models.user import User, UserRole, TherapistProfile, ParentProfile
from ..models.child import Child
from ..utils.jwt_handler import (
    create_access_token,
    create_refresh_token,
    decode_token,
    get_current_user,
)

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# ── Pydantic schemas ──────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    email: EmailStr
    full_name: str
    password: str
    role: UserRole = UserRole.parent
    # Therapist fields
    license_number: Optional[str] = None
    specialization: Optional[str] = None
    # Parent fields
    phone: Optional[str] = None

    @field_validator("password")
    @classmethod
    def password_strength(cls, v):
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user_id: str
    email: str
    full_name: str
    role: str


class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    is_active: bool
    avatar_url: Optional[str] = None

    class Config:
        from_attributes = True


class ChildCreateRequest(BaseModel):
    name: str
    age: int
    gender: Optional[str] = None
    avatar_color: Optional[str] = "#F97316"
    diagnosis_notes: Optional[str] = None
    therapist_id: Optional[str] = None


class ChildResponse(BaseModel):
    id: str
    name: str
    age: int
    gender: Optional[str] = None
    avatar_color: Optional[str] = None
    diagnosis_notes: Optional[str] = None
    parent_id: str
    therapist_id: Optional[str] = None

    class Config:
        from_attributes = True


class ChildUpdateRequest(BaseModel):
    name: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    avatar_color: Optional[str] = None
    diagnosis_notes: Optional[str] = None


# ── Helpers ───────────────────────────────────────────────────────────────────

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def hash_password(plain: str) -> str:
    return pwd_context.hash(plain)


def _set_auth_cookies(response: Response, access_token: str, refresh_token: str):
    response.set_cookie(
        "access_token",
        access_token,
        httponly=True,
        samesite="lax",
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        secure=settings.APP_ENV == "production",
    )
    response.set_cookie(
        "refresh_token",
        refresh_token,
        httponly=True,
        samesite="lax",
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400,
        secure=settings.APP_ENV == "production",
    )


# ── Routes ────────────────────────────────────────────────────────────────────

@router.post("/register", response_model=TokenResponse, status_code=201)
async def register(
    body: RegisterRequest,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    """Register a new therapist or parent account."""
    # Check duplicate email
    existing = await db.execute(select(User).where(User.email == body.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    # Create user
    user = User(
        email=body.email,
        full_name=body.full_name,
        password_hash=hash_password(body.password),
        role=body.role,
        is_active=True,
        email_verified=False,
    )
    db.add(user)
    await db.flush()  # get user.id

    # Create profile
    if body.role == UserRole.therapist:
        profile = TherapistProfile(
            user_id=user.id,
            license_number=body.license_number,
            specialization=body.specialization,
        )
        db.add(profile)
    elif body.role == UserRole.parent:
        profile = ParentProfile(
            user_id=user.id,
            phone=body.phone,
            preferred_language="ta",
        )
        db.add(profile)

    await db.commit()
    await db.refresh(user)

    access_token = create_access_token({"sub": user.email, "role": user.role.value})
    refresh_token = create_refresh_token({"sub": user.email})
    _set_auth_cookies(response, access_token, refresh_token)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user_id=str(user.id),
        email=user.email,
        full_name=user.full_name,
        role=user.role.value,
    )


@router.post("/login", response_model=TokenResponse)
async def login(
    body: LoginRequest,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    """Login and receive httpOnly cookies."""
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()

    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is deactivated")

    access_token = create_access_token({"sub": user.email, "role": user.role.value})
    refresh_token = create_refresh_token({"sub": user.email})
    _set_auth_cookies(response, access_token, refresh_token)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user_id=str(user.id),
        email=user.email,
        full_name=user.full_name,
        role=user.role.value,
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    response: Response,
    refresh_token: Optional[str] = Cookie(None),
    db: AsyncSession = Depends(get_db),
):
    """Use refresh token cookie to get a new access token."""
    if not refresh_token:
        raise HTTPException(status_code=401, detail="No refresh token")

    payload = decode_token(refresh_token)
    if payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid token type")

    email = payload.get("sub")
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found or inactive")

    new_access = create_access_token({"sub": user.email, "role": user.role.value})
    new_refresh = create_refresh_token({"sub": user.email})
    _set_auth_cookies(response, new_access, new_refresh)

    return TokenResponse(
        access_token=new_access,
        refresh_token=new_refresh,
        user_id=str(user.id),
        email=user.email,
        full_name=user.full_name,
        role=user.role.value,
    )


@router.post("/logout")
async def logout(response: Response):
    """Clear auth cookies."""
    response.delete_cookie("access_token")
    response.delete_cookie("refresh_token")
    return {"message": "Logged out successfully"}


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """Return the current authenticated user."""
    return UserResponse(
        id=str(current_user.id),
        email=current_user.email,
        full_name=current_user.full_name,
        role=current_user.role.value,
        is_active=current_user.is_active,
        avatar_url=current_user.avatar_url,
    )


# ── Child profile CRUD (scoped to parent) ─────────────────────────────────────

@router.get("/children", response_model=List[ChildResponse])
async def list_my_children(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Parent: list own children."""
    if current_user.role != UserRole.parent:
        raise HTTPException(status_code=403, detail="Only parents can access this endpoint")
    result = await db.execute(select(Child).where(Child.parent_id == current_user.id))
    children = result.scalars().all()
    return [
        ChildResponse(
            id=str(c.id),
            name=c.name,
            age=c.age,
            gender=c.gender,
            avatar_color=c.avatar_color,
            diagnosis_notes=c.diagnosis_notes,
            parent_id=str(c.parent_id),
            therapist_id=str(c.therapist_id) if c.therapist_id else None,
        )
        for c in children
    ]


@router.post("/children", response_model=ChildResponse, status_code=201)
async def create_child(
    body: ChildCreateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Parent: add a child profile."""
    if current_user.role != UserRole.parent:
        raise HTTPException(status_code=403, detail="Only parents can add children")

    therapist_id = None
    if body.therapist_id:
        t_result = await db.execute(
            select(User).where(User.id == UUID(body.therapist_id), User.role == UserRole.therapist)
        )
        if not t_result.scalar_one_or_none():
            raise HTTPException(status_code=404, detail="Therapist not found")
        therapist_id = UUID(body.therapist_id)

    child = Child(
        name=body.name,
        age=body.age,
        gender=body.gender,
        avatar_color=body.avatar_color or "#F97316",
        diagnosis_notes=body.diagnosis_notes,
        parent_id=current_user.id,
        therapist_id=therapist_id,
    )
    db.add(child)
    await db.commit()
    await db.refresh(child)

    return ChildResponse(
        id=str(child.id),
        name=child.name,
        age=child.age,
        gender=child.gender,
        avatar_color=child.avatar_color,
        diagnosis_notes=child.diagnosis_notes,
        parent_id=str(child.parent_id),
        therapist_id=str(child.therapist_id) if child.therapist_id else None,
    )


@router.put("/children/{child_id}", response_model=ChildResponse)
async def update_child(
    child_id: UUID,
    body: ChildUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Child).where(Child.id == child_id, Child.parent_id == current_user.id)
    )
    child = result.scalar_one_or_none()
    if not child:
        raise HTTPException(status_code=404, detail="Child not found")

    if body.name is not None:
        child.name = body.name
    if body.age is not None:
        child.age = body.age
    if body.gender is not None:
        child.gender = body.gender
    if body.avatar_color is not None:
        child.avatar_color = body.avatar_color
    if body.diagnosis_notes is not None:
        child.diagnosis_notes = body.diagnosis_notes

    await db.commit()
    await db.refresh(child)
    return ChildResponse(
        id=str(child.id),
        name=child.name,
        age=child.age,
        gender=child.gender,
        avatar_color=child.avatar_color,
        diagnosis_notes=child.diagnosis_notes,
        parent_id=str(child.parent_id),
        therapist_id=str(child.therapist_id) if child.therapist_id else None,
    )


@router.delete("/children/{child_id}", status_code=204)
async def delete_child(
    child_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Child).where(Child.id == child_id, Child.parent_id == current_user.id)
    )
    child = result.scalar_one_or_none()
    if not child:
        raise HTTPException(status_code=404, detail="Child not found")
    await db.delete(child)
    await db.commit()
