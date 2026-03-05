# Этап сборки (builder)
FROM python:3.13-slim AS builder

COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

ENV UV_LINK_MODE=copy \
    UV_COMPILE_BYTECODE=1 \
    UV_PYTHON_DOWNLOADS=never

WORKDIR /app

COPY pyproject.toml uv.lock ./

RUN uv sync --no-dev --locked --no-editable --no-install-project && uv cache clean

COPY photosite-application/ ./src/

FROM python:3.13-slim AS runtime


RUN groupadd -g 1000 worker && \
    useradd -u 1000 -g worker -d /app -s /bin/sh worker

USER worker

WORKDIR /app

COPY --from=builder --chown=worker:worker /app/.venv /app/.venv

COPY --from=builder --chown=worker:worker /app/src/ ./

ENV PATH="/app/.venv/bin:$PATH" \
    PYTHONPATH="/app"

EXPOSE 8000

CMD ["gunicorn", "--config", "gunicorn.conf.py", "wsgi:app"]
