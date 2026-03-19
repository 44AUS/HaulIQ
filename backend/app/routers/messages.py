from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from uuid import UUID
from pydantic import BaseModel
from datetime import datetime

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.user import User
from app.models.messaging import Conversation, Message

router = APIRouter()


class SendMessageRequest(BaseModel):
    load_id: UUID
    broker_id: UUID
    body: str


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
    load_id: UUID
    carrier_id: UUID
    broker_id: UUID
    created_at: datetime
    updated_at: datetime
    messages: list[MessageOut]
    model_config = {"from_attributes": True}


@router.post("/send", response_model=MessageOut)
def send_message(
    payload: SendMessageRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Determine carrier/broker from current user role
    if current_user.role.value == "carrier":
        carrier_id = current_user.id
        broker_id = payload.broker_id
    else:
        broker_id = current_user.id
        carrier_id = payload.broker_id  # broker_id field used as "other party"

    # Find or create conversation
    convo = (
        db.query(Conversation)
        .filter(
            Conversation.load_id == payload.load_id,
            Conversation.carrier_id == carrier_id,
            Conversation.broker_id == broker_id,
        )
        .first()
    )
    if not convo:
        convo = Conversation(load_id=payload.load_id, carrier_id=carrier_id, broker_id=broker_id)
        db.add(convo)
        db.flush()

    msg = Message(conversation_id=convo.id, sender_id=current_user.id, body=payload.body)
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return msg


@router.get("/conversations", response_model=list[ConversationOut])
def list_conversations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(Conversation).options(joinedload(Conversation.messages))
    if current_user.role.value == "carrier":
        q = q.filter(Conversation.carrier_id == current_user.id)
    else:
        q = q.filter(Conversation.broker_id == current_user.id)
    return q.order_by(Conversation.updated_at.desc()).all()


@router.get("/conversations/{convo_id}", response_model=ConversationOut)
def get_conversation(
    convo_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    convo = db.query(Conversation).options(joinedload(Conversation.messages)).filter(Conversation.id == convo_id).first()
    if not convo:
        raise HTTPException(status_code=404, detail="Conversation not found")
    # Mark messages as read
    for msg in convo.messages:
        if msg.sender_id != current_user.id:
            msg.is_read = True
    db.commit()
    return convo


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
            Message.is_read == False
        ).count()
    return {"unread": total}
