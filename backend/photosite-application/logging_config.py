import os
import logging.config


def setup_logging(env="development"):
    """Конфигурация логирования в зависимости от окружения."""
    log_config = {
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {
            "standard": {
                "format": "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
                "datefmt": "%Y-%m-%d %H:%M:%S",
            },
            "json": {
                "format": '{"timestamp": "%(asctime)s", "level": "%(levelname)s", "logger": "%(name)s", "message": "%(message)s"}',
                "datefmt": "%Y-%m-%dT%H:%M:%S%z",
            },
        },
        "handlers": {
            "console": {
                "class": "logging.StreamHandler",
                "formatter": "standard",
                "level": "INFO",
                "stream": "ext://sys.stdout",
            },
            "file": {
                "class": "logging.FileHandler",
                "formatter": "json",
                "level": "INFO",
                "filename": "app.log",
                "mode": "a",
            },
        },
        "loggers": {
            "": {  # root logger
                "handlers": ["console", "file"],
                "level": "INFO",
                "propagate": False,
            },
            "watchfiles": {
                "level": "WARNING",
                "propagate": False,
            },
        },
    }

    if env == "production":
        log_config["handlers"]["console"]["level"] = "WARNING"
        log_config["handlers"]["file"]["formatter"] = "json"
    else:
        log_config["handlers"]["console"]["level"] = "DEBUG"

    logging.config.dictConfig(log_config)

    # настройка логирования uvicorn и sqlalchemy
    # logging.config.dictConfig(
    #     {
    #         "version": 1,
    #         "disable_existing_loggers": False,
    #         "loggers": {
    #             "uvicorn": {"level": "INFO", "propagate": True},
    #             "sqlalchemy": {"level": "INFO", "propagate": True},
    #         },
    #     }
    # )


env = os.getenv("ENVIRONMENT", "development")
setup_logging(env)

logger = logging.getLogger("app")
