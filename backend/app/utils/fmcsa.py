"""
FMCSA MC number verification via the FMCSA Query API.
Free API key: https://ai.fmcsa.dot.gov/Carrier-Research/Carrier-API

Set FMCSA_API_KEY in your .env / Railway environment variables.
If left empty, duplicate checking still works but FMCSA lookup is skipped.
"""
import re
import httpx
from typing import Optional
from dataclasses import dataclass, field


FMCSA_BASE = "https://mobile.fmcsa.dot.gov/qc/services/carriers/mc-number"
TIMEOUT = 8  # seconds


@dataclass
class MCVerifyResult:
    found: bool
    authorized: bool          # allowed to operate per FMCSA
    legal_name: Optional[str]
    dba_name: Optional[str]
    operating_status: Optional[str]
    dot_number: Optional[str]
    safety_rating: Optional[str]
    insurance_on_file: bool
    carrier_operation: Optional[str]  # e.g. "A" (interstate), "B" (intrastate)
    error: Optional[str]
    raw_flags: list = field(default_factory=list)


def _strip_mc(raw: str) -> str:
    """'MC-123456' or 'mc123456' → '123456'"""
    return re.sub(r'[^0-9]', '', raw.strip())


def _normalize_name(name: str) -> str:
    """Lowercase, remove common suffixes and punctuation for fuzzy comparison."""
    if not name:
        return ''
    n = name.lower()
    # Remove common business suffixes
    for suffix in [' llc', ' inc', ' corp', ' ltd', ' co', ' company',
                   ' trucking', ' transport', ' transportation', ' logistics',
                   ' freight', ' carriers', ' carrier', ' services', ' group']:
        n = n.replace(suffix, '')
    # Remove punctuation
    n = re.sub(r'[^a-z0-9\s]', '', n)
    return ' '.join(n.split())  # collapse whitespace


def names_match(entered: str, fmcsa_legal: str, fmcsa_dba: Optional[str] = None) -> bool:
    """
    Returns True if the entered company name is a reasonable match for the
    FMCSA legal name or DBA name. Uses normalized substring and word-overlap checks.
    """
    a = _normalize_name(entered)
    b = _normalize_name(fmcsa_legal or '')
    c = _normalize_name(fmcsa_dba or '')

    if not a or not b:
        return False

    # Exact match after normalization
    if a == b or (c and a == c):
        return True

    # One contains the other
    if a in b or b in a:
        return True
    if c and (a in c or c in a):
        return True

    # Word overlap ratio >= 0.6
    words_a = set(a.split())
    words_b = set(b.split())
    if words_a and words_b:
        overlap = len(words_a & words_b) / max(len(words_a), len(words_b))
        if overlap >= 0.6:
            return True

    return False


async def verify_mc(mc_raw: str, api_key: str) -> MCVerifyResult:
    """
    Look up an MC number with the FMCSA API.
    Returns MCVerifyResult with full carrier data.
    If api_key is empty, returns found=True, authorized=True (skip check).
    """
    mc = _strip_mc(mc_raw)
    if not mc:
        return MCVerifyResult(
            found=False, authorized=False, legal_name=None, dba_name=None,
            operating_status=None, dot_number=None, safety_rating=None,
            insurance_on_file=False, carrier_operation=None,
            error="Invalid MC number format",
        )

    if not api_key:
        return MCVerifyResult(
            found=True, authorized=True, legal_name=None, dba_name=None,
            operating_status=None, dot_number=None, safety_rating=None,
            insurance_on_file=True, carrier_operation=None, error=None,
        )

    url = f"{FMCSA_BASE}/{mc}?webKey={api_key}"
    try:
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            resp = await client.get(url)

        if resp.status_code == 404:
            return MCVerifyResult(
                found=False, authorized=False, legal_name=None, dba_name=None,
                operating_status=None, dot_number=None, safety_rating=None,
                insurance_on_file=False, carrier_operation=None,
                error="MC number not found in FMCSA database",
            )

        if resp.status_code != 200:
            return MCVerifyResult(
                found=False, authorized=False, legal_name=None, dba_name=None,
                operating_status=None, dot_number=None, safety_rating=None,
                insurance_on_file=False, carrier_operation=None,
                error=f"FMCSA API error ({resp.status_code})",
            )

        data = resp.json()
        carrier = (data.get("content") or {}).get("carrier") or {}

        if not carrier:
            return MCVerifyResult(
                found=False, authorized=False, legal_name=None, dba_name=None,
                operating_status=None, dot_number=None, safety_rating=None,
                insurance_on_file=False, carrier_operation=None,
                error="MC number not found in FMCSA database",
            )

        allowed         = str(carrier.get("allowedToOperate", "N")).upper() == "Y"
        legal_name      = carrier.get("legalName")
        dba_name        = carrier.get("dbaName")
        op_status       = carrier.get("operatingStatus")
        dot_number      = str(carrier.get("dotNumber")) if carrier.get("dotNumber") else None
        safety_rating   = carrier.get("safetyRating")
        insurance       = str(carrier.get("bipdInsuranceOnFile", "0")) != "0"
        carrier_op      = carrier.get("carrierOperation")

        flags = []
        if not allowed:
            flags.append("not_authorized")
        if not insurance:
            flags.append("no_insurance_on_file")
        if safety_rating and safety_rating.lower() == "unsatisfactory":
            flags.append("unsatisfactory_safety_rating")

        return MCVerifyResult(
            found=True,
            authorized=allowed,
            legal_name=legal_name,
            dba_name=dba_name,
            operating_status=op_status,
            dot_number=dot_number,
            safety_rating=safety_rating,
            insurance_on_file=insurance,
            carrier_operation=carrier_op,
            error=None if allowed else "Carrier is not currently authorized to operate",
            raw_flags=flags,
        )

    except httpx.TimeoutException:
        return MCVerifyResult(
            found=False, authorized=False, legal_name=None, dba_name=None,
            operating_status=None, dot_number=None, safety_rating=None,
            insurance_on_file=False, carrier_operation=None,
            error="FMCSA lookup timed out — please try again",
        )
    except Exception as e:
        return MCVerifyResult(
            found=False, authorized=False, legal_name=None, dba_name=None,
            operating_status=None, dot_number=None, safety_rating=None,
            insurance_on_file=False, carrier_operation=None,
            error=f"Verification unavailable: {str(e)}",
        )
