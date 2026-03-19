// src/lib/api/superAdminApi.js
//
// Separate axios instance for /api/v1/super-admin routes.
// Uses the superAdminStore token — never the tenant authStore token.

import axios from 'axios';
import { useSuperAdminStore } from '../../store/superAdminStore';

const saApi = axios.create({
  baseURL: `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1'}/super-admin`,
  headers: { 'Content-Type': 'application/json' },
});

saApi.interceptors.request.use((config) => {
  const token = useSuperAdminStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

saApi.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      useSuperAdminStore.getState().logout();
      window.location.href = '/super-admin/login';
    }
    return Promise.reject(err);
  }
);

// ─── Auth ─────────────────────────────────────────────────
export const superAdminLogin = (email, password) =>
  saApi.post('/auth/login', { email, password });

export const getSuperAdminMe = () =>
  saApi.get('/auth/me');

// ─── Platform ─────────────────────────────────────────────
export const getPlatformStats = () =>
  saApi.get('/stats');

export const getPlatformActivity = (limit = 20) =>
  saApi.get('/activity', { params: { limit } });

export const getSystemHealth = () =>
  saApi.get('/health');

export const getPlatformFinancials = () =>
  saApi.get('/financials');

// ─── Organizations ─────────────────────────────────────────
export const listOrganizations = (params = {}) =>
  saApi.get('/organizations', { params });

export const getOrganization = (orgId) =>
  saApi.get(`/organizations/${orgId}`);

export const updateOrganization = (orgId, data) =>
  saApi.patch(`/organizations/${orgId}`, data);

export default saApi;