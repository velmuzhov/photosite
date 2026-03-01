from collections.abc import AsyncGenerator, Sequence
import io
from datetime import date
import time

import pytest
from fastapi import UploadFile
from httpx import Response
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker
from httpx import AsyncClient

from core.models import Category, Event, Picture
from .utils import create_test_category, get_valid_upload_files, add_pictures_for_event


class TestUploadPictures:
    """Тесты загрузки фотографий с созданием нового мероприятия авторизованным админом"""

    @pytest.mark.asyncio
    async def test_upload_pictures_success(
        self,
        authenticated_client: AsyncClient,
        db: AsyncSession,
        mock_settings,
    ):
        """Тестирование успешной загрузки изображений"""
        category_name = "wedding"
        upload_date = "2024-05-20"

        category = await create_test_category(db, category_name)

        files = await get_valid_upload_files(["123.jpg", "456.jpeg", "789.jpeg"])
        cover = (await get_valid_upload_files(["300.jpg"]))[0]
        print(cover)

        form_data = {
            "category": category_name,
            "date": upload_date,
            "event_description": "Тестовая свадьба",
        }

        print("Запрос:", form_data)
        print("Файлы:", [f for f in files])

        response: Response = await authenticated_client.post(
            "/api/v1/pictures/",
            data=form_data,
            files=[("files", (f.filename, f.file, "image/jpeg")) for f in files]
            + [("event_cover", (cover.filename, cover.file, "image/jpeg"))],
        )

        print("Ответ сервера:", response.status_code, response.json())

        assert response.status_code == 201
        result = response.json()
        assert len(result) == 3
        assert "123.jpg" in result
        assert "456.jpeg" in result
        assert "789.jpeg" in result

        event = await db.scalar(
            select(Event)
            .where(Event.date == date.fromisoformat(upload_date))
            .where(Event.category_id == category.id)
        )
        assert event is not None
        assert event.description == "Тестовая свадьба"

        result = await db.scalars(select(Picture).where(Picture.event_id == event.id))
        pics = result.all()
        assert len(pics) == 3
        assert {p.name for p in pics} == {"123.jpg", "456.jpeg", "789.jpeg"}

        date_dir = mock_settings.static.image_dir / category_name / upload_date
        assert (date_dir / "123.jpg").exists()
        assert (date_dir / "456.jpeg").exists()
        assert (date_dir / "789.jpeg").exists()

        cover_file = mock_settings.static.base_image_dir / event.cover
        assert cover_file.exists()

    @pytest.mark.asyncio
    async def test_upload_pictures_no_authorization(
        self,
        client: AsyncClient,
        db: AsyncSession,
    ):
        """Тестирование попытки загрузки изображений неавторизованным пользователем"""
        category_name = "wedding"
        upload_date = "2024-05-22"

        await create_test_category(db, category_name)

        files = await get_valid_upload_files(["123.jpg", "456.jpeg", "789.jpeg"])

        form_data = {
            "category": category_name,
            "date": upload_date,
            "event_description": "Тестовая свадьба",
        }

        response: Response = await client.post(
            "/api/v1/pictures/",
            data=form_data,
            files=[("files", (f.filename, f.file, "image/jpeg")) for f in files],
        )

        assert response.status_code == 401
        assert "Not authenticated" in response.json()["detail"]

    @pytest.mark.asyncio
    async def test_upload_invalid_filename(
        self, authenticated_client: AsyncClient, mock_settings
    ):
        """Тестирование загрузки файлов с неверными именами"""
        file = UploadFile(
            filename="abc.jpg",
            file=io.BytesIO(b"content"),
        )

        cover = UploadFile(
            filename="500.jpg",
            file=io.BytesIO(b"cover content"),
        )

        form_data = {
            "category": "wedding",
            "date": "2024-05-20",
            "event_description": "Некорректное имя файла",
        }

        response: Response = await authenticated_client.post(
            "/api/v1/pictures/",
            data=form_data,
            files=[("files", ("abc.jpg", file.file, "image/jpeg"))]
            + [("event_cover", ("500.jpg", cover.file, "image/jpeg"))],
        )

        assert response.status_code == 400
        assert (
            "неверные имена или расширения файлов" in response.json()["detail"].lower()
        )

    @pytest.mark.asyncio
    async def test_upload_no_files(
        self, authenticated_client: AsyncClient, mock_settings
    ):
        """Тестирование post-запроса без файлов"""
        form_data = {
            "category": "wedding",
            "date": "2024-05-20",
            "event_description": "Без фото",
        }
        response: Response = await authenticated_client.post(
            "/api/v1/pictures/",
            data=form_data,
        )

        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_invalid_category(
        self, authenticated_client: AsyncClient, db: AsyncSession, mock_settings
    ):
        """Тестирование загрузки с неправильной категорией"""
        files = await get_valid_upload_files(["789.jpg"])
        cover = (await get_valid_upload_files(["500.jpg"]))[0]
        form_data = {
            "category": "invalid_category",
            "date": "2024-05-20",
            "event_description": "Некорректная категория",
        }

        response: Response = await authenticated_client.post(
            "/api/v1/pictures/",
            data=form_data,
            files=[("files", (f.filename, f.file, "image/jpeg")) for f in files]
            + [("event_cover", (cover.filename, cover.file, "image/jpeg"))],
        )

        assert response.status_code == 400
        assert "недопустимая категория" in response.json()["detail"].lower()

    @pytest.mark.asyncio
    async def test_invalid_date_format(self, authenticated_client: AsyncClient):
        """Тестирование загрузки с неверным форматом даты"""
        files = await get_valid_upload_files(["111.jpg"])
        cover = (await get_valid_upload_files(["500.jpg"]))[0]
        form_data = {
            "category": "wedding",
            "date": "incorrect_date",
            "event_description": "Ошибка формата даты",
        }

        response: Response = await authenticated_client.post(
            "/api/v1/pictures/",
            data=form_data,
            files=[("files", (f.filename, f.file, "image/jpeg")) for f in files]
            + [("event_cover", (cover.filename, cover.file, "image/jpeg"))],
        )

        assert response.status_code == 400
        assert (
            "дата должна быть в формате yyyy-mm-dd" in response.json()["detail"].lower()
        )

    @pytest.mark.asyncio
    async def test_event_cover_upload(
        self,
        authenticated_client: AsyncClient,
        db: AsyncSession,
        mock_settings,
    ):
        """Тестирование загрузки с обложкой мероприятия"""
        category_name = "portrait"
        upload_date = "2024-06-15"

        category = await create_test_category(db, category_name)
        files = await get_valid_upload_files(["222.jpg"])

        # обложка
        cover_file = UploadFile(
            filename="333.jpg",
            file=io.BytesIO(b"fake cover content"),
        )

        form_data = {
            "category": category_name,
            "date": upload_date,
            "event_description": "С обложкой",
        }

        files_data = [("files", (f.filename, f.file, "image/jpeg")) for f in files]
        files_data.append(("event_cover", ("333.jpg", cover_file.file, "image/jpeg")))

        response: Response = await authenticated_client.post(
            "/api/v1/pictures/",
            data=form_data,
            files=files_data,
        )

        assert response.status_code == 201

        event = await db.scalar(
            select(Event)
            .where(Event.date == date.fromisoformat(upload_date))
            .where(Event.category_id == category.id)
        )
        assert event is not None
        assert event.cover == f"event_covers/{category_name}/{upload_date}/333.jpg"

        cover_path = (
            mock_settings.static.base_image_dir
            / "event_covers"
            / category_name
            / upload_date
            / "333.jpg"
        )
        assert cover_path.exists()

    @pytest.mark.asyncio
    async def test_missing_filename(
        self, authenticated_client: AsyncClient, mock_settings
    ):
        """Тестирование загрузки файлов без имени"""
        file = UploadFile(filename="", file=io.BytesIO(b"content"))

        form_data = {
            "category": "event",
            "date": "2024-08-10",
            "event_description": "Без имени файла",
        }

        response: Response = await authenticated_client.post(
            "/api/v1/pictures/",
            data=form_data,
            files=[("files", ("", file.file, "image/jpeg"))],
        )

        assert response.status_code == 422


