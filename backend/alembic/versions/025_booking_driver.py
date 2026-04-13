"""Add driver assignment columns to bookings"""
from alembic import op

revision = "025_booking_driver"
down_revision = "024_driver_users"
branch_labels = None
depends_on = None


def upgrade():
    op.execute("ALTER TABLE bookings ADD COLUMN IF NOT EXISTS assigned_driver_id UUID REFERENCES users(id) ON DELETE SET NULL")
    op.execute("ALTER TABLE bookings ADD COLUMN IF NOT EXISTS driver_pay FLOAT")
    op.execute("ALTER TABLE bookings ADD COLUMN IF NOT EXISTS driver_pay_status VARCHAR(20) NOT NULL DEFAULT 'unpaid'")


def downgrade():
    op.execute("ALTER TABLE bookings DROP COLUMN IF EXISTS driver_pay_status")
    op.execute("ALTER TABLE bookings DROP COLUMN IF EXISTS driver_pay")
    op.execute("ALTER TABLE bookings DROP COLUMN IF EXISTS assigned_driver_id")
