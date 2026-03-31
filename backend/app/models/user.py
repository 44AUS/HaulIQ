import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base
import enum


class UserRole(str, enum.Enum):
    carrier = "carrier"
    broker  = "broker"
    admin   = "admin"


class UserPlan(str, enum.Enum):
    basic = "basic"
    pro   = "pro"
    elite = "elite"
    admin = "admin"


class User(Base):
    __tablename__ = "users"

    id             = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    email          = Column(String(255), unique=True, nullable=False, index=True)
    password_hash  = Column(String(255), nullable=False)
    name           = Column(String(255), nullable=False)
    role           = Column(SAEnum(UserRole), nullable=False, default=UserRole.carrier)
    plan           = Column(SAEnum(UserPlan), nullable=False, default=UserPlan.basic)
    company        = Column(String(255), nullable=True)
    phone          = Column(String(20), nullable=True)
    mc_number      = Column(String(50), nullable=True)
    dot_number     = Column(String(50), nullable=True)
    avatar_url        = Column(String, nullable=True)
    is_active         = Column(Boolean, default=True)
    is_verified       = Column(Boolean, default=False)
    # Business address (from Google Places)
    business_address  = Column(String(500), nullable=True)
    business_city     = Column(String(100), nullable=True)
    business_state    = Column(String(100), nullable=True)
    business_zip      = Column(String(20),  nullable=True)
    business_country  = Column(String(100), nullable=True)
    # AI vetting
    vetting_status    = Column(String(20), nullable=True, default='pending')
    vetting_score     = Column(String(20), nullable=True)
    vetting_flags     = Column(String, nullable=True)
    vetting_summary   = Column(String, nullable=True)
    last_active_at    = Column(DateTime, nullable=True)
    created_at        = Column(DateTime, default=datetime.utcnow)
    updated_at        = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    stripe_connect_account_id = Column(String(255), nullable=True)
    brand_color               = Column(String(20), nullable=True)

    # Relationships
    subscription   = relationship("Subscription", back_populates="user", uselist=False)
    saved_loads    = relationship("SavedLoad", back_populates="carrier")
    load_history   = relationship("LoadHistory", back_populates="carrier")
    insights       = relationship("DriverInsight", back_populates="carrier")
    reviews_given  = relationship("BrokerReview", back_populates="carrier")
    broker_profile = relationship("Broker", back_populates="user", uselist=False)
    carrier_reviews_received = relationship("CarrierReview", foreign_keys="CarrierReview.carrier_id", back_populates="carrier")
    carrier_reviews_given    = relationship("CarrierReview", foreign_keys="CarrierReview.broker_id",  back_populates="broker_user")
    loads_posted   = relationship("Load", back_populates="broker_user")

    def __repr__(self):
        return f"<User {self.email} ({self.role})>"
