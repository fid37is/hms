// src/config/theme.js
// ─────────────────────────────────────────────────────────────
// SINGLE SOURCE OF TRUTH for all visual tokens.
// Flame palette — warm, inviting, hospitality-first.
// "Your hotel, always on."
// ─────────────────────────────────────────────────────────────

export const lightTokens = {
  // Backgrounds — warm whites, not clinical
  '--bg-page':      '#FFFFFF',
  '--bg-surface':   '#FFFFFF',
  '--bg-subtle':    '#FEF6EC',
  '--bg-muted':     '#FDECD6',

  // Borders — warm sand
  '--border-soft':  '#F0E0C8',
  '--border-base':  '#E8CEAC',

  // Text — warm espresso tones
  '--text-base':    '#1C1208',
  '--text-sub':     '#6B4F35',
  '--text-muted':   '#B08060',
  '--text-on-brand':'#FFFFFF',

  // Brand — flame orange (hotel can override at runtime)
  '--brand':        '#EA6C0A',
  '--brand-hover':  '#C85A08',
  '--brand-subtle': '#FEF0E0',
  '--accent':       '#F5A623',

  // Sidebar — warm espresso wood, fixed brand element
  '--sidebar-bg':           '#1C1208',
  '--sidebar-border':       '#2C1E0F',
  '--sidebar-text':         'rgba(255,235,210,0.5)',
  '--sidebar-text-active':  '#FFEAD0',
  '--sidebar-item-active':  'rgba(234,108,10,0.18)',
  '--sidebar-item-hover':   'rgba(255,235,210,0.06)',

  // Status colours
  '--s-green-bg':   '#F0FDF4', '--s-green-text':  '#166534',
  '--s-yellow-bg':  '#FFFBEB', '--s-yellow-text': '#92400E',
  '--s-red-bg':     '#FFF5F0', '--s-red-text':    '#C2410C',
  '--s-blue-bg':    '#FFF7ED', '--s-blue-text':   '#9A3412',
  '--s-gray-bg':    '#FEF6EC', '--s-gray-text':   '#6B4F35',
  '--s-purple-bg':  '#FAF5FF', '--s-purple-text': '#6B21A8',

  // Elevation — warm shadows
  '--shadow-xs': '0 1px 2px rgba(60,20,0,0.05)',
  '--shadow-sm': '0 1px 3px rgba(60,20,0,0.08), 0 1px 2px rgba(60,20,0,0.05)',
  '--shadow-md': '0 4px 8px rgba(60,20,0,0.08), 0 2px 4px rgba(60,20,0,0.05)',
};

export const darkTokens = {
  '--bg-page':      '#120C05',
  '--bg-surface':   '#1C1208',
  '--bg-subtle':    '#261809',
  '--bg-muted':     '#33220E',

  '--border-soft':  '#2C1E0F',
  '--border-base':  '#3D2910',

  '--text-base':    '#FFE8CC',
  '--text-sub':     '#C49060',
  '--text-muted':   '#7A5535',
  '--text-on-brand':'#FFFFFF',

  '--brand':        '#F97316',
  '--brand-hover':  '#EA6C0A',
  '--brand-subtle': '#2C1800',
  '--accent':       '#F5A623',

  '--sidebar-bg':           '#0E0805',
  '--sidebar-border':       '#1C1208',
  '--sidebar-text':         'rgba(255,235,210,0.4)',
  '--sidebar-text-active':  '#FFEAD0',
  '--sidebar-item-active':  'rgba(234,108,10,0.2)',
  '--sidebar-item-hover':   'rgba(255,235,210,0.05)',

  '--s-green-bg':   'rgba(22,101,52,0.2)',  '--s-green-text':  '#4ADE80',
  '--s-yellow-bg':  'rgba(146,64,14,0.2)',  '--s-yellow-text': '#FCD34D',
  '--s-red-bg':     'rgba(194,65,12,0.2)',  '--s-red-text':    '#FB923C',
  '--s-blue-bg':    'rgba(194,65,12,0.15)', '--s-blue-text':   '#FDBA74',
  '--s-gray-bg':    'rgba(107,79,53,0.2)',  '--s-gray-text':   '#C49060',
  '--s-purple-bg':  'rgba(107,33,168,0.2)', '--s-purple-text': '#C084FC',

  '--shadow-xs': '0 1px 2px rgba(0,0,0,0.4)',
  '--shadow-sm': '0 1px 3px rgba(0,0,0,0.5), 0 1px 2px rgba(0,0,0,0.4)',
  '--shadow-md': '0 4px 8px rgba(0,0,0,0.6), 0 2px 4px rgba(0,0,0,0.5)',
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
  else if (primary) root.style.setProperty('--brand-hover', primary);
  if (accent)       root.style.setProperty('--accent', accent);
};