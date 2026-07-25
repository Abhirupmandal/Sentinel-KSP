"""Incident type constants for SecurityIncidents table.

Defines standard security incident category strings for SecurityIncidents.IncidentType.
"""

from enum import Enum


class IncidentType(str, Enum):
    """Enumeration of security incident categories."""

    MULTIPLE_FAILED_LOGINS = "MULTIPLE_FAILED_LOGINS"
    CONCURRENT_SESSION_ATTEMPT = "CONCURRENT_SESSION_ATTEMPT"
    UNAUTHORIZED_RESOURCE_ACCESS = "UNAUTHORIZED_RESOURCE_ACCESS"
    EXPIRED_SESSION_REUSE = "EXPIRED_SESSION_REUSE"
    ANOMALOUS_IP_LOCATION = "ANOMALOUS_IP_LOCATION"
    EMERGENCY_ACCESS_MISUSE = "EMERGENCY_ACCESS_MISUSE"
    SUSPICIOUS_DATA_EXFILTRATION = "SUSPICIOUS_DATA_EXFILTRATION"

    @classmethod
    def has_value(cls, value: str) -> bool:
        """Check if a string value exists in this enum."""
        return value in cls._value2member_map_
