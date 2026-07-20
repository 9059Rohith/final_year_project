"""Add missing child profile fields and therapist_notes.note_type

Every router touching Child (auth.py create_child, children.py, therapist.py,
parent.py, admin.py) already reads/writes age/gender/avatar_color/diagnosis_notes
— only the model and migration were missing them, which crashed every
child-related endpoint. Same story for therapist_notes.note_type.

Revision ID: 0002
Revises: 0001
Create Date: 2026-07-20
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "0002"
down_revision: Union[str, None] = "0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("children", sa.Column("age", sa.Integer(), nullable=True))
    op.add_column("children", sa.Column("gender", sa.String(20), nullable=True))
    op.add_column(
        "children",
        sa.Column("avatar_color", sa.String(20), nullable=True, server_default="#F97316"),
    )
    op.add_column("children", sa.Column("diagnosis_notes", sa.Text(), nullable=True))
    op.add_column(
        "therapist_notes",
        sa.Column("note_type", sa.String(20), nullable=False, server_default="general"),
    )


def downgrade() -> None:
    op.drop_column("therapist_notes", "note_type")
    op.drop_column("children", "diagnosis_notes")
    op.drop_column("children", "avatar_color")
    op.drop_column("children", "gender")
    op.drop_column("children", "age")
