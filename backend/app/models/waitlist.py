import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base


class WaitlistEntry(Base):
    __tablename__ = "waitlist"

    id         = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email      = Column(String(255), nullable=False, unique=True, index=True)
    name       = Column(String(255), nullable=True)
    role       = Column(String(20), nullable=False)  # 'carrier' | 'broker'
    created_at = Column(DateTime, default=datetime.utcnow)
