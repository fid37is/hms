// src/hooks/usePanelLayout.js
//
// Shared hook used by every module page that has a SlidePanel.
// Tracks mobile/desktop and returns the margin-right style to
// push content left when the panel is open on desktop.
//
// Usage:
//   const { contentStyle } = usePanelLayout(panelOpen);
//   <div style={contentStyle}>...</div>

import { useState, useEffect } from 'react';
import { PANEL_WIDTH }         from '../components/shared/SlidePanel';

export function usePanelLayout(open) {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  const contentStyle = {
    flex:       1,
    minWidth:   0,
    marginRight: open && !isMobile ? PANEL_WIDTH + 16 : 0,
    transition: 'margin-right 280ms cubic-bezier(0.4,0,0.2,1)',
  };

  return { isMobile, contentStyle };
}