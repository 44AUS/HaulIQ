"""
Live US diesel price fetcher — EIA (Energy Information Administration).
Caches for 24 hours so we don't hammer the API on every load request.
Falls back to the config default if the fetch fails.
"""
import time
import logging
import httpx
from app.config import get_settings

logger = logging.getLogger(__name__)

# In-memory 24-hour cache
_cache: dict = {"price": None, "fetched_at": 0.0, "updated_date": None}
CACHE_TTL = 86_400  # 24 hours

# EIA v2 API — weekly US average on-highway diesel price (series DUS)
# DEMO_KEY allows ~100 req/day which is plenty with 24h caching.
# Override via EIA_API_KEY env var for higher limits.
EIA_URL = (
    "https://api.eia.gov/v2/petroleum/pri/gnd/data/"
    "?frequency=weekly"
    "&data[0]=value"
    "&facets[product][]=DUS"
    "&sort[0][column]=period"
    "&sort[0][direction]=desc"
    "&length=1"
)


def get_diesel_price() -> tuple[float, str | None]:
    """
    Return (price_per_gallon, date_string).
    Price is the most recent EIA weekly US average on-highway diesel price.
    Cached 24 hours. Falls back to config default on any error.
    """
    settings = get_settings()
    now = time.time()

    if _cache["price"] and (now - _cache["fetched_at"]) < CACHE_TTL:
        return _cache["price"], _cache["updated_date"]

    api_key = getattr(settings, "eia_api_key", "DEMO_KEY") or "DEMO_KEY"
    url = EIA_URL + f"&api_key={api_key}"

    try:
        resp = httpx.get(url, timeout=5.0)
        resp.raise_for_status()
        data = resp.json()
        row = data["response"]["data"][0]
        price = float(row["value"])
        date_str = row.get("period")
        _cache["price"] = price
        _cache["fetched_at"] = now
        _cache["updated_date"] = date_str
        logger.info(f"EIA diesel price updated: ${price}/gal ({date_str})")
        return price, date_str
    except Exception as exc:
        logger.warning(f"EIA fuel price fetch failed ({exc}). Using default.")
        fallback = settings.default_fuel_price
        return fallback, None
