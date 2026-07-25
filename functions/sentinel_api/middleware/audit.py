"""Audit middleware decorator for Sentinel-KSP.

Automatically records audit events around route handlers, capturing
success/failure as Inference.
"""

from functools import wraps
from typing import Any, Callable, Optional
from flask import g, request
from core.device_fingerprint import generate_device_fingerprint, get_client_ip
from core.logger import get_logger
from services.audit_service import audit_service

logger = get_logger(__name__)


def audit_action(
    action: str,
    resource_type: str,
    resource_id_param: Optional[str] = None,
) -> Callable:
    """Decorator that automatically audits a route handler execution.

    Args:
        action: AuditAction string constant.
        resource_type: Resource type string (e.g. "Session", "Officer").
        resource_id_param: Optional URL parameter name to extract resource ID from.

    Returns:
        Decorated function.
    """
    def decorator(f: Callable[..., Any]) -> Callable[..., Any]:
        @wraps(f)
        def decorated(*args: Any, **kwargs: Any) -> Any:
            officer_id = getattr(g, "officer_id", "ANONYMOUS")
            ip_address = get_client_ip(request)
            fingerprint = generate_device_fingerprint(request)
            resource_id = kwargs.get(resource_id_param) if resource_id_param else None
            role = getattr(g, "role", None)

            try:
                result = f(*args, **kwargs)

                audit_service.record(
                    action=action,
                    actor_officer_id=officer_id,
                    resource_type=resource_type,
                    resource_id=resource_id,
                    inference="SUCCESS",
                    ip_address=ip_address,
                    device_fingerprint=fingerprint,
                    extra_metadata={"role": role} if role else None,
                )

                return result
            except Exception as exc:
                audit_service.record(
                    action=action,
                    actor_officer_id=officer_id,
                    resource_type=resource_type,
                    resource_id=resource_id,
                    inference="FAILURE",
                    ip_address=ip_address,
                    device_fingerprint=fingerprint,
                    extra_metadata={"role": role, "error": str(exc)} if role else {"error": str(exc)},
                )
                raise

        return decorated
    return decorator
