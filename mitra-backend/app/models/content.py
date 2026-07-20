"""Content models: TherapyModule, ModuleItem."""
from sqlalchemy import Column, String, Text, Integer, Boolean, Enum, ForeignKey, JSON, Float
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import enum
from ..database import Base
from .base import TimestampMixin, UUIDMixin


class DifficultyLevel(str, enum.Enum):
    beginner = "beginner"
    intermediate = "intermediate"
    advanced = "advanced"


class TherapyModule(Base, UUIDMixin, TimestampMixin):
    """A therapy module (e.g., 'Animals', 'Family Words') created by a therapist."""
    __tablename__ = "therapy_modules"

    created_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    difficulty = Column(Enum(DifficultyLevel), default=DifficultyLevel.beginner, nullable=False)
    language = Column(String(10), default="ta", nullable=False)
    is_published = Column(Boolean, default=False, nullable=False)
    thumbnail_url = Column(String(500), nullable=True)
    target_age_min = Column(Integer, default=3)
    target_age_max = Column(Integer, default=12)

    # Relationships
    # created_by_id FKs to users.id (see migration 0001), not therapist_profiles.id —
    # this must target User, or SQLAlchemy fails to configure the mapper at startup.
    created_by = relationship("User", foreign_keys=[created_by_id])
    items = relationship("ModuleItem", back_populates="module", cascade="all, delete-orphan", order_by="ModuleItem.order_index")
    assigned_programs = relationship("AssignedProgram", back_populates="module")


class ModuleItem(Base, UUIDMixin, TimestampMixin):
    """A single word/item within a therapy module."""
    __tablename__ = "module_items"

    module_id = Column(UUID(as_uuid=True), ForeignKey("therapy_modules.id", ondelete="CASCADE"), nullable=False, index=True)
    order_index = Column(Integer, default=0, nullable=False)

    # Tamil word content
    target_word = Column(String(100), nullable=False)          # Tamil script: அம்மா
    transliteration = Column(String(100), nullable=True)       # Romanized: amma
    meaning = Column(String(255), nullable=True)               # English meaning
    example_sentence = Column(Text, nullable=True)             # Tamil example sentence

    # Media
    image_url = Column(String(500), nullable=True)
    reference_audio_url = Column(String(500), nullable=True)   # TTS-generated reference

    # Phoneme data for scoring
    phoneme_breakdown = Column(JSON, nullable=True)
    # e.g. {"phonemes": ["a", "m", "m", "a"], "ipa": "amma", "syllables": ["am", "ma"]}

    difficulty_weight = Column(Float, default=1.0)
    is_active = Column(Boolean, default=True, nullable=False)

    # Relationships
    module = relationship("TherapyModule", back_populates="items")
    attempts = relationship("SessionAttempt", back_populates="module_item")
