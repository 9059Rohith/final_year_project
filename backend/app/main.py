"""Main FastAPI application."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import os
import bcrypt
from .config import settings
from .database import connect_to_mongo, close_mongo_connection, get_database
from .routers import (
    auth, therapy, evaluation, progress, admin, contact,
    gamification, analysis, therapist, parent,
    # New modules (Phase 1-5 expansion)
    auth_extra, notifications, settings as settings_router, feedback, profile,
    appointments, calendar, announcements, games, wallet, assessment,
    videos, reports, social, admin_ext,
    # Phase 6 modules
    messaging, goals, streaks, enquiries, support, devices, search,
    wishlist, content, therapist_ext, lessons_admin, badges,
    # Phase 7 modules
    parent_ext, progress_ext, analysis_ext, billing, referrals,
    uploads, reminders, activity, moderation, privacy, polls,
    # Phase 8 modules
    reviews, bookmarks, glossary, templates, integrations,
    surveys, dashboard,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    # Startup
    await connect_to_mongo()
    await seed_admin_user()  # skips safely if DB not connected
    yield
    # Shutdown
    await close_mongo_connection()


app = FastAPI(
    title="SpeakEasy ASD API",
    description="AI-powered speech therapy platform for children with ASD",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.CORS_ORIGIN, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(therapy.router)
app.include_router(evaluation.router)
app.include_router(progress.router)
app.include_router(admin.router)
app.include_router(contact.router)
app.include_router(gamification.router)
app.include_router(analysis.router)
app.include_router(therapist.router)
app.include_router(parent.router)

# --- New feature modules --------------------------------------------------
app.include_router(auth_extra.router)
app.include_router(notifications.router)
app.include_router(settings_router.router)
app.include_router(feedback.router)
app.include_router(profile.router)
app.include_router(appointments.router)
app.include_router(calendar.router)
app.include_router(announcements.router)
app.include_router(games.router)
app.include_router(wallet.router)
app.include_router(assessment.router)
app.include_router(videos.router)
app.include_router(reports.router)
app.include_router(social.router)
app.include_router(admin_ext.router)

# --- Phase 6 modules ------------------------------------------------------
app.include_router(messaging.router)
app.include_router(goals.router)
app.include_router(streaks.router)
app.include_router(enquiries.router)
app.include_router(support.router)
app.include_router(devices.router)
app.include_router(search.router)
app.include_router(wishlist.router)
app.include_router(content.router)
app.include_router(therapist_ext.router)
app.include_router(lessons_admin.router)
app.include_router(badges.router)

# --- Phase 7 modules ------------------------------------------------------
app.include_router(parent_ext.router)
app.include_router(progress_ext.router)
app.include_router(analysis_ext.router)
app.include_router(billing.router)
app.include_router(referrals.router)
app.include_router(uploads.router)
app.include_router(reminders.router)
app.include_router(activity.router)
app.include_router(moderation.router)
app.include_router(privacy.router)
app.include_router(polls.router)

# --- Phase 8 modules ------------------------------------------------------
app.include_router(reviews.router)
app.include_router(bookmarks.router)
app.include_router(glossary.router)
app.include_router(templates.router)
app.include_router(integrations.router)
app.include_router(surveys.router)
app.include_router(dashboard.router)


# Serve uploaded files (avatars, attachments) from the local uploads dir.
_uploads_dir = os.path.join(os.getcwd(), "uploads")
os.makedirs(_uploads_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=_uploads_dir), name="uploads")


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "Welcome to SpeakEasy ASD API",
        "version": "1.0.0",
        "team": "Team 96 - Amrita Vishwa Vidyapeetham"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}


async def seed_admin_user():
    """Seed admin users if not present.

    Seeds the env-configured admin plus the project super-admin account. The
    super-admin (rajuchaswik@gmail.com) is flagged ``is_super_admin`` and has
    access to every admin endpoint including role changes and deletes.
    """
    from datetime import datetime
    from .database import db_manager

    if not db_manager.connected:
        print("[INFO] Skipping admin seed — MongoDB not connected.")
        return

    db = get_database()

    def _admin_doc(email: str, password: str, name: str, super_admin: bool = False) -> dict:
        return {
            "email": email,
            "password_hash": bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8'),
            "full_name": name,
            "child_name": "N/A",
            "child_age": 0,
            "language": "English",
            "role": "admin",
            "is_super_admin": super_admin,
            "email_verified": True,
            "created_at": datetime.utcnow(),
            "last_login": None,
            "total_sessions": 0,
            "total_stars": 0,
        }

    # Admins to ensure exist: (email, password, name, is_super_admin)
    seeds = [
        (settings.ADMIN_EMAIL, settings.ADMIN_PASSWORD, "Admin User", False),
        ("rajuchaswik@gmail.com", "Raju@2006", "Raju (Super Admin)", True),
    ]

    for email, password, name, is_super in seeds:
        try:
            existing = await db.users.find_one({"email": email})
            if not existing:
                await db.users.insert_one(_admin_doc(email, password, name, is_super))
                print(f"[OK] Admin user seeded: {email}{' (super-admin)' if is_super else ''}")
            else:
                # Ensure the super-admin flag/role is applied even if the row predates this change.
                if is_super and (not existing.get("is_super_admin") or existing.get("role") != "admin"):
                    await db.users.update_one(
                        {"_id": existing["_id"]},
                        {"$set": {"role": "admin", "is_super_admin": True}},
                    )
                    print(f"[OK] Elevated existing user to super-admin: {email}")
                else:
                    print(f"[OK] Admin user already exists: {email}")
        except Exception as e:
            print(f"[WARN] Could not seed {email}: {e}")
