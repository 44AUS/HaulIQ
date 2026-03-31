"""stripe freight payments

Revision ID: 012_stripe_freight_payments
Revises: 011_waitlist_prebuilt_profile
Create Date: 2026-03-30

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

revision = '012_stripe_freight_payments'
down_revision = '011_waitlist_prebuilt_profile'
branch_labels = None
depends_on = None


def upgrade():
    # Add stripe_connect_account_id to users table
    op.add_column('users', sa.Column('stripe_connect_account_id', sa.String(255), nullable=True))

    # Create load_payments table
    op.create_table(
        'load_payments',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('booking_id', UUID(as_uuid=True), sa.ForeignKey('bookings.id'), unique=True, nullable=False),
        sa.Column('load_id', UUID(as_uuid=True), sa.ForeignKey('loads.id'), nullable=False),
        sa.Column('broker_id', UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('carrier_id', UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('amount', sa.Float(), nullable=False),
        sa.Column('fee_pct', sa.Float(), nullable=False),
        sa.Column('fee_amount', sa.Float(), nullable=False),
        sa.Column('carrier_amount', sa.Float(), nullable=False),
        sa.Column('status', sa.String(20), nullable=False, server_default='pending'),
        sa.Column('stripe_payment_intent_id', sa.String(255), nullable=True),
        sa.Column('stripe_transfer_id', sa.String(255), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=func.now()),
        sa.Column('escrowed_at', sa.DateTime(), nullable=True),
        sa.Column('released_at', sa.DateTime(), nullable=True),
    )


def downgrade():
    op.drop_table('load_payments')
    op.drop_column('users', 'stripe_connect_account_id')
