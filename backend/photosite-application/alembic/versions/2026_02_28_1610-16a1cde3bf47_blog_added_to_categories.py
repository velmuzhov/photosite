"""blog added to categories

Revision ID: 16a1cde3bf47
Revises: 1027af858626
Create Date: 2026-02-28 16:10:17.378831

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "16a1cde3bf47"
down_revision: Union[str, Sequence[str], None] = "1027af858626"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


from alembic import op
import sqlalchemy as sa

def upgrade():
    # Удаляем старое CHECK CONSTRAINT с точным именем из первой миграции
    op.drop_constraint(
        'ck_category_check_categoryname_valid',  # точное имя из первой миграции
        'category',                               # имя таблицы
        type_='check'                          # тип ограничения
    )

    # Создаём новое CHECK CONSTRAINT с тем же именем, но обновлённым условием
    op.create_check_constraint(
        constraint_name='ck_category_check_categoryname_valid',  # сохраняем оригинальное имя
        table_name='category',                                     # имя таблицы
        condition="name IN ('wedding', 'portrait', 'family', 'blog')"  # новое условие
    )

def downgrade():
    # В downgrade() откатываем изменения: удаляем новое ограничение
    op.drop_constraint(
        'ck_category_check_categoryname_valid',
        'category',
        type_='check'
    )

    # Восстанавливаем старое ограничение с исходным условием
    op.create_check_constraint(
        constraint_name='ck_category_check_categoryname_valid',
        table_name='category',
        condition="name IN ('wedding', 'portrait', 'family', 'event')"  # исходное условие
    )

