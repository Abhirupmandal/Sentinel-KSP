"""RBAC middleware decorators for Sentinel-KSP.

Provides two server-side authorization decorators:

  @require_role(*roles)        — Direct role-exclusivity gate.
                                  Use when a route is reserved for specific
                                  roles regardless of permissions (e.g., all
                                  /api/admin/* routes → CyberSecurityAdministrator).

  @require_permission(*perms)  — Permission-based gate evaluated against the
                                  role-permission matrix in core/permissions.py.
                                  Use when access is capability-driven and may
                                  span multiple roles (e.g., DASHBOARD_VIEW is
                                  held by SCRBDataAnalyst and CommandSupervisor).

Decorator stacking order (outermost → innermost):
  @require_auth          — Decode JWT, verify officer exists and is active.
  @require_session       — Verify session is active and within 15-min timeout.
  @require_role / @require_permission — Authorize the request.

Security contract:
  - These decorators are the PRIMARY enforcement mechanism for RBAC.
  - Frontend route gating is convenience UX only; backend is source of truth.
  - No route may rely on ad-hoc role checks in business logic if middleware
    can enforce it centrally.
"""

from functools import wraps
from typing import Any, Callable
from flask import g
from core.exceptions import AuthorizationError
from core.permissions import evaluate
from core.logger import get_logger

logger = get_logger(__name__)


def require_role(*allowed_roles: str) -> Callable:
    """Decorator restricting endpoint access to specific roles.

    Use this for role-exclusive routes where access is determined by identity
    rather than capability (e.g., admin-only endpoints).

    Args:
        *allowed_roles: Role string values (or Role Enum members) that are allowed.

    Returns:
        Decorated function that raises AuthorizationError if the officer's
        role is not in the allowed set.
    """
    def decorator(f: Callable[..., Any]) -> Callable[..., Any]:
        @wraps(f)
        def decorated(*args: Any, **kwargs: Any) -> Any:
            current_role = getattr(g, "role", None)

            # Normalize enum objects to string if needed
            if hasattr(current_role, "value"):
                current_role = current_role.value

            normalized_allowed = [
                r.value if hasattr(r, "value") else str(r) for r in allowed_roles
            ]

            if not current_role or current_role not in normalized_allowed:
                logger.warning(
                    "RBAC role check failed: officer=%s role=%s required=%s",
                    getattr(g, "officer_id", "unknown"),
                    current_role,
                    normalized_allowed,
                )
                raise AuthorizationError(
                    f"Access denied. Required role(s): {', '.join(normalized_allowed)}"
                )
            return f(*args, **kwargs)
        return decorated
    return decorator


def require_permission(*required_permissions: str) -> Callable:
    """Decorator restricting endpoint access to officers with specific permissions.

    Use this for capability-driven routes where multiple roles may hold the
    required permission (e.g., DASHBOARD_VIEW routes accessible to both
    SCRBDataAnalyst and CommandSupervisor).

    All specified permissions must be held — this is an AND check.

    Args:
        *required_permissions: Permission constant strings that are ALL required.

    Returns:
        Decorated function that raises AuthorizationError if the officer's
        role lacks any of the required permissions.
    """
    def decorator(f: Callable[..., Any]) -> Callable[..., Any]:
        @wraps(f)
        def decorated(*args: Any, **kwargs: Any) -> Any:
            current_role = getattr(g, "role", None)
            if hasattr(current_role, "value"):
                current_role = current_role.value

            if not current_role:
                raise AuthorizationError("No role context found for authorization")

            for perm in required_permissions:
                if not evaluate(current_role, perm):
                    logger.warning(
                        "RBAC permission check failed: officer=%s role=%s missing=%s",
                        getattr(g, "officer_id", "unknown"),
                        current_role,
                        perm,
                    )
                    raise AuthorizationError(
                        f"Access denied. Missing permission: {perm}"
                    )
            return f(*args, **kwargs)
        return decorated
    return decorator
