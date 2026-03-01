from typing import Any
from collections.abc import Callable
from fastapi import Request, Response
from sqlalchemy.ext.asyncio import AsyncSession
import hashlib


def events_key_builder(
    func: Callable[..., Any],
    namespace: str = "",
    *,
    request: Request | None = None,
    response: Response | None = None,
    args: tuple[Any, ...],
    kwargs: dict[str, Any],
) -> str:
    """Кастомный создатель ключей в кеше, исключающий из аргументов конечной точки
    экземпляр асинхронной сессии"""
    custom_kwargs = {
        key: value
        for key, value in kwargs.items()
        if not isinstance(value, AsyncSession)
    }

    print(args)
    print(custom_kwargs)

    cache_key = hashlib.md5(
        f"{func.__module__}:{func.__name__}:{args}:{custom_kwargs}".encode()
    ).hexdigest()
    return f"{namespace}:{cache_key}"
