"""add is_active to users table

Revision ID: 017_add_is_active_to_users
Revises: 016_load_size_length
Create Date: 2026-04-01

"""
from alembic import op
import sqlalchemy as sa

revision = '017_add_is_active_to_users'
down_revision = '016_load_size_length'
branch_labels = None
depends_on = None


def upgrade():
    conn = op.get_bind()
    conn.execute(sa.text("""
        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true
    """))


def downgrade():
    op.drop_column('users', 'is_active')
