"""Add origin_city and dest_city to lane_watches

Revision ID: 021_lane_watch_cities
Revises: 020_lane_watches_notifs
Create Date: 2026-04-13

"""
from alembic import op
import sqlalchemy as sa

revision = '021_lane_watch_cities'
down_revision = '020_lane_watches_notifs'
branch_labels = None
depends_on = None


def upgrade():
    op.execute("ALTER TABLE lane_watches ADD COLUMN IF NOT EXISTS origin_city VARCHAR(100)")
    op.execute("ALTER TABLE lane_watches ADD COLUMN IF NOT EXISTS dest_city   VARCHAR(100)")


def downgrade():
    op.execute("ALTER TABLE lane_watches DROP COLUMN IF EXISTS origin_city")
    op.execute("ALTER TABLE lane_watches DROP COLUMN IF EXISTS dest_city")
