"""
Live US diesel price fetcher — EIA (Energy Information Administration).
Caches for 24 hours so we don't hammer the API on every load request.
Falls back to the config default if the fetch fails.

Series: PET.EMD_EPD2D_PTE_NUS_DPG.W
  = weekly US on-highway diesel, dollars per gallon (national average)
"""
import time
import logging
import httpx
from app.config import get_settings

logger = logging.getLogger(__name__)

_cache: dict = {"price": None, "fetched_at": 0.0, "updated_date": None}
CACHE_TTL = 86_400  # 24 hours

EIA_V1_URL = "https://api.eia.gov/series/?series_id=PET.EMD_EPD2D_PTE_NUS_DPG.W&api_key={key}"


def get_diesel_price() -> tuple[float, str | None]:
    """
    Return (price_per_gallon, date_string).
    Uses the EIA weekly US on-highway diesel series.
    Cached 24h. Falls back to config default on any error.
    """
    settings = get_settings()
    now = time.time()

    if _cache["price"] and (now - _cache["fetched_at"]) < CACHE_TTL:
        return _cache["price"], _cache["updated_date"]

    api_key = getattr(settings, "eia_api_key", "DEMO_KEY") or "DEMO_KEY"
    url = EIA_V1_URL.format(key=api_key)

    try:
        resp = httpx.get(url, timeout=8.0)
        resp.raise_for_status()
        data = resp.json()

        series = data.get("series", [])
        if not series:
            raise ValueError("Empty series in EIA response")

        # data rows: [[period, value], ...]  most recent first
        rows = series[0].get("data", [])
        if not rows:
            raise ValueError("No data rows in EIA series")

        date_str = str(rows[0][0])
        price = float(rows[0][1])

        _cache["price"] = price
        _cache["fetched_at"] = now
        _cache["updated_date"] = date_str
        logger.info(f"EIA diesel updated: ${price}/gal ({date_str})")
        return price, date_str

    except Exception as exc:
        logger.warning(f"EIA fuel fetch failed ({exc}). Using default ${settings.default_fuel_price}/gal.")
        return settings.default_fuel_price, None
