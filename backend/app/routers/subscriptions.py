from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from uuid import UUID
from datetime import datetime, timedelta
from pydantic import BaseModel as PydanticBaseModel
from typing import Optional, List

from app.database import get_db
from app.models.subscription import Plan, Subscription, PlanRole, PlanTier, SubStatus
from app.models.user import User, UserPlan
from app.schemas.subscription import PlanOut, SubscriptionOut, ChangePlanRequest
from app.middleware.auth import get_current_user, require_admin

router = APIRouter()


class PlanCreate(PydanticBaseModel):
    name: str
    role: str  # 'carrier' or 'broker'
    tier: str = 'pro'  # 'basic', 'pro', 'elite'
    price: float
    description: str = ''
    features: List[str] = []
    limits: dict = {}  # {missing: [], popular: bool, color: str, sort_order: int}

class PlanUpdate(PydanticBaseModel):
    name: Optional[str] = None
    price: Optional[float] = None
    description: Optional[str] = None
    features: Optional[List[str]] = None
    limits: Optional[dict] = None
    is_active: Optional[bool] = None


@router.get("/plans", response_model=list[PlanOut], summary="Get all available plans")
def list_plans(
    role: str | None = None,
    db: Session = Depends(get_db),
):
    q = db.query(Plan).filter(Plan.is_active == True)
    if role:
        q = q.filter(Plan.role == role)
    return q.order_by(Plan.price).all()


@router.get("/me", response_model=SubscriptionOut | None,
            summary="Get current user's subscription")
def my_subscription(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(Subscription)
        .options(joinedload(Subscription.plan))
        .filter(Subscription.user_id == current_user.id)
        .first()
    )


@router.post("/change", response_model=SubscriptionOut,
             summary="Change subscription plan")
def change_plan(
    payload: ChangePlanRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    plan = db.query(Plan).filter(Plan.id == payload.plan_id, Plan.is_active == True).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")

    # Role must match
    if plan.role.value != current_user.role.value:
        raise HTTPException(
            status_code=400,
            detail=f"This plan is for {plan.role} accounts only.",
        )

    # Upsert subscription
    sub = db.query(Subscription).filter(Subscription.user_id == current_user.id).first()
    if sub:
        sub.plan_id = plan.id
        sub.status  = SubStatus.active
        sub.current_period_start = datetime.utcnow()
        sub.current_period_end   = datetime.utcnow() + timedelta(days=30)
    else:
        sub = Subscription(
            user_id=current_user.id,
            plan_id=plan.id,
            status=SubStatus.active,
            current_period_start=datetime.utcnow(),
            current_period_end=datetime.utcnow() + timedelta(days=30),
        )
        db.add(sub)

    # Update user plan tier
    current_user.plan = UserPlan(plan.tier.value)
    db.commit()
    db.refresh(sub)
    sub.plan = plan
    return sub


@router.delete("/cancel", status_code=204, summary="Cancel subscription (revert to Basic)")
def cancel_subscription(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    sub = db.query(Subscription).filter(Subscription.user_id == current_user.id).first()
    if sub:
        sub.status = SubStatus.cancelled
    current_user.plan = UserPlan.basic
    db.commit()


# ── Admin plan management ──────────────────────────────────────────────────────
@router.get("/admin/plans", response_model=list[PlanOut], summary="Admin: list all plans")
def admin_list_plans(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    return db.query(Plan).order_by(Plan.role, Plan.price).all()


@router.post("/admin/plans", response_model=PlanOut, status_code=201, summary="Admin: create plan")
def admin_create_plan(
    payload: PlanCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    try:
        role = PlanRole(payload.role)
        tier = PlanTier(payload.tier)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    plan = Plan(
        name=payload.name,
        role=role,
        tier=tier,
        price=payload.price,
        description=payload.description,
        features=payload.features,
        limits=payload.limits,
        is_active=True,
    )
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return plan


@router.patch("/admin/plans/{plan_id}", response_model=PlanOut, summary="Admin: update plan")
def admin_update_plan(
    plan_id: UUID,
    payload: PlanUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    plan = db.query(Plan).filter(Plan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    if payload.name is not None:
        plan.name = payload.name
    if payload.price is not None:
        plan.price = payload.price
    if payload.description is not None:
        plan.description = payload.description
    if payload.features is not None:
        plan.features = payload.features
    if payload.limits is not None:
        plan.limits = payload.limits
    if payload.is_active is not None:
        plan.is_active = payload.is_active
    db.commit()
    db.refresh(plan)
    return plan


@router.delete("/admin/plans/{plan_id}", status_code=204, summary="Admin: delete plan")
def admin_delete_plan(
    plan_id: UUID,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    plan = db.query(Plan).filter(Plan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    db.delete(plan)
    db.commit()
