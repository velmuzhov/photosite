from typing import Annotated
from datetime import datetime, date
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
    name, ext = filename.split(".")
    return name.isdigit() and ext in ("jpg", "jpeg")

def check_file_names(files: list[UploadFile]) -> bool:
    return all(check_file_name(file.filename) for file in files)

async def check_event_and_category(
        db: AsyncSession,
        category: str,
        date: datetime,
) -> Category:
    """ Проверяет допустимость категории и даты съемки для загружаемых
    изображений. После успешных проверок возвращает объект ORM-модели
    Category.
    """
    category_in_db = await db.scalar(
        select(Category)
        .filter(Category.name == category)
    )
    if not category_in_db:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Недопустимая категория",
        )

    event_in_db = await db.scalar(
        select(Event)
        .filter(
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
        date: datetime,
) -> Event:
    """Создает и возвращает новую съемку в таблице event, id которой
    будет присваиваться полю event_id загружаемых фотографий.
    """
    category_in_db: Category = await check_event_and_category(db, category, date)
    new_event = Event(
        date = date,
        category_id = category_in_db.id,
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
):
    """Сохраняет путь к одному изображению, дату съемки и категорию
    в базе данных, проверяя корректность категории и даты.
    """
    new_picture = Picture(
        name = name,
        path = file_rel_path,
        event_id = event.id,
    )
    db.add(new_picture)
    await db.commit()
    await db.refresh(new_picture)
    return new_picture
    
    


