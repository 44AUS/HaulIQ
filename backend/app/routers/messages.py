from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from uuid import UUID
from pydantic import BaseModel
from datetime import datetime
from typing import Optional

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.user import User
from app.models.messaging import Conversation, Message

router = APIRouter()


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
    model_config = {"from_attributes": True}


def _enrich(c: Conversation) -> ConversationOut:
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
    return _enrich(convo)


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
    return [_enrich(c) for c in convos]


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
    return _enrich(convo)


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
