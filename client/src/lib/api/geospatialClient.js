import { fetchWithAuth } from './client';

export const geospatialClient = {
  getHotspots: async () => {
    // Tries primary route /api/geospatial/hotspots with fallback to alias /api/spatial/hotspots
    try {
      return await fetchWithAuth('/api/geospatial/hotspots', { method: 'GET' });
    } catch (err) {
      return await fetchWithAuth('/api/spatial/hotspots', { method: 'GET' });
    }
  },

  getDrilldown: async (district = '') => {
    const query = district ? `?district=${encodeURIComponent(district)}` : '';
    return fetchWithAuth(`/api/geospatial/drilldown${query}`, { method: 'GET' });
  },
};
