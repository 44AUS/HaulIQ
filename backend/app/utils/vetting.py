"""
FMCSA-based business vetting for carrier and broker signups.
No AI — uses authoritative FMCSA data only.
"""
import json
from app.utils.fmcsa import verify_mc, names_match


async def vet_carrier(company: str, mc_number: str, api_key: str) -> dict:
    """
    Verifies a carrier against FMCSA. Returns dict with:
      ok          - bool, True if signup should be allowed
      status      - 'verified' | 'flagged'
      score       - int string (0-100)
      flags       - JSON list of issues
      summary     - human-readable explanation
      fmcsa       - raw MCVerifyResult for storing DOT/legal name
    """
    if not mc_number:
        return {
            "ok": False,
            "status": "flagged",
            "score": "0",
            "flags": json.dumps(["mc_number_required"]),
            "summary": "MC number is required for carrier accounts.",
            "fmcsa": None,
        }

    result = await verify_mc(mc_number, api_key)

    # Timeout or API unavailable — allow signup but flag for manual review
    if result.error and ("timed out" in result.error.lower() or "unavailable" in result.error.lower()):
        return {
            "ok": True,
            "status": "manual_review",
            "score": "50",
            "flags": json.dumps(["fmcsa_unavailable"]),
            "summary": "FMCSA verification unavailable — manual review required.",
            "fmcsa": result,
        }

    if not result.found:
        return {
            "ok": False,
            "status": "flagged",
            "score": "0",
            "flags": json.dumps(["mc_not_found"]),
            "summary": result.error or "MC number not found in FMCSA database.",
            "fmcsa": result,
        }

    if not result.authorized:
        return {
            "ok": False,
            "status": "flagged",
            "score": "10",
            "flags": json.dumps(result.raw_flags or ["not_authorized"]),
            "summary": "This carrier is not currently authorized to operate per FMCSA records.",
            "fmcsa": result,
        }

    # Name match check
    if result.legal_name and not names_match(company, result.legal_name, result.dba_name):
        fmcsa_display = result.legal_name
        if result.dba_name:
            fmcsa_display += f" (DBA: {result.dba_name})"
        return {
            "ok": False,
            "status": "flagged",
            "score": "20",
            "flags": json.dumps(["name_mismatch"]),
            "summary": f"Company name does not match FMCSA records. FMCSA shows: {fmcsa_display}",
            "fmcsa": result,
        }

    # Build score
    score = 80
    flags = list(result.raw_flags)

    if result.insurance_on_file:
        score += 10
    else:
        flags.append("no_insurance_on_file")

    if result.safety_rating and result.safety_rating.lower() == "satisfactory":
        score += 10
    elif result.safety_rating and result.safety_rating.lower() == "unsatisfactory":
        score -= 30
        flags.append("unsatisfactory_safety_rating")

    score = max(0, min(100, score))
    status = "verified" if score >= 75 else "manual_review"

    summary_parts = [f"FMCSA verified: {result.legal_name}."]
    if not result.insurance_on_file:
        summary_parts.append("No insurance on file.")
    if result.safety_rating:
        summary_parts.append(f"Safety rating: {result.safety_rating}.")

    return {
        "ok": True,
        "status": status,
        "score": str(score),
        "flags": json.dumps(flags),
        "summary": " ".join(summary_parts),
        "fmcsa": result,
    }


async def vet_broker(company: str, mc_number: str, api_key: str) -> dict:
    """
    Verifies a broker. If they provide an MC number, verifies via FMCSA.
    Brokers without MC are allowed but marked as manual_review.
    """
    if not mc_number:
        return {
            "ok": True,
            "status": "manual_review",
            "score": "50",
            "flags": json.dumps(["no_mc_provided"]),
            "summary": "No MC number provided. Manual review required.",
            "fmcsa": None,
        }

    result = await verify_mc(mc_number, api_key)

    if result.error and ("timed out" in result.error.lower() or "unavailable" in result.error.lower()):
        return {
            "ok": True,
            "status": "manual_review",
            "score": "50",
            "flags": json.dumps(["fmcsa_unavailable"]),
            "summary": "FMCSA verification unavailable — manual review required.",
            "fmcsa": result,
        }

    if not result.found:
        return {
            "ok": False,
            "status": "flagged",
            "score": "0",
            "flags": json.dumps(["mc_not_found"]),
            "summary": result.error or "MC number not found in FMCSA database.",
            "fmcsa": result,
        }

    if not result.authorized:
        return {
            "ok": False,
            "status": "flagged",
            "score": "10",
            "flags": json.dumps(result.raw_flags or ["not_authorized"]),
            "summary": "This MC number is not currently authorized per FMCSA records.",
            "fmcsa": result,
        }

    if result.legal_name and not names_match(company, result.legal_name, result.dba_name):
        fmcsa_display = result.legal_name
        if result.dba_name:
            fmcsa_display += f" (DBA: {result.dba_name})"
        return {
            "ok": False,
            "status": "flagged",
            "score": "20",
            "flags": json.dumps(["name_mismatch"]),
            "summary": f"Company name does not match FMCSA records. FMCSA shows: {fmcsa_display}",
            "fmcsa": result,
        }

    return {
        "ok": True,
        "status": "verified",
        "score": "90",
        "flags": json.dumps([]),
        "summary": f"FMCSA verified broker: {result.legal_name}.",
        "fmcsa": result,
    }
