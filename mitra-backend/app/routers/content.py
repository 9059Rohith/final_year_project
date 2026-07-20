"""Content router — therapy modules and module items CRUD."""
import os
import shutil
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from ..database import get_db
from ..models.user import User, UserRole
from ..models.content import TherapyModule, ModuleItem, DifficultyLevel
from ..config import settings
from ..utils.jwt_handler import get_current_user, require_role

router = APIRouter()


# ── Schemas ───────────────────────────────────────────────────────────────────

class ModuleCreate(BaseModel):
    name: str
    description: Optional[str] = None
    difficulty_level: str = "beginner"
    language_code: str = "ta"
    tags: Optional[List[str]] = None


class ModuleUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    difficulty_level: Optional[str] = None
    is_published: Optional[bool] = None
    tags: Optional[List[str]] = None


class ModuleItemCreate(BaseModel):
    tamil_word: str
    transliteration: str
    english_translation: str
    phoneme_breakdown: Optional[dict] = None
    order_index: int = 0
    image_url: Optional[str] = None
    audio_url: Optional[str] = None


class ModuleItemUpdate(BaseModel):
    tamil_word: Optional[str] = None
    transliteration: Optional[str] = None
    english_translation: Optional[str] = None
    phoneme_breakdown: Optional[dict] = None
    order_index: Optional[int] = None
    image_url: Optional[str] = None


# ── Module endpoints ──────────────────────────────────────────────────────────