class TestGetAllPictures:
    """Тестирование получения всех фотографий админом"""

    @pytest.mark.asyncio
    async def test_get_all_pictures_success(
        self,
        authenticated_client: AsyncClient,
        db: AsyncSession,
    ):
        """Тест: успешный возврат списка фотографий (не пустой)."""
        category = await create_test_category(db, "portrait")
        event = Event(
            date=date(2024, 1, 1),
            description="test event",
            category=category,
            cover="event_covers/portrait/2024-01-01/500.jpg",
        )
        picture_1 = Picture(
            name="1.jpg",
            path="/test/1.jpg",
            event=event,
        )
        picture_2 = Picture(
            name="2.jpg",
            path="/test/2.jpg",
            event=event,
        )

        db.add(event)
        db.add(picture_1)
        db.add(picture_2)
        await db.commit()

        response = await authenticated_client.get("/api/v1/pictures/")

        assert response.status_code == 200

        data: list[dict] = response.json()
        assert len(data) == 2

        print(data)

        assert data[0]["id"] == picture_1.id
        assert data[1]["id"] == picture_2.id

        assert data[0]["name"] == "1.jpg"
        assert data[0]["path"] == "/test/1.jpg"
        assert "event_id" in data[0]

    @pytest.mark.asyncio
    async def test_get_all_pictures_empty(
        self,
        authenticated_client: AsyncClient,
        db: AsyncSession,
    ):
        """Тестирование возврата пустого списка, если фотографий нет."""

        response = await authenticated_client.get("/api/v1/pictures/")

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 0

    @pytest.mark.asyncio
    async def test_get_all_pictures_sorted_by_id(
        self,
        authenticated_client: AsyncClient,
        db: AsyncSession,
    ):
        """Тестирование возврата всех фотографий, отсортированных по возрастанию id."""
        category = await create_test_category(db, "wedding")
        event = Event(
            date=date(2024, 2, 2),
            description="sort event",
            category=category,
            cover="event_covers/wedding/2024-02-02/cover.jpg",
        )

        picture_3 = Picture(name="3.jpg", path="/3.jpg", event=event)
        picture_1 = Picture(name="1.jpg", path="/1.jpg", event=event)
        picture_2 = Picture(name="2.jpg", path="/2.jpg", event=event)

        db.add_all([category, event, picture_3, picture_1, picture_2])
        await db.commit()

        await db.refresh(picture_1)
        await db.refresh(picture_2)
        await db.refresh(picture_3)

        response = await authenticated_client.get("/api/v1/pictures/")
        assert response.status_code == 200

        data = response.json()
        ids = [item["id"] for item in data]
        assert ids == sorted(ids)  # Должно быть [min, ..., max]


