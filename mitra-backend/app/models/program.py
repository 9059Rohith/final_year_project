"""AssignedProgram model."""
from sqlalchemy import Column, Enum, ForeignKey, Date, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import enum
from ..database import Base
from .base import TimestampMixin, UUIDMixin


class ProgramStatus(str, enum.Enum):
    not_started = "not_started"
    in_progress = "in_progress"
    completed = "completed"
    paused = "paused"


class AssignedProgram(Base, UUIDMixin, TimestampMixin):
    """A therapy module assigned to a specific child by a therapist."""
    __tablename__ = "assigned_programs"

    child_id = Column(UUID(as_uuid=True), ForeignKey("children.id", ondelete="CASCADE"), nullable=False, index=True)
    module_id = Column(UUID(as_uuid=True), ForeignKey("therapy_modules.id", ondelete="CASCADE"), nullable=False, index=True)
    assigned_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)

    status = Column(Enum(ProgramStatus), default=ProgramStatus.not_started, nullable=False)
    start_date = Column(Date, nullable=True)
    target_end_date = Column(Date, nullable=True)
    notes = Column(String(500), nullable=True)

    # Relationships
    child = relationship("Child", back_populates="assigned_programs")
    module = relationship("TherapyModule", back_populates="assigned_programs")
    assigned_by = relationship("User", foreign_keys=[assigned_by_id])
    sessions = relationship("TherapySession", back_populates="assigned_program")
