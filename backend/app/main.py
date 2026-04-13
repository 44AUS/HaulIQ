from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from contextlib import asynccontextmanager
from sqlalchemy import text

from app.config import get_settings
from app.database import engine, Base
from app.routers import auth, loads, brokers, subscriptions, analytics, admin, payments, messages, bids, bookings, instant_book, carrier_reviews, network, waitlist, locations, blocks, documents, my_documents, freight_payments, search, calendar, truck_posts, equipment_types, equipment_classes, contact, rate_confirmation, notifications, lane_watches, load_templates
from app.models import carrier_review as _carrier_review_model  # noqa: ensure table is registered
from app.models import truck_post as _truck_post_model  # noqa: ensure table is registered
from app.models import network as _network_model  # noqa: ensure table is registered
from app.models import waitlist as _waitlist_model  # noqa: ensure table is registered
from app.models import location as _location_model  # noqa: ensure table is registered
from app.models import block as _block_model  # noqa: ensure table is registered
from app.models import document as _document_model  # noqa: ensure table is registered
from app.models import load_payment as _load_payment_model  # noqa: ensure table is registered
from app.models import equipment_type as _equipment_type_model  # noqa: ensure table is registered
from app.models import equipment_class as _equipment_class_model  # noqa: ensure table is registered
from app.models import contact as _contact_model  # noqa: ensure table is registered
from app.models import notification as _notification_model  # noqa: ensure table is registered
from app.models import lane_watch as _lane_watch_model  # noqa: ensure table is registered
from app.models import load_template as _load_template_model  # noqa: ensure table is registered

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure enum types exist BEFORE create_all references them
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TYPE bookingstatus ADD VALUE IF NOT EXISTS 'in_transit'"))
            conn.commit()
        except Exception:
            conn.rollback()
    with engine.connect() as conn:
        try:
            conn.execute(text("CREATE TYPE tmsstatus AS ENUM ('dispatched','picked_up','in_transit','delivered','pod_received')"))
            conn.commit()
        except Exception:
            conn.rollback()
    with engine.connect() as conn:
        try:
            conn.execute(text("""
                CREATE TYPE notificationtype AS ENUM (
                    'new_bid', 'bid_accepted', 'bid_rejected', 'bid_countered',
                    'booking_approved', 'booking_denied', 'new_booking_request',
                    'lane_watch_match', 'tms_update'
                )
            """))
            conn.commit()
        except Exception:
            conn.rollback()
    # Create all tables (enum types must exist first)
    Base.metadata.create_all(bind=engine)
    # Add new address columns to loads table if not present
    address_cols = [
        ("pickup_address",   "TEXT"),
        ("delivery_address", "TEXT"),
        ("pickup_lat",       "FLOAT"),
        ("pickup_lng",       "FLOAT"),
        ("delivery_lat",     "FLOAT"),
        ("delivery_lng",     "FLOAT"),
    ]
    with engine.connect() as conn:
        for col, col_type in address_cols:
            try:
                conn.execute(text(f"ALTER TABLE loads ADD COLUMN IF NOT EXISTS {col} {col_type}"))
                conn.commit()
            except Exception:
                conn.rollback()
    # Add avatar_url to users table if not present
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT"))
            conn.commit()
        except Exception:
            conn.rollback()
    yield


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="""
## HaulIQ API — Driver Profit Optimization Platform

The backend powering HaulIQ's smart load board, profit calculator,
Driver Earnings Brain, and broker trust system.

### Authentication
All protected endpoints require a Bearer JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

### Roles
- **carrier** — Owner-operators and small fleets
- **broker** — Freight brokers posting loads
- **admin** — Platform administrators
    """,
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# ─── Middleware ────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Routers ──────────────────────────────────────────────────────────────────
app.include_router(auth.router,          prefix="/api/auth",          tags=["Auth"])
app.include_router(loads.router,         prefix="/api/loads",         tags=["Loads"])
app.include_router(brokers.router,       prefix="/api/brokers",       tags=["Brokers"])
app.include_router(subscriptions.router, prefix="/api/subscriptions", tags=["Subscriptions"])
app.include_router(analytics.router,     prefix="/api/analytics",     tags=["Analytics"])
app.include_router(admin.router,         prefix="/api/admin",         tags=["Admin"])
app.include_router(payments.router,      prefix="/api/payments",      tags=["Payments"])
app.include_router(messages.router,  prefix="/api/messages",  tags=["Messages"])
app.include_router(bids.router,      prefix="/api/bids",      tags=["Bids"])
app.include_router(bookings.router,    prefix="/api/bookings",     tags=["Bookings"])
app.include_router(instant_book.router, prefix="/api/instant-book", tags=["Instant Book"])
app.include_router(carrier_reviews.router, prefix="/api/carrier-reviews", tags=["Carrier Reviews"])
app.include_router(network.router,         prefix="/api/network",         tags=["Network"])
app.include_router(waitlist.router,        prefix="/api/waitlist",        tags=["Waitlist"])
app.include_router(locations.router,       prefix="/api/locations",       tags=["Locations"])
app.include_router(blocks.router,          prefix="/api/blocks",          tags=["Blocks"])
app.include_router(documents.router,       prefix="/api/loads",            tags=["Documents"])
app.include_router(my_documents.router,    prefix="/api/documents",         tags=["Documents"])
app.include_router(freight_payments.router, prefix="/api/freight-payments", tags=["Freight Payments"])
app.include_router(search.router,           prefix="/api/search",           tags=["Search"])
app.include_router(calendar.router,         prefix="/api/calendar",         tags=["Calendar"])
app.include_router(truck_posts.router,      prefix="/api/truck-posts",      tags=["Truck Posts"])
app.include_router(equipment_types.router,   prefix="/api/equipment-types",   tags=["Equipment Types"])
app.include_router(equipment_classes.router, prefix="/api/equipment-classes", tags=["Equipment Classes"])
app.include_router(contact.router,           prefix="/api/contact",           tags=["Contact"])
app.include_router(rate_confirmation.router, prefix="/api/rate-confirmation",  tags=["Rate Confirmation"])
app.include_router(notifications.router,     prefix="/api/notifications",      tags=["Notifications"])
app.include_router(lane_watches.router,      prefix="/api/lane-watches",       tags=["Lane Watches"])
app.include_router(load_templates.router,    prefix="/api/load-templates",     tags=["Load Templates"])


# ─── Health check ─────────────────────────────────────────────────────────────
@app.get("/", tags=["Health"])
def root():
    return {
        "status": "ok",
        "app": settings.app_name,
        "version": settings.app_version,
        "docs": "/docs",
    }


@app.get("/health", tags=["Health"])
def health():
    return {"status": "healthy"}
