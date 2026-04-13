from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from app.database import get_db
from app.middleware.auth import get_current_user, require_carrier, require_broker
from app.models.user import User
from app.models.booking import Booking, BookingStatus, TMSStatus, CheckCallLog
from app.models.load import Load, LoadStatus
from app.models.broker import Broker
from app.models.messaging import Conversation, Message
from app.models.analytics import LoadHistory
from app.models.notification import NotificationType
from app.utils.notify import create_notification

router = APIRouter()


class BookNowRequest(BaseModel):
    load_id: UUID
    note: Optional[str] = None
    is_instant: bool = False


class ReviewBookingRequest(BaseModel):
    approved: bool
    broker_note: Optional[str] = None


class DispatchRequest(BaseModel):
    driver_name:           Optional[str] = None
    driver_phone:          Optional[str] = None
    dispatch_notes:        Optional[str] = None
    carrier_visible_notes: Optional[str] = None


class TMSStatusRequest(BaseModel):
    tms_status: TMSStatus


class BookingOut(BaseModel):
    id: UUID
    load_id: UUID
    carrier_id: UUID
    carrier_name: Optional[str] = None
    carrier_mc: Optional[str] = None
    status: BookingStatus
    is_instant: str
    note: Optional[str]
    broker_note: Optional[str]
    created_at: datetime
    model_config = {"from_attributes": True}


@router.post("/", response_model=BookingOut)
def request_booking(
    payload: BookNowRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_carrier),
):
    load = db.query(Load).filter(Load.id == payload.load_id, Load.status == LoadStatus.active).first()
    if not load:
        raise HTTPException(status_code=404, detail="Load not found or no longer available")

    existing = db.query(Booking).filter(
        Booking.load_id == payload.load_id,
        Booking.carrier_id == current_user.id,
        Booking.status == BookingStatus.pending,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="You already have a pending booking request for this load.")

    is_instant = payload.is_instant or load.instant_book
    status = BookingStatus.approved if is_instant else BookingStatus.pending

    booking = Booking(
        load_id=payload.load_id,
        carrier_id=current_user.id,
        status=status,
        is_instant=str(is_instant).lower(),
        note=payload.note,
    )
    db.add(booking)

    if is_instant:
        load.status = LoadStatus.filled

    db.flush()

    # Notify broker of new booking request (or instant book confirmation)
    if load.broker_user_id:
        carrier_name = current_user.company or current_user.name
        route = f"{load.origin} → {load.destination}"
        if is_instant:
            create_notification(
                db, load.broker_user_id, NotificationType.new_booking_request,
                title=f"Instant book: {route}",
                body=f"{carrier_name} instantly booked your load on {route}.",
                data={"load_id": str(load.id)},
            )
        else:
            create_notification(
                db, load.broker_user_id, NotificationType.new_booking_request,
                title=f"New booking request on {route}",
                body=f"{carrier_name} requested to book your load on {route}.",
                data={"load_id": str(load.id)},
            )

    db.commit()
    db.refresh(booking)
    return booking


@router.get("/my", response_model=list[BookingOut])
def my_bookings(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_carrier),
):
    return db.query(Booking).filter(Booking.carrier_id == current_user.id).order_by(Booking.created_at.desc()).all()


@router.get("/pending", response_model=list[BookingOut])
def pending_bookings(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_broker),
):
    from app.models.load import Load
    broker_load_ids = [l.id for l in db.query(Load).filter(Load.broker_user_id == current_user.id).all()]
    bookings = (
        db.query(Booking)
        .filter(Booking.load_id.in_(broker_load_ids), Booking.status == BookingStatus.pending)
        .order_by(Booking.created_at.desc())
        .all()
    )
    result = []
    for b in bookings:
        carrier = db.query(User).filter(User.id == b.carrier_id).first()
        out = BookingOut.model_validate(b)
        if carrier:
            out.carrier_name = carrier.company or carrier.name
            out.carrier_mc = carrier.mc_number
        result.append(out)
    return result


