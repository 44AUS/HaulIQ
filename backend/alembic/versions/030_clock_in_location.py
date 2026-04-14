"""Add clock_in_lat/lng to users

Revision ID: 030_clock_in_location
Revises: 029_clock_in
Create Date: 2026-04-14
"""
from alembic import op
import sqlalchemy as sa

revision = '030_clock_in_location'
down_revision = '029_clock_in'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('users', sa.Column('clock_in_lat', sa.Float(), nullable=True))
    op.add_column('users', sa.Column('clock_in_lng', sa.Float(), nullable=True))


def downgrade():
    op.drop_column('users', 'clock_in_lng')
    op.drop_column('users', 'clock_in_lat')
