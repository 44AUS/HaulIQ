import uuid
from sqlalchemy import Column, String, Float, Boolean, DateTime, ForeignKey, Date, Integer, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class TruckPost(Base):
    __tablename__ = "truck_posts"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    carrier_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    equipment_type = Column(String(100), nullable=False)  # dry_van, flatbed, reefer, step_deck, lowboy
    trailer_length = Column(Integer)  # feet
    weight_capacity = Column(Integer)  # lbs
    current_location = Column(String(255), nullable=False)
    preferred_origin = Column(String(255))
    preferred_destination = Column(String(255))
    available_from = Column(Date, nullable=False)
    available_to = Column(Date, nullable=False)
    rate_expectation = Column(Float)  # $/mile
    notes = Column(Text)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    carrier = relationship("User", foreign_keys=[carrier_id])
