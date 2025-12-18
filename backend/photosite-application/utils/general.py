from datetime import datetime
from fastapi import HTTPException, status


def check_date(date: str) -> datetime:
    """Проверяет допустимость ввода даты в форме
    и возвращает объект datetime, связанный с этой датой
    """
    try:
        date_obj = datetime.strptime(date, "%Y-%m-%d")
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Дата должна быть в формате YYYY-MM-DD",
        )
    return date_obj
