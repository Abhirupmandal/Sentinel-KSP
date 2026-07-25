# SENTINEL-KSP NAVBAR SYSTEMS & IMPLEMENTATION SPECIFICATION

**Role**: Lead Solution Auditor & Systems Architect  
**Scope**: End-to-End File & System Traceability Documentation for All Navbar Accessible Features  

---

## 1. Executive System Overview

This document provides a comprehensive engineering specification of all **14 functional modules** accessible via the Sentinel-KSP navigation sidebar. It documents the exact frontend components, RBAC permissions, backend endpoints, database tables, Python service files, and implementation blueprints required for each system to function in production.

```text
┌──────────────────────────────────────────────────────────────────────────────────┐
│                             Sentinel-KSP App Shell                               │
├───────────────┬──────────────────────────────────────────────────────────────────┤
│ Navbar System │ Target View & Backend Engine                                     │
├───────────────┼──────────────────────────────────────────────────────────────────┤
│ 1. Overview   │ /dashboard          → Dashboard Overview Engine                  │
│ 2. Spatial    │ /geospatial/hotspots → Spatial Heatmap Engine                    │
│               │ /geospatial/drilldown→ District & Station Drilldown Engine       │
│ 3. Link Graph │ /link-analysis/graph → Vis.js Network Graph Engine               │
│               │ /link-analysis/offender → Repeat Offender Profile Engine         │
│               │ /link-analysis/mo-match → MO Similarity Clustering Engine        │
│ 4. Predictive │ /predictive/risk    → AI Composite Risk Model                    │
│               │ /predictive/anomalies→ Statistical Anomaly Detector              │
│               │ /predictive/socio-economic → Socio-Demographic Layer             │
│ 5. Command Ctr│ /admin/officers     → Identity & Provisioning Engine            │
│               │ /admin/sessions     → Session Monitor & Force Logout           │
│               │ /admin/audit-logs   → Immutable Audit Inspector                  │
│               │ /admin/incidents    → Security Incident Console                  │
│               │ /admin/emergency    → Emergency Access Workflow                  │
└───────────────┴──────────────────────────────────────────────────────────────────┘
```

---

## 2. Complete Navigation Systems Traceability Matrix