@router.get("/in-progress", summary="Carrier: active bookings with load details")
def carrier_in_progress(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_carrier),
):
    bookings = (
        db.query(Booking)
        .filter(
            Booking.carrier_id == current_user.id,
            Booking.status.in_([BookingStatus.pending, BookingStatus.approved, BookingStatus.in_transit]),
        )
        .order_by(Booking.created_at.desc())
        .all()
    )
    result = []
    for bk in bookings:
        load = db.query(Load).filter(Load.id == bk.load_id).first()
        if not load:
            continue
        broker_name = load.broker.name if load.broker else None
        result.append({
            "id": str(load.id),
            "booking_id": str(bk.id),
            "status": (
                "quoted"     if bk.status == BookingStatus.pending    else
                "in_transit" if bk.status == BookingStatus.in_transit else
                "booked"
            ),
            "load_type": load.load_type.value if load.load_type else None,
            "origin": load.origin,
            "destination": load.destination,
            "miles": load.miles,
            "pickup_date": str(load.pickup_date) if load.pickup_date else None,
            "delivery_date": str(load.delivery_date) if load.delivery_date else None,
            "rate": load.rate,
            "rate_per_mile": load.rate_per_mile,
            "net_profit_est": load.net_profit_est,
            "commodity": load.commodity,
            "weight_lbs": load.weight_lbs,
            "broker_name": broker_name,
            "note": bk.note,
            "tms_status": bk.tms_status.value if bk.tms_status else None,
            "created_at": bk.created_at.isoformat() if bk.created_at else None,
        })
    return result


@router.get("/completed", summary="Carrier: completed bookings with load details")
def carrier_completed(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_carrier),
):
    bookings = (
        db.query(Booking)
        .filter(
            Booking.carrier_id == current_user.id,
            Booking.status == BookingStatus.completed,
        )
        .order_by(Booking.updated_at.desc())
        .all()
    )
    result = []
    for bk in bookings:
        load = db.query(Load).filter(Load.id == bk.load_id).first()
        if not load:
            continue
        broker_name = load.broker.name if load.broker else None
        result.append({
            "booking_id": str(bk.id),
            "load_type": load.load_type.value if load.load_type else None,
            "origin": load.origin,
            "destination": load.destination,
            "miles": load.miles,
            "rate": load.rate,
            "broker_name": broker_name,
            "completed_at": bk.updated_at.isoformat() if bk.updated_at else None,
        })
    return result


@router.get("/broker-active", summary="Broker: active+filled loads with carrier info")
def broker_active_loads(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_broker),
):
    loads = (
        db.query(Load)
        .filter(
            Load.broker_user_id == current_user.id,
            Load.status.in_([LoadStatus.active, LoadStatus.filled]),
        )
        .order_by(Load.posted_at.desc())
        .all()
    )
    result = []
    for load in loads:
        # Find the active booking (approved, in_transit, or completed)
        booking = (
            db.query(Booking)
            .filter(
                Booking.load_id == load.id,
                Booking.status.in_([
                    BookingStatus.approved,
                    BookingStatus.in_transit,
                    BookingStatus.completed,
                ]),
            )
            .order_by(Booking.created_at.desc())
            .first()
        )
        carrier_id = carrier_name = carrier_mc = None
        if booking:
            carrier = db.query(User).filter(User.id == booking.carrier_id).first()
            if carrier:
                carrier_id = str(carrier.id)
                carrier_name = carrier.company or carrier.name
                carrier_mc = carrier.mc_number

        if booking and booking.status == BookingStatus.in_transit:
            status = "in_transit"
        elif booking and booking.status == BookingStatus.completed:
            status = "delivered"
        elif booking:
            status = "booked"
        else:
            status = "available"

        result.append({
            "id": str(load.id),
            "booking_id": str(booking.id) if booking else None,
            "status": status,
            "load_type": load.load_type.value if load.load_type else None,
            "origin": load.origin,
            "destination": load.destination,
            "miles": load.miles,
            "pickup_date": str(load.pickup_date) if load.pickup_date else None,
            "delivery_date": str(load.delivery_date) if load.delivery_date else None,
            "rate": load.rate,
            "rate_per_mile": load.rate_per_mile,
            "commodity": load.commodity,
            "weight_lbs": load.weight_lbs,
            "carrier_id": carrier_id,
            "carrier_name": carrier_name,
            "carrier_mc": carrier_mc,
            "pickup_lat": float(load.pickup_lat) if load.pickup_lat is not None else None,
            "pickup_lng": float(load.pickup_lng) if load.pickup_lng is not None else None,
            "delivery_lat": float(load.delivery_lat) if load.delivery_lat is not None else None,
            "delivery_lng": float(load.delivery_lng) if load.delivery_lng is not None else None,
        })
    return result


