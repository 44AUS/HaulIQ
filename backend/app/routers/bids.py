from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from app.database import get_db
from app.middleware.auth import get_current_user, require_carrier, require_broker
from app.models.user import User
from app.models.booking import Bid, BidStatus
from app.models.load import Load

router = APIRouter()


class PlaceBidRequest(BaseModel):
    load_id: UUID
    amount: float
    note: Optional[str] = None


class CounterBidRequest(BaseModel):
    counter_amount: float
    counter_note: Optional[str] = None


class BidOut(BaseModel):
    id: UUID
    load_id: UUID
    carrier_id: UUID
    carrier_name: Optional[str] = None
    carrier_mc: Optional[str] = None
    amount: float
    note: Optional[str]
    status: BidStatus
    counter_amount: Optional[float]
    counter_note: Optional[str]
    created_at: datetime
    model_config = {"from_attributes": True}


@router.post("/", response_model=BidOut)
def place_bid(
    payload: PlaceBidRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_carrier),
):
    load = db.query(Load).filter(Load.id == payload.load_id).first()
    if not load:
        raise HTTPException(status_code=404, detail="Load not found")

    existing = db.query(Bid).filter(
        Bid.load_id == payload.load_id,
        Bid.carrier_id == current_user.id,
        Bid.status == BidStatus.pending,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="You already have a pending bid on this load.")

    bid = Bid(load_id=payload.load_id, carrier_id=current_user.id, amount=payload.amount, note=payload.note)
    db.add(bid)
    db.commit()
    db.refresh(bid)
    return bid


@router.get("/load/{load_id}", response_model=list[BidOut])
def get_bids_for_load(
    load_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    bids = db.query(Bid).filter(Bid.load_id == load_id).order_by(Bid.created_at.desc()).all()
    result = []
    for bid in bids:
        carrier = db.query(User).filter(User.id == bid.carrier_id).first()
        result.append(BidOut(
            id=bid.id,
            load_id=bid.load_id,
            carrier_id=bid.carrier_id,
            carrier_name=carrier.company or carrier.name if carrier else None,
            carrier_mc=carrier.mc_number if carrier else None,
            amount=bid.amount,
            note=bid.note,
            status=bid.status,
            counter_amount=bid.counter_amount,
            counter_note=bid.counter_note,
            created_at=bid.created_at,
        ))
    return result


@router.get("/my", response_model=list[BidOut])
def my_bids(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_carrier),
):
    return db.query(Bid).filter(Bid.carrier_id == current_user.id).order_by(Bid.created_at.desc()).all()


@router.patch("/{bid_id}/accept", response_model=BidOut)
def accept_bid(
    bid_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_broker),
):
    bid = db.query(Bid).filter(Bid.id == bid_id).first()
    if not bid:
        raise HTTPException(status_code=404, detail="Bid not found")
    bid.status = BidStatus.accepted
    db.commit()
    db.refresh(bid)
    return bid


@router.patch("/{bid_id}/reject", response_model=BidOut)
def reject_bid(
    bid_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_broker),
):
    bid = db.query(Bid).filter(Bid.id == bid_id).first()
    if not bid:
        raise HTTPException(status_code=404, detail="Bid not found")
    bid.status = BidStatus.rejected
    db.commit()
    db.refresh(bid)
    return bid


@router.patch("/{bid_id}/counter", response_model=BidOut)
def counter_bid(
    bid_id: UUID,
    payload: CounterBidRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_broker),
):
    bid = db.query(Bid).filter(Bid.id == bid_id).first()
    if not bid:
        raise HTTPException(status_code=404, detail="Bid not found")
    bid.status = BidStatus.countered
    bid.counter_amount = payload.counter_amount
    bid.counter_note = payload.counter_note
    db.commit()
    db.refresh(bid)
    return bid


@router.delete("/{bid_id}", status_code=204)
def withdraw_bid(
    bid_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_carrier),
):
    bid = db.query(Bid).filter(Bid.id == bid_id, Bid.carrier_id == current_user.id).first()
    if not bid:
        raise HTTPException(status_code=404, detail="Bid not found")
    bid.status = BidStatus.withdrawn
    db.commit()
