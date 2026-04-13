"""Add driver_level column to users

Revision ID: 028_driver_level
Revises: 027_booking_archived_status
Create Date: 2026-04-13
"""
from alembic import op
import sqlalchemy as sa

revision = '028_driver_level'
down_revision = '027_booking_archived_status'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('users', sa.Column('driver_level', sa.String(20), nullable=True, server_default='level_1'))


def downgrade():
    op.drop_column('users', 'driver_level')
