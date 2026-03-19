import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, Boolean, Text, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base


class CarrierReview(Base):
    __tablename__ = "carrier_reviews"

    id               = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    carrier_id       = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    broker_id        = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    load_id          = Column(UUID(as_uuid=True), ForeignKey("loads.id"), nullable=True)

    # Ratings
    rating           = Column(Integer, nullable=False)   # 1–5 overall
    communication    = Column(Integer, nullable=True)    # 1–5
    on_time_pickup   = Column(Integer, nullable=True)    # 1–5
    on_time_delivery = Column(Integer, nullable=True)    # 1–5
    load_care        = Column(Integer, nullable=True)    # 1–5: cargo care, no damage
    would_work_again = Column(Boolean, nullable=True)

    comment          = Column(Text, nullable=True)
    is_anonymous     = Column(Boolean, default=False)
    created_at       = Column(DateTime, default=datetime.utcnow)

    carrier          = relationship("User", foreign_keys=[carrier_id], back_populates="carrier_reviews_received")
    broker_user      = relationship("User", foreign_keys=[broker_id],  back_populates="carrier_reviews_given")
