"""Social models: TherapistNote, Message, Notification, AuditLog."""
from sqlalchemy import Column, String, Text, Boolean, ForeignKey, Enum, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import enum
from ..database import Base
from .base import TimestampMixin, UUIDMixin


class NotificationType(str, enum.Enum):
    session_completed = "session_completed"
    new_note = "new_note"
    new_message = "new_message"
    program_assigned = "program_assigned"
    milestone_reached = "milestone_reached"
    system = "system"


class TherapistNote(Base, UUIDMixin, TimestampMixin):
    """Clinical notes written by a therapist about a specific child."""
    __tablename__ = "therapist_notes"

    therapist_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    child_id = Column(UUID(as_uuid=True), ForeignKey("children.id", ondelete="CASCADE"), nullable=False, index=True)
    content = Column(Text, nullable=False)
    is_private = Column(Boolean, default=False)  # Private = therapist only; False = visible to parent

    # Relationships
    therapist = relationship("TherapistProfile", back_populates="notes", foreign_keys=[therapist_id])
    child = relationship("Child", back_populates="therapist_notes")


class Message(Base, UUIDMixin, TimestampMixin):
    """Direct messages between parent and therapist."""
    __tablename__ = "messages"

    sender_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    recipient_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    child_id = Column(UUID(as_uuid=True), ForeignKey("children.id", ondelete="SET NULL"), nullable=True, index=True)
    content = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False, nullable=False)
    thread_id = Column(String(255), nullable=True, index=True)  # Groups messages into threads

    # Relationships
    sender = relationship("User", foreign_keys=[sender_id])
    recipient = relationship("User", foreign_keys=[recipient_id])


class Notification(Base, UUIDMixin, TimestampMixin):
    """In-app notifications for all users."""
    __tablename__ = "notifications"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    type = Column(Enum(NotificationType), nullable=False)
    title = Column(String(255), nullable=False)
    body = Column(Text, nullable=True)
    is_read = Column(Boolean, default=False, nullable=False)
    deep_link = Column(String(500), nullable=True)
    metadata = Column(JSON, nullable=True)  # Extra context for the notification

    # Relationships
    user = relationship("User", back_populates="notifications")


class AuditLog(Base, UUIDMixin, TimestampMixin):
    """Audit trail for admin-visible actions."""
    __tablename__ = "audit_logs"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    action = Column(String(255), nullable=False)           # e.g. "create_child", "delete_module"
    entity_type = Column(String(100), nullable=True)       # e.g. "Child", "TherapyModule"
    entity_id = Column(String(255), nullable=True)         # UUID of the affected entity
    details = Column(JSON, nullable=True)                  # Additional context
    ip_address = Column(String(50), nullable=True)

    # Relationships
    user = relationship("User", back_populates="audit_logs")
