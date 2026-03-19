from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from uuid import UUID
from typing import Optional
from datetime import datetime
from pydantic import BaseModel, field_validator

from app.database import get_db
from app.middleware.auth import get_current_user, require_broker
from app.models.user import User, UserRole
from app.models.carrier_review import CarrierReview

router = APIRouter()


class CarrierReviewCreate(BaseModel):
    carrier_id: UUID
    load_id: Optional[UUID] = None
    rating: int
    communication: Optional[int] = None
    on_time_pickup: Optional[int] = None
    on_time_delivery: Optional[int] = None
    load_care: Optional[int] = None
    would_work_again: Optional[bool] = None
    comment: Optional[str] = None
    is_anonymous: bool = False

    @field_validator("rating", "communication", "on_time_pickup", "on_time_delivery", "load_care")
    @classmethod
    def rating_range(cls, v):
        if v is not None and not 1 <= v <= 5:
            raise ValueError("Rating must be between 1 and 5")
        return v


class CarrierReviewOut(BaseModel):
    id: UUID
    carrier_id: UUID
    broker_id: UUID
    load_id: Optional[UUID]
    rating: int
    communication: Optional[int]
    on_time_pickup: Optional[int]
    on_time_delivery: Optional[int]
    load_care: Optional[int]
    would_work_again: Optional[bool]
    comment: Optional[str]
    is_anonymous: bool
    created_at: datetime
    model_config = {"from_attributes": True}


class CarrierStatsOut(BaseModel):
    carrier_id: UUID
    name: str
    company: Optional[str]
    mc_number: Optional[str]
    avg_rating: float
    reviews_count: int
    avg_communication: Optional[float]
    avg_on_time_pickup: Optional[float]
    avg_on_time_delivery: Optional[float]
    avg_load_care: Optional[float]
    would_work_again_pct: Optional[float]


def _calc_avg(values):
    vals = [v for v in values if v is not None]
    return round(sum(vals) / len(vals), 1) if vals else None


@router.post("/", response_model=CarrierReviewOut, status_code=201)
def submit_carrier_review(
    payload: CarrierReviewCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_broker),
):
    carrier = db.query(User).filter(User.id == payload.carrier_id, User.role == UserRole.carrier).first()
    if not carrier:
        raise HTTPException(status_code=404, detail="Carrier not found")

    existing = db.query(CarrierReview).filter(
        CarrierReview.carrier_id == payload.carrier_id,
        CarrierReview.broker_id == current_user.id,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="You have already reviewed this carrier.")

    review = CarrierReview(
        carrier_id=payload.carrier_id,
        broker_id=current_user.id,
        load_id=payload.load_id,
        rating=payload.rating,
        communication=payload.communication,
        on_time_pickup=payload.on_time_pickup,
        on_time_delivery=payload.on_time_delivery,
        load_care=payload.load_care,
        would_work_again=payload.would_work_again,
        comment=payload.comment,
        is_anonymous=payload.is_anonymous,
    )
    db.add(review)
    db.commit()
    db.refresh(review)
    return review


@router.get("/carrier/{carrier_id}", response_model=list[CarrierReviewOut])
def get_carrier_reviews(
    carrier_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(CarrierReview)
        .filter(CarrierReview.carrier_id == carrier_id)
        .order_by(desc(CarrierReview.created_at))
        .limit(50)
        .all()
    )


@router.get("/carrier/{carrier_id}/stats", response_model=CarrierStatsOut)
def get_carrier_stats(
    carrier_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    carrier = db.query(User).filter(User.id == carrier_id).first()
    if not carrier:
        raise HTTPException(status_code=404, detail="Carrier not found")

    reviews = db.query(CarrierReview).filter(CarrierReview.carrier_id == carrier_id).all()
    if not reviews:
        return CarrierStatsOut(
            carrier_id=carrier_id, name=carrier.name,
            company=carrier.company, mc_number=carrier.mc_number,
            avg_rating=0.0, reviews_count=0,
            avg_communication=None, avg_on_time_pickup=None,
            avg_on_time_delivery=None, avg_load_care=None,
            would_work_again_pct=None,
        )

    wwa = [r.would_work_again for r in reviews if r.would_work_again is not None]
    return CarrierStatsOut(
        carrier_id=carrier_id,
        name=carrier.name,
        company=carrier.company,
        mc_number=carrier.mc_number,
        avg_rating=_calc_avg([r.rating for r in reviews]),
        reviews_count=len(reviews),
        avg_communication=_calc_avg([r.communication for r in reviews]),
        avg_on_time_pickup=_calc_avg([r.on_time_pickup for r in reviews]),
        avg_on_time_delivery=_calc_avg([r.on_time_delivery for r in reviews]),
        avg_load_care=_calc_avg([r.load_care for r in reviews]),
        would_work_again_pct=round(sum(wwa) / len(wwa) * 100) if wwa else None,
    )
