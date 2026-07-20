"""Initial schema — all tables

Revision ID: 0001
Revises:
Create Date: 2026-07-20
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # --- users ---
    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("full_name", sa.String(255), nullable=False),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("role", sa.Enum("admin", "therapist", "parent", name="userrole"), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("email_verified", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("avatar_url", sa.String(500), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    # --- therapist_profiles ---
    op.create_table(
        "therapist_profiles",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("license_number", sa.String(100), nullable=True),
        sa.Column("specialization", sa.String(255), nullable=True),
        sa.Column("bio", sa.Text, nullable=True),
        sa.Column("years_of_experience", sa.Integer, nullable=True, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_therapist_profiles_user_id", "therapist_profiles", ["user_id"], unique=True)

    # --- parent_profiles ---
    op.create_table(
        "parent_profiles",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("phone", sa.String(20), nullable=True),
        sa.Column("address", sa.Text, nullable=True),
        sa.Column("preferred_language", sa.String(10), server_default="ta"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_parent_profiles_user_id", "parent_profiles", ["user_id"], unique=True)

    # --- children ---
    op.create_table(
        "children",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("parent_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("therapist_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("date_of_birth", sa.Date, nullable=True),
        sa.Column("avatar", sa.String(50), server_default="avatar1", nullable=False),
        sa.Column("language", sa.String(10), server_default="ta", nullable=False),
        sa.Column("sensory_prefs", postgresql.JSON, nullable=True),
        sa.Column("parent_consent_given", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("consent_timestamp", sa.DateTime(timezone=True), nullable=True),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["parent_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["therapist_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_children_parent_id", "children", ["parent_id"])
    op.create_index("ix_children_therapist_id", "children", ["therapist_id"])

    # --- therapy_modules ---
    op.create_table(
        "therapy_modules",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("created_by_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("difficulty", sa.Enum("beginner", "intermediate", "advanced", name="difficultylevel"), nullable=False, server_default="beginner"),
        sa.Column("language", sa.String(10), server_default="ta", nullable=False),
        sa.Column("is_published", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("thumbnail_url", sa.String(500), nullable=True),
        sa.Column("target_age_min", sa.Integer, server_default="3"),
        sa.Column("target_age_max", sa.Integer, server_default="12"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["created_by_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_therapy_modules_created_by_id", "therapy_modules", ["created_by_id"])

    # --- module_items ---
    op.create_table(
        "module_items",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("module_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("order_index", sa.Integer, server_default="0", nullable=False),
        sa.Column("target_word", sa.String(100), nullable=False),
        sa.Column("transliteration", sa.String(100), nullable=True),
        sa.Column("meaning", sa.String(255), nullable=True),
        sa.Column("example_sentence", sa.Text, nullable=True),
        sa.Column("image_url", sa.String(500), nullable=True),
        sa.Column("reference_audio_url", sa.String(500), nullable=True),
        sa.Column("phoneme_breakdown", postgresql.JSON, nullable=True),
        sa.Column("difficulty_weight", sa.Float, server_default="1.0"),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["module_id"], ["therapy_modules.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_module_items_module_id", "module_items", ["module_id"])

    # --- assigned_programs ---
    op.create_table(
        "assigned_programs",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("child_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("module_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("assigned_by_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("status", sa.Enum("not_started", "in_progress", "completed", "paused", name="programstatus"), nullable=False, server_default="not_started"),
        sa.Column("start_date", sa.Date, nullable=True),
        sa.Column("target_end_date", sa.Date, nullable=True),
        sa.Column("notes", sa.String(500), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["child_id"], ["children.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["module_id"], ["therapy_modules.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["assigned_by_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_assigned_programs_child_id", "assigned_programs", ["child_id"])
    op.create_index("ix_assigned_programs_module_id", "assigned_programs", ["module_id"])

    # --- therapy_sessions ---
    op.create_table(
        "therapy_sessions",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("child_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("assigned_program_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("started_by_parent_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("status", sa.Enum("in_progress", "completed", "abandoned", name="sessionstatus"), nullable=False, server_default="in_progress"),
        sa.Column("total_items", sa.Integer, server_default="0"),
        sa.Column("completed_items", sa.Integer, server_default="0"),
        sa.Column("average_score", sa.Float, nullable=True),
        sa.Column("best_word", sa.String(100), nullable=True),
        sa.Column("session_duration_seconds", sa.Integer, nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["child_id"], ["children.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["assigned_program_id"], ["assigned_programs.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["started_by_parent_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_therapy_sessions_child_id", "therapy_sessions", ["child_id"])
    op.create_index("ix_therapy_sessions_assigned_program_id", "therapy_sessions", ["assigned_program_id"])
    op.create_index("ix_therapy_sessions_created_at", "therapy_sessions", ["created_at"])

    # --- session_attempts ---
    op.create_table(
        "session_attempts",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("session_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("module_item_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("child_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("attempt_number", sa.Integer, server_default="1"),
        sa.Column("mimic_played", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("asr_transcript", sa.String(500), nullable=True),
        sa.Column("similarity_score", sa.Float, nullable=True),
        sa.Column("phoneme_accuracy", postgresql.JSON, nullable=True),
        sa.Column("celery_task_id", sa.String(255), nullable=True),
        sa.Column("scoring_status", sa.String(20), server_default="pending"),
        sa.Column("mitra_response_type", sa.Enum("mimic", "celebrate", "gentle_correct", "neutral_fallback", name="mitraresponsetype"), nullable=True),
        sa.Column("audio_file_path", sa.String(500), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["session_id"], ["therapy_sessions.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["module_item_id"], ["module_items.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["child_id"], ["children.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_session_attempts_session_id", "session_attempts", ["session_id"])
    op.create_index("ix_session_attempts_child_id", "session_attempts", ["child_id"])
    op.create_index("ix_session_attempts_created_at", "session_attempts", ["created_at"])

    # --- progress_snapshots ---
    op.create_table(
        "progress_snapshots",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("child_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("module_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("snapshot_date", sa.DateTime(timezone=True), nullable=False),
        sa.Column("mastery_score", sa.Float, server_default="0.0"),
        sa.Column("trend", sa.String(20), server_default="stable"),
        sa.Column("items_mastered", sa.Integer, server_default="0"),
        sa.Column("items_in_progress", sa.Integer, server_default="0"),
        sa.Column("total_attempts", sa.Integer, server_default="0"),
        sa.Column("average_score", sa.Float, server_default="0.0"),
        sa.Column("session_count", sa.Integer, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["child_id"], ["children.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["module_id"], ["therapy_modules.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_progress_snapshots_child_id", "progress_snapshots", ["child_id"])
    op.create_index("ix_progress_snapshots_snapshot_date", "progress_snapshots", ["snapshot_date"])

    # --- therapist_notes ---
    op.create_table(
        "therapist_notes",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("therapist_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("child_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("content", sa.Text, nullable=False),
        sa.Column("is_private", sa.Boolean, server_default="false"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["therapist_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["child_id"], ["children.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_therapist_notes_child_id", "therapist_notes", ["child_id"])

    # --- messages ---
    op.create_table(
        "messages",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("sender_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("recipient_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("child_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("content", sa.Text, nullable=False),
        sa.Column("is_read", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("thread_id", sa.String(255), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["sender_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["recipient_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["child_id"], ["children.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_messages_thread_id", "messages", ["thread_id"])

    # --- notifications ---
    op.create_table(
        "notifications",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("type", sa.Enum("session_completed", "new_note", "new_message", "program_assigned", "milestone_reached", "system", name="notificationtype"), nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("body", sa.Text, nullable=True),
        sa.Column("is_read", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("deep_link", sa.String(500), nullable=True),
        sa.Column("metadata", postgresql.JSON, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_notifications_user_id", "notifications", ["user_id"])

    # --- audit_logs ---
    op.create_table(
        "audit_logs",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("action", sa.String(255), nullable=False),
        sa.Column("entity_type", sa.String(100), nullable=True),
        sa.Column("entity_id", sa.String(255), nullable=True),
        sa.Column("details", postgresql.JSON, nullable=True),
        sa.Column("ip_address", sa.String(50), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_audit_logs_user_id", "audit_logs", ["user_id"])


def downgrade() -> None:
    op.drop_table("audit_logs")
    op.drop_table("notifications")
    op.drop_table("messages")
    op.drop_table("therapist_notes")
    op.drop_table("progress_snapshots")
    op.drop_table("session_attempts")
    op.drop_table("therapy_sessions")
    op.drop_table("assigned_programs")
    op.drop_table("module_items")
    op.drop_table("therapy_modules")
    op.drop_table("children")
    op.drop_table("parent_profiles")
    op.drop_table("therapist_profiles")
    op.drop_table("users")
    op.execute("DROP TYPE IF EXISTS userrole")
    op.execute("DROP TYPE IF EXISTS difficultylevel")
    op.execute("DROP TYPE IF EXISTS programstatus")
    op.execute("DROP TYPE IF EXISTS sessionstatus")
    op.execute("DROP TYPE IF EXISTS mitraresponsetype")
    op.execute("DROP TYPE IF EXISTS notificationtype")
