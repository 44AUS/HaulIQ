from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID
from datetime import datetime

from app.database import get_db
from app.models.notification import Notification
from app.models.user import User
from app.middleware.auth import get_current_user

router = APIRouter()


# ── GET /api/notifications ─────────────────────────────────────────────────────
@router.get("", summary="List my notifications (unread first)")
def list_notifications(
    limit: int = 40,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rows = (
        db.query(Notification)
        .filter(Notification.user_id == current_user.id)
        .order_by(Notification.read.asc(), Notification.created_at.desc())
        .limit(limit)
        .all()
    )
    return [_out(n) for n in rows]


# ── GET /api/notifications/count ───────────────────────────────────────────────
@router.get("/count", summary="Unread notification count")
def unread_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    count = (
        db.query(Notification)
        .filter(Notification.user_id == current_user.id, Notification.read == False)
        .count()
    )
    return {"unread": count}


# ── PATCH /api/notifications/read-all ─────────────────────────────────────────
@router.patch("/read-all", summary="Mark all notifications as read")
def mark_all_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.read == False,
    ).update({"read": True})
    db.commit()
    return {"ok": True}


# ── PATCH /api/notifications/{id}/read ────────────────────────────────────────
@router.patch("/{notif_id}/read", summary="Mark one notification as read")
def mark_read(
    notif_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    notif = db.query(Notification).filter(Notification.id == notif_id).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    if str(notif.user_id) != str(current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized")
    notif.read = True
    db.commit()
    return _out(notif)


# ── DELETE /api/notifications (delete all) ────────────────────────────────────
@router.delete("", summary="Delete all notifications for current user")
def delete_all_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db.query(Notification).filter(Notification.user_id == current_user.id).delete()
    db.commit()
    return {"ok": True}


# ── DELETE /api/notifications/{id} ────────────────────────────────────────────
@router.delete("/{notif_id}", summary="Delete a notification")
def delete_notification(
    notif_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    notif = db.query(Notification).filter(Notification.id == notif_id).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    if str(notif.user_id) != str(current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized")
    db.delete(notif)
    db.commit()
    return {"ok": True}


def _out(n: Notification) -> dict:
    return {
        "id":         str(n.id),
        "type":       n.type.value if n.type else None,
        "title":      n.title,
        "body":       n.body,
        "data":       n.data or {},
        "read":       n.read,
        "created_at": n.created_at.isoformat() if n.created_at else None,
    }
