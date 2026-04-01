"""add equipment_types table

Revision ID: 013_add_equipment_types
Revises: 012_stripe_freight_payments
Create Date: 2026-04-01

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision = '013_add_equipment_types'
down_revision = '012_stripe_freight_payments'
branch_labels = None
depends_on = None


def upgrade():
    conn = op.get_bind()
    conn.execute(sa.text("""
        CREATE TABLE IF NOT EXISTS equipment_types (
            id UUID DEFAULT gen_random_uuid() NOT NULL,
            name VARCHAR(100) NOT NULL,
            sort_order INTEGER NOT NULL DEFAULT 0,
            is_active BOOLEAN NOT NULL DEFAULT true,
            created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
            PRIMARY KEY (id),
            UNIQUE (name)
        )
    """))


def downgrade():
    op.drop_table('equipment_types')
