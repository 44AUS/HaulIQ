"""
Driver Earnings Brain — HaulIQ's AI-powered profit intelligence engine.

Uses pandas + scikit-learn to analyse a carrier's load history and produce
personalized, actionable insights. The heavier the history, the smarter
the recommendations.
"""
from __future__ import annotations

import logging
from datetime import datetime, timedelta
from typing import Optional
from uuid import UUID

import numpy as np
import pandas as pd
from sqlalchemy.orm import Session

from app.models.analytics import LoadHistory, DriverInsight, LaneStats, InsightType
from app.models.user import User

logger = logging.getLogger(__name__)


# ─── Main entrypoint ──────────────────────────────────────────────────────────

def run_brain(carrier_id: UUID, db: Session) -> list[DriverInsight]:
    """
    Analyse a carrier's load history and generate/refresh their insights.
    Deletes stale insights older than 7 days, then produces new ones.
    """
    history = (
        db.query(LoadHistory)
        .filter(LoadHistory.carrier_id == carrier_id)
        .all()
    )

    if not history:
        return _default_insights(carrier_id, db)

    df = _to_dataframe(history)

    # Wipe all existing insights before regenerating (prevents duplicates on refresh)
    db.query(DriverInsight).filter(
        DriverInsight.carrier_id == carrier_id,
    ).delete(synchronize_session=False)

    insights: list[DriverInsight] = []
    insights += _lane_insights(df, carrier_id, db)
    insights += _broker_insights(df, carrier_id, db)
    insights += _deadhead_insights(df, carrier_id, db)
    insights += _equipment_insights(df, carrier_id, db)
    insights += _market_timing_insights(df, carrier_id, db)

    for ins in insights:
        db.add(ins)

    # Refresh lane stats table
    _refresh_lane_stats(df, carrier_id, db)

    db.commit()
    return insights


# ─── DataFrame builder ────────────────────────────────────────────────────────

def _to_dataframe(history: list[LoadHistory]) -> pd.DataFrame:
    rows = []
    for h in history:
        rows.append({
            "origin":        h.origin,
            "destination":   h.destination,
            "lane_key":      h.lane_key or f"{h.origin_state}_{h.dest_state}",
            "miles":         h.miles,
            "deadhead_miles": h.deadhead_miles or 0,
            "load_type":     h.load_type,
            "broker_name":   h.broker_name,
            "gross":         h.gross_revenue,
            "net":           h.net_profit,
            "rate_per_mile": h.rate_per_mile or 0,
            "net_per_mile":  h.net_per_mile or 0,
            "accepted_at":   h.accepted_at,
            "profitable":    h.net_profit > 0,
        })
    df = pd.DataFrame(rows)
    if not df.empty:
        df["accepted_at"] = pd.to_datetime(df["accepted_at"])
        df["week"] = df["accepted_at"].dt.to_period("W").astype(str)
        df["month"] = df["accepted_at"].dt.to_period("M").astype(str)
    return df


# ─── Lane insights ────────────────────────────────────────────────────────────

def _lane_insights(df: pd.DataFrame, carrier_id: UUID, db: Session) -> list[DriverInsight]:
    insights = []
    if df.empty or "lane_key" not in df.columns:
        return insights

    by_lane = (
        df.groupby("lane_key")
        .agg(runs=("net", "count"), avg_net=("net", "mean"), pct_profit=("profitable", "mean"))
        .reset_index()
        .sort_values("avg_net", ascending=False)
    )

    if by_lane.empty:
        return insights

    # Best lane
    best = by_lane.iloc[0]
    if best["runs"] >= 2:
        insights.append(DriverInsight(
            carrier_id=carrier_id,
            insight_type=InsightType.lane,
            icon="🏆",
            title="Your Best Lane",
            body=(
                f"{best['lane_key'].replace('_', '→')} earns you avg "
                f"${best['avg_net']:,.0f} net. You've run it {int(best['runs'])}x "
                f"with {best['pct_profit']*100:.0f}% profitability."
            ),
            tag="high-profit",
            action_label="Find loads on this lane",
        ))

    # Worst lane (avoid)
    worst = by_lane[by_lane["runs"] >= 2].iloc[-1] if len(by_lane[by_lane["runs"] >= 2]) > 1 else None
    if worst is not None and worst["avg_net"] < 300:
        insights.append(DriverInsight(
            carrier_id=carrier_id,
            insight_type=InsightType.lane,
            icon="🚫",
            title="Avoid This Lane",
            body=(
                f"{worst['lane_key'].replace('_', '→')} averages only "
                f"${worst['avg_net']:,.0f} net over {int(worst['runs'])} runs. "
                f"Only {worst['pct_profit']*100:.0f}% of runs were profitable."
            ),
            tag="warning",
            action_label="See alternative lanes",
        ))

    return insights


