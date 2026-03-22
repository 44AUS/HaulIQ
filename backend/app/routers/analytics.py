from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import func
from uuid import UUID
from datetime import datetime, timedelta

from app.database import get_db
from app.models.analytics import LoadHistory, DriverInsight, LaneStats
from app.models.load import Load, LoadStatus
from app.models.booking import Bid, Booking, BookingStatus
from app.models.broker import Broker
from app.models.user import User
from app.schemas.analytics import (
    LoadHistoryOut, InsightOut, LaneStatsOut, EarningsSummary, WeeklyEarning
)
from app.middleware.auth import get_current_user, require_carrier, require_broker, require_plan
from app.services.earnings_brain import run_brain, compute_weekly_earnings

router = APIRouter()


# ─── POST /api/analytics/history ──────────────────────────────────────────────
@router.post("/history", response_model=LoadHistoryOut, status_code=201,
             summary="Log a completed load to load history")
def log_completed_load(
    payload: LoadHistoryOut,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_carrier),
):
    entry = LoadHistory(
        carrier_id=current_user.id,
        origin=payload.origin,
        destination=payload.destination,
        lane_key=payload.lane_key,
        miles=payload.miles,
        deadhead_miles=payload.deadhead_miles,
        load_type=payload.load_type,
        broker_name=payload.broker_name,
        gross_revenue=payload.gross_revenue,
        fuel_cost=payload.fuel_cost,
        net_profit=payload.net_profit,
        rate_per_mile=payload.rate_per_mile,
        net_per_mile=payload.net_per_mile,
        pickup_date=payload.pickup_date,
        delivery_date=payload.delivery_date,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)

    # Trigger Earnings Brain refresh in background (non-blocking)
    background_tasks.add_task(run_brain, current_user.id, db)

    return entry


# ─── GET /api/analytics/history ───────────────────────────────────────────────
@router.get("/history", response_model=list[LoadHistoryOut],
            summary="Get carrier's load history")
def get_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_carrier),
):
    return (
        db.query(LoadHistory)
        .filter(LoadHistory.carrier_id == current_user.id)
        .order_by(LoadHistory.accepted_at.desc())
        .limit(100)
        .all()
    )


# ─── GET /api/analytics/summary ───────────────────────────────────────────────
@router.get("/summary", response_model=EarningsSummary,
            summary="Full earnings summary with weekly breakdown")
def get_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_plan("pro", "elite")),
):
    history = (
        db.query(LoadHistory)
        .filter(LoadHistory.carrier_id == current_user.id)
        .all()
    )

    if not history:
        return EarningsSummary(
            total_gross=0, total_net=0, total_miles=0, total_loads=0,
            avg_rate_per_mile=0, avg_net_per_mile=0, avg_deadhead_miles=0,
            best_lane=None, weekly_earnings=[], lane_stats=[],
        )

    total_gross  = sum(h.gross_revenue for h in history)
    total_net    = sum(h.net_profit for h in history)
    total_miles  = sum(h.miles for h in history)
    avg_rpm      = total_gross / total_miles if total_miles else 0
    avg_net_pm   = total_net  / total_miles if total_miles else 0
    avg_deadhead = sum(h.deadhead_miles for h in history) / len(history)

    lane_stats = (
        db.query(LaneStats)
        .filter(LaneStats.carrier_id == current_user.id)
        .order_by(LaneStats.avg_net_profit.desc())
        .all()
    )
    best_lane = lane_stats[0].display_label if lane_stats else None

    weekly = compute_weekly_earnings(history)

    return EarningsSummary(
        total_gross=round(total_gross, 2),
        total_net=round(total_net, 2),
        total_miles=total_miles,
        total_loads=len(history),
        avg_rate_per_mile=round(avg_rpm, 2),
        avg_net_per_mile=round(avg_net_pm, 2),
        avg_deadhead_miles=round(avg_deadhead, 1),
        best_lane=best_lane,
        weekly_earnings=[WeeklyEarning(**w) for w in weekly],
        lane_stats=lane_stats,
    )


# ─── GET /api/analytics/insights ──────────────────────────────────────────────
@router.get("/insights", response_model=list[InsightOut],
            summary="Get Earnings Brain insights for this carrier")
def get_insights(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_carrier),
):
    insights = (
        db.query(DriverInsight)
        .filter(DriverInsight.carrier_id == current_user.id)
        .order_by(DriverInsight.generated_at.desc())
        .limit(20)
        .all()
    )

    # If no insights yet, generate them now
    if not insights:
        insights = run_brain(current_user.id, db)

    return insights


