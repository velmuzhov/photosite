import pytest
from datetime import date as dt_date, datetime, timedelta, timezone
from fastapi import HTTPException, status

from utils.general import check_date, now_utc


class TestCheckDate:
    """Тесты для функции check_date,
    которая проверяет допустимость ввода даты в форме
    и возвращает объект date, связанный с этой датой"""

    @pytest.mark.parametrize(
        "input_date, expected",
        [
            ("2023-01-01", dt_date(2023, 1, 1)),
            ("2024-12-31", dt_date(2024, 12, 31)),
        ],
    )
    def test_check_date_valid(self, input_date, expected):
        assert check_date(input_date) == expected

    @pytest.mark.parametrize(
        "input_date",
        [
            "2023/01/01",
            "01-01-2023",
            "2023-13-01",
            "2023-00-10",
            "invalid-date",
        ],
    )
    def test_check_date_invalid(self, input_date):
        with pytest.raises(HTTPException) as exc_info:
            check_date(input_date)
        assert exc_info.value.status_code == status.HTTP_400_BAD_REQUEST
        assert exc_info.value.detail == "Дата должна быть в формате YYYY-MM-DD"

class TestNowUTC:
    """Тесты для функции now_utc,
    которая возвращает текущую дату и время в UTC"""

    def test_now_utc(self):
        result = now_utc()
        assert isinstance(result, datetime)
        assert result.tzinfo is not None
        assert result.tzinfo.utcoffset(result) == timedelta(0)

    def test_now_utc_current_time(self):
        result = now_utc()
        current_utc_time = datetime.now(timezone.utc)
        assert abs((result - current_utc_time).total_seconds()) < 10
