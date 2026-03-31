from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, func
from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.user import User, UserRole
from app.models.messaging import Conversation, Message
from app.models.booking import Booking, BookingStatus
from app.models.load import Load, SavedLoad
from app.models.load_payment import LoadPayment
from app.models.network import BrokerNetwork

router = APIRouter()

LIMIT = 10


@router.get("/", summary="Global search across all user data")
def search(
    q: str = Query(..., min_length=1),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    like = f"%{q}%"
    uid = current_user.id
    is_carrier = current_user.role == UserRole.carrier
    is_broker = current_user.role == UserRole.broker
    results = {}

    # ── Connections ────────────────────────────────────────────────────────────
    connections = []
    if is_carrier:
        rows = (
            db.query(BrokerNetwork, User)
            .join(User, User.id == BrokerNetwork.broker_id)
            .filter(
                BrokerNetwork.carrier_id == uid,
                BrokerNetwork.status == "accepted",
                or_(func.lower(User.name).like(func.lower(like)),
                    func.lower(User.company).like(func.lower(like))),
            )
            .limit(LIMIT).all()
        )
        for net, u in rows:
            connections.append({"id": str(u.id), "name": u.name, "company": u.company, "role": "broker", "path": f"/b/{u.id}"})
    elif is_broker:
        rows = (
            db.query(BrokerNetwork, User)
            .join(User, User.id == BrokerNetwork.carrier_id)
            .filter(
                BrokerNetwork.broker_id == uid,
                BrokerNetwork.status == "accepted",
                or_(func.lower(User.name).like(func.lower(like)),
                    func.lower(User.company).like(func.lower(like))),
            )
            .limit(LIMIT).all()
        )
        for net, u in rows:
            connections.append({"id": str(u.id), "name": u.name, "company": u.company, "role": "carrier", "path": f"/c/{u.id}"})
    results["connections"] = connections

    # ── Messages ───────────────────────────────────────────────────────────────
    messages = []
    conv_filter = (
        Conversation.carrier_id == uid if is_carrier else Conversation.broker_id == uid
    )
    msg_rows = (
        db.query(Message, Conversation)
        .join(Conversation, Conversation.id == Message.conversation_id)
        .filter(
            conv_filter,
            func.lower(Message.body).like(func.lower(like)),
        )
        .order_by(Message.created_at.desc())
        .limit(LIMIT).all()
    )
    for msg, conv in msg_rows:
        other_id = conv.broker_id if is_carrier else conv.carrier_id
        other = db.query(User).filter(User.id == other_id).first()
        messages.append({
            "id": str(msg.id),
            "conversation_id": str(conv.id),
            "body": msg.body[:120],
            "other_name": other.name if other else "Unknown",
            "path": f"/{current_user.role}/messages",
            "conv_id": str(conv.id),
        })
    results["messages"] = messages

    # ── Loads in progress ──────────────────────────────────────────────────────
    in_progress = []
    in_progress_statuses = [BookingStatus.approved, BookingStatus.in_transit]
    if is_carrier:
        rows = (
            db.query(Booking, Load)
            .join(Load, Load.id == Booking.load_id)
            .filter(
                Booking.carrier_id == uid,
                Booking.status.in_(in_progress_statuses),
                or_(func.lower(Load.origin).like(func.lower(like)),
                    func.lower(Load.destination).like(func.lower(like)),
                    func.lower(Load.commodity).like(func.lower(like))),
            )
            .limit(LIMIT).all()
        )
        for booking, load in rows:
            in_progress.append({"id": str(booking.id), "origin": load.origin, "destination": load.destination, "commodity": load.commodity, "rate": load.rate, "path": f"/carrier/active/{booking.id}"})
    elif is_broker:
        rows = (
            db.query(Booking, Load)
            .join(Load, Load.id == Booking.load_id)
            .filter(
                Load.broker_user_id == uid,
                Booking.status.in_(in_progress_statuses),
                or_(func.lower(Load.origin).like(func.lower(like)),
                    func.lower(Load.destination).like(func.lower(like)),
                    func.lower(Load.commodity).like(func.lower(like))),
            )
            .limit(LIMIT).all()
        )
        for booking, load in rows:
            in_progress.append({"id": str(booking.id), "origin": load.origin, "destination": load.destination, "commodity": load.commodity, "rate": load.rate, "path": f"/broker/active"})
    results["loads_in_progress"] = in_progress

    # ── Completed loads ────────────────────────────────────────────────────────
    completed = []
    if is_carrier:
        rows = (
            db.query(Booking, Load)
            .join(Load, Load.id == Booking.load_id)
            .filter(
                Booking.carrier_id == uid,
                Booking.status == BookingStatus.completed,
                or_(func.lower(Load.origin).like(func.lower(like)),
                    func.lower(Load.destination).like(func.lower(like)),
                    func.lower(Load.commodity).like(func.lower(like))),
            )
            .limit(LIMIT).all()
        )
        for booking, load in rows:
            completed.append({"id": str(booking.id), "origin": load.origin, "destination": load.destination, "commodity": load.commodity, "rate": load.rate, "path": "/carrier/history"})
    elif is_broker:
        rows = (
            db.query(Booking, Load)
            .join(Load, Load.id == Booking.load_id)
            .filter(
                Load.broker_user_id == uid,
                Booking.status == BookingStatus.completed,
                or_(func.lower(Load.origin).like(func.lower(like)),
                    func.lower(Load.destination).like(func.lower(like)),
                    func.lower(Load.commodity).like(func.lower(like))),
            )
            .limit(LIMIT).all()
        )
        for booking, load in rows:
            completed.append({"id": str(booking.id), "origin": load.origin, "destination": load.destination, "commodity": load.commodity, "rate": load.rate, "path": "/broker/loads"})
    results["completed_loads"] = completed

    # ── Saved loads (carrier only) ─────────────────────────────────────────────
    saved = []
    if is_carrier:
        rows = (
            db.query(SavedLoad, Load)
            .join(Load, Load.id == SavedLoad.load_id)
            .filter(
                SavedLoad.carrier_id == uid,
                or_(func.lower(Load.origin).like(func.lower(like)),
                    func.lower(Load.destination).like(func.lower(like)),
                    func.lower(Load.commodity).like(func.lower(like))),
            )
            .limit(LIMIT).all()
        )
        for sl, load in rows:
            saved.append({"id": str(load.id), "origin": load.origin, "destination": load.destination, "commodity": load.commodity, "rate": load.rate, "path": f"/carrier/loads/{load.id}"})
    results["saved_loads"] = saved

    # ── Payments ───────────────────────────────────────────────────────────────
    payments = []
    pay_rows = (
        db.query(LoadPayment, Load)
        .join(Load, Load.id == LoadPayment.load_id)
        .filter(
            (LoadPayment.carrier_id == uid) if is_carrier else (LoadPayment.broker_id == uid),
            or_(func.lower(Load.origin).like(func.lower(like)),
                func.lower(Load.destination).like(func.lower(like))),
        )
        .limit(LIMIT).all()
    )
    for pay, load in pay_rows:
        payments.append({"id": str(pay.id), "origin": load.origin, "destination": load.destination, "amount": pay.amount, "status": pay.status, "path": f"/{current_user.role}/payments"})
    results["payments"] = payments

    return results
