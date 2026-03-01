from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.models.user import User


async def get_user_by_username(
    db: AsyncSession,
    username: str,
) -> User | None:
    user = await db.scalar(select(User).filter(User.username == username))
    return user
