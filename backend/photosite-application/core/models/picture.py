from typing import TYPE_CHECKING
from datetime import datetime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import ForeignKey, func
from .base import Base

if TYPE_CHECKING:
    from core.models.event import Event


class Picture(Base):
    """Модель для хранения отдельной фотографии"""

    __tablename__ = "picture"

    name: Mapped[str]
    path: Mapped[str] = mapped_column(unique=True)
    uploaded: Mapped[datetime] = mapped_column(
        default=datetime.now,
        server_default=func.now(),
    )
    event_id: Mapped[int] = mapped_column(ForeignKey("event.id", ondelete="CASCADE"))

    event: Mapped["Event"] = relationship("Event", back_populates="pictures")
