from datetime import datetime, date as dt_date
from pydantic import BaseModel
from core.schemas.picture import PictureRead


class BaseEvent(BaseModel):
    category_id: int
    date: dt_date
    cover: str
    description: str | None

class EventUpdate(BaseModel):
    date: str | None = None
    description: str | None = None
    category: str | None = None


class EventReadNoPictures(BaseEvent):
    """
    Схема для ответов, не содержащих информацию об
    изображениях, относящихся к съемке
    """

    id: int


class EventRead(BaseEvent):
    """
    Схема для ответов, содержащих полную информацию о съемке
    """

    id: int
    created: datetime
    pictures: list[PictureRead]

 
