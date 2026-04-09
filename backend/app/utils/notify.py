"""
Notification utility — create in-app notifications.
Import and call create_notification() anywhere a trigger fires.
"""
from sqlalchemy.orm import Session
from app.models.notification import Notification, NotificationType


def create_notification(
    db: Session,
    user_id,
    notif_type: NotificationType,
    title: str,
    body: str | None = None,
    data: dict | None = None,
) -> Notification:
    notif = Notification(
        user_id=user_id,
        type=notif_type,
        title=title,
        body=body,
        data=data or {},
    )
    db.add(notif)
    db.flush()   # get id without full commit — caller commits
    return notif
