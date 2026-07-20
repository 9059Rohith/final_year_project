"""Child profile model."""
from sqlalchemy import Column, String, Integer, Text, Date, ForeignKey, JSON, Boolean, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from ..database import Base
from .base import TimestampMixin, UUIDMixin


class Child(Base, UUIDMixin, TimestampMixin):
    """Child profile under a parent account. No separate login — parent-supervised."""
    __tablename__ = "children"

    parent_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    therapist_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)

    name = Column(String(255), nullable=False)
    age = Column(Integer, nullable=True)
    gender = Column(String(20), nullable=True)
    avatar_color = Column(String(20), default="#F97316", nullable=True)
    diagnosis_notes = Column(Text, nullable=True)
    date_of_birth = Column(Date, nullable=True)
    avatar = Column(String(50), default="avatar1", nullable=False)  # avatar key e.g. "avatar1"
    language = Column(String(10), default="ta", nullable=False)

    # Sensory preferences (stored as JSON for flexibility)
    # {reduce_motion: bool, mute_sudden_sounds: bool, font_size: "small"|"medium"|"large"}
    sensory_prefs = Column(JSON, default=lambda: {
        "reduce_motion": False,
        "mute_sudden_sounds": False,
        "font_size": "medium"
    })

    # Parent consent captured at profile creation
    parent_consent_given = Column(Boolean, default=False, nullable=False)
    consent_timestamp = Column(DateTime(timezone=True), nullable=True)

    is_active = Column(Boolean, default=True, nullable=False)

    # Relationships
    parent = relationship("User", foreign_keys=[parent_id])
    therapist = relationship("User", foreign_keys=[therapist_id])
    assigned_programs = relationship("AssignedProgram", back_populates="child", cascade="all, delete-orphan")
    sessions = relationship("TherapySession", back_populates="child", cascade="all, delete-orphan")
    progress_snapshots = relationship("ProgressSnapshot", back_populates="child", cascade="all, delete-orphan")
    therapist_notes = relationship("TherapistNote", back_populates="child", cascade="all, delete-orphan")
