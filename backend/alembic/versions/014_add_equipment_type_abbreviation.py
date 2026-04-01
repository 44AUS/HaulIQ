"""add abbreviation to equipment_types

Revision ID: 014_add_equipment_type_abbreviation
Revises: 013_add_equipment_types
Create Date: 2026-04-01

"""
from alembic import op
import sqlalchemy as sa

revision = '014_add_equipment_type_abbreviation'
down_revision = '013_add_equipment_types'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('equipment_types', sa.Column('abbreviation', sa.String(20), nullable=True))


def downgrade():
    op.drop_column('equipment_types', 'abbreviation')
