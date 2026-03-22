from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID
from pydantic import BaseModel
from typing import Optional

from app.database import get_db
from app.middleware.auth import get_current_user, require_broker
from app.models.user import User, UserRole
from app.models.network import BrokerNetwork

router = APIRouter()


class AddToNetworkRequest(BaseModel):
    carrier_id: UUID


@router.get("/", summary="List my network connections")
def list_network(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Brokers see carriers they've added; carriers see brokers who added them."""
    if current_user.role.value == "broker":
        rows = db.query(BrokerNetwork).filter(BrokerNetwork.broker_id == current_user.id).all()
        return [
            {
                "id": str(r.id),
                "user_id": str(r.carrier_id),
                "name": r.carrier.name,
                "company": r.carrier.company,
                "mc_number": r.carrier.mc_number,
                "role": "carrier",
                "created_at": r.created_at.isoformat(),
            }
            for r in rows
        ]
    else:
        rows = db.query(BrokerNetwork).filter(BrokerNetwork.carrier_id == current_user.id).all()
        return [
            {
                "id": str(r.id),
                "user_id": str(r.broker_id),
                "name": r.broker.name,
                "company": r.broker.company,
                "mc_number": r.broker.mc_number,
                "role": "broker",
                "created_at": r.created_at.isoformat(),
            }
            for r in rows
        ]


@router.post("/", status_code=201, summary="Add carrier to broker network")
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
        return {"id": str(existing.id), "message": "Already in your network"}

    entry = BrokerNetwork(broker_id=current_user.id, carrier_id=payload.carrier_id)
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return {"id": str(entry.id), "message": f"{carrier.name} added to your network"}


@router.delete("/{entry_id}", status_code=204, summary="Remove from network")
def remove_from_network(
    entry_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_broker),
):
    entry = db.query(BrokerNetwork).filter(
        BrokerNetwork.id == entry_id,
        BrokerNetwork.broker_id == current_user.id,
    ).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(entry)
    db.commit()


@router.get("/check/{carrier_id}", summary="Check if a carrier is in broker's network")
def check_in_network(
    carrier_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_broker),
):
    exists = db.query(BrokerNetwork).filter(
        BrokerNetwork.broker_id == current_user.id,
        BrokerNetwork.carrier_id == carrier_id,
    ).first()
    return {"in_network": bool(exists), "entry_id": str(exists.id) if exists else None}
