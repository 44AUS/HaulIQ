"""Add missing broker columns (avg_payment_days, pay_speed_verified, avg_rate_per_mile)

Revision ID: 001_add_missing_broker_cols
Revises:
Create Date: 2026-03-21
"""
from alembic import op

revision = '001_add_missing_broker_cols'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # Use raw SQL with IF NOT EXISTS so this is safe on any DB state
    op.execute("""
        ALTER TABLE brokers
            ADD COLUMN IF NOT EXISTS avg_payment_days DOUBLE PRECISION,
            ADD COLUMN IF NOT EXISTS pay_speed_verified BOOLEAN DEFAULT FALSE,
            ADD COLUMN IF NOT EXISTS avg_rate_per_mile DOUBLE PRECISION DEFAULT 0.0
    """)


def downgrade():
    op.execute("""
        ALTER TABLE brokers
            DROP COLUMN IF EXISTS avg_payment_days,
            DROP COLUMN IF EXISTS pay_speed_verified,
            DROP COLUMN IF EXISTS avg_rate_per_mile
    """)
