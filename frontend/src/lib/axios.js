// src/lib/axios.js
import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

// Track if a refresh is in progress to avoid multiple simultaneous refresh calls
let isRefreshing = false;
let failedQueue  = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  failedQueue = [];
};

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;

    // Only attempt refresh on 401, and not on the refresh endpoint itself
    if (
      err.response?.status === 401 &&
      !original._retry &&
      !original.url?.includes('/auth/refresh')
    ) {
      if (isRefreshing) {
        // Queue this request until refresh completes
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          original.headers.Authorization = `Bearer ${token}`;
          return api(original);
        });
      }

      original._retry  = true;
      isRefreshing     = true;

      try {
        // Call refresh endpoint — no auth header needed, uses stored refresh token
        // NOTE: add refresh_token to your authStore if you want to store it
        // For now this hits the /auth/refresh endpoint which reads the token from body
        const { token: currentToken } = useAuthStore.getState();
        const res = await axios.post(
          `${api.defaults.baseURL}/auth/refresh`,
          { refresh_token: useAuthStore.getState().refreshToken },
          { headers: { 'Content-Type': 'application/json' } }
        );

        const newToken = res.data.data?.access_token || res.data.access_token;
        useAuthStore.getState().setAuth({
          ...useAuthStore.getState(),
          token: newToken,
        });

        processQueue(null, newToken);
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch (refreshError) {
        processQueue(refreshError, null);
        useAuthStore.getState().logout();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // For all other errors just reject
    return Promise.reject(err);
  }
);

export default api;