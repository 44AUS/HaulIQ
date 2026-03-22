from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID
from pydantic import BaseModel

from app.database import get_db
from app.middleware.auth import get_current_user, require_broker
from app.models.user import User, UserRole
from app.models.network import BrokerNetwork

router = APIRouter()


class AddToNetworkRequest(BaseModel):
    carrier_id: UUID


class RespondRequest(BaseModel):
    accepted: bool


def _fmt(r, current_user):
    """Return the other party's info from a BrokerNetwork row."""
    if str(current_user.id) == str(r.broker_id):
        return {
            "id": str(r.id),
            "user_id": str(r.carrier_id),
            "name": r.carrier.name,
            "company": r.carrier.company,
            "mc_number": r.carrier.mc_number,
            "role": "carrier",
            "status": r.status,
            "created_at": r.created_at.isoformat(),
        }
    return {
        "id": str(r.id),
        "user_id": str(r.broker_id),
        "name": r.broker.name,
        "company": r.broker.company,
        "mc_number": r.broker.mc_number,
        "role": "broker",
        "status": r.status,
        "created_at": r.created_at.isoformat(),
    }


@router.get("/", summary="List accepted network connections")
def list_network(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Returns only accepted connections (used for messaging contact list)."""
    if current_user.role.value == "broker":
        rows = db.query(BrokerNetwork).filter(
            BrokerNetwork.broker_id == current_user.id,
            BrokerNetwork.status == 'accepted',
        ).all()
    else:
        rows = db.query(BrokerNetwork).filter(
            BrokerNetwork.carrier_id == current_user.id,
            BrokerNetwork.status == 'accepted',
        ).all()
    return [_fmt(r, current_user) for r in rows]


@router.get("/requests", summary="Pending network requests for the current user")
def pending_requests(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Returns inbound pending requests that the current user needs to respond to."""
    if current_user.role.value == "broker":
        # Brokers don't receive requests — they send them
        return []
    # Carriers see requests from brokers
    rows = db.query(BrokerNetwork).filter(
        BrokerNetwork.carrier_id == current_user.id,
        BrokerNetwork.status == 'pending',
    ).all()
    return [_fmt(r, current_user) for r in rows]


@router.post("/", status_code=201, summary="Send a network connection request")
def add_to_network(
    payload: AddToNetworkRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_broker),
):
    carrier = db.query(User).filter(
        User.id == payload.carrier_id,
        User.role == UserRole.carrier,
    ).first()
    if not carrier:
        raise HTTPException(status_code=404, detail="Carrier not found")

    existing = db.query(BrokerNetwork).filter(
        BrokerNetwork.broker_id == current_user.id,
        BrokerNetwork.carrier_id == payload.carrier_id,
    ).first()
    if existing:
        return {"id": str(existing.id), "status": existing.status, "message": "Request already sent"}

    entry = BrokerNetwork(
        broker_id=current_user.id,
        carrier_id=payload.carrier_id,
        status='pending',
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return {"id": str(entry.id), "status": "pending", "message": f"Request sent to {carrier.name}"}


@router.patch("/{entry_id}/respond", summary="Accept or decline a network request")
def respond_to_request(
    entry_id: UUID,
    payload: RespondRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    entry = db.query(BrokerNetwork).filter(BrokerNetwork.id == entry_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Request not found")
    # Only the carrier (recipient) can respond
    if str(entry.carrier_id) != str(current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized")
    if entry.status != 'pending':
        raise HTTPException(status_code=400, detail="Request already responded to")

    entry.status = 'accepted' if payload.accepted else 'declined'
    db.commit()
    return {"id": str(entry.id), "status": entry.status}


@router.delete("/{entry_id}", status_code=204, summary="Remove a network connection")
def remove_from_network(
    entry_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    entry = db.query(BrokerNetwork).filter(BrokerNetwork.id == entry_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Not found")
    # Both parties can remove
    if str(entry.broker_id) != str(current_user.id) and str(entry.carrier_id) != str(current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized")
    db.delete(entry)
    db.commit()


@router.get("/check/{carrier_id}", summary="Check connection status with a carrier")
def check_in_network(
    carrier_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_broker),
):
    entry = db.query(BrokerNetwork).filter(
        BrokerNetwork.broker_id == current_user.id,
        BrokerNetwork.carrier_id == carrier_id,
    ).first()
    if not entry:
        return {"status": "none", "entry_id": None}
    return {"status": entry.status, "entry_id": str(entry.id)}
