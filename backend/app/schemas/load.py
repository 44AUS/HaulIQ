from pydantic import BaseModel, field_validator
from typing import Optional, List
from uuid import UUID
from datetime import date, datetime
from app.models.load import LoadType, ProfitScore, LoadStatus
from app.schemas.broker import BrokerOut


class LoadCreate(BaseModel):
    origin: str
    origin_state: Optional[str] = None
    destination: str
    dest_state: Optional[str] = None
    miles: int
    deadhead_miles: int = 0
    load_type: LoadType = LoadType.dry_van
    weight_lbs: Optional[int] = None
    commodity: Optional[str] = None
    dimensions: Optional[str] = "48x102"
    pickup_date: date
    delivery_date: date
    rate: float
    notes: Optional[str] = None

    @field_validator("rate")
    @classmethod
    def rate_positive(cls, v):
        if v <= 0:
            raise ValueError("Rate must be positive")
        return v

    @field_validator("miles")
    @classmethod
    def miles_positive(cls, v):
        if v <= 0:
            raise ValueError("Miles must be positive")
        return v


class LoadOut(BaseModel):
    id: UUID
    origin: str
    origin_state: Optional[str]
    destination: str
    dest_state: Optional[str]
    miles: int
    deadhead_miles: int
    load_type: LoadType
    weight_lbs: Optional[int]
    commodity: Optional[str]
    dimensions: Optional[str]
    pickup_date: date
    delivery_date: date
    rate: float
    rate_per_mile: Optional[float]
    fuel_cost_est: Optional[float]
    net_profit_est: Optional[float]
    profit_score: Optional[ProfitScore]
    market_rate_per_mile: Optional[float]
    is_above_market: Optional[bool]
    status: LoadStatus
    is_hot: bool
    view_count: int
    notes: Optional[str]
    posted_at: datetime
    broker: Optional[BrokerOut] = None

    model_config = {"from_attributes": True}


class LoadListOut(BaseModel):
    loads: List[LoadOut]
    total: int
    page: int
    per_page: int
    total_pages: int


class LoadFilters(BaseModel):
    search: Optional[str] = None
    load_type: Optional[LoadType] = None
    profit_score: Optional[ProfitScore] = None
    hot_only: bool = False
    min_rate: Optional[float] = None
    max_deadhead: Optional[int] = None
    origin_state: Optional[str] = None
    dest_state: Optional[str] = None
    sort_by: str = "profit"   # profit | rate_per_mile | recent | miles
    page: int = 1
    per_page: int = 20
