"""Logging configuration using loguru."""

import sys
from pathlib import Path

from loguru import logger

from app.config import settings


def setup_logging() -> None:
    """
    Configure loguru logging based on environment.

    Development: Colorful console output with DEBUG level
    Production: JSON logs with rotation and INFO level
    """
    # Remove default handler
    logger.remove()

    # Development configuration
    if settings.ENVIRONMENT == "development":
        logger.add(
            sys.stderr,
            format=(
                "<green>{time:YYYY-MM-DD HH:mm:ss.SSS}</green> | "
                "<level>{level: <8}</level> | "
                "<cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - "
                "<level>{message}</level>"
            ),
            level=settings.LOG_LEVEL,
            colorize=True,
            backtrace=True,
            diagnose=True,
        )

    # Production configuration
    elif settings.ENVIRONMENT == "production":
        # Create logs directory
        log_dir = Path("logs")
        log_dir.mkdir(exist_ok=True)

        # JSON logs with rotation
        logger.add(
            log_dir / "app.log",
            format="{time:YYYY-MM-DD HH:mm:ss.SSS} | {level: <8} | {name}:{function}:{line} - {message}",
            level=settings.LOG_LEVEL,
            rotation="500 MB",  # Rotate when file reaches 500MB
            retention="10 days",  # Keep logs for 10 days
            compression="zip",  # Compress old logs
            serialize=False,  # Plain text (change to True for JSON)
            backtrace=True,
            diagnose=False,  # Don't expose sensitive info in prod
        )

        # Error logs in separate file
        logger.add(
            log_dir / "error.log",
            format="{time:YYYY-MM-DD HH:mm:ss.SSS} | {level: <8} | {name}:{function}:{line} - {message}",
            level="ERROR",
            rotation="100 MB",
            retention="30 days",
            compression="zip",
            backtrace=True,
            diagnose=True,  # Full traceback for errors
        )

    # Testing configuration
    elif settings.ENVIRONMENT == "testing":
        logger.add(
            sys.stderr,
            format="<level>{level: <8}</level> | {message}",
            level="WARNING",  # Only warnings and errors in tests
            colorize=False,
        )

    logger.info(f"Logging configured for {settings.ENVIRONMENT} environment")


def get_logger(name: str):
    """
    Get a logger instance for a specific module.

    Args:
        name: Module name (usually __name__)

    Returns:
        Logger instance

    Usage:
        from app.logging_config import get_logger
        logger = get_logger(__name__)
        logger.info("Hello from module")
    """
    return logger.bind(name=name)
