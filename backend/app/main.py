from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from contextlib import asynccontextmanager

from app.config import get_settings
from app.database import engine, Base
from app.routers import auth, loads, brokers, subscriptions, analytics, admin, payments, messages, bids, bookings, instant_book, carrier_reviews
from app.models import carrier_review as _carrier_review_model  # noqa: ensure table is registered

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create all tables on startup (use Alembic migrations in production)
    Base.metadata.create_all(bind=engine)
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
    allow_origins=settings.origins_list,
    allow_credentials=True,
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
