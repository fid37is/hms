// hms/frontend/src/modules/settings/pages/CustomizePage.jsx

import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import * as configApi from '../../../lib/api/configApi';
import toast from 'react-hot-toast';

// ── Constants ─────────────────────────────────────────────────────────────────
const FONT_PAIRS = {
  cormorant_dmsans:        { label: 'Cormorant + DM Sans',       sub: 'Luxury serif + clean sans'    },
  playfair_lato:           { label: 'Playfair Display + Lato',   sub: 'Editorial + readable'         },
  montserrat_merriweather: { label: 'Montserrat + Merriweather', sub: 'Bold headers + warm body'     },
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
  hero:        { label: 'Hero Banner',     desc: 'Full-width header',       required: true },
  booking_bar: { label: 'Booking Bar',     desc: 'Availability search'                     },
  intro:       { label: 'Welcome',         desc: 'Positioning copy'                        },
  rooms:       { label: 'Rooms & Suites',  desc: 'Room cards'                              },
  why_stay:    { label: 'Why Stay Here',   desc: 'Feature pillars'                         },
  story:       { label: 'Experience',      desc: 'Split image + details'                   },
  offers:      { label: 'Offers',          desc: 'Promotional packages'                    },
  reviews:     { label: 'Reviews',         desc: 'Guest testimonials'                      },
  cta:         { label: 'Reserve CTA',     desc: 'Call to action banner'                   },
};

const NAV_STYLES  = [
  { id: 'transparent_scroll', label: 'Transparent on hero, solid on scroll' },
  { id: 'solid',              label: 'Always solid'                          },
  { id: 'minimal',            label: 'White / minimal'                       },
];
const HERO_STYLES = [
  { id: 'fullscreen', label: 'Fullscreen image'          },
  { id: 'split',      label: 'Split — image + text'      },
  { id: 'minimal',    label: 'Minimal — brand color bg'  },
];
const CARD_STYLES = [
  { id: 'portrait',  label: 'Portrait cards (3:4)'  },
  { id: 'wide',      label: 'Wide tiles (16:9)'      },
  { id: 'magazine',  label: 'Magazine grid'          },
];

const COLOR_ROLES = [
  { key: 'primary_color', label: 'Primary',    hint: 'Nav, headings, footer'         },
  { key: 'accent_color',  label: 'Accent',     hint: 'Buttons, prices, highlights'   },
  { key: 'nav_color',     label: 'Navigation', hint: 'Default: same as Primary'      },
  { key: 'btn_color',     label: 'Button',     hint: 'Default: same as Primary'      },
  { key: 'footer_color',  label: 'Footer',     hint: 'Default: same as Primary'      },
  { key: 'surface_color', label: 'Cards',      hint: 'Default: white'                },
  { key: 'bg_color',      label: 'Page BG',    hint: 'Default: off-white'            },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function nullIfEmpty(v) { return v === '' ? null : v; }

// ── Sub-components ────────────────────────────────────────────────────────────
function PanelLabel({ children }) {
  return (
    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: 12 }}>
      {children}
    </div>
  );
}

function Radio({ options, value, onChange }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {options.map(opt => (
        <button key={opt.id} type="button" onClick={() => onChange(opt.id)} style={{
          textAlign: 'left', padding: '10px 12px', borderRadius: 8, cursor: 'pointer', border: 'none',
          background: value === opt.id ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.04)',
          color: value === opt.id ? 'white' : 'rgba(255,255,255,0.55)',
          fontSize: 13, transition: 'background 0.15s, color 0.15s',
          outline: value === opt.id ? '1px solid rgba(255,255,255,0.2)' : '1px solid transparent',
        }}>
          {opt.label}
          {opt.sub && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 3 }}>{opt.sub}</div>}
        </button>
      ))}
    </div>
  );
}

