# from unittest.mock import patch


# # отключение кеша для всех тестов до импорта маршрутов
# patch(
#     "fastapi_cache.decorator.cache",
#     lambda *args, **kwargs: lambda f: f
# ).start()