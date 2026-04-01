from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from uuid import UUID
from typing import Optional
from datetime import date, datetime
from pydantic import BaseModel

from app.database import get_db
from app.middleware.auth import get_current_user, require_carrier
from app.models.user import User
from app.models.truck_post import TruckPost

router = APIRouter()


# ─── Schemas ──────────────────────────────────────────────────────────────────

class TruckPostCreate(BaseModel):
    equipment_type: str
    trailer_length: Optional[int] = None
    weight_capacity: Optional[int] = None
    current_location: str
    preferred_origin: Optional[str] = None
    preferred_destination: Optional[str] = None
    available_from: str  # YYYY-MM-DD
    available_to: str    # YYYY-MM-DD
    rate_expectation: Optional[float] = None
    notes: Optional[str] = None


class TruckPostUpdate(BaseModel):
    equipment_type: Optional[str] = None
    trailer_length: Optional[int] = None
    weight_capacity: Optional[int] = None
    current_location: Optional[str] = None
    preferred_origin: Optional[str] = None
    preferred_destination: Optional[str] = None
    available_from: Optional[str] = None
    available_to: Optional[str] = None
    rate_expectation: Optional[float] = None
    notes: Optional[str] = None
    is_active: Optional[bool] = None


class TruckPostOut(BaseModel):
    id: UUID
    carrier_id: UUID
    carrier_name: Optional[str] = None
    carrier_company: Optional[str] = None
    equipment_type: str
    trailer_length: Optional[int] = None
    weight_capacity: Optional[int] = None
    current_location: str
    preferred_origin: Optional[str] = None
    preferred_destination: Optional[str] = None
    available_from: str
    available_to: str
    rate_expectation: Optional[float] = None
    notes: Optional[str] = None
    is_active: bool
    created_at: str

    model_config = {"from_attributes": True}


def _serialize(post: TruckPost, carrier: User) -> TruckPostOut:
    return TruckPostOut(
        id=post.id,
        carrier_id=post.carrier_id,
        carrier_name=carrier.name if carrier else None,
        carrier_company=getattr(carrier, "company_name", None) if carrier else None,
        equipment_type=post.equipment_type,
        trailer_length=post.trailer_length,
        weight_capacity=post.weight_capacity,
        current_location=post.current_location,
        preferred_origin=post.preferred_origin,
        preferred_destination=post.preferred_destination,
        available_from=post.available_from.isoformat() if post.available_from else "",
        available_to=post.available_to.isoformat() if post.available_to else "",
        rate_expectation=post.rate_expectation,
        notes=post.notes,
        is_active=post.is_active,
        created_at=post.created_at.isoformat() if post.created_at else "",
    )


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.get("/", response_model=list[TruckPostOut])
def list_truck_posts(
    equipment_type: Optional[str] = None,
    available_from: Optional[str] = None,
    location: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(TruckPost, User).join(User, User.id == TruckPost.carrier_id).filter(TruckPost.is_active == True)

    if equipment_type:
        query = query.filter(TruckPost.equipment_type == equipment_type)
    if available_from:
        try:
            af = date.fromisoformat(available_from)
            query = query.filter(TruckPost.available_from >= af)
        except ValueError:
            pass
    if location:
        query = query.filter(TruckPost.current_location.ilike(f"%{location}%"))

    rows = query.order_by(desc(TruckPost.created_at)).all()
    return [_serialize(post, carrier) for post, carrier in rows]


@router.get("/mine", response_model=list[TruckPostOut])
def my_truck_posts(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_carrier),
):
    rows = (
        db.query(TruckPost, User)
        .join(User, User.id == TruckPost.carrier_id)
        .filter(TruckPost.carrier_id == current_user.id)
        .order_by(desc(TruckPost.created_at))
        .all()
    )
    return [_serialize(post, carrier) for post, carrier in rows]


@router.post("/", response_model=TruckPostOut, status_code=201)
def create_truck_post(
    payload: TruckPostCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_carrier),
):
    try:
        af = date.fromisoformat(payload.available_from)
        at = date.fromisoformat(payload.available_to)
    except ValueError:
        raise HTTPException(status_code=422, detail="Dates must be in YYYY-MM-DD format")

    post = TruckPost(
        carrier_id=current_user.id,
        equipment_type=payload.equipment_type,
        trailer_length=payload.trailer_length,
        weight_capacity=payload.weight_capacity,
        current_location=payload.current_location,
        preferred_origin=payload.preferred_origin,
        preferred_destination=payload.preferred_destination,
        available_from=af,
        available_to=at,
        rate_expectation=payload.rate_expectation,
        notes=payload.notes,
    )
    db.add(post)
    db.commit()
    db.refresh(post)
    return _serialize(post, current_user)


@router.patch("/{post_id}", response_model=TruckPostOut)
def update_truck_post(
    post_id: UUID,
    payload: TruckPostUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_carrier),
):
    post = db.query(TruckPost).filter(TruckPost.id == post_id, TruckPost.carrier_id == current_user.id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Truck post not found")

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if field == "available_from" and value is not None:
            try:
                value = date.fromisoformat(value)
            except ValueError:
                raise HTTPException(status_code=422, detail="available_from must be YYYY-MM-DD")
        if field == "available_to" and value is not None:
            try:
                value = date.fromisoformat(value)
            except ValueError:
                raise HTTPException(status_code=422, detail="available_to must be YYYY-MM-DD")
        setattr(post, field, value)

    post.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(post)
    return _serialize(post, current_user)


@router.delete("/{post_id}", status_code=204)
def delete_truck_post(
    post_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_carrier),
):
    post = db.query(TruckPost).filter(TruckPost.id == post_id, TruckPost.carrier_id == current_user.id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Truck post not found")
    db.delete(post)
    db.commit()
    return None