@router.get("/modules")
async def list_modules(
    published_only: bool = False,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all modules. Published-only flag for parents."""
    query = select(TherapyModule)
    if published_only or current_user.role == UserRole.parent:
        query = query.where(TherapyModule.is_published == True)
    result = await db.execute(query.order_by(TherapyModule.created_at.desc()))
    modules = result.scalars().all()
    return [
        {
            "id": str(m.id),
            "name": m.title,
            "description": m.description,
            "difficulty_level": m.difficulty.value,
            "language_code": m.language,
            "is_published": m.is_published,
            "tags": [],
            "created_at": m.created_at.isoformat() if m.created_at else None,
        }
        for m in modules
    ]


@router.post("/modules", status_code=201)
async def create_module(
    body: ModuleCreate,
    current_user: User = Depends(require_role("therapist", "admin")),
    db: AsyncSession = Depends(get_db),
):
    module = TherapyModule(
        title=body.name,
        description=body.description,
        difficulty=DifficultyLevel(body.difficulty_level),
        language=body.language_code,
        is_published=False,
        created_by_id=current_user.id,
    )
    db.add(module)
    await db.commit()
    await db.refresh(module)
    return {
        "id": str(module.id),
        "name": module.title,
        "description": module.description,
        "difficulty_level": module.difficulty.value,
        "is_published": module.is_published,
    }


@router.get("/modules/{module_id}")
async def get_module(
    module_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(TherapyModule).where(TherapyModule.id == module_id))
    module = result.scalar_one_or_none()
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")

    items_result = await db.execute(
        select(ModuleItem)
        .where(ModuleItem.module_id == module_id)
        .order_by(ModuleItem.order_index)
    )
    items = items_result.scalars().all()

    return {
        "id": str(module.id),
        "name": module.title,
        "description": module.description,
        "difficulty_level": module.difficulty.value,
        "language_code": module.language,
        "is_published": module.is_published,
        "tags": [],
        "items": [
            {
                "id": str(i.id),
                "tamil_word": i.target_word,
                "transliteration": i.transliteration,
                "english_translation": i.meaning,
                "phoneme_breakdown": i.phoneme_breakdown,
                "image_url": i.image_url,
                "audio_url": i.reference_audio_url,
                "order_index": i.order_index,
            }
            for i in items
        ],
    }


@router.patch("/modules/{module_id}")
async def update_module(
    module_id: UUID,
    body: ModuleUpdate,
    current_user: User = Depends(require_role("therapist", "admin")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(TherapyModule).where(TherapyModule.id == module_id))
    module = result.scalar_one_or_none()
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")

    if body.name is not None:
        module.title = body.name
    if body.description is not None:
        module.description = body.description
    if body.difficulty_level is not None:
        module.difficulty = DifficultyLevel(body.difficulty_level)
    if body.is_published is not None:
        module.is_published = body.is_published
    # body.tags: no column for this on TherapyModule — accepted but not persisted.

    await db.commit()
    await db.refresh(module)
    return {"id": str(module.id), "name": module.title, "is_published": module.is_published}


@router.delete("/modules/{module_id}", status_code=204)
async def delete_module(
    module_id: UUID,
    current_user: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(TherapyModule).where(TherapyModule.id == module_id))
    module = result.scalar_one_or_none()
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")
    await db.delete(module)
    await db.commit()


@router.post("/modules/{module_id}/publish")
async def publish_module(
    module_id: UUID,
    current_user: User = Depends(require_role("therapist", "admin")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(TherapyModule).where(TherapyModule.id == module_id))
    module = result.scalar_one_or_none()
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")
    module.is_published = True
    await db.commit()
    return {"id": str(module.id), "is_published": True}


# ── Module item endpoints ─────────────────────────────────────────────────────

@router.post("/modules/{module_id}/items", status_code=201)
async def add_module_item(
    module_id: UUID,
    body: ModuleItemCreate,
    current_user: User = Depends(require_role("therapist", "admin")),
    db: AsyncSession = Depends(get_db),
):
    mod_result = await db.execute(select(TherapyModule).where(TherapyModule.id == module_id))
    if not mod_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Module not found")

    item = ModuleItem(
        module_id=module_id,
        target_word=body.tamil_word,
        transliteration=body.transliteration,
        meaning=body.english_translation,
        phoneme_breakdown=body.phoneme_breakdown,
        order_index=body.order_index,
        image_url=body.image_url,
        reference_audio_url=body.audio_url,
    )
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return {
        "id": str(item.id),
        "tamil_word": item.target_word,
        "transliteration": item.transliteration,
        "english_translation": item.meaning,
        "order_index": item.order_index,
    }


@router.put("/modules/{module_id}/items/{item_id}")
async def update_module_item(
    module_id: UUID,
    item_id: UUID,
    body: ModuleItemUpdate,
    current_user: User = Depends(require_role("therapist", "admin")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ModuleItem).where(ModuleItem.id == item_id, ModuleItem.module_id == module_id)
    )
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    if body.tamil_word is not None:
        item.target_word = body.tamil_word
    if body.transliteration is not None:
        item.transliteration = body.transliteration
    if body.english_translation is not None:
        item.meaning = body.english_translation
    if body.phoneme_breakdown is not None:
        item.phoneme_breakdown = body.phoneme_breakdown
    if body.order_index is not None:
        item.order_index = body.order_index
    if body.image_url is not None:
        item.image_url = body.image_url

    await db.commit()
    await db.refresh(item)
    return {"id": str(item.id), "tamil_word": item.target_word}


@router.delete("/modules/{module_id}/items/{item_id}", status_code=204)
async def delete_module_item(
    module_id: UUID,
    item_id: UUID,
    current_user: User = Depends(require_role("therapist", "admin")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ModuleItem).where(ModuleItem.id == item_id, ModuleItem.module_id == module_id)
    )
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    await db.delete(item)
    await db.commit()


@router.post("/modules/{module_id}/items/{item_id}/upload-image")
async def upload_item_image(
    module_id: UUID,
    item_id: UUID,
    file: UploadFile = File(...),
    current_user: User = Depends(require_role("therapist", "admin")),
    db: AsyncSession = Depends(get_db),
):
    """Upload an image for a module item."""
    result = await db.execute(
        select(ModuleItem).where(ModuleItem.id == item_id, ModuleItem.module_id == module_id)
    )
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    # Validate file type
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    ext = os.path.splitext(file.filename or "")[1] or ".jpg"
    save_path = os.path.join(settings.UPLOAD_DIR, "images", f"{item_id}{ext}")
    os.makedirs(os.path.dirname(save_path), exist_ok=True)

    with open(save_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    item.image_url = f"/uploads/images/{item_id}{ext}"
    await db.commit()

    return {"image_url": item.image_url}
