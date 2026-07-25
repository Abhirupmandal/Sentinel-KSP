"""Permission string constants for Sentinel-KSP RBAC system.

Defines the canonical set of 18 granular permission strings used across
all authorization checks. These constants are consumed by:
  - core/permissions.py   (role-to-permission mapping)
  - middleware/rbac.py     (@require_permission decorator)
  - route files            (decorator arguments)

PRD Traceability:
  - Officer Admin      → Authentication PRD §4.2 (Admin Account Lifecycle)
  - Session Management → Authentication PRD §3.3 (Concurrent Session Control)
  - Audit & Security   → Authentication PRD §5.1 (Audit Trail & Compliance)
  - Case Management    → Main PRD §2.1 (Intelligence Data Access)
  - Analytics          → Main PRD §2.2–2.5 (Dashboard, Geospatial, Link Analysis, Predictive)
"""


class Permission:
    """Permission string constants.

    Each constant is a unique capability token. Roles are mapped to subsets
    of these tokens in core/permissions.py. The mapping follows the
    least-privilege principle: a role only receives a permission if the PRD
    explicitly justifies it.
    """

    # ── Officer Administration ───────────────────────────────────────────
    # Granted to: CyberSecurityAdministrator
    OFFICER_CREATE = "OFFICER_CREATE"
    OFFICER_LOCK = "OFFICER_LOCK"
    OFFICER_UNLOCK = "OFFICER_UNLOCK"
    OFFICER_DISABLE = "OFFICER_DISABLE"
    PASSWORD_RESET = "PASSWORD_RESET"

    # ── Session Management ───────────────────────────────────────────────
    # SESSION_FORCE_LOGOUT: CyberSecurityAdministrator
    # SESSION_VIEW:         CyberSecurityAdministrator
    SESSION_FORCE_LOGOUT = "SESSION_FORCE_LOGOUT"
    SESSION_VIEW = "SESSION_VIEW"

    # ── Audit & Security ─────────────────────────────────────────────────
    # All granted to: CyberSecurityAdministrator
    AUDIT_VIEW = "AUDIT_VIEW"
    EMERGENCY_ACCESS_GRANT = "EMERGENCY_ACCESS_GRANT"
    EMERGENCY_ACCESS_END = "EMERGENCY_ACCESS_END"
    SECURITY_INCIDENT_VIEW = "SECURITY_INCIDENT_VIEW"
    SECURITY_INCIDENT_RESOLVE = "SECURITY_INCIDENT_RESOLVE"

    # ── Case Management ──────────────────────────────────────────────────
    # CASE_READ:  SCRBDataAnalyst, FieldInvestigator
    # CASE_WRITE: SCRBDataAnalyst
    CASE_READ = "CASE_READ"
    CASE_WRITE = "CASE_WRITE"

    # ── Analytics & Dashboards ───────────────────────────────────────────
    # DASHBOARD_VIEW:      SCRBDataAnalyst, CommandSupervisor
    # GEOSPATIAL_VIEW:     SCRBDataAnalyst
    # LINK_ANALYSIS_VIEW:  FieldInvestigator
    # PREDICTIVE_VIEW:     SCRBDataAnalyst
    DASHBOARD_VIEW = "DASHBOARD_VIEW"
    GEOSPATIAL_VIEW = "GEOSPATIAL_VIEW"
    LINK_ANALYSIS_VIEW = "LINK_ANALYSIS_VIEW"
    PREDICTIVE_VIEW = "PREDICTIVE_VIEW"
