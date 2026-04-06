import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, Text, DateTime, ForeignKey, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base
import enum


class TMSStatus(str, enum.Enum):
    dispatched   = "dispatched"
    picked_up    = "picked_up"
    in_transit   = "in_transit"
    delivered    = "delivered"
    pod_received = "pod_received"


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


class CheckCallLog(Base):
    __tablename__ = "check_call_logs"

    id         = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    booking_id = Column(UUID(as_uuid=True), ForeignKey("bookings.id"), nullable=False, index=True)
    author_id  = Column(UUID(as_uuid=True), ForeignKey("users.id"),    nullable=False)
    note       = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    booking = relationship("Booking", back_populates="check_calls")
    author  = relationship("User", foreign_keys=[author_id])


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

    # TMS dispatch fields
    driver_name           = Column(String(255), nullable=True)
    driver_phone          = Column(String(20),  nullable=True)
    dispatch_notes        = Column(Text, nullable=True)
    carrier_visible_notes = Column(Text, nullable=True)
    dispatched_at         = Column(DateTime, nullable=True)
    picked_up_at          = Column(DateTime, nullable=True)
    in_transit_at         = Column(DateTime, nullable=True)
    delivered_at          = Column(DateTime, nullable=True)
    pod_received_at       = Column(DateTime, nullable=True)
    tms_status            = Column(SAEnum(TMSStatus, create_type=False), nullable=True)

    check_calls = relationship("CheckCallLog", back_populates="booking", order_by="CheckCallLog.created_at")
