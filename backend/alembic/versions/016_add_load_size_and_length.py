"""add load_size and trailer_length_ft to loads

Revision ID: 016_load_size_length
Revises: 015_add_equipment_classes
Create Date: 2026-04-01

"""
from alembic import op
import sqlalchemy as sa

revision = '016_load_size_length'
down_revision = '015_add_equipment_classes'
branch_labels = None
depends_on = None


def upgrade():
    conn = op.get_bind()
    conn.execute(sa.text("""
        ALTER TABLE loads
        ADD COLUMN IF NOT EXISTS load_size VARCHAR(10) DEFAULT 'full'
    """))
    conn.execute(sa.text("""
        ALTER TABLE loads
        ADD COLUMN IF NOT EXISTS trailer_length_ft INTEGER
    """))


def downgrade():
    op.drop_column('loads', 'load_size')
    op.drop_column('loads', 'trailer_length_ft')
