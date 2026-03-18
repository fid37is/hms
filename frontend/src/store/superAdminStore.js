// src/store/superAdminStore.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useSuperAdminStore = create(
  persist(
    (set, get) => ({
      admin: null,
      token: null,

      setAuth: ({ admin, access_token }) =>
        set({ admin, token: access_token }),

      logout: () =>
        set({ admin: null, token: null }),

      isAuthenticated: () => !!get().token,
    }),
    {
      name: 'hms-super-admin',
      partialize: (state) => ({ admin: state.admin, token: state.token }),
    }
  )
);