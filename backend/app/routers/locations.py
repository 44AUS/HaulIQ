import json
import httpx
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Optional

from app.database import get_db
from app.middleware.auth import get_current_user, require_carrier, require_broker
from app.models.user import User
from app.models.booking import Booking, BookingStatus
from app.models.location import CarrierLocation
from app.models.load import Load
from app.models.messaging import Conversation, Message

router = APIRouter()


# ─── Helpers ──────────────────────────────────────────────────────────────────

async def _reverse_geocode(lat: float, lng: float) -> str:
    try:
        url = f"https://nominatim.openstreetmap.org/reverse?lat={lat}&lon={lng}&format=json"
        async with httpx.AsyncClient(timeout=5) as client:
            resp = await client.get(url, headers={"User-Agent": "HaulIQ/1.0"})
        addr = resp.json().get("address", {})
        city  = addr.get("city") or addr.get("town") or addr.get("village") or addr.get("county") or ""
        state = addr.get("state") or ""
        if city and state:
            return f"{city}, {state}"
        return resp.json().get("display_name", "Unknown location").split(",")[0]
    except Exception:
        return "Unknown location"


def _get_or_create_convo(db, load, carrier_id, broker_user_id):
    convo = db.query(Conversation).filter(
        Conversation.load_id == load.id,
        Conversation.carrier_id == carrier_id,
        Conversation.broker_id == broker_user_id,
    ).first()
    if not convo:
        convo = Conversation(
            load_id=load.id,
            carrier_id=carrier_id,
            broker_id=broker_user_id,
        )
        db.add(convo)
        db.flush()
    return convo


def _make_msg(convo_id, sender_id, payload: dict) -> Message:
    return Message(
        conversation_id=convo_id,
        sender_id=sender_id,
        body=json.dumps(payload),
        is_read=False,
    )


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.post("/request/{booking_id}", summary="Broker: send location request to carrier")
def request_location(
    booking_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_broker),
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    load = db.query(Load).filter(Load.id == booking.load_id).first()
    if not load or load.broker_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")

    broker_name = current_user.company or current_user.name
    convo = _get_or_create_convo(db, load, booking.carrier_id, current_user.id)

    msg = _make_msg(convo.id, current_user.id, {
        "__type": "location_request",
        "booking_id": str(booking_id),
        "requester_name": broker_name,
        "requested_at": datetime.utcnow().isoformat(),
    })
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return {"ok": True, "conversation_id": str(convo.id)}


class SharePayload(BaseModel):
    lat: float
    lng: float
    accuracy: Optional[float] = None


@router.post("/share/{booking_id}", summary="Carrier: share current location")
async def share_location(
    booking_id: UUID,
    payload: SharePayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_carrier),
):
    booking = db.query(Booking).filter(
        Booking.id == booking_id,
        Booking.carrier_id == current_user.id,
    ).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    load = db.query(Load).filter(Load.id == booking.load_id).first()
    if not load:
        raise HTTPException(status_code=404, detail="Load not found")

    city = await _reverse_geocode(payload.lat, payload.lng)
    carrier_name = current_user.company or current_user.name

    # Save / update the location record
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

    # Send location share message into the conversation
    convo = _get_or_create_convo(db, load, current_user.id, load.broker_user_id)
    msg = _make_msg(convo.id, current_user.id, {
        "__type": "location_share",
        "booking_id": str(booking_id),
        "carrier_name": carrier_name,
        "lat": payload.lat,
        "lng": payload.lng,
        "accuracy": payload.accuracy,
        "city": city,
        "shared_at": datetime.utcnow().isoformat(),
    })
    db.add(msg)
    db.commit()

    return {"ok": True, "city": city, "conversation_id": str(convo.id)}


@router.get("/{booking_id}", summary="Get latest stored location for a booking")
def get_location(
    booking_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
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
