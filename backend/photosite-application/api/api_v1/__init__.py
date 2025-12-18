from fastapi import APIRouter
from core.config import settings
from .pictures import router as pictures_router
from .events import router as events_router

router = APIRouter(
    prefix=settings.api.v1.prefix,
    tags=[
        "api_v1",
    ],
)

router.include_router(pictures_router)
router.include_router(events_router)
