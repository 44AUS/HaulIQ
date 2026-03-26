from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from uuid import UUID
from pydantic import BaseModel
from datetime import datetime
from typing import Optional

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.user import User
from app.models.document import LoadDocument
from app.models.load import Load
from app.models.messaging import Conversation, Message

router = APIRouter()


class DocumentUpload(BaseModel):
    file_name: str
    doc_type: str = "other"
    pages: list[str]           # base64 data-URL strings


class DocumentOut(BaseModel):
    id: UUID
    load_id: UUID
    uploader_id: UUID
    uploader_name: Optional[str]
    uploader_role: Optional[str]
    file_name: str
    doc_type: str
    page_count: int
    pages: list[str]
    created_at: datetime
    model_config = {"from_attributes": True}


class DocumentWithLoadOut(BaseModel):
    id: UUID
    load_id: UUID
    uploader_id: UUID
    uploader_name: Optional[str]
    uploader_role: Optional[str]
    file_name: str
    doc_type: str
    page_count: int
    pages: list[str]
    created_at: datetime
    load_origin: Optional[str]
    load_destination: Optional[str]
    model_config = {"from_attributes": True}


@router.post("/{load_id}/documents", response_model=DocumentOut)
def upload_document(
    load_id: UUID,
    payload: DocumentUpload,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    load = db.query(Load).filter(Load.id == load_id).first()
    if not load:
        raise HTTPException(status_code=404, detail="Load not found")

    doc = LoadDocument(
        load_id=load_id,
        uploader_id=current_user.id,
        uploader_name=current_user.name,
        uploader_role=current_user.role.value,
        file_name=payload.file_name,
        doc_type=payload.doc_type,
        pages=payload.pages,
        page_count=len(payload.pages),
    )
    db.add(doc)
    db.flush()

    # Notify all conversations linked to this load with a structured message
    import json
    notification = json.dumps({
        "__type": "doc_upload",
        "doc_id": str(doc.id),
        "load_id": str(load_id),
        "file_name": payload.file_name,
        "doc_type": payload.doc_type,
        "page_count": len(payload.pages),
        "uploader_name": current_user.name,
        "uploader_role": current_user.role.value,
    })
    convos = db.query(Conversation).filter(Conversation.load_id == load_id).all()
    for convo in convos:
        db.add(Message(
            conversation_id=convo.id,
            sender_id=current_user.id,
            body=notification,
        ))

    db.commit()
    db.refresh(doc)
    return doc


@router.get("/{load_id}/documents", response_model=list[DocumentOut])
def list_documents(
    load_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(LoadDocument)
        .filter(LoadDocument.load_id == load_id)
        .order_by(LoadDocument.created_at.desc())
        .all()
    )


@router.delete("/{load_id}/documents/{doc_id}", status_code=204)
def delete_document(
    load_id: UUID,
    doc_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    doc = db.query(LoadDocument).filter(
        LoadDocument.id == doc_id,
        LoadDocument.load_id == load_id,
    ).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    if doc.uploader_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your document")
    db.delete(doc)
    db.commit()


@router.get("/{load_id}/messages")
def load_messages(
    load_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return all messages from conversations linked to this load, chronological."""
    convos = (
        db.query(Conversation)
        .options(
            joinedload(Conversation.messages),
            joinedload(Conversation.carrier),
            joinedload(Conversation.broker),
        )
        .filter(Conversation.load_id == load_id)
        .all()
    )

    result = []
    for c in convos:
        for m in c.messages:
            is_carrier = str(m.sender_id) == str(c.carrier_id)
            result.append({
                "id": str(m.id),
                "body": m.body,
                "sender_id": str(m.sender_id),
                "sender_name": (c.carrier.name if is_carrier else c.broker.name) or ("Carrier" if is_carrier else "Broker"),
                "sender_role": "carrier" if is_carrier else "broker",
                "created_at": m.created_at.isoformat(),
                "is_read": m.is_read,
            })

    result.sort(key=lambda x: x["created_at"])
    return result
