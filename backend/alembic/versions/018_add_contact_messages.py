"""add contact_messages table

Revision ID: 018_add_contact_messages
Revises: 017_add_is_active_to_users
Create Date: 2026-04-02

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision = '018_add_contact_messages'
down_revision = '017_add_is_active_to_users'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'contact_messages',
        sa.Column('id',         UUID(as_uuid=True), primary_key=True),
        sa.Column('name',       sa.String(255),  nullable=False),
        sa.Column('email',      sa.String(255),  nullable=False, index=True),
        sa.Column('subject',    sa.String(255),  nullable=False),
        sa.Column('message',    sa.Text(),        nullable=False),
        sa.Column('read',       sa.Boolean(),     nullable=False, server_default='false'),
        sa.Column('created_at', sa.DateTime(),    server_default=sa.func.now()),
    )


def downgrade():
    op.drop_table('contact_messages')
