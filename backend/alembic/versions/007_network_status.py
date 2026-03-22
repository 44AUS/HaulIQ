"""Add status column to broker_network for approval flow

Revision ID: 007_network_status
Revises: 006_add_load_views
Create Date: 2026-03-22
"""
from alembic import op

revision = '007_network_status'
down_revision = '006_add_load_views'
branch_labels = None
depends_on = None


def upgrade():
    # Add status column; existing rows are already accepted connections
    op.execute("""
        ALTER TABLE broker_network
        ADD COLUMN IF NOT EXISTS status VARCHAR(10) NOT NULL DEFAULT 'accepted'
    """)


def downgrade():
    op.execute("ALTER TABLE broker_network DROP COLUMN IF EXISTS status")
