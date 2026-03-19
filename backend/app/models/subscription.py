import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, Boolean, DateTime, Integer, JSON, ForeignKey, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base
import enum


class PlanRole(str, enum.Enum):
    carrier = "carrier"
    broker  = "broker"


class PlanTier(str, enum.Enum):
    basic = "basic"
    pro   = "pro"
    elite = "elite"


class SubStatus(str, enum.Enum):
    active    = "active"
    cancelled = "cancelled"
    past_due  = "past_due"
    trialing  = "trialing"


class Plan(Base):
    __tablename__ = "plans"

    id           = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name         = Column(String(50), nullable=False)
    role         = Column(SAEnum(PlanRole), nullable=False)
    tier         = Column(SAEnum(PlanTier), nullable=False)
    price        = Column(Float, nullable=False, default=0.0)  # monthly USD
    description  = Column(String(500), nullable=True)
    features     = Column(JSON, nullable=False, default=list)
    limits       = Column(JSON, nullable=False, default=dict)
    is_active    = Column(Boolean, default=True)
    created_at   = Column(DateTime, default=datetime.utcnow)
    updated_at   = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    subscriptions = relationship("Subscription", back_populates="plan")

    def __repr__(self):
        return f"<Plan {self.role}-{self.tier} ${self.price}/mo>"


class Subscription(Base):
    __tablename__ = "subscriptions"

    id                    = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id               = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, unique=True, index=True)
    plan_id               = Column(UUID(as_uuid=True), ForeignKey("plans.id"), nullable=False)
    status                = Column(SAEnum(SubStatus), default=SubStatus.active)
    current_period_start  = Column(DateTime, default=datetime.utcnow)
    current_period_end    = Column(DateTime, nullable=True)
    adyen_subscription_id    = Column(String(255), nullable=True)  # Adyen PSP reference
    adyen_shopper_reference  = Column(String(255), nullable=True)  # Adyen shopper reference (user ID)
    created_at            = Column(DateTime, default=datetime.utcnow)
    updated_at            = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="subscription")
    plan = relationship("Plan", back_populates="subscriptions")

    def __repr__(self):
        return f"<Subscription user={self.user_id} plan={self.plan_id} {self.status}>"
