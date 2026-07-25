import { fetchWithAuth } from './client';

export const linkAnalysisClient = {
  getNetworkGraph: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    try {
      return await fetchWithAuth(`/api/link-analysis/graph${query ? `?${query}` : ''}`, { method: 'GET' });
    } catch (err) {
      return await fetchWithAuth(`/api/graph/network${query ? `?${query}` : ''}`, { method: 'GET' });
    }
  },

  getOffenderProfile: async (accusedId) => {
    return fetchWithAuth(`/api/link-analysis/offender/${encodeURIComponent(accusedId)}`, { method: 'GET' });
  },

  getMOMatches: async () => {
    try {
      return await fetchWithAuth('/api/link-analysis/mo-match', { method: 'GET' });
    } catch (err) {
      return await fetchWithAuth('/api/analytics/mo-clusters', { method: 'GET' });
    }
  },
};
