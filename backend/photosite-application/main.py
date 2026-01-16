from contextlib import asynccontextmanager
import uvicorn
from fastapi import FastAPI
from fastapi.responses import ORJSONResponse
from core.config import settings
from core.models import db_helper
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi_cache import FastAPICache
from fastapi_cache.backends.redis import RedisBackend
from redis import asyncio as aioredis

from api import router as api_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    redis = aioredis.from_url(
        settings.redis.url,
        encoding="utf-8",
        decode_responses=True,
    )
    FastAPICache.init(
        RedisBackend(redis),
        prefix=settings.redis.prefix,
    )
    yield
    print("Dispose engine")
    await db_helper.dispose()


main_app = FastAPI(
    default_response_class=ORJSONResponse,
    lifespan=lifespan,
)

main_app.mount(
    "/static",
    StaticFiles(directory="static"),
    name="static",
)


# исправить при деплое
main_app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_credentials=True,
)

main_app.include_router(
    router=api_router,
    prefix=settings.api.prefix,
)


@main_app.get("/")
async def work_check():
    return {"message": "API is running... still What if I change it?"}


if __name__ == "__main__":
    uvicorn.run(
        app="main:main_app",
        host=settings.run.host,
        port=settings.run.port,
        reload=True,
    )
