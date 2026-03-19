from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID
from datetime import datetime, date
from app.models.analytics import InsightType


class LoadHistoryOut(BaseModel):
    id: UUID
    origin: str
    destination: str
    lane_key: Optional[str]
    miles: int
    deadhead_miles: int
    load_type: Optional[str]
    broker_name: Optional[str]
    gross_revenue: float
    fuel_cost: Optional[float]
    net_profit: float
    rate_per_mile: Optional[float]
    net_per_mile: Optional[float]
    accepted_at: datetime
    pickup_date: Optional[date]
    delivery_date: Optional[date]

    model_config = {"from_attributes": True}


class InsightOut(BaseModel):
    id: UUID
    insight_type: InsightType
    icon: Optional[str]
    title: str
    body: str
    tag: Optional[str]
    action_label: Optional[str]
    is_read: bool
    generated_at: datetime

    model_config = {"from_attributes": True}


class LaneStatsOut(BaseModel):
    lane_key: str
    display_label: Optional[str]
    run_count: int
    avg_net_profit: float
    avg_rate_per_mile: float
    profitability_pct: float

    model_config = {"from_attributes": True}


class WeeklyEarning(BaseModel):
    week_label: str
    gross: float
    net: float
    miles: int
    load_count: int


class EarningsSummary(BaseModel):
    total_gross: float
    total_net: float
    total_miles: int
    total_loads: int
    avg_rate_per_mile: float
    avg_net_per_mile: float
    avg_deadhead_miles: float
    best_lane: Optional[str]
    weekly_earnings: List[WeeklyEarning]
    lane_stats: List[LaneStatsOut]
