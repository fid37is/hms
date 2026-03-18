// hms/src/modules/settings/preview/theme-stub.js
//
// No-op stub for hotel-website/src/config/theme.js when imported in the HMS.
// The HMS has its own theming — we don't want the hotel's CSS vars applied
// to the HMS page. All functions are safe no-ops.

export const defaultTokens    = {};
export const applyTokens      = () => {};
export const applyBrandColors = () => {};
export const applyFontPair    = () => {};

export const DEFAULT_LAYOUT = {
  nav_style:      'transparent_scroll',
  hero_style:     'fullscreen',
  card_style:     'portrait',
  font_pair:      'cormorant_dmsans',
  section_order:  ['hero','booking_bar','rooms','why_stay','story','offers','events','reviews','cta'],
  section_hidden: [],
};

export const parseLayout = (raw = {}) => {
  const base   = DEFAULT_LAYOUT.section_order;
  const saved  = Array.isArray(raw.section_order) ? raw.section_order : base;
  const merged = [...saved];
  base.forEach(id => {
    if (!merged.includes(id)) {
      const anchor   = base.slice(base.indexOf(id) + 1).find(s => merged.includes(s));
      const insertAt = anchor ? merged.indexOf(anchor) : merged.length;
      merged.splice(insertAt, 0, id);
    }
  });
  return {
    ...DEFAULT_LAYOUT,
    ...raw,
    section_order:  merged,
    section_hidden: Array.isArray(raw.section_hidden) ? raw.section_hidden : DEFAULT_LAYOUT.section_hidden,
  };
};