@router.get("/load/{load_id}", summary="Get active booking for a load (broker view)")
def booking_for_load(
    load_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    load = db.query(Load).filter(Load.id == load_id).first()
    if not load:
        raise HTTPException(status_code=404, detail="Load not found")

    booking = (
        db.query(Booking)
        .filter(
            Booking.load_id == load_id,
            Booking.status.in_([
                BookingStatus.pending,
                BookingStatus.approved,
                BookingStatus.in_transit,
                BookingStatus.completed,
            ]),
        )
        .order_by(Booking.created_at.desc())
        .first()
    )
    if not booking:
        return {"booking": None, "location": None}

    carrier = db.query(User).filter(User.id == booking.carrier_id).first()

    from app.models.location import CarrierLocation
    loc = db.query(CarrierLocation).filter(CarrierLocation.booking_id == booking.id).first()

    return {
        "booking": {
            "id":           str(booking.id),
            "status":       booking.status.value,
            "carrier_id":   str(carrier.id) if carrier else None,
            "carrier_name": (carrier.company or carrier.name) if carrier else None,
            "carrier_mc":   carrier.mc_number if carrier else None,
            "created_at":   booking.created_at,
        },
        "location": {
            "lat":        loc.lat,
            "lng":        loc.lng,
            "updated_at": loc.updated_at,
        } if loc else None,
    }


@router.get("/dispatcher", summary="Broker: dispatcher board — all active shipments with TMS info")
def dispatcher_board(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_broker),
):
    broker_load_ids = [
        l.id for l in db.query(Load).filter(Load.broker_user_id == current_user.id).all()
    ]
    bookings = (
        db.query(Booking)
        .filter(
            Booking.load_id.in_(broker_load_ids),
            Booking.status.in_([BookingStatus.approved, BookingStatus.in_transit, BookingStatus.completed]),
        )
        .order_by(Booking.created_at.desc())
        .all()
    )
    result = []
    for bk in bookings:
        load = db.query(Load).filter(Load.id == bk.load_id).first()
        if not load:
            continue
        carrier = db.query(User).filter(User.id == bk.carrier_id).first()
        last_call = (
            db.query(CheckCallLog)
            .filter(CheckCallLog.booking_id == bk.id)
            .order_by(CheckCallLog.created_at.desc())
            .first()
        )
        result.append({
            "booking_id":   str(bk.id),
            "load_id":      str(load.id),
            "origin":       load.origin,
            "destination":  load.destination,
            "rate":         load.rate,
            "pickup_date":  str(load.pickup_date) if load.pickup_date else None,
            "booking_status": bk.status.value,
            "tms_status":   bk.tms_status.value if bk.tms_status else None,
            "driver_name":  bk.driver_name,
            "driver_phone": bk.driver_phone,
            "carrier_name": (carrier.company or carrier.name) if carrier else None,
            "carrier_mc":   carrier.mc_number if carrier else None,
            "dispatched_at":     bk.dispatched_at,
            "picked_up_at":      bk.picked_up_at,
            "in_transit_at":     bk.in_transit_at,
            "delivered_at":      bk.delivered_at,
            "pod_received_at":   bk.pod_received_at,
            "last_check_call":   last_call.note if last_call else None,
            "last_call_at":      last_call.created_at if last_call else None,
        })
    return result


