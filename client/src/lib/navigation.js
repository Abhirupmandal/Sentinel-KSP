/**
 * Navigation Menu Configuration for Sentinel-KSP.
 * 
 * Defines all sidebar sections and navigation links paired with their required permission.
 * Filtering is performed dynamically by AppShell/Sidebar using hasPermission().
 */

import { Permissions } from './permissions';

export const NAV_SECTIONS = [
  {
    id: 'overview',
    label: 'Overview & Intelligence',
    items: [
      {
        path: '/dashboard',
        label: 'Analytics Dashboard',
        icon: 'LayoutDashboard',
        permission: Permissions.DASHBOARD_VIEW,
      },
    ],
  },
  {
    id: 'geospatial',
    label: 'Geospatial Intelligence',
    items: [
      {
        path: '/geospatial/hotspots',
        label: 'Spatial Hotspots',
        icon: 'MapPin',
        permission: Permissions.GEOSPATIAL_VIEW,
      },
      {
        path: '/geospatial/drilldown',
        label: 'District Drilldown',
        icon: 'Layers',
        permission: Permissions.GEOSPATIAL_VIEW,
      },
    ],
  },
  {
    id: 'link-analysis',
    label: 'Link & Network Analysis',
    items: [
      {
        path: '/link-analysis/graph',
        label: 'Entity Network Graph',
        icon: 'Network',
        permission: Permissions.LINK_ANALYSIS_VIEW,
      },
      {
        path: '/link-analysis/mo-match',
        label: 'MO Signature Matching',
        icon: 'Fingerprint',
        permission: Permissions.LINK_ANALYSIS_VIEW,
      },
    ],
  },
  {
    id: 'predictive',
    label: 'Predictive & AI Analytics',
    items: [
      {
        path: '/predictive/risk',
        label: 'Predictive Risk Scoring',
        icon: 'TrendingUp',
        permission: Permissions.PREDICTIVE_VIEW,
      },
      {
        path: '/predictive/anomalies',
        label: 'Behavioral Anomalies',
        icon: 'AlertTriangle',
        permission: Permissions.PREDICTIVE_VIEW,
      },
      {
        path: '/predictive/socio-economic',
        label: 'Socio-Economic Layer',
        icon: 'BarChart3',
        permission: Permissions.PREDICTIVE_VIEW,
      },
    ],
  },
  {
    id: 'admin',
    label: 'Cyber Command Center',
    items: [
      {
        path: '/admin/officers',
        label: 'User Management',
        icon: 'UserCog',
        permission: Permissions.OFFICER_CREATE,
      },
      {
        path: '/admin/sessions',
        label: 'Active Sessions',
        icon: 'MonitorDot',
        permission: Permissions.SESSION_VIEW,
      },
      {
        path: '/admin/audit-logs',
        label: 'Audit Log Inspector',
        icon: 'FileSearch',
        permission: Permissions.AUDIT_VIEW,
      },
      {
        path: '/admin/incidents',
        label: 'Security Incidents',
        icon: 'ShieldAlert',
        permission: Permissions.SECURITY_INCIDENT_VIEW,
      },
      {
        path: '/admin/emergency',
        label: 'Emergency Access',
        icon: 'Siren',
        permission: Permissions.EMERGENCY_ACCESS_GRANT,
      },
    ],
  },
];
