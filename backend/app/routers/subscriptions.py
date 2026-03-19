from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from uuid import UUID
from datetime import datetime, timedelta

from app.database import get_db
from app.models.subscription import Plan, Subscription, PlanRole, SubStatus
from app.models.user import User, UserPlan
from app.schemas.subscription import PlanOut, SubscriptionOut, ChangePlanRequest
from app.middleware.auth import get_current_user

router = APIRouter()


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
