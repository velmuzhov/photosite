import shutil
from datetime import date as dt_date
from pathlib import Path
import aiofiles
from fastapi import UploadFile, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from core.models.picture import Picture
from core.models.category import Category
from core.models.event import Event
from sqlalchemy import select
from PIL import Image


from core.config import settings


def resize_and_crop_image(input_path: Path, output_path: Path) -> None:
    """Функция, создающая и записывающая в файловую систему превью для фотографии.
    Принимает путь (pathlib.Path) к исходному файлу на диске (уже записанному) и путь файла
    назначения."""
    with Image.open(input_path) as img:
        width, height = img.size

        target_ratio = settings.static.thumbnails_target_ratio

        current_ratio = height / width

        if current_ratio > target_ratio:
            new_height = int(width * target_ratio)
            top = (height - new_height) // 2
            bottom = top + new_height
            cropped_img = img.crop((0, top, width, bottom))
        else:
            new_width = int(height / target_ratio)
            left = (width - new_width) // 2
            right = left + new_width
            cropped_img = img.crop((left, 0, right, height))

        resized_img = cropped_img.resize(
            (
                settings.static.thumbnails_width,
                settings.static.thumbnails_height,
            ),
            Image.Resampling.LANCZOS,
        )

        resized_img.save(output_path, quality=90)


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
    cover: str,
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
        cover=cover,
        description=description,
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
    await db.flush()  # проверка на уровне базы данных, что категория и дата допустимы


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
    dir_for_thumbnails: Path,
) -> list[str]:
    added_files: list[str] = []

    filenames: list[str] = []

    for file in files_to_add:
        if not file.filename:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Загружаемый файл должен иметь имя",
            )
        if file.filename in filenames:  # type: ignore
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Необходимо загружать файлы с уникальными именами",
            )
        filenames.append(file.filename)
    for file in files_to_add:
        await save_file_to_db(
            db,
            file.filename,  # type: ignore
            event,
            f"{category}/{date}/{file.filename}",
        )
        added_files.append(str(file.filename))

    for file in files_to_add:
        await write_one_file_on_disc(dir_for_upload / file.filename, file)  # type: ignore

    for item in dir_for_upload.iterdir():
        if item.is_file():
            resize_and_crop_image(item, dir_for_thumbnails / item.name)

    try:
        await db.commit()
    except Exception as e:
        await db.rollback()
        shutil.rmtree(dir_for_upload, ignore_errors=True)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Ошибка при добавлении фотографий: {e}",
        )

    return added_files
