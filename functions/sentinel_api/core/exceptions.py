"""Central exception hierarchy for Sentinel-KSP.

Defines custom exception classes carrying HTTP status codes and structured
error details for standardized API response handling.
"""

from typing import Any, Dict, List, Optional


class SentinelException(Exception):
    """Base exception class for all Sentinel-KSP custom errors."""

    def __init__(
        self,
        message: str = "An unexpected system error occurred",
        status_code: int = 500,
        errors: Optional[List[Dict[str, Any]]] = None,
    ) -> None:
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.errors = errors or []

    def to_dict(self) -> Dict[str, Any]:
        """Convert exception to dictionary representation."""
        return {
            "success": False,
            "message": self.message,
            "data": {},
            "errors": self.errors,
        }


class ValidationError(SentinelException):
    """Raised when request payload or parameter validation fails (HTTP 400)."""

    def __init__(
        self,
        message: str = "Invalid request parameters",
        errors: Optional[List[Dict[str, Any]]] = None,
    ) -> None:
        super().__init__(message=message, status_code=400, errors=errors)


class AuthenticationError(SentinelException):
    """Raised when authentication credentials or JWT verification fails (HTTP 401)."""

    def __init__(
        self,
        message: str = "Authentication failed",
        errors: Optional[List[Dict[str, Any]]] = None,
    ) -> None:
        super().__init__(message=message, status_code=401, errors=errors)


class AuthorizationError(SentinelException):
    """Raised when authenticated user lacks required permissions or role (HTTP 403)."""

    def __init__(
        self,
        message: str = "Insufficient permissions to perform this action",
        errors: Optional[List[Dict[str, Any]]] = None,
    ) -> None:
        super().__init__(message=message, status_code=403, errors=errors)


class SessionError(SentinelException):
    """Raised when a user session is invalid, expired, or deactivated (HTTP 401)."""

    def __init__(
        self,
        message: str = "Session is invalid or expired",
        errors: Optional[List[Dict[str, Any]]] = None,
    ) -> None:
        super().__init__(message=message, status_code=401, errors=errors)


class ConcurrentSessionError(SessionError):
    """Raised when an active session already exists for an officer on login attempt (HTTP 409)."""

    def __init__(
        self,
        message: str = "Officer already has an active session. Concurrent logins are prohibited.",
        errors: Optional[List[Dict[str, Any]]] = None,
    ) -> None:
        super().__init__(message=message, errors=errors)
        self.status_code = 409


class AccountStateError(SentinelException):
    """Raised when officer account state prevents authentication or action (HTTP 403)."""

    def __init__(
        self,
        message: str = "Account state does not permit this operation",
        errors: Optional[List[Dict[str, Any]]] = None,
    ) -> None:
        super().__init__(message=message, status_code=403, errors=errors)


class NotFoundError(SentinelException):
    """Raised when a requested database resource is not found (HTTP 404)."""

    def __init__(
        self,
        message: str = "Requested resource was not found",
        errors: Optional[List[Dict[str, Any]]] = None,
    ) -> None:
        super().__init__(message=message, status_code=404, errors=errors)


class CatalystError(SentinelException):
    """Raised when an underlying Zoho Catalyst SDK or ZCQL operation fails (HTTP 502)."""

    def __init__(
        self,
        message: str = "Zoho Catalyst service error",
        errors: Optional[List[Dict[str, Any]]] = None,
    ) -> None:
        super().__init__(message=message, status_code=502, errors=errors)
