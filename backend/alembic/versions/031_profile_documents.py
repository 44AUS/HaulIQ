"""profile_documents table

Revision ID: 031_profile_documents
Revises: 030_clock_in_location
Create Date: 2026-04-17
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB

revision = '031_profile_documents'
down_revision = '030_clock_in_location'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'profile_documents',
        sa.Column('id',         UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id',    UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('file_name',  sa.String,  nullable=False),
        sa.Column('doc_type',   sa.String,  nullable=False, server_default='other'),
        sa.Column('pages',      JSONB,      nullable=True),
        sa.Column('page_count', sa.Integer, server_default='1'),
        sa.Column('file_size',  sa.BigInteger, nullable=True),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
    )
    op.create_index('ix_profile_documents_user_id', 'profile_documents', ['user_id'])


def downgrade():
    op.drop_index('ix_profile_documents_user_id', table_name='profile_documents')
    op.drop_table('profile_documents')
