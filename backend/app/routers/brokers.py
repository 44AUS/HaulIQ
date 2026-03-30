from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, cast, String as SAString
from typing import Optional
from uuid import UUID

from app.database import get_db
from app.models.broker import Broker, BrokerReview
from app.models.user import User
from app.models.booking import Booking, BookingStatus
from app.models.load import Load
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
    reviews = (
        db.query(BrokerReview)
        .filter(BrokerReview.broker_id == broker.id)
        .order_by(desc(BrokerReview.created_at))
        .limit(50)
        .all()
    )
    result = []
    for r in reviews:
        carrier = db.query(User).filter(User.id == r.carrier_id).first()
        result.append(BrokerReviewOut(
            id=r.id,
            broker_id=r.broker_id,
            carrier_id=r.carrier_id,
            carrier_name=carrier.company or carrier.name if carrier else None,
            rating=r.rating,
            comment=r.comment,
            payment_days=r.payment_days,
            is_anonymous=r.is_anonymous,
            created_at=r.created_at,
            communication=r.communication,
            accuracy=r.accuracy,
            would_work_again=r.would_work_again,
        ))
    return result


def _has_completed_load_with_broker(carrier_id, broker_user_id, db: Session) -> bool:
    """Check if this carrier has at least one completed booking on a load posted by this broker."""
    return db.query(Booking).join(Load, Booking.load_id == Load.id).filter(
        Booking.carrier_id == carrier_id,
        Load.broker_user_id == broker_user_id,
        Booking.status == BookingStatus.completed,
    ).first() is not None


@router.get("/{broker_id}/can-review", summary="Check if the current carrier can review this broker")
def can_review(
    broker_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_carrier),
):
    broker = _get_broker_or_404(broker_id, db)

    already_reviewed = db.query(BrokerReview).filter(
        BrokerReview.broker_id == broker.id,
        BrokerReview.carrier_id == current_user.id,
    ).first() is not None

    if already_reviewed:
        return {"can_review": False, "reason": "You have already reviewed this broker."}

    if not _has_completed_load_with_broker(current_user.id, broker.user_id, db):
        return {"can_review": False, "reason": "You can only review brokers after completing a load for them."}

    return {"can_review": True, "reason": None}


@router.post("/{broker_id}/reviews", response_model=BrokerReviewOut,
             status_code=201, summary="Submit a broker review (carriers only)")
def submit_review(
    broker_id: str,
    payload: BrokerReviewCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_carrier),
):
    broker = _get_broker_or_404(broker_id, db)

    # One review per carrier per broker
    existing = db.query(BrokerReview).filter(
        BrokerReview.broker_id == broker.id,
        BrokerReview.carrier_id == current_user.id,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="You have already reviewed this broker.")

    # Must have completed a load with this broker
    if not _has_completed_load_with_broker(current_user.id, broker.user_id, db):
        raise HTTPException(status_code=403, detail="You can only review brokers after completing a load for them.")

    review = BrokerReview(
        broker_id=broker.id,
        carrier_id=current_user.id,
        rating=payload.rating,
        comment=payload.comment,
        payment_days=payload.payment_days,
        communication=payload.communication,
        accuracy=payload.accuracy,
        would_work_again=payload.would_work_again,
        is_anonymous=False,
    )
    db.add(review)

    # Recalculate broker avg rating
    all_reviews = db.query(BrokerReview).filter(BrokerReview.broker_id == broker.id).all()
    new_ratings = [r.rating for r in all_reviews] + [payload.rating]
    broker.avg_rating    = round(sum(new_ratings) / len(new_ratings), 1)
    broker.reviews_count = len(new_ratings)

    # Recalculate avg payment days
    payment_reports = [r.payment_days for r in all_reviews if r.payment_days]
    if payload.payment_days:
        payment_reports.append(payload.payment_days)
    if payment_reports:
        broker.avg_payment_days = round(sum(payment_reports) / len(payment_reports), 1)
        broker.pay_speed_verified = len(payment_reports) >= 5

    if broker.avg_rating < 2.5:
        from app.models.broker import BrokerBadge
        broker.badge = BrokerBadge.warning

    db.commit()
    db.refresh(review)

    # Build response with carrier name
    out = BrokerReviewOut(
        id=review.id,
        broker_id=review.broker_id,
        carrier_id=review.carrier_id,
        carrier_name=current_user.company or current_user.name,
        rating=review.rating,
        comment=review.comment,
        payment_days=review.payment_days,
        is_anonymous=False,
        created_at=review.created_at,
        communication=review.communication,
        accuracy=review.accuracy,
        would_work_again=review.would_work_again,
    )
    return out
