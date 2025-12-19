from datetime import datetime
from pydantic import BaseModel
from core.schemas.picture import PictureRead

class BaseEvent(BaseModel):
    category_id: int
    date: datetime

class EventRead(BaseEvent):
    id: int
    pictures: list[PictureRead]