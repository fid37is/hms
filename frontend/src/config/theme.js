// src/config/theme.js
// ─────────────────────────────────────────────────────────────
// SINGLE SOURCE OF TRUTH for all visual tokens.
// Hotels override only applyBrandColors() — nothing else changes.
// All Tailwind classes map back to these CSS variables.
// ─────────────────────────────────────────────────────────────

export const lightTokens = {
  // Backgrounds
  '--bg-page':      '#F8F8F9',
  '--bg-surface':   '#FFFFFF',
  '--bg-subtle':    '#F3F4F6',
  '--bg-muted':     '#EAECEF',

  // Borders
  '--border-soft':  '#EAECEF',
  '--border-base':  '#D4D8DE',

  // Text
  '--text-base':    '#111318',
  '--text-sub':     '#5C6370',
  '--text-muted':   '#9CA3AF',
  '--text-on-brand':'#FFFFFF',

  // Brand — overridden at runtime via applyBrandColors()
  '--brand':        '#1F4E8C',
  '--brand-hover':  '#1A4278',
  '--brand-subtle': '#EBF2FF',
  '--accent':       '#C9A84C',

  // Sidebar (always dark regardless of page theme)
  '--sidebar-bg':           '#111318',
  '--sidebar-border':       '#1E2128',
  '--sidebar-text':         'rgba(255,255,255,0.55)',
  '--sidebar-text-active':  '#FFFFFF',
  '--sidebar-item-active':  'rgba(255,255,255,0.10)',
  '--sidebar-item-hover':   'rgba(255,255,255,0.05)',

  // Status colours — restrained, semantic only
  '--s-green-bg':   '#F0FDF4', '--s-green-text':  '#166534',
  '--s-yellow-bg':  '#FEFCE8', '--s-yellow-text': '#854D0E',
  '--s-red-bg':     '#FFF1F2', '--s-red-text':    '#BE123C',
  '--s-blue-bg':    '#EFF6FF', '--s-blue-text':   '#1D4ED8',
  '--s-gray-bg':    '#F3F4F6', '--s-gray-text':   '#374151',
  '--s-purple-bg':  '#FAF5FF', '--s-purple-text': '#6B21A8',

  // Elevation
  '--shadow-xs': '0 1px 2px rgba(0,0,0,0.04)',
  '--shadow-sm': '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
  '--shadow-md': '0 4px 8px rgba(0,0,0,0.06), 0 2px 4px rgba(0,0,0,0.04)',
};

export const darkTokens = {
  '--bg-page':      '#0E1015',
  '--bg-surface':   '#16191F',
  '--bg-subtle':    '#1E2128',
  '--bg-muted':     '#252930',

  '--border-soft':  '#21252D',
  '--border-base':  '#2C313C',

  '--text-base':    '#E8EAED',
  '--text-sub':     '#8B909A',
  '--text-muted':   '#555C6B',
  '--text-on-brand':'#FFFFFF',

  '--brand':        '#3B7FD4',
  '--brand-hover':  '#2F6BBF',
  '--brand-subtle': '#1A2A40',
  '--accent':       '#C9A84C',

  '--sidebar-bg':           '#0A0C10',
  '--sidebar-border':       '#13161C',
  '--sidebar-text':         'rgba(255,255,255,0.45)',
  '--sidebar-text-active':  '#FFFFFF',
  '--sidebar-item-active':  'rgba(255,255,255,0.08)',
  '--sidebar-item-hover':   'rgba(255,255,255,0.04)',

  '--s-green-bg':   'rgba(22,101,52,0.2)',  '--s-green-text':  '#4ADE80',
  '--s-yellow-bg':  'rgba(133,77,14,0.2)',  '--s-yellow-text': '#FCD34D',
  '--s-red-bg':     'rgba(190,18,60,0.2)',  '--s-red-text':    '#FB7185',
  '--s-blue-bg':    'rgba(29,78,216,0.2)',  '--s-blue-text':   '#60A5FA',
  '--s-gray-bg':    'rgba(55,65,81,0.3)',   '--s-gray-text':   '#9CA3AF',
  '--s-purple-bg':  'rgba(107,33,168,0.2)', '--s-purple-text': '#C084FC',

  '--shadow-xs': '0 1px 2px rgba(0,0,0,0.3)',
  '--shadow-sm': '0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.3)',
  '--shadow-md': '0 4px 8px rgba(0,0,0,0.5), 0 2px 4px rgba(0,0,0,0.4)',
};

// ─── Runtime helpers ──────────────────────────────────────

/** Writes all tokens as CSS custom properties on <html> */
export const applyTokens = (tokens) => {
  const root = document.documentElement;
  Object.entries(tokens).forEach(([k, v]) => root.style.setProperty(k, v));
};

/**
 * Call once on app boot after fetching /api/v1/config.
 * primary / accent are plain hex strings.
 */
export const applyBrandColors = ({ primary, primaryHover, accent } = {}) => {
  const root = document.documentElement;
  if (primary)      root.style.setProperty('--brand', primary);
  if (primaryHover) root.style.setProperty('--brand-hover', primaryHover);
  else if (primary) root.style.setProperty('--brand-hover', primary); // fallback same
  if (accent)       root.style.setProperty('--accent', accent);
};