import csv
import io
from uuid import UUID
from typing import Optional
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.middleware.auth import get_current_user, require_broker, require_carrier
from app.models.user import User, UserRole
from app.models.allowlist import InstantBookAllowlist
from app.models.load import Load

router = APIRouter()


# ─── Schemas ──────────────────────────────────────────────────────────────────

class AllowlistEntryOut(BaseModel):
    id: UUID
    broker_id: UUID
    carrier_id: Optional[UUID]
    carrier_email: Optional[str]
    carrier_name: Optional[str]
    carrier_mc: Optional[str]
    source: str
    added_at: datetime
    model_config = {"from_attributes": True}


class AddCarrierRequest(BaseModel):
    carrier_id: UUID


class UploadRow(BaseModel):
    email: Optional[str] = None
    name: Optional[str] = None
    mc: Optional[str] = None


class BulkUploadRequest(BaseModel):
    rows: list[UploadRow]


class CarrierSearchResult(BaseModel):
    id: UUID
    name: str
    email: str
    company: Optional[str]
    mc_number: Optional[str]
    model_config = {"from_attributes": True}


# ─── Broker: manage their allowlist ──────────────────────────────────────────

@router.get("/allowlist", response_model=list[AllowlistEntryOut])
def get_allowlist(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_broker),
):
    return (
        db.query(InstantBookAllowlist)
        .filter(InstantBookAllowlist.broker_id == current_user.id)
        .order_by(InstantBookAllowlist.added_at.desc())
        .all()
    )


@router.post("/allowlist", response_model=AllowlistEntryOut, status_code=201)
def add_carrier_to_allowlist(
    payload: AddCarrierRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_broker),
):
    carrier = db.query(User).filter(
        User.id == payload.carrier_id,
        User.role == UserRole.carrier,
    ).first()
    if not carrier:
        raise HTTPException(status_code=404, detail="Carrier not found")

    existing = db.query(InstantBookAllowlist).filter(
        InstantBookAllowlist.broker_id == current_user.id,
        InstantBookAllowlist.carrier_id == payload.carrier_id,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Carrier is already on your allowlist")

    entry = InstantBookAllowlist(
        broker_id=current_user.id,
        carrier_id=payload.carrier_id,
        carrier_email=carrier.email,
        carrier_name=carrier.name,
        source="search",
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


@router.post("/allowlist/upload", response_model=dict, status_code=201)
def bulk_upload_allowlist(
    payload: BulkUploadRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_broker),
):
    """Upload a batch of carriers by email/name/MC. Matches HaulIQ users by email where possible."""
    added = 0
    skipped = 0

    for row in payload.rows:
        if not row.email and not row.mc:
            skipped += 1
            continue

        # Try to find HaulIQ user by email
        carrier_id = None
        if row.email:
            user = db.query(User).filter(User.email == row.email.lower(), User.role == UserRole.carrier).first()
            if user:
                carrier_id = user.id

        # Skip duplicate
        existing = None
        if carrier_id:
            existing = db.query(InstantBookAllowlist).filter(
                InstantBookAllowlist.broker_id == current_user.id,
                InstantBookAllowlist.carrier_id == carrier_id,
            ).first()
        elif row.email:
            existing = db.query(InstantBookAllowlist).filter(
                InstantBookAllowlist.broker_id == current_user.id,
                InstantBookAllowlist.carrier_email == row.email.lower(),
            ).first()

        if existing:
            skipped += 1
            continue

        entry = InstantBookAllowlist(
            broker_id=current_user.id,
            carrier_id=carrier_id,
            carrier_email=row.email.lower() if row.email else None,
            carrier_name=row.name,
            carrier_mc=row.mc,
            source="upload",
        )
        db.add(entry)
        added += 1

    db.commit()
    return {"added": added, "skipped": skipped}


@router.delete("/allowlist/{entry_id}", status_code=204)
def remove_from_allowlist(
    entry_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_broker),
):
    entry = db.query(InstantBookAllowlist).filter(
        InstantBookAllowlist.id == entry_id,
        InstantBookAllowlist.broker_id == current_user.id,
    ).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    db.delete(entry)
    db.commit()


# ─── Carrier: check eligibility ───────────────────────────────────────────────

@router.get("/check/{load_id}")
def check_instant_book_eligibility(
    load_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_carrier),
):
    """Returns whether the current carrier can instant-book a specific load."""
    load = db.query(Load).filter(Load.id == load_id).first()
    if not load:
        raise HTTPException(status_code=404, detail="Load not found")

    if not load.instant_book:
        return {"eligible": False, "reason": "Load does not support instant booking"}

    on_list = db.query(InstantBookAllowlist).filter(
        InstantBookAllowlist.broker_id == load.broker_user_id,
        InstantBookAllowlist.carrier_id == current_user.id,
    ).first()

    if not on_list:
        # Also check by email
        on_list = db.query(InstantBookAllowlist).filter(
            InstantBookAllowlist.broker_id == load.broker_user_id,
            InstantBookAllowlist.carrier_email == current_user.email,
        ).first()

    return {"eligible": bool(on_list), "reason": None if on_list else "You are not on this broker's instant book list"}


# ─── Broker: search HaulIQ carriers ──────────────────────────────────────────

@router.get("/carriers/search", response_model=list[CarrierSearchResult])
def search_carriers(
    q: str = "",
    db: Session = Depends(get_db),
    current_user: User = Depends(require_broker),
):
    if len(q) < 2:
        return []

    query = db.query(User).filter(User.role == UserRole.carrier)
    query = query.filter(
        User.name.ilike(f"%{q}%") |
        User.email.ilike(f"%{q}%") |
        User.mc_number.ilike(f"%{q}%")
    )
    return query.limit(20).all()
