"""
FMCSA MC number verification via the FMCSA Query API.
Free API key: https://ai.fmcsa.dot.gov/Carrier-Research/Carrier-API

Set FMCSA_API_KEY in your .env / Railway environment variables.
If left empty, duplicate checking still works but FMCSA lookup is skipped.
"""
import re
import httpx
from typing import Optional
from dataclasses import dataclass


FMCSA_BASE = "https://mobile.fmcsa.dot.gov/qc/services/carriers/mc-number"
TIMEOUT = 8  # seconds


@dataclass
class MCVerifyResult:
    found: bool
    authorized: bool          # allowed to operate per FMCSA
    legal_name: Optional[str]
    operating_status: Optional[str]
    dot_number: Optional[str]
    error: Optional[str]


def _strip_mc(raw: str) -> str:
    """'MC-123456' or 'mc123456' → '123456'"""
    return re.sub(r'[^0-9]', '', raw.strip())


async def verify_mc(mc_raw: str, api_key: str) -> MCVerifyResult:
    """
    Look up an MC number with the FMCSA API.
    Returns MCVerifyResult with found/authorized/name.
    If api_key is empty, returns found=True, authorized=True (skip check).
    """
    mc = _strip_mc(mc_raw)
    if not mc:
        return MCVerifyResult(found=False, authorized=False, legal_name=None,
                              operating_status=None, dot_number=None,
                              error="Invalid MC number format")

    if not api_key:
        # No API key configured — skip FMCSA check, allow signup
        return MCVerifyResult(found=True, authorized=True, legal_name=None,
                              operating_status=None, dot_number=None, error=None)

    url = f"{FMCSA_BASE}/{mc}?webKey={api_key}"
    try:
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            resp = await client.get(url)

        if resp.status_code == 404:
            return MCVerifyResult(found=False, authorized=False, legal_name=None,
                                  operating_status=None, dot_number=None,
                                  error="MC number not found in FMCSA database")

        if resp.status_code != 200:
            return MCVerifyResult(found=False, authorized=False, legal_name=None,
                                  operating_status=None, dot_number=None,
                                  error=f"FMCSA API error ({resp.status_code})")

        data = resp.json()
        carrier = (data.get("content") or {}).get("carrier") or {}

        if not carrier:
            return MCVerifyResult(found=False, authorized=False, legal_name=None,
                                  operating_status=None, dot_number=None,
                                  error="MC number not found in FMCSA database")

        allowed = str(carrier.get("allowedToOperate", "N")).upper() == "Y"
        legal_name = carrier.get("legalName") or carrier.get("dbaName")
        op_status = carrier.get("operatingStatus")
        dot_number = str(carrier.get("dotNumber")) if carrier.get("dotNumber") else None

        return MCVerifyResult(
            found=True,
            authorized=allowed,
            legal_name=legal_name,
            operating_status=op_status,
            dot_number=dot_number,
            error=None if allowed else "Carrier is not currently authorized to operate",
        )

    except httpx.TimeoutException:
        return MCVerifyResult(found=False, authorized=False, legal_name=None,
                              operating_status=None, dot_number=None,
                              error="FMCSA lookup timed out — try again")
    except Exception as e:
        return MCVerifyResult(found=False, authorized=False, legal_name=None,
                              operating_status=None, dot_number=None,
                              error=f"Verification unavailable: {str(e)}")
