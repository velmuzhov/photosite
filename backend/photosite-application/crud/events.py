from datetime import datetime
from typing import Annotated, Any
from collections.abc import Sequence
import shutil
from sqlalchemy import select
from sqlalchemy.orm import joinedload, selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import Form, HTTPException, status, Depends, Path, File, UploadFile

from core.config import settings
from core.models.event import Event
from core.models.category import Category
from core.models.picture import Picture
from core.schemas.event import EventRead
from utils.general import check_date
from utils.pictures import check_file_names, write_one_file_on_disc, save_file_to_db, save_multiple_files_to_event


async def check_event_exists(db: AsyncSession, category: str, date: str, with_pictures: bool = False,) -> Event:
    """Проверяет существование съемки по ее категории и дате"""
    date_obj = check_date(date)

    if not with_pictures:

        event = await db.scalar(
            select(Event)
            .join(Category)
            .filter(
                Category.name == category,
                Event.date == date_obj,
            )
        )
    
    else:
        event = await db.scalar(
            select(Event)
            .join(Category)
            .options(selectinload(Event.pictures))
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
) -> Event:
    """Возвращает конкретную съемку вместе с относящимися к ней фотографиями
    на основе ее категории и даты"""
    return await check_event_exists(db, category, date, with_pictures=True)

    


async def delete_event(
    db: AsyncSession,
    category: Annotated[str, Form()],
    date: Annotated[str, Form()],
):
    """Удаляет съемку по ее категории и дате,
    удаляя также связанные с ней изображения из static/images, обложку и
    папки, в которой хранились эти изображения"""
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

    dir_to_remove = settings.static.image_dir / category / date
    dir_with_cover_to_remove = (
        settings.static.image_dir / "event_covers" / category / date
    )

    if dir_to_remove.exists() and dir_to_remove.is_dir():
        shutil.rmtree(dir_to_remove)

    if dir_with_cover_to_remove.exists() and dir_with_cover_to_remove.is_dir():
        shutil.rmtree(dir_with_cover_to_remove)


async def get_events_by_category(
    db: AsyncSession,
    category: str,
) -> Sequence[Event]:
    """Возвращает последовательность съемок,
    относящихся к данной категории
    от наиболее новых к самым старым."""
    result = await db.scalars(
        select(Event)
        .join(Category)
        .filter(Category.name == category)
        .order_by(Event.date.desc())
    )
    return result.all()


async def get_events_by_date_created(
    db: AsyncSession,
    limit: int | None = None,
) -> Sequence[Event]:
    """
    Возвращает последовательность съемок
    от последних созданных к первым созданным.
    """
    stmt = select(Event).order_by(Event.created.desc())
    if limit:
        stmt = stmt.limit(limit)
    result = await db.scalars(stmt)

    return result.all()

async def add_pictures_to_existing_event(
        db: AsyncSession,
        category: str,
        date: str,
        files: Annotated[list[UploadFile], File()],
) -> list[str]:
    """Добавляет файлы к существующей съемке. При совпадении
    имен файлов сохраняются старые файлы."""
    
    event: Event = await check_event_exists(db, category, date)

    if not check_file_names(files):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Неверные имена или расширения файлов",
        )
    existing_files = await db.scalars(
        select(Picture)
        .filter(Picture.event == event)
    )
    existing_file_names: list[str] = [file.name for file in existing_files.all()]

    files_to_add: list[UploadFile] = [file for file in files if file.filename not in existing_file_names]

    dir_for_upload = settings.static.image_dir / category / date

    return await save_multiple_files_to_event(
        db=db,
        event=event,
        category=category,
        date=date,
        files_to_add=files_to_add,
        dir_for_upload=dir_for_upload,
    )