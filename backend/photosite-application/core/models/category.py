from typing import TYPE_CHECKING
from enum import Enum
from sqlalchemy import CheckConstraint, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from core.models.base import Base

if TYPE_CHECKING:
    from core.models.event import Event


class CategoryName(Enum):
    WEDDING = "wedding"
    PORTRAIT = "portrait"
    FAMILY = "family"
    BLOG = "blog"


class Category(Base):
    __tablename__ = "category"

    name: Mapped[CategoryName] = mapped_column(String(10), unique=True)

    events: Mapped[list["Event"]] = relationship("Event", back_populates="category")

    __table_args__ = (
        CheckConstraint(
            "name in ('wedding', 'portrait', 'family', 'blog')",
            name="check_categoryname_valid",
        ),
    )
