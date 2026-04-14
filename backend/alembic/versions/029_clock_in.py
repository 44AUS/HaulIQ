"""Add clocked_in fields to users

Revision ID: 029_clock_in
Revises: 028_driver_level
Create Date: 2026-04-14
"""
from alembic import op
import sqlalchemy as sa

revision = '029_clock_in'
down_revision = '028_driver_level'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('users', sa.Column('clocked_in', sa.Boolean(), nullable=True, server_default='false'))
    op.add_column('users', sa.Column('clocked_in_at', sa.DateTime(), nullable=True))


def downgrade():
    op.drop_column('users', 'clocked_in_at')
    op.drop_column('users', 'clocked_in')
