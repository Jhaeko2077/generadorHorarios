"""initial scheduler schema

Revision ID: 202605250001
Revises:
Create Date: 2026-05-25 00:01:00
"""
from __future__ import annotations

from alembic import op

from app.db.base import Base
from app.models import academic, audit, room, schedule, teacher, user  # noqa: F401

revision = "202605250001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    Base.metadata.create_all(bind=bind)


def downgrade() -> None:
    bind = op.get_bind()
    Base.metadata.drop_all(bind=bind)
