"""
HaulIQ Database Seed Script
Run with: python prisma/seed.py (from /backend)
Seeds plans, demo users, brokers, and sample loads.
"""
import sys
import os
from datetime import date, datetime, timedelta

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal, engine, Base
from app.models import *
from app.models.subscription import Plan, PlanRole, PlanTier
from app.models.user import User, UserRole, UserPlan
from app.models.broker import Broker, BrokerBadge, PaySpeed
from app.models.load import Load, LoadType, LoadStatus
from app.models.analytics import LoadHistory
from app.utils.password import hash_password
from app.utils.profit import calculate_profit, get_market_rate

print("Creating tables...")
Base.metadata.create_all(bind=engine)
db = SessionLocal()


# ─── 1. Plans ─────────────────────────────────────────────────────────────────
print("Seeding plans...")

CARRIER_PLANS = [
    dict(name="Basic", role=PlanRole.carrier, tier=PlanTier.basic, price=0.0,
         description="Get started with essential load board access",
         features=["20 load views per day", "Basic profit calculator", "Standard filters", "Email support"],
         limits={"loads_per_day": 20, "broker_ratings": False, "earnings_brain": False, "hot_loads": False, "analytics": False}),
    dict(name="Pro", role=PlanRole.carrier, tier=PlanTier.pro, price=49.0,
         description="Unlimited access with smart insights",
         features=["Unlimited load views", "Full profit calculator", "Broker ratings & reviews",
                   "Basic Earnings Brain", "Hot load notifications", "90-day load history", "Priority support"],
         limits={"loads_per_day": -1, "broker_ratings": True, "earnings_brain": "basic", "hot_loads": True, "analytics": False}),
    dict(name="Elite", role=PlanRole.carrier, tier=PlanTier.elite, price=99.0,
         description="The full Driver Earnings Brain experience",
         features=["Everything in Pro", "Full Driver Earnings Brain (AI)", "Priority load access",
                   "Early hot load alerts", "Advanced analytics", "Weekly profit reports", "Dedicated account rep"],
         limits={"loads_per_day": -1, "broker_ratings": True, "earnings_brain": "full", "hot_loads": True, "analytics": True}),
    dict(name="Basic", role=PlanRole.broker, tier=PlanTier.basic, price=0.0,
         description="Post loads and get discovered",
         features=["10 active postings", "Standard visibility", "Basic dashboard", "Email support"],
         limits={"postings": 10, "visibility": "standard", "carrier_analytics": False, "priority": False}),
    dict(name="Pro", role=PlanRole.broker, tier=PlanTier.pro, price=79.0,
         description="More reach, better conversions",
         features=["50 active postings", "Enhanced visibility ranking", "Carrier engagement analytics",
                   "Performance dashboard", "Priority support"],
         limits={"postings": 50, "visibility": "enhanced", "carrier_analytics": True, "priority": False}),
    dict(name="Elite", role=PlanRole.broker, tier=PlanTier.elite, price=149.0,
         description="Dominate the board",
         features=["Unlimited postings", "Priority placement", "Advanced conversion analytics",
                   "Premium carrier exposure", "Dedicated account rep", "API access"],
         limits={"postings": -1, "visibility": "priority", "carrier_analytics": True, "priority": True}),
]

plan_map = {}
for p in CARRIER_PLANS:
    existing = db.query(Plan).filter(Plan.role == p["role"], Plan.tier == p["tier"]).first()
    if not existing:
        plan = Plan(**p)
        db.add(plan)
        db.flush()
        plan_map[f"{p['role'].value}_{p['tier'].value}"] = plan
    else:
        plan_map[f"{p['role'].value}_{p['tier'].value}"] = existing

db.commit()
print(f"  ✓ {len(plan_map)} plans seeded")


# ─── 2. Demo users ────────────────────────────────────────────────────────────
print("Seeding demo users...")