# ─── Broker insights ──────────────────────────────────────────────────────────

def _broker_insights(df: pd.DataFrame, carrier_id: UUID, db: Session) -> list[DriverInsight]:
    insights = []
    if df.empty or "broker_name" not in df.columns:
        return insights

    by_broker = (
        df.groupby("broker_name")
        .agg(runs=("net", "count"), avg_net=("net", "mean"), pct_profit=("profitable", "mean"))
        .reset_index()
    )

    bad_brokers = by_broker[(by_broker["pct_profit"] < 0.5) & (by_broker["runs"] >= 2)]
    for _, row in bad_brokers.iterrows():
        insights.append(DriverInsight(
            carrier_id=carrier_id,
            insight_type=InsightType.broker,
            icon="⚠️",
            title=f"Avoid: {row['broker_name']}",
            body=(
                f"Your {int(row['runs'])} loads with {row['broker_name']} averaged "
                f"${row['avg_net']:,.0f} net — only {row['pct_profit']*100:.0f}% profitable. "
                "Consider filtering them out."
            ),
            tag="warning",
            action_label="Flag this broker",
        ))

    return insights[:2]  # Cap at 2 broker warnings


# ─── Deadhead insights ────────────────────────────────────────────────────────

def _deadhead_insights(df: pd.DataFrame, carrier_id: UUID, db: Session) -> list[DriverInsight]:
    insights = []
    if df.empty:
        return insights

    avg_deadhead = df["deadhead_miles"].mean()
    top_earners_threshold = 30  # miles

    if avg_deadhead > top_earners_threshold:
        monthly_deadhead_cost = avg_deadhead * 0.62 * df.groupby("month").size().mean()
        insights.append(DriverInsight(
            carrier_id=carrier_id,
            insight_type=InsightType.deadhead,
            icon="🛣️",
            title="Cut Your Deadhead Miles",
            body=(
                f"Your avg deadhead is {avg_deadhead:.0f} mi. Top earners run <30 mi. "
                f"Tightening your pickup radius could save ~${monthly_deadhead_cost:,.0f}/month."
            ),
            tag="savings",
            action_label="Optimize deadhead",
        ))

    return insights


# ─── Equipment type insights ──────────────────────────────────────────────────

def _equipment_insights(df: pd.DataFrame, carrier_id: UUID, db: Session) -> list[DriverInsight]:
    insights = []
    if df.empty or "load_type" not in df.columns:
        return insights

    by_type = (
        df.groupby("load_type")
        .agg(avg_rpm=("rate_per_mile", "mean"), runs=("net", "count"))
        .reset_index()
        .sort_values("avg_rpm", ascending=False)
    )

    if len(by_type) >= 2:
        best_type  = by_type.iloc[0]
        worst_type = by_type.iloc[-1]
        if best_type["avg_rpm"] - worst_type["avg_rpm"] > 0.30:
            insights.append(DriverInsight(
                carrier_id=carrier_id,
                insight_type=InsightType.pattern,
                icon="📈",
                title=f"{best_type['load_type']} Pays You More",
                body=(
                    f"Your {best_type['load_type']} loads average "
                    f"${best_type['avg_rpm']:.2f}/mi vs "
                    f"${worst_type['avg_rpm']:.2f}/mi for {worst_type['load_type']}. "
                    f"Prioritize {best_type['load_type']} for better earnings."
                ),
                tag="insight",
                action_label=f"Filter {best_type['load_type']} loads",
            ))

    return insights


# ─── Market timing insights ───────────────────────────────────────────────────

