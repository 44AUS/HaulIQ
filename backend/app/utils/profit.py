"""
Profit calculation utilities — the core of HaulIQ's value proposition.
Every load on the board has its net profit computed here.
"""
from app.config import get_settings

settings = get_settings()


def calculate_profit(
    rate: float,
    loaded_miles: int,
    deadhead_miles: int = 0,
    fuel_price: float | None = None,
    mpg: float | None = None,
    driver_pay: float = 0.0,
    tolls: float = 0.0,
    misc: float = 50.0,
) -> dict:
    """
    Calculate net profit for a load.

    Returns:
        dict with fuel_cost, total_expenses, net_profit,
        rate_per_mile, net_per_mile, margin_pct, profit_score
    """
    fuel_price = fuel_price or settings.default_fuel_price
    mpg        = mpg        or settings.default_mpg

    total_miles  = loaded_miles + deadhead_miles
    fuel_cost    = (total_miles / mpg) * fuel_price
    total_expenses = fuel_cost + driver_pay + tolls + misc
    net_profit   = rate - total_expenses
    rate_per_mile = rate / loaded_miles if loaded_miles > 0 else 0.0
    net_per_mile  = net_profit / loaded_miles if loaded_miles > 0 else 0.0
    margin_pct    = (net_profit / rate * 100) if rate > 0 else 0.0

    profit_score = _score(net_profit, net_per_mile)

    return {
        "fuel_cost":       round(fuel_cost, 2),
        "total_expenses":  round(total_expenses, 2),
        "net_profit":      round(net_profit, 2),
        "rate_per_mile":   round(rate_per_mile, 2),
        "net_per_mile":    round(net_per_mile, 2),
        "margin_pct":      round(margin_pct, 1),
        "profit_score":    profit_score,
    }


def _score(net_profit: float, net_per_mile: float) -> str:
    """Color-code the load: green / yellow / red."""
    if net_profit >= 1500 or (net_per_mile >= 2.50 and net_profit >= 500):
        return "green"
    if net_profit >= 400:
        return "yellow"
    return "red"


# Market rate reference table by lane (state pair) — seed for Rate Intelligence
MARKET_RATES: dict[str, float] = {
    "IL_GA": 3.20, "TX_AZ": 3.10, "FL_NY": 3.30, "WA_OR": 2.90,
    "TX_TN": 3.00, "CA_NV": 2.80, "CO_MO": 2.70, "TN_NC": 2.85,
    "DEFAULT": 2.95,
}


def get_market_rate(origin_state: str | None, dest_state: str | None) -> float:
    if not origin_state or not dest_state:
        return MARKET_RATES["DEFAULT"]
    key = f"{origin_state}_{dest_state}"
    return MARKET_RATES.get(key, MARKET_RATES["DEFAULT"])
