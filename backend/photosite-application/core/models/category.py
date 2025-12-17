from enum import Enum
from sqlalchemy import CheckConstraint, String
from sqlalchemy.orm import Mapped, mapped_column
from core.models.base import Base


class CategoryName(Enum):
    WEDDING = "wedding"
    PORTRAIT = "portrait"
    FAMILY = "family"
    EVENT = "event"


class Category(Base):
    __tablename__ = "category"

    name: Mapped[CategoryName] = mapped_column(String(10))

    __table_args__ = (
        CheckConstraint(
            "name in ('wedding', 'portrait', 'family', 'event')",
            name="check_categoryname_valid",
        ),
    )
