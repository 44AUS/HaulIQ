"""Create driver_locations tracking table"""
from alembic import op

revision = "026_driver_locations"
down_revision = "025_booking_driver"
branch_labels = None
depends_on = None


def upgrade():
    op.execute("""
        CREATE TABLE IF NOT EXISTS driver_locations (
            id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            driver_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
            lat        FLOAT NOT NULL,
            lng        FLOAT NOT NULL,
            heading    FLOAT,
            speed_mph  FLOAT,
            recorded_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS idx_drvloc_driver_time ON driver_locations (driver_id, recorded_at DESC)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_drvloc_booking     ON driver_locations (booking_id, recorded_at DESC)")


def downgrade():
    op.execute("DROP TABLE IF EXISTS driver_locations")
