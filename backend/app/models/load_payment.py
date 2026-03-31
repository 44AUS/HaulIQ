import uuid, enum
from datetime import datetime
from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base

class PaymentStatus(str, enum.Enum):
    pending  = "pending"
    escrowed = "escrowed"
    released = "released"
    refunded = "refunded"
    failed   = "failed"

class LoadPayment(Base):
    __tablename__ = "load_payments"
    id                       = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    booking_id               = Column(UUID(as_uuid=True), ForeignKey("bookings.id"), unique=True, nullable=False)
    load_id                  = Column(UUID(as_uuid=True), ForeignKey("loads.id"), nullable=False)
    broker_id                = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    carrier_id               = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    amount                   = Column(Float, nullable=False)
    fee_pct                  = Column(Float, nullable=False)
    fee_amount               = Column(Float, nullable=False)
    carrier_amount           = Column(Float, nullable=False)
    status                   = Column(String(20), default="pending", nullable=False)
    stripe_payment_intent_id = Column(String(255), nullable=True)
    stripe_transfer_id       = Column(String(255), nullable=True)
    created_at               = Column(DateTime, default=datetime.utcnow)
    escrowed_at              = Column(DateTime, nullable=True)
    released_at              = Column(DateTime, nullable=True)

    broker  = relationship("User", foreign_keys=[broker_id])
    carrier = relationship("User", foreign_keys=[carrier_id])
