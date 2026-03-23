from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from app.database import get_db
from app.middleware.auth import get_current_user, require_carrier, require_broker
from app.models.user import User
from app.models.booking import Booking, BookingStatus
from app.models.load import Load, LoadStatus
from app.models.broker import Broker

router = APIRouter()


class BookNowRequest(BaseModel):
    load_id: UUID
    note: Optional[str] = None
    is_instant: bool = False


class ReviewBookingRequest(BaseModel):
    approved: bool
    broker_note: Optional[str] = None


class BookingOut(BaseModel):
    id: UUID
    load_id: UUID
    carrier_id: UUID
    carrier_name: Optional[str] = None
    carrier_mc: Optional[str] = None
    status: BookingStatus
    is_instant: str
    note: Optional[str]
    broker_note: Optional[str]
    created_at: datetime
    model_config = {"from_attributes": True}


@router.post("/", response_model=BookingOut)
def request_booking(
    payload: BookNowRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_carrier),
):
    load = db.query(Load).filter(Load.id == payload.load_id, Load.status == LoadStatus.active).first()
    if not load:
        raise HTTPException(status_code=404, detail="Load not found or no longer available")

    existing = db.query(Booking).filter(
        Booking.load_id == payload.load_id,
        Booking.carrier_id == current_user.id,
        Booking.status == BookingStatus.pending,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="You already have a pending booking request for this load.")

    is_instant = payload.is_instant or load.instant_book
    status = BookingStatus.approved if is_instant else BookingStatus.pending

    booking = Booking(
        load_id=payload.load_id,
        carrier_id=current_user.id,
        status=status,
        is_instant=str(is_instant).lower(),
        note=payload.note,
    )
    db.add(booking)

    if is_instant:
        load.status = LoadStatus.filled

    db.commit()
    db.refresh(booking)
    return booking


@router.get("/my", response_model=list[BookingOut])
def my_bookings(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_carrier),
):
    return db.query(Booking).filter(Booking.carrier_id == current_user.id).order_by(Booking.created_at.desc()).all()


@router.get("/pending", response_model=list[BookingOut])
def pending_bookings(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_broker),
):
    from app.models.load import Load
    broker_load_ids = [l.id for l in db.query(Load).filter(Load.broker_user_id == current_user.id).all()]
    bookings = (
        db.query(Booking)
        .filter(Booking.load_id.in_(broker_load_ids), Booking.status == BookingStatus.pending)
        .order_by(Booking.created_at.desc())
        .all()
    )
    result = []
    for b in bookings:
        carrier = db.query(User).filter(User.id == b.carrier_id).first()
        out = BookingOut.model_validate(b)
        if carrier:
            out.carrier_name = carrier.company or carrier.name
            out.carrier_mc = carrier.mc_number
        result.append(out)
    return result


@router.get("/in-progress", summary="Carrier: active bookings with load details")
def carrier_in_progress(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_carrier),
):
    bookings = (
        db.query(Booking)
        .filter(
            Booking.carrier_id == current_user.id,
            Booking.status.in_([BookingStatus.pending, BookingStatus.approved]),
        )
        .order_by(Booking.created_at.desc())
        .all()
    )
    result = []
    for bk in bookings:
        load = db.query(Load).filter(Load.id == bk.load_id).first()
        if not load:
            continue
        broker_name = load.broker.name if load.broker else None
        result.append({
            "id": str(load.id),
            "booking_id": str(bk.id),
            "status": "quoted" if bk.status == BookingStatus.pending else "booked",
            "load_type": load.load_type.value if load.load_type else None,
            "origin": load.origin,
            "destination": load.destination,
            "miles": load.miles,
            "pickup_date": str(load.pickup_date) if load.pickup_date else None,
            "delivery_date": str(load.delivery_date) if load.delivery_date else None,
            "rate": load.rate,
            "rate_per_mile": load.rate_per_mile,
            "net_profit_est": load.net_profit_est,
            "commodity": load.commodity,
            "weight_lbs": load.weight_lbs,
            "broker_name": broker_name,
            "note": bk.note,
        })
    return result


@router.get("/broker-active", summary="Broker: active+filled loads with carrier info")
def broker_active_loads(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_broker),
):
    loads = (
        db.query(Load)
        .filter(
            Load.broker_user_id == current_user.id,
            Load.status.in_([LoadStatus.active, LoadStatus.filled]),
        )
        .order_by(Load.posted_at.desc())
        .all()
    )
    result = []
    for load in loads:
        approved = (
            db.query(Booking)
            .filter(Booking.load_id == load.id, Booking.status == BookingStatus.approved)
            .first()
        )
        carrier_id = carrier_name = carrier_mc = None
        if approved:
            carrier = db.query(User).filter(User.id == approved.carrier_id).first()
            if carrier:
                carrier_id = str(carrier.id)
                carrier_name = carrier.company or carrier.name
                carrier_mc = carrier.mc_number
        status = "booked" if load.status == LoadStatus.filled and approved else "available"
        result.append({
            "id": str(load.id),
            "status": status,
            "load_type": load.load_type.value if load.load_type else None,
            "origin": load.origin,
            "destination": load.destination,
            "miles": load.miles,
            "pickup_date": str(load.pickup_date) if load.pickup_date else None,
            "delivery_date": str(load.delivery_date) if load.delivery_date else None,
            "rate": load.rate,
            "rate_per_mile": load.rate_per_mile,
            "commodity": load.commodity,
            "weight_lbs": load.weight_lbs,
            "carrier_id": carrier_id,
            "carrier_name": carrier_name,
            "carrier_mc": carrier_mc,
        })
    return result


@router.patch("/{booking_id}/review", response_model=BookingOut)
def review_booking(
    booking_id: UUID,
    payload: ReviewBookingRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_broker),
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    booking.status = BookingStatus.approved if payload.approved else BookingStatus.denied
    booking.broker_note = payload.broker_note

    if payload.approved:
        load = db.query(Load).filter(Load.id == booking.load_id).first()
        if load:
            load.status = LoadStatus.filled

    db.commit()
    db.refresh(booking)
    return booking
