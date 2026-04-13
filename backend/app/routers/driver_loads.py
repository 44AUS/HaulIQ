"""Driver-scoped endpoints — viewing and updating assigned loads, location pings, earnings."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime

from app.database import get_db
from app.models.user import User, UserRole
from app.models.booking import Booking, TMSStatus
from app.models.driver_location import DriverLocation
from app.middleware.auth import get_current_user

router = APIRouter()


def _require_driver(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != UserRole.driver:
        raise HTTPException(403, "Driver access only")
    return current_user


class LocationPingIn(BaseModel):
    lat: float
    lng: float
    heading: Optional[float] = None
    speed_mph: Optional[float] = None
    booking_id: Optional[UUID] = None


class StatusUpdateIn(BaseModel):
    status: str  # dispatched | picked_up | in_transit | delivered


# ── Loads ─────────────────────────────────────────────────────────────────────

@router.get("/loads")
def get_my_loads(driver: User = Depends(_require_driver), db: Session = Depends(get_db)):
    from app.models.load import Load
    bookings = (
        db.query(Booking)
        .filter(Booking.assigned_driver_id == driver.id)
        .order_by(Booking.created_at.desc())
        .all()
    )
    result = []
    for bk in bookings:
        load = db.query(Load).filter(Load.id == bk.load_id).first()
        result.append({
            "id": str(bk.id),
            "load_id": str(bk.load_id),
            "status": bk.status.value,
            "tms_status": bk.tms_status.value if bk.tms_status else None,
            "driver_pay": bk.driver_pay,
            "driver_pay_status": bk.driver_pay_status,
            "carrier_visible_notes": bk.carrier_visible_notes,
            "created_at": bk.created_at.isoformat() if bk.created_at else None,
            "origin": load.origin if load else None,
            "destination": load.destination if load else None,
            "pickup_date": load.pickup_date.isoformat() if load and load.pickup_date else None,
            "delivery_date": load.delivery_date.isoformat() if load and load.delivery_date else None,
            "commodity": load.commodity if load else None,
            "miles": load.miles if load else None,
        })
    return result


@router.get("/loads/{booking_id}")
def get_load_detail(
    booking_id: UUID,
    driver: User = Depends(_require_driver),
    db: Session = Depends(get_db),
):
    from app.models.load import Load
    bk = db.query(Booking).filter(
        Booking.id == booking_id,
        Booking.assigned_driver_id == driver.id,
    ).first()
    if not bk:
        raise HTTPException(404, "Load not found")

    load = db.query(Load).filter(Load.id == bk.load_id).first()
    return {
        "id": str(bk.id),
        "load_id": str(bk.load_id),
        "status": bk.status.value,
        "tms_status": bk.tms_status.value if bk.tms_status else None,
        "driver_pay": bk.driver_pay,
        "driver_pay_status": bk.driver_pay_status,
        "carrier_visible_notes": bk.carrier_visible_notes,
        "dispatched_at":   bk.dispatched_at.isoformat()   if bk.dispatched_at   else None,
        "picked_up_at":    bk.picked_up_at.isoformat()    if bk.picked_up_at    else None,
        "in_transit_at":   bk.in_transit_at.isoformat()   if bk.in_transit_at   else None,
        "delivered_at":    bk.delivered_at.isoformat()    if bk.delivered_at    else None,
        "pod_received_at": bk.pod_received_at.isoformat() if bk.pod_received_at else None,
        "load": {
            "origin":           load.origin           if load else None,
            "destination":      load.destination      if load else None,
            "pickup_address":   load.pickup_address   if load else None,
            "delivery_address": load.delivery_address if load else None,
            "pickup_date":      load.pickup_date.isoformat()    if load and load.pickup_date    else None,
            "delivery_date":    load.delivery_date.isoformat()  if load and load.delivery_date  else None,
            "commodity":        load.commodity        if load else None,
            "miles":            load.miles            if load else None,
            "weight_lbs":       load.weight_lbs       if load else None,
            "load_type":        load.load_type.value  if load and load.load_type else None,
            "rate":             load.rate             if load else None,
        } if load else None,
    }


@router.post("/loads/{booking_id}/status")
def update_status(
    booking_id: UUID,
    payload: StatusUpdateIn,
    driver: User = Depends(_require_driver),
    db: Session = Depends(get_db),
):
    bk = db.query(Booking).filter(
        Booking.id == booking_id,
        Booking.assigned_driver_id == driver.id,
    ).first()
    if not bk:
        raise HTTPException(404, "Load not found")

    STATUS_MAP = {
        "dispatched": TMSStatus.dispatched,
        "picked_up":  TMSStatus.picked_up,
        "in_transit": TMSStatus.in_transit,
        "delivered":  TMSStatus.delivered,
    }
    if payload.status not in STATUS_MAP:
        raise HTTPException(400, f"Invalid status. Valid values: {list(STATUS_MAP.keys())}")

    bk.tms_status = STATUS_MAP[payload.status]
    now = datetime.utcnow()
    if payload.status == "dispatched"  and not bk.dispatched_at:  bk.dispatched_at  = now
    if payload.status == "picked_up"   and not bk.picked_up_at:   bk.picked_up_at   = now
    if payload.status == "in_transit"  and not bk.in_transit_at:  bk.in_transit_at  = now
    if payload.status == "delivered"   and not bk.delivered_at:
        bk.delivered_at = now
        # Move driver pay to pending once delivered
        if bk.driver_pay and bk.driver_pay_status == "unpaid":
            bk.driver_pay_status = "pending"

    db.commit()
    return {"ok": True, "tms_status": bk.tms_status.value}


# ── Location ping ─────────────────────────────────────────────────────────────

@router.post("/location")
def ping_location(
    payload: LocationPingIn,
    driver: User = Depends(_require_driver),
    db: Session = Depends(get_db),
):
    loc = DriverLocation(
        driver_id=driver.id,
        booking_id=payload.booking_id,
        lat=payload.lat,
        lng=payload.lng,
        heading=payload.heading,
        speed_mph=payload.speed_mph,
    )
    db.add(loc)
    db.commit()
    return {"ok": True}


# ── Earnings ──────────────────────────────────────────────────────────────────

@router.get("/earnings")
def get_earnings(driver: User = Depends(_require_driver), db: Session = Depends(get_db)):
    from app.models.load import Load
    bookings = (
        db.query(Booking)
        .filter(Booking.assigned_driver_id == driver.id)
        .order_by(Booking.created_at.desc())
        .all()
    )
    paid    = sum(b.driver_pay for b in bookings if b.driver_pay and b.driver_pay_status == "paid")
    pending = sum(b.driver_pay for b in bookings if b.driver_pay and b.driver_pay_status == "pending")
    unpaid  = sum(b.driver_pay for b in bookings if b.driver_pay and b.driver_pay_status == "unpaid")

    loads = []
    for bk in bookings:
        if bk.driver_pay is None:
            continue
        load = db.query(Load).filter(Load.id == bk.load_id).first()
        loads.append({
            "booking_id":        str(bk.id),
            "origin":            load.origin      if load else None,
            "destination":       load.destination if load else None,
            "driver_pay":        bk.driver_pay,
            "driver_pay_status": bk.driver_pay_status,
            "tms_status":        bk.tms_status.value if bk.tms_status else None,
            "delivered_at":      bk.delivered_at.isoformat() if bk.delivered_at else None,
        })

    return {
        "total_paid":    paid,
        "total_pending": pending,
        "total_unpaid":  unpaid,
        "loads":         loads,
    }
