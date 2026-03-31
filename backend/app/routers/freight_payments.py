import logging
import stripe
from datetime import datetime
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database import get_db
from app.middleware.auth import get_current_user, require_admin
from app.models.user import User, UserRole
from app.models.booking import Booking, BookingStatus
from app.models.load import Load
from app.models.load_payment import LoadPayment, PaymentStatus

router = APIRouter()
logger = logging.getLogger(__name__)


def _stripe():
    settings = get_settings()
    if not settings.stripe_secret_key:
        raise HTTPException(status_code=503, detail="Payment system not configured.")
    stripe.api_key = settings.stripe_secret_key
    return stripe


# ── Carrier: initiate Stripe Connect Express onboarding ───────────────────────
@router.post("/onboard", summary="Start Stripe Connect Express onboarding for carrier")
def start_onboarding(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != UserRole.carrier:
        raise HTTPException(status_code=403, detail="Only carriers can connect a payout account.")

    s = _stripe()
    settings = get_settings()
    frontend_base = settings.allowed_origins.split(",")[0].strip()

    # Create Express account if not already connected
    if not current_user.stripe_connect_account_id:
        account = s.Account.create(
            type="express",
            country="US",
            email=current_user.email,
            capabilities={"transfers": {"requested": True}},
            business_type="individual",
            metadata={"user_id": str(current_user.id)},
        )
        current_user.stripe_connect_account_id = account["id"]
        db.commit()

    link = s.AccountLink.create(
        account=current_user.stripe_connect_account_id,
        refresh_url=f"{frontend_base}/carrier/settings?payout=refresh",
        return_url=f"{frontend_base}/carrier/settings?payout=success",
        type="account_onboarding",
    )
    return {"url": link["url"]}


# ── Carrier: payout account status ────────────────────────────────────────────
@router.get("/onboard/status", summary="Check carrier's Stripe Connect account status")
def onboard_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not current_user.stripe_connect_account_id:
        return {"connected": False, "charges_enabled": False, "payouts_enabled": False}

    s = _stripe()
    try:
        account = s.Account.retrieve(current_user.stripe_connect_account_id)
        return {
            "connected": True,
            "charges_enabled": account["charges_enabled"],
            "payouts_enabled": account["payouts_enabled"],
            "account_id": current_user.stripe_connect_account_id,
        }
    except Exception:
        return {"connected": False, "charges_enabled": False, "payouts_enabled": False}


# ── Broker: create payment intent (puts money in escrow) ──────────────────────
@router.post("/charge/{booking_id}", summary="Broker pays load rate into escrow")
def charge_escrow(
    booking_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != UserRole.broker:
        raise HTTPException(status_code=403, detail="Only brokers can pay loads.")

    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking.status not in (BookingStatus.approved, BookingStatus.in_transit):
        raise HTTPException(status_code=400, detail="Booking must be approved before payment.")

    load = db.query(Load).filter(Load.id == booking.load_id).first()
    if not load or str(load.broker_user_id) != str(current_user.id):
        raise HTTPException(status_code=403, detail="Not your load.")

    # Check if already paid
    existing = db.query(LoadPayment).filter(LoadPayment.booking_id == booking_id).first()
    if existing and existing.status in ("escrowed", "released"):
        return {"status": existing.status, "payment_id": str(existing.id)}

    carrier = db.query(User).filter(User.id == booking.carrier_id).first()
    if not carrier or not carrier.stripe_connect_account_id:
        raise HTTPException(status_code=400, detail="Carrier has not connected their payout account yet.")

    settings = get_settings()
    s = _stripe()

    amount_cents = int(round(load.rate * 100))
    fee_pct = settings.stripe_platform_fee_pct
    fee_cents = int(round(amount_cents * fee_pct / 100))
    carrier_cents = amount_cents - fee_cents

    intent = s.PaymentIntent.create(
        amount=amount_cents,
        currency="usd",
        payment_method_types=["card", "us_bank_account"],
        metadata={
            "booking_id": str(booking_id),
            "load_id": str(load.id),
            "broker_id": str(current_user.id),
            "carrier_id": str(carrier.id),
        },
        description=f"Load payment: {load.origin} → {load.destination}",
    )

    # Upsert LoadPayment record
    if existing:
        existing.stripe_payment_intent_id = intent["id"]
    else:
        payment = LoadPayment(
            booking_id=booking_id,
            load_id=load.id,
            broker_id=current_user.id,
            carrier_id=carrier.id,
            amount=load.rate,
            fee_pct=fee_pct,
            fee_amount=round(load.rate * fee_pct / 100, 2),
            carrier_amount=round(load.rate * (1 - fee_pct / 100), 2),
            status="pending",
            stripe_payment_intent_id=intent["id"],
        )
        db.add(payment)
    db.commit()

    return {
        "client_secret": intent["client_secret"],
        "amount": load.rate,
        "fee_amount": round(load.rate * fee_pct / 100, 2),
        "carrier_amount": round(load.rate * (1 - fee_pct / 100), 2),
        "payment_intent_id": intent["id"],
    }


# ── Broker: release escrow to carrier ─────────────────────────────────────────
@router.post("/release/{booking_id}", summary="Release escrowed payment to carrier")
def release_payment(
    booking_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != UserRole.broker:
        raise HTTPException(status_code=403, detail="Only the broker can release payment.")

    payment = db.query(LoadPayment).filter(LoadPayment.booking_id == booking_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment record not found")
    if payment.status != "escrowed":
        raise HTTPException(status_code=400, detail=f"Cannot release payment with status '{payment.status}'")
    if str(payment.broker_id) != str(current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized")

    carrier = db.query(User).filter(User.id == payment.carrier_id).first()
    if not carrier or not carrier.stripe_connect_account_id:
        raise HTTPException(status_code=400, detail="Carrier payout account not available")

    s = _stripe()
    carrier_cents = int(round(payment.carrier_amount * 100))

    transfer = s.Transfer.create(
        amount=carrier_cents,
        currency="usd",
        destination=carrier.stripe_connect_account_id,
        metadata={"booking_id": str(booking_id), "payment_id": str(payment.id)},
    )

    payment.stripe_transfer_id = transfer["id"]
    payment.status = "released"
    payment.released_at = datetime.utcnow()
    db.commit()

    return {"ok": True, "carrier_amount": payment.carrier_amount, "transfer_id": transfer["id"]}


# ── List payments for current user ────────────────────────────────────────────
@router.get("/my", summary="List all payments for current user")
def list_my_payments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role == UserRole.broker:
        payments = db.query(LoadPayment).filter(LoadPayment.broker_id == current_user.id).order_by(LoadPayment.created_at.desc()).all()
    else:
        payments = db.query(LoadPayment).filter(LoadPayment.carrier_id == current_user.id).order_by(LoadPayment.created_at.desc()).all()

    result = []
    for p in payments:
        load = db.query(Load).filter(Load.id == p.load_id).first()
        result.append({
            "id": str(p.id),
            "booking_id": str(p.booking_id),
            "load_id": str(p.load_id),
            "amount": p.amount,
            "fee_amount": p.fee_amount,
            "carrier_amount": p.carrier_amount,
            "status": p.status,
            "created_at": p.created_at.isoformat() if p.created_at else None,
            "escrowed_at": p.escrowed_at.isoformat() if p.escrowed_at else None,
            "released_at": p.released_at.isoformat() if p.released_at else None,
            "load_origin": load.origin if load else None,
            "load_destination": load.destination if load else None,
        })
    return result


# ── Admin: list all payments ───────────────────────────────────────────────────
@router.get("/admin/all", summary="Admin: list all payments across platform")
def admin_list_payments(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    payments = db.query(LoadPayment).order_by(LoadPayment.created_at.desc()).all()
    result = []
    for p in payments:
        load = db.query(Load).filter(Load.id == p.load_id).first()
        result.append({
            "id": str(p.id),
            "booking_id": str(p.booking_id),
            "load_id": str(p.load_id),
            "broker_name": p.broker.name if p.broker else None,
            "broker_email": p.broker.email if p.broker else None,
            "carrier_name": p.carrier.name if p.carrier else None,
            "carrier_email": p.carrier.email if p.carrier else None,
            "amount": p.amount,
            "fee_amount": p.fee_amount,
            "carrier_amount": p.carrier_amount,
            "status": p.status,
            "created_at": p.created_at.isoformat() if p.created_at else None,
            "escrowed_at": p.escrowed_at.isoformat() if p.escrowed_at else None,
            "released_at": p.released_at.isoformat() if p.released_at else None,
            "load_origin": load.origin if load else None,
            "load_destination": load.destination if load else None,
        })
    return result


# ── Get payment status for a booking ──────────────────────────────────────────
@router.get("/{booking_id}", summary="Get payment status for a booking")
def get_payment(
    booking_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    payment = db.query(LoadPayment).filter(LoadPayment.booking_id == booking_id).first()
    if not payment:
        return {"status": "unpaid", "amount": None}

    if str(current_user.id) not in (str(payment.broker_id), str(payment.carrier_id)):
        raise HTTPException(status_code=403, detail="Not authorized")

    return {
        "status": payment.status,
        "amount": payment.amount,
        "fee_amount": payment.fee_amount,
        "carrier_amount": payment.carrier_amount,
        "escrowed_at": payment.escrowed_at.isoformat() if payment.escrowed_at else None,
        "released_at": payment.released_at.isoformat() if payment.released_at else None,
        "payment_intent_id": payment.stripe_payment_intent_id,
    }


# ── Stripe webhook ─────────────────────────────────────────────────────────────
@router.post("/webhook", summary="Stripe webhook handler")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    settings = get_settings()
    payload = await request.body()
    sig = request.headers.get("stripe-signature", "")

    s = _stripe()
    try:
        event = s.Webhook.construct_event(payload, sig, settings.stripe_webhook_secret)
    except Exception as e:
        logger.warning(f"Stripe webhook validation failed: {e}")
        raise HTTPException(status_code=400, detail="Invalid webhook signature")

    if event["type"] == "payment_intent.succeeded":
        pi = event["data"]["object"]
        booking_id = pi.get("metadata", {}).get("booking_id")
        if booking_id:
            payment = db.query(LoadPayment).filter(
                LoadPayment.stripe_payment_intent_id == pi["id"]
            ).first()
            if payment and payment.status == "pending":
                payment.status = "escrowed"
                payment.escrowed_at = datetime.utcnow()
                db.commit()
                logger.info(f"Payment escrowed for booking {booking_id}")

    elif event["type"] == "payment_intent.payment_failed":
        pi = event["data"]["object"]
        payment = db.query(LoadPayment).filter(
            LoadPayment.stripe_payment_intent_id == pi["id"]
        ).first()
        if payment:
            payment.status = "failed"
            db.commit()

    return {"received": True}
