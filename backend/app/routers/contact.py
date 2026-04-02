from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import Optional
from uuid import UUID
from datetime import datetime

from app.database import get_db
from app.middleware.auth import require_admin
from app.models.user import User
from app.models.contact import ContactMessage

router = APIRouter()

SUBJECTS = [
    'General Inquiry',
    'Technical Support',
    'Billing & Payments',
    'Account Issue',
    'Partnership',
    'Report a Bug',
    'Other',
]


class ContactRequest(BaseModel):
    name:    str
    email:   EmailStr
    subject: str
    message: str


class ContactOut(BaseModel):
    id:         UUID
    name:       str
    email:      str
    subject:    str
    message:    str
    read:       bool
    created_at: datetime
    model_config = {"from_attributes": True}


@router.post("/", status_code=201)
def submit_contact(payload: ContactRequest, db: Session = Depends(get_db)):
    if not payload.name.strip():
        raise HTTPException(status_code=400, detail="Name is required")
    if not payload.message.strip():
        raise HTTPException(status_code=400, detail="Message is required")

    entry = ContactMessage(
        name=payload.name.strip(),
        email=payload.email.lower(),
        subject=payload.subject.strip() or 'General Inquiry',
        message=payload.message.strip(),
    )
    db.add(entry)
    db.commit()
    return {"ok": True, "message": "Your message has been received. We'll get back to you shortly."}


@router.get("/", response_model=list[ContactOut])
def list_contacts(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    return db.query(ContactMessage).order_by(ContactMessage.created_at.desc()).all()


@router.patch("/{message_id}/read", status_code=200)
def mark_read(
    message_id: UUID,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    msg = db.query(ContactMessage).filter(ContactMessage.id == message_id).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
    msg.read = True
    db.commit()
    return {"ok": True}


@router.delete("/{message_id}", status_code=204)
def delete_contact(
    message_id: UUID,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    msg = db.query(ContactMessage).filter(ContactMessage.id == message_id).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
    db.delete(msg)
    db.commit()
