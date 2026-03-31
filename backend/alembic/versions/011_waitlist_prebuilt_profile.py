"""Add company/mc_number to waitlist and user_id FK for pre-built profiles

Revision ID: 011_waitlist_prebuilt_profile
Revises: 010_add_network_initiated_by
Create Date: 2026-03-30
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision = '011_waitlist_prebuilt_profile'
down_revision = '010_add_network_initiated_by'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('waitlist', sa.Column('company', sa.String(255), nullable=True))
    op.add_column('waitlist', sa.Column('mc_number', sa.String(50), nullable=True))
    op.add_column('waitlist', sa.Column('user_id', UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True))
    op.add_column('waitlist', sa.Column('activated', sa.Boolean(), server_default='false', nullable=False))


def downgrade():
    op.drop_column('waitlist', 'activated')
    op.drop_column('waitlist', 'user_id')
    op.drop_column('waitlist', 'mc_number')
    op.drop_column('waitlist', 'company')
