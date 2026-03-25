from sqlalchemy import Column, String, DateTime, ForeignKey, Integer
from sqlalchemy.dialects.postgresql import UUID, JSONB
from datetime import datetime
from uuid import uuid4
from app.database import Base


class LoadDocument(Base):
    __tablename__ = "load_documents"

    id           = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    load_id      = Column(UUID(as_uuid=True), ForeignKey("loads.id", ondelete="CASCADE"), nullable=False, index=True)
    uploader_id  = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    uploader_name = Column(String)
    uploader_role = Column(String)   # 'carrier' or 'broker'
    file_name    = Column(String, nullable=False)
    doc_type     = Column(String, default="other")   # BOL, POD, receipt, rate_confirmation, other
    pages        = Column(JSONB, default=list)        # list of base64 JPEG data-URLs
    page_count   = Column(Integer, default=1)
    created_at   = Column(DateTime, default=datetime.utcnow)