DEMO_USERS = [
    dict(email="carrier@demo.com", password="demo1234", name="Mike Rodriguez",
         role=UserRole.carrier, plan=UserPlan.pro, company="Rodriguez Trucking",
         mc_number="MC-123456", dot_number="DOT-789012"),
    dict(email="broker@demo.com", password="demo1234", name="Sarah Chen",
         role=UserRole.broker, plan=UserPlan.elite, company="FastFreight Brokerage"),
    dict(email="elite@demo.com", password="demo1234", name="Jessica Rivera",
         role=UserRole.carrier, plan=UserPlan.elite, company="Rivera Transport LLC",
         mc_number="MC-654321"),
    dict(email="admin@hauliq.com", password="admin1234", name="HaulIQ Admin",
         role=UserRole.admin, plan=UserPlan.admin),
]

user_map = {}
for u in DEMO_USERS:
    existing = db.query(User).filter(User.email == u["email"]).first()
    if not existing:
        user = User(
            email=u["email"],
            password_hash=hash_password(u["password"]),
            name=u["name"],
            role=u["role"],
            plan=u["plan"],
            company=u.get("company"),
            mc_number=u.get("mc_number"),
            dot_number=u.get("dot_number"),
            is_active=True,
        )
        db.add(user)
        db.flush()
        user_map[u["email"]] = user
    else:
        user_map[u["email"]] = existing

db.commit()
print(f"  ✓ {len(user_map)} users seeded")


# ─── 3. Brokers ───────────────────────────────────────────────────────────────
print("Seeding brokers...")

BROKER_DATA = [
    dict(name="MoLo Solutions",        avg_rating=4.9, reviews_count=178, pay_speed=PaySpeed.quick_pay, badge=BrokerBadge.elite,    warning_count=0, avg_rate_per_mile=3.40),
    dict(name="Echo Global Logistics", avg_rating=4.8, reviews_count=312, pay_speed=PaySpeed.net_21,    badge=BrokerBadge.trusted,  warning_count=0, avg_rate_per_mile=3.20),
    dict(name="Arrive Logistics",      avg_rating=4.7, reviews_count=423, pay_speed=PaySpeed.net_21,    badge=BrokerBadge.verified, warning_count=0, avg_rate_per_mile=3.15),
    dict(name="XPO Logistics",         avg_rating=4.6, reviews_count=540, pay_speed=PaySpeed.net_14,    badge=BrokerBadge.trusted,  warning_count=0, avg_rate_per_mile=3.10),
    dict(name="Coyote Logistics",      avg_rating=4.5, reviews_count=891, pay_speed=PaySpeed.net_30,    badge=BrokerBadge.verified, warning_count=0, avg_rate_per_mile=2.95),
    dict(name="GlobalTranz",           avg_rating=4.3, reviews_count=267, pay_speed=PaySpeed.net_21,    badge=BrokerBadge.verified, warning_count=0, avg_rate_per_mile=2.90),
    dict(name="BlueSky Transport",     avg_rating=3.2, reviews_count=89,  pay_speed=PaySpeed.net_30,    badge=None,                 warning_count=1, avg_rate_per_mile=2.60),
    dict(name="Freight Broker LLC",    avg_rating=2.1, reviews_count=44,  pay_speed=PaySpeed.net_45,    badge=BrokerBadge.warning,  warning_count=3, avg_rate_per_mile=2.10),
]

broker_map = {}
broker_user = user_map.get("broker@demo.com")
for bd in BROKER_DATA:
    existing = db.query(Broker).filter(Broker.name == bd["name"]).first()
    if not existing:
        broker = Broker(**bd, user_id=broker_user.id if broker_user and bd["name"] == "FastFreight Brokerage" else None)
        db.add(broker)
        db.flush()
        broker_map[bd["name"]] = broker
    else:
        broker_map[bd["name"]] = existing

# Link broker user to their broker profile
if broker_user:
    molo = broker_map.get("MoLo Solutions")
    if molo and not molo.user_id:
        molo.user_id = broker_user.id

db.commit()
print(f"  ✓ {len(broker_map)} brokers seeded")


# ─── 4. Sample loads ──────────────────────────────────────────────────────────
print("Seeding sample loads...")

