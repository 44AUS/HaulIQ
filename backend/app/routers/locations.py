from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Optional

from app.database import get_db
from app.middleware.auth import get_current_user, require_carrier
from app.models.user import User
from app.models.booking import Booking, BookingStatus
from app.models.location import CarrierLocation
from app.models.load import Load

router = APIRouter()


class LocationUpdate(BaseModel):
    lat: float
    lng: float
    accuracy: Optional[float] = None


@router.post("/{booking_id}")
def update_location(
    booking_id: UUID,
    payload: LocationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_carrier),
):
    booking = db.query(Booking).filter(
        Booking.id == booking_id,
        Booking.carrier_id == current_user.id,
        Booking.status == BookingStatus.in_transit,
    ).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Active booking not found")

    loc = db.query(CarrierLocation).filter(CarrierLocation.booking_id == booking_id).first()
    if loc:
        loc.lat = payload.lat
        loc.lng = payload.lng
        loc.accuracy = payload.accuracy
        loc.updated_at = datetime.utcnow()
    else:
        loc = CarrierLocation(
            booking_id=booking_id,
            carrier_id=current_user.id,
            lat=payload.lat,
            lng=payload.lng,
            accuracy=payload.accuracy,
        )
        db.add(loc)
    db.commit()
    return {"ok": True}


@router.get("/{booking_id}")
def get_location(
    booking_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Carrier can see their own; broker can see if it's their load
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    if booking.carrier_id != current_user.id:
        load = db.query(Load).filter(Load.id == booking.load_id).first()
        if not load or load.broker_user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Forbidden")

    loc = db.query(CarrierLocation).filter(CarrierLocation.booking_id == booking_id).first()
    if not loc:
        return {"available": False}

    return {
        "available": True,
        "lat": loc.lat,
        "lng": loc.lng,
        "accuracy": loc.accuracy,
        "updated_at": loc.updated_at.isoformat(),
    }


@router.delete("/{booking_id}")
def clear_location(
    booking_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_carrier),
):
    loc = db.query(CarrierLocation).filter(
        CarrierLocation.booking_id == booking_id,
        CarrierLocation.carrier_id == current_user.id,
    ).first()
    if loc:
        db.delete(loc)
        db.commit()
    return {"ok": True}
