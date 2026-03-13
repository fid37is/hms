// hms/frontend/src/modules/settings/components/LayoutBuilder.jsx

import { useState, useEffect, useRef, useCallback } from 'react';

const FONT_PAIRS = {
  cormorant_dmsans:        { label: 'Cormorant + DM Sans',       display: '"Cormorant Garamond", serif', body: '"DM Sans", sans-serif'  },
  playfair_lato:           { label: 'Playfair Display + Lato',   display: '"Playfair Display", serif',   body: '"Lato", sans-serif'      },
  montserrat_merriweather: { label: 'Montserrat + Merriweather', display: '"Montserrat", sans-serif',    body: '"Merriweather", serif'   },
};

const DEFAULT_LAYOUT = {
  nav_style:      'transparent_scroll',
  hero_style:     'fullscreen',
  card_style:     'portrait',
  font_pair:      'cormorant_dmsans',
  section_order:  ['hero','booking_bar','intro','rooms','why_stay','story','offers','reviews','cta'],
  section_hidden: [],
};

const SECTION_META = {
  hero:        { label: 'Hero Banner',      icon: '⬛', desc: 'Full-width header with tagline',  required: true },
  booking_bar: { label: 'Booking Bar',      icon: '📅', desc: 'Sticky availability search'                      },
  intro:       { label: 'Welcome / Intro',  icon: '✦',  desc: 'Hotel positioning copy'                          },
  rooms:       { label: 'Rooms & Suites',   icon: '🛏',  desc: 'Room cards'                                     },
  why_stay:    { label: 'Why Stay Here',    icon: '★',  desc: 'Four feature pillars'                            },
  story:       { label: 'Experience Story', icon: '◧',  desc: 'Split image + service details'                   },
  offers:      { label: 'Featured Offers',  icon: '🏷',  desc: 'Promotional packages'                           },
  reviews:     { label: 'Guest Reviews',    icon: '💬', desc: 'Testimonials and rating'                         },
  cta:         { label: 'Reserve CTA',      icon: '→',  desc: '"Begin your stay" banner'                       },
};

const HERO_STYLES = [
  { id: 'fullscreen', label: 'Fullscreen', desc: 'Full viewport image with overlay text' },
  { id: 'split',      label: 'Split',      desc: '50/50 image and text side by side'      },
  { id: 'minimal',    label: 'Minimal',    desc: 'Brand color bg, no image'               },
];
const NAV_STYLES = [
  { id: 'transparent_scroll', label: 'Transparent → Solid', desc: 'Clear over hero, fills on scroll' },
  { id: 'solid',              label: 'Always Solid',         desc: 'Brand color, always visible'      },
  { id: 'minimal',            label: 'Minimal',              desc: 'White background, subtle shadow'  },
];
const CARD_STYLES = [
  { id: 'portrait',  label: 'Portrait Cards', desc: 'Tall 3:4 scroll cards' },
  { id: 'wide',      label: 'Wide Tiles',      desc: 'Landscape 16:9 tiles'  },
  { id: 'magazine',  label: 'Magazine Grid',   desc: 'Responsive grid'       },
];

function OptionCard({ selected, onClick, label, desc }) {
  return (
    <button type="button" onClick={onClick} style={{
      textAlign: 'left', padding: '10px 14px', width: '100%', cursor: 'pointer',
      border: `2px solid ${selected ? 'var(--brand, #1a1a1a)' : '#e5e7eb'}`,
      borderRadius: 8, transition: 'border-color 0.15s, background 0.15s',
      background: selected ? 'rgba(0,0,0,0.04)' : 'white',
    }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: selected ? 'var(--brand, #1a1a1a)' : '#374151' }}>{label}</div>
      <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{desc}</div>
    </button>
  );
}

function Label({ children }) {
  return <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6b7280', marginTop: 24, marginBottom: 8 }}>{children}</div>;
}

