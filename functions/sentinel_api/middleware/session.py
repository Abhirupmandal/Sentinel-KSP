"""Session verification middleware for Sentinel-KSP.

Enforces active session validation in Catalyst Data Store, 15-minute sliding inactivity timeout,
and updates LastActivityTime on every authenticated request.
"""

from functools import wraps
from typing import Any, Callable
from flask import g
from core.exceptions import SessionError
from core.logger import get_logger
from services.session_service import session_service

logger = get_logger(__name__)


def require_session(f: Callable[..., Any]) -> Callable[..., Any]:
    """Decorator verifying session activity and enforcing 15-minute sliding timeout.

    Must be applied after @require_auth so g.session_id and g.officer_id are populated.
    Queries the live ActiveSessions table in Catalyst Data Store directly on every request.
    """

    @wraps(f)
    def decorated(*args: Any, **kwargs: Any) -> Any:
        session_id = getattr(g, "session_id", None)
        officer_id = getattr(g, "officer_id", None)

        if not session_id or not officer_id:
            raise SessionError("No active session context found in request")

        # Validate active state in Catalyst Data Store and 15-minute inactivity timeout
        if not session_service.is_session_valid(session_id, timeout_minutes=15):
            logger.warning("Rejected request for session %s: Inactive or timed out (officer=%s)", session_id, officer_id)
            raise SessionError("Session is invalid or has expired due to 15 minutes of inactivity. Please log in again.")

        # Update LastActivityTime in ActiveSessions table on valid request
        session_service.touch_session(session_id)

        return f(*args, **kwargs)

    return decorated
