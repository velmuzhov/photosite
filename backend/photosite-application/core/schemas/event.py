from datetime import datetime
from pydantic import BaseModel
from core.schemas.picture import PictureRead


class BaseEvent(BaseModel):
    category_id: int
    date: datetime
    cover: str | None
    description: str | None


class EventCreateOrUpdate(BaseEvent):
    """Схема для создания съемки или обновления
    информации о ней."""

    pass


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
    pictures: list[PictureRead]
