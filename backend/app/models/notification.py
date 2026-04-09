import uuid
import enum
from datetime import datetime
from sqlalchemy import Column, String, Text, Boolean, DateTime, ForeignKey, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from app.database import Base


class NotificationType(str, enum.Enum):
    new_bid             = "new_bid"
    bid_accepted        = "bid_accepted"
    bid_rejected        = "bid_rejected"
    bid_countered       = "bid_countered"
    booking_approved    = "booking_approved"
    booking_denied      = "booking_denied"
    new_booking_request = "new_booking_request"
    lane_watch_match    = "lane_watch_match"
    tms_update          = "tms_update"


class Notification(Base):
    __tablename__ = "notifications"

    id         = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id    = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    type       = Column(SAEnum(NotificationType, create_type=False), nullable=False)
    title      = Column(String(255), nullable=False)
    body       = Column(Text, nullable=True)
    data       = Column(JSONB, nullable=True)   # {load_id, booking_id, bid_id, …}
    read       = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", foreign_keys=[user_id])
