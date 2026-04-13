import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, Integer, Boolean, DateTime, Text, ForeignKey, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base
from app.models.load import LoadType, LoadSize


class LoadTemplate(Base):
    __tablename__ = "load_templates"

    id               = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    broker_user_id   = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    name             = Column(String(100), nullable=False)   # e.g. "Chicago → Atlanta weekly"

    # Route
    origin           = Column(String(255), nullable=False)
    origin_state     = Column(String(2),   nullable=True)
    destination      = Column(String(255), nullable=False)
    dest_state       = Column(String(2),   nullable=True)
    miles            = Column(Integer,     nullable=False)
    deadhead_miles   = Column(Integer,     default=0)

    # Addresses
    pickup_address   = Column(Text,    nullable=True)
    delivery_address = Column(Text,    nullable=True)
    pickup_lat       = Column(Float,   nullable=True)
    pickup_lng       = Column(Float,   nullable=True)
    delivery_lat     = Column(Float,   nullable=True)
    delivery_lng     = Column(Float,   nullable=True)

    # Load details
    load_type        = Column(SAEnum(LoadType), nullable=True)
    load_size        = Column(SAEnum(LoadSize), nullable=True)
    trailer_length_ft= Column(Integer, nullable=True)
    weight_lbs       = Column(Integer, nullable=True)
    commodity        = Column(String(255), nullable=True)
    dimensions       = Column(String(50),  nullable=True)

    # Financials
    rate             = Column(Float,   nullable=False)
    notes            = Column(Text,    nullable=True)
    instant_book     = Column(Boolean, default=False)

    times_used       = Column(Integer, default=0, nullable=False)
    created_at       = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at       = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    broker_user      = relationship("User", foreign_keys=[broker_user_id])
