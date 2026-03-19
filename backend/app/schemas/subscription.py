from pydantic import BaseModel
from typing import Optional, List, Any, Dict
from uuid import UUID
from datetime import datetime
from app.models.subscription import PlanRole, PlanTier, SubStatus


class PlanOut(BaseModel):
    id: UUID
    name: str
    role: PlanRole
    tier: PlanTier
    price: float
    description: Optional[str]
    features: List[str]
    limits: Dict[str, Any]
    is_active: bool

    model_config = {"from_attributes": True}


class SubscriptionOut(BaseModel):
    id: UUID
    user_id: UUID
    plan: PlanOut
    status: SubStatus
    current_period_start: datetime
    current_period_end: Optional[datetime]
    created_at: datetime

    model_config = {"from_attributes": True}


class ChangePlanRequest(BaseModel):
    plan_id: UUID
