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
from app.models.truck_post import TruckPost
from app.models.lane_watch import LaneWatch
from app.models.document import LoadDocument

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

    # ── Equipment (carrier only) ───────────────────────────────────────────────
    equipment = []
    if is_carrier:
        rows = (
            db.query(TruckPost)
            .filter(
                TruckPost.carrier_id == uid,
                or_(
                    func.lower(TruckPost.equipment_type).like(func.lower(like)),
                    func.lower(TruckPost.current_location).like(func.lower(like)),
                    func.lower(TruckPost.preferred_origin).like(func.lower(like)),
                    func.lower(TruckPost.preferred_destination).like(func.lower(like)),
                ),
            )
            .limit(LIMIT).all()
        )
        for row in rows:
            equipment.append({
                "id": str(row.id),
                "equipment_type": row.equipment_type,
                "current_location": row.current_location,
                "preferred_origin": row.preferred_origin,
                "path": "/carrier/equipment",
            })
    results["equipment"] = equipment

    # ── Lane watches (carrier only) ────────────────────────────────────────────
    lane_watches = []
    if is_carrier:
        rows = (
            db.query(LaneWatch)
            .filter(
                LaneWatch.carrier_id == uid,
                or_(
                    func.lower(LaneWatch.origin_city).like(func.lower(like)),
                    func.lower(LaneWatch.origin_state).like(func.lower(like)),
                    func.lower(LaneWatch.dest_city).like(func.lower(like)),
                    func.lower(LaneWatch.dest_state).like(func.lower(like)),
                    func.lower(LaneWatch.equipment_type).like(func.lower(like)),
                ),
            )
            .limit(LIMIT).all()
        )
        for row in rows:
            lane_watches.append({
                "id": str(row.id),
                "origin_city": row.origin_city,
                "origin_state": row.origin_state,
                "dest_city": row.dest_city,
                "dest_state": row.dest_state,
                "equipment_type": row.equipment_type,
                "path": "/carrier/lane-watches",
            })
    results["lane_watches"] = lane_watches

    # ── Documents ─────────────────────────────────────────────────────────────
    documents = []
    doc_rows = (
        db.query(LoadDocument)
        .filter(
            LoadDocument.uploader_id == uid,
            or_(
                func.lower(LoadDocument.file_name).like(func.lower(like)),
                func.lower(LoadDocument.doc_type).like(func.lower(like)),
            ),
        )
        .limit(LIMIT).all()
    )
    for row in doc_rows:
        documents.append({
            "id": str(row.id),
            "file_name": row.file_name,
            "doc_type": row.doc_type,
            "path": f"/{current_user.role}/loads",
        })
    results["documents"] = documents

    # ── Drivers (carrier only) ────────────────────────────────────────────────
    drivers = []
    if is_carrier:
        rows = (
            db.query(User)
            .filter(
                User.carrier_id == uid,
                User.role == UserRole.driver,
                func.lower(User.name).like(func.lower(like)),
            )
            .limit(LIMIT).all()
        )
        for row in rows:
            drivers.append({
                "id": str(row.id),
                "name": row.name,
                "path": "/carrier/drivers",
            })
    results["drivers"] = drivers

    return results
