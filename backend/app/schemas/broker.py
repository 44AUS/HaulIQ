from pydantic import BaseModel, field_validator
from typing import Optional
from uuid import UUID
from datetime import datetime
from app.models.broker import BrokerBadge, PaySpeed


class BrokerOut(BaseModel):
    id: UUID
    name: str
    avg_rating: float
    reviews_count: int
    pay_speed: PaySpeed
    badge: Optional[BrokerBadge]
    warning_count: int
    avg_rate_per_mile: float

    model_config = {"from_attributes": True}


class BrokerReviewCreate(BaseModel):
    broker_id: UUID
    rating: int
    comment: Optional[str] = None
    payment_days: Optional[int] = None
    is_anonymous: bool = False

    @field_validator("rating")
    @classmethod
    def rating_range(cls, v):
        if not 1 <= v <= 5:
            raise ValueError("Rating must be between 1 and 5")
        return v


class BrokerReviewOut(BaseModel):
    id: UUID
    broker_id: UUID
    rating: int
    comment: Optional[str]
    payment_days: Optional[int]
    is_anonymous: bool
    created_at: datetime

    model_config = {"from_attributes": True}
