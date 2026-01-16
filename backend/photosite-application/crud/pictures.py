from collections.abc import Sequence
from typing import Annotated
import aiofiles
from datetime import datetime
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
    event_cover: Annotated[UploadFile | None, Form()],
    event_description: Annotated[str | None, Form()],
) -> list[str]:
    """Функция для загрузки нескольких изображений"""

    date_obj: datetime = check_date(date)

    if not check_file_names(files):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Неверные имена или расширения файлов",
        )

    category_dir = settings.static.image_dir / category
    date_dir = category_dir / date
    date_dir.mkdir(parents=True, exist_ok=True)

    # Сохранение изображения с обложкой категории
    if event_cover and event_cover.filename:
        event_cover_path = event_cover.filename
        event_cover_dir = settings.static.image_dir / "event_covers" / category / date
        event_cover_dir.mkdir(parents=True, exist_ok=True)
        file_path = event_cover_dir / event_cover.filename
        await write_one_file_on_disc(file_path, event_cover)
        event_cover_path = f"event_covers/{category}/{date}/{event_cover.filename}"

    else:
        event_cover_path = None

    new_event = await create_event(
        db, category, date_obj, event_cover_path, event_description
    )

    return await save_multiple_files_to_event(
        db=db,
        event=new_event,
        category=category,
        date=date,
        files_to_add=files,
        dir_for_upload=date_dir,
    )


async def delete_pictures(
    db: AsyncSession,
    picture_paths: list[str],
) -> None:
    """Удаляет в рамках транзакции выбранные фотографии
    из базы данных по их путям.
    При успешном удалении из базы данных удаляются файлы
    на диске."""
    async with db.begin():
        for picture_path in picture_paths:
            picture = await db.scalar(
                select(Picture).filter(Picture.path == picture_path)
            )
            if picture is None:
                raise
            await db.delete(picture)
        await db.flush()
        for picture_path in picture_paths:
            file_path = settings.static.image_dir / picture_path
            try:
                file_path.unlink(missing_ok=True)
            except Exception as e:
                # залогировать
                print(f"Ошибка при удалении {file_path}: {e}")
