"""add equipment_classes table and class_id to equipment_types

Revision ID: 015_add_equipment_classes
Revises: 014_equip_abbreviation
Create Date: 2026-04-01

"""
from alembic import op
import sqlalchemy as sa

revision = '015_add_equipment_classes'
down_revision = '014_equip_abbreviation'
branch_labels = None
depends_on = None


def upgrade():
    conn = op.get_bind()
    conn.execute(sa.text("""
        CREATE TABLE IF NOT EXISTS equipment_classes (
            id UUID DEFAULT gen_random_uuid() NOT NULL,
            name VARCHAR(100) NOT NULL,
            sort_order INTEGER NOT NULL DEFAULT 0,
            is_active BOOLEAN NOT NULL DEFAULT true,
            created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
            PRIMARY KEY (id),
            UNIQUE (name)
        )
    """))
    conn.execute(sa.text("""
        ALTER TABLE equipment_types
        ADD COLUMN IF NOT EXISTS class_id UUID
        REFERENCES equipment_classes(id) ON DELETE SET NULL
    """))


def downgrade():
    op.drop_column('equipment_types', 'class_id')
    op.drop_table('equipment_classes')
