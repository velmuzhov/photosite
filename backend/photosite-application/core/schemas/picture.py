from datetime import datetime
from pydantic import BaseModel, ConfigDict


class BasePicture(BaseModel):
    pass


class PictureCreate(BasePicture):
    pass


class PictureRead(BasePicture):
    id: int
    uploaded: datetime
    event_id: int
    path: str

    model_config = ConfigDict(
        from_attributes=True,
    )
