import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base


class InstantBookAllowlist(Base):
    __tablename__ = "instant_book_allowlist"

    id            = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    broker_id     = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)

    # HaulIQ-registered carrier (null if external upload)
    carrier_id    = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True, index=True)

    # Fields for externally uploaded carriers (not yet on HaulIQ)
    carrier_email = Column(String(255), nullable=True)
    carrier_name  = Column(String(255), nullable=True)
    carrier_mc    = Column(String(50),  nullable=True)

    source        = Column(String(20), default="search")   # "search" | "upload"
    added_at      = Column(DateTime, default=datetime.utcnow)

    broker  = relationship("User", foreign_keys=[broker_id])
    carrier = relationship("User", foreign_keys=[carrier_id])
