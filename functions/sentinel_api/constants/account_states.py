"""Account states constants for Sentinel-KSP Officers table.

Defines the allowed account lifecycle states for an Officer account.
"""

from enum import Enum


class AccountState(str, Enum):
    """Enumeration of Officer account lifecycle states."""

    PENDING = "Pending"
    ACTIVE = "Active"
    LOGGED_OUT = "LoggedOut"
    EXPIRED = "Expired"
    LOCKED = "Locked"
    DISABLED = "Disabled"
    RETIRED = "Retired"
    UNDER_INVESTIGATION = "UnderInvestigation"

    @classmethod
    def has_value(cls, value: str) -> bool:
        """Check if a string value exists in this enum."""
        return value in cls._value2member_map_
