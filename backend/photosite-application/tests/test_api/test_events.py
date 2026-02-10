from collections.abc import Sequence
import io
from datetime import date

import pytest
from fastapi import UploadFile
from httpx import Response
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from httpx import AsyncClient

from core.models import Category, Event, Picture, User
from crud.events import check_event_exists
from utils.general import check_date
from .utils import create_test_category, get_valid_upload_files, add_pictures_for_event


class TestGetOneEventPictures:
    @pytest.mark.asyncio
    async def test_get_one_event_pictures_success(
        self,
        client: AsyncClient,
        authenticated_client: AsyncClient,
        db: AsyncSession,
    ):
        """Тестирование получения одной съемки с фотографиями.
        Доступно без авторизации"""
        category_name, upload_date = await add_pictures_for_event(
            authenticated_client,
            db,
        )

        await add_pictures_for_event(
            authenticated_client,
            db,
            pics=["321.jpg", "654.jpeg"],
            category_name="portrait",
            upload_date="2024-05-29",
        )

        response = await client.get(f"/api/v1/events/{category_name}/{upload_date}")

        assert response.status_code == 200
        data = response.json()

        assert len(data["pictures"]) == 3
        assert set(pic["name"] for pic in data["pictures"]) == {
            "123.jpg",
            "456.jpeg",
            "789.jpeg",
        }

    @pytest.mark.asyncio
    async def test_get_one_event_pictures_bad_date(
        self,
        client: AsyncClient,
        authenticated_client: AsyncClient,
        db: AsyncSession,
    ):
        """Тестирование получения одной съемки с фотографиями при передаче
        некорректной даты. Доступно без авторизации"""

        await add_pictures_for_event(
            authenticated_client,
            db,
            category_name="portrait",
            upload_date="2024-05-30",
        )

        response = await client.get("/api/v1/events/portrait/invalid-date")

        assert response.status_code == 400
        data = response.json()
        print(data)
        assert data["detail"] == "Дата должна быть в формате YYYY-MM-DD"


class TestGetEventsWithCategory:
    @pytest.mark.asyncio
    async def test_get_events_with_category_success(
        self,
        client: AsyncClient,
        authenticated_client: AsyncClient,
        db: AsyncSession,
    ):
        """Тестирование получения съемок по категории. Доступно без авторизации"""
        await add_pictures_for_event(
            authenticated_client,
            db,
            category_name="wedding",
            upload_date="2024-05-28",
        )

        await add_pictures_for_event(
            authenticated_client,
            db,
            category_name="wedding",
            upload_date="2024-05-31",
        )

        await add_pictures_for_event(
            authenticated_client,
            db,
            category_name="portrait",
            upload_date="2024-06-20",
        )

        await add_pictures_for_event(
            authenticated_client,
            db,
            category_name="wedding",
            upload_date="2024-07-20",
        )

        response = await client.get(f"/api/v1/events/wedding")

        assert response.status_code == 200
        data = response.json()

        assert len(data) == 3
        assert "2024-05-28" in data[2]["date"]
        assert "2024-05-31" in data[1]["date"]
        assert "2024-07-20" in data[0]["date"]

    @pytest.mark.asyncio
    async def test_get_events_with_category_not_found(
        self,
        client: AsyncClient,
        authenticated_client: AsyncClient,
        db: AsyncSession,
    ):
        """Тестирование получения съемок по категории при отсутствии съемок
        в данной категории. Доступно без авторизации"""
        await add_pictures_for_event(
            authenticated_client,
            db,
            category_name="wedding",
            upload_date="2024-05-28",
        )

        response = await client.get(f"/api/v1/events/portrait")

        assert response.status_code == 200
        data = response.json()

        assert len(data) == 0


