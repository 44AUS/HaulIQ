import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base


class WaitlistEntry(Base):
    __tablename__ = "waitlist"

    id         = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email      = Column(String(255), nullable=False, unique=True, index=True)
    name       = Column(String(255), nullable=True)
    role       = Column(String(20), nullable=False)  # 'carrier' | 'broker'
    company    = Column(String(255), nullable=True)
    mc_number  = Column(String(50), nullable=True)
    user_id    = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    activated  = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", foreign_keys=[user_id])
