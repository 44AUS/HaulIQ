"""Add e-signature fields to bookings

Revision ID: 023_booking_signatures
Revises: 022_load_templates
Create Date: 2026-04-13

"""
from alembic import op

revision = '023_booking_signatures'
down_revision = '022_load_templates'
branch_labels = None
depends_on = None


def upgrade():
    op.execute("ALTER TABLE bookings ADD COLUMN IF NOT EXISTS broker_signature   TEXT")
    op.execute("ALTER TABLE bookings ADD COLUMN IF NOT EXISTS broker_signed_at   TIMESTAMP")
    op.execute("ALTER TABLE bookings ADD COLUMN IF NOT EXISTS broker_signed_name VARCHAR(255)")
    op.execute("ALTER TABLE bookings ADD COLUMN IF NOT EXISTS carrier_signature  TEXT")
    op.execute("ALTER TABLE bookings ADD COLUMN IF NOT EXISTS carrier_signed_at  TIMESTAMP")
    op.execute("ALTER TABLE bookings ADD COLUMN IF NOT EXISTS carrier_signed_name VARCHAR(255)")


def downgrade():
    op.execute("ALTER TABLE bookings DROP COLUMN IF EXISTS broker_signature")
    op.execute("ALTER TABLE bookings DROP COLUMN IF EXISTS broker_signed_at")
    op.execute("ALTER TABLE bookings DROP COLUMN IF EXISTS broker_signed_name")
    op.execute("ALTER TABLE bookings DROP COLUMN IF EXISTS carrier_signature")
    op.execute("ALTER TABLE bookings DROP COLUMN IF EXISTS carrier_signed_at")
    op.execute("ALTER TABLE bookings DROP COLUMN IF EXISTS carrier_signed_name")
