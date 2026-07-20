"""Session models: TherapySession, SessionAttempt, ProgressSnapshot."""
from sqlalchemy import Column, String, Integer, Float, Boolean, Enum, ForeignKey, Text, JSON, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import enum
from ..database import Base
from .base import TimestampMixin, UUIDMixin


class SessionStatus(str, enum.Enum):
    in_progress = "in_progress"
    completed = "completed"
    abandoned = "abandoned"


class MitraResponseType(str, enum.Enum):
    mimic = "mimic"
    celebrate = "celebrate"
    gentle_correct = "gentle_correct"
    neutral_fallback = "neutral_fallback"


class TherapySession(Base, UUIDMixin, TimestampMixin):
    """A single practice session for a child."""
    __tablename__ = "therapy_sessions"

    child_id = Column(UUID(as_uuid=True), ForeignKey("children.id", ondelete="CASCADE"), nullable=False, index=True)
    assigned_program_id = Column(UUID(as_uuid=True), ForeignKey("assigned_programs.id", ondelete="SET NULL"), nullable=True, index=True)
    started_by_parent_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    status = Column(Enum(SessionStatus), default=SessionStatus.in_progress, nullable=False)
    total_items = Column(Integer, default=0)
    completed_items = Column(Integer, default=0)
    average_score = Column(Float, nullable=True)
    best_word = Column(String(100), nullable=True)
    session_duration_seconds = Column(Integer, nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    child = relationship("Child", back_populates="sessions")
    assigned_program = relationship("AssignedProgram", back_populates="sessions")
    attempts = relationship("SessionAttempt", back_populates="session", cascade="all, delete-orphan")


class SessionAttempt(Base, UUIDMixin, TimestampMixin):
    """One pronunciation attempt on a single module item within a session."""
    __tablename__ = "session_attempts"

    session_id = Column(UUID(as_uuid=True), ForeignKey("therapy_sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    module_item_id = Column(UUID(as_uuid=True), ForeignKey("module_items.id", ondelete="CASCADE"), nullable=False, index=True)
    child_id = Column(UUID(as_uuid=True), ForeignKey("children.id", ondelete="CASCADE"), nullable=False, index=True)

    attempt_number = Column(Integer, default=1)

    # Track A — Mimicry (client-side, always fires instantly)
    mimic_played = Column(Boolean, default=False, nullable=False)

    # Track B — Real Tamil ASR analysis (Celery, may take seconds)
    asr_transcript = Column(String(500), nullable=True)      # Tamil transcript from Whisper
    similarity_score = Column(Float, nullable=True)          # 0-100, the real clinical score
    phoneme_accuracy = Column(JSON, nullable=True)
    # {"phonemes": [{"phoneme": "a", "score": 0.9}, ...], "weakest": "m"}
    celery_task_id = Column(String(255), nullable=True)      # Track the async Celery task
    scoring_status = Column(String(20), default="pending")   # pending|processing|done|failed

    mitra_response_type = Column(Enum(MitraResponseType), nullable=True)
    audio_file_path = Column(String(500), nullable=True)     # temp path, deleted after scoring

    # Relationships
    session = relationship("TherapySession", back_populates="attempts")
    module_item = relationship("ModuleItem", back_populates="attempts")


class ProgressSnapshot(Base, UUIDMixin, TimestampMixin):
    """Nightly computed progress aggregates per child per module."""
    __tablename__ = "progress_snapshots"

    child_id = Column(UUID(as_uuid=True), ForeignKey("children.id", ondelete="CASCADE"), nullable=False, index=True)
    module_id = Column(UUID(as_uuid=True), ForeignKey("therapy_modules.id", ondelete="CASCADE"), nullable=False, index=True)

    snapshot_date = Column(DateTime(timezone=True), nullable=False, index=True)
    mastery_score = Column(Float, default=0.0)         # 0-100
    trend = Column(String(20), default="stable")       # improving|stable|declining
    items_mastered = Column(Integer, default=0)
    items_in_progress = Column(Integer, default=0)
    total_attempts = Column(Integer, default=0)
    average_score = Column(Float, default=0.0)
    session_count = Column(Integer, default=0)

    # Relationships
    child = relationship("Child", back_populates="progress_snapshots")
