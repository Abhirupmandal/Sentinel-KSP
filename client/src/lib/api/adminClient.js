import { fetchWithAuth } from './client';

export const adminClient = {
  getOfficers: async () => {
    return fetchWithAuth('/api/admin/officers', { method: 'GET' });
  },

  createOfficer: async (officerData) => {
    return fetchWithAuth('/api/admin/officers', {
      method: 'POST',
      body: JSON.stringify(officerData),
    });
  },

  resetPassword: async (officerId) => {
    return fetchWithAuth(`/api/admin/officers/${officerId}/reset-password`, {
      method: 'POST',
    });
  },

  lockAccount: async (officerId) => {
    return fetchWithAuth(`/api/admin/officers/${officerId}/lock`, {
      method: 'POST',
    });
  },

  unlockAccount: async (officerId) => {
    return fetchWithAuth(`/api/admin/officers/${officerId}/unlock`, {
      method: 'POST',
    });
  },

  getActiveSessions: async () => {
    return fetchWithAuth('/api/admin/sessions', { method: 'GET' });
  },

  forceLogout: async (officerId) => {
    return fetchWithAuth('/api/admin/force-logout', {
      method: 'POST',
      body: JSON.stringify({ officer_id: officerId }),
    });
  },

  getAuditLogs: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchWithAuth(`/api/admin/audit-logs${query ? `?${query}` : ''}`, {
      method: 'GET',
    });
  },

  getSecurityIncidents: async () => {
    return fetchWithAuth('/api/admin/incidents', { method: 'GET' });
  },

  grantEmergencyAccess: async (grantData) => {
    return fetchWithAuth('/api/admin/emergency-access', {
      method: 'POST',
      body: JSON.stringify(grantData),
    });
  },

  endEmergencyAccess: async (sessionData) => {
    return fetchWithAuth('/api/admin/emergency-access/end', {
      method: 'POST',
      body: JSON.stringify(sessionData),
    });
  },
};
