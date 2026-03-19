import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, Boolean, DateTime, ForeignKey, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base
import enum


class Conversation(Base):
    __tablename__ = "conversations"

    id         = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    load_id    = Column(UUID(as_uuid=True), ForeignKey("loads.id"), nullable=False, index=True)
    carrier_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    broker_id  = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    messages   = relationship("Message", back_populates="conversation", order_by="Message.created_at")
    carrier    = relationship("User", foreign_keys=[carrier_id])
    broker     = relationship("User", foreign_keys=[broker_id])


class Message(Base):
    __tablename__ = "messages"

    id              = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    conversation_id = Column(UUID(as_uuid=True), ForeignKey("conversations.id"), nullable=False, index=True)
    sender_id       = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    body            = Column(Text, nullable=False)
    is_read         = Column(Boolean, default=False)
    created_at      = Column(DateTime, default=datetime.utcnow)

    conversation    = relationship("Conversation", back_populates="messages")
    sender          = relationship("User", foreign_keys=[sender_id])
