import hashlib
import hmac
import base64
import logging
from datetime import datetime, timedelta
from uuid import UUID

import Adyen
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.subscription import Plan, Subscription, SubStatus
from app.models.user import User, UserPlan

router = APIRouter()
logger = logging.getLogger(__name__)


# ─── Adyen client ─────────────────────────────────────────────────────────────

def _adyen_client():
    settings = get_settings()
    ady = Adyen.Adyen()
    ady.checkout.client.xapikey = settings.adyen_api_key
    ady.checkout.client.platform = settings.adyen_environment.lower()
    ady.checkout.client.merchantAccount = settings.adyen_merchant_account
    return ady


# ─── Schemas ──────────────────────────────────────────────────────────────────

class CreateSessionRequest(BaseModel):
    plan_id: UUID
    return_url: str


# ─── Create checkout session ──────────────────────────────────────────────────

@router.post("/session", summary="Create Adyen checkout session for a plan")
def create_checkout_session(
    payload: CreateSessionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    settings = get_settings()

    plan = db.query(Plan).filter(Plan.id == payload.plan_id, Plan.is_active == True).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")

    if plan.role.value != current_user.role.value:
        raise HTTPException(
            status_code=400,
            detail=f"This plan is for {plan.role} accounts only.",
        )

    if plan.price == 0:
        raise HTTPException(
            status_code=400,
            detail="Free plans don't require payment. Use /api/subscriptions/change.",
        )

    if not settings.adyen_api_key or not settings.adyen_merchant_account:
        raise HTTPException(status_code=503, detail="Payment provider not configured.")

    ady = _adyen_client()
    amount_cents = int(round(plan.price * 100))

    request_body = {
        "amount": {"currency": "USD", "value": amount_cents},
        "countryCode": "US",
        "merchantAccount": settings.adyen_merchant_account,
        "reference": f"hauliq-{current_user.id}-{plan.id}",
        "returnUrl": payload.return_url,
        "shopperEmail": current_user.email,
        "shopperReference": str(current_user.id),
        "recurringProcessingModel": "Subscription",
        "storePaymentMethod": True,
        "channel": "Web",
        "metadata": {
            "plan_id": str(plan.id),
            "user_id": str(current_user.id),
        },
    }

    try:
        result = ady.checkout.sessions_api.sessions(request_body)
        return {
            "session_id": result.message["id"],
            "session_data": result.message["sessionData"],
            "client_key": settings.adyen_client_key,
            "environment": settings.adyen_environment,
            "plan": {
                "id": str(plan.id),
                "name": plan.name,
                "price": plan.price,
                "tier": plan.tier.value,
            },
        }
    except Exception as e:
        logger.error(f"Adyen session creation failed: {e}")
        raise HTTPException(status_code=502, detail="Payment provider error. Please try again.")


# ─── Webhook ──────────────────────────────────────────────────────────────────

def _verify_hmac(item: dict, hmac_key_hex: str) -> bool:
    try:
        hmac_key_bytes = bytes.fromhex(hmac_key_hex)
        n = item.get("NotificationRequestItem", {})
        fields = [
            n.get("pspReference", ""),
            n.get("originalReference", ""),
            n.get("merchantAccountCode", ""),
            n.get("merchantReference", ""),
            str(n.get("amount", {}).get("value", "")),
            n.get("amount", {}).get("currency", ""),
            n.get("eventCode", ""),
            str(n.get("success", "")),
        ]
        data_to_sign = ":".join(fields)
        digest = hmac.new(hmac_key_bytes, data_to_sign.encode("utf-8"), hashlib.sha256).digest()
        expected = base64.b64encode(digest).decode()
        received = n.get("additionalData", {}).get("hmacSignature", "")
        return hmac.compare_digest(expected, received)
    except Exception:
        return False


@router.post("/webhook", status_code=200, summary="Adyen webhook receiver")
async def adyen_webhook(request: Request, db: Session = Depends(get_db)):
    settings = get_settings()
    body = await request.json()

    for item in body.get("notificationItems", []):
        if settings.adyen_webhook_hmac_key:
            if not _verify_hmac(item, settings.adyen_webhook_hmac_key):
                logger.warning("Adyen webhook HMAC verification failed — skipping item")
                continue

        n = item.get("NotificationRequestItem", {})
        event_code = n.get("eventCode", "")
        success = n.get("success") == "true"
        metadata = n.get("metadata", {})
        additional = n.get("additionalData", {})

        user_id = metadata.get("user_id") or additional.get("metadata.user_id")
        plan_id = metadata.get("plan_id") or additional.get("metadata.plan_id")

        if not user_id or not plan_id:
            continue

        try:
            _process_event(
                db=db,
                event_code=event_code,
                success=success,
                user_id=user_id,
                plan_id=plan_id,
                psp_reference=n.get("pspReference", ""),
                shopper_reference=n.get("shopperReference", ""),
            )
        except Exception as e:
            logger.error(f"Error handling Adyen event {event_code}: {e}")

    return {"status": "[accepted]"}


def _process_event(
    db: Session,
    event_code: str,
    success: bool,
    user_id: str,
    plan_id: str,
    psp_reference: str,
    shopper_reference: str,
):
    if event_code == "AUTHORISATION" and success:
        plan = db.query(Plan).filter(Plan.id == plan_id).first()
        if not plan:
            return

        sub = db.query(Subscription).filter(Subscription.user_id == user_id).first()
        now = datetime.utcnow()
        if sub:
            sub.plan_id = plan.id
            sub.status = SubStatus.active
            sub.current_period_start = now
            sub.current_period_end = now + timedelta(days=30)
            sub.adyen_subscription_id = psp_reference
            sub.adyen_shopper_reference = shopper_reference
        else:
            db.add(Subscription(
                user_id=user_id,
                plan_id=plan.id,
                status=SubStatus.active,
                current_period_start=now,
                current_period_end=now + timedelta(days=30),
                adyen_subscription_id=psp_reference,
                adyen_shopper_reference=shopper_reference,
            ))

        user = db.query(User).filter(User.id == user_id).first()
        if user:
            user.plan = UserPlan(plan.tier.value)
        db.commit()
        logger.info(f"Subscription activated: user={user_id} plan={plan_id}")

    elif event_code in ("CANCEL_OR_REFUND", "CANCELLATION") and success:
        sub = db.query(Subscription).filter(Subscription.user_id == user_id).first()
        if sub:
            sub.status = SubStatus.cancelled
        user = db.query(User).filter(User.id == user_id).first()
        if user:
            user.plan = UserPlan.basic
        db.commit()
        logger.info(f"Subscription cancelled: user={user_id}")

    elif event_code == "CHARGEBACK":
        sub = db.query(Subscription).filter(Subscription.user_id == user_id).first()
        if sub:
            sub.status = SubStatus.past_due
        db.commit()
        logger.info(f"Subscription past_due (chargeback): user={user_id}")

    elif event_code == "RECURRING_CONTRACT" and success:
        sub = db.query(Subscription).filter(Subscription.user_id == user_id).first()
        if sub and sub.current_period_end:
            sub.status = SubStatus.active
            sub.current_period_start = sub.current_period_end
            sub.current_period_end = sub.current_period_end + timedelta(days=30)
            db.commit()
            logger.info(f"Subscription renewed: user={user_id}")
