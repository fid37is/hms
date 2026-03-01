// src/store/themeStore.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { lightTokens, darkTokens, applyTokens } from '../config/theme';

export const useThemeStore = create(
  persist(
    (set, get) => ({
      mode: 'light',

      initTheme: () => {
        const { mode } = get();
        applyTokens(mode === 'dark' ? darkTokens : lightTokens);
        document.documentElement.setAttribute('data-theme', mode);
      },

      toggleTheme: () => {
        const next = get().mode === 'light' ? 'dark' : 'light';
        applyTokens(next === 'dark' ? darkTokens : lightTokens);
        document.documentElement.setAttribute('data-theme', next);
        set({ mode: next });
      },
    }),
    {
      name: 'hms-theme',
      partialize: (s) => ({ mode: s.mode }),
    }
  )
);