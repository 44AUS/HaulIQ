from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from uuid import UUID
from pydantic import BaseModel
from typing import Optional

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.user import User, UserRole
from app.models.network import BrokerNetwork

router = APIRouter()


class AddToNetworkRequest(BaseModel):
    other_user_id: UUID


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
            "avatar_url": r.carrier.avatar_url,
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
        "avatar_url": r.broker.avatar_url,
        "role": "broker",
        "status": r.status,
        "created_at": r.created_at.isoformat(),
    }


def _with_status(u: User, current_user: User, db: Session) -> dict:
    """Build a user dict with their connection status relative to current_user."""
    if current_user.role == UserRole.broker:
        conn = db.query(BrokerNetwork).filter(
            BrokerNetwork.broker_id == current_user.id,
            BrokerNetwork.carrier_id == u.id,
        ).first()
    else:
        conn = db.query(BrokerNetwork).filter(
            BrokerNetwork.broker_id == u.id,
            BrokerNetwork.carrier_id == current_user.id,
        ).first()
    return {
        "id": str(u.id),
        "user_id": str(u.id),
        "name": u.name,
        "company": u.company,
        "mc_number": u.mc_number,
        "avatar_url": getattr(u, "avatar_url", None),
        "role": u.role.value,
        "connection_status": conn.status if conn else None,
        "connection_id": str(conn.id) if conn else None,
    }


@router.get("/search", summary="Search users to connect with")
def search_users(
    q: str = Query(""),
    role: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    opposite = UserRole.carrier if current_user.role == UserRole.broker else UserRole.broker
    # Only allow filtering to the opposite role — same-role connections are not supported
    target_role = UserRole(role) if role in ("broker", "carrier") and UserRole(role) == opposite else opposite
    query = db.query(User).filter(
        User.id != current_user.id,
        User.role == target_role,
    )
    if q:
        query = query.filter(
            User.name.ilike(f"%{q}%") |
            User.company.ilike(f"%{q}%") |
            User.mc_number.ilike(f"%{q}%") |
            User.email.ilike(f"%{q}%")
        )
    users = query.limit(20).all()
    return [_with_status(u, current_user, db) for u in users]


@router.get("/suggestions", summary="People you may want to connect with")
def get_suggestions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Returns up to 8 non-connected users of the opposite role."""
    if current_user.role == UserRole.broker:
        connected_ids = {
            r.carrier_id
            for r in db.query(BrokerNetwork.carrier_id)
            .filter(BrokerNetwork.broker_id == current_user.id)
            .all()
        }
        target_role = UserRole.carrier
    else:
        connected_ids = {
            r.broker_id
            for r in db.query(BrokerNetwork.broker_id)
            .filter(BrokerNetwork.carrier_id == current_user.id)
            .all()
        }
        target_role = UserRole.broker

    q = db.query(User).filter(
        User.role == target_role,
        User.id != current_user.id,
    )
    if connected_ids:
        q = q.filter(~User.id.in_(connected_ids))

    users = q.order_by(func.random()).limit(8).all()
    return [_with_status(u, current_user, db) for u in users]


@router.get("/", summary="List accepted network connections")
def list_network(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
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


@router.get("/requests", summary="Pending inbound network requests for the current user")
def pending_requests(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role.value == "broker":
        rows = db.query(BrokerNetwork).filter(
            BrokerNetwork.broker_id == current_user.id,
            BrokerNetwork.status == 'pending',
            BrokerNetwork.initiated_by_id != current_user.id,
            BrokerNetwork.initiated_by_id != None,  # noqa: E711 — only new carrier-initiated
        ).all()
    else:
        rows = db.query(BrokerNetwork).filter(
            BrokerNetwork.carrier_id == current_user.id,
            BrokerNetwork.status == 'pending',
            or_(
                BrokerNetwork.initiated_by_id == None,       # legacy broker-initiated
                BrokerNetwork.initiated_by_id != current_user.id,  # explicit broker-initiated
            ),
        ).all()
    return [_fmt(r, current_user) for r in rows]


@router.post("/", status_code=201, summary="Send a network connection request")
def add_to_network(
    payload: AddToNetworkRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    other = db.query(User).filter(User.id == payload.other_user_id).first()
    if not other:
        raise HTTPException(status_code=404, detail="User not found")

    if current_user.role == UserRole.broker and other.role == UserRole.carrier:
        broker_id, carrier_id = current_user.id, other.id
    elif current_user.role == UserRole.carrier and other.role == UserRole.broker:
        broker_id, carrier_id = other.id, current_user.id
    else:
        raise HTTPException(status_code=400, detail="Connections can only be made between brokers and carriers")

    existing = db.query(BrokerNetwork).filter(
        BrokerNetwork.broker_id == broker_id,
        BrokerNetwork.carrier_id == carrier_id,
    ).first()
    if existing:
        return {"id": str(existing.id), "status": existing.status}

    entry = BrokerNetwork(
        broker_id=broker_id,
        carrier_id=carrier_id,
        status='pending',
        initiated_by_id=current_user.id,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return {"id": str(entry.id), "status": "pending"}


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
    # The recipient (the party who did NOT initiate) can respond
    if str(entry.initiated_by_id or entry.broker_id) == str(current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized")
    if str(entry.broker_id) != str(current_user.id) and str(entry.carrier_id) != str(current_user.id):
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
    if str(entry.broker_id) != str(current_user.id) and str(entry.carrier_id) != str(current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized")
    db.delete(entry)
    db.commit()


@router.get("/check/{carrier_id}", summary="Check connection status with a user")
def check_in_network(
    carrier_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    entry = db.query(BrokerNetwork).filter(
        BrokerNetwork.broker_id == current_user.id,
        BrokerNetwork.carrier_id == carrier_id,
    ).first()
    if not entry:
        entry = db.query(BrokerNetwork).filter(
            BrokerNetwork.broker_id == carrier_id,
            BrokerNetwork.carrier_id == current_user.id,
        ).first()
    if not entry:
        return {"status": "none", "entry_id": None}
    return {"status": entry.status, "entry_id": str(entry.id)}
