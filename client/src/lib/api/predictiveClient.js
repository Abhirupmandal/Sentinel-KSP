import { fetchWithAuth } from './client';

export const predictiveClient = {
  getRiskScore: async (district = 'Bengaluru Urban', crimeGroup = '') => {
    const params = new URLSearchParams({ district });
    if (crimeGroup) params.append('crime_group', crimeGroup);
    return fetchWithAuth(`/api/predictive/risk-score?${params.toString()}`, { method: 'GET' });
  },

  getBehavioralAnomalies: async (district = '', threshold = 0.75) => {
    const params = new URLSearchParams();
    if (district) params.append('district', district);
    if (threshold) params.append('threshold', threshold);
    return fetchWithAuth(`/api/predictive/anomalies?${params.toString()}`, { method: 'GET' });
  },

  getSocioEconomicLayer: async (district = '') => {
    const query = district ? `?district=${encodeURIComponent(district)}` : '';
    return fetchWithAuth(`/api/predictive/socio-economic${query}`, { method: 'GET' });
  },
};
