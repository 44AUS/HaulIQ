"""add last_active_at to users

Revision ID: 009_add_last_active
Revises: 008_add_address_and_vetting
Create Date: 2026-03-29
"""
from alembic import op
import sqlalchemy as sa

revision = '009_add_last_active'
down_revision = '008_add_address_and_vetting'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('users', sa.Column('last_active_at', sa.DateTime(), nullable=True))


def downgrade():
    op.drop_column('users', 'last_active_at')
