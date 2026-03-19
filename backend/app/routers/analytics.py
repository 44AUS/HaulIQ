from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from uuid import UUID

from app.database import get_db
from app.models.analytics import LoadHistory, DriverInsight, LaneStats
from app.models.user import User
from app.schemas.analytics import (
    LoadHistoryOut, InsightOut, LaneStatsOut, EarningsSummary, WeeklyEarning
)
from app.middleware.auth import get_current_user, require_carrier, require_plan
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
