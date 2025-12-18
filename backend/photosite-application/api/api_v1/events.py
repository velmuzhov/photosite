from typing import Annotated
from fastapi import APIRouter, Depends, Form
from sqlalchemy.ext.asyncio import AsyncSession

from core.models import db_helper
from core.config import settings
from crud import events as events_crud

router = APIRouter(
    prefix=settings.api.v1.events,
    tags=[
        "events",
    ],
)

get_async_db = Annotated[AsyncSession, Depends(db_helper.session_getter)]


@router.delete("/")
async def delete_event_operation(
    db: get_async_db,
    category: Annotated[str, Form()],
    date: Annotated[str, Form()],
) -> dict[str, str]:
    await events_crud.delete_event(db, category, date)
    return {"message": f"Съемка {date} из категории {category} удалена"}
