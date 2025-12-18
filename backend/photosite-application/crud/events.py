from datetime import datetime
from typing import Annotated
import shutil
from pathlib import Path
from sqlalchemy import select
from sqlalchemy.orm import joinedload
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import Form, HTTPException, status

from core.config import settings
from core.models.event import Event
from core.models.category import Category
from core.models.picture import Picture
from utils.general import check_date


async def delete_event(
    db: AsyncSession,
    category: Annotated[str, Form()],
    date: Annotated[str, Form()],
):
    """Удаляет съемку по ее категории и дате,
    удаляя также связанные с ней изображения из static/images и
    папку, в которой хранились эти изображения"""
    date_obj = check_date(date)

    event_to_delete = await db.scalar(
        select(Event)
        .join(Event.category)
        .filter(
            Category.name == category,
            Event.date == date_obj,
        )
    )

    if event_to_delete is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Такого события не существует, удаление невозможно"
        )

    query_result = await db.scalars(
        select(Picture)
        .filter(Picture.event_id == event_to_delete.id)
    )

    pictures_to_delete = query_result.all()

    for picture in pictures_to_delete:
        await db.delete(picture)

    await db.delete(event_to_delete)
    await db.commit()


    dir_to_remove = settings.static.image_dir / category / date.replace("-", "")

    if dir_to_remove.exists() and dir_to_remove.is_dir():
        shutil.rmtree(dir_to_remove)