# ─── POST /api/analytics/insights/refresh ─────────────────────────────────────
@router.post("/insights/refresh", summary="Manually trigger Earnings Brain refresh")
def refresh_insights(
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_plan("pro", "elite")),
):
    background_tasks.add_task(run_brain, current_user.id, db)
    return {"message": "Earnings Brain is running — check back in a few seconds."}


# ─── PATCH /api/analytics/insights/{id}/read ──────────────────────────────────
@router.patch("/insights/{insight_id}/read", summary="Mark insight as read")
def mark_read(
    insight_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_carrier),
):
    insight = db.query(DriverInsight).filter(
        DriverInsight.id == insight_id,
        DriverInsight.carrier_id == current_user.id,
    ).first()
    if not insight:
        raise HTTPException(status_code=404, detail="Insight not found")
    insight.is_read = True
    db.commit()
    return {"ok": True}


# ─── GET /api/analytics/lanes ─────────────────────────────────────────────────
@router.get("/lanes", response_model=list[LaneStatsOut],
            summary="Get carrier's lane performance stats")
def get_lane_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_plan("pro", "elite")),
):
    return (
        db.query(LaneStats)
        .filter(LaneStats.carrier_id == current_user.id)
        .order_by(LaneStats.avg_net_profit.desc())
        .all()
    )


# ─── GET /api/analytics/broker ────────────────────────────────────────────────
@router.get("/broker", summary="Broker analytics: KPIs, weekly chart, top carriers")
def get_broker_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_broker),
):
    broker = db.query(Broker).filter(Broker.user_id == current_user.id).first()
    if not broker:
        return {
            "total_views": 0, "total_bids": 0, "fill_rate": 0,
            "avg_time_to_fill_hours": None, "weekly": [], "top_carriers": [],
        }

    # All loads posted by this broker
    loads = db.query(Load).filter(Load.broker_id == broker.id).all()
    load_ids = [l.id for l in loads]

    if not load_ids:
        return {
            "total_views": 0, "total_bids": 0, "fill_rate": 0,
            "avg_time_to_fill_hours": None, "weekly": [], "top_carriers": [],
        }

    total_views = sum(l.view_count or 0 for l in loads)
    total_bids  = db.query(Bid).filter(Bid.load_id.in_(load_ids)).count()
    filled_count = sum(1 for l in loads if l.status == LoadStatus.filled)
    fill_rate = round(filled_count / len(loads) * 100, 1) if loads else 0

    # Avg time-to-fill: from posted_at to booking approved updated_at
    approved_bookings = (
        db.query(Booking)
        .filter(Booking.load_id.in_(load_ids), Booking.status == BookingStatus.approved)
        .all()
    )
    load_posted_at = {l.id: l.posted_at for l in loads}
    fill_times = []
    for bk in approved_bookings:
        if bk.load_id in load_posted_at and load_posted_at[bk.load_id] and bk.updated_at:
            delta = (bk.updated_at - load_posted_at[bk.load_id]).total_seconds() / 3600
            if delta >= 0:
                fill_times.append(delta)
    avg_time_to_fill = round(sum(fill_times) / len(fill_times), 1) if fill_times else None

    # Weekly data: last 6 weeks
    now = datetime.utcnow()
    weekly = []
    for week_offset in range(5, -1, -1):
        week_start = now - timedelta(weeks=week_offset + 1)
        week_end   = now - timedelta(weeks=week_offset)
        week_loads = [l for l in loads if l.posted_at and week_start <= l.posted_at < week_end]
        week_load_ids = [l.id for l in week_loads]
        week_views  = sum(l.view_count or 0 for l in week_loads)
        week_bids   = db.query(Bid).filter(Bid.load_id.in_(week_load_ids)).count() if week_load_ids else 0
        week_filled = sum(1 for l in week_loads if l.status == LoadStatus.filled)
        week_label  = f"W{6 - week_offset}"
        weekly.append({"week": week_label, "views": week_views, "bids": week_bids, "filled": week_filled})

    # Top carriers by number of approved bookings
    top_carriers_query = (
        db.query(
            User.name,
            User.company,
            User.mc_number,
            func.count(Booking.id).label("loads_count"),
        )
        .join(Booking, Booking.carrier_id == User.id)
        .filter(Booking.load_id.in_(load_ids), Booking.status == BookingStatus.approved)
        .group_by(User.id, User.name, User.company, User.mc_number)
        .order_by(func.count(Booking.id).desc())
        .limit(5)
        .all()
    )

    top_carriers = [
        {
            "name": r.company or r.name,
            "mc_number": r.mc_number,
            "loads": r.loads_count,
        }
        for r in top_carriers_query
    ]

    return {
        "total_views": total_views,
        "total_bids": total_bids,
        "fill_rate": fill_rate,
        "avg_time_to_fill_hours": avg_time_to_fill,
        "weekly": weekly,
        "top_carriers": top_carriers,
    }