export default function LayoutBuilder({ value, onChange, previewUrl, currentColors }) {
  // ── Own internal state so UI responds immediately ─────────────────────────
  const [layout, setLayout] = useState(() => ({ ...DEFAULT_LAYOUT, ...value }));

  // Sync when parent resets (e.g. after data loads from server)
  useEffect(() => {
    setLayout({ ...DEFAULT_LAYOUT, ...value });
  }, [JSON.stringify(value)]);

  const update = useCallback((patch) => {
    setLayout(prev => {
      const next = { ...prev, ...patch };
      onChange(next);  // keep parent form in sync
      return next;
    });
  }, [onChange]);

  // ── Drag and drop ─────────────────────────────────────────────────────────
  const dragIdx     = useRef(null);
  const dragOverIdx = useRef(null);
  const [dragActive, setDragActive] = useState(null);

  const handleDragStart = (i)    => { dragIdx.current = i; setDragActive(i); };
  const handleDragEnd   = ()     => { setDragActive(null); };
  const handleDragOver  = (e, i) => { e.preventDefault(); dragOverIdx.current = i; };
  const handleDrop      = (e, i) => {
    e.preventDefault();
    const from = dragIdx.current;
    if (from === null || from === i) { setDragActive(null); return; }
    const next = [...layout.section_order];
    const [moved] = next.splice(from, 1);
    next.splice(i, 0, moved);
    dragIdx.current     = null;
    dragOverIdx.current = null;
    setDragActive(null);
    update({ section_order: next });
  };

  const toggleHidden = (id) => {
    const hidden = layout.section_hidden || [];
    update({ section_hidden: hidden.includes(id) ? hidden.filter(x => x !== id) : [...hidden, id] });
  };

  // ── Live preview via postMessage ──────────────────────────────────────────
  const iframeRef    = useRef(null);
  const [iframeReady, setIframeReady] = useState(false);
  const [previewWidth, setPreviewWidth] = useState('100%');

  const postPreview = useCallback((l = layout) => {
    iframeRef.current?.contentWindow?.postMessage({
      type:   'HMS_PREVIEW',
      layout: l,
      colors: currentColors,
    }, '*');
  }, [layout, currentColors]);

  // Push to iframe whenever layout changes
  useEffect(() => { if (iframeReady) postPreview(layout); }, [layout, iframeReady]);
  // Push colors whenever they change too
  useEffect(() => { if (iframeReady) postPreview(layout); }, [JSON.stringify(currentColors)]);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', height: 'calc(100vh - 200px)', minHeight: 600 }}>

      {/* ── Left: controls ──────────────────────────────────────────────── */}
      <div style={{ overflowY: 'auto', padding: '16px 16px 40px', borderRight: '1px solid #e5e7eb', background: '#fafafa' }}>

        <Label>Navigation Style</Label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {NAV_STYLES.map(s => <OptionCard key={s.id} selected={layout.nav_style === s.id} onClick={() => update({ nav_style: s.id })} label={s.label} desc={s.desc} />)}
        </div>

        <Label>Hero Style</Label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {HERO_STYLES.map(s => <OptionCard key={s.id} selected={layout.hero_style === s.id} onClick={() => update({ hero_style: s.id })} label={s.label} desc={s.desc} />)}
        </div>

        <Label>Room Card Style</Label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {CARD_STYLES.map(s => <OptionCard key={s.id} selected={layout.card_style === s.id} onClick={() => update({ card_style: s.id })} label={s.label} desc={s.desc} />)}
        </div>

        <Label>Typography</Label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {Object.entries(FONT_PAIRS).map(([id, p]) => (
            <OptionCard key={id} selected={layout.font_pair === id} onClick={() => update({ font_pair: id })}
              label={p.label}
              desc={`${p.display.split(',')[0].replace(/"/g,'')} · ${p.body.split(',')[0].replace(/"/g,'')}`}
            />
          ))}
        </div>

        <Label>Section Order & Visibility</Label>
        <p style={{ fontSize: 11, color: '#9ca3af', margin: '0 0 10px' }}>Drag to reorder · 👁 to hide</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {layout.section_order.map((id, i) => {
            const meta   = SECTION_META[id] || { label: id, icon: '▪', desc: '' };
            const fixed  = !!meta.required;
            const hidden = (layout.section_hidden || []).includes(id);
            const active = dragActive === i;
            return (
              <div key={id}
                draggable={!fixed}
                onDragStart={() => !fixed && handleDragStart(i)}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => handleDragOver(e, i)}
                onDrop={(e) => handleDrop(e, i)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 12px', borderRadius: 6, userSelect: 'none',
                  border: `1px solid ${active ? 'var(--brand,#1a1a1a)' : '#e5e7eb'}`,
                  background: active ? 'rgba(0,0,0,0.03)' : 'white',
                  opacity: hidden ? 0.4 : 1,
                  cursor: fixed ? 'default' : 'grab',
                  transition: 'opacity 0.2s, border-color 0.15s',
                }}
              >
                <span style={{ fontSize: 15, width: 20, textAlign: 'center', flexShrink: 0 }}>{meta.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#111', display: 'flex', alignItems: 'center', gap: 5 }}>
                    {meta.label}
                    {fixed && <span style={{ fontSize: 9, background: '#f3f4f6', color: '#9ca3af', padding: '1px 5px', borderRadius: 3 }}>FIXED</span>}
                  </div>
                  <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 1 }}>{meta.desc}</div>
                </div>
                {!fixed && (
                  <button type="button" onClick={() => toggleHidden(id)} title={hidden ? 'Show' : 'Hide'}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 15, padding: '2px 4px', lineHeight: 1, flexShrink: 0 }}>
                    {hidden ? '🙈' : '👁'}
                  </button>
                )}
                {!fixed && <span style={{ color: '#d1d5db', fontSize: 14, flexShrink: 0 }}>⠿</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Right: live preview ──────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', background: '#f3f4f6' }}>

        {/* Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: 'white', borderBottom: '1px solid #e5e7eb', flexShrink: 0 }}>
          <span style={{ fontSize: 12, color: '#6b7280', marginRight: 4 }}>Preview:</span>
          {[['100%','🖥 Desktop'],['768px','⬜ Tablet'],['390px','📱 Mobile']].map(([w, label]) => (
            <button key={w} type="button" onClick={() => setPreviewWidth(w)} style={{
              fontSize: 11, padding: '4px 10px', borderRadius: 4, cursor: 'pointer',
              border: '1px solid #e5e7eb',
              background: previewWidth === w ? 'var(--brand,#1a1a1a)' : 'white',
              color:      previewWidth === w ? 'white' : '#374151',
              transition: 'background 0.15s',
            }}>{label}</button>
          ))}
          <div style={{ flex: 1 }} />
          <span style={{ fontSize: 11, color: '#9ca3af' }}>
            {iframeReady ? 'Live preview — changes appear instantly' : 'Loading preview…'}
          </span>
        </div>

        {/* iframe container */}
        <div style={{ flex: 1, overflow: 'auto', display: 'flex', justifyContent: 'center', padding: previewWidth === '100%' ? 0 : 16, transition: 'padding 0.3s', position: 'relative' }}>
          {!iframeReady && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb', zIndex: 1 }}>
              <span style={{ fontSize: 13, color: '#6b7280' }}>Loading preview…</span>
            </div>
          )}
          <div style={{ width: previewWidth, transition: 'width 0.3s', display: 'flex', flex: previewWidth === '100%' ? 1 : undefined }}>
            <iframe
              ref={iframeRef}
              src={previewUrl || '/'}
              title="Hotel website preview"
              onLoad={() => { setIframeReady(true); setTimeout(() => postPreview(layout), 150); }}
              style={{ width: '100%', flex: 1, border: 'none', display: 'block', borderRadius: previewWidth === '100%' ? 0 : 8, boxShadow: previewWidth === '100%' ? 'none' : '0 4px 24px rgba(0,0,0,0.12)' }}
            />
          </div>
        </div>
      </div>

    </div>
  );
}