@router.get("/{booking_id}", summary="Get single booking with load details")
def get_booking(
    booking_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking.carrier_id != current_user.id:
        load = db.query(Load).filter(Load.id == booking.load_id).first()
        if not load or load.broker_user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Forbidden")

    load = db.query(Load).filter(Load.id == booking.load_id).first()
    broker_name = broker_mc = broker_phone = broker_email = None
    if load and load.broker:
        broker = load.broker
        broker_user = broker.user
        broker_name  = broker.name
        broker_mc    = broker.mc_number or (broker_user.mc_number if broker_user else None)
        broker_phone = (broker_user.phone if broker_user else None)
        broker_email = (broker_user.email if broker_user else None)

    carrier = db.query(User).filter(User.id == booking.carrier_id).first()

    return {
        "id": str(booking.id),
        "status": booking.status,
        "is_instant": booking.is_instant,
        "note": booking.note,
        "broker_note": booking.broker_note,
        "created_at": booking.created_at,
        # TMS fields
        "tms_status":            booking.tms_status.value if booking.tms_status else None,
        "driver_name":           booking.driver_name,
        "driver_phone":          booking.driver_phone,
        "carrier_visible_notes": booking.carrier_visible_notes,
        "dispatched_at":         booking.dispatched_at,
        "picked_up_at":          booking.picked_up_at,
        "delivered_at":          booking.delivered_at,
        "pod_received_at":       booking.pod_received_at,
        "load": {
            "id": str(load.id),
            "origin": load.origin,
            "destination": load.destination,
            "miles": load.miles,
            "deadhead_miles": load.deadhead_miles,
            "rate": load.rate,
            "rate_per_mile": load.rate_per_mile,
            "fuel_cost_est": load.fuel_cost_est,
            "net_profit_est": load.net_profit_est,
            "load_type": load.load_type.value if load.load_type else None,
            "commodity": load.commodity,
            "weight_lbs": load.weight_lbs,
            "pickup_date": str(load.pickup_date) if load.pickup_date else None,
            "delivery_date": str(load.delivery_date) if load.delivery_date else None,
            "dimensions": load.dimensions,
            "notes": load.notes,
            "broker_name": broker_name,
            "broker_mc": broker_mc,
            "broker_phone": broker_phone,
            "broker_email": broker_email,
            "broker_user_id": str(load.broker_user_id) if load.broker_user_id else None,
        } if load else None,
        "carrier_name": (carrier.company or carrier.name) if carrier else None,
    }


def _notify_broker(db, booking, load, carrier_user, body: str):
    """Find or create a conversation for this load and send a system message from carrier to broker."""
    if not load or not load.broker_user_id:
        return
    convo = db.query(Conversation).filter(
        Conversation.load_id == load.id,
        Conversation.carrier_id == carrier_user.id,
        Conversation.broker_id == load.broker_user_id,
    ).first()
    if not convo:
        convo = Conversation(
            load_id=load.id,
            carrier_id=carrier_user.id,
            broker_id=load.broker_user_id,
        )
        db.add(convo)
        db.flush()
    msg = Message(
        conversation_id=convo.id,
        sender_id=carrier_user.id,
        body=body,
        is_read=False,
    )
    db.add(msg)


@router.patch("/{booking_id}/pickup", summary="Carrier: confirm load pickup → in transit")
def confirm_pickup(
    booking_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_carrier),
):
    booking = db.query(Booking).filter(
        Booking.id == booking_id,
        Booking.carrier_id == current_user.id,
        Booking.status == BookingStatus.approved,
    ).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found or not in approved state")
    booking.status = BookingStatus.in_transit
    load = db.query(Load).filter(Load.id == booking.load_id).first()
    carrier_name = current_user.company or current_user.name
    route = f"{load.origin} → {load.destination}" if load else "your load"
    _notify_broker(db, booking, load, current_user,
        f"✅ Pickup confirmed — {carrier_name} has picked up {route} and is now in transit.")
    db.commit()
    return {"status": booking.status}


@router.patch("/{booking_id}/deliver", summary="Carrier: confirm delivery → completed")
def confirm_delivery(
    booking_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_carrier),
):
    booking = db.query(Booking).filter(
        Booking.id == booking_id,
        Booking.carrier_id == current_user.id,
        Booking.status == BookingStatus.in_transit,
    ).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found or not in transit")
    booking.status = BookingStatus.completed
    load = db.query(Load).filter(Load.id == booking.load_id).first()
    carrier_name = current_user.company or current_user.name
    route = f"{load.origin} → {load.destination}" if load else "your load"
    _notify_broker(db, booking, load, current_user,
        f"🏁 Delivery confirmed — {carrier_name} has delivered {route}. Load complete.")

    # Auto-create LoadHistory entry so carrier's history is populated
    if load:
        already = db.query(LoadHistory).filter_by(
            carrier_id=current_user.id, load_id=load.id
        ).first()
        if not already:
            gross = load.rate or 0.0
            miles = load.miles or 1
            rpm = round(gross / miles, 4) if miles else 0.0
            origin_state = (load.origin or '').split(',')[-1].strip()[:2].upper() or None
            dest_state = (load.destination or '').split(',')[-1].strip()[:2].upper() or None
            lane_key = f"{origin_state}_{dest_state}" if origin_state and dest_state else None
            broker_obj = db.query(Broker).filter(Broker.user_id == load.broker_user_id).first()
            broker_name = broker_obj.name if broker_obj else None
            history_entry = LoadHistory(
                carrier_id=current_user.id,
                load_id=load.id,
                origin=load.origin,
                origin_state=origin_state,
                destination=load.destination,
                dest_state=dest_state,
                lane_key=lane_key,
                miles=load.miles or 0,
                deadhead_miles=load.deadhead_miles or 0,
                load_type=load.load_type,
                broker_name=broker_name,
                gross_revenue=gross,
                fuel_cost=None,
                net_profit=gross,
                rate_per_mile=rpm,
                net_per_mile=rpm,
                pickup_date=load.pickup_date,
                delivery_date=load.delivery_date,
                accepted_at=datetime.utcnow(),
            )
            db.add(history_entry)

    db.commit()
    return {"status": booking.status}


