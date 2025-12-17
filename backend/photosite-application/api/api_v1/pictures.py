from typing import Annotated
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from core.config import settings
from core.schemas.picture import PictureCreate, PictureRead
from core.models import db_helper
from crud import pictures as pictures_crud

router = APIRouter(
    prefix=settings.api.v1.users,
    tags=[
        "users",
    ],
)

# тип для аннотирования асинхронной сессии в конечных точках
get_async_db = Annotated[AsyncSession, Depends(db_helper.session_getter)]


@router.get("/", response_model=list[PictureRead])
async def get_all_pictures(db: get_async_db):
    """Получение всех фотографий, отсортированных по id"""
    return await pictures_crud.get_all_pictures(db)
