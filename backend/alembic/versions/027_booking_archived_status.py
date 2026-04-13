"""Add archived to bookingstatus enum

Revision ID: 027
Revises: 026
Create Date: 2026-04-13
"""
from alembic import op

revision = '027_booking_archived_status'
down_revision = '026_driver_locations'
branch_labels = None
depends_on = None


def upgrade():
    op.execute("ALTER TYPE bookingstatus ADD VALUE IF NOT EXISTS 'archived'")


def downgrade():
    # Postgres does not support removing enum values; downgrade is a no-op
    pass
