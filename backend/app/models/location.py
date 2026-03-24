import uuid
from datetime import datetime
from sqlalchemy import Column, Float, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base


class CarrierLocation(Base):
    __tablename__ = "carrier_locations"

    id         = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    booking_id = Column(UUID(as_uuid=True), ForeignKey("bookings.id"), nullable=False, unique=True, index=True)
    carrier_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    lat        = Column(Float, nullable=False)
    lng        = Column(Float, nullable=False)
    accuracy   = Column(Float, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
