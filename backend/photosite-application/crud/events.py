from datetime import datetime
from typing import Annotated, Any
from collections.abc import Sequence
import shutil
from pathlib import Path
from sqlalchemy import select
from sqlalchemy.orm import joinedload
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import Form, HTTPException, status, Depends, Path

from core.config import settings
from core.models.event import Event
from core.models.category import Category
from core.models.picture import Picture
from utils.general import check_date


async def check_event_exists(db: AsyncSession, category: str, date: str) -> Event:
    """Проверяет существование съемки по ее категории и дате"""
    date_obj = check_date(date)

    event = await db.scalar(
        select(Event)
        .join(Category)
        .filter(
            Category.name == category,
            Event.date == date_obj,
        )
    )

    if event is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Такой съемки не существует",
        )

    return event


async def get_event_with_pictures(
    db: AsyncSession,
    category: Annotated[str, Path()],
    date: Annotated[str, Path()],
) -> dict[str, Any]:
    """Возвращает конкретную съемку вместе с относящимися к ней фотографиями
    на основе ее категории и даты"""
    event = await check_event_exists(db, category, date)

    result = await db.scalars(
        select(Picture).filter(Picture.event_id == event.id).order_by(Picture.name)
    )

    return {
        "id": event.id,
        "category_id": event.category_id,
        "date": event.date,
        "pictures": result.all(),
    }


async def delete_event(
    db: AsyncSession,
    category: Annotated[str, Form()],
    date: Annotated[str, Form()],
):
    """Удаляет съемку по ее категории и дате,
    удаляя также связанные с ней изображения из static/images и
    папку, в которой хранились эти изображения"""
    event_to_delete = await check_event_exists(db, category, date)

    if event_to_delete is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Такого события не существует, удаление невозможно",
        )

    query_result = await db.scalars(
        select(Picture).filter(Picture.event_id == event_to_delete.id)
    )

    pictures_to_delete = query_result.all()

    for picture in pictures_to_delete:
        await db.delete(picture)

    await db.delete(event_to_delete)
    await db.commit()

    dir_to_remove = settings.static.image_dir / category / date.replace("-", "")

    if dir_to_remove.exists() and dir_to_remove.is_dir():
        shutil.rmtree(dir_to_remove)