@router.patch("/{booking_id}/review", response_model=BookingOut)
def review_booking(
    booking_id: UUID,
    payload: ReviewBookingRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_broker),
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    booking.status = BookingStatus.approved if payload.approved else BookingStatus.denied
    booking.broker_note = payload.broker_note

    load = db.query(Load).filter(Load.id == booking.load_id).first()
    if payload.approved and load:
        load.status = LoadStatus.filled

    # Notify carrier of decision
    route = f"{load.origin} → {load.destination}" if load else "a load"
    notif_type = NotificationType.booking_approved if payload.approved else NotificationType.booking_denied
    title = "Booking approved!" if payload.approved else "Booking not approved"
    body_text = (
        f"Your booking request for {route} was approved. Check your active loads."
        if payload.approved
        else f"Your booking request for {route} was not approved."
    )
    create_notification(
        db, booking.carrier_id, notif_type,
        title=title, body=body_text,
        data={"load_id": str(booking.load_id), "booking_id": str(booking.id)},
    )

    db.commit()
    db.refresh(booking)
    return booking


# ── TMS Endpoints ─────────────────────────────────────────────────────────────

@router.patch("/{booking_id}/dispatch", summary="Broker: assign driver and dispatch a booking")
def dispatch_booking(
    booking_id: UUID,
    payload: DispatchRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_broker),
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    load = db.query(Load).filter(Load.id == booking.load_id).first()
    if not load or str(load.broker_user_id) != str(current_user.id):
        raise HTTPException(status_code=403, detail="Forbidden")

    if payload.driver_name is not None:
        booking.driver_name = payload.driver_name
    if payload.driver_phone is not None:
        booking.driver_phone = payload.driver_phone
    if payload.dispatch_notes is not None:
        booking.dispatch_notes = payload.dispatch_notes
    if payload.carrier_visible_notes is not None:
        booking.carrier_visible_notes = payload.carrier_visible_notes

    if not booking.tms_status:
        booking.tms_status = TMSStatus.dispatched
        booking.dispatched_at = datetime.utcnow()

    db.commit()
    return {
        "ok": True,
        "tms_status":   booking.tms_status.value,
        "driver_name":  booking.driver_name,
        "driver_phone": booking.driver_phone,
        "dispatched_at": booking.dispatched_at,
    }


