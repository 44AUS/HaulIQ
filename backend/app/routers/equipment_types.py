from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from uuid import UUID

from app.database import get_db
from app.models.equipment_type import EquipmentType
from app.middleware.auth import get_current_user, require_admin

router = APIRouter()


class EquipmentTypeCreate(BaseModel):
    name: str
    sort_order: int = 0
    is_active: bool = True


class EquipmentTypeUpdate(BaseModel):
    name: Optional[str] = None
    sort_order: Optional[int] = None
    is_active: Optional[bool] = None


def _serialize(et: EquipmentType) -> dict:
    return {
        "id": str(et.id),
        "name": et.name,
        "sort_order": et.sort_order,
        "is_active": et.is_active,
    }


# ── Public: list active equipment types ───────────────────────────────────────
@router.get("/")
def list_equipment_types(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    types = (
        db.query(EquipmentType)
        .filter(EquipmentType.is_active == True)
        .order_by(EquipmentType.sort_order, EquipmentType.name)
        .all()
    )
    return [_serialize(t) for t in types]


# ── Admin: list all (including inactive) ──────────────────────────────────────
@router.get("/admin")
def admin_list_equipment_types(
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    types = (
        db.query(EquipmentType)
        .order_by(EquipmentType.sort_order, EquipmentType.name)
        .all()
    )
    return [_serialize(t) for t in types]


# ── Admin: create ─────────────────────────────────────────────────────────────
@router.post("/")
def create_equipment_type(
    body: EquipmentTypeCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    existing = db.query(EquipmentType).filter(EquipmentType.name == body.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Equipment type with this name already exists")
    et = EquipmentType(name=body.name, sort_order=body.sort_order, is_active=body.is_active)
    db.add(et)
    db.commit()
    db.refresh(et)
    return _serialize(et)


# ── Admin: update ─────────────────────────────────────────────────────────────
@router.patch("/{type_id}")
def update_equipment_type(
    type_id: UUID,
    body: EquipmentTypeUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    et = db.query(EquipmentType).filter(EquipmentType.id == str(type_id)).first()
    if not et:
        raise HTTPException(status_code=404, detail="Not found")
    if body.name is not None:
        et.name = body.name
    if body.sort_order is not None:
        et.sort_order = body.sort_order
    if body.is_active is not None:
        et.is_active = body.is_active
    db.commit()
    db.refresh(et)
    return _serialize(et)


# ── Admin: delete ─────────────────────────────────────────────────────────────
@router.delete("/{type_id}")
def delete_equipment_type(
    type_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    et = db.query(EquipmentType).filter(EquipmentType.id == str(type_id)).first()
    if not et:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(et)
    db.commit()
    return {"ok": True}
