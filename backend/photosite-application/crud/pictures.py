from collections.abc import Sequence
from typing import Annotated
import aiofiles
from datetime import datetime, date as dt_date
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from core.models.picture import Picture
from fastapi import File, Form, UploadFile, HTTPException, status

from core.config import settings
from utils.pictures import (
    check_file_names,
    create_event,
    save_file_to_db,
    write_one_file_on_disc,
    save_multiple_files_to_event,
)
from utils.general import check_date


async def get_all_pictures(session: AsyncSession) -> Sequence[Picture]:
    result = await session.scalars(select(Picture).order_by(Picture.id))
    return result.all()


async def upload_pictures(
    db: AsyncSession,
    files: Annotated[list[UploadFile], File()],
    category: Annotated[str, Form()],
    date: Annotated[str, Form()],
    event_cover: Annotated[UploadFile, Form()],
    event_description: Annotated[str | None, Form()] = None,
) -> list[str]:
    """Функция для загрузки нескольких изображений"""

    files = list(set(files))

    date_obj: dt_date = check_date(date)

    if not check_file_names(files + [event_cover]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Неверные имена или расширения файлов",
        )

    category_dir = settings.static.image_dir / category
    print(category_dir)
    date_dir = category_dir / date
    date_dir.mkdir(parents=True, exist_ok=True)

    # Сохранение изображения с обложкой категории
    event_cover_path = event_cover.filename
    event_cover_dir = settings.static.image_dir / "event_covers" / category / date
    event_cover_dir.mkdir(parents=True, exist_ok=True)
    file_path = event_cover_dir / str(event_cover.filename) # для статического анализатора, но None здесь не будет
    event_cover_path = f"event_covers/{category}/{date}/{event_cover.filename}"

    new_event = await create_event(
        db, category, date_obj, event_cover_path, event_description
    )
    
    try:
        result = await save_multiple_files_to_event(
            db=db,
            event=new_event,
            category=category,
            date=date,
            files_to_add=files,
            dir_for_upload=date_dir,
        )
    except Exception:
        await db.delete(new_event)
        await db.commit()
        raise

    await write_one_file_on_disc(file_path, event_cover)

    return result


async def delete_pictures(
    db: AsyncSession,
    picture_paths: list[str],
) -> None:
    """Удаляет в рамках транзакции выбранные фотографии
    из базы данных по их путям.
    При успешном удалении из базы данных удаляются файлы
    на диске."""
    
    for picture_path in set(
        picture_paths
    ):  # удаление дубликатов, должно сработать одно удаление без вызова исключения
        picture = await db.scalar(
            select(Picture).filter(Picture.path == picture_path)
        )
        if picture is None:
            raise ValueError(f"Такого изображения не существует: {picture_path}")
        await db.delete(picture)
    await db.commit()
    for picture_path in picture_paths:
        file_path = settings.static.image_dir / picture_path
        try:
            file_path.unlink(missing_ok=True)
        except Exception as e:
            # залогировать
            print(f"Ошибка при удалении {file_path}: {e}")
