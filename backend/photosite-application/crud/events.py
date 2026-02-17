import pathlib
from datetime import datetime
from typing import Annotated, Any
from collections.abc import Sequence
import shutil
from sqlalchemy import select, func
from sqlalchemy.orm import joinedload, selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import Form, HTTPException, status, Depends, Path, File, UploadFile

from core.config import settings
from core.models.event import Event
from core.models.category import Category
from core.models.picture import Picture
from utils.general import check_date, move_files
from utils.pictures import (
    check_file_names,
    write_one_file_on_disc,
    save_file_to_db,
    save_multiple_files_to_event,
    check_file_name,
)


async def check_event_exists(
    db: AsyncSession,
    category: str,
    date: str,
    with_pictures: bool = False,
    is_active: bool = True,
) -> Event:
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
            .join(Picture)
            .options(selectinload(Event.pictures))
            .filter(
                Category.name == category,
                Event.date == date_obj,
            )
        )

    if is_active:
        if event and event.active is False:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Съемка была удалена",
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
    limit: int = settings.querysettings.limit,
    page: int = 1,
    is_active: bool = True,
) -> tuple[int, Sequence[Event]]:
    """Возвращает последовательность съемок,
    относящихся к данной категории
    от наиболее новых к самым старым."""
    event_count_stmt = (
        select(func.count(Event.id))
        .join(Category)
        .filter(Category.name == category)
    )

    if is_active:
        event_count_stmt.filter(Event.active.is_(True))

    total_events: int = await db.scalar(event_count_stmt) or 0

    

    stmt = (
        select(Event)
        .join(Category)
        .filter(Category.name == category)
        .limit(limit)
        .offset(limit * (page - 1))
        .order_by(Event.date.desc())
    )

    if is_active:
        stmt = stmt.filter(Event.active.is_(True))

    result = await db.scalars(stmt)
    return total_events, result.all()


async def get_events_by_date_created(
    db: AsyncSession,
    limit: int = settings.querysettings.limit,
    page: int = 1,
) -> Sequence[Event]:
    """
    Возвращает последовательность съемок
    от последних созданных к первым созданным.
    """
    stmt = select(Event).order_by(Event.created.desc()).limit(limit).offset(limit * (page - 1))
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

    event: Event = await check_event_exists(db, category, date, with_pictures=True)

    if not check_file_names(files):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Неверные имена или расширения файлов",
        )
    if len(files) != len([file.filename for file in files if file.filename is not None]):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Необходимо добавлять файлы с уникальными именами"
        )

    existing_files = await db.scalars(select(Picture).filter(Picture.event == event))
    existing_file_names: list[str] = [file.name for file in existing_files.all()]

    files_to_add: list[UploadFile] = [
        file for file in files if file.filename not in existing_file_names
    ]

    dir_for_upload = settings.static.image_dir / category / date

    return await save_multiple_files_to_event(
        db=db,
        event=event,
        category=category,
        date=date,
        files_to_add=files_to_add,
        dir_for_upload=dir_for_upload,
    )


async def edit_event_base_data(
    db: AsyncSession,
    category: str,
    date: str,
    new_category: str | None = None,
    new_date: str | None = None,
) -> Event:
    # Проверка на передачу пустых данных
    if new_category is None and new_date is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Нет данных для обновления",
        )
    event: Event = await check_event_exists(
        db, category, date, with_pictures=True, is_active=False
    )

    cat_to_db: str = new_category or category
    date_to_db: str = new_date or date

    if cat_to_db != category:
        category_exists = await db.scalar(
            select(Category).filter(Category.name == cat_to_db)
        )
        if category_exists is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Такой категории не существует",
            )
        # замена категории
        event.category = category_exists

    for picture in event.pictures:
        picture.path = f"{cat_to_db}/{date_to_db}/{picture.name}"

    existing_event_with_new_data = await db.scalar(
        select(Event)
        .join(Category)
        .filter(
            Category.name == cat_to_db,
            Event.date == check_date(date_to_db),
            Event.id != event.id,
        )
    )
    if existing_event_with_new_data:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Съемка с такими данными уже существует",
        )
    # замена даты
    event.date = check_date(date_to_db) if date_to_db != date else event.date

    # замена пути к обложке
    event_cover_file_name = event.cover.split("/")[-1]
    event.cover = f"event_covers/{cat_to_db}/{date_to_db}/{event_cover_file_name}"

    await db.commit()
    await db.refresh(event)

    # создание новых директорий для фотографий и обложки, если они не существуют
    old_pictures_dir = settings.static.image_dir / category / date
    new_pictures_dir = settings.static.image_dir / cat_to_db / date_to_db
    old_cover_dir = settings.static.image_dir / "event_covers" / category / date
    new_cover_dir = settings.static.image_dir / "event_covers" / cat_to_db / date_to_db

    # обновление путей к фотографиям в базе данных
    for picture in event.pictures:
        picture.path = str(new_pictures_dir / picture.name)

    move_files(old_pictures_dir, new_pictures_dir)  # перенос фотографий
    move_files(old_cover_dir, new_cover_dir)  # перенос обложки

    return event


async def edit_event_description(
    db: AsyncSession,
    category: str,
    date: str,
    new_description: str,
) -> Event:
    """Изменение описания съемки."""
    event = await check_event_exists(db, category, date, is_active=False)
    event.description = new_description

    await db.commit()
    await db.refresh(event)

    return event


async def edit_event_cover(
    db: AsyncSession,
    category: str,
    date: str,
    new_cover: UploadFile,
) -> Event:
    """Изменение обложки съемки. Старая обложка удаляется с диска, а новая сохраняется на ее место."""
    event = await check_event_exists(db, category, date, is_active=False)

    if not check_file_name(new_cover.filename):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Неверное имя или расширение файла",
        )

    # создание директории для обложки, если она не существует (для перестраховки, она должна была быть создана при загрузке обложки при создании съемки)
    dir_for_cover = settings.static.image_dir / "event_covers" / category / date
    dir_for_cover.mkdir(parents=True, exist_ok=True)

    # удаление старой обложки с диска
    old_cover_path = settings.static.image_dir / event.cover
    if old_cover_path.exists():
        old_cover_path.unlink()

    # сохранение нового пути к обложке в базе данных
    new_cover_path = (
        settings.static.image_dir
        / "event_covers"
        / category
        / date
        / str(new_cover.filename)
    )
    event.cover = str(new_cover_path.relative_to(settings.static.image_dir))

    await db.commit()
    await db.refresh(event)

    # сохранение новой обложки на диске
    await write_one_file_on_disc(new_cover_path, new_cover)

    return event


async def toggle_event_active_status(
    db: AsyncSession,
    category: str,
    date: str,
) -> Event:
    """Переключение статуса активности съемки. Если съемка была активной, она становится неактивной, и наоборот."""
    event = await check_event_exists(db, category, date, is_active=False)
    event.active = not event.active

    await db.commit()
    await db.refresh(event)

    return event


async def delete_event_description(
    db: AsyncSession,
    category: str,
    date: str,
) -> Event:
    """Удаление описания съемки. Оно становится не пустой строкой, а null."""
    event = await check_event_exists(db, category, date)
    event.description = None

    await db.commit()
    await db.refresh(event)

    return event
