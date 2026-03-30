"""add initiated_by_id to broker_network

Revision ID: 010_add_network_initiated_by
Revises: 009_add_last_active
Create Date: 2026-03-30
"""
from alembic import op
import sqlalchemy as sa

revision = '010_add_network_initiated_by'
down_revision = '009_add_last_active'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        'broker_network',
        sa.Column('initiated_by_id', sa.dialects.postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.create_foreign_key(
        'fk_broker_network_initiated_by',
        'broker_network', 'users',
        ['initiated_by_id'], ['id'],
        ondelete='SET NULL',
    )


def downgrade():
    op.drop_constraint('fk_broker_network_initiated_by', 'broker_network', type_='foreignkey')
    op.drop_column('broker_network', 'initiated_by_id')
