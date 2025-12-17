from datetime import datetime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import ForeignKey, func
from .base import Base


class Picture(Base):
    """Модель для хранения отдельной фотографии"""

    __tablename__ = "picture"

    uploaded: Mapped[datetime] = mapped_column(
        default=datetime.now,
        server_default=func.now(),
    )
