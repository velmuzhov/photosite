from collections.abc import AsyncGenerator
import shutil
from pathlib import Path
from typing import AsyncGenerator
from unittest.mock import patch


from fastapi_cache import FastAPICache
from fastapi_cache.backends.inmemory import InMemoryBackend

import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    create_async_engine,
    AsyncEngine,
    async_sessionmaker,
)

from core.models import Base, Category, Event, Picture, User
from core.config import settings
from core.models import db_helper
from utils.authorization import get_current_user
from main import main_app

# Временная папка для картинок
TEST_STATIC_DIR = Path(__file__).parent.parent.resolve() / "test_static" / "images"


# Тестовая БД
TEST_DB_URL = "sqlite+aiosqlite:///:memory:"

# Движок для тестов
engine: AsyncEngine = create_async_engine(
    TEST_DB_URL,
    echo=False,
)

AsyncSessionLocal: async_sessionmaker[AsyncSession] = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


@pytest_asyncio.fixture(autouse=True)
async def setup_db():
    """Создаёт таблицы перед каждым тестом, очищает после.
    База данных создается заново для каждого теста.
    """
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.commit()
    await engine.dispose()


@pytest_asyncio.fixture
async def db() -> AsyncGenerator[AsyncSession, None]:
    """Фикстура для сессии БД."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            if session.is_active:
                await session.rollback()
            await session.close()

@pytest_asyncio.fixture
async def client(db: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """Фикстура HTTP‑клиента с переопределённой зависимостью db."""

    async def override_get_db() -> AsyncSession:
        return db

    main_app.dependency_overrides[db_helper.session_getter] = override_get_db

    transport = ASGITransport(app=main_app)

    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

    main_app.dependency_overrides.clear()


@pytest.fixture
def test_user() -> User:
    """Создание пользователя для тестов"""
    return User(
        id=1,
        username="testuser",
        hashed_password="fakehash",
    )


@pytest_asyncio.fixture
async def authenticated_client(client: AsyncClient, test_user: User, db: AsyncSession):
    """Клиент с авторизованным пользователем."""

    db.add(test_user)
    await db.commit()

    async def override_get_current_user():
        return test_user

    main_app.dependency_overrides[get_current_user] = override_get_current_user

    yield client

    main_app.dependency_overrides.clear()

    await db.delete(test_user)
    await db.commit()


@pytest.fixture(autouse=True)
def setup_test_static_dir():
    """Создаёт и безопасно очищает тестовую статическую директорию."""
    TEST_STATIC_DIR.mkdir(parents=True, exist_ok=True)

    yield

    if TEST_STATIC_DIR.exists():
        try:
            shutil.rmtree(TEST_STATIC_DIR, ignore_errors=True)
        except Exception as e:
            print(f"Ошибка: не удалось удалить {TEST_STATIC_DIR}: {e}")


@pytest.fixture(autouse=True)
def mock_settings():
    """Переопределяет settings для тестов (указываем test_static)."""
    original = settings.static.image_dir
    settings.static.image_dir = TEST_STATIC_DIR
    yield settings
    settings.static.image_dir = original

@pytest_asyncio.fixture(autouse=True)
async def init_test_cache():
    FastAPICache.init(InMemoryBackend(), prefix="test-")
    yield
    FastAPICache.reset()  # очищает кеш после теста
