from typing import Annotated
from collections.abc import Sequence
from fastapi import APIRouter, Depends, Form, Path, Query, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi_cache.decorator import cache
from fastapi_cache import FastAPICache

from core.models import db_helper
from core.models.event import Event
from core.models.picture import Picture
from core.models.user import User
from core.config import settings
from core.schemas.picture import PictureRead
from core.schemas.event import EventRead, EventReadNoPictures, EventUpdate
from crud import events as events_crud

from utils.authorization import get_current_user

router = APIRouter(
    prefix=settings.api.v1.events,
    tags=[
        "events",
    ],
)

get_async_db = Annotated[AsyncSession, Depends(db_helper.session_getter)]


@router.get("/{category}/{date}", response_model=EventRead)
@cache(expire=60 * 60 * 3)
async def get_one_event_pictures(
    db: get_async_db,
    category: Annotated[str, Path()],
    date: Annotated[str, Path()],
):
    """
    Функция операции для получения всех фотографий из одной съемки.
    """
    return await events_crud.get_event_with_pictures(db, category, date)


@router.get("/{category}", response_model=list[EventReadNoPictures])
@cache(expire=60 * 60 * 3)
async def get_events_with_category(
    db: get_async_db,
    category: Annotated[str, Path()],
):
    """
    Функция операции для получения всех съемок из данной категории
    в обратном хронологическом порядке.
    """
    return await events_crud.get_events_by_category(
        db,
        category,
    )


@router.put("/{category}/{date}", response_model=EventReadNoPictures)
async def edit_event(
    user: Annotated[User, Depends(get_current_user)],
    db: get_async_db,
    category: Annotated[str, Path()],
    date: Annotated[str, Path()],
    new_date: Annotated[str | None, Form()] = None,
    new_category: Annotated[str | None, Form()] = None,
    new_description: Annotated[str | None, Form()] = None,
    new_cover: Annotated[UploadFile | None, File()] = None,
):
    """Конечная точка для изменения съемки. Можно изменить
    категорию, обложку, описание и дату съемки. Новые данные
    поступают из формы.
    """
    await FastAPICache.clear()

    return await events_crud.edit_event_data(
        db=db,
        category=category,
        date=date,
        new_data=EventUpdate(
            date=new_date,
            category=new_category,
            description=new_description,
        ),
        new_cover=new_cover,
    )


@router.patch("/{category}/{date}")
async def add_pictures(
    user: Annotated[User, Depends(get_current_user)],
    db: get_async_db,
    category: Annotated[str, Path()],
    date: Annotated[str, Path()],
    files: Annotated[list[UploadFile], File()],
) -> list[str]:
    """Конечная точка для добавления фотографий к существующей съемке.
    Категория и дата съемки поступают не через форму, а как параметры пути. Файлы поступают через форму и должны быть валидированы
    схемой EventUpdate. На этот маршрут должен отправляться запрос на фронтенде при нажатии кнопки.
    """
    await FastAPICache.clear()

    return await events_crud.add_pictures_to_existing_event(db, category, date, files)


@router.delete("/{category}/{date}")
async def delete_event_operation(
    user: Annotated[User, Depends(get_current_user)],
    db: get_async_db,
    category: Annotated[str, Path()],
    date: Annotated[str, Path()],
) -> dict[str, str]:
    """Конечная точка для удаления съемки. Категория и дата
    поступают не через форму, а как параметры пути. На этот маршрут
    должен отправляться запрос на фронтенде при нажатии кнопки."""
    await FastAPICache.clear()
    await events_crud.delete_event(db, category, date)
    return {"message": f"Съемка {date} из категории {category} удалена"}


@router.get("/")
async def get_all_events(
    user: Annotated[User, Depends(get_current_user)],
    db: get_async_db,
    limit: Annotated[int | None, Query()] = None,
):
    """Возвращает limit последних созданных съемок"""
    return await events_crud.get_events_by_date_created(db, limit)


@router.delete("/{category}/{date}/description", response_model=EventReadNoPictures)
async def delete_description_of_event(
    user: Annotated[User, Depends(get_current_user)],
    db: get_async_db,
    category: Annotated[str, Path()],
    date: Annotated[str, Path()],
):
    """Обработка маршрута для удаления описания съемки."""
    return await events_crud.delete_event_description(db, category, date)


@router.delete("/{category}/{date}/cover", response_model=EventReadNoPictures)
async def delete_cover_of_event(
    user: Annotated[User, Depends(get_current_user)],
    db: get_async_db,
    category: Annotated[str, Path()],
    date: Annotated[str, Path()],
):
    """Обработка маршрута для удаления обложка съемки."""
    return await events_crud.delete_event_cover(db, category, date)
