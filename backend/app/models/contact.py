import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Boolean, Text
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base


class ContactMessage(Base):
    __tablename__ = "contact_messages"

    id         = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name       = Column(String(255), nullable=False)
    email      = Column(String(255), nullable=False, index=True)
    subject    = Column(String(255), nullable=False)
    message    = Column(Text, nullable=False)
    read       = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
