import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user:                null,
      token:               null,
      permissions:         [],
      mustChangePassword:  false,
      org:                 null,  // active org
      orgs:                [],    // all orgs user belongs to

      setAuth: ({ user, token, permissions, must_change_password, org, orgs }) =>
        set({
          user,
          token,
          permissions:        permissions || [],
          mustChangePassword: must_change_password || false,
          org:                org || null,
          orgs:               orgs || [],
        }),

      setOrgs: (orgs) => set({ orgs }),

      // Called after a successful /orgs/switch response
      switchOrg: ({ user, token, org, orgs }) =>
        set(prev => ({
          user,
          token,
          permissions:        user.permissions || [],
          mustChangePassword: user.must_change_password || false,
          org:                org  || null,
          orgs:               orgs || prev.orgs, // use fresh list if returned
        })),

      clearMustChangePassword: () => set({ mustChangePassword: false }),

      logout: () => set({ user: null, token: null, permissions: [], mustChangePassword: false, org: null, orgs: [] }),

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
        org:                state.org,
        orgs:               state.orgs,
      }),
    }
  )
);