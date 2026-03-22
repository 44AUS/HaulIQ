"""Add phone column to users table

Revision ID: 005_add_phone_to_users
Revises: 004_nullable_conversation_load_id
Create Date: 2026-03-22
"""
from alembic import op

revision = '005_add_phone_to_users'
down_revision = '004_convo_load_nullable'
branch_labels = None
depends_on = None


def upgrade():
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20)")


def downgrade():
    op.execute("ALTER TABLE users DROP COLUMN IF EXISTS phone")
