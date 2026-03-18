// hms/src/modules/settings/preview/useHotelConfig.jsx
//
// Minimal stub of useHotelConfig for use inside the HMS CustomizePage preview.
// The real useHotelConfig fetches from the API and applies CSS vars — none of
// that is needed here. We just return the current editor state from PreviewContext.

import { useContext } from 'react';
import { PreviewContext } from './PreviewContext.jsx';

// Sections call useHotelConfig() to get their data.
// In the HMS preview we return the editor's live content/layout instead.
export function useHotelConfig() {
  const ctx = useContext(PreviewContext);
  if (!ctx) return {};
  return {
    ...(ctx.hotelConfigBase || {}),
    layout:  ctx.layout  || {},
    content: ctx.content || {},
  };
}

// HotelConfigProvider is not used in the HMS — sections are rendered directly.
// Export a passthrough so any accidental import doesn't crash.
export function HotelConfigProvider({ children }) {
  return children;
}

export default useHotelConfig;