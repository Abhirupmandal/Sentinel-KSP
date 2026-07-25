"""Global exception handler middleware for Sentinel-KSP.

Catches all SentinelException subclasses and unhandled errors, converting them
to the standardized API response envelope.
"""

from flask import Flask
from core.exceptions import SentinelException
from core.responses import error_response
from core.logger import get_logger

logger = get_logger(__name__)


def register_exception_handlers(app: Flask) -> None:
    """Register global exception handlers on the Flask app.

    Args:
        app: Flask application instance.
    """

    @app.errorhandler(SentinelException)
    def handle_sentinel_exception(exc: SentinelException):
        """Handle custom Sentinel exceptions."""
        logger.warning("SentinelException: %s (HTTP %d)", exc.message, exc.status_code)
        return error_response(
            errors=exc.errors if exc.errors else [exc.message],
            message=exc.message,
            status_code=exc.status_code,
        )

    @app.errorhandler(404)
    def handle_not_found(exc):
        """Handle 404 Not Found."""
        return error_response(
            errors=["The requested endpoint was not found"],
            message="Endpoint not found",
            status_code=404,
        )

    @app.errorhandler(405)
    def handle_method_not_allowed(exc):
        """Handle 405 Method Not Allowed."""
        return error_response(
            errors=["HTTP method not allowed for this endpoint"],
            message="Method not allowed",
            status_code=405,
        )

    @app.errorhandler(500)
    def handle_internal_error(exc):
        """Handle unhandled 500 Internal Server Error."""
        logger.error("Unhandled server error: %s", exc)
        return error_response(
            errors=["An internal server error occurred"],
            message="Internal server error",
            status_code=500,
        )
