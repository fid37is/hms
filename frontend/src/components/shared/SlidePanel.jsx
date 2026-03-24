// src/components/shared/SlidePanel.jsx
//
// THE single slide-in panel. Every page uses this. No exceptions.
// No box-shadow. Consistent 240ms slide animation. Handles its own backdrop.
//
// Usage:
//   <SlidePanel open={panelOpen} onClose={closePanel} title={panelTitle}>
//     {panelContent()}
//   </SlidePanel>
//
// Page also pushes its content left on desktop:
//   style={{ marginRight: panelOpen && !isMobile ? PANEL_WIDTH + 16 : 0,
//            transition: 'margin-right 240ms cubic-bezier(0.4,0,0.2,1)' }}

import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export const PANEL_WIDTH = 480;

export default function SlidePanel({ open, onClose, title, children }) {
  const isMobile = () => window.innerWidth < 768;

  // Escape key to close
  useEffect(() => {
    if (!open) return;
    const h = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, onClose]);

  return (
    <>
      {/* Backdrop — mobile only */}
      <div
        onClick={onClose}
        style={{
          position:        'fixed',
          inset:           0,
          zIndex:          49,
          backgroundColor: 'rgba(0,0,0,0.4)',
          opacity:         open ? 1 : 0,
          pointerEvents:   open ? 'auto' : 'none',
          transition:      'opacity 240ms ease',
          // Only show on mobile — desktop pushes content instead
          display:         'var(--backdrop-display, none)',
        }}
        className="slide-panel-backdrop"
      />

      {/* Panel */}
      {open && (
        <div
          style={{
            position:        'fixed',
            top:             isMobile() ? 0 : 56,
            right:           0,
            bottom:          0,
            left:            isMobile() ? 0 : 'auto',
            width:           isMobile() ? '100%' : PANEL_WIDTH,
            zIndex:          isMobile() ? 50 : 30,
            backgroundColor: 'var(--bg-surface)',
            borderLeft:      isMobile() ? 'none' : '1px solid var(--border-soft)',
            // NO box-shadow — ever
            display:         'flex',
            flexDirection:   'column',
            animation:       'slideInPanel 240ms cubic-bezier(0.4,0,0.2,1)',
          }}
        >
          {/* Header — always 44px */}
          <div style={{
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'space-between',
            padding:        '0 20px',
            height:         44,
            flexShrink:     0,
            borderBottom:   '1px solid var(--border-soft)',
          }}>
            <h2 style={{
              fontSize: 13, fontWeight: 600,
              color: 'var(--text-base)', margin: 0,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {title}
            </h2>
            <button
              onClick={onClose}
              style={{
                width: 28, height: 28, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: 6, border: 'none', background: 'transparent',
                cursor: 'pointer', color: 'var(--text-muted)',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-subtle)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <X size={15} />
            </button>
          </div>

          {/* Body */}
          <div style={{
            flex: 1, overflowY: 'auto',
            // On mobile add extra bottom padding to clear the 60px bottom nav
            padding: isMobile() ? '16px 20px calc(60px + env(safe-area-inset-bottom, 16px) + 24px)' : '16px 20px 32px',
          }}>
            {children}
          </div>
        </div>
      )}
    </>
  );
}