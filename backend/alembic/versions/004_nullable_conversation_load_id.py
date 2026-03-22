"""Make conversations.load_id nullable for direct messages

Revision ID: 004_nullable_conversation_load_id
Revises: 003_add_broker_network
Create Date: 2026-03-22
"""
from alembic import op

revision = '004_convo_load_nullable'
down_revision = '003_add_broker_network'
branch_labels = None
depends_on = None


def upgrade():
    op.execute("ALTER TABLE conversations ALTER COLUMN load_id DROP NOT NULL")


def downgrade():
    op.execute("ALTER TABLE conversations ALTER COLUMN load_id SET NOT NULL")
