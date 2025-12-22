from pydantic import BaseModel, SecretStr, Field


class BaseUser(BaseModel):
    username: str


class UserCreate(BaseUser):
    password: SecretStr = Field(min_length=8, description="Пароль (минимум 8 символов)")


class UserRead(BaseUser):
    id: int
