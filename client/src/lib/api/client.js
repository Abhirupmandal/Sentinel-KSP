import { API_BASE_URL, TOKEN_STORAGE_KEY, USER_STORAGE_KEY } from './config';

/**
 * Hardened API HTTP Client Wrapper for Sentinel-KSP.
 * 
 * Enforces JWT Authorization headers, standard JSON content type,
 * status code interception (401, 403, 409), and automatic envelope unwrapping.
 * 
 * @param {string} endpoint - Path (e.g. '/api/auth/login') or full URL
 * @param {Object} options - Standard fetch options
 * @returns {Promise<any>} Unwrapped payload data or response dictionary
 */
export async function fetchWithAuth(endpoint, options = {}) {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Handle 401 Unauthorized (Session Expired or Invalid Token)
  if (response.status === 401) {
    console.warn('[Sentinel] HTTP 401 Unauthorized detected. Clearing session state...');
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
    if (window.location.pathname !== '/login' && window.location.pathname !== '/session-expired') {
      window.location.href = '/session-expired';
    }
    throw new Error('Session expired or unauthorized');
  }

  const json = await response.json().catch(() => ({}));

  // Handle 409 Conflict (Concurrent Session Rejection)
  if (response.status === 409) {
    const msg = json.message || json.errors?.[0]?.detail || 'Concurrent login prohibited';
    const err = new Error(msg);
    err.status = 409;
    throw err;
  }

  // Handle 403 Forbidden (RBAC Rejection)
  if (response.status === 403) {
    const msg = json.message || 'Permission denied';
    const err = new Error(msg);
    err.status = 403;
    throw err;
  }

  // Handle non-ok generic status codes
  if (!response.ok || json.success === false) {
    const msg = json.message || `Request failed with HTTP status ${response.status}`;
    const err = new Error(msg);
    err.status = response.status;
    err.errors = json.errors || [];
    throw err;
  }

  // Standard response envelope unwrapping
  return json;
}
