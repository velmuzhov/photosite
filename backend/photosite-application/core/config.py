from pathlib import Path
from pydantic import BaseModel
from pydantic import PostgresDsn
from pydantic_settings import BaseSettings, SettingsConfigDict


class RunConfig(BaseModel):
    host: str = "0.0.0.0"
    port: int = 8000


class ApiV1Prefix(BaseModel):
    prefix: str = "/v1"
    pictures: str = "/pictures"
    events: str = "/events"
    users: str = "/users"

class ApiPrefix(BaseModel):
    prefix: str = "/api"
    v1: ApiV1Prefix = ApiV1Prefix()

class Static(BaseModel):
    image_dir: Path = Path(__file__).parent.parent.resolve() / "static" / "images"

class Auth(BaseModel):
    access_token_expires_minutes: int = 30
    refresh_token_expire_days: int = 30
    secret_key: str = "my_secret_key"
    algorithm: str = "HS256"

class RedisConfig(BaseModel):
    url: str = "redis://localhost:6379"
    prefix: str = "fastapi-cache"

class DatabaseConfig(BaseModel):
    url: PostgresDsn | None = None
    echo: bool = False
    echo_pool: bool = False
    pool_size: int = 50
    max_overflow: int = 10

    naming_convention: dict[str, str] = {
        "ix": "ix_%(column_0_label)s",
        "uq": "uq_%(table_name)s_%(column_0_N_name)s",
        "ck": "ck_%(table_name)s_%(constraint_name)s",
        "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
        "pk": "pk_%(table_name)s",
    }


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(
            ".env",
            ".env.template",
        ),
        case_sensitive=False,
        env_nested_delimiter="__",
        env_prefix="FASTAPI__",
    )

    run: RunConfig = RunConfig()
    api: ApiPrefix = ApiPrefix()
    db: DatabaseConfig = DatabaseConfig()
    static: Static = Static()
    auth: Auth = Auth()
    redis: RedisConfig = RedisConfig()

    environment: str = ""


settings = Settings()

print(settings.db.url)