existing_loads = db.query(Load).count()
if existing_loads == 0:
    LOAD_DATA = [
        dict(broker_name="MoLo Solutions",        origin="Chicago, IL",    origin_state="IL", destination="Atlanta, GA",   dest_state="GA", miles=716,  deadhead_miles=18,  load_type=LoadType.dry_van, weight_lbs=42000, commodity="Consumer Electronics", rate=2850, pickup_date=date.today()+timedelta(1), delivery_date=date.today()+timedelta(2), is_hot=True),
        dict(broker_name="Echo Global Logistics", origin="Dallas, TX",     origin_state="TX", destination="Phoenix, AZ",   dest_state="AZ", miles=1015, deadhead_miles=45,  load_type=LoadType.reefer,  weight_lbs=38500, commodity="Fresh Produce",         rate=3400, pickup_date=date.today()+timedelta(2), delivery_date=date.today()+timedelta(3), is_hot=True),
        dict(broker_name="Coyote Logistics",      origin="Nashville, TN",  origin_state="TN", destination="Charlotte, NC", dest_state="NC", miles=408,  deadhead_miles=92,  load_type=LoadType.flatbed, weight_lbs=44000, commodity="Steel Coils",           rate=1200, pickup_date=date.today()+timedelta(1), delivery_date=date.today()+timedelta(1), is_hot=False),
        dict(broker_name="Freight Broker LLC",    origin="Los Angeles, CA", origin_state="CA", destination="Las Vegas, NV", dest_state="NV", miles=272,  deadhead_miles=120, load_type=LoadType.dry_van, weight_lbs=35000, commodity="General Freight",        rate=620,  pickup_date=date.today()+timedelta(3), delivery_date=date.today()+timedelta(3), is_hot=False),
        dict(broker_name="Arrive Logistics",      origin="Miami, FL",      origin_state="FL", destination="New York, NY",  dest_state="NY", miles=1280, deadhead_miles=22,  load_type=LoadType.dry_van, weight_lbs=41000, commodity="Apparel",                rate=4200, pickup_date=date.today()+timedelta(2), delivery_date=date.today()+timedelta(4), is_hot=True),
        dict(broker_name="XPO Logistics",         origin="Seattle, WA",    origin_state="WA", destination="Portland, OR",  dest_state="OR", miles=180,  deadhead_miles=60,  load_type=LoadType.reefer,  weight_lbs=36000, commodity="Dairy",                  rate=580,  pickup_date=date.today()+timedelta(1), delivery_date=date.today()+timedelta(1), is_hot=False),
        dict(broker_name="GlobalTranz",           origin="Houston, TX",    origin_state="TX", destination="Memphis, TN",   dest_state="TN", miles=568,  deadhead_miles=30,  load_type=LoadType.flatbed, weight_lbs=43000, commodity="Lumber",                 rate=1980, pickup_date=date.today()+timedelta(3), delivery_date=date.today()+timedelta(3), is_hot=False),
        dict(broker_name="BlueSky Transport",     origin="Denver, CO",     origin_state="CO", destination="Kansas City, MO", dest_state="MO", miles=601, deadhead_miles=75, load_type=LoadType.dry_van, weight_lbs=28000, commodity="Auto Parts",             rate=1100, pickup_date=date.today()+timedelta(2), delivery_date=date.today()+timedelta(3), is_hot=False),
    ]

    for ld in LOAD_DATA:
        broker = broker_map.get(ld.pop("broker_name"))
        if not broker:
            continue
        profit = calculate_profit(rate=ld["rate"], loaded_miles=ld["miles"], deadhead_miles=ld["deadhead_miles"])
        market_rate = get_market_rate(ld.get("origin_state"), ld.get("dest_state"))
        load = Load(
            broker_id=broker.id,
            broker_user_id=broker.user_id,
            **ld,
            dimensions="48x102",
            rate_per_mile=profit["rate_per_mile"],
            fuel_cost_est=profit["fuel_cost"],
            net_profit_est=profit["net_profit"],
            profit_score=profit["profit_score"],
            market_rate_per_mile=market_rate,
            is_above_market=profit["rate_per_mile"] >= market_rate,
            status=LoadStatus.active,
        )
        db.add(load)

    db.commit()
    print(f"  ✓ {len(LOAD_DATA)} sample loads seeded")
else:
    print(f"  ↷ Loads already exist ({existing_loads}), skipping")


