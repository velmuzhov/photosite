from core.config import settings
from logging_config import setup_logging

workers = 4

worker_class = "uvicorn.workers.UvicornWorker"

bind = f"{settings.run.host}:{settings.run.port}"

timeout = 120

max_requests = 1000
max_requests_jitter = 100


daemon = False

proc_name = "fastapi-gunicorn"
