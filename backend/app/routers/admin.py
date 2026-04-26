from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, text
from typing import Optional, List
from uuid import UUID
from datetime import datetime, timedelta
from pydantic import BaseModel

from app.database import get_db
from app.models.user import User, UserPlan, UserRole
from app.models.load import Load, LoadStatus
from app.models.subscription import Plan, Subscription, SubStatus
from app.models.broker import Broker
from app.schemas.user import UserOut
from app.schemas.subscription import PlanOut
from app.middleware.auth import require_admin

router = APIRouter()


# ─── Platform overview ────────────────────────────────────────────────────────
@router.get("/stats", summary="Platform-wide statistics")
def platform_stats(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    total_users    = db.query(func.count(User.id)).scalar()
    total_carriers = db.query(func.count(User.id)).filter(User.role == UserRole.carrier).scalar()
    total_brokers  = db.query(func.count(User.id)).filter(User.role == UserRole.broker).scalar()
    active_loads   = db.query(func.count(Load.id)).filter(Load.status == LoadStatus.active).scalar()
    total_loads    = db.query(func.count(Load.id)).scalar()

    # MRR calculation
    active_subs = (
        db.query(Subscription, Plan)
        .join(Plan, Subscription.plan_id == Plan.id)
        .filter(Subscription.status == SubStatus.active)
        .all()
    )
    mrr = sum(plan.price for _, plan in active_subs)
    active_subscriber_count = len(active_subs)

    # Plan distribution
    carrier_dist = _plan_distribution(db, UserRole.carrier)
    broker_dist  = _plan_distribution(db, UserRole.broker)

    # New users last 30 days
    cutoff = datetime.utcnow() - timedelta(days=30)
    new_users_30d = db.query(func.count(User.id)).filter(User.created_at >= cutoff).scalar()

    return {
        "total_users":    total_users,
        "total_carriers": total_carriers,
        "total_brokers":  total_brokers,
        "active_loads":   active_loads,
        "total_loads":    total_loads,
        "mrr":            round(mrr, 2),
        "arr":            round(mrr * 12, 2),
        "active_subscribers": active_subscriber_count,
        "new_users_30d":  new_users_30d,
        "carrier_plan_distribution": carrier_dist,
        "broker_plan_distribution":  broker_dist,
    }


def _plan_distribution(db: Session, role: UserRole) -> list[dict]:
    results = (
        db.query(User.plan, func.count(User.id).label("count"))
        .filter(User.role == role)
        .group_by(User.plan)
        .all()
    )
    total = sum(r.count for r in results)
    return [
        {
            "plan":  r.plan.value,
            "count": r.count,
            "pct":   round(r.count / total * 100) if total else 0,
        }
        for r in results
    ]


# ─── User management ─────────────────────────────────────────────────────────
@router.get("/users", response_model=list[UserOut], summary="List all users")
def list_users(
    search:    Optional[str]      = Query(None),
    role:      Optional[str]      = Query(None),
    plan:      Optional[str]      = Query(None),
    is_active: Optional[bool]     = Query(None),
    page:      int                = Query(1, ge=1),
    per_page:  int                = Query(50, ge=1, le=200),
    db:        Session            = Depends(get_db),
    _:         User               = Depends(require_admin),
):
    q = db.query(User)
    if search:
        term = f"%{search}%"
        q = q.filter(User.name.ilike(term) | User.email.ilike(term))
    if role:      q = q.filter(User.role == role)
    if plan:      q = q.filter(User.plan == plan)
    if is_active is not None: q = q.filter(User.is_active == is_active)

    return q.order_by(desc(User.created_at)).offset((page - 1) * per_page).limit(per_page).all()


@router.patch("/users/{user_id}/suspend", summary="Suspend a user account")
def suspend_user(
    user_id: UUID,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.role == UserRole.admin:
        raise HTTPException(status_code=400, detail="Cannot suspend an admin account")
    user.is_active = False
    db.commit()
    return {"ok": True, "message": f"User {user.email} suspended"}


@router.patch("/users/{user_id}/activate", summary="Reactivate a suspended user")
def activate_user(
    user_id: UUID,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_active = True
    db.commit()
    return {"ok": True}


@router.delete("/users/{user_id}", status_code=204, summary="Permanently delete a user account")
def delete_user(
    user_id: UUID,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.role == UserRole.admin:
        raise HTTPException(status_code=400, detail="Cannot delete an admin account")
    if str(user.id) == str(current_admin.id):
        raise HTTPException(status_code=400, detail="Cannot delete your own account")

    uid = str(user_id)

    # Delete in FK-dependency order to avoid constraint violations.
    # Messages first (reference conversations + users)
    db.execute(text("""
        DELETE FROM messages
        WHERE sender_id = :uid
           OR conversation_id IN (
               SELECT id FROM conversations
               WHERE carrier_id = :uid OR broker_id = :uid
                  OR load_id IN (SELECT id FROM loads WHERE broker_user_id = :uid)
           )
    """), {"uid": uid})

    db.execute(text("""
        DELETE FROM conversations
        WHERE carrier_id = :uid OR broker_id = :uid
           OR load_id IN (SELECT id FROM loads WHERE broker_user_id = :uid)
    """), {"uid": uid})

    db.execute(text("""
        DELETE FROM bids
        WHERE carrier_id = :uid
           OR load_id IN (SELECT id FROM loads WHERE broker_user_id = :uid)
    """), {"uid": uid})

    db.execute(text("""
        DELETE FROM bookings
        WHERE carrier_id = :uid
           OR load_id IN (SELECT id FROM loads WHERE broker_user_id = :uid)
    """), {"uid": uid})

    db.execute(text("""
        DELETE FROM load_payments
        WHERE carrier_id = :uid OR broker_id = :uid
           OR load_id IN (SELECT id FROM loads WHERE broker_user_id = :uid)
    """), {"uid": uid})

    db.execute(text("""
        DELETE FROM saved_loads
        WHERE carrier_id = :uid
           OR load_id IN (SELECT id FROM loads WHERE broker_user_id = :uid)
    """), {"uid": uid})

    db.execute(text("""
        DELETE FROM load_history
        WHERE carrier_id = :uid
           OR load_id IN (SELECT id FROM loads WHERE broker_user_id = :uid)
    """), {"uid": uid})

    db.execute(text("DELETE FROM loads WHERE broker_user_id = :uid"), {"uid": uid})
    db.execute(text("DELETE FROM user_blocks WHERE blocker_id = :uid OR blocked_id = :uid"), {"uid": uid})
    db.execute(text("DELETE FROM instant_book_allowlist WHERE broker_id = :uid OR carrier_id = :uid"), {"uid": uid})
    db.execute(text("DELETE FROM carrier_reviews WHERE carrier_id = :uid OR broker_id = :uid"), {"uid": uid})
    db.execute(text("DELETE FROM broker_reviews WHERE carrier_id = :uid"), {"uid": uid})
    db.execute(text("DELETE FROM driver_insights WHERE carrier_id = :uid"), {"uid": uid})
    db.execute(text("DELETE FROM lane_stats WHERE carrier_id = :uid"), {"uid": uid})
    db.execute(text("DELETE FROM truck_posts WHERE carrier_id = :uid"), {"uid": uid})
    db.execute(text("DELETE FROM carrier_locations WHERE carrier_id = :uid"), {"uid": uid})
    db.execute(text("""
        DELETE FROM broker_network
        WHERE broker_id = :uid OR carrier_id = :uid OR initiated_by_id = :uid
    """), {"uid": uid})

    # Delete broker reviews for this user's broker profile, then the profile itself
    db.execute(text("""
        DELETE FROM broker_reviews
        WHERE broker_id IN (SELECT id FROM brokers WHERE user_id = :uid)
    """), {"uid": uid})
    db.execute(text("DELETE FROM brokers WHERE user_id = :uid"), {"uid": uid})
    db.execute(text("DELETE FROM subscriptions WHERE user_id = :uid"), {"uid": uid})

    db.delete(user)
    db.commit()


@router.patch("/users/{user_id}/plan", summary="Override a user's subscription plan")
def override_plan(
    user_id: UUID,
    plan: UserPlan,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.plan = plan
    db.commit()
    return {"ok": True, "new_plan": plan}


# ─── Plan management ──────────────────────────────────────────────────────────
@router.get("/plans", response_model=list[PlanOut], summary="List all subscription plans")
def list_plans(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    return db.query(Plan).order_by(Plan.role, Plan.price).all()


@router.patch("/plans/{plan_id}", response_model=PlanOut, summary="Update a plan's price or features")
def update_plan(
    plan_id: UUID,
    price:       Optional[float]      = None,
    description: Optional[str]        = None,
    is_active:   Optional[bool]       = None,
    db:          Session              = Depends(get_db),
    _:           User                 = Depends(require_admin),
):
    plan = db.query(Plan).filter(Plan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    if price       is not None: plan.price       = price
    if description is not None: plan.description = description
    if is_active   is not None: plan.is_active   = is_active
    db.commit()
    db.refresh(plan)
    return plan


# ─── Load moderation ──────────────────────────────────────────────────────────
@router.get("/loads", summary="List all loads for moderation")
def list_loads(
    status:   Optional[str] = Query(None),
    page:     int           = Query(1, ge=1),
    per_page: int           = Query(50),
    db:       Session       = Depends(get_db),
    _:        User          = Depends(require_admin),
):
    q = db.query(Load)
    if status: q = q.filter(Load.status == status)
    total  = q.count()
    loads  = q.order_by(desc(Load.posted_at)).offset((page - 1) * per_page).limit(per_page).all()
    return {"loads": loads, "total": total}


@router.delete("/loads/{load_id}", status_code=204, summary="Admin remove a load")
def remove_load(
    load_id: UUID,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    load = db.query(Load).filter(Load.id == load_id).first()
    if not load:
        raise HTTPException(status_code=404, detail="Load not found")
    load.status = LoadStatus.removed
    db.commit()


# ─── Revenue breakdown ────────────────────────────────────────────────────────
@router.get("/revenue", summary="Revenue breakdown by plan")
def revenue_breakdown(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    rows = (
        db.query(Plan, func.count(Subscription.id).label("subs"))
        .outerjoin(Subscription, (Subscription.plan_id == Plan.id) & (Subscription.status == SubStatus.active))
        .group_by(Plan.id)
        .all()
    )
    breakdown = []
    total_mrr = 0.0
    for plan, subs in rows:
        mrr = plan.price * subs
        total_mrr += mrr
        breakdown.append({
            "plan":        f"{plan.role.value.capitalize()} {plan.name}",
            "tier":        plan.tier.value,
            "role":        plan.role.value,
            "price":       plan.price,
            "subscribers": subs,
            "mrr":         round(mrr, 2),
        })
    return {
        "total_mrr": round(total_mrr, 2),
        "arr":       round(total_mrr * 12, 2),
        "breakdown": sorted(breakdown, key=lambda x: x["mrr"], reverse=True),
    }


# ─── App Info (admin) ─────────────────────────────────────────────────────────
class AppInfoIn(BaseModel):
    status: Optional[str] = None
    current_version: Optional[str] = None
    latest_version: Optional[str] = None
    release_video_url: Optional[str] = None
    whats_new: Optional[List[str]] = None
    known_issues: Optional[List[str]] = None


@router.get("/app-info", summary="Get app info")
def admin_get_app_info(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    from app.models.app_settings import AppInfo
    info = db.query(AppInfo).filter(AppInfo.id == 1).first()
    if not info:
        return {"status": "normal", "current_version": "1.0.0", "latest_version": "1.0.0",
                "release_video_url": None, "whats_new": [], "known_issues": []}
    return {"status": info.status, "current_version": info.current_version,
            "latest_version": info.latest_version, "release_video_url": info.release_video_url,
            "whats_new": info.whats_new or [], "known_issues": info.known_issues or []}


@router.put("/app-info", summary="Update app info")
def admin_update_app_info(body: AppInfoIn, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    from app.models.app_settings import AppInfo
    info = db.query(AppInfo).filter(AppInfo.id == 1).first()
    if not info:
        info = AppInfo(id=1)
        db.add(info)
    for field, val in body.dict(exclude_none=True).items():
        setattr(info, field, val)
    db.commit()
    return {"ok": True}


# ─── Tutorials (admin) ────────────────────────────────────────────────────────
class TutorialCategoryIn(BaseModel):
    name: str
    thumbnail_url: Optional[str] = None
    description: Optional[str] = None
    order_idx: Optional[int] = 0


class TutorialVideoIn(BaseModel):
    title: str
    youtube_url: str
    description: Optional[str] = None
    duration: Optional[str] = None
    order_idx: Optional[int] = 0


@router.get("/tutorials/categories", summary="List tutorial categories")
def admin_list_categories(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    from app.models.app_settings import TutorialCategory
    cats = db.query(TutorialCategory).order_by(TutorialCategory.order_idx).all()
    return [{"id": str(c.id), "name": c.name, "thumbnail_url": c.thumbnail_url,
             "description": c.description, "order_idx": c.order_idx,
             "video_count": len(c.videos)} for c in cats]


@router.post("/tutorials/categories", status_code=201)
def admin_create_category(body: TutorialCategoryIn, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    from app.models.app_settings import TutorialCategory
    cat = TutorialCategory(**body.dict())
    db.add(cat); db.commit(); db.refresh(cat)
    return {"id": str(cat.id), "name": cat.name}


@router.delete("/tutorials/categories/{category_id}", status_code=204)
def admin_delete_category(category_id: UUID, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    from app.models.app_settings import TutorialCategory
    cat = db.query(TutorialCategory).filter(TutorialCategory.id == category_id).first()
    if not cat:
        raise HTTPException(404, "Category not found")
    db.delete(cat); db.commit()


@router.get("/tutorials/categories/{category_id}/videos")
def admin_list_videos(category_id: UUID, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    from app.models.app_settings import TutorialVideo
    videos = db.query(TutorialVideo).filter(TutorialVideo.category_id == category_id).order_by(TutorialVideo.order_idx).all()
    return [{"id": str(v.id), "title": v.title, "youtube_url": v.youtube_url,
             "description": v.description, "duration": v.duration, "order_idx": v.order_idx} for v in videos]


@router.post("/tutorials/categories/{category_id}/videos", status_code=201)
def admin_create_video(category_id: UUID, body: TutorialVideoIn, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    from app.models.app_settings import TutorialVideo
    v = TutorialVideo(category_id=category_id, **body.dict())
    db.add(v); db.commit(); db.refresh(v)
    return {"id": str(v.id), "title": v.title}


@router.delete("/tutorials/videos/{video_id}", status_code=204)
def admin_delete_video(video_id: UUID, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    from app.models.app_settings import TutorialVideo
    v = db.query(TutorialVideo).filter(TutorialVideo.id == video_id).first()
    if not v:
        raise HTTPException(404, "Video not found")
    db.delete(v); db.commit()


# ─── Feature Requests (admin) ─────────────────────────────────────────────────
@router.get("/feature-requests")
def admin_feature_requests(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    from app.models.app_settings import FeatureRequest
    rows = db.query(FeatureRequest, User).join(User, FeatureRequest.user_id == User.id)\
             .order_by(desc(FeatureRequest.created_at)).all()
    return [{"id": str(fr.id), "title": fr.title, "description": fr.description,
             "status": fr.status, "created_at": fr.created_at.isoformat(),
             "user_name": u.name, "user_email": u.email} for fr, u in rows]


@router.patch("/feature-requests/{fr_id}")
def admin_update_feature_request(fr_id: UUID, status: str = Query(...), db: Session = Depends(get_db), _: User = Depends(require_admin)):
    from app.models.app_settings import FeatureRequest
    fr = db.query(FeatureRequest).filter(FeatureRequest.id == fr_id).first()
    if not fr:
        raise HTTPException(404, "Not found")
    fr.status = status; db.commit()
    return {"ok": True}


# ─── Reported Problems (admin) ────────────────────────────────────────────────
@router.get("/reported-problems")
def admin_reported_problems(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    from app.models.app_settings import ReportedProblem
    rows = db.query(ReportedProblem, User).join(User, ReportedProblem.user_id == User.id)\
             .order_by(desc(ReportedProblem.created_at)).all()
    return [{"id": str(rp.id), "title": rp.title, "description": rp.description,
             "severity": rp.severity, "status": rp.status, "created_at": rp.created_at.isoformat(),
             "user_name": u.name, "user_email": u.email} for rp, u in rows]


@router.patch("/reported-problems/{rp_id}")
def admin_update_reported_problem(rp_id: UUID, status: str = Query(...), db: Session = Depends(get_db), _: User = Depends(require_admin)):
    from app.models.app_settings import ReportedProblem
    rp = db.query(ReportedProblem).filter(ReportedProblem.id == rp_id).first()
    if not rp:
        raise HTTPException(404, "Not found")
    rp.status = status; db.commit()
    return {"ok": True}
