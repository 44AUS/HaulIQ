"""add equipment_classes table and class_id to equipment_types

Revision ID: 015_add_equipment_classes
Revises: 014_add_equipment_type_abbreviation
Create Date: 2026-04-01

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision = '015_add_equipment_classes'
down_revision = '014_equip_abbreviation'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'equipment_classes',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('name', sa.String(100), nullable=False, unique=True),
        sa.Column('sort_order', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()')),
    )
    op.add_column('equipment_types',
        sa.Column('class_id', UUID(as_uuid=True),
                  sa.ForeignKey('equipment_classes.id', ondelete='SET NULL'),
                  nullable=True))


def downgrade():
    op.drop_column('equipment_types', 'class_id')
    op.drop_table('equipment_classes')
