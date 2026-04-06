"""Add TMS dispatch fields and check call log table

Revision ID: 019_tms_and_ratecon
Revises: 018_add_contact_messages
Create Date: 2026-04-06

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID
import uuid

revision = '019_tms_and_ratecon'
down_revision = '018_add_contact_messages'
branch_labels = None
depends_on = None


def upgrade():
    # 1. Create TMSStatus enum type
    op.execute("CREATE TYPE tmsstatus AS ENUM ('dispatched', 'picked_up', 'in_transit', 'delivered', 'pod_received')")

    # 2. Add TMS columns to bookings
    op.add_column('bookings', sa.Column('driver_name',           sa.String(255), nullable=True))
    op.add_column('bookings', sa.Column('driver_phone',          sa.String(20),  nullable=True))
    op.add_column('bookings', sa.Column('dispatch_notes',        sa.Text(),      nullable=True))
    op.add_column('bookings', sa.Column('carrier_visible_notes', sa.Text(),      nullable=True))
    op.add_column('bookings', sa.Column('dispatched_at',         sa.DateTime(),  nullable=True))
    op.add_column('bookings', sa.Column('picked_up_at',          sa.DateTime(),  nullable=True))
    op.add_column('bookings', sa.Column('in_transit_at',         sa.DateTime(),  nullable=True))
    op.add_column('bookings', sa.Column('delivered_at',          sa.DateTime(),  nullable=True))
    op.add_column('bookings', sa.Column('pod_received_at',       sa.DateTime(),  nullable=True))
    op.add_column('bookings', sa.Column('tms_status', sa.Enum(
        'dispatched', 'picked_up', 'in_transit', 'delivered', 'pod_received',
        name='tmsstatus'
    ), nullable=True))

    # 3. Create check_call_logs table
    op.create_table(
        'check_call_logs',
        sa.Column('id',         UUID(as_uuid=True), primary_key=True),
        sa.Column('booking_id', UUID(as_uuid=True), sa.ForeignKey('bookings.id'), nullable=False, index=True),
        sa.Column('author_id',  UUID(as_uuid=True), sa.ForeignKey('users.id'),    nullable=False),
        sa.Column('note',       sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
    )


def downgrade():
    op.drop_table('check_call_logs')
    op.drop_column('bookings', 'tms_status')
    op.drop_column('bookings', 'pod_received_at')
    op.drop_column('bookings', 'delivered_at')
    op.drop_column('bookings', 'in_transit_at')
    op.drop_column('bookings', 'picked_up_at')
    op.drop_column('bookings', 'dispatched_at')
    op.drop_column('bookings', 'carrier_visible_notes')
    op.drop_column('bookings', 'dispatch_notes')
    op.drop_column('bookings', 'driver_phone')
    op.drop_column('bookings', 'driver_name')
    op.execute("DROP TYPE tmsstatus")
