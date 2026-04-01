from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc, asc
from typing import Optional
from uuid import UUID
from datetime import date

from app.database import get_db
from app.models.load import Load, SavedLoad, LoadView, LoadStatus, ProfitScore
from app.models.user import User, UserPlan
from app.schemas.load import LoadCreate, LoadUpdate, LoadOut, LoadListOut
from app.middleware.auth import get_current_user, require_broker, require_carrier
from app.utils.profit import calculate_profit, get_market_rate
from app.utils.fuel_price import get_diesel_price

router = APIRouter()

PLAN_DAILY_LIMITS = {
    UserPlan.basic: 20,
    UserPlan.pro:   -1,   # unlimited
    UserPlan.elite: -1,
    UserPlan.admin: -1,
}


def _mask_addresses(load: Load, current_user: User, db: Session) -> Load:
    """Strip full pickup/delivery addresses from loads for carriers who haven't booked."""
    if current_user.role.value != "carrier":
        return load
    from app.models.booking import Booking
    has_booking = db.query(Booking).filter(
        Booking.load_id == load.id,
        Booking.carrier_id == current_user.id,
    ).first()
    if not has_booking:
        load.pickup_address   = None
        load.delivery_address = None
    return load


def _stamp_saved(loads: list, user_id, db: Session) -> list:
    """Set is_saved=True on any load the carrier has bookmarked."""
    saved_ids = {
        str(row.load_id)
        for row in db.query(SavedLoad.load_id).filter(SavedLoad.carrier_id == user_id).all()
    }
    for load in loads:
        load.is_saved = str(load.id) in saved_ids
    return loads


def _enrich_load(load: Load) -> Load:
    """Compute profit fields on a load object using live diesel price."""
    live_price, _ = get_diesel_price()
    result = calculate_profit(
        rate=load.rate,
        loaded_miles=load.miles,
        deadhead_miles=load.deadhead_miles or 0,
        fuel_price=live_price,
    )
    load.rate_per_mile      = result["rate_per_mile"]
    load.fuel_cost_est      = result["fuel_cost"]
    load.diesel_price_used  = live_price
    load.net_profit_est     = result["net_profit"]
    load.profit_score    = ProfitScore(result["profit_score"])
    market_rate          = get_market_rate(load.origin_state, load.dest_state)
    load.market_rate_per_mile = market_rate
    load.is_above_market = (result["rate_per_mile"] >= market_rate)
    return load


# ─── GET /api/loads/fuel-price ────────────────────────────────────────────────
@router.get("/fuel-price", summary="Current US diesel price used in profit calculations")
def fuel_price(current_user: User = Depends(get_current_user)):
    price, updated = get_diesel_price()
    return {"price": price, "source": "EIA", "updated": updated}


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
    origin:             Optional[str]        = Query(None),
    dest:               Optional[str]        = Query(None),
    max_origin_deadhead: Optional[int]       = Query(None),
    load_types:         Optional[str]        = Query(None),
    load_size:          Optional[str]        = Query(None),
    min_weight:         Optional[int]        = Query(None),
    max_weight:         Optional[int]        = Query(None),
    max_length:         Optional[int]        = Query(None),
    pickup_date_from:   Optional[date]       = Query(None),
    pickup_date_to:     Optional[date]       = Query(None),
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

    if origin:              q = q.filter(Load.origin.ilike(f'%{origin}%'))
    if dest:                q = q.filter(Load.destination.ilike(f'%{dest}%'))
    if max_origin_deadhead is not None: q = q.filter(Load.deadhead_miles <= max_origin_deadhead)
    if load_types:
        type_list = [t.strip() for t in load_types.split(',') if t.strip()]
        if type_list: q = q.filter(Load.load_type.in_(type_list))
    if load_size:           q = q.filter(Load.load_size == load_size)
    if min_weight:          q = q.filter(Load.weight_lbs >= min_weight)
    if max_weight:          q = q.filter(Load.weight_lbs <= max_weight)
    if max_length:          q = q.filter(Load.trailer_length_ft <= max_length)
    if pickup_date_from:    q = q.filter(Load.pickup_date >= pickup_date_from)
    if pickup_date_to:      q = q.filter(Load.pickup_date <= pickup_date_to)

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
    _stamp_saved(enriched, current_user.id, db)

    for load in enriched:
        _mask_addresses(load, current_user, db)

    return LoadListOut(
        loads=enriched,
        total=total,
        page=page,
        per_page=per_page,
        total_pages=-(-total // per_page),
    )


# ─── GET /api/loads/posted ────────────────────────────────────────────────────
@router.get("/posted", response_model=list[LoadOut], summary="Broker's own posted loads (all statuses)")
def my_posted_loads(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_broker),
):
    loads = (
        db.query(Load)
        .options(joinedload(Load.broker))
        .filter(Load.broker_user_id == current_user.id)
        .order_by(desc(Load.posted_at))
        .all()
    )
    return [_enrich_load(l) for l in loads]


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

    # Unique view tracking: skip broker who posted, skip repeat viewers
    is_poster = (load.broker_user_id and str(current_user.id) == str(load.broker_user_id))
    if not is_poster:
        already_viewed = db.query(LoadView).filter(
            LoadView.load_id == load.id,
            LoadView.viewer_id == current_user.id,
        ).first()
        if not already_viewed:
            db.add(LoadView(load_id=load.id, viewer_id=current_user.id))
            load.view_count = (load.view_count or 0) + 1
    db.commit()

    enriched = _enrich_load(load)
    _stamp_saved([enriched], current_user.id, db)
    _mask_addresses(enriched, current_user, db)
    return enriched


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


# ─── PATCH /api/loads/{id} ─────────────────────────────────────────────────────
@router.patch("/{load_id}", response_model=LoadOut, summary="Update a load (broker only)")
def update_load(
    load_id: UUID,
    payload: LoadUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_broker),
):
    load = db.query(Load).filter(
        Load.id == load_id, Load.broker_user_id == current_user.id
    ).first()
    if not load:
        raise HTTPException(status_code=404, detail="Load not found")
    if load.status != LoadStatus.active:
        raise HTTPException(status_code=400, detail="Only active loads can be edited")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(load, field, value)

    db.commit()
    db.refresh(load)
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
    enriched = [_enrich_load(s.load) for s in saved if s.load and s.load.status == LoadStatus.active]
    for l in enriched:
        l.is_saved = True
    return enriched


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
