from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from pydantic import BaseModel
from typing import Optional
from uuid import UUID

from app.database import get_db
from app.models.equipment_class import EquipmentClass
from app.middleware.auth import get_current_user, require_admin

router = APIRouter()


class EquipmentClassCreate(BaseModel):
    name: str
    sort_order: int = 0
    is_active: bool = True


class EquipmentClassUpdate(BaseModel):
    name: Optional[str] = None
    sort_order: Optional[int] = None
    is_active: Optional[bool] = None


def _serialize_type(t) -> dict:
    return {"id": str(t.id), "name": t.name, "abbreviation": t.abbreviation}


def _serialize(ec: EquipmentClass) -> dict:
    return {
        "id": str(ec.id),
        "name": ec.name,
        "sort_order": ec.sort_order,
        "is_active": ec.is_active,
        "equipment_types": [_serialize_type(t) for t in ec.equipment_types],
    }


def _query_with_types(db: Session):
    return db.query(EquipmentClass).options(joinedload(EquipmentClass.equipment_types))


# ── Public: list active classes with their types ───────────────────────────────
@router.get("/")
def list_equipment_classes(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    classes = (
        _query_with_types(db)
        .filter(EquipmentClass.is_active == True)
        .order_by(EquipmentClass.sort_order, EquipmentClass.name)
        .all()
    )
    return [_serialize(c) for c in classes]


# ── Admin: list all ────────────────────────────────────────────────────────────
@router.get("/admin")
def admin_list_equipment_classes(
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    classes = (
        _query_with_types(db)
        .order_by(EquipmentClass.sort_order, EquipmentClass.name)
        .all()
    )
    return [_serialize(c) for c in classes]


# ── Admin: create ──────────────────────────────────────────────────────────────
@router.post("/")
def create_equipment_class(
    body: EquipmentClassCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    if db.query(EquipmentClass).filter(EquipmentClass.name == body.name).first():
        raise HTTPException(status_code=400, detail="A class with this name already exists")
    ec = EquipmentClass(name=body.name, sort_order=body.sort_order, is_active=body.is_active)
    db.add(ec)
    db.commit()
    ec = _query_with_types(db).filter(EquipmentClass.id == ec.id).first()
    return _serialize(ec)


# ── Admin: update ──────────────────────────────────────────────────────────────
@router.patch("/{class_id}")
def update_equipment_class(
    class_id: UUID,
    body: EquipmentClassUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    ec = _query_with_types(db).filter(EquipmentClass.id == str(class_id)).first()
    if not ec:
        raise HTTPException(status_code=404, detail="Not found")
    if body.name is not None:
        ec.name = body.name
    if body.sort_order is not None:
        ec.sort_order = body.sort_order
    if body.is_active is not None:
        ec.is_active = body.is_active
    db.commit()
    ec = _query_with_types(db).filter(EquipmentClass.id == str(class_id)).first()
    return _serialize(ec)


# ── Admin: delete ──────────────────────────────────────────────────────────────
@router.delete("/{class_id}")
def delete_equipment_class(
    class_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    ec = db.query(EquipmentClass).filter(EquipmentClass.id == str(class_id)).first()
    if not ec:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(ec)
    db.commit()
    return {"ok": True}
