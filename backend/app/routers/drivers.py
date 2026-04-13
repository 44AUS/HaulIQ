from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from uuid import UUID
from datetime import datetime
import secrets

from app.database import get_db
from app.models.user import User, UserRole, UserPlan
from app.models.booking import Booking
from app.models.driver_location import DriverLocation
from app.middleware.auth import require_carrier

router = APIRouter()


# ── Schemas ───────────────────────────────────────────────────────────────────

class DriverInviteIn(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    license_number: Optional[str] = None


class DriverUpdateIn(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    license_number: Optional[str] = None


class AssignDriverIn(BaseModel):
    driver_id: UUID
    driver_pay: Optional[float] = None


class DriverOut(BaseModel):
    id: UUID
    name: str
    email: str
    phone: Optional[str] = None
    license_number: Optional[str] = None
    invite_accepted: bool
    is_active: bool
    created_at: datetime
    model_config = {"from_attributes": True}


class DriverLocationOut(BaseModel):
    lat: float
    lng: float
    heading: Optional[float] = None
    speed_mph: Optional[float] = None
    recorded_at: datetime
    model_config = {"from_attributes": True}


# ── Carrier: manage drivers ───────────────────────────────────────────────────

@router.get("", response_model=List[DriverOut])
def list_drivers(carrier: User = Depends(require_carrier), db: Session = Depends(get_db)):
    return db.query(User).filter(
        User.carrier_id == carrier.id,
        User.role == UserRole.driver,
    ).order_by(User.created_at.desc()).all()


@router.post("/invite", status_code=201)
def invite_driver(
    payload: DriverInviteIn,
    carrier: User = Depends(require_carrier),
    db: Session = Depends(get_db),
):
    existing = db.query(User).filter(User.email == payload.email.lower()).first()
    if existing:
        raise HTTPException(400, "An account with this email already exists.")

    token = secrets.token_urlsafe(32)
    driver = User(
        email=payload.email.lower(),
        password_hash="",
        name=payload.name,
        role=UserRole.driver,
        plan=UserPlan.basic,
        phone=payload.phone,
        carrier_id=carrier.id,
        invite_token=token,
        invite_accepted=False,
        is_active=False,
        is_verified=False,
        license_number=payload.license_number,
    )
    db.add(driver)
    db.commit()
    db.refresh(driver)
    return {
        "id": str(driver.id),
        "name": driver.name,
        "email": driver.email,
        "invite_token": token,
        "message": f"Invite created for {driver.name}. Share the invite link.",
    }


@router.patch("/{driver_id}", response_model=DriverOut)
def update_driver(
    driver_id: UUID,
    payload: DriverUpdateIn,
    carrier: User = Depends(require_carrier),
    db: Session = Depends(get_db),
):
    driver = db.query(User).filter(User.id == driver_id, User.carrier_id == carrier.id).first()
    if not driver:
        raise HTTPException(404, "Driver not found")
    for k, v in payload.model_dump(exclude_none=True).items():
        setattr(driver, k, v)
    db.commit()
    db.refresh(driver)
    return driver


@router.delete("/{driver_id}", status_code=204)
def remove_driver(
    driver_id: UUID,
    carrier: User = Depends(require_carrier),
    db: Session = Depends(get_db),
):
    driver = db.query(User).filter(User.id == driver_id, User.carrier_id == carrier.id).first()
    if not driver:
        raise HTTPException(404, "Driver not found")
    db.delete(driver)
    db.commit()


# ── Carrier: assign driver to booking ────────────────────────────────────────

@router.post("/bookings/{booking_id}/assign")
def assign_driver(
    booking_id: UUID,
    payload: AssignDriverIn,
    carrier: User = Depends(require_carrier),
    db: Session = Depends(get_db),
):
    booking = db.query(Booking).filter(
        Booking.id == booking_id,
        Booking.carrier_id == carrier.id,
    ).first()
    if not booking:
        raise HTTPException(404, "Booking not found")

    driver = db.query(User).filter(
        User.id == payload.driver_id,
        User.carrier_id == carrier.id,
        User.role == UserRole.driver,
    ).first()
    if not driver:
        raise HTTPException(404, "Driver not found under your carrier account")

    booking.assigned_driver_id = driver.id
    if payload.driver_pay is not None:
        booking.driver_pay = payload.driver_pay
    if booking.driver_pay_status == "paid":
        booking.driver_pay_status = "unpaid"
    # Sync driver name/phone to TMS dispatch fields
    booking.driver_name = driver.name
    if driver.phone and not booking.driver_phone:
        booking.driver_phone = driver.phone

    db.commit()
    return {"ok": True, "driver_id": str(driver.id), "driver_name": driver.name}


@router.delete("/bookings/{booking_id}/assign", status_code=204)
def unassign_driver(
    booking_id: UUID,
    carrier: User = Depends(require_carrier),
    db: Session = Depends(get_db),
):
    booking = db.query(Booking).filter(
        Booking.id == booking_id,
        Booking.carrier_id == carrier.id,
    ).first()
    if not booking:
        raise HTTPException(404, "Booking not found")
    booking.assigned_driver_id = None
    db.commit()


# ── Carrier: get driver's latest location ────────────────────────────────────

@router.get("/{driver_id}/location")
def get_driver_location(
    driver_id: UUID,
    carrier: User = Depends(require_carrier),
    db: Session = Depends(get_db),
):
    driver = db.query(User).filter(User.id == driver_id, User.carrier_id == carrier.id).first()
    if not driver:
        raise HTTPException(404, "Driver not found")
    loc = (
        db.query(DriverLocation)
        .filter(DriverLocation.driver_id == driver_id)
        .order_by(DriverLocation.recorded_at.desc())
        .first()
    )
    if not loc:
        return None
    return {
        "lat": loc.lat,
        "lng": loc.lng,
        "heading": loc.heading,
        "speed_mph": loc.speed_mph,
        "recorded_at": loc.recorded_at.isoformat(),
    }
