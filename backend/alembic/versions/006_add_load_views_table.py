"""Add load_views table for unique view tracking

Revision ID: 006_add_load_views
Revises: 005_add_phone_to_users
Create Date: 2026-03-22
"""
from alembic import op

revision = '006_add_load_views'
down_revision = '005_add_phone_to_users'
branch_labels = None
depends_on = None


def upgrade():
    op.execute("""
        CREATE TABLE IF NOT EXISTS load_views (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            load_id UUID NOT NULL REFERENCES loads(id) ON DELETE CASCADE,
            viewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            viewed_at TIMESTAMP NOT NULL DEFAULT NOW(),
            UNIQUE (load_id, viewer_id)
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS ix_load_views_load_id ON load_views (load_id)")


def downgrade():
    op.execute("DROP TABLE IF EXISTS load_views")
