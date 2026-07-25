"""Role constants for Sentinel-KSP Officers table.

Defines the exact 5 role strings stored in the Officers.Role column
in Zoho Catalyst Data Store.

These are the ONLY valid roles in the system. No additional roles may be
invented without explicit PRD amendment and change-control approval.

PRD Traceability:
  - Authentication PRD §2.1 defines the role enum.
  - Main PRD §3.1 defines role-scoped access intent.
"""

from enum import Enum


class Role(str, Enum):
    """Enumeration of the 5 confirmed Sentinel-KSP user roles.

    Role semantics (PRD-aligned):
      CyberSecurityAdministrator — Identity, session, audit, and security management.
      SCRBDataAnalyst            — Intelligence dashboards, geospatial, and predictive analytics.
      FieldInvestigator          — Read-only case and link-analysis access.
      CommandSupervisor          — Executive dashboard overview access.
      SystemAdministrator        — Infrastructure role (minimal/no business permissions).
    """

    CYBER_SECURITY_ADMINISTRATOR = "CyberSecurityAdministrator"
    SCRB_DATA_ANALYST = "SCRBDataAnalyst"
    FIELD_INVESTIGATOR = "FieldInvestigator"
    COMMAND_SUPERVISOR = "CommandSupervisor"
    SYSTEM_ADMINISTRATOR = "SystemAdministrator"

    @classmethod
    def has_value(cls, value: str) -> bool:
        """Check if a string value exists in this enum."""
        return value in cls._value2member_map_
