import secrets
import string
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import Optional
from uuid import UUID
from datetime import datetime

from app.database import get_db
from app.middleware.auth import get_current_user, require_admin
from app.models.user import User, UserRole, UserPlan
from app.models.waitlist import WaitlistEntry
from app.utils.password import hash_password

router = APIRouter()


def _generate_temp_password(length: int = 12) -> str:
    """Generate a readable temporary password."""
    chars = string.ascii_letters + string.digits
    # Ensure at least one digit and one uppercase
    pwd = (
        secrets.choice(string.ascii_uppercase)
        + secrets.choice(string.digits)
        + ''.join(secrets.choice(chars) for _ in range(length - 2))
    )
    return pwd


class JoinRequest(BaseModel):
    email: EmailStr
    name: str
    role: str        # 'carrier' | 'broker'
    phone: Optional[str] = None
    company: Optional[str] = None
    mc_number: Optional[str] = None
    business_address: Optional[str] = None
    business_city: Optional[str] = None
    business_state: Optional[str] = None
    business_zip: Optional[str] = None


class WaitlistOut(BaseModel):
    id: UUID
    email: str
    name: Optional[str]
    role: str
    company: Optional[str]
    mc_number: Optional[str]
    activated: bool
    created_at: datetime
    model_config = {"from_attributes": True}


@router.post("/", status_code=201)
def join_waitlist(payload: JoinRequest, db: Session = Depends(get_db)):
    if payload.role not in ("carrier", "broker"):
        raise HTTPException(status_code=400, detail="role must be 'carrier' or 'broker'")

    email = payload.email.lower()

    # Already on waitlist
    existing_entry = db.query(WaitlistEntry).filter(WaitlistEntry.email == email).first()
    if existing_entry:
        return {
            "message": "You're already on the waitlist!",
            "already": True,
        }

    # Already has a full user account
    existing_user = db.query(User).filter(User.email == email).first()
    if existing_user:
        raise HTTPException(status_code=409, detail="An account with this email already exists. Please log in.")

    # Generate temporary password and create a pre-built (inactive) user account
    temp_password = _generate_temp_password()
    user = User(
        email=email,
        password_hash=hash_password(temp_password),
        name=payload.name,
        role=UserRole(payload.role),
        plan=UserPlan.basic,
        phone=payload.phone,
        company=payload.company,
        mc_number=payload.mc_number,
        business_address=payload.business_address,
        business_city=payload.business_city,
        business_state=payload.business_state,
        business_zip=payload.business_zip,
        is_active=False,
    )
    db.add(user)
    db.flush()  # get user.id before commit

    entry = WaitlistEntry(
        email=email,
        name=payload.name,
        role=payload.role,
        company=payload.company,
        mc_number=payload.mc_number,
        user_id=user.id,
        activated=False,
    )
    db.add(entry)
    db.commit()

    return {
        "message": "You're on the list! Save these credentials — you'll use them to log in when we launch.",
        "already": False,
        "temp_email": email,
        "temp_password": temp_password,
    }


@router.get("/", response_model=list[WaitlistOut])
def list_waitlist(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    return db.query(WaitlistEntry).order_by(WaitlistEntry.created_at.desc()).all()


@router.post("/{entry_id}/activate", status_code=200)
def activate_entry(
    entry_id: UUID,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    entry = db.query(WaitlistEntry).filter(WaitlistEntry.id == entry_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Waitlist entry not found")
    if entry.activated:
        raise HTTPException(status_code=400, detail="Already activated")
    if not entry.user_id:
        raise HTTPException(status_code=400, detail="No pre-built account found for this entry")

    user = db.query(User).filter(User.id == entry.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Pre-built user account not found")

    user.is_active = True
    entry.activated = True
    db.commit()

    return {"ok": True, "email": entry.email, "message": f"{entry.email} has been activated and can now log in."}


@router.delete("/{entry_id}", status_code=204)
def delete_entry(
    entry_id: UUID,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    entry = db.query(WaitlistEntry).filter(WaitlistEntry.id == entry_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(entry)
    db.commit()
