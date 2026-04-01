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
    op.create_table(
        'equipment_types',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('name', sa.String(100), nullable=False, unique=True),
        sa.Column('sort_order', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()')),
    )


def downgrade():
    op.drop_table('equipment_types')
