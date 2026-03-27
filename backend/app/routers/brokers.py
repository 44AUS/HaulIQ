from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, cast, String as SAString
from typing import Optional
from uuid import UUID

from app.database import get_db
from app.models.broker import Broker, BrokerReview
from app.models.user import User
from app.schemas.broker import BrokerOut, BrokerReviewCreate, BrokerReviewOut
from app.middleware.auth import get_current_user, require_carrier

router = APIRouter()


@router.get("", response_model=list[BrokerOut], summary="List all brokers")
def list_brokers(
    search: Optional[str] = Query(None),
    min_rating: Optional[float] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(Broker).filter(Broker.is_active == True)
    if search:
        q = q.filter(Broker.name.ilike(f"%{search}%"))
    if min_rating:
        q = q.filter(Broker.avg_rating >= min_rating)
    return q.order_by(desc(Broker.avg_rating)).all()


@router.get("/warnings", response_model=list[BrokerOut],
            summary="Get brokers with active warning flags")
def flagged_brokers(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(Broker)
        .filter(Broker.warning_count > 0, Broker.is_active == True)
        .order_by(desc(Broker.warning_count))
        .all()
    )


def _get_broker_or_404(broker_id: str, db: Session) -> Broker:
    """Look up broker by full UUID, 8-char user_id prefix, or broker profile id."""
    # Try full UUID first
    try:
        uid = UUID(broker_id)
        broker = db.query(Broker).filter(
            (Broker.id == uid) | (Broker.user_id == uid)
        ).first()
        if broker:
            return broker
    except ValueError:
        pass
    # Fall back to 8-char prefix match on user_id
    broker = db.query(Broker).join(User, User.id == Broker.user_id).filter(
        cast(User.id, SAString).like(f"{broker_id}%")
    ).first()
    if not broker:
        raise HTTPException(status_code=404, detail="Broker not found")
    return broker


@router.get("/{broker_id}", response_model=BrokerOut, summary="Get broker profile")
def get_broker(
    broker_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return _get_broker_or_404(broker_id, db)


@router.get("/{broker_id}/reviews", response_model=list[BrokerReviewOut],
            summary="Get reviews for a broker")
def get_broker_reviews(
    broker_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    broker = _get_broker_or_404(broker_id, db)
    return (
        db.query(BrokerReview)
        .filter(BrokerReview.broker_id == broker.id)
        .order_by(desc(BrokerReview.created_at))
        .limit(50)
        .all()
    )


@router.post("/{broker_id}/reviews", response_model=BrokerReviewOut,
             status_code=201, summary="Submit a broker review (carriers only)")
def submit_review(
    broker_id: UUID,
    payload: BrokerReviewCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_carrier),
):
    broker = db.query(Broker).filter(Broker.id == broker_id).first()
    if not broker:
        raise HTTPException(status_code=404, detail="Broker not found")

    # One review per carrier per broker
    existing = db.query(BrokerReview).filter(
        BrokerReview.broker_id == broker_id,
        BrokerReview.carrier_id == current_user.id,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="You have already reviewed this broker.")

    review = BrokerReview(
        broker_id=broker_id,
        carrier_id=current_user.id,
        rating=payload.rating,
        comment=payload.comment,
        payment_days=payload.payment_days,
        communication=payload.communication,
        accuracy=payload.accuracy,
        would_work_again=payload.would_work_again,
        is_anonymous=payload.is_anonymous,
    )
    db.add(review)

    # Recalculate broker avg rating
    all_reviews = db.query(BrokerReview).filter(BrokerReview.broker_id == broker_id).all()
    new_ratings = [r.rating for r in all_reviews] + [payload.rating]
    broker.avg_rating    = round(sum(new_ratings) / len(new_ratings), 1)
    broker.reviews_count = len(new_ratings)

    # Recalculate avg payment days from reviews that include payment_days
    payment_reports = [r.payment_days for r in all_reviews if r.payment_days]
    if payload.payment_days:
        payment_reports.append(payload.payment_days)
    if payment_reports:
        broker.avg_payment_days = round(sum(payment_reports) / len(payment_reports), 1)
        broker.pay_speed_verified = len(payment_reports) >= 5

    # Auto-flag broker if avg drops below 2.5
    if broker.avg_rating < 2.5:
        from app.models.broker import BrokerBadge
        broker.badge = BrokerBadge.warning

    db.commit()
    db.refresh(review)
    return review
