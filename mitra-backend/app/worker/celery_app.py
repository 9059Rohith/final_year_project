"""Celery application configuration."""
from celery import Celery
from celery.schedules import crontab

from ..config import settings

celery_app = Celery(
    "mitra",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=["app.worker.tasks"],
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="Asia/Kolkata",
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
    # Result expiry — 24 hours
    result_expires=86400,
    # Beat schedule for nightly snapshots
    beat_schedule={
        "nightly-progress-snapshots": {
            "task": "app.worker.tasks.compute_nightly_snapshots",
            "schedule": crontab(hour=1, minute=0),  # 1:00 AM IST
        },
    },
)
