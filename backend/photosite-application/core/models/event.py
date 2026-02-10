from typing import TYPE_CHECKING
from datetime import date, datetime
from sqlalchemy import ForeignKey, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from core.models.base import Base

if TYPE_CHECKING:
    from core.models.category import Category
    from core.models.picture import Picture

class Event(Base):
    __tablename__ = "event"

    date: Mapped[date]
    category_id: Mapped[int] = mapped_column(ForeignKey(
        column="category.id",
    ))
    cover: Mapped[str | None]
    description: Mapped[str | None]
    created: Mapped[datetime] = mapped_column(
        default=datetime.now,
        server_default=func.now(),
    )


    __table_args__ = (
        UniqueConstraint("date", "category_id"),
    )

    category: Mapped["Category"] = relationship("Category", back_populates="events")

    pictures: Mapped[list["Picture"]] = relationship("Picture", back_populates="event")

