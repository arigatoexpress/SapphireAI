"""Centralised structured logging configuration for Cloud Trader services."""

from __future__ import annotations

import logging
import sys
from typing import Optional

import structlog


_CONFIGURED = False


def configure_logging(level: Optional[str] = None) -> None:
    """Initialise structured logging using structlog and the logging module."""

    global _CONFIGURED
    if _CONFIGURED:
        return

    log_level = level.upper() if level else "INFO"

    logging.basicConfig(
        level=getattr(logging, log_level, logging.INFO),
        format="%(message)s",
        stream=sys.stdout,
    )

    structlog.configure(
        processors=[
            structlog.processors.TimeStamper(fmt="iso", utc=True),
            structlog.processors.add_log_level,
            structlog.processors.StackInfoRenderer(),
            structlog.processors.dict_tracebacks,
            structlog.processors.JSONRenderer(),
        ],
        wrapper_class=structlog.make_filtering_bound_logger(getattr(logging, log_level, logging.INFO)),
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        cache_logger_on_first_use=True,
    )

    _CONFIGURED = True


__all__ = ["configure_logging"]


