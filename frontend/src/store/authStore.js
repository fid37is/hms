import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user:                null,
      token:               null,
      permissions:         [],
      mustChangePassword:  false,

      setAuth: ({ user, token, permissions, must_change_password }) =>
        set({
          user,
          token,
          permissions:        permissions || [],
          mustChangePassword: must_change_password || false,
        }),

      clearMustChangePassword: () => set({ mustChangePassword: false }),

      logout: () => set({ user: null, token: null, permissions: [], mustChangePassword: false }),

      hasPermission: (permission) => {
        const { permissions } = get();
        return permissions.includes('*') || permissions.includes(permission);
      },

      isAuthenticated: () => {
        const { token, permissions, user } = get();
        if (!token) return false;
        const isAdmin = user?.role?.toLowerCase() === 'admin';
        if (isAdmin && !permissions.includes('*')) return false;
        return true;
      },
    }),
    {
      name: 'hms-auth',
      partialize: (state) => ({
        user:               state.user,
        token:              state.token,
        permissions:        state.permissions,
        mustChangePassword: state.mustChangePassword,
      }),
    }
  )
);