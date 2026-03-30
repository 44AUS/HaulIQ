"""add business address and vetting fields to users

Revision ID: 008
Revises: 007
Create Date: 2026-03-29
"""
from alembic import op
import sqlalchemy as sa

revision = '008_add_address_and_vetting'
down_revision = '007_network_status'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('users', sa.Column('business_address', sa.String(500), nullable=True))
    op.add_column('users', sa.Column('business_city',    sa.String(100), nullable=True))
    op.add_column('users', sa.Column('business_state',   sa.String(100), nullable=True))
    op.add_column('users', sa.Column('business_zip',     sa.String(20),  nullable=True))
    op.add_column('users', sa.Column('business_country', sa.String(100), nullable=True))
    op.add_column('users', sa.Column('vetting_status',   sa.String(20),  nullable=True, server_default='pending'))
    op.add_column('users', sa.Column('vetting_score',    sa.Integer(),   nullable=True))
    op.add_column('users', sa.Column('vetting_flags',    sa.Text(),      nullable=True))
    op.add_column('users', sa.Column('vetting_summary',  sa.Text(),      nullable=True))


def downgrade():
    for col in ['business_address', 'business_city', 'business_state', 'business_zip',
                'business_country', 'vetting_status', 'vetting_score', 'vetting_flags', 'vetting_summary']:
        op.drop_column('users', col)
