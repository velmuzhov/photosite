from collections.abc import Sequence
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from core.models.picture import Picture

async def get_all_pictures(session: AsyncSession) -> Sequence[Picture]:
    result = await session.scalars(select(Picture).order_by(Picture.id))
    return result.all()