"""Authentication middleware for Sentinel-KSP.

Verifies incoming JWT authorization headers, validates claims, checks account lifecycle state,
and populates Flask request context globals (g.officer_id, g.session_id, g.role, g.officer).
"""

from functools import wraps
from typing import Any, Callable
from flask import g, request
from constants.account_states import AccountState
from core.exceptions import AccountStateError, AuthenticationError
from core.jwt_manager import JWTManager
from core.logger import get_logger
from repositories.officer_repository import officer_repository

logger = get_logger(__name__)


def require_auth(f: Callable[..., Any]) -> Callable[..., Any]:
    """Decorator requiring valid JWT authentication for Flask endpoints.

    Decodes JWT, verifies signature/expiry, populates g.officer_id, g.session_id,
    g.role, and g.officer directly from Catalyst Data Store.
    """

    @wraps(f)
    def decorated(*args: Any, **kwargs: Any) -> Any:
        auth_header = request.headers.get("Authorization")
        if not auth_header:
            raise AuthenticationError("Authorization header is missing")

        # Verify token signature, expiry, and extract payload claims
        payload = JWTManager.verify_token(auth_header)

        officer_id = payload.get("sub")
        session_id = payload.get("sid")
        role = payload.get("role")

        if not officer_id or not session_id:
            raise AuthenticationError("Malformed JWT claims: missing sub or sid")

        # Attach context to Flask request global
        g.officer_id = officer_id
        g.session_id = session_id
        g.role = role

        # Fetch officer details directly from Catalyst Data Store
        officer = officer_repository.get_by_officer_id(officer_id)
        if not officer:
            raise AuthenticationError("Authenticated officer account no longer exists in Catalyst Data Store")

        # Verify account state is not locked or disabled
        account_state = officer.get("AccountState", AccountState.ACTIVE.value)
        disallowed_states = {AccountState.LOCKED.value, AccountState.DISABLED.value, AccountState.RETIRED.value}
        if account_state in disallowed_states:
            raise AccountStateError(
                f"Account access restricted. Current state: '{account_state}'. Contact your administrator."
            )

        g.officer = officer

        return f(*args, **kwargs)

    return decorated