function ColorRow({ label, hint, value, onChange, optional }) {
  const isEmpty = !value || value === '';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      {/* Swatch + native picker */}
      <label style={{ position: 'relative', width: 32, height: 32, borderRadius: 6, flexShrink: 0, cursor: 'pointer',
        background: isEmpty ? 'rgba(255,255,255,0.08)' : value,
        border: '1px solid rgba(255,255,255,0.15)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {isEmpty && <span style={{ fontSize: 16, color: 'rgba(255,255,255,0.2)' }}>+</span>}
        <input type="color" value={isEmpty ? '#ffffff' : value} onChange={e => onChange(e.target.value)}
          style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }} />
      </label>

      {/* Labels */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 500, color: isEmpty ? 'rgba(255,255,255,0.4)' : 'white' }}>{label}</div>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginTop: 1 }}>{isEmpty ? hint : value.toUpperCase()}</div>
      </div>

      {/* Clear button for optional fields */}
      {optional && !isEmpty && (
        <button type="button" onClick={() => onChange('')}
          style={{ border: 'none', cursor: 'pointer', fontSize: 11, color: 'rgba(255,255,255,0.25)', padding: '2px 4px', flexShrink: 0 }}>
          ↺
        </button>
      )}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function CustomizePage() {
  const navigate    = useNavigate();
  const iframeRef   = useRef(null);
  const dragIdx     = useRef(null);
  const dragOverIdx = useRef(null);

  const HOTEL_URL = import.meta.env.VITE_HOTEL_URL || 'http://localhost:5174';

  const { data, isLoading } = useQuery({
    queryKey: ['hotel-config'],
    queryFn:  () => configApi.getConfig().then(r => r.data.data),
  });

  const [layout,       setLayout]       = useState({ ...DEFAULT_LAYOUT });
  const [colors,       setColors]       = useState({ primary_color: '#1a1a1a', accent_color: '#c9a96e', nav_color: '', btn_color: '', footer_color: '', surface_color: '', bg_color: '' });
  const [iframeReady,  setIframeReady]  = useState(false);
  const [previewWidth, setPreviewWidth] = useState('100%');
  const [activeTab,    setActiveTab]    = useState('colors');
  const [dragActive,   setDragActive]   = useState(null);
  const [collapsed,    setCollapsed]    = useState(false);

  useEffect(() => {
    if (!data) return;
    setLayout({ ...DEFAULT_LAYOUT, ...(data.layout || {}) });
    setColors({
      primary_color:  data.primary_color  || '#1a1a1a',
      accent_color:   data.accent_color   || '#c9a96e',
      nav_color:      data.nav_color      || '',
      btn_color:      data.btn_color      || '',
      footer_color:   data.footer_color   || '',
      surface_color:  data.surface_color  || '',
      bg_color:       data.bg_color       || '',
    });
  }, [data]);

  // ── Post to iframe ────────────────────────────────────────────────────────
  const postPreview = useCallback((l = layout, c = colors) => {
    iframeRef.current?.contentWindow?.postMessage({ type: 'HMS_PREVIEW', layout: l, colors: c }, '*');
  }, [layout, colors]);

  useEffect(() => { if (iframeReady) postPreview(layout, colors); }, [layout, colors, iframeReady]);

  const updateLayout = (patch) => setLayout(prev => ({ ...prev, ...patch }));
  const updateColor  = (key, val) => setColors(prev => ({ ...prev, [key]: val }));

  // ── Drag sections ─────────────────────────────────────────────────────────
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
    dragIdx.current = dragOverIdx.current = null;
    setDragActive(null);
    updateLayout({ section_order: next });
  };

  const toggleHidden = (id) => {
    const hidden = layout.section_hidden || [];
    updateLayout({ section_hidden: hidden.includes(id) ? hidden.filter(x => x !== id) : [...hidden, id] });
  };

  // ── Save ──────────────────────────────────────────────────────────────────
  const save = useMutation({
    mutationFn: () => configApi.updateConfig({
      ...data,
      ...colors,
      nav_color:     nullIfEmpty(colors.nav_color),
      btn_color:     nullIfEmpty(colors.btn_color),
      footer_color:  nullIfEmpty(colors.footer_color),
      surface_color: nullIfEmpty(colors.surface_color),
      bg_color:      nullIfEmpty(colors.bg_color),
      layout,
    }),
    onSuccess: () => toast.success('Saved & published'),
    onError:   () => toast.error('Save failed'),
  });

  // ── Reset to defaults ──────────────────────────────────────────────────────
  const reset = useMutation({
    mutationFn: () => configApi.updateConfig({
      ...data,
      primary_color: null, accent_color: null,
      nav_color: null, btn_color: null, footer_color: null,
      surface_color: null, bg_color: null,
      layout: DEFAULT_LAYOUT,
    }),
    onSuccess: () => {
      setLayout({ ...DEFAULT_LAYOUT });
      setColors({ primary_color: '#1a1a1a', accent_color: '#c9a96e', nav_color: '', btn_color: '', footer_color: '', surface_color: '', bg_color: '' });
      toast.success('Reset to defaults');
    },
    onError: () => toast.error('Reset failed'),
  });

  const handleReset = () => {
    if (!window.confirm('Reset all customizations to default? This cannot be undone.')) return;
    reset.mutate();
  };

  const TABS = [
    { id: 'colors',   label: 'Colors'   },
    { id: 'layout',   label: 'Layout'   },
    { id: 'sections', label: 'Sections' },
  ];

  if (isLoading) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#111', color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>
      Loading…
    </div>
  );

  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', zIndex: 9999, background: '#0d0d0d' }}>

      {/* ── Sidebar ───────────────────────────────────────────────────────── */}
      <div style={{
        width: collapsed ? 0 : 280,
        minWidth: collapsed ? 0 : 280,
        overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
        background: '#181818',
        transition: 'width 0.25s ease, min-width 0.25s ease',
        boxShadow: collapsed ? 'none' : '4px 0 32px rgba(0,0,0,0.5)',
        zIndex: 10,
      }}>

        {/* Header */}
        <div style={{ padding: '16px 18px 14px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'white', whiteSpace: 'nowrap' }}>Customize</span>
          <button type="button" onClick={() => navigate('/settings')}
            style={{ border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: 20, lineHeight: 1, padding: 0 }}>×</button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
          {TABS.map(tab => (
            <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} style={{
              flex: 1, padding: '11px 4px', fontSize: 11, fontWeight: 600,
              letterSpacing: '0.05em', textTransform: 'uppercase',
              background: 'none', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
              color: activeTab === tab.id ? 'white' : 'rgba(255,255,255,0.35)',
              borderBottom: `2px solid ${activeTab === tab.id ? 'white' : 'transparent'}`,
              transition: 'color 0.15s, border-color 0.15s',
            }}>{tab.label}</button>
          ))}
        </div>

        {/* Panel content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 18px 24px' }}>

          {/* ── Colors ──────────────────────────────────────────────────── */}
          {activeTab === 'colors' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div>
                <PanelLabel>Brand Colors</PanelLabel>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <ColorRow label="Primary"  hint="Nav, headings, footer"        value={colors.primary_color} onChange={v => updateColor('primary_color', v)} />
                  <ColorRow label="Accent"   hint="Buttons, prices, highlights"  value={colors.accent_color}  onChange={v => updateColor('accent_color', v)} />
                </div>
              </div>
              <div>
                <PanelLabel>Role Overrides</PanelLabel>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginBottom: 14, lineHeight: 1.5 }}>
                  Leave unset to auto-derive from Brand Colors.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {COLOR_ROLES.filter(r => !['primary_color','accent_color'].includes(r.key)).map(role => (
                    <ColorRow key={role.key} label={role.label} hint={role.hint}
                      value={colors[role.key]} onChange={v => updateColor(role.key, v)} optional />
                  ))}
                </div>
                {(colors.nav_color || colors.btn_color || colors.footer_color || colors.surface_color || colors.bg_color) && (
                  <button type="button"
                    onClick={() => setColors(c => ({ ...c, nav_color: '', btn_color: '', footer_color: '', surface_color: '', bg_color: '' }))}
                    style={{ marginTop: 16, background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: 'rgba(255,255,255,0.3)', padding: 0 }}>
                    ↺ Reset all overrides
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ── Layout ──────────────────────────────────────────────────── */}
          {activeTab === 'layout' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
              <div>
                <PanelLabel>Navigation</PanelLabel>
                <Radio options={NAV_STYLES} value={layout.nav_style} onChange={v => updateLayout({ nav_style: v })} />
              </div>
              <div>
                <PanelLabel>Hero</PanelLabel>
                <Radio options={HERO_STYLES} value={layout.hero_style} onChange={v => updateLayout({ hero_style: v })} />
              </div>
              <div>
                <PanelLabel>Room Cards</PanelLabel>
                <Radio options={CARD_STYLES} value={layout.card_style} onChange={v => updateLayout({ card_style: v })} />
              </div>
              <div>
                <PanelLabel>Typography</PanelLabel>
                <Radio
                  options={Object.entries(FONT_PAIRS).map(([id, p]) => ({ id, label: p.label, sub: p.sub }))}
                  value={layout.font_pair}
                  onChange={v => updateLayout({ font_pair: v })}
                />
              </div>
            </div>
          )}

          {/* ── Sections ────────────────────────────────────────────────── */}
          {activeTab === 'sections' && (
            <div>
              <PanelLabel>Page Sections</PanelLabel>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginBottom: 16, lineHeight: 1.6 }}>
                Drag to reorder. Click Show / Hide to toggle visibility.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {layout.section_order.map((id, i) => {
                  const meta   = SECTION_META[id] || { label: id, desc: '' };
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
                        padding: '10px 12px', borderRadius: 8, userSelect: 'none',
                        background: active ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${active ? 'rgba(255,255,255,0.2)' : 'transparent'}`,
                        opacity: hidden ? 0.35 : 1,
                        cursor: fixed ? 'default' : 'grab',
                        transition: 'opacity 0.2s, background 0.15s',
                      }}
                    >
                      {!fixed && <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 13, flexShrink: 0 }}>⠿</span>}
                      {fixed  && <span style={{ width: 16, flexShrink: 0 }} />}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 500, color: 'white' }}>{meta.label}</div>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{meta.desc}</div>
                      </div>
                      {fixed
                        ? <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.05em' }}>FIXED</span>
                        : <button type="button" onClick={() => toggleHidden(id)}
                            style={{ border: 'none', cursor: 'pointer', fontSize: 11, padding: '2px 6px', borderRadius: 4, flexShrink: 0,
                              color: hidden ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.5)',
                              background: 'rgba(255,255,255,0.06)',
                            }}>
                            {hidden ? 'Show' : 'Hide'}
                          </button>
                      }
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer — viewport toggles + save */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', padding: '14px 18px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', gap: 4 }}>
            {[['100%','Desktop'],['768px','Tablet'],['390px','Mobile']].map(([w, label]) => (
              <button key={w} type="button" onClick={() => setPreviewWidth(w)} style={{
                flex: 1, padding: '6px 4px', fontSize: 10, fontWeight: 600,
                letterSpacing: '0.04em', textTransform: 'uppercase',
                background: previewWidth === w ? 'rgba(255,255,255,0.12)' : 'transparent',
                border: '1px solid rgba(255,255,255,0.1)', borderRadius: 5,
                color: previewWidth === w ? 'white' : 'rgba(255,255,255,0.35)',
                cursor: 'pointer', transition: 'background 0.15s, color 0.15s',
              }}>{label}</button>
            ))}
          </div>
          <button type="button" onClick={() => save.mutate()} disabled={save.isPending} style={{
            width: '100%', padding: '11px', fontSize: 13, fontWeight: 600,
            background: 'white', color: '#111', border: 'none',
            borderRadius: 8, cursor: save.isPending ? 'not-allowed' : 'pointer',
            opacity: save.isPending ? 0.6 : 1, transition: 'opacity 0.2s',
          }}>
            {save.isPending ? 'Saving…' : 'Save & Publish'}
          </button>
          <button type="button" onClick={handleReset} disabled={reset.isPending} style={{
            width: '100%', padding: '10px', fontSize: 12, fontWeight: 500,
            background: 'transparent', color: 'rgba(255,255,255,0.45)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 8, cursor: reset.isPending ? 'not-allowed' : 'pointer',
            marginTop: 8, transition: 'color 0.2s, border-color 0.2s',
          }}
            onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255,100,100,0.9)'; e.currentTarget.style.borderColor = 'rgba(255,100,100,0.4)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.45)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; }}>
            {reset.isPending ? 'Resetting…' : '↺ Reset to Defaults'}
          </button>
        </div>
      </div>

      {/* ── Collapse toggle ───────────────────────────────────────────────── */}
      <button type="button" onClick={() => setCollapsed(c => !c)} style={{
        position: 'absolute',
        left: collapsed ? 0 : 280,
        top: '50%',
        transform: 'translateY(-50%)',
        zIndex: 20,
        width: 20,
        height: 48,
        background: '#181818',
        border: 'none',
        borderRadius: '0 6px 6px 0',
        cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'rgba(255,255,255,0.4)',
        fontSize: 10,
        transition: 'left 0.25s ease',
        boxShadow: '2px 0 8px rgba(0,0,0,0.3)',
      }}>
        {collapsed ? '›' : '‹'}
      </button>

      {/* ── iframe ───────────────────────────────────────────────────────── */}
      <div style={{
        flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'stretch',
        background: '#0d0d0d', overflow: 'hidden',
        padding: previewWidth === '100%' ? 0 : 16,
        transition: 'padding 0.3s',
      }}>
        <div style={{ width: previewWidth, transition: 'width 0.3s', display: 'flex', flex: previewWidth === '100%' ? 1 : undefined, position: 'relative' }}>
          {!iframeReady && (
            <div style={{ position: 'absolute', inset: 0, background: '#0d0d0d', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
              <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>Loading preview…</span>
            </div>
          )}
          <iframe
            ref={iframeRef}
            src={HOTEL_URL}
            title="Hotel website"
            onLoad={() => { setIframeReady(true); setTimeout(() => postPreview(layout, colors), 150); }}
            style={{
              width: '100%', flex: 1, border: 'none', display: 'block',
              borderRadius: previewWidth === '100%' ? 0 : 10,
              boxShadow: previewWidth === '100%' ? 'none' : '0 8px 48px rgba(0,0,0,0.6)',
            }}
          />
        </div>
      </div>

    </div>
  );
}