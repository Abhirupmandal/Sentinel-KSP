"""Structured JSON logger setup for Sentinel-KSP.

Provides JSON-formatted log output for cloud log aggregators (e.g. Zoho Catalyst Logs)
and local development debugging.
"""

import json
import logging
import os
import sys
from datetime import datetime, timezone


class JSONFormatter(logging.Formatter):
    """Custom log formatter that outputs structured JSON strings."""

    def format(self, record: logging.LogRecord) -> str:
        """Format Python log record into structured JSON."""
        log_entry = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
            "message": record.getMessage(),
        }

        # Include exception info if present
        if record.exc_info:
            log_entry["exception"] = self.formatException(record.exc_info)

        # Include custom extra fields if attached
        if hasattr(record, "extra_fields") and isinstance(record.extra_fields, dict):
            log_entry["context"] = record.extra_fields

        return json.dumps(log_entry)


def get_logger(name: str) -> logging.Logger:
    """Configure and return a structured logger for a given module name.

    Args:
        name: Name of the module requesting logger (usually __name__).

    Returns:
        Configured Logger instance.
    """
    logger = logging.getLogger(name)

    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        log_format = os.getenv("LOG_FORMAT", "json").lower()

        if log_format == "json":
            handler.setFormatter(JSONFormatter())
        else:
            handler.setFormatter(
                logging.Formatter(
                    "%(asctime)s [%(levelname)s] %(name)s (%(filename)s:%(lineno)d): %(message)s"
                )
            )

        logger.addHandler(handler)
        logger.setLevel(os.getenv("LOG_LEVEL", "INFO").upper())
        logger.propagate = False

    return logger
