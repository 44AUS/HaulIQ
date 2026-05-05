"""add load_number to loads

Revision ID: 032_add_load_number
Revises: 031_profile_documents
Create Date: 2026-05-04
"""
from alembic import op
import sqlalchemy as sa

revision = '032_add_load_number'
down_revision = '031_profile_documents'
branch_labels = None
depends_on = None


def upgrade():
    op.execute("CREATE SEQUENCE IF NOT EXISTS loads_load_number_seq START 10001")
    op.add_column('loads', sa.Column('load_number', sa.Integer(), nullable=True))
    op.execute("UPDATE loads SET load_number = nextval('loads_load_number_seq')")
    op.execute("ALTER TABLE loads ALTER COLUMN load_number SET DEFAULT nextval('loads_load_number_seq')")
    op.execute("ALTER TABLE loads ALTER COLUMN load_number SET NOT NULL")
    op.create_index('ix_loads_load_number', 'loads', ['load_number'], unique=True)


def downgrade():
    op.drop_index('ix_loads_load_number', table_name='loads')
    op.drop_column('loads', 'load_number')
    op.execute("DROP SEQUENCE IF EXISTS loads_load_number_seq")
