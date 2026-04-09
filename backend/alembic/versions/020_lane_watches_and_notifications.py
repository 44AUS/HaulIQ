"""Add lane_watches and notifications tables

Revision ID: 020_lane_watches_and_notifications
Revises: 019_tms_and_ratecon
Create Date: 2026-04-06

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB

revision = '020_lane_watches_and_notifications'
down_revision = '019_tms_and_ratecon'
branch_labels = None
depends_on = None


def upgrade():
    # 1. Create notificationtype enum
    op.execute("""
        CREATE TYPE notificationtype AS ENUM (
            'new_bid', 'bid_accepted', 'bid_rejected', 'bid_countered',
            'booking_approved', 'booking_denied', 'new_booking_request',
            'lane_watch_match', 'tms_update'
        )
    """)

    # 2. notifications table
    op.create_table(
        'notifications',
        sa.Column('id',         UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id',    UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('type',       sa.Enum(
            'new_bid', 'bid_accepted', 'bid_rejected', 'bid_countered',
            'booking_approved', 'booking_denied', 'new_booking_request',
            'lane_watch_match', 'tms_update',
            name='notificationtype'
        ), nullable=False),
        sa.Column('title',      sa.String(255), nullable=False),
        sa.Column('body',       sa.Text(), nullable=True),
        sa.Column('data',       JSONB, nullable=True),
        sa.Column('read',       sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
    )
    op.create_index('ix_notifications_user_id_created', 'notifications', ['user_id', 'created_at'])

    # 3. lane_watches table
    op.create_table(
        'lane_watches',
        sa.Column('id',             UUID(as_uuid=True), primary_key=True),
        sa.Column('carrier_id',     UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('origin_state',   sa.String(2),   nullable=True),
        sa.Column('dest_state',     sa.String(2),   nullable=True),
        sa.Column('equipment_type', sa.String(100), nullable=True),
        sa.Column('min_rate',       sa.Float(),     nullable=True),
        sa.Column('min_rpm',        sa.Float(),     nullable=True),
        sa.Column('active',         sa.Boolean(),   nullable=False, server_default='true'),
        sa.Column('created_at',     sa.DateTime(),  server_default=sa.func.now()),
    )


def downgrade():
    op.drop_table('lane_watches')
    op.drop_index('ix_notifications_user_id_created', table_name='notifications')
    op.drop_table('notifications')
    op.execute('DROP TYPE notificationtype')
