from pydantic import BaseModel, field_validator
from typing import Optional
from uuid import UUID
from datetime import datetime
from app.models.broker import BrokerBadge, PaySpeed


class BrokerOut(BaseModel):
    id: UUID
    user_id: Optional[UUID] = None
    name: str
    avg_rating: float
    reviews_count: int
    pay_speed: PaySpeed
    badge: Optional[BrokerBadge]
    warning_count: int
    avg_rate_per_mile: float
    avg_payment_days: Optional[float] = None
    pay_speed_verified: bool = False
    mc_number: Optional[str] = None
    phone: Optional[str] = None
    logo: Optional[str] = None

    model_config = {"from_attributes": True}


class BrokerReviewCreate(BaseModel):
    rating: int
    comment: Optional[str] = None
    payment_days: Optional[int] = None
    communication: Optional[int] = None
    accuracy: Optional[int] = None
    would_work_again: Optional[bool] = None

    @field_validator("rating")
    @classmethod
    def rating_range(cls, v):
        if not 1 <= v <= 5:
            raise ValueError("Rating must be between 1 and 5")
        return v


class BrokerReviewOut(BaseModel):
    id: UUID
    broker_id: UUID
    carrier_id: Optional[UUID] = None
    carrier_name: Optional[str] = None
    rating: int
    comment: Optional[str]
    payment_days: Optional[int]
    is_anonymous: bool
    created_at: datetime
    communication: Optional[int] = None
    accuracy: Optional[int] = None
    would_work_again: Optional[bool] = None

    model_config = {"from_attributes": True}
