"""User models: User, TherapistProfile, ParentProfile."""
from sqlalchemy import Column, String, Boolean, Enum, Text, Integer, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
import enum
from ..database import Base
from .base import TimestampMixin, UUIDMixin


class UserRole(str, enum.Enum):
    admin = "admin"
    therapist = "therapist"
    parent = "parent"


class User(Base, UUIDMixin, TimestampMixin):
    """Core user account — admin, therapist, or parent."""
    __tablename__ = "users"

    email = Column(String(255), unique=True, nullable=False, index=True)
    full_name = Column(String(255), nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), nullable=False, default=UserRole.parent)
    is_active = Column(Boolean, default=True, nullable=False)
    email_verified = Column(Boolean, default=False, nullable=False)
    avatar_url = Column(String(500), nullable=True)

    # Relationships
    therapist_profile = relationship("TherapistProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    parent_profile = relationship("ParentProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="user", cascade="all, delete-orphan")


class TherapistProfile(Base, UUIDMixin, TimestampMixin):
    """Extended profile for therapist accounts."""
    __tablename__ = "therapist_profiles"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    license_number = Column(String(100), nullable=True)
    specialization = Column(String(255), nullable=True)
    bio = Column(Text, nullable=True)
    years_of_experience = Column(Integer, default=0)

    # Relationships
    user = relationship("User", back_populates="therapist_profile")
    children = relationship("Child", back_populates="therapist", foreign_keys="Child.therapist_id")
    notes = relationship("TherapistNote", back_populates="therapist")


class ParentProfile(Base, UUIDMixin, TimestampMixin):
    """Extended profile for parent accounts."""
    __tablename__ = "parent_profiles"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    phone = Column(String(20), nullable=True)
    address = Column(Text, nullable=True)
    preferred_language = Column(String(10), default="ta")

    # Relationships
    user = relationship("User", back_populates="parent_profile")
    children = relationship("Child", back_populates="parent", foreign_keys="Child.parent_id")
