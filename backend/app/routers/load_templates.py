from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, date as date_type

from app.database import get_db
from app.middleware.auth import require_broker
from app.models.user import User
from app.models.load_template import LoadTemplate
from app.models.load import Load

router = APIRouter()


class TemplateCreate(BaseModel):
    name:              str
    origin:            str
    origin_state:      Optional[str] = None
    destination:       str
    dest_state:        Optional[str] = None
    miles:             int
    deadhead_miles:    int = 0
    pickup_address:    Optional[str] = None
    delivery_address:  Optional[str] = None
    pickup_lat:        Optional[float] = None
    pickup_lng:        Optional[float] = None
    delivery_lat:      Optional[float] = None
    delivery_lng:      Optional[float] = None
    load_type:         Optional[str] = None
    load_size:         Optional[str] = None
    trailer_length_ft: Optional[int] = None
    weight_lbs:        Optional[int] = None
    commodity:         Optional[str] = None
    dimensions:        Optional[str] = None
    rate:              float
    notes:             Optional[str] = None
    instant_book:      bool = False


class TemplateUpdate(BaseModel):
    name: Optional[str] = None


class RepostPayload(BaseModel):
    pickup_date:   date_type
    delivery_date: date_type
    rate:          Optional[float] = None  # override template rate if provided


def _out(t: LoadTemplate) -> dict:
    return {
        "id":               str(t.id),
        "name":             t.name,
        "origin":           t.origin,
        "origin_state":     t.origin_state,
        "destination":      t.destination,
        "dest_state":       t.dest_state,
        "miles":            t.miles,
        "deadhead_miles":   t.deadhead_miles,
        "pickup_address":   t.pickup_address,
        "delivery_address": t.delivery_address,
        "pickup_lat":       t.pickup_lat,
        "pickup_lng":       t.pickup_lng,
        "delivery_lat":     t.delivery_lat,
        "delivery_lng":     t.delivery_lng,
        "load_type":        t.load_type.value if t.load_type else None,
        "load_size":        t.load_size.value if t.load_size else None,
        "trailer_length_ft": t.trailer_length_ft,
        "weight_lbs":       t.weight_lbs,
        "commodity":        t.commodity,
        "dimensions":       t.dimensions,
        "rate":             t.rate,
        "notes":            t.notes,
        "instant_book":     t.instant_book,
        "times_used":       t.times_used,
        "created_at":       t.created_at.isoformat() if t.created_at else None,
    }


# ── GET /api/load-templates ────────────────────────────────────────────────────
@router.get("", summary="List my load templates")
def list_templates(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_broker),
):
    templates = (
        db.query(LoadTemplate)
        .filter(LoadTemplate.broker_user_id == current_user.id)
        .order_by(LoadTemplate.created_at.desc())
        .all()
    )
    return [_out(t) for t in templates]


# ── POST /api/load-templates ───────────────────────────────────────────────────
@router.post("", summary="Create a load template")
def create_template(
    payload: TemplateCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_broker),
):
    count = db.query(LoadTemplate).filter(LoadTemplate.broker_user_id == current_user.id).count()
    if count >= 50:
        raise HTTPException(status_code=400, detail="Maximum 50 templates allowed")

    from app.models.load import LoadType, LoadSize
    load_type = None
    if payload.load_type:
        try:
            load_type = LoadType(payload.load_type)
        except ValueError:
            pass

    load_size = None
    if payload.load_size:
        try:
            load_size = LoadSize(payload.load_size)
        except ValueError:
            pass

    t = LoadTemplate(
        broker_user_id=current_user.id,
        name=payload.name.strip(),
        origin=payload.origin,
        origin_state=payload.origin_state,
        destination=payload.destination,
        dest_state=payload.dest_state,
        miles=payload.miles,
        deadhead_miles=payload.deadhead_miles,
        pickup_address=payload.pickup_address,
        delivery_address=payload.delivery_address,
        pickup_lat=payload.pickup_lat,
        pickup_lng=payload.pickup_lng,
        delivery_lat=payload.delivery_lat,
        delivery_lng=payload.delivery_lng,
        load_type=load_type,
        load_size=load_size,
        trailer_length_ft=payload.trailer_length_ft,
        weight_lbs=payload.weight_lbs,
        commodity=payload.commodity,
        dimensions=payload.dimensions,
        rate=payload.rate,
        notes=payload.notes,
        instant_book=payload.instant_book,
    )
    db.add(t)
    db.commit()
    db.refresh(t)
    return _out(t)


# ── PATCH /api/load-templates/{id} ────────────────────────────────────────────
@router.patch("/{template_id}", summary="Rename a template")
def update_template(
    template_id: UUID,
    payload: TemplateUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_broker),
):
    t = db.query(LoadTemplate).filter(
        LoadTemplate.id == template_id,
        LoadTemplate.broker_user_id == current_user.id,
    ).first()
    if not t:
        raise HTTPException(status_code=404, detail="Template not found")
    if payload.name is not None:
        t.name = payload.name.strip()
    db.commit()
    db.refresh(t)
    return _out(t)


# ── DELETE /api/load-templates/{id} ───────────────────────────────────────────
@router.delete("/{template_id}", status_code=204)
def delete_template(
    template_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_broker),
):
    t = db.query(LoadTemplate).filter(
        LoadTemplate.id == template_id,
        LoadTemplate.broker_user_id == current_user.id,
    ).first()
    if not t:
        raise HTTPException(status_code=404, detail="Template not found")
    db.delete(t)
    db.commit()


# ── POST /api/load-templates/{id}/repost ──────────────────────────────────────
@router.post("/{template_id}/repost", summary="Post a new load from this template")
def repost_template(
    template_id: UUID,
    payload: RepostPayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_broker),
):
    t = db.query(LoadTemplate).filter(
        LoadTemplate.id == template_id,
        LoadTemplate.broker_user_id == current_user.id,
    ).first()
    if not t:
        raise HTTPException(status_code=404, detail="Template not found")

    load = Load(
        broker_user_id=current_user.id,
        origin=t.origin,
        origin_state=t.origin_state,
        destination=t.destination,
        dest_state=t.dest_state,
        miles=t.miles,
        deadhead_miles=t.deadhead_miles,
        pickup_address=t.pickup_address,
        delivery_address=t.delivery_address,
        pickup_lat=t.pickup_lat,
        pickup_lng=t.pickup_lng,
        delivery_lat=t.delivery_lat,
        delivery_lng=t.delivery_lng,
        load_type=t.load_type or 'Dry Van',
        load_size=t.load_size,
        trailer_length_ft=t.trailer_length_ft,
        weight_lbs=t.weight_lbs,
        commodity=t.commodity,
        dimensions=t.dimensions,
        rate=payload.rate if payload.rate is not None else t.rate,
        notes=t.notes,
        instant_book=t.instant_book,
        pickup_date=payload.pickup_date,
        delivery_date=payload.delivery_date,
        status='active',
    )
    db.add(load)

    t.times_used += 1
    t.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(load)

    return {
        "load_id": str(load.id),
        "message": "Load posted successfully",
    }
