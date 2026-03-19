from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc, asc
from typing import Optional
from uuid import UUID

from app.database import get_db
from app.models.load import Load, SavedLoad, LoadStatus, ProfitScore
from app.models.user import User, UserPlan
from app.schemas.load import LoadCreate, LoadOut, LoadListOut
from app.middleware.auth import get_current_user, require_broker, require_carrier
from app.utils.profit import calculate_profit, get_market_rate

router = APIRouter()

PLAN_DAILY_LIMITS = {
    UserPlan.basic: 20,
    UserPlan.pro:   -1,   # unlimited
    UserPlan.elite: -1,
    UserPlan.admin: -1,
}


def _enrich_load(load: Load) -> Load:
    """Compute profit fields on a load object (non-destructive)."""
    result = calculate_profit(
        rate=load.rate,
        loaded_miles=load.miles,
        deadhead_miles=load.deadhead_miles or 0,
    )
    load.rate_per_mile   = result["rate_per_mile"]
    load.fuel_cost_est   = result["fuel_cost"]
    load.net_profit_est  = result["net_profit"]
    load.profit_score    = ProfitScore(result["profit_score"])
    market_rate          = get_market_rate(load.origin_state, load.dest_state)
    load.market_rate_per_mile = market_rate
    load.is_above_market = (result["rate_per_mile"] >= market_rate)
    return load


