"""Permission engine for Sentinel-KSP RBAC system.

Maps confirmed roles to permission sets and evaluates role-based access.

RBAC Correction Sprint (RX.2) — PRD-Aligned Role-Permission Matrix
====================================================================

This file is the single source of truth for which permissions each role holds.
Every grant below is explicitly justified by the Authentication PRD or Main PRD.
No permission is granted "for convenience."

Least-privilege principle: if a document is ambiguous about whether a role
should hold a permission, the permission is NOT granted.

Documented Ambiguity — SystemAdministrator:
  The Authentication PRD defines this role in the enum but provides no
  permission matrix. This sprint defaults it to an empty permission set.
  If future requirements justify SESSION_VIEW or AUDIT_VIEW for this role,
  they must be added with explicit PRD backing and a change-control note.
"""

from typing import FrozenSet
from constants.permissions import Permission
from constants.roles import Role
from core.logger import get_logger

logger = get_logger(__name__)


# Role-to-Permission Mapping (PRD-aligned, least-privilege)
ROLE_PERMISSIONS: dict[str, FrozenSet[str]] = {

    # ── CyberSecurityAdministrator ───────────────────────────────────────
    # Scope: Identity management, session monitoring, force logout,
    #        password reset, user provisioning, account lifecycle,
    #        emergency access, audit review, security incident handling.
    #
    # Analytics permissions (DASHBOARD_VIEW, GEOSPATIAL_VIEW, LINK_ANALYSIS_VIEW,
    # PREDICTIVE_VIEW, CASE_READ) are granted for full system oversight
    # as the primary administrative role.
    Role.CYBER_SECURITY_ADMINISTRATOR.value: frozenset({
        Permission.OFFICER_CREATE,
        Permission.OFFICER_LOCK,
        Permission.OFFICER_UNLOCK,
        Permission.OFFICER_DISABLE,
        Permission.PASSWORD_RESET,
        Permission.SESSION_FORCE_LOGOUT,
        Permission.SESSION_VIEW,
        Permission.AUDIT_VIEW,
        Permission.EMERGENCY_ACCESS_GRANT,
        Permission.EMERGENCY_ACCESS_END,
        Permission.SECURITY_INCIDENT_VIEW,
        Permission.SECURITY_INCIDENT_RESOLVE,
        Permission.DASHBOARD_VIEW,
        Permission.GEOSPATIAL_VIEW,
        Permission.LINK_ANALYSIS_VIEW,
        Permission.PREDICTIVE_VIEW,
        Permission.CASE_READ,
    }),

    # ── SCRBDataAnalyst ──────────────────────────────────────────────────
    # Scope: Intelligence dashboards, spatiotemporal trend tools,
    #        QuickML/predictive risk modeling panels, case data read/write.
    #
    # CASE_READ + CASE_WRITE: justified by PRD "full read/write access to
    #   intelligence dashboards" — case data is the source for analytics.
    #
    # NOT granted (PRD does not justify):
    #   LINK_ANALYSIS_VIEW — link analysis is investigator-focused per PRD;
    #     analyst scope is dashboards/geospatial/predictive.
    #   All officer admin, session, audit, emergency, security permissions.
    Role.SCRB_DATA_ANALYST.value: frozenset({
        Permission.CASE_READ,
        Permission.CASE_WRITE,
        Permission.DASHBOARD_VIEW,
        Permission.GEOSPATIAL_VIEW,
        Permission.PREDICTIVE_VIEW,
    }),

    # ── FieldInvestigator ────────────────────────────────────────────────
    # Scope: Read-only access to criminological link analysis workspaces,
    #        individual offender profiles, and historical case timelines.
    #
    # NOT granted (PRD does not justify):
    #   CASE_WRITE, DASHBOARD_VIEW, GEOSPATIAL_VIEW, PREDICTIVE_VIEW
    #   All admin/security permissions.
    Role.FIELD_INVESTIGATOR.value: frozenset({
        Permission.CASE_READ,
        Permission.LINK_ANALYSIS_VIEW,
    }),

    # ── CommandSupervisor ────────────────────────────────────────────────
    # Scope: Executive dashboard overviews, statewide KPIs.
    #
    # GEOSPATIAL_VIEW removed: geospatial routes serve analyst-granularity
    #   tools (district drilldowns, hotspot clustering, spike detection),
    #   not executive overviews. If a future executive map route is added,
    #   it should be gated by DASHBOARD_VIEW.
    #
    # NOT granted (PRD does not justify):
    #   GEOSPATIAL_VIEW, LINK_ANALYSIS_VIEW, PREDICTIVE_VIEW, CASE_*
    #   All admin/security permissions.
    Role.COMMAND_SUPERVISOR.value: frozenset({
        Permission.DASHBOARD_VIEW,
    }),

    # ── SystemAdministrator ──────────────────────────────────────────────
    # Scope: Infrastructure monitoring (no business permissions).
    #
    # DOCUMENTED AMBIGUITY: The Authentication PRD defines this role but
    # provides no permission matrix. Defaulting to empty set per
    # least-privilege principle.
    #
    # NOT granted (insufficient PRD justification):
    #   SESSION_VIEW, AUDIT_VIEW — explicitly scoped to
    #   CyberSecurityAdministrator in the Authentication PRD.
    Role.SYSTEM_ADMINISTRATOR.value: frozenset(),
}


def get_permissions_for_role(role: str) -> FrozenSet[str]:
    """Return the permission set for a given role string or Enum.

    Args:
        role: Role string value or Role Enum.

    Returns:
        Frozen set of permission strings. Empty frozenset if role is unknown.
    """
    role_str = role.value if hasattr(role, "value") else str(role)
    return ROLE_PERMISSIONS.get(role_str, frozenset())


def evaluate(role: str, required_permission: str) -> bool:
    """Evaluate whether a role has a specific permission.

    Args:
        role: Role string value or Role Enum.
        required_permission: Permission constant string.

    Returns:
        True if the role grants the permission, False otherwise.
    """
    permissions = get_permissions_for_role(role)
    return required_permission in permissions
