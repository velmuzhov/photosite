import pathlib
import shutil
from datetime import datetime, timezone, date as dt_date
from fastapi import HTTPException, status


def check_date(date: str) -> dt_date:
    """Проверяет допустимость ввода даты в форме
    и возвращает объект datetime, связанный с этой датой
    """
    try:
        date_obj: dt_date = dt_date.fromisoformat(date)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Дата должна быть в формате YYYY-MM-DD",
        )
    return date_obj

def now_utc() -> datetime:
    """Возвращает текущую дату и время в UTC"""
    return datetime.now(timezone.utc)

def move_files(old_dir: pathlib.Path, new_dir: pathlib.Path, delete_old: bool = True) -> None:
    """Перемещает содержимое из старой директории в новую.
    Если новая директория не существует, она создается.
    По умолчанию, старая папка рекурсивно удаляется"""
    new_dir.mkdir(parents=True, exist_ok=True)
    for item in old_dir.iterdir():
        shutil.copy2(item, new_dir / item.name)
    if delete_old:
        shutil.rmtree(old_dir, ignore_errors=True)
