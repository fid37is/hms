// src/store/authStore.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user:        null,
      token:       null,
      permissions: [],

      setAuth: ({ user, token, permissions }) =>
        set({ user, token, permissions: permissions || [] }),

      logout: () => set({ user: null, token: null, permissions: [] }),

      hasPermission: (permission) => {
        const { permissions } = get();
        // '*' wildcard means Admin — full access
        return permissions.includes('*') || permissions.includes(permission);
      },

      isAuthenticated: () => {
        const { token, permissions, user } = get();
        if (!token) return false;
        // Detect stale token: admin with no wildcard = issued before the fix
        const isAdmin = user?.role?.toLowerCase() === 'admin';
        if (isAdmin && !permissions.includes('*')) return false;
        return true;
      },
    }),
    {
      name: 'hms-auth',
      partialize: (state) => ({
        user:        state.user,
        token:       state.token,
        permissions: state.permissions,
      }),
    }
  )
);