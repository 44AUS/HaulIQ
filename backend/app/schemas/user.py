from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional
from uuid import UUID
from datetime import datetime
from app.models.user import UserRole, UserPlan


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: UserRole = UserRole.carrier
    phone: Optional[str] = None
    company: Optional[str] = None
    mc_number: Optional[str] = None
    dot_number: Optional[str] = None

    @field_validator("password")
    @classmethod
    def password_min_length(cls, v):
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters")
        return v


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    mc_number: Optional[str] = None
    dot_number: Optional[str] = None
    password: Optional[str] = None
    avatar_url: Optional[str] = None


class UserOut(BaseModel):
    id: UUID
    email: str
    name: str
    role: UserRole
    plan: UserPlan
    phone: Optional[str]
    company: Optional[str]
    mc_number: Optional[str]
    dot_number: Optional[str]
    avatar_url: Optional[str] = None
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class TokenData(BaseModel):
    user_id: Optional[str] = None
    role: Optional[str] = None
