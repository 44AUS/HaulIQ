from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User, UserRole
from app.utils.jwt import decode_access_token

bearer_scheme = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    token = credentials.credentials
    payload = decode_access_token(token)

    if not payload or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = db.query(User).filter(User.id == payload["sub"], User.is_active == True).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
        )
    return user


def require_role(*roles: UserRole):
    """Dependency factory — enforces that the current user has one of the given roles."""
    def _check(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access restricted. Required role(s): {[r.value for r in roles]}",
            )
        return current_user
    return _check


def require_plan(*plans: str):
    """Dependency factory — enforces subscription tier."""
    PLAN_ORDER = {"basic": 0, "pro": 1, "elite": 2, "admin": 99}

    def _check(current_user: User = Depends(get_current_user)) -> User:
        min_required = min(PLAN_ORDER.get(p, 0) for p in plans)
        user_level   = PLAN_ORDER.get(current_user.plan.value, 0)
        if user_level < min_required:
            raise HTTPException(
                status_code=status.HTTP_402_PAYMENT_REQUIRED,
                detail=f"This feature requires a {' or '.join(plans)} plan. Upgrade at /carrier/dashboard.",
            )
        return current_user
    return _check


# Shorthand dependencies
require_carrier = require_role(UserRole.carrier)
require_broker  = require_role(UserRole.broker)
require_admin   = require_role(UserRole.admin)
