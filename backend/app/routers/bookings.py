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
    # Return pending bookings for loads posted by this broker
    from app.models.load import Load
    broker_load_ids = [l.id for l in db.query(Load).filter(Load.broker_user_id == current_user.id).all()]
    return (
        db.query(Booking)
        .filter(Booking.load_id.in_(broker_load_ids), Booking.status == BookingStatus.pending)
        .order_by(Booking.created_at.desc())
        .all()
    )


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
