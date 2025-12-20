"""fields cover and description added to event model

Revision ID: ef301fc06c5c
Revises: 1f8fbb63789f
Create Date: 2025-12-20 10:01:24.779095

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "ef301fc06c5c"
down_revision: Union[str, Sequence[str], None] = "1f8fbb63789f"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_unique_constraint(op.f("uq_category_name"), "category", ["name"])
    op.add_column("event", sa.Column("cover", sa.String(), nullable=True))
    op.add_column(
        "event", sa.Column("description", sa.String(), nullable=True)
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column("event", "description")
    op.drop_column("event", "cover")
    op.drop_constraint(op.f("uq_category_name"), "category", type_="unique")
