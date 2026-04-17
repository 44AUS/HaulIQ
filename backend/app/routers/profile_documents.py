from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID
from pydantic import BaseModel
from datetime import datetime
from typing import Optional

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.user import User
from app.models.profile_document import ProfileDocument

router = APIRouter()


class ProfileDocumentOut(BaseModel):
    id:         UUID
    user_id:    UUID
    file_name:  str
    doc_type:   str
    page_count: int
    pages:      list
    file_size:  Optional[int]
    created_at: datetime
    model_config = {"from_attributes": True}


class ProfileDocumentCreate(BaseModel):
    file_name:  str
    doc_type:   str = "other"
    pages:      list  # base64 data-URLs
    page_count: int = 1
    file_size:  Optional[int] = None


# ── GET /api/profile-documents ─────────────────────────────────────────────────
@router.get("", response_model=list[ProfileDocumentOut])
def list_profile_documents(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    docs = (
        db.query(ProfileDocument)
        .filter(ProfileDocument.user_id == current_user.id)
        .order_by(ProfileDocument.created_at.desc())
        .all()
    )
    return docs


# ── POST /api/profile-documents ───────────────────────────────────────────────
@router.post("", response_model=ProfileDocumentOut)
def upload_profile_document(
    body: ProfileDocumentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    doc = ProfileDocument(
        user_id    = current_user.id,
        file_name  = body.file_name,
        doc_type   = body.doc_type,
        pages      = body.pages,
        page_count = body.page_count,
        file_size  = body.file_size,
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return doc


# ── DELETE /api/profile-documents/{id} ────────────────────────────────────────
@router.delete("/{doc_id}", status_code=204)
def delete_profile_document(
    doc_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    doc = db.query(ProfileDocument).filter(ProfileDocument.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    if str(doc.user_id) != str(current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized")
    db.delete(doc)
    db.commit()
