"""Department constants for Sentinel-KSP Officers table.

Defines standard Karnataka State Police department names for Officers.Department.
"""

from enum import Enum


class Department(str, Enum):
    """Enumeration of Karnataka State Police departments."""

    CYBER_CRIME = "Cyber Crime"
    CRIME_BRANCH = "Crime Branch"
    LAW_AND_ORDER = "Law & Order"
    SPECIAL_BRANCH = "Special Branch"
    INTERNAL_SECURITY = "Internal Security Division"
    SCRB_ANALYTICS = "State Crime Records Bureau"
    TRAFFIC = "Traffic Division"

    @classmethod
    def has_value(cls, value: str) -> bool:
        """Check if a string value exists in this enum."""
        return value in cls._value2member_map_
