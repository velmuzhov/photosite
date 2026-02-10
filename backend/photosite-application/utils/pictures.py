from typing import Annotated
from datetime import date as dt_date
from pathlib import Path
import aiofiles
from fastapi import Form, UploadFile, File, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from core.models.picture import Picture
from core.models.category import Category
from core.models.event import Event
from sqlalchemy import select

from core.config import settings


def check_file_name(filename: str | None) -> bool:
    if filename is None:
        return False
    try:
        name, ext = filename.split(".")
    except ValueError:
        return False
    return name.isdigit() and ext in ("jpg", "jpeg")


def check_file_names(files: list[UploadFile]) -> bool:
    return all(check_file_name(file.filename) for file in files)


async def check_event_and_category(
    db: AsyncSession,
    category: str,
    date: dt_date,
) -> Category:
    """Проверяет допустимость категории и даты съемки для загружаемых
    изображений. После успешных проверок возвращает объект ORM-модели
    Category.
    """
    category_in_db = await db.scalar(select(Category).filter(Category.name == category))
    if not category_in_db:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Недопустимая категория",
        )

    event_in_db = await db.scalar(
        select(Event).filter(
            Event.category_id == category_in_db.id,
            Event.date == date,
        )
    )
    if event_in_db:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Съемка с такой датой в этой категории уже существует",
        )

    return category_in_db


async def create_event(
    db: AsyncSession,
    category: str,
    date: dt_date,
    cover: str | None,
    description: str | None,
) -> Event:
    """Создает и возвращает новую съемку в таблице event, id которой
    будет присваиваться полю event_id загружаемых фотографий.
    Съемка не создается отдельно, только как побочный эффект загрузки
    относящихся к ней фотографий.
    """
    category_in_db: Category = await check_event_and_category(db, category, date)
    new_event = Event(
        date=date,
        category_id=category_in_db.id,
        cover = cover,
        description = description,
    )
    db.add(new_event)
    await db.commit()
    await db.refresh(new_event)
    return new_event


async def save_file_to_db(
    db: AsyncSession,
    name: str,
    event: Event,
    file_rel_path: str,
) -> None:
    """Сохраняет путь к одному изображению, дату съемки и категорию
    в базе данных, проверяя корректность категории и даты.
    Добавление происходит без commit. Функция, использующая данную, должна
    принимать тот же объект AsyncSession и выполнить единый коммит для всех
    фотографий.
    """
    new_picture = Picture(
        name=name,
        path=file_rel_path,
        event_id=event.id,
    )
    db.add(new_picture)

async def write_one_file_on_disc(filename: str | Path, file: UploadFile) -> None:
    async with aiofiles.open(filename, "wb") as buffer:
        while chunk := await file.read(8192):
            await buffer.write(chunk)

async def save_multiple_files_to_event(
        db: AsyncSession,
        event: Event,
        category: str,
        date: str,
        files_to_add: list[UploadFile],
        dir_for_upload: Path,
) -> list[str]:
    added_files = []

    for file in files_to_add:
        if not file.filename:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Загружаемый файл должен иметь имя",
            )
        await write_one_file_on_disc(dir_for_upload / file.filename, file)
        await save_file_to_db(
            db,
            file.filename,
            event,
            f"{category}/{date}/{file.filename}",
        )
        added_files.append(file.filename)

    try:
        await db.commit()
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Ошибка при добавлении фотографий: {e}",
        )

    return added_files

