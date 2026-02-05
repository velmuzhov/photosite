"""unique file_paths constraint added

Revision ID: 73cd496f2fc6
Revises: 0a08638dcb71
Create Date: 2026-02-05 17:00:12.195872

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "73cd496f2fc6"
down_revision: Union[str, Sequence[str], None] = "0a08638dcb71"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_unique_constraint(op.f("uq_picture_path"), "picture", ["path"])


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_constraint(op.f("uq_picture_path"), "picture", type_="unique")
