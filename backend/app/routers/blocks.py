from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from uuid import UUID

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.user import User
from app.models.block import UserBlock

router = APIRouter()


@router.post("/{user_id}", status_code=201)
def block_user(
    user_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    existing = db.query(UserBlock).filter_by(blocker_id=current_user.id, blocked_id=user_id).first()
    if existing:
        return {"id": str(existing.id)}
    block = UserBlock(blocker_id=current_user.id, blocked_id=user_id)
    db.add(block)
    db.commit()
    db.refresh(block)
    return {"id": str(block.id)}


@router.delete("/{user_id}", status_code=204)
def unblock_user(
    user_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db.query(UserBlock).filter_by(blocker_id=current_user.id, blocked_id=user_id).delete()
    db.commit()


@router.get("/")
def list_blocked(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    blocks = db.query(UserBlock).filter_by(blocker_id=current_user.id).all()
    return [{"user_id": str(b.blocked_id)} for b in blocks]


@router.get("/check/{user_id}")
def check_block(
    user_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    blocked = db.query(UserBlock).filter_by(blocker_id=current_user.id, blocked_id=user_id).first()
    return {"is_blocked": blocked is not None}
