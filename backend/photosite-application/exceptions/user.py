from fastapi import HTTPException, status

credential_exception = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Невозможно валидировать данные для авторизации",
    headers={"WWW-Authenticate": "Bearer"},
)

token_expire_exception = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Истек срок действия токена",
    headers={"WWW-Authenticate": "Bearer"},
)

incorrect_username_or_password = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Неправильное имя пользователя или пароль",
    headers={"WWW-Authenticate": "Bearer"},
)

username_already_exists = HTTPException(
    status_code=status.HTTP_409_CONFLICT,
    detail="Пользователь с таким именем уже зарегистрирован",
)