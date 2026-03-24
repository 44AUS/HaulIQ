from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import Optional
from uuid import UUID
from datetime import datetime

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.user import User, UserRole
from app.models.waitlist import WaitlistEntry

router = APIRouter()


class JoinRequest(BaseModel):
    email: EmailStr
    name: Optional[str] = None
    role: str  # 'carrier' | 'broker'


class WaitlistOut(BaseModel):
    id: UUID
    email: str
    name: Optional[str]
    role: str
    created_at: datetime
    model_config = {"from_attributes": True}


@router.post("/", status_code=201)
def join_waitlist(payload: JoinRequest, db: Session = Depends(get_db)):
    if payload.role not in ("carrier", "broker"):
        raise HTTPException(status_code=400, detail="role must be 'carrier' or 'broker'")

    existing = db.query(WaitlistEntry).filter(WaitlistEntry.email == payload.email.lower()).first()
    if existing:
        return {"message": "You're already on the waitlist!", "already": True}

    entry = WaitlistEntry(
        email=payload.email.lower(),
        name=payload.name,
        role=payload.role,
    )
    db.add(entry)
    db.commit()
    return {"message": "You're on the list! We'll reach out soon.", "already": False}


@router.get("/", response_model=list[WaitlistOut])
def list_waitlist(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="Admin only")
    return db.query(WaitlistEntry).order_by(WaitlistEntry.created_at.desc()).all()


@router.delete("/{entry_id}", status_code=204)
def delete_entry(
    entry_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="Admin only")
    entry = db.query(WaitlistEntry).filter(WaitlistEntry.id == entry_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(entry)
    db.commit()
