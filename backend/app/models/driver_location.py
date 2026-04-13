import uuid
from datetime import datetime
from sqlalchemy import Column, Float, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base


class DriverLocation(Base):
    __tablename__ = "driver_locations"

    id         = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    driver_id  = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    booking_id = Column(UUID(as_uuid=True), ForeignKey("bookings.id", ondelete="SET NULL"), nullable=True, index=True)
    lat        = Column(Float, nullable=False)
    lng        = Column(Float, nullable=False)
    heading    = Column(Float, nullable=True)
    speed_mph  = Column(Float, nullable=True)
    recorded_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    driver  = relationship("User", foreign_keys=[driver_id])
    booking = relationship("Booking", foreign_keys=[booking_id])
