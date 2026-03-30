from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User, UserRole, UserPlan
from app.schemas.user import UserCreate, UserLogin, UserOut, UserUpdate, Token
from app.utils.password import hash_password, verify_password
from app.utils.jwt import create_access_token
from app.utils.fmcsa import _strip_mc
from app.utils.vetting import vet_carrier, vet_broker
from app.middleware.auth import get_current_user
from app.config import get_settings

router = APIRouter()


@router.post("/create-admin", response_model=Token, status_code=status.HTTP_201_CREATED,
             summary="Bootstrap an admin account (requires ADMIN_SECRET env var)")
def create_admin(
    email: str,
    password: str,
    name: str,
    secret: str,
    db: Session = Depends(get_db),
):
    settings = get_settings()
    if not settings.admin_secret or secret != settings.admin_secret:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid admin secret.")
    existing = db.query(User).filter(User.email == email.lower()).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered.")
    user = User(
        email=email.lower(),
        password_hash=hash_password(password),
        name=name,
        role=UserRole.admin,
        plan=UserPlan.admin,
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    token = create_access_token({"sub": str(user.id), "role": user.role.value})
    return Token(access_token=token, user=UserOut.model_validate(user))


@router.get("/verify-mc/{mc_number}", summary="Check if an MC number is valid and not already registered")
async def verify_mc_number(mc_number: str, db: Session = Depends(get_db)):
    settings = get_settings()
    mc_clean = _strip_mc(mc_number)
    if not mc_clean:
        raise HTTPException(status_code=400, detail="Invalid MC number format")

    # Duplicate check
    duplicate = db.query(User).filter(
        User.mc_number.ilike(f"%{mc_clean}%")
    ).first()
    if duplicate:
        raise HTTPException(status_code=409, detail="This MC number is already registered to another account")

    # FMCSA verification
    result = await verify_mc(mc_number, settings.fmcsa_api_key)

    if not result.found:
        raise HTTPException(status_code=404, detail=result.error or "MC number not found in FMCSA database")

    if not result.authorized:
        raise HTTPException(status_code=422, detail=result.error or "Carrier is not authorized to operate")

    return {
        "valid": True,
        "legal_name": result.legal_name,
        "operating_status": result.operating_status,
        "dot_number": result.dot_number,
        "mc_number": mc_clean,
    }


@router.post("/signup", response_model=Token, status_code=status.HTTP_201_CREATED,
             summary="Register a new user (carrier or broker)")
async def signup(payload: UserCreate, db: Session = Depends(get_db)):
    settings = get_settings()

    # Check email not already registered
    existing = db.query(User).filter(User.email == payload.email.lower()).first()
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email already exists.")

    # Check MC number not already in use
    if payload.mc_number:
        mc_clean = _strip_mc(payload.mc_number)
        mc_dupe = db.query(User).filter(User.mc_number.ilike(f"%{mc_clean}%")).first()
        if mc_dupe:
            raise HTTPException(status_code=400, detail="This MC number is already registered to another account.")

    # ── FMCSA vetting (synchronous — blocks signup if it fails) ──────────────
    if payload.role == UserRole.carrier:
        vet = await vet_carrier(
            company=payload.company or payload.name,
            mc_number=payload.mc_number or "",
            api_key=settings.fmcsa_api_key,
        )
    else:
        vet = await vet_broker(
            company=payload.company or payload.name,
            mc_number=payload.mc_number or "",
            api_key=settings.fmcsa_api_key,
        )

    if not vet["ok"]:
        raise HTTPException(status_code=422, detail=vet["summary"])

    # Pull DOT number from FMCSA result if available
    fmcsa = vet.get("fmcsa")
    dot_from_fmcsa = fmcsa.dot_number if fmcsa else None

    user = User(
        email=payload.email.lower(),
        password_hash=hash_password(payload.password),
        name=payload.name,
        role=payload.role,
        plan=UserPlan.basic,
        phone=payload.phone,
        company=payload.company,
        mc_number=payload.mc_number,
        dot_number=payload.dot_number or dot_from_fmcsa,
        business_address=payload.business_address,
        business_city=payload.business_city,
        business_state=payload.business_state,
        business_zip=payload.business_zip,
        business_country=payload.business_country,
        vetting_status=vet["status"],
        vetting_score=vet["score"],
        vetting_flags=vet["flags"],
        vetting_summary=vet["summary"],
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
