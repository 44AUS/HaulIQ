from sqlalchemy import Column, String, DateTime, ForeignKey, Integer, BigInteger
from sqlalchemy.dialects.postgresql import UUID, JSONB
from datetime import datetime
from uuid import uuid4
from app.database import Base


PROFILE_DOC_TYPES = [
    "insurance",
    "authority",
    "w9",
    "drivers_license",
    "vehicle_registration",
    "dot_inspection",
    "ifta",
    "other",
]


class ProfileDocument(Base):
    __tablename__ = "profile_documents"

    id          = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id     = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    file_name   = Column(String, nullable=False)
    doc_type    = Column(String, nullable=False, default="other")
    pages       = Column(JSONB, default=list)   # list of base64 JPEG data-URLs
    page_count  = Column(Integer, default=1)
    file_size   = Column(BigInteger, nullable=True)
    created_at  = Column(DateTime, default=datetime.utcnow)
