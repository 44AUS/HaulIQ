"""add abbreviation to equipment_types

Revision ID: 014_equip_abbreviation
Revises: 013_add_equipment_types
Create Date: 2026-04-01

"""
from alembic import op
import sqlalchemy as sa

revision = '014_equip_abbreviation'
down_revision = '013_add_equipment_types'
branch_labels = None
depends_on = None


def upgrade():
    # Use raw SQL so ADD COLUMN IF NOT EXISTS is safe on re-run
    op.get_bind().execute(sa.text(
        "ALTER TABLE equipment_types ADD COLUMN IF NOT EXISTS abbreviation VARCHAR(20)"
    ))


def downgrade():
    op.drop_column('equipment_types', 'abbreviation')
