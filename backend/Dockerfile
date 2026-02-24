# Этап сборки (builder)
FROM python:3.13-slim AS builder

# Копируем uv в контейнер
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# Настройки uv для оптимизации сборки
ENV UV_LINK_MODE=copy \
    UV_COMPILE_BYTECODE=1 \
    UV_PYTHON_DOWNLOADS=never

WORKDIR /app

# Копируем файлы зависимостей
COPY pyproject.toml uv.lock ./

# Устанавливаем зависимости без dev‑пакетов
RUN uv sync --no-dev --locked --no-editable --no-install-project && uv cache clean

# Копируем исходный код приложения в поддиректорию src
COPY photosite-application/ ./src/

# Этап выполнения (runtime)
FROM python:3.13-slim AS runtime

# Создаём непривилегированного пользователя с явными параметрами
# Для alpine
# RUN addgroup -g 1000 worker && \
#     adduser -D -u 1000 -G worker -h /app -s /bin/sh worker

# Для slim
RUN groupadd -g 1000 worker && \
    useradd -u 1000 -g worker -d /app -s /bin/sh worker

USER worker

WORKDIR /app

# Копируем виртуальное окружение из этапа builder
COPY --from=builder --chown=worker:worker /app/.venv /app/.venv

# Копируем код приложения из этапа builder (из src/)
COPY --from=builder --chown=worker:worker /app/src/ ./

# Настраиваем PATH для использования uv
ENV PATH="/app/.venv/bin:$PATH" \
    PYTHONPATH="/app"

EXPOSE 9000

# Команда запуска приложения
# CMD ["python"]
CMD ["python", "main.py"]
