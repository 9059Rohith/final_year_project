"""Mitra FastAPI application entry point."""
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse

from .config import settings
from .database import check_db_health, check_redis_health

# ── Routers ──────────────────────────────────────────────────────────────────
from .routers import auth, children, therapist, parent, content, sessions
from .routers import progress, tts, admin, notifications


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup / shutdown lifecycle."""
    # Ensure upload directories exist
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    os.makedirs(settings.TTS_CACHE_DIR, exist_ok=True)
    os.makedirs(os.path.join(settings.UPLOAD_DIR, "audio"), exist_ok=True)
    os.makedirs(os.path.join(settings.UPLOAD_DIR, "images"), exist_ok=True)
    print("✅ Mitra backend started")
    yield
    print("🛑 Mitra backend shutting down")


app = FastAPI(
    title="Mitra API",
    description="AI Speech Companion for Tamil-speaking children with ASD",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
    lifespan=lifespan,
)

# ── CORS ─────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Static files (uploads) ────────────────────────────────────────────────────
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# ── Include routers ───────────────────────────────────────────────────────────
app.include_router(auth.router,          prefix="/api/auth",          tags=["auth"])
app.include_router(children.router,      prefix="/api/children",      tags=["children"])
app.include_router(therapist.router,     prefix="/api/therapist",     tags=["therapist"])
app.include_router(parent.router,        prefix="/api/parent",        tags=["parent"])
app.include_router(content.router,       prefix="/api/content",       tags=["content"])
app.include_router(sessions.router,      prefix="/api/sessions",      tags=["sessions"])
app.include_router(progress.router,      prefix="/api/progress",      tags=["progress"])
app.include_router(tts.router,           prefix="/api/tts",           tags=["tts"])
app.include_router(admin.router,         prefix="/api/admin",         tags=["admin"])
app.include_router(notifications.router, prefix="/api/notifications", tags=["notifications"])


# ── Health endpoint ───────────────────────────────────────────────────────────
@app.get("/api/health", tags=["health"])
async def health_check():
    """Full health check — pings DB and Redis."""
    db_status = await check_db_health()
    redis_status = await check_redis_health()
    overall = "healthy" if db_status["status"] == "healthy" and redis_status["status"] == "healthy" else "degraded"
    return {
        "status": overall,
        "version": "1.0.0",
        "services": {
            "database": db_status,
            "cache": redis_status,
        },
    }


@app.get("/", tags=["root"])
async def root():
    return {"message": "Mitra API v1.0.0 — Tamil Speech Companion", "docs": "/api/docs"}


# ── Global exception handler ──────────────────────────────────────────────────
@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error", "error": str(exc)},
    )
