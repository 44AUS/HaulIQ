import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base


class LaneWatch(Base):
    __tablename__ = "lane_watches"

    id             = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    carrier_id     = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    # Match criteria — None means "any"
    origin_city    = Column(String(100), nullable=True)  # e.g. "Chicago" or None = any
    origin_state   = Column(String(2), nullable=True)    # e.g. "IL" or None = any
    dest_city      = Column(String(100), nullable=True)
    dest_state     = Column(String(2), nullable=True)
    equipment_type = Column(String(100), nullable=True)  # e.g. "Dry Van" or None = any
    min_rate       = Column(Float, nullable=True)        # minimum all-in rate
    min_rpm        = Column(Float, nullable=True)        # minimum rate per mile

    active         = Column(Boolean, default=True, nullable=False)
    created_at     = Column(DateTime, default=datetime.utcnow, nullable=False)

    carrier        = relationship("User", foreign_keys=[carrier_id])
