"""Add load_templates table

Revision ID: 022_load_templates
Revises: 021_lane_watch_cities
Create Date: 2026-04-09

"""
from alembic import op

revision = '022_load_templates'
down_revision = '021_lane_watch_cities'
branch_labels = None
depends_on = None


def upgrade():
    op.execute("""
        CREATE TABLE IF NOT EXISTS load_templates (
            id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            broker_user_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

            name             VARCHAR(100) NOT NULL,

            origin           VARCHAR(255) NOT NULL,
            origin_state     VARCHAR(2),
            destination      VARCHAR(255) NOT NULL,
            dest_state       VARCHAR(2),
            miles            INTEGER NOT NULL DEFAULT 0,
            deadhead_miles   INTEGER NOT NULL DEFAULT 0,

            pickup_address   TEXT,
            delivery_address TEXT,
            pickup_lat       FLOAT,
            pickup_lng       FLOAT,
            delivery_lat     FLOAT,
            delivery_lng     FLOAT,

            load_type        VARCHAR(50),
            load_size        VARCHAR(20),
            trailer_length_ft INTEGER,
            weight_lbs       INTEGER,
            commodity        VARCHAR(255),
            dimensions       VARCHAR(50),

            rate             FLOAT NOT NULL DEFAULT 0,
            notes            TEXT,
            instant_book     BOOLEAN NOT NULL DEFAULT FALSE,

            times_used       INTEGER NOT NULL DEFAULT 0,
            created_at       TIMESTAMP NOT NULL DEFAULT NOW(),
            updated_at       TIMESTAMP DEFAULT NOW()
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS ix_load_templates_broker ON load_templates (broker_user_id)")


def downgrade():
    op.execute("DROP TABLE IF EXISTS load_templates")
