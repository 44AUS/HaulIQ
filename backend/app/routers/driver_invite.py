"""Public endpoints for driver invite acceptance — no auth required."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.database import get_db
from app.models.user import User, UserRole
from app.schemas.user import Token, UserOut
from app.utils.password import hash_password
from app.utils.jwt import create_access_token

router = APIRouter()


class AcceptInviteIn(BaseModel):
    token: str
    password: str


@router.get("/{token}")
def get_invite_info(token: str, db: Session = Depends(get_db)):
    driver = db.query(User).filter(
        User.invite_token == token,
        User.role == UserRole.driver,
    ).first()
    if not driver:
        raise HTTPException(404, "Invalid or expired invite link")
    if driver.invite_accepted:
        raise HTTPException(400, "This invite has already been accepted. Please log in.")

    carrier = db.query(User).filter(User.id == driver.carrier_id).first()
    return {
        "name": driver.name,
        "email": driver.email,
        "carrier_name": (carrier.company or carrier.name) if carrier else "Your carrier",
    }


@router.post("/accept", response_model=Token)
def accept_invite(payload: AcceptInviteIn, db: Session = Depends(get_db)):
    if len(payload.password) < 6:
        raise HTTPException(400, "Password must be at least 6 characters")

    driver = db.query(User).filter(
        User.invite_token == payload.token,
        User.role == UserRole.driver,
    ).first()
    if not driver:
        raise HTTPException(404, "Invalid or expired invite link")
    if driver.invite_accepted:
        raise HTTPException(400, "This invite has already been accepted.")

    driver.password_hash = hash_password(payload.password)
    driver.invite_accepted = True
    driver.invite_token = None
    driver.is_active = True
    driver.is_verified = True
    db.commit()
    db.refresh(driver)

    token = create_access_token({"sub": str(driver.id), "role": driver.role.value})
    return Token(access_token=token, user=UserOut.model_validate(driver))
