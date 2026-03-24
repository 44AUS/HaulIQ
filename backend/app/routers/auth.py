from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User, UserRole, UserPlan
from app.schemas.user import UserCreate, UserLogin, UserOut, UserUpdate, Token
from app.utils.password import hash_password, verify_password
from app.utils.jwt import create_access_token
from app.middleware.auth import get_current_user

router = APIRouter()


@router.post("/signup", response_model=Token, status_code=status.HTTP_201_CREATED,
             summary="Register a new user (carrier or broker)")
def signup(payload: UserCreate, db: Session = Depends(get_db)):
    # Check email not already registered
    existing = db.query(User).filter(User.email == payload.email.lower()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists.",
        )

    user = User(
        email=payload.email.lower(),
        password_hash=hash_password(payload.password),
        name=payload.name,
        role=payload.role,
        plan=UserPlan.basic,
        phone=payload.phone,
        company=payload.company,
        mc_number=payload.mc_number,
        dot_number=payload.dot_number,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Auto-create Broker profile for broker accounts
    if user.role == UserRole.broker:
        from app.models.broker import Broker
        broker = Broker(user_id=user.id, name=user.company or user.name, mc_number=user.mc_number)
        db.add(broker)
        db.commit()

    token = create_access_token({"sub": str(user.id), "role": user.role.value})
    return Token(access_token=token, user=UserOut.model_validate(user))


@router.post("/login", response_model=Token, summary="Login and receive JWT access token")
def login(payload: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email.lower()).first()

    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been suspended. Contact support.",
        )

    # Auto-create Broker profile if missing (handles accounts created before this fix)
    if user.role == UserRole.broker:
        from app.models.broker import Broker
        if not db.query(Broker).filter(Broker.user_id == user.id).first():
            broker = Broker(user_id=user.id, name=user.company or user.name, mc_number=user.mc_number)
            db.add(broker)
            db.commit()

    token = create_access_token({"sub": str(user.id), "role": user.role.value})
    return Token(access_token=token, user=UserOut.model_validate(user))


@router.get("/me", response_model=UserOut, summary="Get current authenticated user")
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.patch("/me", response_model=UserOut, summary="Update current user profile")
def update_me(
    payload: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from app.utils.password import hash_password
    data = payload.model_dump(exclude_none=True)
    if "password" in data:
        current_user.password_hash = hash_password(data.pop("password"))
    for field, value in data.items():
        setattr(current_user, field, value)

    # Keep Broker profile in sync when a broker updates their name/MC
    if current_user.role.value == "broker" and current_user.broker_profile:
        bp = current_user.broker_profile
        if "company" in data or "name" in data:
            bp.name = current_user.company or current_user.name
        if "mc_number" in data:
            bp.mc_number = current_user.mc_number

    db.commit()
    db.refresh(current_user)
    return current_user
