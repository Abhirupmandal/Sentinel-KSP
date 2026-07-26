/**
 * Frontend Permission Mirror for Sentinel-KSP RBAC System.
 * 
 * Exact static mirror of backend core/permissions.py ROLE_PERMISSIONS mapping.
 * Used for client-side UX navigation filtering and conditional UI component rendering.
 * 
 * NOTE: This is for UX convenience only. Backend remains the authoritative source of truth.
 */

export const Roles = {
  CYBER_SECURITY_ADMINISTRATOR: 'CyberSecurityAdministrator',
  SCRB_DATA_ANALYST: 'SCRBDataAnalyst',
  FIELD_INVESTIGATOR: 'FieldInvestigator',
  COMMAND_SUPERVISOR: 'CommandSupervisor',
  SYSTEM_ADMINISTRATOR: 'SystemAdministrator',
};

export const Permissions = {
  // Case Management
  CASE_READ: 'CASE_READ',
  CASE_WRITE: 'CASE_WRITE',

  // Officer Admin
  OFFICER_CREATE: 'OFFICER_CREATE',
  OFFICER_LOCK: 'OFFICER_LOCK',
  OFFICER_UNLOCK: 'OFFICER_UNLOCK',
  OFFICER_DISABLE: 'OFFICER_DISABLE',
  PASSWORD_RESET: 'PASSWORD_RESET',

  // Session Management
  SESSION_FORCE_LOGOUT: 'SESSION_FORCE_LOGOUT',
  SESSION_VIEW: 'SESSION_VIEW',

  // Audit & Security
  AUDIT_VIEW: 'AUDIT_VIEW',
  EMERGENCY_ACCESS_GRANT: 'EMERGENCY_ACCESS_GRANT',
  EMERGENCY_ACCESS_END: 'EMERGENCY_ACCESS_END',
  SECURITY_INCIDENT_VIEW: 'SECURITY_INCIDENT_VIEW',
  SECURITY_INCIDENT_RESOLVE: 'SECURITY_INCIDENT_RESOLVE',

  // Analytics & Dashboards
  DASHBOARD_VIEW: 'DASHBOARD_VIEW',
  GEOSPATIAL_VIEW: 'GEOSPATIAL_VIEW',
  LINK_ANALYSIS_VIEW: 'LINK_ANALYSIS_VIEW',
  PREDICTIVE_VIEW: 'PREDICTIVE_VIEW',
};

/**
 * Exact mirror of backend ROLE_PERMISSIONS dict in core/permissions.py
 */
export const ROLE_PERMISSIONS = {
  [Roles.CYBER_SECURITY_ADMINISTRATOR]: new Set([
    Permissions.OFFICER_CREATE,
    Permissions.OFFICER_LOCK,
    Permissions.OFFICER_UNLOCK,
    Permissions.OFFICER_DISABLE,
    Permissions.PASSWORD_RESET,
    Permissions.SESSION_FORCE_LOGOUT,
    Permissions.SESSION_VIEW,
    Permissions.AUDIT_VIEW,
    Permissions.EMERGENCY_ACCESS_GRANT,
    Permissions.EMERGENCY_ACCESS_END,
    Permissions.SECURITY_INCIDENT_VIEW,
    Permissions.SECURITY_INCIDENT_RESOLVE,
    Permissions.DASHBOARD_VIEW,
    Permissions.GEOSPATIAL_VIEW,
    Permissions.LINK_ANALYSIS_VIEW,
    Permissions.PREDICTIVE_VIEW,
    Permissions.CASE_READ,
  ]),

  [Roles.SCRB_DATA_ANALYST]: new Set([
    Permissions.CASE_READ,
    Permissions.CASE_WRITE,
    Permissions.DASHBOARD_VIEW,
    Permissions.GEOSPATIAL_VIEW,
    Permissions.LINK_ANALYSIS_VIEW,
    Permissions.PREDICTIVE_VIEW,
  ]),

  [Roles.FIELD_INVESTIGATOR]: new Set([
    Permissions.CASE_READ,
    Permissions.LINK_ANALYSIS_VIEW,
  ]),

  [Roles.COMMAND_SUPERVISOR]: new Set([
    Permissions.DASHBOARD_VIEW,
    Permissions.GEOSPATIAL_VIEW,
    Permissions.LINK_ANALYSIS_VIEW,
  ]),

  [Roles.SYSTEM_ADMINISTRATOR]: new Set(),
};

/**
 * Check if a given role string possesses a specific permission string.
 * 
 * @param {string} role - The user's role string (e.g. 'CyberSecurityAdministrator')
 * @param {string} permission - The required permission string (e.g. 'OFFICER_CREATE')
 * @returns {boolean} True if permission is granted
 */
export function hasPermission(role, permission) {
  if (!role || !permission) return false;
  const set = ROLE_PERMISSIONS[role];
  return set ? set.has(permission) : false;
}

/**
 * Check if a given role possesses AT LEAST ONE of the specified permissions.
 * 
 * @param {string} role - The user's role string
 * @param {string[]} permissions - Array of permission strings
 * @returns {boolean} True if any permission is granted
 */
export function hasAnyPermission(role, permissions = []) {
  if (!role || !permissions.length) return false;
  const set = ROLE_PERMISSIONS[role];
  if (!set) return false;
  return permissions.some(p => set.has(p));
}

/**
 * Returns the default landing page route for a given role.
 * 
 * @param {string} role - User role string
 * @returns {string} Route path string
 */
export function getRoleLandingRoute(role) {
  switch (role) {
    case Roles.CYBER_SECURITY_ADMINISTRATOR:
      return '/admin/sessions';
    case Roles.SCRB_DATA_ANALYST:
      return '/dashboard';
    case Roles.FIELD_INVESTIGATOR:
      return '/link-analysis/graph';
    case Roles.COMMAND_SUPERVISOR:
      return '/dashboard';
    case Roles.SYSTEM_ADMINISTRATOR:
    default:
      return '/profile';
  }
}
