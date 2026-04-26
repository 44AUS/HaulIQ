import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, Integer, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from app.database import Base


class AppInfo(Base):
    __tablename__ = "app_info"

    id                = Column(Integer, primary_key=True, default=1)
    status            = Column(String(20), default='normal')  # normal, degraded, outage
    current_version   = Column(String(20), default='1.0.0')
    latest_version    = Column(String(20), default='1.0.0')
    release_video_url = Column(String, nullable=True)
    whats_new         = Column(JSONB, default=list)
    known_issues      = Column(JSONB, default=list)
    updated_at        = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class TutorialCategory(Base):
    __tablename__ = "tutorial_categories"

    id            = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name          = Column(String(100), nullable=False)
    thumbnail_url = Column(String, nullable=True)
    description   = Column(Text, nullable=True)
    order_idx     = Column(Integer, default=0)
    created_at    = Column(DateTime, default=datetime.utcnow)

    videos = relationship(
        "TutorialVideo",
        back_populates="category",
        cascade="all, delete-orphan",
        order_by="TutorialVideo.order_idx",
    )


class TutorialVideo(Base):
    __tablename__ = "tutorial_videos"

    id          = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    category_id = Column(UUID(as_uuid=True), ForeignKey("tutorial_categories.id", ondelete="CASCADE"), nullable=False)
    title       = Column(String(200), nullable=False)
    youtube_url = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    duration    = Column(String(20), nullable=True)
    order_idx   = Column(Integer, default=0)
    created_at  = Column(DateTime, default=datetime.utcnow)

    category = relationship("TutorialCategory", back_populates="videos")


class FeatureRequest(Base):
    __tablename__ = "feature_requests"

    id          = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id     = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title       = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    status      = Column(String(20), default='open')
    created_at  = Column(DateTime, default=datetime.utcnow)


class ReportedProblem(Base):
    __tablename__ = "reported_problems"

    id          = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id     = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title       = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    severity    = Column(String(20), default='normal')
    status      = Column(String(20), default='open')
    created_at  = Column(DateTime, default=datetime.utcnow)
