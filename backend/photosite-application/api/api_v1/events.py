from typing import Annotated
from collections.abc import Sequence
from fastapi import APIRouter, Depends, Form, Path
from sqlalchemy.ext.asyncio import AsyncSession

from core.models import db_helper
from core.models.event import Event
from core.models.picture import Picture
from core.config import settings
from core.schemas.picture import PictureRead
from core.schemas.event import EventRead
from crud import events as events_crud

router = APIRouter(
    prefix=settings.api.v1.events,
    tags=[
        "events",
    ],
)

get_async_db = Annotated[AsyncSession, Depends(db_helper.session_getter)]


@router.get("/{category}/{date}", response_model=EventRead)
async def get_one_event_pictures(
    db: get_async_db,
    category: Annotated[str, Path()],
    date: Annotated[str, Path()],
):
    """
    Функция операции для получения всех фотографий из одной съемки.
    """
    return await events_crud.get_event_with_pictures(db, category, date)
    


@router.delete("/")
async def delete_event_operation(
    db: get_async_db,
    category: Annotated[str, Form()],
    date: Annotated[str, Form()],
) -> dict[str, str]:
    await events_crud.delete_event(db, category, date)
    return {"message": f"Съемка {date} из категории {category} удалена"}
