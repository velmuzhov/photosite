from passlib.context import CryptContext
from fastapi.security import OAuth2PasswordBearer
from datetime import datetime, timedelta, timezone
import jwt
from fastapi import Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.config import settings
from core.models.db_helper import db_helper
from core.models import User

from exceptions.user import credential_exception, token_expire_exception

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="users/token")


def hash_password(password: str) -> str:
    """Преобразует пароль в хеш с помощью bcrypt"""
    return pwd_context.hash(password)


def verify_password(
    plain_password: str,
    hashed_password: str,
) -> bool:
    """Проверяет соответствие введенного пароля хешу"""
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: dict) -> str:
    """Создает JWT-токен с payload (sub, id, exp)"""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=int(settings.auth.access_token_expires_minutes)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(
        payload=to_encode,
        key=settings.auth.secret_key,
        algorithm=settings.auth.algorithm,
    )


def create_refresh_token(data: dict) -> str:
    """Создает рефреш-токен с длительным сроком действия"""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(
        days=settings.auth.refresh_token_expire_days
    )
    to_encode.update({"exp": expire})
    return jwt.encode(
        payload=to_encode,
        key=settings.auth.secret_key,
        algorithm=settings.auth.algorithm,
    )


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(db_helper.session_getter),
):
    """Проверяет JWT-токен и возвращает пользователя из базы"""
    try:
        payload = jwt.decode(
            jwt=token,
            key=settings.auth.secret_key,
            algorithms=[
                settings.auth.algorithm,
            ],
        )
        username: str = payload.get("sub")
        if username is None:
            raise credential_exception
    except jwt.ExpiredSignatureError:
        raise token_expire_exception
    except jwt.PyJWTError:
        raise credential_exception

    user = await db.scalar(select(User).filter(User.username == username))
    if user is None:
        raise credential_exception
    return user
