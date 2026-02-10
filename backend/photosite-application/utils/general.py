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