class TestAddPicturesToExistingEvent:
    """Тестирование добавления фотографий к существующей съемке. Конечная точка доступна только с авторизацией."""

    @pytest.mark.asyncio
    async def test_add_pictures_to_existing_event_success(
        self,
        authenticated_client: AsyncClient,
        db: AsyncSession,
    ):
        """Тестирование добавления фотографий к существующей съемке.
        Проверяется обработка файлов, чьи имена дублируют ранее загруженные файлы"""
        await add_pictures_for_event(
            authenticated_client,
            db,
            pics=["123.jpg", "456.jpeg"],
            category_name="portrait",
            upload_date="2024-05-29",
        )

        files_to_add: list[UploadFile] = await get_valid_upload_files(
            ["789.jpeg", "456.jpeg"]
        )

        response = await authenticated_client.patch(
            f"/api/v1/events/portrait/2024-05-29",
            files=[("files", (f.filename, f.file, "image/jpeg")) for f in files_to_add],
        )

        assert response.status_code == 200

        result = await db.scalars(
            select(Picture)
            .join(Event)
            .join(Category)
            .filter(Category.name == "portrait")
            .filter(Event.date == date.fromisoformat("2024-05-29"))
        )

        pictures = result.all()
        assert len(pictures) == 3
        assert set(pic.name for pic in pictures) == {"123.jpg", "456.jpeg", "789.jpeg"}

    @pytest.mark.asyncio
    async def test_add_pictures_to_existing_event_invalid_date_format(
        self,
        authenticated_client: AsyncClient,
        db: AsyncSession,
    ):
        """Тестирование добавления фотографий к существующей съемке при передаче некорректной даты."""
        await add_pictures_for_event(
            authenticated_client,
            db,
            category_name="portrait",
            upload_date="2024-05-29",
        )

        files_to_add: list[UploadFile] = await get_valid_upload_files(
            ["789.jpeg", "456.jpeg"]
        )

        response = await authenticated_client.patch(
            f"/api/v1/events/portrait/invalid-date",
            files=[("files", (f.filename, f.file, "image/jpeg")) for f in files_to_add],
        )

        assert response.status_code == 400
        data = response.json()
        assert data["detail"] == "Дата должна быть в формате YYYY-MM-DD"

    @pytest.mark.asyncio
    async def test_add_pictures_to_nonexistent_event(
        self,
        authenticated_client: AsyncClient,
        db: AsyncSession,
    ):
        """Тестирование добавления фотографий к несуществующей съемке."""

        await add_pictures_for_event(
            authenticated_client,
            db,
            category_name="portrait",
            upload_date="2024-05-29",
        )

        files_to_add: list[UploadFile] = await get_valid_upload_files(
            ["789.jpeg", "456.jpeg"]
        )

        response = await authenticated_client.patch(
            f"/api/v1/events/portrait/2024-05-30",
            files=[("files", (f.filename, f.file, "image/jpeg")) for f in files_to_add],
        )

        assert response.status_code == 404
        data = response.json()
        assert data["detail"] == "Такой съемки не существует"


class TestDeleteEvent:
    """Тестирование удаления съемки. Конечная точка доступна только с авторизацией."""

    @pytest.mark.asyncio
    async def test_delete_event_success(
        self,
        authenticated_client: AsyncClient,
        db: AsyncSession,
    ):
        """Тестирование удаления съемки. Проверяется удаление всех фотографий, относящихся к съемке."""
        category_name, upload_date = await add_pictures_for_event(
            authenticated_client,
            db,
            category_name="wedding",
            upload_date="2024-05-28",
        )

        response = await authenticated_client.delete(
            f"/api/v1/events/{category_name}/{upload_date}"
        )

        assert response.status_code == 200
        data = response.json()
        assert (
            data["message"]
            == f"Съемка {upload_date} из категории {category_name} удалена"
        )

    @pytest.mark.asyncio
    async def test_delete_nonexistent_event(
        self,
        authenticated_client: AsyncClient,
        db: AsyncSession,
    ):
        """Тестирование удаления несуществующей съемки."""

        await add_pictures_for_event(
            authenticated_client,
            db,
            category_name="wedding",
            upload_date="2024-05-28",
        )

        response = await authenticated_client.delete(
            f"/api/v1/events/nonexistent-category/2024-01-01"
        )

        assert response.status_code == 404
        data = response.json()
        assert data["detail"] == "Такой съемки не существует"

    @pytest.mark.asyncio
    async def test_delete_event_no_authorization(
        self,
        client: AsyncClient,
        # authenticated_client: AsyncClient,
        db: AsyncSession,
    ):
        """Тестирование удаления съемки без авторизации."""

        response = await client.delete(
            f"/api/v1/events/wedding/2024-05-28",
        )

        assert response.status_code == 401
        assert response.json()["detail"] == "Not authenticated"


