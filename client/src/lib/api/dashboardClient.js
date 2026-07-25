import { fetchWithAuth } from './client';

export const dashboardClient = {
  getOverview: async () => {
    return fetchWithAuth('/api/dashboard/overview', { method: 'GET' });
  },
};
