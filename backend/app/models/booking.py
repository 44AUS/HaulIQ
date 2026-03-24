import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, Text, DateTime, ForeignKey, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base
import enum


class BidStatus(str, enum.Enum):
    pending  = "pending"
    accepted = "accepted"
    rejected = "rejected"
    countered = "countered"
    withdrawn = "withdrawn"


class BookingStatus(str, enum.Enum):
    pending   = "pending"
    approved  = "approved"
    denied    = "denied"
    cancelled = "cancelled"
    in_transit = "in_transit"
    completed = "completed"


class Bid(Base):
    __tablename__ = "bids"

    id          = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    load_id     = Column(UUID(as_uuid=True), ForeignKey("loads.id"), nullable=False, index=True)
    carrier_id  = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    amount      = Column(Float, nullable=False)
    note        = Column(Text, nullable=True)
    status      = Column(SAEnum(BidStatus), default=BidStatus.pending)
    counter_amount = Column(Float, nullable=True)
    counter_note   = Column(Text, nullable=True)
    created_at  = Column(DateTime, default=datetime.utcnow)
    updated_at  = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    carrier     = relationship("User", foreign_keys=[carrier_id])


class Booking(Base):
    __tablename__ = "bookings"

    id          = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    load_id     = Column(UUID(as_uuid=True), ForeignKey("loads.id"), nullable=False, index=True)
    carrier_id  = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    status      = Column(SAEnum(BookingStatus), default=BookingStatus.pending)
    is_instant  = Column(String(5), default="false")   # "true" if instant book (no approval)
    note        = Column(Text, nullable=True)
    broker_note = Column(Text, nullable=True)
    created_at  = Column(DateTime, default=datetime.utcnow)
    updated_at  = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    carrier     = relationship("User", foreign_keys=[carrier_id])
