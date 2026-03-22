"""Add broker_network table

Revision ID: 003_add_broker_network
Revises: 002_add_missing_loads_cols
Create Date: 2026-03-22
"""
from alembic import op

revision = '003_add_broker_network'
down_revision = '002_add_missing_loads_cols'
branch_labels = None
depends_on = None


def upgrade():
    op.execute("""
        CREATE TABLE IF NOT EXISTS broker_network (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            broker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            carrier_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            created_at TIMESTAMP DEFAULT NOW(),
            CONSTRAINT uq_broker_carrier_network UNIQUE (broker_id, carrier_id)
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS ix_broker_network_broker ON broker_network (broker_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_broker_network_carrier ON broker_network (carrier_id)")


def downgrade():
    op.execute("DROP TABLE IF EXISTS broker_network")
