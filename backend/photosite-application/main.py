import time
import logging
from contextlib import asynccontextmanager
from collections.abc import Callable
import uvicorn
from fastapi import FastAPI, Request, Response
from fastapi.responses import ORJSONResponse
from core.config import settings
from core.models import db_helper
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi_cache import FastAPICache
from fastapi_cache.backends.redis import RedisBackend
from redis import asyncio as aioredis

from api import router as api_router
from logging_config import setup_logging

setup_logging()

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    redis = aioredis.from_url(
        settings.redis.url,
        encoding="utf-8",
        decode_responses=True,
    )
    print(redis)
    FastAPICache.init(
        RedisBackend(redis),
        prefix=settings.redis.prefix,
    )
    yield
    print("Dispose engine")
    await redis.close()
    await db_helper.dispose()


main_app = FastAPI(
    default_response_class=ORJSONResponse,
    lifespan=lifespan,
    docs_url= "/docs" if settings.environment == "development" else None
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



@main_app.middleware("http")
async def log_requests(request: Request, call_next: Callable) -> Response:
    start_time = time.time()

    logger.info(
        f"Request: {request.method} {request.url.path}",
        extra={
            "method": request.method,
            "path": request.url.path,
            "client_ip": request.client.host if request.client else "unknown",
            "user_agent": request.headers.get("user-agent", "unknown"),
        },
    )

    try:
        response: Response = await call_next(request)
        process_time = time.time() - start_time
        logger.info(
            f"Request completed in {process_time:.4f} seconds with status code {response.status_code}",
            extra={
                "status_code": response.status_code,
                "processing_time": f"{process_time:.4f}",
            },
        )
        return response
    except Exception as e:
        logger.exception(f"Error processing request: {str(e)}")
        raise


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
