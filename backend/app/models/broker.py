import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, Integer, Boolean, DateTime, Text, ForeignKey, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base
import enum


class BrokerBadge(str, enum.Enum):
    elite    = "elite"
    trusted  = "trusted"
    verified = "verified"
    warning  = "warning"


class PaySpeed(str, enum.Enum):
    quick_pay = "Quick-Pay"
    net_14    = "Net-14"
    net_21    = "Net-21"
    net_30    = "Net-30"
    net_45    = "Net-45"


class Broker(Base):
    __tablename__ = "brokers"

    id             = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id        = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    name           = Column(String(255), nullable=False, index=True)
    mc_number      = Column(String(50), nullable=True)
    avg_rating     = Column(Float, default=0.0)
    reviews_count  = Column(Integer, default=0)
    pay_speed      = Column(SAEnum(PaySpeed), default=PaySpeed.net_30)
    badge          = Column(SAEnum(BrokerBadge), nullable=True)
    warning_count  = Column(Integer, default=0)
    avg_payment_days   = Column(Float,   nullable=True)           # calculated from carrier reviews
    pay_speed_verified = Column(Boolean, default=False)           # True once 5+ payment_days reports exist
    avg_rate_per_mile = Column(Float, default=0.0)
    is_active      = Column(Boolean, default=True)
    created_at     = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user           = relationship("User", back_populates="broker_profile")
    reviews        = relationship("BrokerReview", back_populates="broker", cascade="all, delete-orphan")
    loads          = relationship("Load", back_populates="broker")

    @property
    def phone(self):
        return self.user.phone if self.user else None

    @property
    def logo(self):
        return self.user.avatar_url if self.user else None

    def __repr__(self):
        return f"<Broker {self.name} ({self.avg_rating}★)>"


class BrokerReview(Base):
    __tablename__ = "broker_reviews"

    id             = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    broker_id      = Column(UUID(as_uuid=True), ForeignKey("brokers.id"), nullable=False, index=True)
    carrier_id     = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    rating         = Column(Integer, nullable=False)          # 1–5
    comment        = Column(Text, nullable=True)
    payment_days   = Column(Integer, nullable=True)           # actual days to payment
    communication  = Column(Integer, nullable=True)   # 1–5
    accuracy       = Column(Integer, nullable=True)   # 1–5: was load as described?
    would_work_again = Column(Boolean, nullable=True)
    is_anonymous   = Column(Boolean, default=False)
    created_at     = Column(DateTime, default=datetime.utcnow)

    # Relationships
    broker         = relationship("Broker", back_populates="reviews")
    carrier        = relationship("User", back_populates="reviews_given")
