"""Add missing loads columns (instant_book, book_now)

Revision ID: 002_add_missing_loads_cols
Revises: 001_add_missing_broker_cols
Create Date: 2026-03-21
"""
from alembic import op

revision = '002_add_missing_loads_cols'
down_revision = '001_add_missing_broker_cols'
branch_labels = None
depends_on = None


def upgrade():
    op.execute("""
        ALTER TABLE loads
            ADD COLUMN IF NOT EXISTS instant_book BOOLEAN DEFAULT FALSE,
            ADD COLUMN IF NOT EXISTS book_now BOOLEAN DEFAULT TRUE,
            ADD COLUMN IF NOT EXISTS broker_user_id UUID REFERENCES users(id),
            ADD COLUMN IF NOT EXISTS origin_state VARCHAR(2),
            ADD COLUMN IF NOT EXISTS dest_state VARCHAR(2),
            ADD COLUMN IF NOT EXISTS market_rate_per_mile DOUBLE PRECISION,
            ADD COLUMN IF NOT EXISTS is_above_market BOOLEAN,
            ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP
    """)


def downgrade():
    op.execute("""
        ALTER TABLE loads
            DROP COLUMN IF EXISTS instant_book,
            DROP COLUMN IF EXISTS book_now,
            DROP COLUMN IF EXISTS broker_user_id,
            DROP COLUMN IF EXISTS origin_state,
            DROP COLUMN IF EXISTS dest_state,
            DROP COLUMN IF EXISTS market_rate_per_mile,
            DROP COLUMN IF EXISTS is_above_market,
            DROP COLUMN IF EXISTS updated_at
    """)
