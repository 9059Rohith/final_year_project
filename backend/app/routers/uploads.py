"""Uploads router — generic file uploads (avatars, attachments, recordings).

Stores files under a local ``uploads/`` directory and records metadata. In
production this would proxy to Cloudinary (config already present); here it
persists locally and returns a served URL.
"""
import os
import secrets
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from typing import Optional
from ..database import get_database
from ..utils.jwt_handler import get_current_user
from ..utils.mongo import serialize, paginate, oid, now

router = APIRouter(prefix="/api/uploads", tags=["uploads"])

UPLOAD_DIR = os.path.join(os.getcwd(), "uploads")
MAX_BYTES = 10 * 1024 * 1024
ALLOWED = {"image/png", "image/jpeg", "image/webp", "image/gif", "audio/wav", "audio/webm", "audio/mpeg", "application/pdf"}


@router.post("")
async def upload_file(
    file: UploadFile = File(...),
    purpose: str = Form(default="general"),
    current_user: dict = Depends(get_current_user),
):
    """Upload a file (max 10 MB, whitelisted types)."""
    if file.content_type not in ALLOWED:
        raise HTTPException(status_code=400, detail=f"Unsupported type: {file.content_type}")
    data = await file.read()
    if len(data) > MAX_BYTES:
        raise HTTPException(status_code=413, detail="File too large (max 10 MB)")
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    ext = os.path.splitext(file.filename or "")[1][:10]
    stored_name = f"{secrets.token_hex(12)}{ext}"
    with open(os.path.join(UPLOAD_DIR, stored_name), "wb") as f:
        f.write(data)
    db = get_database()
    doc = {
        "user_id": str(current_user["_id"]), "original_name": file.filename, "stored_name": stored_name,
        "content_type": file.content_type, "size": len(data), "purpose": purpose,
        "url": f"/uploads/{stored_name}", "created_at": now(),
    }
    result = await db.uploads.insert_one(doc)
    doc["_id"] = result.inserted_id
    return serialize(doc)


@router.get("")
async def my_uploads(page: int = 1, limit: int = 20, current_user: dict = Depends(get_current_user)):
    """List the caller's uploads."""
    db = get_database()
    return await paginate(db.uploads, {"user_id": str(current_user["_id"])}, page, limit)


@router.delete("/{upload_id}")
async def delete_upload(upload_id: str, current_user: dict = Depends(get_current_user)):
    """Delete an uploaded file (and its metadata)."""
    db = get_database()
    doc = await db.uploads.find_one({"_id": oid(upload_id), "user_id": str(current_user["_id"])})
    if not doc:
        raise HTTPException(status_code=404, detail="Upload not found")
    try:
        os.remove(os.path.join(UPLOAD_DIR, doc["stored_name"]))
    except OSError:
        pass
    await db.uploads.delete_one({"_id": oid(upload_id)})
    return {"message": "Deleted"}