@router.patch("/{booking_id}/tms-status", summary="Advance TMS milestone status")
def update_tms_status(
    booking_id: UUID,
    payload: TMSStatusRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    load = db.query(Load).filter(Load.id == booking.load_id).first()
    is_carrier = str(booking.carrier_id) == str(current_user.id)
    is_broker  = load and str(load.broker_user_id) == str(current_user.id)

    if not (is_carrier or is_broker):
        raise HTTPException(status_code=403, detail="Forbidden")

    carrier_allowed = {TMSStatus.picked_up, TMSStatus.in_transit, TMSStatus.delivered}
    broker_allowed  = {TMSStatus.pod_received}

    if is_carrier and payload.tms_status not in carrier_allowed:
        raise HTTPException(status_code=403, detail="Carriers can only set picked_up, in_transit, or delivered")
    if is_broker and not is_carrier and payload.tms_status not in broker_allowed:
        raise HTTPException(status_code=403, detail="Brokers can only set pod_received")

    booking.tms_status = payload.tms_status
    now = datetime.utcnow()

    if payload.tms_status == TMSStatus.picked_up:
        booking.picked_up_at = now
        if booking.status == BookingStatus.approved:
            booking.status = BookingStatus.in_transit
            booking.in_transit_at = now

    elif payload.tms_status == TMSStatus.in_transit:
        booking.in_transit_at = now
        if booking.status == BookingStatus.approved:
            booking.status = BookingStatus.in_transit

    elif payload.tms_status == TMSStatus.delivered:
        booking.delivered_at = now
        booking.status = BookingStatus.completed
        if load:
            already = db.query(LoadHistory).filter_by(
                carrier_id=booking.carrier_id, load_id=load.id
            ).first()
            if not already:
                gross = load.rate or 0.0
                miles = load.miles or 1
                rpm   = round(gross / miles, 4) if miles else 0.0
                origin_state = (load.origin or '').split(',')[-1].strip()[:2].upper() or None
                dest_state   = (load.destination or '').split(',')[-1].strip()[:2].upper() or None
                lane_key     = f"{origin_state}_{dest_state}" if origin_state and dest_state else None
                broker_obj   = db.query(Broker).filter(Broker.user_id == load.broker_user_id).first()
                db.add(LoadHistory(
                    carrier_id=booking.carrier_id,
                    load_id=load.id,
                    origin=load.origin,
                    origin_state=origin_state,
                    destination=load.destination,
                    dest_state=dest_state,
                    lane_key=lane_key,
                    miles=load.miles or 0,
                    deadhead_miles=load.deadhead_miles or 0,
                    load_type=load.load_type,
                    broker_name=broker_obj.name if broker_obj else None,
                    gross_revenue=gross,
                    fuel_cost=None,
                    net_profit=gross,
                    rate_per_mile=rpm,
                    net_per_mile=rpm,
                    pickup_date=load.pickup_date,
                    delivery_date=load.delivery_date,
                    accepted_at=datetime.utcnow(),
                ))

    elif payload.tms_status == TMSStatus.pod_received:
        booking.pod_received_at = now

    db.commit()
    return {"ok": True, "tms_status": booking.tms_status.value, "booking_status": booking.status.value}


@router.get("/{booking_id}/check-calls", summary="Get check call log for a booking")
def get_check_calls(
    booking_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    load = db.query(Load).filter(Load.id == booking.load_id).first()
    is_carrier = str(booking.carrier_id) == str(current_user.id)
    is_broker  = load and str(load.broker_user_id) == str(current_user.id)
    if not (is_carrier or is_broker):
        raise HTTPException(status_code=403, detail="Forbidden")

    calls = (
        db.query(CheckCallLog)
        .filter(CheckCallLog.booking_id == booking_id)
        .order_by(CheckCallLog.created_at.asc())
        .all()
    )
    result = []
    for c in calls:
        author = db.query(User).filter(User.id == c.author_id).first()
        result.append({
            "id":          str(c.id),
            "note":        c.note,
            "author_name": (author.company or author.name) if author else "—",
            "author_role": author.role.value if author else None,
            "created_at":  c.created_at,
        })
    return result


class CheckCallRequest(BaseModel):
    note: str


@router.post("/{booking_id}/check-calls", summary="Add a check call note to a booking")
def add_check_call(
    booking_id: UUID,
    payload: CheckCallRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    load = db.query(Load).filter(Load.id == booking.load_id).first()
    is_carrier = str(booking.carrier_id) == str(current_user.id)
    is_broker  = load and str(load.broker_user_id) == str(current_user.id)
    if not (is_carrier or is_broker):
        raise HTTPException(status_code=403, detail="Forbidden")

    entry = CheckCallLog(
        booking_id=booking_id,
        author_id=current_user.id,
        note=payload.note.strip(),
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return {"ok": True, "id": str(entry.id), "created_at": entry.created_at}


# ── Archive / permanent-delete (carrier only) ─────────────────────────────────

@router.patch("/{booking_id}/archive", summary="Carrier: move completed booking to archived")
def archive_booking(
    booking_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if str(booking.carrier_id) != str(current_user.id):
        raise HTTPException(status_code=403, detail="Forbidden")
    if booking.status != BookingStatus.completed:
        raise HTTPException(status_code=400, detail="Only completed bookings can be archived")
    booking.status = BookingStatus.archived
    db.commit()
    return {"ok": True}


@router.delete("/{booking_id}", summary="Carrier: permanently delete an archived booking record")
def delete_booking(
    booking_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if str(booking.carrier_id) != str(current_user.id):
        raise HTTPException(status_code=403, detail="Forbidden")
    if booking.status != BookingStatus.archived:
        raise HTTPException(status_code=400, detail="Only archived bookings can be permanently deleted")
    db.delete(booking)
    db.commit()
    return {"ok": True}
