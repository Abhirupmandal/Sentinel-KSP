import { BrowserRouter, Routes, Route, Navigate, useLocation, Outlet } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';

// Guards
import AuthGuard from './components/guards/AuthGuard';
import AccountStateGuard from './components/guards/AccountStateGuard';
import TempPasswordGuard from './components/guards/TempPasswordGuard';
import PermissionGuard from './components/guards/PermissionGuard';
import RoleBasedRedirect from './components/guards/RoleBasedRedirect';

// App Shell
import AppShell from './components/app-shell/AppShell';
import ErrorBoundary from './components/shared/ErrorBoundary';

// Public Pages
import LoginPage from './pages/LoginPage';
import ChangePasswordPage from './pages/public/ChangePasswordPage';
import UnauthorizedPage from './pages/public/UnauthorizedPage';
import SessionExpiredPage from './pages/public/SessionExpiredPage';
import AccountRestrictedPage from './pages/public/AccountRestrictedPage';

// Admin Pages
import OfficerManagementPage from './pages/admin/OfficerManagementPage';
import ActiveSessionsPage from './pages/admin/ActiveSessionsPage';
import AuditLogsPage from './pages/admin/AuditLogsPage';
import SecurityIncidentsPage from './pages/admin/SecurityIncidentsPage';
import EmergencyAccessPage from './pages/admin/EmergencyAccessPage';

// Analytics Pages
import DashboardPage from './pages/analytics/DashboardPage';
import SpatialHotspotsPage from './pages/analytics/SpatialHotspotsPage';
import DistrictDrilldownPage from './pages/analytics/DistrictDrilldownPage';
import RiskScorePage from './pages/analytics/RiskScorePage';
import BehavioralAnomalyPage from './pages/analytics/BehavioralAnomalyPage';
import SocioEconomicPage from './pages/analytics/SocioEconomicPage';

// Investigation Pages
import NetworkGraphPage from './pages/investigation/NetworkGraphPage';
import OffenderProfilePage from './pages/investigation/OffenderProfilePage';
import MOMatchingPage from './pages/investigation/MOMatchingPage';

// Profile
import ProfilePage from './pages/ProfilePage';

/**
 * GuardedLayout — wraps all authenticated routes in the full guard stack
 * and renders the AppShell layout around child routes.
 */
function GuardedLayout() {
  return (
    <AuthGuard>
      <AccountStateGuard>
        <TempPasswordGuard>
          <AppShell>
            <ErrorBoundary>
              <Outlet />
            </ErrorBoundary>
          </AppShell>
        </TempPasswordGuard>
      </AccountStateGuard>
    </AuthGuard>
  );
}

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/session-expired" element={<SessionExpiredPage />} />
        <Route path="/account-restricted" element={<AccountRestrictedPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />

        <Route path="/change-password" element={
          <AuthGuard><ChangePasswordPage /></AuthGuard>
        } />

        <Route element={<GuardedLayout />}>
          <Route index element={<RoleBasedRedirect />} />
          <Route path="profile" element={<ProfilePage />} />

          <Route path="dashboard" element={
            <PermissionGuard permission="DASHBOARD_VIEW"><DashboardPage /></PermissionGuard>
          } />

          <Route path="geospatial/hotspots" element={
            <PermissionGuard permission="GEOSPATIAL_VIEW"><SpatialHotspotsPage /></PermissionGuard>
          } />
          <Route path="geospatial/drilldown" element={
            <PermissionGuard permission="GEOSPATIAL_VIEW"><DistrictDrilldownPage /></PermissionGuard>
          } />

          <Route path="link-analysis/graph" element={
            <PermissionGuard permission="LINK_ANALYSIS_VIEW"><NetworkGraphPage /></PermissionGuard>
          } />
          <Route path="link-analysis/offender/:accusedId" element={
            <PermissionGuard permission="LINK_ANALYSIS_VIEW"><OffenderProfilePage /></PermissionGuard>
          } />
          <Route path="link-analysis/mo-match" element={
            <PermissionGuard permission="LINK_ANALYSIS_VIEW"><MOMatchingPage /></PermissionGuard>
          } />

          <Route path="predictive/risk" element={
            <PermissionGuard permission="PREDICTIVE_VIEW"><RiskScorePage /></PermissionGuard>
          } />
          <Route path="predictive/anomalies" element={
            <PermissionGuard permission="PREDICTIVE_VIEW"><BehavioralAnomalyPage /></PermissionGuard>
          } />
          <Route path="predictive/socio-economic" element={
            <PermissionGuard permission="PREDICTIVE_VIEW"><SocioEconomicPage /></PermissionGuard>
          } />

          <Route path="admin/officers" element={
            <PermissionGuard permission="OFFICER_CREATE"><OfficerManagementPage /></PermissionGuard>
          } />
          <Route path="admin/sessions" element={
            <PermissionGuard permission="SESSION_VIEW"><ActiveSessionsPage /></PermissionGuard>
          } />
          <Route path="admin/audit-logs" element={
            <PermissionGuard permission="AUDIT_VIEW"><AuditLogsPage /></PermissionGuard>
          } />
          <Route path="admin/incidents" element={
            <PermissionGuard permission="SECURITY_INCIDENT_VIEW"><SecurityIncidentsPage /></PermissionGuard>
          } />
          <Route path="admin/emergency" element={
            <PermissionGuard permission="EMERGENCY_ACCESS_GRANT"><EmergencyAccessPage /></PermissionGuard>
          } />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <AnimatedRoutes />
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
