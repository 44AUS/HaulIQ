import uuid
from datetime import datetime
from sqlalchemy import Column, DateTime, ForeignKey, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base


class BrokerNetwork(Base):
    __tablename__ = "broker_network"

    id               = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    broker_id        = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    carrier_id       = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    status           = Column(String(10), nullable=False, default='pending')  # pending | accepted | declined
    initiated_by_id  = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    created_at       = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("broker_id", "carrier_id", name="uq_broker_carrier_network"),
    )

    broker       = relationship("User", foreign_keys=[broker_id])
    carrier      = relationship("User", foreign_keys=[carrier_id])
    initiated_by = relationship("User", foreign_keys=[initiated_by_id])