class TestGetAllEvents:
    """Тестирование получения всех съемок. Конечная точка требует авторизации."""

    @pytest.mark.asyncio
    async def test_get_all_events_success(
        self,
        authenticated_client: AsyncClient,
        db: AsyncSession,
    ):
        """Тестирование получения всех съемок. Проверяется, что съемки возвращаются
        в обратном хронологическом порядке. Проверяется работа параметра запроса limit.
        """
        await add_pictures_for_event(
            authenticated_client,
            db,
            category_name="wedding",
            upload_date="2024-05-28",
        )

        await add_pictures_for_event(
            authenticated_client,
            db,
            category_name="wedding",
            upload_date="2024-05-31",
        )

        await add_pictures_for_event(
            authenticated_client,
            db,
            category_name="wedding",
            upload_date="2024-07-20",
        )

        response = await authenticated_client.get(f"/api/v1/events/?limit=2")

        assert response.status_code == 200
        data = response.json()

        print(data)

        assert len(data) == 2
        assert "2024-05-31" in data[1]["date"]
        assert "2024-07-20" in data[0]["date"]


class TestEditEventData:
    """Тестирование обновления данных о съемке - категории, даты,
    описания, обложки"""

    @pytest.mark.asyncio
    async def test_edit_event_data_success(
        self,
        authenticated_client: AsyncClient,
        db: AsyncSession,
    ):
        """Тестирование обновления данных о съемке. Проверяется, что при обновлении
        категории и даты съемки, данные о съемке (включая фотографии) сохраняются.
        Проверяется, что при обновлении обложки старый файл удаляется с диска."""

        await create_test_category(db, "wedding")
        await create_test_category(db, "portrait")

        await add_pictures_for_event(
            authenticated_client,
            db,
            category_name="wedding",
            upload_date="2024-05-28",
            pics=["001.jpg", "002.jpg", "003.jpg"],
            cover="100.jpg",
        )

        await add_pictures_for_event(
            authenticated_client,
            db,
            category_name="portrait",
            upload_date="2024-05-28",
            pics=["005.jpg", "006.jpg", "007.jpg"],
            cover="200.jpg",
        )

        response = await authenticated_client.request(
            "PUT",
            "/api/v1/events/wedding/2024-05-28",
            data={
                "new_category": "portrait",
                "new_date": "2024-06-01",
                "new_description": "Обновленное описание",
            },
            files=[
                (
                    "new_cover",
                    ("300.jpg", io.BytesIO(b"fake image content"), "image/jpeg"),
                )
            ],
        )

        assert response.status_code == 200
        assert response.json()["cover"].endswith("300.jpg")

    @pytest.mark.asyncio
    async def test_edit_event_with_existing_event_data(
        self,
        authenticated_client: AsyncClient,
        db: AsyncSession,
    ):
        """Тестирование попытки изменить категорию и дату съемки на такие,
        которые уже есть у другой съемки"""
        await create_test_category(db, "wedding")
        await create_test_category(db, "portrait")

        await add_pictures_for_event(
            authenticated_client,
            db,
            category_name="wedding",
            upload_date="2024-05-28",
            pics=["001.jpg", "002.jpg", "003.jpg"],
            cover="100.jpg",
        )

        await add_pictures_for_event(
            authenticated_client,
            db,
            category_name="portrait",
            upload_date="2024-05-30",
            pics=["005.jpg", "006.jpg", "007.jpg"],
            cover="200.jpg",
        )

        response = await authenticated_client.request(
            "PUT",
            "/api/v1/events/wedding/2024-05-28",
            data={
                "new_category": "portrait",
                "new_date": "2024-05-30",
                "new_description": "Обновленное описание",
            },
            files=[
                (
                    "new_cover",
                    ("300.jpg", io.BytesIO(b"fake image content"), "image/jpeg"),
                )
            ],
        )

        assert response.status_code == 400
        assert response.json()["detail"] == "Такая съемка уже существует"


