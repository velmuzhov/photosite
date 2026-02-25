from datetime import datetime, date as dt_date
from pydantic import BaseModel, Field, field_validator
from core.schemas.picture import PictureRead
from core.schemas.category import CategoryEventRead



class DescriptionValidatorMixin:
    @field_validator("description")
    def validate_description(cls, value):
        if value is not None and len(value) == 0:
            raise ValueError("Описание не может быть пустой строкой")
        return value

class BaseEvent(BaseModel, DescriptionValidatorMixin):
    category_id: int
    date: dt_date
    cover: str
    description: str | None
    created: datetime
    active: bool


class EventDescriptionUpdate(BaseModel, DescriptionValidatorMixin):
    description: str


class EventReadNoPictures(BaseEvent):
    """
    Схема для ответов, не содержащих информацию об
    изображениях, относящихся к съемке
    """

    id: int

class EventReadWithCategoryName(EventReadNoPictures):
    category: CategoryEventRead

class EventRead(BaseEvent):
    """
    Схема для ответов, содержащих полную информацию о съемке
    """

    id: int
    pictures: list[PictureRead]

class EventList(BaseModel):
    total_count: int
    events: list[EventReadNoPictures]

