FROM python:3.13.7-slim AS builder

COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /app

COPY pyproject.toml uv.lock ./

RUN uv venv && uv sync --frozen --no-dev --no-install-project

FROM python:3.13.7-slim

WORKDIR /app

COPY --from=builder /app/.venv /venv/.venv

# COPY ./photosite-application .

ENV PATH="/venv/.venv/bin:$PATH"

EXPOSE 8000

CMD ["python", "main.py"]