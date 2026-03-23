from pydantic_settings import BaseSettings
from pydantic import field_validator
from functools import lru_cache


class Settings(BaseSettings):
    # App
    app_name: str = "HaulIQ API"
    app_version: str = "1.0.0"
    debug: bool = False
    allowed_origins: str = "http://localhost:3000"

    # Database — Railway injects as postgres://, SQLAlchemy needs postgresql://
    database_url: str = ""

    # JWT
    secret_key: str = "change-me-in-production-use-openssl-rand-hex-32"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60
    refresh_token_expire_days: int = 30

    # Adyen
    adyen_api_key: str = ""
    adyen_merchant_account: str = ""
    adyen_client_key: str = ""          # Public key for Drop-in (starts with test_ or live_)
    adyen_webhook_hmac_key: str = ""    # HMAC key from Adyen webhook config
    adyen_environment: str = "TEST"     # TEST or LIVE

    # Profit calc defaults
    default_fuel_price: float = 3.85   # fallback if EIA fetch fails
    default_mpg: float = 7.2

    # EIA API key for live diesel prices (DEMO_KEY works at low traffic)
    eia_api_key: str = "DEMO_KEY"

    @field_validator("database_url", mode="before")
    @classmethod
    def fix_postgres_url(cls, v: str) -> str:
        """Railway provides postgres:// — SQLAlchemy 2.x requires postgresql://"""
        if v and v.startswith("postgres://"):
            return v.replace("postgres://", "postgresql://", 1)
        return v

    @property
    def origins_list(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",")]

    model_config = {"env_file": ".env", "case_sensitive": False}


@lru_cache()
def get_settings() -> Settings:
    return Settings()
