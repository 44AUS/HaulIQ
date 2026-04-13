"""Add driver role support: user fields for carrier drivers"""
from alembic import op

revision = "024_driver_users"
down_revision = "023_booking_signatures"
branch_labels = None
depends_on = None


def upgrade():
    # Note: 'driver' enum value is added to userrole in main.py lifespan
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS carrier_id UUID REFERENCES users(id) ON DELETE SET NULL")
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS invite_token VARCHAR(64)")
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS invite_accepted BOOLEAN NOT NULL DEFAULT FALSE")
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS license_number VARCHAR(50)")


def downgrade():
    op.execute("ALTER TABLE users DROP COLUMN IF EXISTS license_number")
    op.execute("ALTER TABLE users DROP COLUMN IF EXISTS invite_accepted")
    op.execute("ALTER TABLE users DROP COLUMN IF EXISTS invite_token")
    op.execute("ALTER TABLE users DROP COLUMN IF EXISTS carrier_id")
