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

from core.models import Category, Event, Picture
from .utils import create_test_category, get_valid_upload_files, add_pictures_for_event


class TestGetOneEventPictures:
    @pytest.mark.asyncio
    async def test_get_one_event_pictures(
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
