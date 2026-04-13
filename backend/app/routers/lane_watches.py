from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID
from pydantic import BaseModel
from typing import Optional

from app.database import get_db
from app.middleware.auth import require_carrier
from app.models.user import User
from app.models.lane_watch import LaneWatch

router = APIRouter()


class LaneWatchCreate(BaseModel):
    origin_city:    Optional[str] = None
    origin_state:   Optional[str] = None
    dest_city:      Optional[str] = None
    dest_state:     Optional[str] = None
    equipment_type: Optional[str] = None
    min_rate:       Optional[float] = None
    min_rpm:        Optional[float] = None


class LaneWatchUpdate(BaseModel):
    active:         Optional[bool]  = None
    min_rate:       Optional[float] = None
    min_rpm:        Optional[float] = None
    equipment_type: Optional[str]   = None


def _out(lw: LaneWatch) -> dict:
    return {
        "id":             str(lw.id),
        "origin_city":    lw.origin_city,
        "origin_state":   lw.origin_state,
        "dest_city":      lw.dest_city,
        "dest_state":     lw.dest_state,
        "equipment_type": lw.equipment_type,
        "min_rate":       lw.min_rate,
        "min_rpm":        lw.min_rpm,
        "active":         lw.active,
        "created_at":     lw.created_at.isoformat() if lw.created_at else None,
    }


# ── GET /api/lane-watches ──────────────────────────────────────────────────────
@router.get("", summary="List my lane watches")
def list_watches(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_carrier),
):
    watches = (
        db.query(LaneWatch)
        .filter(LaneWatch.carrier_id == current_user.id)
        .order_by(LaneWatch.created_at.desc())
        .all()
    )
    return [_out(w) for w in watches]


# ── POST /api/lane-watches ─────────────────────────────────────────────────────
@router.post("", summary="Create a lane watch")
def create_watch(
    payload: LaneWatchCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_carrier),
):
    existing_count = db.query(LaneWatch).filter(LaneWatch.carrier_id == current_user.id).count()
    if existing_count >= 20:
        raise HTTPException(status_code=400, detail="Maximum 20 lane watches allowed")

    watch = LaneWatch(
        carrier_id=current_user.id,
        origin_city=payload.origin_city.strip().title() if payload.origin_city else None,
        origin_state=payload.origin_state.upper() if payload.origin_state else None,
        dest_city=payload.dest_city.strip().title() if payload.dest_city else None,
        dest_state=payload.dest_state.upper() if payload.dest_state else None,
        equipment_type=payload.equipment_type,
        min_rate=payload.min_rate,
        min_rpm=payload.min_rpm,
    )
    db.add(watch)
    db.commit()
    db.refresh(watch)
    return _out(watch)


# ── PATCH /api/lane-watches/{id} ──────────────────────────────────────────────
@router.patch("/{watch_id}", summary="Update a lane watch")
def update_watch(
    watch_id: UUID,
    payload: LaneWatchUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_carrier),
):
    watch = db.query(LaneWatch).filter(
        LaneWatch.id == watch_id,
        LaneWatch.carrier_id == current_user.id,
    ).first()
    if not watch:
        raise HTTPException(status_code=404, detail="Watch not found")

    if payload.active is not None:
        watch.active = payload.active
    if payload.min_rate is not None:
        watch.min_rate = payload.min_rate
    if payload.min_rpm is not None:
        watch.min_rpm = payload.min_rpm
    if payload.equipment_type is not None:
        watch.equipment_type = payload.equipment_type

    db.commit()
    db.refresh(watch)
    return _out(watch)


# ── DELETE /api/lane-watches/{id} ─────────────────────────────────────────────
@router.delete("/{watch_id}", status_code=204)
def delete_watch(
    watch_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_carrier),
):
    watch = db.query(LaneWatch).filter(
        LaneWatch.id == watch_id,
        LaneWatch.carrier_id == current_user.id,
    ).first()
    if not watch:
        raise HTTPException(status_code=404, detail="Watch not found")
    db.delete(watch)
    db.commit()
