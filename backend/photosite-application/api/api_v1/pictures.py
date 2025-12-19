from typing import Annotated
from fastapi import APIRouter, Depends, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from core.config import settings
from core.schemas.picture import PictureCreate, PictureRead
from core.models import db_helper
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
async def get_all_pictures(db: get_async_db):
    """Получение всех фотографий, отсортированных по id"""
    return await pictures_crud.get_all_pictures(db)


@router.post("/")
async def upload_pictures_operation(
    db: get_async_db,
    files: Annotated[list[UploadFile], File()],
    category: Annotated[str, Form()],
    date: Annotated[str, Form()],
):
    return await pictures_crud.upload_pictures(db, files, category, date)
