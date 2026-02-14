from typing import Annotated
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status
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
# @cache(expire=60 * 60 * 3)
async def get_all_pictures_sorted_by_id(
    user: Annotated[User, Depends(get_current_user)],
    db: get_async_db,
):
    """Получение всех фотографий, отсортированных по id"""
    return await pictures_crud.get_all_pictures(db)


@router.post("/", status_code=status.HTTP_201_CREATED)
async def upload_pictures_operation(
    user: Annotated[User, Depends(get_current_user)],
    db: get_async_db,
    files: Annotated[list[UploadFile], File()],
    category: Annotated[str, Form()],
    date: Annotated[str, Form()],
    event_cover: Annotated[UploadFile, Form()],
    event_description: Annotated[str | None, Form()] = None,
):
    await FastAPICache.clear()
    return await pictures_crud.upload_pictures(
        db,
        files,
        category,
        date,
        event_cover,
        event_description,
    )


@router.delete("/", status_code=status.HTTP_200_OK)
async def delete_pictures_operation(
    user: Annotated[User, Depends(get_current_user)],
    db: get_async_db,
    pictures: Annotated[list[str], Form()],
) -> dict[str, str]:
    try:
        await pictures_crud.delete_pictures(db, pictures)
        return {"message": f"Изображения удалены"}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
