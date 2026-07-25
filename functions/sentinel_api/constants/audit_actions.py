"""Audit action string constants for Sentinel-KSP AuditLogs table.

Defines the exact action string constants stored in AuditLogs.Action column.
"""

from enum import Enum


class AuditAction(str, Enum):
    """Enumeration of audit action strings for AuditLogs.Action."""

    LOGIN = "LOGIN"
    LOGOUT = "LOGOUT"
    LOGIN_FAILED = "LOGIN_FAILED"
    OFFICER_CREATE = "OFFICER_CREATE"
    OFFICER_LOCK = "OFFICER_LOCK"
    OFFICER_UNLOCK = "OFFICER_UNLOCK"
    OFFICER_DISABLE = "OFFICER_DISABLE"
    PASSWORD_RESET = "PASSWORD_RESET"
    FORCE_LOGOUT = "FORCE_LOGOUT"
    SESSION_EXPIRED = "SESSION_EXPIRED"
    EMERGENCY_ACCESS_GRANTED = "EMERGENCY_ACCESS_GRANTED"
    EMERGENCY_ACCESS_ENDED = "EMERGENCY_ACCESS_ENDED"
    CASE_READ = "CASE_READ"
    CASE_MODIFY = "CASE_MODIFY"
    DASHBOARD_ACCESS = "DASHBOARD_ACCESS"
    REPORT_EXPORT = "REPORT_EXPORT"
    ADMIN_ACTION = "ADMIN_ACTION"

    @classmethod
    def has_value(cls, value: str) -> bool:
        """Check if a string value exists in this enum."""
        return value in cls._value2member_map_
