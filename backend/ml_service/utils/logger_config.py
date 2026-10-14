"""Configure loguru logger for the ML service."""

import os
import sys
from loguru import logger


def configure_logger():
    logger.remove()

    log_level = os.getenv("LOG_LEVEL", "INFO").upper()
    log_dir = os.getenv("LOG_DIR", "logs")
    os.makedirs(log_dir, exist_ok=True)

    # Console
    logger.add(
        sys.stdout,
        level=log_level,
        format="<green>{time:HH:mm:ss}</green> | <level>{level: <8}</level> | {message}",
        colorize=True,
    )

    # File — daily rotation, 30-day retention
    logger.add(
        os.path.join(log_dir, "ml_service_{time:YYYY-MM-DD}.log"),
        rotation="00:00",
        retention="30 days",
        compression="zip",
        level="DEBUG",
        format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {name}:{line} | {message}",
    )

    logger.info(f"Logger configured | level={log_level}")
