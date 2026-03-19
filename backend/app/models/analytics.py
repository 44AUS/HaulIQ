import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, Integer, DateTime, Date, ForeignKey, Enum as SAEnum, Text, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base
import enum


class InsightType(str, enum.Enum):
    lane     = "lane"
    broker   = "broker"
    timing   = "timing"
    pattern  = "pattern"
    deadhead = "deadhead"
    market   = "market"


class LoadHistory(Base):
    """Completed loads — source of truth for Earnings Brain."""
    __tablename__ = "load_history"

    id           = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    carrier_id   = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    load_id      = Column(UUID(as_uuid=True), ForeignKey("loads.id"), nullable=True)

    # Route (denormalized for fast analytics queries)
    origin       = Column(String(255), nullable=False)
    origin_state = Column(String(2), nullable=True)
    destination  = Column(String(255), nullable=False)
    dest_state   = Column(String(2), nullable=True)
    lane_key     = Column(String(20), nullable=True, index=True)  # e.g. "IL_GA"
    miles        = Column(Integer, nullable=False)
    deadhead_miles = Column(Integer, default=0)
    load_type    = Column(String(50), nullable=True)
    broker_name  = Column(String(255), nullable=True)

    # Financials
    gross_revenue = Column(Float, nullable=False)
    fuel_cost     = Column(Float, nullable=True)
    other_costs   = Column(Float, default=0.0)
    net_profit    = Column(Float, nullable=False)
    rate_per_mile = Column(Float, nullable=True)
    net_per_mile  = Column(Float, nullable=True)

    # Timing
    accepted_at   = Column(DateTime, default=datetime.utcnow)
    pickup_date   = Column(Date, nullable=True)
    delivery_date = Column(Date, nullable=True)

    # Relationships
    carrier       = relationship("User", back_populates="load_history")
    load          = relationship("Load", back_populates="history_entries")

    def __repr__(self):
        return f"<LoadHistory {self.origin}→{self.destination} net=${self.net_profit}>"


class DriverInsight(Base):
    """AI-generated insights from the Earnings Brain."""
    __tablename__ = "driver_insights"

    id          = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    carrier_id  = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    insight_type = Column(SAEnum(InsightType), nullable=False)
    icon        = Column(String(10), nullable=True)
    title       = Column(String(255), nullable=False)
    body        = Column(Text, nullable=False)
    tag         = Column(String(50), nullable=True)
    action_label = Column(String(100), nullable=True)
    is_read     = Column(Boolean, default=False)
    generated_at = Column(DateTime, default=datetime.utcnow)

    carrier     = relationship("User", back_populates="insights")


class LaneStats(Base):
    """Aggregated per-carrier lane performance (refreshed by Earnings Brain)."""
    __tablename__ = "lane_stats"

    id              = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    carrier_id      = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    lane_key        = Column(String(20), nullable=False, index=True)
    origin_state    = Column(String(2), nullable=True)
    dest_state      = Column(String(2), nullable=True)
    display_label   = Column(String(50), nullable=True)   # e.g. "CHI→ATL"
    run_count       = Column(Integer, default=0)
    avg_net_profit  = Column(Float, default=0.0)
    avg_rate_per_mile = Column(Float, default=0.0)
    profitability_pct = Column(Float, default=0.0)        # % of runs that were profitable
    last_run_at     = Column(DateTime, nullable=True)
    updated_at      = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
