"""Add lane_watches and notifications tables

Revision ID: 020_lane_watches_and_notifications
Revises: 019_tms_and_ratecon
Create Date: 2026-04-06

"""
from alembic import op

revision = '020_lane_watches_and_notifications'
down_revision = '019_tms_and_ratecon'
branch_labels = None
depends_on = None


def upgrade():
    # Use raw SQL throughout — avoids all SQLAlchemy DDL event hooks
    # that try to re-issue CREATE TYPE regardless of create_type=False.

    op.execute("""
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notificationtype') THEN
                CREATE TYPE notificationtype AS ENUM (
                    'new_bid', 'bid_accepted', 'bid_rejected', 'bid_countered',
                    'booking_approved', 'booking_denied', 'new_booking_request',
                    'lane_watch_match', 'tms_update'
                );
            END IF;
        END$$;
    """)

    op.execute("""
        CREATE TABLE IF NOT EXISTS notifications (
            id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            type        notificationtype NOT NULL,
            title       VARCHAR(255) NOT NULL,
            body        TEXT,
            data        JSONB,
            read        BOOLEAN NOT NULL DEFAULT false,
            created_at  TIMESTAMP DEFAULT now()
        );
    """)

    op.execute("""
        CREATE INDEX IF NOT EXISTS ix_notifications_user_id_created
        ON notifications (user_id, created_at);
    """)

    op.execute("""
        CREATE TABLE IF NOT EXISTS lane_watches (
            id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            carrier_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            origin_state    VARCHAR(2),
            dest_state      VARCHAR(2),
            equipment_type  VARCHAR(100),
            min_rate        FLOAT,
            min_rpm         FLOAT,
            active          BOOLEAN NOT NULL DEFAULT true,
            created_at      TIMESTAMP DEFAULT now()
        );
    """)

    op.execute("""
        CREATE INDEX IF NOT EXISTS ix_lane_watches_carrier_id
        ON lane_watches (carrier_id);
    """)


def downgrade():
    op.execute('DROP TABLE IF EXISTS lane_watches')
    op.execute('DROP TABLE IF EXISTS notifications')
    op.execute('DROP TYPE IF EXISTS notificationtype')
