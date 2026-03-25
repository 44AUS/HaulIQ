from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from uuid import UUID
from pydantic import BaseModel
from datetime import datetime, timezone
from typing import Optional
import time

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.user import User
from app.models.messaging import Conversation, Message
from app.models.block import UserBlock
from app.models.booking import Booking, BookingStatus
from app.models.load import Load

router = APIRouter()

# In-memory typing state: {convo_id: {user_id: timestamp}}
_typing: dict[str, dict[str, float]] = {}


class SendMessageRequest(BaseModel):
    load_id: Optional[UUID] = None
    broker_id: UUID           # For carriers: the broker's user_id. For brokers: the carrier's user_id.
    body: str


class DirectMessageRequest(BaseModel):
    other_user_id: UUID       # The user to start/open a direct conversation with
    body: Optional[str] = None


class MessageOut(BaseModel):
    id: UUID
    conversation_id: UUID
    sender_id: UUID
    body: str
    is_read: bool
    created_at: datetime
    model_config = {"from_attributes": True}


class ConversationOut(BaseModel):
    id: UUID
    load_id: Optional[UUID]
    carrier_id: UUID
    carrier_name: Optional[str] = None
    broker_id: UUID
    broker_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    messages: list[MessageOut]
    is_blocked_by_me: bool = False
    active_booking_id: Optional[UUID] = None
    model_config = {"from_attributes": True}


def _enrich(c: Conversation, db: Session = None, current_user_id=None) -> ConversationOut:
    is_blocked = False
    active_booking_id = None

    if db is not None and current_user_id is not None:
        other_id = c.broker_id if str(c.carrier_id) == str(current_user_id) else c.carrier_id
        is_blocked = db.query(UserBlock).filter_by(
            blocker_id=current_user_id, blocked_id=other_id
        ).first() is not None

        # Check for an in-transit booking between this carrier and broker
        booking = (
            db.query(Booking)
            .join(Load, Booking.load_id == Load.id)
            .filter(
                Booking.carrier_id == c.carrier_id,
                Load.broker_user_id == c.broker_id,
                Booking.status == BookingStatus.in_transit,
            )
            .first()
        )
        if booking:
            active_booking_id = booking.id

    return ConversationOut(
        id=c.id,
        load_id=c.load_id,
        carrier_id=c.carrier_id,
        carrier_name=c.carrier.name if c.carrier else None,
        broker_id=c.broker_id,
        broker_name=c.broker.name if c.broker else None,
        created_at=c.created_at,
        updated_at=c.updated_at,
        messages=[MessageOut.model_validate(m, from_attributes=True) for m in c.messages],
        is_blocked_by_me=is_blocked,
        active_booking_id=active_booking_id,
    )