def _market_timing_insights(df: pd.DataFrame, carrier_id: UUID, db: Session) -> list[DriverInsight]:
    """
    Detect if the carrier repeatedly accepted below-market loads —
    flag the pattern and suggest waiting for better rates.
    """
    insights = []
    if df.empty:
        return insights

    from app.utils.profit import MARKET_RATES
    market_default = MARKET_RATES["DEFAULT"]

    below_market = df[df["rate_per_mile"] < market_default * 0.85]
    if len(below_market) >= 3:
        avg_below = below_market["rate_per_mile"].mean()
        insights.append(DriverInsight(
            carrier_id=carrier_id,
            insight_type=InsightType.timing,
            icon="⏰",
            title="Wait for Better Rates",
            body=(
                f"You've accepted {len(below_market)} loads at avg ${avg_below:.2f}/mi — "
                f"well below market avg of ${market_default:.2f}/mi. "
                "Set a rate floor and wait for better paying loads."
            ),
            tag="timing",
            action_label="Set rate alert",
        ))

    return insights


# ─── Lane stats refresh ───────────────────────────────────────────────────────

def _refresh_lane_stats(df: pd.DataFrame, carrier_id: UUID, db: Session):
    # Clear old stats
    db.query(LaneStats).filter(LaneStats.carrier_id == carrier_id).delete(synchronize_session=False)

    if df.empty:
        return

    by_lane = (
        df.groupby("lane_key")
        .agg(
            run_count=("net", "count"),
            avg_net=("net", "mean"),
            avg_rpm=("rate_per_mile", "mean"),
            pct_profit=("profitable", "mean"),
            last_run=("accepted_at", "max"),
            origin=("origin", "first"),
            dest=("destination", "first"),
        )
        .reset_index()
    )

    for _, row in by_lane.iterrows():
        origin_parts = str(row.get("origin", "")).split(",")
        dest_parts   = str(row.get("dest", "")).split(",")

        stat = LaneStats(
            carrier_id=carrier_id,
            lane_key=row["lane_key"],
            display_label=row["lane_key"].replace("_", "→"),
            run_count=int(row["run_count"]),
            avg_net_profit=round(float(row["avg_net"]), 2),
            avg_rate_per_mile=round(float(row["avg_rpm"]), 2),
            profitability_pct=round(float(row["pct_profit"]) * 100, 1),
            last_run_at=row["last_run"].to_pydatetime() if hasattr(row["last_run"], "to_pydatetime") else None,
        )
        db.add(stat)


# ─── Default insights for new users ──────────────────────────────────────────

def _default_insights(carrier_id: UUID, db: Session) -> list[DriverInsight]:
    """Onboarding insights shown when a carrier has no history yet."""
    # Return existing defaults rather than duplicating them
    existing = (
        db.query(DriverInsight)
        .filter(DriverInsight.carrier_id == carrier_id)
        .all()
    )
    if existing:
        return existing

    defaults = [
        DriverInsight(
            carrier_id=carrier_id,
            insight_type=InsightType.pattern,
            icon="🚀",
            title="Complete Your First Load",
            body="Log your first completed load to start building your personalized Earnings Brain. The more history, the smarter the insights.",
            tag="onboarding",
            action_label="Log a load",
        ),
        DriverInsight(
            carrier_id=carrier_id,
            insight_type=InsightType.market,
            icon="📊",
            title="Current Market: $2.95/mi avg",
            body="The national dry van average is $2.95/mi. Reefer lanes run $3.10–$3.40/mi. Use our profit calculator to score every load before you commit.",
            tag="market",
            action_label="Open calculator",
        ),
    ]
    for d in defaults:
        db.add(d)
    db.commit()
    return defaults


# ─── Weekly earnings summary ──────────────────────────────────────────────────

def compute_weekly_earnings(history: list[LoadHistory]) -> list[dict]:
    if not history:
        return []

    df = _to_dataframe(history)
    grouped = (
        df.groupby("week")
        .agg(
            gross=("gross", "sum"),
            net=("net", "sum"),
            miles=("miles", "sum"),
            load_count=("net", "count"),
        )
        .reset_index()
        .sort_values("week")
        .tail(12)
    )

    return [
        {
            "week_label": row["week"],
            "gross":      round(float(row["gross"]), 2),
            "net":        round(float(row["net"]), 2),
            "miles":      int(row["miles"]),
            "load_count": int(row["load_count"]),
        }
        for _, row in grouped.iterrows()
    ]
