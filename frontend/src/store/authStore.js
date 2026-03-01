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
        return permissions.includes(permission);
      },

      isAuthenticated: () => !!get().token,
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
