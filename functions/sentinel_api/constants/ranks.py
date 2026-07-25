"""Rank constants for Sentinel-KSP Officers table.

Defines standard Karnataka State Police officer ranks for Officers.Rank.
"""

from enum import Enum


class Rank(str, Enum):
    """Enumeration of Karnataka State Police ranks."""

    DG_IGP = "Director General & Inspector General of Police"
    ADGP = "Additional Director General of Police"
    IGP = "Inspector General of Police"
    DIGP = "Deputy Inspector General of Police"
    SP = "Superintendent of Police"
    DSP = "Deputy Superintendent of Police"
    INSPECTOR = "Police Inspector"
    PSI = "Police Sub-Inspector"
    ASI = "Assistant Sub-Inspector"
    HEAD_CONSTABLE = "Head Constable"
    CONSTABLE = "Police Constable"
    DATA_ANALYST = "Senior Data Analyst"
    CYBER_ADMIN = "Cyber Security Administrator"

    @classmethod
    def has_value(cls, value: str) -> bool:
        """Check if a string value exists in this enum."""
        return value in cls._value2member_map_