# ─── 5. Load history for demo carrier ─────────────────────────────────────────
print("Seeding load history for demo carrier...")

carrier_user = user_map.get("carrier@demo.com")
existing_history = db.query(LoadHistory).filter(LoadHistory.carrier_id == carrier_user.id).count() if carrier_user else 0

if carrier_user and existing_history == 0:
    HISTORY = [
        dict(origin="Chicago, IL", origin_state="IL", destination="Atlanta, GA",   dest_state="GA", lane_key="IL_GA", miles=716,  deadhead_miles=18, load_type="Dry Van", broker_name="MoLo Solutions",        gross_revenue=2850, fuel_cost=520, net_profit=1890, rate_per_mile=3.98, net_per_mile=2.64, days_ago=4),
        dict(origin="Atlanta, GA", origin_state="GA", destination="Miami, FL",     dest_state="FL", lane_key="GA_FL", miles=662,  deadhead_miles=30, load_type="Dry Van", broker_name="Echo Global Logistics", gross_revenue=1800, fuel_cost=480, net_profit=980,  rate_per_mile=2.72, net_per_mile=1.48, days_ago=8),
        dict(origin="Miami, FL",   origin_state="FL", destination="New York, NY",  dest_state="NY", lane_key="FL_NY", miles=1280, deadhead_miles=22, load_type="Dry Van", broker_name="Arrive Logistics",      gross_revenue=4200, fuel_cost=928, net_profit=2340, rate_per_mile=3.28, net_per_mile=1.83, days_ago=12),
        dict(origin="New York, NY",origin_state="NY", destination="Chicago, IL",   dest_state="IL", lane_key="NY_IL", miles=790,  deadhead_miles=40, load_type="Dry Van", broker_name="Coyote Logistics",      gross_revenue=2200, fuel_cost=573, net_profit=1340, rate_per_mile=2.78, net_per_mile=1.70, days_ago=18),
        dict(origin="Chicago, IL", origin_state="IL", destination="Dallas, TX",    dest_state="TX", lane_key="IL_TX", miles=924,  deadhead_miles=55, load_type="Reefer",  broker_name="BlueSky Transport",     gross_revenue=1600, fuel_cost=670, net_profit=420,  rate_per_mile=1.73, net_per_mile=0.45, days_ago=24),
        dict(origin="Dallas, TX",  origin_state="TX", destination="Denver, CO",    dest_state="CO", lane_key="TX_CO", miles=1032, deadhead_miles=75, load_type="Dry Van", broker_name="Freight Broker LLC",    gross_revenue=1100, fuel_cost=748, net_profit=-120, rate_per_mile=1.07, net_per_mile=-0.12, days_ago=30),
        dict(origin="Chicago, IL", origin_state="IL", destination="Atlanta, GA",   dest_state="GA", lane_key="IL_GA", miles=716,  deadhead_miles=20, load_type="Dry Van", broker_name="MoLo Solutions",        gross_revenue=2900, fuel_cost=522, net_profit=1950, rate_per_mile=4.05, net_per_mile=2.72, days_ago=36),
        dict(origin="Atlanta, GA", origin_state="GA", destination="Charlotte, NC", dest_state="NC", lane_key="GA_NC", miles=245,  deadhead_miles=40, load_type="Flatbed", broker_name="XPO Logistics",         gross_revenue=890,  fuel_cost=178, net_profit=420,  rate_per_mile=3.63, net_per_mile=1.71, days_ago=42),
    ]

    for h in HISTORY:
        days_ago = h.pop("days_ago")
        entry = LoadHistory(
            carrier_id=carrier_user.id,
            accepted_at=datetime.utcnow() - timedelta(days=days_ago),
            **h,
        )
        db.add(entry)

    db.commit()
    print(f"  ✓ {len(HISTORY)} history entries seeded for demo carrier")
else:
    print("  ↷ Load history already exists, skipping")


print("\n✅ Database seeded successfully!")
print("\nDemo login credentials:")
print("  Carrier:  carrier@demo.com  / demo1234")
print("  Broker:   broker@demo.com   / demo1234")
print("  Admin:    admin@hauliq.com  / admin1234")
print("\nAPI docs: http://localhost:8000/docs")

db.close()
