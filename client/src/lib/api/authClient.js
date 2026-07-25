import { fetchWithAuth } from './client';

export const authClient = {
  login: async (identifier, password) => {
    return fetchWithAuth('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        employee_id: identifier,
        officer_id: identifier,
        identifier: identifier,
        password: password,
      }),
    });
  },

  logout: async () => {
    return fetchWithAuth('/api/auth/logout', { method: 'POST' });
  },

  changePassword: async (currentPassword, newPassword) => {
    return fetchWithAuth('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: newPassword,
      }),
    });
  },

  getProfile: async () => {
    return fetchWithAuth('/api/auth/me', { method: 'GET' });
  },
};
