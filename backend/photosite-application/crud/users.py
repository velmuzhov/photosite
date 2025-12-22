from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import Depends

from core.models.user import User
from core.schemas.user import UserCreate
from utils.authorization import hash_password
from exceptions.user import incorrect_username_or_password, username_already_exists


async def get_user_by_username(
    db: AsyncSession,
    username: str,
) -> User | None:
    user = await db.scalar(select(User).filter(User.username == username))
    return user


async def create_user_with_username_and_password(
    db: AsyncSession,
    user: UserCreate,
) -> User:
    existing_user = await get_user_by_username(db, user.username)
    if existing_user:
        raise username_already_exists
    db_user = User(
        username=user.username,
        hashed_password=hash_password(user.password.get_secret_value()),
    )
    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)

    return db_user
