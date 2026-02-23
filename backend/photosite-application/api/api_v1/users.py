from typing import Annotated
from fastapi import APIRouter, Depends, Header
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
import jwt

from core.config import settings
from crud import users as users_crud
from core.models.db_helper import db_helper
from core.models.user import User
from core.schemas.user import UserCreate, UserRead
from utils.authorization import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    get_current_user,
)
from exceptions.user import incorrect_username_or_password, username_already_exists


get_async_db = Annotated[AsyncSession, Depends(db_helper.session_getter)]

router = APIRouter(
    prefix=settings.api.v1.users,
    tags=[
        "Users",
    ],
)


# не должно быть в продакшене
# @router.post("/", response_model=UserRead)
# async def create_user(
#     db: get_async_db,
#     user: UserCreate,
# ):
#     """Создает нового пользователя. Закомментировать после публикации"""
#     return await users_crud.create_user_with_username_and_password(db, user)


@router.post("/token")
async def login(
    db: get_async_db,
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
):
    """Конечная точка для авторизации. Создает access- и refresh-токены"""
    user = await users_crud.get_user_by_username(db, form_data.username)
    if user is None or not verify_password(form_data.password, user.hashed_password):
        raise incorrect_username_or_password
    
    access_token = create_access_token(
        data={
            "sub": user.username,
            "id": user.id,
        }
    )
    refresh_token = create_refresh_token(
        data={
            "sub": user.username,
            "id": user.id,
        }
    )

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
    }


@router.post("/token/refresh")
async def refresh_access_token(
    db: get_async_db,
    refresh_token: Annotated[str, Header(alias="Authorization")],
):
    """
    Конечная точка для обновления access- и refresh-токенов.
    Принимает refresh-токен в заголовке Authorization: Bearer <token>
    Возвращает новые access_token и refresh_token.
    """
    # Убираем префикс "Bearer " из заголовка
    if refresh_token.startswith("Bearer "):
        refresh_token = refresh_token[7:]

    user = await get_current_user(refresh_token, db)

    access_token = create_access_token(
        data={
            "sub": user.username,
            "id": user.id,
        }
    )
    refresh_token = create_refresh_token(
        data={
            "sub": user.username,
            "id": user.id,
        }
    )
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
    }


# удалить после тестирования
# @router.get("/", response_model=list[UserRead])
# async def get_all_users(db: get_async_db):
#     """Выводит всех пользователей. Должна работать
#     только на этапе разработки"""
#     result = await db.scalars(select(User))
#     return result.all()
