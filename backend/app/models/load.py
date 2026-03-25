import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, Integer, Boolean, DateTime, Date, Text, ForeignKey, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base
import enum


class LoadType(str, enum.Enum):
    dry_van  = "Dry Van"
    reefer   = "Reefer"
    flatbed  = "Flatbed"
    step_deck = "Step Deck"
    lowboy   = "Lowboy"
    tanker   = "Tanker"
    box_truck = "Box Truck"


class ProfitScore(str, enum.Enum):
    green  = "green"
    yellow = "yellow"
    red    = "red"


class LoadStatus(str, enum.Enum):
    active  = "active"
    filled  = "filled"
    expired = "expired"
    removed = "removed"


class Load(Base):
    __tablename__ = "loads"

    id               = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    broker_id        = Column(UUID(as_uuid=True), ForeignKey("brokers.id"), nullable=False, index=True)
    broker_user_id   = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)

    # Route
    origin           = Column(String(255), nullable=False)
    origin_state     = Column(String(2), nullable=True)
    destination      = Column(String(255), nullable=False)
    dest_state       = Column(String(2), nullable=True)
    miles            = Column(Integer, nullable=False)
    deadhead_miles   = Column(Integer, default=0)

    # Full addresses (hidden from carriers until booked)
    pickup_address   = Column(Text, nullable=True)
    delivery_address = Column(Text, nullable=True)
    pickup_lat       = Column(Float, nullable=True)
    pickup_lng       = Column(Float, nullable=True)
    delivery_lat     = Column(Float, nullable=True)
    delivery_lng     = Column(Float, nullable=True)

    # Load details
    load_type        = Column(SAEnum(LoadType), nullable=False, default=LoadType.dry_van)
    weight_lbs       = Column(Integer, nullable=True)
    commodity        = Column(String(255), nullable=True)
    dimensions       = Column(String(50), nullable=True)      # e.g. "48x102"
    pickup_date      = Column(Date, nullable=False)
    delivery_date    = Column(Date, nullable=False)

    # Financials
    rate             = Column(Float, nullable=False)
    rate_per_mile    = Column(Float, nullable=True)           # computed
    fuel_cost_est    = Column(Float, nullable=True)           # computed
    net_profit_est   = Column(Float, nullable=True)           # computed
    profit_score     = Column(SAEnum(ProfitScore), nullable=True)  # computed

    # Market rate context
    market_rate_per_mile = Column(Float, nullable=True)
    is_above_market  = Column(Boolean, nullable=True)

    # Status
    status           = Column(SAEnum(LoadStatus), default=LoadStatus.active)
    is_hot           = Column(Boolean, default=False)
    instant_book     = Column(Boolean, default=False)   # carrier can book instantly, no approval
    book_now         = Column(Boolean, default=True)    # broker must approve booking request
    view_count       = Column(Integer, default=0)
    notes            = Column(Text, nullable=True)
    posted_at        = Column(DateTime, default=datetime.utcnow)
    updated_at       = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    broker           = relationship("Broker", back_populates="loads")
    broker_user      = relationship("User", back_populates="loads_posted")
    saved_by         = relationship("SavedLoad", back_populates="load", cascade="all, delete-orphan")
    history_entries  = relationship("LoadHistory", back_populates="load")

    def __repr__(self):
        return f"<Load {self.origin}→{self.destination} ${self.rate}>"


class SavedLoad(Base):
    __tablename__ = "saved_loads"

    id         = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    carrier_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    load_id    = Column(UUID(as_uuid=True), ForeignKey("loads.id"), nullable=False, index=True)
    saved_at   = Column(DateTime, default=datetime.utcnow)

    carrier    = relationship("User", back_populates="saved_loads")
    load       = relationship("Load", back_populates="saved_by")


class LoadView(Base):
    __tablename__ = "load_views"

    id        = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    load_id   = Column(UUID(as_uuid=True), ForeignKey("loads.id", ondelete="CASCADE"), nullable=False, index=True)
    viewer_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    viewed_at = Column(DateTime, default=datetime.utcnow)
