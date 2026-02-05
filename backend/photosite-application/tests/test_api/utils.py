import io

from fastapi import UploadFile
from httpx import AsyncClient
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from core.models import Category


async def create_test_category(db: AsyncSession, name: str = "portrait") -> Category:
    """Создает тестовую категорию"""
    existing_category = await db.scalar(select(Category).where(Category.name == name))
    if existing_category:
        return existing_category

    category = Category(name=name)
    db.add(category)
    await db.commit()
    await db.refresh(category)
    return category


async def get_valid_upload_files(filenames: list[str]) -> list[UploadFile]:
    """
    Создаёт список UploadFile с именами, состоящими из цифр и расширением .jpg/.jpeg.
    Поднимает ошибку, если имя не соответствует формату.
    """
    files = []
    for name in filenames:
        if not (name.endswith(".jpg") or name.endswith(".jpeg")):
            raise ValueError(
                f"Имя файла должно иметь расширение .jpg или .jpeg: {name}"
            )
        name_without_ext = name.rsplit(".", 1)[0]
        if not name_without_ext.isdigit():
            raise ValueError(
                f"Имя файла (без расширения) должно состоять только из цифр: {name}"
            )

        content = b"fake image content"
        file = UploadFile(
            filename=name,
            file=io.BytesIO(content),
        )
        files.append(file)
    return files

async def add_pictures_for_event(
        authenticated_client: AsyncClient,
        db: AsyncSession,
        pics: list[str] = ["123.jpg", "456.jpeg", "789.jpeg"],
        category_name: str = "wedding",
        upload_date: str = "2024-05-25",
    ) -> tuple[str, str]:
        """Создает в базе данных мероприятие с фотографиями из списка pics"""

        category: Category = await create_test_category(db, category_name)

        files = await get_valid_upload_files(pics)

        form_data = {
            "category": category.name,
            "date": upload_date,
            "event_description": "Тестовая свадьба",
        }

        await authenticated_client.post(
            "/api/v1/pictures/",
            data=form_data,
            files=[("files", (f.filename, f.file, "image/jpeg")) for f in files],
        )

        

        return category_name, upload_date