@router.post("/send", response_model=MessageOut)
def send_message(
    payload: SendMessageRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role.value == "carrier":
        carrier_id = current_user.id
        broker_id = payload.broker_id
    else:
        broker_id = current_user.id
        carrier_id = payload.broker_id

    # Find or create conversation
    filters = [
        Conversation.carrier_id == carrier_id,
        Conversation.broker_id == broker_id,
    ]
    if payload.load_id:
        filters.append(Conversation.load_id == payload.load_id)
    else:
        filters.append(Conversation.load_id == None)  # noqa: E711

    convo = (
        db.query(Conversation)
        .options(joinedload(Conversation.carrier), joinedload(Conversation.broker))
        .filter(*filters)
        .first()
    )
    if not convo:
        convo = Conversation(
            load_id=payload.load_id,
            carrier_id=carrier_id,
            broker_id=broker_id,
        )
        db.add(convo)
        db.flush()

    msg = Message(conversation_id=convo.id, sender_id=current_user.id, body=payload.body)
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return msg


@router.post("/direct", summary="Start or get a direct message conversation")
def direct_conversation(
    payload: DirectMessageRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Find or create a direct (no-load) conversation with another user."""
    if current_user.role.value == "carrier":
        carrier_id = current_user.id
        broker_id = payload.other_user_id
    else:
        broker_id = current_user.id
        carrier_id = payload.other_user_id

    convo = (
        db.query(Conversation)
        .options(
            joinedload(Conversation.messages),
            joinedload(Conversation.carrier),
            joinedload(Conversation.broker),
        )
        .filter(
            Conversation.carrier_id == carrier_id,
            Conversation.broker_id == broker_id,
            Conversation.load_id == None,  # noqa: E711
        )
        .first()
    )
    if not convo:
        convo = Conversation(load_id=None, carrier_id=carrier_id, broker_id=broker_id)
        db.add(convo)
        db.flush()

    if payload.body:
        msg = Message(conversation_id=convo.id, sender_id=current_user.id, body=payload.body)
        db.add(msg)

    db.commit()
    db.refresh(convo)

    # Re-fetch with all relationships loaded
    convo = (
        db.query(Conversation)
        .options(
            joinedload(Conversation.messages),
            joinedload(Conversation.carrier),
            joinedload(Conversation.broker),
        )
        .filter(Conversation.id == convo.id)
        .first()
    )
    return _enrich(convo, db, current_user.id)


@router.get("/conversations", response_model=list[ConversationOut])
def list_conversations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(Conversation).options(
        joinedload(Conversation.messages),
        joinedload(Conversation.carrier),
        joinedload(Conversation.broker),
    )
    if current_user.role.value == "carrier":
        q = q.filter(Conversation.carrier_id == current_user.id)
    else:
        q = q.filter(Conversation.broker_id == current_user.id)
    convos = q.order_by(Conversation.updated_at.desc()).all()
    return [_enrich(c, db, current_user.id) for c in convos]


@router.get("/conversations/{convo_id}", response_model=ConversationOut)
def get_conversation(
    convo_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    convo = (
        db.query(Conversation)
        .options(
            joinedload(Conversation.messages),
            joinedload(Conversation.carrier),
            joinedload(Conversation.broker),
        )
        .filter(Conversation.id == convo_id)
        .first()
    )
    if not convo:
        raise HTTPException(status_code=404, detail="Conversation not found")
    for msg in convo.messages:
        if msg.sender_id != current_user.id:
            msg.is_read = True
    db.commit()
    return _enrich(convo, db, current_user.id)


@router.delete("/conversations/{convo_id}", status_code=204)
def delete_conversation(
    convo_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    convo = db.query(Conversation).filter(Conversation.id == convo_id).first()
    if not convo:
        raise HTTPException(status_code=404, detail="Conversation not found")
    if current_user.id not in (convo.carrier_id, convo.broker_id):
        raise HTTPException(status_code=403, detail="Not a participant")
    db.query(Message).filter(Message.conversation_id == convo_id).delete()
    db.delete(convo)
    db.commit()


@router.post("/conversations/{convo_id}/typing", status_code=204)
def set_typing(
    convo_id: UUID,
    current_user: User = Depends(get_current_user),
):
    cid = str(convo_id)
    if cid not in _typing:
        _typing[cid] = {}
    _typing[cid][str(current_user.id)] = time.time()


@router.get("/conversations/{convo_id}/typing")
def get_typing(
    convo_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Returns whether the OTHER participant in the conversation is currently typing."""
    convo = db.query(Conversation).filter(Conversation.id == convo_id).first()
    if not convo:
        raise HTTPException(status_code=404, detail="Conversation not found")

    other_id = str(convo.broker_id) if str(convo.carrier_id) == str(current_user.id) else str(convo.carrier_id)
    cid = str(convo_id)
    ts = _typing.get(cid, {}).get(other_id)
    is_typing = ts is not None and (time.time() - ts) < 4
    return {"is_typing": is_typing}


@router.get("/unread-count")
def unread_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role.value == "carrier":
        convos = db.query(Conversation).filter(Conversation.carrier_id == current_user.id).all()
    else:
        convos = db.query(Conversation).filter(Conversation.broker_id == current_user.id).all()

    total = 0
    for c in convos:
        total += db.query(Message).filter(
            Message.conversation_id == c.id,
            Message.sender_id != current_user.id,
            Message.is_read == False,  # noqa: E712
        ).count()
    return {"unread": total}