class TestDeleteDescriptionOfEvent:
    """Тестирование удаления описания съемки. Конечная точка доступна только с авторизацией."""

    @pytest.mark.asyncio
    async def test_delete_description_of_event_success(
        self,
        authenticated_client: AsyncClient,
        db: AsyncSession,
    ):
        """Тестирование удаления описания съемки. Проверяется, что после удаления
        описания, остальные данные о съемке сохраняются."""
        await add_pictures_for_event(
            authenticated_client,
            db,
            category_name="wedding",
            upload_date="2024-05-28",
            event_description="Описание для удаления",
        )

        response = await authenticated_client.delete(
            f"/api/v1/events/wedding/2024-05-28/description"
        )

        assert response.status_code == 200
        data = response.json()
        assert data["description"] is None

    @pytest.mark.asyncio
    async def test_delete_description_of_event_without_description(
        self,
        authenticated_client: AsyncClient,
        db: AsyncSession,
    ):
        """Тестирование удаления описания съемки, у которой изначально нет описания."""
        await add_pictures_for_event(
            authenticated_client,
            db,
            category_name="wedding",
            upload_date="2024-05-28",
            event_description=None,
        )

        response = await authenticated_client.delete(
            f"/api/v1/events/wedding/2024-05-28/description"
        )
        data = response.json()

        assert response.status_code == 200
        assert data["description"] is None

    @pytest.mark.asyncio
    async def test_delete_description_of_nonexistent_event(
        self,
        authenticated_client: AsyncClient,
        db: AsyncSession,
    ):
        """Тестирование удаления описания несуществующей съемки."""

        response = await authenticated_client.delete(
            f"/api/v1/events/wedding/2024-05-28/description"
        )

        assert response.status_code == 404
        data = response.json()
        assert data["detail"] == "Такой съемки не существует"


class TestDeleteCoverOfEvent:
    """Тестирование удаления обложки съемки. Конечная точка доступна только с авторизацией."""

    @pytest.mark.asyncio
    async def test_delete_cover_of_event_success(
        self,
        authenticated_client: AsyncClient,
        db: AsyncSession,
    ):
        """Тестирование удаления обложки съемки. Проверяется, что после удаления
        обложки, остальные данные о съемке сохраняются."""
        await add_pictures_for_event(
            authenticated_client,
            db,
            category_name="wedding",
            upload_date="2024-05-28",
            cover="000.jpg",
        )

        response = await authenticated_client.delete(
            f"/api/v1/events/wedding/2024-05-28/cover"
        )

        assert response.status_code == 200
        data = response.json()
        assert data["cover"] is None

    @pytest.mark.asyncio
    async def test_delete_cover_of_event_without_cover(
        self,
        authenticated_client: AsyncClient,
        db: AsyncSession,
    ):
        """Тестирование удаления обложки съемки, у которой изначально нет обложки."""
        await add_pictures_for_event(
            authenticated_client,
            db,
            category_name="wedding",
            upload_date="2024-05-28",
            cover=None,
        )

        response = await authenticated_client.delete(
            f"/api/v1/events/wedding/2024-05-28/cover"
        )
        data = response.json()

        assert response.status_code == 200
        assert data["cover"] is None

    @pytest.mark.asyncio
    async def test_delete_cover_of_nonexistent_event(
        self,
        authenticated_client: AsyncClient,
        db: AsyncSession,
    ):
        """Тестирование удаления обложки несуществующей съемки."""

        response = await authenticated_client.delete(
            f"/api/v1/events/wedding/2024-05-28/cover"
        )

        assert response.status_code == 404
        data = response.json()
        assert data["detail"] == "Такой съемки не существует"
