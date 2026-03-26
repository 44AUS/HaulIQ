from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from uuid import UUID
from pydantic import BaseModel
from datetime import datetime
from typing import Optional

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.user import User
from app.models.document import LoadDocument
from app.models.load import Load

router = APIRouter()


class MyDocumentOut(BaseModel):
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


@router.get("/my", response_model=list[MyDocumentOut])
def my_documents(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return all documents uploaded by the current user, with load info."""
    rows = (
        db.query(LoadDocument, Load.origin, Load.destination)
        .join(Load, Load.id == LoadDocument.load_id)
        .filter(LoadDocument.uploader_id == current_user.id)
        .order_by(LoadDocument.created_at.desc())
        .all()
    )

    result = []
    for doc, origin, destination in rows:
        result.append(MyDocumentOut(
            id=doc.id,
            load_id=doc.load_id,
            uploader_id=doc.uploader_id,
            uploader_name=doc.uploader_name,
            uploader_role=doc.uploader_role,
            file_name=doc.file_name,
            doc_type=doc.doc_type,
            page_count=doc.page_count,
            pages=doc.pages,
            created_at=doc.created_at,
            load_origin=origin,
            load_destination=destination,
        ))
    return result