# ─── GET /api/loads ────────────────────────────────────────────────────────────
@router.get("", response_model=LoadListOut, summary="Browse the load board")
def list_loads(
    search:        Optional[str]        = Query(None),
    load_type:     Optional[str]        = Query(None),
    profit_score:  Optional[str]        = Query(None),
    hot_only:      bool                 = Query(False),
    min_rate:      Optional[float]      = Query(None),
    max_deadhead:  Optional[int]        = Query(None),
    origin_state:  Optional[str]        = Query(None),
    dest_state:    Optional[str]        = Query(None),
    sort_by:       str                  = Query("profit"),
    page:          int                  = Query(1, ge=1),
    per_page:      int                  = Query(20, ge=1, le=100),
    db:            Session              = Depends(get_db),
    current_user:  User                 = Depends(get_current_user),
):
    q = (
        db.query(Load)
        .options(joinedload(Load.broker))
        .filter(Load.status == LoadStatus.active)
    )

    if search:
        term = f"%{search}%"
        q = q.filter(
            Load.origin.ilike(term) |
            Load.destination.ilike(term) |
            Load.commodity.ilike(term)
        )
    if load_type:   q = q.filter(Load.load_type == load_type)
    if hot_only:    q = q.filter(Load.is_hot == True)
    if min_rate:    q = q.filter(Load.rate >= min_rate)
    if max_deadhead: q = q.filter(Load.deadhead_miles <= max_deadhead)
    if origin_state: q = q.filter(Load.origin_state == origin_state.upper())
    if dest_state:   q = q.filter(Load.dest_state   == dest_state.upper())

    total = q.count()

    # Sort
    sort_map = {
        "profit":       desc(Load.net_profit_est),
        "rate_per_mile": desc(Load.rate_per_mile),
        "recent":       desc(Load.posted_at),
        "miles":        desc(Load.miles),
    }
    q = q.order_by(sort_map.get(sort_by, desc(Load.net_profit_est)))

    # Apply daily view limit for Basic plan
    limit = PLAN_DAILY_LIMITS.get(current_user.plan, 20)
    if limit > 0:
        per_page = min(per_page, limit)

    loads = q.offset((page - 1) * per_page).limit(per_page).all()

    # Filter by profit_score after enrichment (computed field)
    enriched = [_enrich_load(l) for l in loads]
    if profit_score:
        enriched = [l for l in enriched if l.profit_score and l.profit_score.value == profit_score]

    return LoadListOut(
        loads=enriched,
        total=total,
        page=page,
        per_page=per_page,
        total_pages=-(-total // per_page),
    )


# ─── GET /api/loads/hot ────────────────────────────────────────────────────────
@router.get("/hot", response_model=list[LoadOut], summary="Get hot loads feed")
def hot_loads(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    loads = (
        db.query(Load)
        .options(joinedload(Load.broker))
        .filter(Load.is_hot == True, Load.status == LoadStatus.active)
        .order_by(desc(Load.posted_at))
        .limit(10)
        .all()
    )
    return [_enrich_load(l) for l in loads]


# ─── GET /api/loads/worst ──────────────────────────────────────────────────────
@router.get("/worst", response_model=list[LoadOut],
            summary="Worst loads of the day (viral feature)")
def worst_loads(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """The 'Worst Loads' feed — exposes the most egregiously bad-paying loads."""
    loads = (
        db.query(Load)
        .options(joinedload(Load.broker))
        .filter(Load.status == LoadStatus.active)
        .order_by(asc(Load.rate_per_mile))
        .limit(10)
        .all()
    )
    return [_enrich_load(l) for l in loads]


# ─── GET /api/loads/{id} ───────────────────────────────────────────────────────
@router.get("/{load_id}", response_model=LoadOut, summary="Get full load details")
def get_load(
    load_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    load = (
        db.query(Load)
        .options(joinedload(Load.broker))
        .filter(Load.id == load_id)
        .first()
    )
    if not load:
        raise HTTPException(status_code=404, detail="Load not found")

    # Increment view count
    load.view_count = (load.view_count or 0) + 1
    db.commit()

    return _enrich_load(load)


# ─── POST /api/loads ───────────────────────────────────────────────────────────
@router.post("", response_model=LoadOut, status_code=201,
             summary="Post a new load (broker only)")
def create_load(
    payload: LoadCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_broker),
):
    # Find or use the broker's broker profile
    from app.models.broker import Broker
    broker = db.query(Broker).filter(Broker.user_id == current_user.id).first()
    if not broker:
        raise HTTPException(
            status_code=400,
            detail="No broker profile found. Complete your broker profile first.",
        )

    load = Load(**payload.model_dump(), broker_id=broker.id, broker_user_id=current_user.id)
    db.add(load)
    db.commit()
    db.refresh(load)
    load.broker = broker
    return _enrich_load(load)


# ─── DELETE /api/loads/{id} ────────────────────────────────────────────────────
@router.delete("/{load_id}", status_code=204, summary="Remove a load (broker only)")
def delete_load(
    load_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_broker),
):
    load = db.query(Load).filter(
        Load.id == load_id, Load.broker_user_id == current_user.id
    ).first()
    if not load:
        raise HTTPException(status_code=404, detail="Load not found")
    load.status = LoadStatus.removed
    db.commit()


# ─── POST /api/loads/{id}/save ─────────────────────────────────────────────────
@router.post("/{load_id}/save", summary="Save / unsave a load (carrier only)")
def toggle_save(
    load_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_carrier),
):
    load = db.query(Load).filter(Load.id == load_id).first()
    if not load:
        raise HTTPException(status_code=404, detail="Load not found")

    existing = db.query(SavedLoad).filter(
        SavedLoad.carrier_id == current_user.id,
        SavedLoad.load_id == load_id,
    ).first()

    if existing:
        db.delete(existing)
        db.commit()
        return {"saved": False}
    else:
        db.add(SavedLoad(carrier_id=current_user.id, load_id=load_id))
        db.commit()
        return {"saved": True}


# ─── GET /api/loads/saved/me ───────────────────────────────────────────────────
@router.get("/saved/me", response_model=list[LoadOut], summary="Get carrier's saved loads")
def get_saved_loads(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_carrier),
):
    saved = (
        db.query(SavedLoad)
        .options(joinedload(SavedLoad.load).joinedload(Load.broker))
        .filter(SavedLoad.carrier_id == current_user.id)
        .all()
    )
    return [_enrich_load(s.load) for s in saved if s.load and s.load.status == LoadStatus.active]


# ─── POST /api/loads/calculate ─────────────────────────────────────────────────
@router.post("/calculate/profit", summary="Standalone profit calculator")
def calculate(
    rate: float = Query(...),
    loaded_miles: int = Query(...),
    deadhead_miles: int = Query(0),
    fuel_price: Optional[float] = Query(None),
    mpg: Optional[float] = Query(None),
    driver_pay: float = Query(0),
    tolls: float = Query(0),
    misc: float = Query(50),
    current_user: User = Depends(get_current_user),
):
    return calculate_profit(
        rate=rate,
        loaded_miles=loaded_miles,
        deadhead_miles=deadhead_miles,
        fuel_price=fuel_price,
        mpg=mpg,
        driver_pay=driver_pay,
        tolls=tolls,
        misc=misc,
    )