| # | Navbar Module Name | Route Path | Required Permission | Allowed Roles | Frontend View File | Backend Endpoint(s) | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | **Analytics Dashboard** | `/dashboard` | `DASHBOARD_VIEW` | `CyberSecurityAdministrator`<br>`SCRBDataAnalyst`<br>`CommandSupervisor` | [DashboardPage.js](file:///e:/Datathon%202026/Sentinel-KSP/client/src/pages/analytics/DashboardPage.js) | `GET /api/dashboard/overview` | **Active** |
| **2** | **Spatial Hotspots** | `/geospatial/hotspots` | `GEOSPATIAL_VIEW` | `CyberSecurityAdministrator`<br>`SCRBDataAnalyst` | [SpatialHotspotsPage.js](file:///e:/Datathon%202026/Sentinel-KSP/client/src/pages/analytics/SpatialHotspotsPage.js) | `GET /api/geospatial/hotspots`<br>`GET /api/spatial/hotspots` | **Active** |
| **3** | **District Drilldown** | `/geospatial/drilldown` | `GEOSPATIAL_VIEW` | `CyberSecurityAdministrator`<br>`SCRBDataAnalyst` | [DistrictDrilldownPage.js](file:///e:/Datathon%202026/Sentinel-KSP/client/src/pages/analytics/DistrictDrilldownPage.js) | `GET /api/geospatial/drilldown` | **Active** |
| **4** | **Entity Network Graph** | `/link-analysis/graph` | `LINK_ANALYSIS_VIEW` | `CyberSecurityAdministrator`<br>`SCRBDataAnalyst`<br>`FieldInvestigator` | [NetworkGraphPage.js](file:///e:/Datathon%202026/Sentinel-KSP/client/src/pages/investigation/NetworkGraphPage.js) | `GET /api/link-analysis/graph`<br>`GET /api/graph/network` | **Active** |
| **5** | **Offender Profile** | `/link-analysis/offender/:id` | `LINK_ANALYSIS_VIEW` | `CyberSecurityAdministrator`<br>`SCRBDataAnalyst`<br>`FieldInvestigator` | [OffenderProfilePage.js](file:///e:/Datathon%202026/Sentinel-KSP/client/src/pages/investigation/OffenderProfilePage.js) | `GET /api/link-analysis/offender/<id>` | **Active** |
| **6** | **MO Signature Match** | `/link-analysis/mo-match` | `LINK_ANALYSIS_VIEW` | `CyberSecurityAdministrator`<br>`SCRBDataAnalyst`<br>`FieldInvestigator` | [MOMatchingPage.js](file:///e:/Datathon%202026/Sentinel-KSP/client/src/pages/investigation/MOMatchingPage.js) | `GET /api/link-analysis/mo-match`<br>`GET /api/analytics/mo-clusters` | **Active** |
| **7** | **Predictive Risk** | `/predictive/risk` | `PREDICTIVE_VIEW` | `CyberSecurityAdministrator`<br>`SCRBDataAnalyst` | [RiskScorePage.js](file:///e:/Datathon%202026/Sentinel-KSP/client/src/pages/analytics/RiskScorePage.js) | `GET /api/predictive/risk-score` | **Active** |
| **8** | **Behavioral Anomalies** | `/predictive/anomalies` | `PREDICTIVE_VIEW` | `CyberSecurityAdministrator`<br>`SCRBDataAnalyst` | [BehavioralAnomalyPage.js](file:///e:/Datathon%202026/Sentinel-KSP/client/src/pages/analytics/BehavioralAnomalyPage.js) | `GET /api/predictive/behavioral-anomalies` | **Active** |
| **9** | **Socio-Economic Layer** | `/predictive/socio-economic` | `PREDICTIVE_VIEW` | `CyberSecurityAdministrator`<br>`SCRBDataAnalyst` | [SocioEconomicPage.js](file:///e:/Datathon%202026/Sentinel-KSP/client/src/pages/analytics/SocioEconomicPage.js) | `GET /api/predictive/socio-economic` | **Active** |
| **10** | **User Management** | `/admin/officers` | `OFFICER_CREATE` | `CyberSecurityAdministrator` | [OfficerManagementPage.js](file:///e:/Datathon%202026/Sentinel-KSP/client/src/pages/admin/OfficerManagementPage.js) | `GET /api/admin/officers`<br>`POST /api/admin/officers`<br>`POST /api/admin/officers/<id>/lock`<br>`POST /api/admin/officers/<id>/reset-password` | **Active** |
| **11** | **Active Sessions** | `/admin/sessions` | `SESSION_VIEW` | `CyberSecurityAdministrator` | [ActiveSessionsPage.js](file:///e:/Datathon%202026/Sentinel-KSP/client/src/pages/admin/ActiveSessionsPage.js) | `GET /api/admin/sessions`<br>`POST /api/admin/force-logout` | **Active** |
| **12** | **Audit Log Inspector** | `/admin/audit-logs` | `AUDIT_VIEW` | `CyberSecurityAdministrator` | [AuditLogsPage.js](file:///e:/Datathon%202026/Sentinel-KSP/client/src/pages/admin/AuditLogsPage.js) | `GET /api/admin/audit-logs` | **Active** |
| **13** | **Security Incidents** | `/admin/incidents` | `SECURITY_INCIDENT_VIEW` | `CyberSecurityAdministrator` | [SecurityIncidentsPage.js](file:///e:/Datathon%202026/Sentinel-KSP/client/src/pages/admin/SecurityIncidentsPage.js) | `GET /api/admin/incidents`<br>`POST /api/admin/incidents/<id>/resolve` | **Active** |
| **14** | **Emergency Access** | `/admin/emergency` | `EMERGENCY_ACCESS_GRANT` | `CyberSecurityAdministrator` | [EmergencyAccessPage.js](file:///e:/Datathon%202026/Sentinel-KSP/client/src/pages/admin/EmergencyAccessPage.js) | `POST /api/admin/emergency-access`<br>`POST /api/admin/emergency-access/end` | **Active** |

---

## 3. Detailed Technical File & Code Architecture Per Module

---

### Module 1: Analytics Dashboard (`/dashboard`)

- **Primary View Component**: `client/src/pages/analytics/DashboardPage.js`
- **Sub-components**: `StatsBar.js`, `SpatialHotspots.js`, `EntityNetworkGraph.js`, `MOSimilarityClusters.js`
- **API SDK File**: `client/src/lib/api/dashboardClient.js`
- **Backend Route File**: `functions/sentinel_api/routes/dashboard.py`
  - Function: `get_dashboard_overview()`
  - Decorators: `@require_permission(Permission.DASHBOARD_VIEW)`
- **Service File**: `functions/sentinel_api/services/analytics_service.py`
  - Class: `AnalyticsService`
  - Method: `get_dashboard_overview()`
- **Repositories Engaged**:
  - `functions/sentinel_api/repositories/case_repository.py`
  - `functions/sentinel_api/repositories/accused_repository.py`
- **Database Tables**: `CaseMaster`, `Accused`

---

### Module 2: Spatial Hotspot Analysis (`/geospatial/hotspots`)

- **Primary View Component**: `client/src/pages/analytics/SpatialHotspotsPage.js`
- **Visualization Component**: `client/src/components/SpatialHotspots.js` (Leaflet Map)
- **API SDK File**: `client/src/lib/api/geospatialClient.js`
- **Backend Route File**: `functions/sentinel_api/routes/geospatial.py`
  - Function: `get_hotspots()`
  - Decorators: `@require_permission(Permission.GEOSPATIAL_VIEW)`
- **Service File**: `functions/sentinel_api/services/geospatial_service.py`
  - Method: `get_spatial_hotspots()`
- **Repositories Engaged**: `functions/sentinel_api/repositories/case_repository.py`
- **Database Table**: `CaseMaster` (Reads `Latitude`, `Longitude`, `District`, `Station`, `CrimeGroup`)

---

### Module 3: District & Station Drilldown (`/geospatial/drilldown`)

- **Primary View Component**: `client/src/pages/analytics/DistrictDrilldownPage.js`
- **API SDK File**: `client/src/lib/api/geospatialClient.js` (`getDrilldown(district)`)
- **Backend Route File**: `functions/sentinel_api/routes/geospatial.py`
  - Function: `get_district_drilldown()`
  - Decorator: `@require_permission(Permission.GEOSPATIAL_VIEW)`
- **Service File**: `functions/sentinel_api/services/geospatial_service.py`
  - Method: `get_district_drilldown(district: str)`
- **Repository Query**: `functions/sentinel_api/repositories/case_repository.py`
- **Database Table**: `CaseMaster`

---

### Module 4: Entity Network Graph Workspace (`/link-analysis/graph`)

- **Primary View Component**: `client/src/pages/investigation/NetworkGraphPage.js`
- **Visualization Component**: `client/src/components/EntityNetworkGraph.js` (Vis.js Graph)
- **API SDK File**: `client/src/lib/api/linkAnalysisClient.js`
- **Backend Route File**: `functions/sentinel_api/routes/link_analysis.py`
  - Function: `get_network_graph()`
  - Decorators: `@require_permission(Permission.LINK_ANALYSIS_VIEW)`
- **Service File**: `functions/sentinel_api/services/link_analysis_service.py`
  - Class: `LinkAnalysisService`
  - Method: `build_entity_network_graph(limit, crime_group)`
- **Repositories Engaged**: `case_repository.py`, `accused_repository.py`
- **Database Tables**: `CaseMaster`, `Accused` (Constructs vertices & edges connecting Accused → CaseMaster)

---

### Module 5: Repeat Offender Profile (`/link-analysis/offender/:accusedId`)

- **Primary View Component**: `client/src/pages/investigation/OffenderProfilePage.js`
- **API SDK File**: `client/src/lib/api/linkAnalysisClient.js` (`getOffenderProfile(accusedId)`)
- **Backend Route File**: `functions/sentinel_api/routes/link_analysis.py`
  - Function: `get_offender_profile(accused_id)`
  - Decorator: `@require_permission(Permission.LINK_ANALYSIS_VIEW)`
- **Service File**: `functions/sentinel_api/services/link_analysis_service.py`
  - Method: `get_offender_profile(accused_id: str)`
- **Repositories Engaged**: `accused_repository.py`, `case_repository.py`
- **Database Tables**: `Accused`, `CaseMaster`

---

### Module 6: MO Signature Matching (`/link-analysis/mo-match`)

- **Primary View Component**: `client/src/pages/investigation/MOMatchingPage.js`
- **Visualization Component**: `client/src/components/MOSimilarityClusters.js`
- **API SDK File**: `client/src/lib/api/linkAnalysisClient.js`
- **Backend Route File**: `functions/sentinel_api/routes/link_analysis.py`
  - Function: `get_mo_matches()`
  - Decorators: `@require_permission(Permission.LINK_ANALYSIS_VIEW)`
- **Service File**: `functions/sentinel_api/services/link_analysis_service.py`
  - Method: `get_mo_similarity_clusters()`
- **Repositories Engaged**: `functions/sentinel_api/repositories/case_repository.py`
- **Database Table**: `CaseMaster`

---

### Module 7: Predictive Risk Scoring Framework (`/predictive/risk`)

- **Primary View Component**: `client/src/pages/analytics/RiskScorePage.js`
- **API SDK File**: `client/src/lib/api/predictiveClient.js`
- **Backend Route File**: `functions/sentinel_api/routes/predictive.py`
  - Function: `get_risk_scores()`
  - Decorators: `@require_permission(Permission.PREDICTIVE_VIEW)`
- **Service File**: `functions/sentinel_api/services/predictive_service.py`
  - Class: `PredictiveService`
  - Method: `calculate_composite_district_risk_scores()`
- **Database Table**: `CaseMaster`

---

### Module 8: Behavioral Anomaly Detection (`/predictive/anomalies`)

- **Primary View Component**: `client/src/pages/analytics/BehavioralAnomalyPage.js`
- **API SDK File**: `client/src/lib/api/predictiveClient.js`
- **Backend Route File**: `functions/sentinel_api/routes/predictive.py`
  - Function: `get_behavioral_anomalies()`
  - Decorators: `@require_permission(Permission.PREDICTIVE_VIEW)`
- **Service File**: `functions/sentinel_api/services/predictive_service.py`
  - Method: `detect_behavioral_anomalies()`
- **Database Table**: `CaseMaster`

---

### Module 9: Socio-Economic Correlation Layer (`/predictive/socio-economic`)

- **Primary View Component**: `client/src/pages/analytics/SocioEconomicPage.js`
- **API SDK File**: `client/src/lib/api/predictiveClient.js` (`getSocioEconomicLayer()`)
- **Backend Route File**: `functions/sentinel_api/routes/predictive.py`
  - Function: `get_socio_economic_data()`
  - Decorator: `@require_permission(Permission.PREDICTIVE_VIEW)`
- **Service File**: `functions/sentinel_api/services/predictive_service.py`
  - Method: `get_socio_economic_correlations()`
- **Database Table**: `CaseMaster`

---

### Module 10: Cyber Command Center User Management (`/admin/officers`)

- **Primary View Component**: `client/src/pages/admin/OfficerManagementPage.js`
- **API SDK File**: `client/src/lib/api/adminClient.js`
- **Backend Route File**: `functions/sentinel_api/routes/admin.py`
  - Functions: `list_officers()`, `create_officer()`, `lock_officer()`, `unlock_officer()`, `reset_officer_password()`
  - Decorators: `@require_permission(Permission.OFFICER_CREATE)` / `@require_permission(Permission.OFFICER_LOCK)`
- **Service File**: `functions/sentinel_api/services/officer_service.py`
- **Repository File**: `functions/sentinel_api/repositories/officer_repository.py`
- **Database Table**: `Officers`

---

### Module 11: Active Sessions & Force Logout (`/admin/sessions`)

- **Primary View Component**: `client/src/pages/admin/ActiveSessionsPage.js`
- **API SDK File**: `client/src/lib/api/adminClient.js`
- **Backend Route File**: `functions/sentinel_api/routes/admin.py`
  - Functions: `list_active_sessions()`, `force_logout_session()`
  - Decorators: `@require_permission(Permission.SESSION_VIEW)` / `@require_permission(Permission.SESSION_FORCE_LOGOUT)`
- **Service File**: `functions/sentinel_api/services/session_service.py`
- **Repository File**: `functions/sentinel_api/repositories/session_repository.py`
- **Database Table**: `ActiveSessions`

---

### Module 12: Immutable Audit Log Inspector (`/admin/audit-logs`)

- **Primary View Component**: `client/src/pages/admin/AuditLogsPage.js`
- **API SDK File**: `client/src/lib/api/adminClient.js`
- **Backend Route File**: `functions/sentinel_api/routes/admin.py`
  - Function: `get_audit_logs()`
  - Decorators: `@require_permission(Permission.AUDIT_VIEW)`
- **Service File**: `functions/sentinel_api/services/audit_service.py`
- **Repository File**: `functions/sentinel_api/repositories/audit_repository.py`
- **Database Table**: `AuditLogs`

---

### Module 13: Security Incidents Console (`/admin/incidents`)

- **Primary View Component**: `client/src/pages/admin/SecurityIncidentsPage.js`
- **API SDK File**: `client/src/lib/api/adminClient.js`
- **Backend Route File**: `functions/sentinel_api/routes/admin.py`
  - Functions: `get_security_incidents()`, `resolve_security_incident()`
  - Decorators: `@require_permission(Permission.SECURITY_INCIDENT_VIEW)`
- **Repository File**: `functions/sentinel_api/repositories/security_incident_repository.py`
- **Database Table**: `SecurityIncidents`

---

### Module 14: Emergency Access Workflow (`/admin/emergency`)

- **Primary View Component**: `client/src/pages/admin/EmergencyAccessPage.js`
- **API SDK File**: `client/src/lib/api/adminClient.js`
- **Backend Route File**: `functions/sentinel_api/routes/admin.py`
  - Functions: `grant_emergency_access()`, `end_emergency_access()`
  - Decorators: `@require_permission(Permission.EMERGENCY_ACCESS_GRANT)`
- **Service File**: `functions/sentinel_api/services/emergency_service.py`
- **Repository File**: `functions/sentinel_api/repositories/emergency_access_repository.py`
- **Database Table**: `EmergencyAccessLogs`

---

## 4. App Shell & Layout Integration Architecture

```text
               ┌──────────────────────────────────────────────┐
               │                 AppShell.js                  │
               └──────────────────────┬───────────────────────┘
                                      │
         ┌────────────────────────────┼────────────────────────────┐
         ▼                            ▼                            ▼
┌──────────────────┐        ┌──────────────────┐        ┌──────────────────┐
│    TopBar.js     │        │   Sidebar.js     │        │   StatusBar.js   │
├──────────────────┤        ├──────────────────┤        ├──────────────────┤
│ - Brand Header   │        │ - NAV_SECTIONS   │        │ - Active Session │
│ - StatusBadge    │        │ - Permission Map │        │ - Officer Context│
│   (15s /health)  │        │ - Dynamic Links  │        │ - Auto-Timeout   │
│ - Theme Toggle   │        │ - Collapsible    │        └──────────────────┘
│ - Officer Info   │        └──────────────────┘
└──────────────────┘
```

- **TopBar.js**: Performs periodic health heartbeat calls to `/api/health` every 15 seconds to update connection status indicators (`online`, `degraded`, `offline`). Handles officer profile display, logout actions, and dark/light theme state toggling via `ThemeContext`.
- **Sidebar.js**: Evaluates active officer's role against required permissions defined in `NAV_SECTIONS` (`lib/navigation.js`) using `hasPermission(role, permission)` (`lib/permissions.js`). Automatically hides menu entries and sections that the logged-in officer is unauthorized to access.
- **Breadcrumbs.js**: Reads dynamic `location.pathname` and generates hierarchy breadcrumbs using `PATH_NAME_MAP`.
- **StatusBar.js**: Displays truncated active session token signature (`SES-XXXXXX`), officer ID badge, and system auto-timeout warning.

---

*End of Systems Documentation Artifact.*
