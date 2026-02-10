import pytest
from utils.pictures import check_file_name, check_file_names


class TestCheckFileName:
    """Тесты для функции check_file_name."""

    @pytest.mark.parametrize(
        "filename, expected",
        [
            ("123.jpeg", True),
            ("2525667.jpg", True),
            ("000.jpg", True),
            ("photo.jpg", False),
            ("image.png", False),
            ("document.pdf", False),
            ("no_extension", False),
            ("invalid.name.jpg", False),
            (None, False),
        ],
    )
    def test_check_file_name(self, filename, expected):
        """Проверяет, что функция check_file_name возвращает ожидаемый результат
        для различных входных данных.
        """
        assert check_file_name(filename) == expected
