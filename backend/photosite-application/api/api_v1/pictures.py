from typing import Annotated
from fastapi import APIRouter, Depends, UploadFile, File, Form
from fastapi_cache.decorator import cache
from fastapi_cache import FastAPICache
from sqlalchemy.ext.asyncio import AsyncSession
from core.config import settings
from core.schemas.picture import PictureCreate, PictureRead
from core.models import db_helper
from core.models.user import User
from utils.authorization import get_current_user
from crud import pictures as pictures_crud

router = APIRouter(
    prefix=settings.api.v1.pictures,
    tags=[
        "pictures",
    ],
)

# тип для аннотирования асинхронной сессии в конечных точках
get_async_db = Annotated[AsyncSession, Depends(db_helper.session_getter)]


@router.get("/", response_model=list[PictureRead])
@cache(expire=60*60*3)
async def get_all_pictures(db: get_async_db):
    """Получение всех фотографий, отсортированных по id"""
    return await pictures_crud.get_all_pictures(db)


@router.post("/")
async def upload_pictures_operation(
    user: Annotated[User, Depends(get_current_user)],
    db: get_async_db,
    files: Annotated[list[UploadFile], File()],
    category: Annotated[str, Form()],
    date: Annotated[str, Form()],
    event_cover: Annotated[UploadFile | None, Form()],
    event_description: Annotated[str, Form()],
):
    # await FastAPICache.clear()
    return await pictures_crud.upload_pictures(
        db,
        files,
        category,
        date,
        event_cover,
        event_description,
    )


@router.delete("/")
async def delete_pictures_operation(
    db: get_async_db,
    pictures: list[str],
) -> dict[str, str]:
    await pictures_crud.delete_pictures(db, pictures)
    return {"message": f"Изображения удалены"}
