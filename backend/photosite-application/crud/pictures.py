from collections.abc import Sequence
from typing import Annotated
import aiofiles
from datetime import datetime
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from core.models.picture import Picture
from fastapi import File, Form, UploadFile, HTTPException, status

from core.config import settings
from utils.pictures import check_file_names, create_event, save_file_to_db
from utils.general import check_date

async def get_all_pictures(session: AsyncSession) -> Sequence[Picture]:
    result = await session.scalars(select(Picture).order_by(Picture.id))
    return result.all()

async def upload_pictures(
    db: AsyncSession,
    files: Annotated[list[UploadFile], File()],
    category: Annotated[str, Form()],
    date: Annotated[str, Form()],
) -> list[str]:
    """Функция для загрузки нескольких изображений"""
    
    date_obj: datetime = check_date(date)
    
    if not check_file_names(files):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Неверные имена или расширения файлов",
        )


    category_dir = settings.static.image_dir / category
    date_dir = category_dir / date.replace("-", "")
    date_dir.mkdir(parents=True, exist_ok=True)

    new_event = await create_event(db, category, date_obj)

    added_files = []

    for file in files:
        if not file.filename:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Загружаемый файл должен иметь имя",
            )
        file_path = date_dir / file.filename

        async with aiofiles.open(file_path, "wb") as buffer:
            while chunk := await file.read(8192):
                await buffer.write(chunk)

        await save_file_to_db(
            db=db,
            name=file.filename,
            event=new_event,
            file_rel_path=f"{category}/{date.replace('-', '')}/{file.filename}",
        )

        added_files.append(file.filename)
    
    # Один коммит для всех добавленных фотографий
    try:
        await db.commit()
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Ошибка при добавлении фотографий: {e}",
        )

    return added_files