class TestDeletePictures:
    """Тесты для удаления фотографий"""

    @pytest.mark.asyncio
    async def test_delete_pictures_success(
        self,
        authenticated_client: AsyncClient,
        db: AsyncSession,
    ):
        """Тестирование успешного удаления нескольких фотографий."""

        category_name, upload_date = await add_pictures_for_event(
            authenticated_client, db, cover="700.jpg"
        )

        file1_path = f"{category_name}/{upload_date}/123.jpg"
        file2_path = f"{category_name}/{upload_date}/456.jpeg"

        res = await db.scalars(select(Picture))

        pics = res.all()
        print([pic.name for pic in pics] if pics else "No pictures in DB")

        await db.commit()

        response = await authenticated_client.request(
            method="DELETE",
            url="/api/v1/pictures/",
            json=[file1_path, file2_path],
        )

        print(response.status_code)
        print(response.json())

        assert response.status_code == 200
        assert "Изображения удалены" in response.json()["message"]

        after_response: Response = await authenticated_client.get(
            "api/v1/pictures/",
        )

        assert len(after_response.json()) == 1
        assert after_response.json()[0]["name"] == "789.jpeg"

    @pytest.mark.asyncio
    async def test_delete_nonexistent_pictures(
        self,
        authenticated_client: AsyncClient,
        db: AsyncSession,
    ):
        """Тест: попытка удалить несуществующие пути — ошибка в CRUD."""

        await add_pictures_for_event(authenticated_client, db, cover="700.jpg")

        await db.commit()

        response = await authenticated_client.request(
            "DELETE",
            "/api/v1/pictures/",
            json=["missing1.jpg", "missing2.jpg"],
        )

        assert response.status_code == 400

    @pytest.mark.asyncio
    async def test_delete_empty_list(
        self,
        authenticated_client: AsyncClient,
        db: AsyncSession,
    ):
        """Тестирование удаления пустого списка файлов. Должен вернуться ответ 422"""

        await add_pictures_for_event(authenticated_client, db, cover="700.jpg")

        response = await authenticated_client.request(
            "DELETE",
            "/api/v1/pictures/",
            json=[],
        )

        print(response.status_code)

        print(response.json())

        assert response.status_code == 422
        assert (
            response.json()["detail"] == "Нужно выбрать хотя бы один файл для удаления"
        )

    @pytest.mark.asyncio
    async def test_delete_with_duplicates(
        self,
        authenticated_client: AsyncClient,
        db: AsyncSession,
        setup_test_static_dir,
    ):
        """Тестирование удаления при указании одного имени несколько раз.
        Должно происходить только одно удаление, исключений вызываться не должно."""
        category_name, upload_date = await add_pictures_for_event(
            authenticated_client,
            db,
            cover="700.jpg",
        )

        files_to_delete = [
            f"{category_name}/{upload_date}/123.jpg",
            f"{category_name}/{upload_date}/123.jpg",
        ]

        response = await authenticated_client.request(
            "DELETE",
            "api/v1/pictures/",
            json=files_to_delete,
        )

        assert response.status_code == 200

        remaining_pictures: Sequence[Picture] = (
            await db.scalars(select(Picture))
        ).all()
        assert len(remaining_pictures) == 2

    @pytest.mark.asyncio
    async def test_delete_unauthorized(
        self,
        client: AsyncClient,  # неаутентифицированный клиент
        db: AsyncSession,
    ):
        """Тест: доступ без авторизации — 401."""

        await add_pictures_for_event(client, db, cover="700.jpg")

        response = await client.request("DELETE", "/api/v1/pictures/", json=["123.jpg"])
        assert response.status_code == 401
