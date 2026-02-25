from typing import Annotated, Any
import hashlib
from collections.abc import Sequence, Callable
from fastapi import APIRouter, Depends, Form, Path, Query, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi_cache.decorator import cache
from fastapi_cache import FastAPICache
from fastapi.requests import Request


from core.models import db_helper
from core.models.event import Event
from core.models.user import User
from core.config import settings
from core.schemas.event import (
    EventRead,
    EventReadNoPictures,
    EventDescriptionUpdate,
    EventReadWithCategoryName,
)
from crud import events as events_crud

from utils.authorization import get_current_user

router = APIRouter(
    prefix=settings.api.v1.events,
    tags=[
        "events",
    ],
)

get_async_db = Annotated[AsyncSession, Depends(db_helper.session_getter)]


def events_key_builder(
    func: Callable[..., Any],
    namespace: str = "",
    *,
    request: Request | None = None,
    response: Request | None = None,
    args: tuple[Any, ...],
    kwargs: dict[str, Any],
) -> str:
    """Кастомный создатель ключей в кеше, исключающий из аргументов конечной точки
    экземпляр асинхронно сессии"""
    custom_kwargs = {
        key: value
        for key, value in kwargs.items()
        if not isinstance(value, AsyncSession)
    }

    print(args)
    print(custom_kwargs)

    cache_key = hashlib.md5(
        f"{func.__module__}:{func.__name__}:{args}:{custom_kwargs}".encode()
    ).hexdigest()
    return f"{namespace}:{cache_key}"


@router.get("/cache_reset")
async def clear_cache(user: Annotated[User, Depends(get_current_user)]):
    """Принудительно очищает кеш приложения."""
    await FastAPICache.clear()


@router.get("/inactive", response_model=list[EventReadWithCategoryName])
async def get_all_inactive_events(
    user: Annotated[User, Depends(get_current_user)],
    db: get_async_db,
):
    """Возвращает администратору список неактивных съемок. Поскольку требуется имя категории,
    дополнительно есть поле category, имя категории хранится в атрибуте
    category.name. Должен использоваться на фронтенде для включения активности"""
    return await events_crud.get_inactive_events(db)


@router.get("/{category}/{date}", response_model=EventRead)
@cache(expire=settings.cache.term, key_builder=events_key_builder)  # type: ignore
async def get_one_event_pictures(
    db: get_async_db,
    category: Annotated[str, Path()],
    date: Annotated[str, Path()],
):
    """
    Функция операции для получения всех фотографий из одной съемки.
    """
    return await events_crud.get_event_with_pictures(db, category, date)


@router.get("/{category}")
@cache(expire=settings.cache.term, key_builder=events_key_builder)  # type: ignore
async def get_events_with_category(
    db: get_async_db,
    category: Annotated[str, Path()],
    limit: Annotated[int, Query()] = settings.querysettings.limit,
    page: Annotated[int, Query()] = 1,
) -> dict[str, int | Sequence[Event]]:
    """
    Функция операции для получения всех съемок из данной категории
    в обратном хронологическом порядке. Возвращает словарь с полным
    количеством записей для пагинации и последовательностью из
    экземпляров orm-модели Event.
    """

    total_count, events = await events_crud.get_events_by_category(
        db,
        category,
        limit=limit,
        page=page,
    )

    return {
        "total_count": total_count,
        "events": events,
    }


@router.get("/{category}/{date}/admin", response_model=EventRead)
async def get_one_event_pictures_for_admin(
    user: Annotated[User, Depends(get_current_user)],
    db: get_async_db,
    category: Annotated[str, Path()],
    date: Annotated[str, Path()],
):
    """
    Функция операции для получения всех фотографий из одной съемки для админки.
    """
    return await events_crud.get_event_with_pictures(db, category, date)


@router.get("/{category}/{date}/admin_no_pictures", response_model=EventRead)
async def get_one_event_no_pictures_for_admin(
    user: Annotated[User, Depends(get_current_user)],
    db: get_async_db,
    category: Annotated[str, Path()],
    date: Annotated[str, Path()],
):
    """
    Функция операции для получения информации о съемке для админки.
    """
    return await events_crud.get_event_with_pictures(db, category, date)


@router.patch("/{category}/{date}", response_model=EventReadNoPictures)
async def edit_event(
    user: Annotated[User, Depends(get_current_user)],
    db: get_async_db,
    category: Annotated[str, Path()],
    date: Annotated[str, Path()],
    new_date: Annotated[str | None, Form()] = None,
    new_category: Annotated[str | None, Form()] = None,
):
    """Конечная точка для изменения даты и категории съемки.
    Новые данные поступают из формы"""
    await FastAPICache.clear()

    return await events_crud.edit_event_base_data(
        db=db,
        category=category,
        date=date,
        new_category=new_category,
        new_date=new_date,
    )


@router.patch("/{category}/{date}/pictures")
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


@router.patch("/{category}/{date}/description", response_model=EventReadNoPictures)
async def edit_description_of_event(
    user: Annotated[User, Depends(get_current_user)],
    db: get_async_db,
    category: Annotated[str, Path()],
    date: Annotated[str, Path()],
    new_data: Annotated[EventDescriptionUpdate, Form()],
):
    """Конечная точка для изменения описания съемки. Новое описание
    поступает из формы. На этот маршрут должен отправляться запрос на
    фронтенде при нажатии кнопки."""
    await FastAPICache.clear()

    return await events_crud.edit_event_description(
        db, category, date, new_data.description
    )


@router.patch("/{category}/{date}/cover", response_model=EventReadNoPictures)
async def edit_cover_of_event(
    user: Annotated[User, Depends(get_current_user)],
    db: get_async_db,
    category: Annotated[str, Path()],
    date: Annotated[str, Path()],
    new_cover: Annotated[UploadFile, File()],
):
    """Конечная точка для изменения обложки съемки. Новый файл
    поступает через форму. На этот маршрут должен отправляться запрос на
    фронтенде при нажатии кнопки."""
    await FastAPICache.clear()

    return await events_crud.edit_event_cover(db, category, date, new_cover)


@router.patch("/{category}/{date}/active", response_model=EventReadNoPictures)
async def change_active_status_of_event(
    user: Annotated[User, Depends(get_current_user)],
    db: get_async_db,
    category: Annotated[str, Path()],
    date: Annotated[str, Path()],
):
    """Конечная точка для изменения статуса съемки (активна/неактивна).
    Операция не является идемпотентной (toggle).
    На этот маршрут должен отправляться запрос на фронтенде при нажатии
    кнопки."""

    await FastAPICache.clear()

    return await events_crud.toggle_event_active_status(db, category, date)


@router.delete("/{category}/{date}")
async def delete_event_operation(
    user: Annotated[User, Depends(get_current_user)],
    db: get_async_db,
    category: Annotated[str, Path()],
    date: Annotated[str, Path()],
) -> dict[str, str]:
    """Конечная точка для удаления съемки. На этот маршрут
    должен отправляться запрос на фронтенде при нажатии кнопки."""
    await FastAPICache.clear()

    await events_crud.delete_event(db, category, date)
    return {"message": f"Съемка {date} из категории {category} удалена"}


@router.get("/")
async def get_all_events(
    user: Annotated[User, Depends(get_current_user)],
    db: get_async_db,
    limit: Annotated[int, Query()] = settings.querysettings.limit,
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
    await FastAPICache.clear()

    return await events_crud.delete_event_description(db, category, date)
