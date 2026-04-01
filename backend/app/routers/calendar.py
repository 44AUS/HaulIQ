from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.user import User, UserRole
from app.models.load import Load
from app.models.booking import Booking, BookingStatus

router = APIRouter()


@router.get("/events", summary="Get calendar events for current user")
def get_calendar_events(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    events = []

    if current_user.role == UserRole.carrier:
        rows = (
            db.query(Booking, Load)
            .join(Load, Load.id == Booking.load_id)
            .filter(Booking.carrier_id == current_user.id)
            .all()
        )
        for booking, load in rows:
            if booking.status == BookingStatus.completed:
                color = "#22c55e"
                status_label = "Completed"
            elif booking.status in (BookingStatus.in_transit, BookingStatus.approved):
                color = "#f97316"
                status_label = "In Progress"
            else:
                color = "#6366f1"
                status_label = "Pending"
            events.append({
                "id": str(booking.id),
                "title": f"{load.origin} → {load.destination}",
                "start": load.pickup_date.isoformat() if load.pickup_date else None,
                "end": load.delivery_date.isoformat() if load.delivery_date else None,
                "color": color,
                "status": status_label,
                "load_id": str(load.id),
                "booking_id": str(booking.id),
                "origin": load.origin,
                "destination": load.destination,
                "commodity": load.commodity,
                "rate": float(load.rate) if load.rate else None,
                "pickup_lat": load.pickup_lat,
                "pickup_lng": load.pickup_lng,
                "delivery_lat": load.delivery_lat,
                "delivery_lng": load.delivery_lng,
                "pickup_address": load.pickup_address,
                "delivery_address": load.delivery_address,
            })

    elif current_user.role == UserRole.broker:
        loads = db.query(Load).filter(Load.broker_user_id == current_user.id).all()
        for load in loads:
            booking = (
                db.query(Booking)
                .filter(
                    Booking.load_id == load.id,
                    Booking.status.in_([
                        BookingStatus.pending, BookingStatus.approved,
                        BookingStatus.in_transit, BookingStatus.completed,
                    ]),
                )
                .order_by(Booking.status)
                .first()
            )
            if booking:
                if booking.status == BookingStatus.completed:
                    color = "#22c55e"
                    status_label = "Completed"
                else:
                    color = "#f97316"
                    status_label = "In Progress"
            else:
                color = "#6366f1"
                status_label = "Unassigned"
            events.append({
                "id": str(load.id),
                "title": f"{load.origin} → {load.destination}",
                "start": load.pickup_date.isoformat() if load.pickup_date else None,
                "end": load.delivery_date.isoformat() if load.delivery_date else None,
                "color": color,
                "status": status_label,
                "load_id": str(load.id),
                "booking_id": str(booking.id) if booking else None,
                "origin": load.origin,
                "destination": load.destination,
                "commodity": load.commodity,
                "rate": float(load.rate) if load.rate else None,
                "pickup_lat": load.pickup_lat,
                "pickup_lng": load.pickup_lng,
                "delivery_lat": load.delivery_lat,
                "delivery_lng": load.delivery_lng,
                "pickup_address": load.pickup_address,
                "delivery_address": load.delivery_address,
            })

    return events
