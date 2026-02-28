"""blog added to categories twice

Revision ID: cb6d9bbab6f1
Revises: 16a1cde3bf47
Create Date: 2026-02-28 16:24:46.666512

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "cb6d9bbab6f1"
down_revision: Union[str, Sequence[str], None] = "16a1cde3bf47"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    op.drop_constraint(
        'check_categoryname_valid',
        'category',
        type_='check'
    )

    op.create_check_constraint(
        constraint_name='check_categoryname_valid',
        table_name='category',
        condition="name IN ('wedding', 'portrait', 'family', 'blog')"
    )

def downgrade():
    # В downgrade() откатываем изменения: удаляем новое ограничение
    op.drop_constraint(
        'check_categoryname_valid',
        'category',
        type_='check'
    )

    # Восстанавливаем старое ограничение с исходным условием
    op.create_check_constraint(
        constraint_name='check_categoryname_valid',
        table_name='category',
        condition="name IN ('wedding', 'portrait', 'family', 'event')"
    )


