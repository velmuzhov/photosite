from collections.abc import Sequence
from typing import Annotated
from datetime import date as dt_date
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from core.models.picture import Picture
from fastapi import File, Form, UploadFile, HTTPException, status

from core.config import settings
from utils.pictures import (
    check_file_names,
    create_event,
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
    """Функция для загрузки нескольких изображений. Создает также объект
    Event, к которому относятся изображения. Должна оставаться единственным
    способом создать объект Event, чтобы не допустить создание объекта Event
    изначально без изображений"""

    files = list(set(files))

    date_obj: dt_date = check_date(date)

    if not check_file_names(files + [event_cover]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Неверные имена или расширения файлов",
        )

    category_dir = settings.static.image_dir / category
    thumbnails_category_dir = settings.static.thumbnails_dir / category
    print(category_dir)
    date_dir = category_dir / date
    thumbnails_date_dir = thumbnails_category_dir / date
    date_dir.mkdir(parents=True, exist_ok=True)
    thumbnails_date_dir.mkdir(parents=True, exist_ok=True)

    # Сохранение изображения с обложкой категории
    event_cover_path = event_cover.filename
    event_cover_dir = settings.static.covers_dir / category / date
    event_cover_dir.mkdir(parents=True, exist_ok=True)
    file_path = event_cover_dir / str(event_cover.filename) # для статического анализатора, но None здесь не будет
    event_cover_path = f"{settings.static.covers_dir.name}/{category}/{date}/{event_cover.filename}"

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
            dir_for_thumbnails=thumbnails_date_dir,
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
    на диске.
    Удаление всех фотографий не приводит к удалению съемки, к которой
    они относятся. Она остается доступной для добавления фотографий.
    """

    if len(picture_paths) == 0:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="Нужно выбрать хотя бы один файл для удаления",
        )
    
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
        thumbnail_path = settings.static.thumbnails_dir / picture_path
        try:
            file_path.unlink(missing_ok=True)
            thumbnail_path.unlink(missing_ok=True)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Не удалось удалить файлы, ошибка: {e}",
            )
