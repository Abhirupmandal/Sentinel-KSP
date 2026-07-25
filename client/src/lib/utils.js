import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export async function fetchWithAuth(url, options = {}) {
  const token = localStorage.getItem('sentinel_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };
  const res = await fetch(url, { ...options, headers });
  if (res.status === 401) {
    console.warn('[Sentinel] Session expired or invalid token (HTTP 401). Clearing session...');
    localStorage.removeItem('sentinel_token');
    localStorage.removeItem('sentinel_user');
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  }
  return res;
}
