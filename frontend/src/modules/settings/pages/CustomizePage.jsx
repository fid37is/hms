import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation }       from '@tanstack/react-query';
import { useNavigate }                 from 'react-router-dom';
import * as configApi                  from '../../../lib/api/configApi';
import toast                           from 'react-hot-toast';
import {
  Eye, EyeOff, RotateCcw, ChevronUp, ChevronDown,
  ChevronRight, ChevronLeft, GripVertical, Trash2,
  Monitor, Tablet, Smartphone,
} from 'lucide-react';



const FONT_PAIRS = {
  cormorant_dmsans:        { label: 'Cormorant + DM Sans',       sub: 'Luxury serif + clean sans'  },
  playfair_lato:           { label: 'Playfair Display + Lato',   sub: 'Editorial + readable'       },
  montserrat_merriweather: { label: 'Montserrat + Merriweather', sub: 'Bold headers + warm body'   },
};

const NAV_STYLES = [
  { id: 'transparent_scroll', label: 'Transparent → Solid on scroll' },
  { id: 'solid',              label: 'Always solid'                   },
  { id: 'minimal',            label: 'White / minimal'                },
];

const HERO_STYLES = [
  { id: 'fullscreen', label: 'Fullscreen image'       },
  { id: 'split',      label: 'Split — image + text'   },
  { id: 'minimal',    label: 'Minimal — brand colour' },
];

const CARD_STYLES = [
  { id: 'portrait',  label: 'Portrait (3:4)'  },
  { id: 'wide',      label: 'Wide (16:9)'     },
  { id: 'magazine',  label: 'Magazine grid'   },
];

const DEFAULT_LAYOUT = {
  nav_style:      'transparent_scroll',
  hero_style:     'fullscreen',
  card_style:     'portrait',
  font_pair:      'cormorant_dmsans',
  section_order:  ['hero','booking_bar','rooms','why_stay','story','offers','events','reviews','cta'],
  section_hidden: [],
};

const ALL_SECTIONS = {
  hero:        { label: 'Hero Banner',      desc: 'Full-width header image',   required: true  },
  booking_bar: { label: 'Booking Bar',      desc: 'Check availability search', required: false },
  rooms:       { label: 'Rooms & Suites',   desc: 'Room type cards grid',      required: false },
  why_stay:    { label: 'Why Stay Here',    desc: 'Service tiles + pillars',   required: false },
  story:       { label: 'Our Story',        desc: 'Split image + copy',        required: false },
  offers:      { label: 'Special Offers',   desc: 'Package / rate cards',      required: false },
  events:      { label: 'Events & Venues',  desc: 'Venue grid + enquiry',      required: false },
  reviews:     { label: 'Guest Reviews',    desc: 'Testimonial cards',         required: false },
  cta:         { label: 'Reserve CTA',      desc: 'Full-width call to action', required: false },
  custom_1:    { label: 'Custom Section 1', desc: 'Free-form content block',   required: false },
  custom_2:    { label: 'Custom Section 2', desc: 'Free-form content block',   required: false },
};

const DEFAULT_CONTENT = {
  hero:     { eyebrow: '', headline: '', ctaLabel: 'Book Your Stay', ctaSecondary: 'Explore Rooms' },
  rooms:    { eyebrow: 'Accommodation', headline: 'Rooms & Suites', ctaLabel: 'View All Rooms' },
  why_stay: {
    eyebrow: 'The Experience', headline: 'Life at the Hotel',
    tiles: [
      { eyebrow: 'Wellness',   title: 'Spa & Rejuvenation',   to: '/wellness' },
      { eyebrow: 'Dining',     title: 'Culinary Experiences', to: '/dining'   },
      { eyebrow: 'Recreation', title: 'Pool & Leisure',       to: '/explore'  },
    ],
    pillars: [
      { title: 'Warm Hospitality', body: 'Our team anticipates every need — ensuring your stay is effortless.' },
      { title: 'Prime Location',   body: 'Situated at the heart of the city, close to business hubs.'         },
      { title: 'Curated for You',  body: 'Every moment is thoughtfully tailored to you.'                      },
    ],
  },
  story: {
    eyebrow: 'Our Story', headline: 'Designed for those', headlineSub: 'who expect more',
    body: '', ctaLabel: 'Explore the Hotel',
    links: [
      { label: 'Dining',    sub: 'West African cuisine, signature cocktails, and rooftop evenings.', to: '/dining'    },
      { label: 'Wellness',  sub: 'Spa treatments, pool, and rituals designed to restore.',           to: '/wellness'  },
      { label: 'Concierge', sub: 'Private transfers, city tours, tailored itineraries.',             to: '/concierge' },
    ],
  },
  offers: {
    eyebrow: 'Special Offers', headline: 'Packages & Rates', ctaLabel: 'All Offers', bookLabel: 'Book This Offer',
    items: [
      { tag: 'Leisure',   name: 'Weekend Escape',   desc: 'Arrive Friday, depart Monday — late checkout and breakfast included.',  rate: 8500000  },
      { tag: 'Corporate', name: 'Business Stay',    desc: 'Flexible check-in, high-speed Wi-Fi, and daily laundry included.',      rate: 9000000  },
      { tag: 'Couples',   name: 'Romantic Getaway', desc: 'Champagne on arrival, couples spa treatment, and dinner for two.',      rate: 12000000 },
    ],
  },
  events: {
    eyebrow: 'Events & Venues', headline: 'Host your next', headlineSub: 'unforgettable event.',
    body: 'From intimate boardroom meetings to grand ballroom weddings — our versatile venues bring every vision to life.',
    ctaLabel: 'Explore Venues & Enquire', bannerText: 'Our events team responds within 24 hours.', bannerCta: 'Send an Enquiry',
    venues: [
      { name: 'Grand Ballroom',      tag: 'Weddings & Galas',     cap: 'Up to 500 guests' },
      { name: 'Conference Hall',     tag: 'Corporate Events',     cap: 'Up to 200 guests' },
      { name: 'Executive Boardroom', tag: 'Meetings',             cap: 'Up to 30 guests'  },
      { name: 'Garden Terrace',      tag: 'Outdoor Celebrations', cap: 'Up to 150 guests' },
    ],
  },
  reviews:  { eyebrow: 'Guest Stories', headline: 'What Our Guests Say' },
  cta:      { eyebrow: 'Direct Booking · Best Rate Guaranteed', headline: 'Begin your', headlineSub: 'stay.', ctaLabel: 'Reserve a Room' },
  custom_1: { eyebrow: '', headline: 'Your Custom Section', subheading: '', body: '', ctaLabel: '', bgColor: '', layout: 'centered' },
  custom_2: { eyebrow: '', headline: 'Your Custom Section', subheading: '', body: '', ctaLabel: '', bgColor: '', layout: 'centered' },
};

const CARD_SCHEMAS = {
  hero:     { layout: [{ key: 'hero_style', label: 'Hero Style', options: HERO_STYLES }] },
  rooms:    { layout: [{ key: 'card_style', label: 'Card Style', options: CARD_STYLES }] },
  why_stay: {
    cards: { key: 'tiles', label: 'Service Tiles', itemLabel: i => i.title || 'Tile',
      fields: [
        { key: 'eyebrow', label: 'Eyebrow', placeholder: 'e.g. Wellness'           },
        { key: 'title',   label: 'Title',   placeholder: 'e.g. Spa & Rejuvenation' },
        { key: 'to',      label: 'Link',    placeholder: '/wellness'               },
      ], addDefault: { eyebrow: 'New', title: 'New Tile', to: '/' },
    },
    cards2: { key: 'pillars', label: 'Feature Pillars', itemLabel: i => i.title || 'Pillar',
      fields: [
        { key: 'title', label: 'Title',     placeholder: 'e.g. Warm Hospitality'       },
        { key: 'body',  label: 'Body text', placeholder: 'Short description', multiline: true },
      ], addDefault: { title: 'New Pillar', body: '' },
    },
  },
  story: {
    cards: { key: 'links', label: 'Feature Links', itemLabel: i => i.label || 'Link',
      fields: [
        { key: 'label', label: 'Label',    placeholder: 'e.g. Dining'       },
        { key: 'sub',   label: 'Sub-text', placeholder: 'Short description' },
        { key: 'to',    label: 'Link',     placeholder: '/dining'           },
      ], addDefault: { label: 'New Link', sub: '', to: '/' },
    },
  },
  offers: {
    cards: { key: 'items', label: 'Offer Cards', itemLabel: i => i.name || 'Offer',
      fields: [
        { key: 'tag',  label: 'Tag',         placeholder: 'e.g. Leisure'                   },
        { key: 'name', label: 'Name',        placeholder: 'e.g. Weekend Escape'             },
        { key: 'desc', label: 'Description', placeholder: "What's included…", multiline: true },
        { key: 'rate', label: 'Rate (kobo)', placeholder: '8500000', type: 'number'         },
      ], addDefault: { tag: 'New', name: 'New Package', desc: '', rate: 0 },
    },
  },
  events: {
    cards: { key: 'venues', label: 'Venue Cards', itemLabel: i => i.name || 'Venue',
      fields: [
        { key: 'name', label: 'Venue name', placeholder: 'e.g. Grand Ballroom'   },
        { key: 'tag',  label: 'Event type', placeholder: 'e.g. Weddings & Galas' },
        { key: 'cap',  label: 'Capacity',   placeholder: 'e.g. Up to 500 guests' },
      ], addDefault: { name: 'New Venue', tag: 'Events', cap: 'Up to 100 guests' },
    },
  },
};

function nullIfEmpty(v) { return (!v || v === '') ? null : v; }

function SectionLabel({ children }) {
  return (
    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.32)', marginBottom: 8 }}>
      {children}
    </div>
  );
}

function RadioGroup({ options, value, onChange }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      {options.map(opt => (
        <button key={opt.id} type="button" onClick={() => onChange(opt.id)} style={{
          textAlign: 'left', padding: '9px 12px', borderRadius: 7, cursor: 'pointer', border: 'none',
          background: value === opt.id ? 'rgba(255,255,255,0.13)' : 'rgba(255,255,255,0.04)',
          color: value === opt.id ? 'white' : 'rgba(255,255,255,0.5)', fontSize: 12,
          outline: value === opt.id ? '1px solid rgba(255,255,255,0.22)' : '1px solid transparent',
        }}>
          {opt.label}
          {opt.sub && <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.28)', marginTop: 2 }}>{opt.sub}</div>}
        </button>
      ))}
    </div>
  );
}

function ColorSwatch({ label, hint, value, onChange, optional }) {
  const empty = !value;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <label style={{
        position: 'relative', width: 30, height: 30, borderRadius: 6, flexShrink: 0, cursor: 'pointer',
        background: empty ? 'rgba(255,255,255,0.07)' : value, border: '1px solid rgba(255,255,255,0.14)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {empty && <span style={{ fontSize: 15, color: 'rgba(255,255,255,0.2)' }}>+</span>}
        <input type="color" value={empty ? '#ffffff' : value} onChange={e => onChange(e.target.value)}
          style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }} />
      </label>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12, fontWeight: 500, color: empty ? 'rgba(255,255,255,0.35)' : 'white' }}>{label}</div>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.22)', marginTop: 1 }}>{empty ? hint : value.toUpperCase()}</div>
      </div>
      {optional && !empty && (
        <button type="button" onClick={() => onChange('')}
          style={{ border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.22)', padding: '2px 4px', background: 'none', display: 'flex' }}>
          <RotateCcw size={11} />
        </button>
      )}
    </div>
  );
}

function TextInput({ value, onChange, placeholder, multiline, type = 'text' }) {
  const s = {
    width: '100%', boxSizing: 'border-box',
    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 6, padding: '8px 10px', fontSize: 12, color: 'white',
    fontFamily: 'inherit', outline: 'none', resize: multiline ? 'vertical' : 'none',
  };
  if (multiline) return (
    <textarea rows={3} value={value || ''} placeholder={placeholder}
      onChange={e => onChange(e.target.value)} style={s}
      onFocus={e => e.target.style.borderColor = 'rgba(255,255,255,0.32)'}
      onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
  );
  return (
    <input type={type} value={value || ''} placeholder={placeholder}
      onChange={e => onChange(e.target.value)} style={s}
      onFocus={e => e.target.style.borderColor = 'rgba(255,255,255,0.32)'}
      onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
  );
}

function FieldRow({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.36)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{label}</label>
      {children}
    </div>
  );
}

function CardArrayEditor({ schema, items = [], onChange }) {
  const [openIdx, setOpenIdx] = useState(null);
  const update = (i, k, v) => onChange(items.map((item, idx) => idx === i ? { ...item, [k]: v } : item));
  const remove = i => onChange(items.filter((_, idx) => idx !== i));
  const add    = () => { onChange([...items, { ...schema.addDefault }]); setOpenIdx(items.length); };
  const move   = (i, dir) => {
    const next = [...items]; const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]]; onChange(next);
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {items.map((item, i) => (
        <div key={i} style={{ border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 10px', background: 'rgba(255,255,255,0.04)', cursor: 'pointer' }}
            onClick={() => setOpenIdx(openIdx === i ? null : i)}>
            <span style={{ flex: 1, fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {schema.itemLabel(item)}
            </span>
            <button type="button" onClick={e => { e.stopPropagation(); move(i, -1); }} style={{ border: 'none', background: 'none', color: 'rgba(255,255,255,0.25)', cursor: 'pointer', padding: '0 3px', display: 'flex' }}><ChevronUp size={13} /></button>
            <button type="button" onClick={e => { e.stopPropagation(); move(i,  1); }} style={{ border: 'none', background: 'none', color: 'rgba(255,255,255,0.25)', cursor: 'pointer', padding: '0 3px', display: 'flex' }}><ChevronDown size={13} /></button>
            <button type="button" onClick={e => { e.stopPropagation(); remove(i); }} style={{ border: 'none', background: 'none', color: 'rgba(255,80,80,0.5)', cursor: 'pointer', padding: '0 3px', display: 'flex' }}><Trash2 size={13} /></button>
            <span style={{ color: 'rgba(255,255,255,0.25)', display: 'flex' }}>{openIdx === i ? <ChevronUp size={12} /> : <ChevronDown size={12} />}</span>
          </div>
          {openIdx === i && (
            <div style={{ padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 10, background: 'rgba(0,0,0,0.15)' }}>
              {schema.fields.map(f => (
                <FieldRow key={f.key} label={f.label}>
                  <TextInput value={item[f.key]} placeholder={f.placeholder} multiline={f.multiline} type={f.type || 'text'}
                    onChange={v => update(i, f.key, f.type === 'number' ? Number(v) : v)} />
                </FieldRow>
              ))}
            </div>
          )}
        </div>
      ))}
      <button type="button" onClick={add} style={{
        marginTop: 4, padding: '7px', borderRadius: 7,
        border: '1px dashed rgba(255,255,255,0.15)', background: 'none',
        color: 'rgba(255,255,255,0.35)', fontSize: 11, cursor: 'pointer',
      }}
        onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'; }}
        onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.35)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; }}>
        + Add {schema.label.replace(/s$/, '')}
      </button>
    </div>
  );
}

function SectionPanel({ id, content, onContentChange, layout, onLayoutChange }) {
  const schema = CARD_SCHEMAS[id];
  const c   = content[id] || {};
  const set = (key, val) => onContentChange(id, key, val);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)' }}>
        <p style={{ margin: 0, fontSize: 11, color: 'rgba(180,180,255,0.9)', lineHeight: 1.6 }}>
          Click any text in the preview to edit it directly.
        </p>
      </div>
      {schema?.layout?.length > 0 && (
        <div style={{ paddingBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <SectionLabel>Layout</SectionLabel>
          {schema.layout.map(opt => (
            <RadioGroup key={opt.key} options={opt.options}
              value={layout[opt.key] || opt.options[0]?.id}
              onChange={v => onLayoutChange({ [opt.key]: v })} />
          ))}
        </div>
      )}
      {schema?.cards && (
        <div>
          <SectionLabel>{schema.cards.label}</SectionLabel>
          <CardArrayEditor schema={schema.cards}
            items={c[schema.cards.key] || DEFAULT_CONTENT[id]?.[schema.cards.key] || []}
            onChange={arr => set(schema.cards.key, arr)} />
        </div>
      )}
      {schema?.cards2 && (
        <div>
          <SectionLabel>{schema.cards2.label}</SectionLabel>
          <CardArrayEditor schema={schema.cards2}
            items={c[schema.cards2.key] || DEFAULT_CONTENT[id]?.[schema.cards2.key] || []}
            onChange={arr => set(schema.cards2.key, arr)} />
        </div>
      )}
      {!schema?.layout && !schema?.cards && !schema?.cards2 && (
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', margin: 0 }}>
          Click any text in the preview to edit this section.
        </p>
      )}
      <button type="button"
        onClick={() => { const def = DEFAULT_CONTENT[id] || {}; Object.keys(def).forEach(k => onContentChange(id, k, def[k])); }}
        style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', fontSize: 10, color: 'rgba(255,255,255,0.22)', padding: 0 }}>
        <RotateCcw size={10} /> Reset to defaults
      </button>
    </div>
  );
}

export default function CustomizePage() {
  const navigate   = useNavigate();
  const previewRef = useRef(null);
  const dragIdx    = useRef(null);
  const dragOver   = useRef(null);

  const { data, isLoading } = useQuery({
    queryKey: ['hotel-config'],
    queryFn:  () => configApi.getConfig().then(r => r.data.data),
  });

  const [layout,        setLayout]        = useState({ ...DEFAULT_LAYOUT });
  const [colors,        setColors]        = useState({ primary_color: '#1a1a1a', accent_color: '#c9a96e', nav_color: '', btn_color: '', footer_color: '', surface_color: '', bg_color: '' });
  const [content,       setContent]       = useState(() => JSON.parse(JSON.stringify(DEFAULT_CONTENT)));
  const [activeSection, setActiveSection] = useState(null);
  const [activeTab,     setActiveTab]     = useState('sections');
  const [dragActive,    setDragActive]    = useState(null);
  const [collapsed,     setCollapsed]     = useState(false);
  const [showAdd,       setShowAdd]       = useState(false);
  const [previewWidth,  setPreviewWidth]  = useState('100%');

  useEffect(() => {
    if (!data) return;
    setLayout({ ...DEFAULT_LAYOUT, ...(data.layout || {}) });
    setColors({
      primary_color: data.primary_color || '#1a1a1a',
      accent_color:  data.accent_color  || '#c9a96e',
      nav_color:     data.nav_color     || '',
      btn_color:     data.btn_color     || '',
      footer_color:  data.footer_color  || '',
      surface_color: data.surface_color || '',
      bg_color:      data.bg_color      || '',
    });
    if (data.content) {
      setContent(prev => {
        const next = { ...prev };
        Object.keys(data.content).forEach(sid => { next[sid] = { ...(prev[sid] || {}), ...data.content[sid] }; });
        return next;
      });
    }
  }, [data]);

  useEffect(() => {
    if (!activeSection || !previewRef.current) return;
    const el = previewRef.current.querySelector(`[data-section="${activeSection}"], #${activeSection}`);
    if (el) previewRef.current.scrollTo({ top: el.offsetTop - 20, behavior: 'smooth' });
  }, [activeSection]);

  const updateLayout  = patch => setLayout(prev => ({ ...prev, ...patch }));
  const updateColor   = (key, val) => setColors(prev => ({ ...prev, [key]: val }));
  const updateContent = (sid, key, val) => setContent(prev => ({ ...prev, [sid]: { ...(prev[sid] || {}), [key]: val } }));

  const handleDragStart = i => { dragIdx.current = i; setDragActive(i); };
  const handleDragEnd   = () => setDragActive(null);
  const handleDragOver  = (e, i) => { e.preventDefault(); dragOver.current = i; };
  const handleDrop      = (e, i) => {
    e.preventDefault();
    const from = dragIdx.current;
    if (from === null || from === i) { setDragActive(null); return; }
    const next = [...layout.section_order];
    const [moved] = next.splice(from, 1);
    next.splice(i, 0, moved);
    dragIdx.current = dragOver.current = null;
    setDragActive(null);
    updateLayout({ section_order: next });
  };

  const toggleHidden  = (id, e) => {
    e?.stopPropagation?.();
    const h = layout.section_hidden || [];
    updateLayout({ section_hidden: h.includes(id) ? h.filter(x => x !== id) : [...h, id] });
  };
  const removeSection = (id, e) => {
    e?.stopPropagation?.();
    if (ALL_SECTIONS[id]?.required) return;
    updateLayout({ section_order: layout.section_order.filter(x => x !== id) });
    if (activeSection === id) setActiveSection(null);
  };
  const addSection = id => {
    if (layout.section_order.includes(id)) return;
    const order = [...layout.section_order];
    const ctaIdx = order.indexOf('cta');
    if (ctaIdx >= 0) order.splice(ctaIdx, 0, id); else order.push(id);
    updateLayout({ section_order: order });
    setShowAdd(false);
    setActiveSection(id);
  };

  const available = Object.keys(ALL_SECTIONS).filter(id => !layout.section_order.includes(id) && !ALL_SECTIONS[id].required);
  const isHidden  = id => (layout.section_hidden || []).includes(id);

  const save = useMutation({
    mutationFn: () => configApi.updateConfig({
      ...data, ...colors,
      nav_color:     nullIfEmpty(colors.nav_color),
      btn_color:     nullIfEmpty(colors.btn_color),
      footer_color:  nullIfEmpty(colors.footer_color),
      surface_color: nullIfEmpty(colors.surface_color),
      bg_color:      nullIfEmpty(colors.bg_color),
      layout, content,
    }),
    onSuccess: () => toast.success('Website saved and deployed!'),
    onError:   () => toast.error('Save failed — please try again'),
  });

  const reset = useMutation({
    mutationFn: () => configApi.updateConfig({
      ...data,
      primary_color: null, accent_color: null, nav_color: null, btn_color: null,
      footer_color: null, surface_color: null, bg_color: null,
      layout: DEFAULT_LAYOUT, content: DEFAULT_CONTENT,
    }),
    onSuccess: () => {
      setLayout({ ...DEFAULT_LAYOUT });
      setColors({ primary_color: '#1a1a1a', accent_color: '#c9a96e', nav_color: '', btn_color: '', footer_color: '', surface_color: '', bg_color: '' });
      const fresh = JSON.parse(JSON.stringify(DEFAULT_CONTENT));
      setContent(fresh);
      setActiveSection(null);
      syncContentToIframe(fresh);
      toast.success('Reset to defaults — click Save & Deploy to publish');
    },
    onError: () => toast.error('Reset failed'),
  });

  // ── iframe edit mode ─────────────────────────────────────────────────────
  // Generate a one-time token for this session and pass it to the iframe.
  // The hotel website validates it via postMessage before activating edit mode.
  const editToken  = useRef(Math.random().toString(36).slice(2));
  const iframeRef  = useRef(null);
  const [iframeReady, setIframeReady] = useState(false);

  const HOTEL_URL = import.meta.env.VITE_HOTEL_URL || 'http://localhost:5174';

  // Build the iframe src — appends the edit token so the hotel website
  // activates edit mode, and sends current colors/layout as HMS_PREVIEW
  const iframeSrc = `${HOTEL_URL}?hms_edit=${editToken.current}`;

  // Listen for messages from the iframe
  useEffect(() => {
    const handler = (e) => {
      if (!e.data?.type) return;

      // Hotel website is ready and requesting edit mode validation
      if (e.data.type === 'HMS_EDIT_REQUEST' && e.data.token === editToken.current) {
        setIframeReady(true);
        iframeRef.current?.contentWindow?.postMessage({
          type:    'HMS_EDIT_READY',
          token:   editToken.current,
          content, // send current saved content to the iframe
        }, '*');
      }

      // Hotel website reports a field was edited — sync into our state
      if (e.data.type === 'HMS_CONTENT_UPDATE') {
        const { sectionId, field, value } = e.data;
        updateContent(sectionId, field, value);
      }

      // Hotel website reports which section the admin activated
      if (e.data.type === 'HMS_SECTION_ACTIVE') {
        setActiveSection(e.data.sectionId);
      }

      // Hotel website reports editing done
      if (e.data.type === 'HMS_SECTION_DONE') {
        setActiveSection(null);
      }
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [content]);

  // When sidebar selects a section, tell the iframe to scroll to it
  useEffect(() => {
    if (!iframeReady || !activeSection) return;
    iframeRef.current?.contentWindow?.postMessage({
      type:      'HMS_SCROLL_TO',
      sectionId: activeSection,
    }, '*');
  }, [activeSection, iframeReady]);

  // When colors/layout change, push a live preview update to the iframe
  useEffect(() => {
    if (!iframeReady) return;
    iframeRef.current?.contentWindow?.postMessage({
      type:   'HMS_PREVIEW',
      colors,
      layout,
    }, '*');
  }, [colors, layout, iframeReady]);

  // When content is reset, sync the new defaults into the iframe
  const syncContentToIframe = (newContent) => {
    iframeRef.current?.contentWindow?.postMessage({
      type:    'HMS_CONTENT_SYNC',
      content: newContent,
    }, '*');
  };

  if (isLoading) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#111', color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>
      Loading…
    </div>
  );

  const activeMeta = activeSection ? ALL_SECTIONS[activeSection] : null;

  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', zIndex: 9999, background: '#0d0d0d' }}>

      {/* ── Sidebar ── */}
      <div style={{
        width: collapsed ? 0 : 300, minWidth: collapsed ? 0 : 300,
        overflow: 'hidden', display: 'flex', flexDirection: 'column',
        background: '#181818', transition: 'width 0.25s, min-width 0.25s',
        boxShadow: collapsed ? 'none' : '4px 0 24px rgba(0,0,0,0.5)', zIndex: 10,
      }}>
        <div style={{ padding: '14px 16px 12px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          {activeSection && (
            <button type="button" onClick={() => setActiveSection(null)}
              style={{ border: 'none', background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.55)', cursor: 'pointer', borderRadius: 5, padding: '4px 8px', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
              <ChevronLeft size={13} /> Back
            </button>
          )}
          <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {activeSection ? (activeMeta?.label || activeSection) : 'Customize'}
          </span>
          <button type="button" onClick={() => navigate('/settings')}
            style={{ border: 'none', color: 'rgba(255,255,255,0.28)', cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: 0, background: 'none', display: 'flex' }}>✕</button>
        </div>

        {activeSection ? (
          <>
            <div style={{ display: 'flex', gap: 6, padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
              <button type="button" onClick={e => toggleHidden(activeSection, e)} style={{
                flex: 1, padding: '7px 10px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.12)',
                background: isHidden(activeSection) ? 'rgba(255,200,100,0.12)' : 'rgba(255,255,255,0.06)',
                color: isHidden(activeSection) ? 'rgba(255,200,100,0.85)' : 'rgba(255,255,255,0.55)',
                fontSize: 11, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}>
                {isHidden(activeSection) ? <><Eye size={13} /> Show</> : <><EyeOff size={13} /> Hide</>}
              </button>
              {!ALL_SECTIONS[activeSection]?.required && (
                <button type="button" onClick={e => removeSection(activeSection, e)} style={{
                  padding: '7px 12px', borderRadius: 6, border: '1px solid rgba(255,60,60,0.2)',
                  background: 'rgba(255,60,60,0.08)', color: 'rgba(255,100,100,0.7)',
                  fontSize: 11, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
                }}>
                  <Trash2 size={12} /> Remove
                </button>
              )}
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
              <SectionPanel id={activeSection} content={content} onContentChange={updateContent}
                layout={layout} onLayoutChange={updateLayout} />
            </div>
          </>
        ) : (
          <>
            <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
              {[['sections', 'Sections'], ['colors', 'Colors'], ['typography', 'Typography']].map(([id, label]) => (
                <button key={id} type="button" onClick={() => setActiveTab(id)} style={{
                  flex: 1, padding: '10px 4px', fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: activeTab === id ? 'white' : 'rgba(255,255,255,0.32)',
                  borderBottom: `2px solid ${activeTab === id ? 'white' : 'transparent'}`,
                }}>{label}</button>
              ))}
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
              {activeTab === 'sections' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginBottom: 12, lineHeight: 1.6 }}>
                    Click a section in the preview or here to edit. Drag to reorder.
                  </p>
                  {layout.section_order.map((id, i) => {
                    const meta       = ALL_SECTIONS[id] || { label: id, desc: '' };
                    const fixed      = !!meta.required;
                    const sectHidden = isHidden(id);
                    return (
                      <div key={id}
                        draggable={!fixed}
                        onDragStart={() => !fixed && handleDragStart(i)}
                        onDragEnd={handleDragEnd}
                        onDragOver={e => handleDragOver(e, i)}
                        onDrop={e => handleDrop(e, i)}
                        onClick={() => { setActiveSection(id); iframeRef.current?.contentWindow?.postMessage({ type: 'HMS_SCROLL_TO', sectionId: id }, '*'); }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 8, padding: '9px 10px', borderRadius: 8,
                          background: dragActive === i ? 'rgba(255,255,255,0.1)' : activeSection === id ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.04)',
                          border: `1px solid ${dragActive === i ? 'rgba(255,255,255,0.2)' : activeSection === id ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.06)'}`,
                          opacity: sectHidden ? 0.4 : 1, cursor: fixed ? 'pointer' : 'grab', userSelect: 'none',
                        }}>
                        <span style={{ color: fixed ? 'transparent' : 'rgba(255,255,255,0.18)', display: 'flex' }}><GripVertical size={14} /></span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 500, color: sectHidden ? 'rgba(255,255,255,0.4)' : 'white', display: 'flex', alignItems: 'center', gap: 6 }}>
                            {meta.label}
                            {fixed && <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)' }}>FIXED</span>}
                          </div>
                          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.26)', marginTop: 1 }}>{meta.desc}</div>
                        </div>
                        {!fixed && (
                          <button type="button" onClick={e => toggleHidden(id, e)} style={{
                            border: '1px solid rgba(255,255,255,0.1)', borderRadius: 5, cursor: 'pointer', padding: '3px 8px',
                            background: sectHidden ? 'rgba(255,200,80,0.1)' : 'rgba(255,255,255,0.05)',
                            color: sectHidden ? 'rgba(255,200,80,0.8)' : 'rgba(255,255,255,0.4)',
                            fontSize: 10, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4,
                          }}>
                            {sectHidden ? <><Eye size={10} /> Show</> : <><EyeOff size={10} /> Hide</>}
                          </button>
                        )}
                        <span style={{ color: 'rgba(255,255,255,0.2)', display: 'flex' }}><ChevronRight size={14} /></span>
                      </div>
                    );
                  })}
                  {available.length > 0 && (
                    <div style={{ marginTop: 8 }}>
                      <button type="button" onClick={() => setShowAdd(v => !v)} style={{
                        width: '100%', padding: '8px', borderRadius: 8, border: '1px dashed rgba(255,255,255,0.15)',
                        background: 'none', color: 'rgba(255,255,255,0.35)', fontSize: 11, cursor: 'pointer',
                      }}
                        onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'; }}
                        onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.35)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; }}>
                        + Add Section
                      </button>
                      {showAdd && (
                        <div style={{ marginTop: 6, border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, overflow: 'hidden' }}>
                          {available.map(id => (
                            <button key={id} type="button" onClick={() => addSection(id)} style={{
                              width: '100%', textAlign: 'left', padding: '10px 12px',
                              background: 'rgba(255,255,255,0.03)', border: 'none',
                              borderBottom: '1px solid rgba(255,255,255,0.06)',
                              color: 'rgba(255,255,255,0.6)', cursor: 'pointer',
                            }}
                              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'white'; }}
                              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}>
                              <div style={{ fontSize: 12, fontWeight: 500 }}>{ALL_SECTIONS[id].label}</div>
                              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.28)', marginTop: 2 }}>{ALL_SECTIONS[id].desc}</div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'colors' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
                  <div>
                    <SectionLabel>Brand Colors</SectionLabel>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <ColorSwatch label="Primary" hint="Nav, headings, footer"       value={colors.primary_color} onChange={v => updateColor('primary_color', v)} />
                      <ColorSwatch label="Accent"  hint="Buttons, prices, highlights" value={colors.accent_color}  onChange={v => updateColor('accent_color', v)} />
                    </div>
                  </div>
                  <div>
                    <SectionLabel>Role Overrides</SectionLabel>
                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.22)', marginBottom: 12, lineHeight: 1.5 }}>Leave blank to auto-derive from Brand Colors.</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {[
                        { key: 'nav_color',     label: 'Navigation', hint: 'Default: Primary'   },
                        { key: 'btn_color',     label: 'Buttons',    hint: 'Default: Primary'   },
                        { key: 'footer_color',  label: 'Footer',     hint: 'Default: Primary'   },
                        { key: 'surface_color', label: 'Cards',      hint: 'Default: white'     },
                        { key: 'bg_color',      label: 'Page BG',    hint: 'Default: off-white' },
                      ].map(r => (
                        <ColorSwatch key={r.key} label={r.label} hint={r.hint} value={colors[r.key]} onChange={v => updateColor(r.key, v)} optional />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'typography' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  <div>
                    <SectionLabel>Font Pairing</SectionLabel>
                    <RadioGroup
                      options={Object.entries(FONT_PAIRS).map(([id, p]) => ({ id, label: p.label, sub: p.sub }))}
                      value={layout.font_pair} onChange={v => updateLayout({ font_pair: v })} />
                  </div>
                  <div>
                    <SectionLabel>Navigation Style</SectionLabel>
                    <RadioGroup options={NAV_STYLES} value={layout.nav_style} onChange={v => updateLayout({ nav_style: v })} />
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* Footer — viewport toggles + Save & Deploy */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', padding: '12px 16px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', gap: 4 }}>
            {[['100%', <Monitor size={12} />, 'Desktop'], ['768px', <Tablet size={12} />, 'Tablet'], ['390px', <Smartphone size={12} />, 'Mobile']].map(([w, icon, label]) => (
              <button key={w} type="button" onClick={() => setPreviewWidth(w)} style={{
                flex: 1, padding: '5px 4px', fontSize: 9, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase',
                background: previewWidth === w ? 'rgba(255,255,255,0.12)' : 'transparent',
                border: '1px solid rgba(255,255,255,0.1)', borderRadius: 5,
                color: previewWidth === w ? 'white' : 'rgba(255,255,255,0.3)',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
              }}>{icon}{label}</button>
            ))}
          </div>
          <button type="button" onClick={() => save.mutate()} disabled={save.isPending} style={{
            width: '100%', padding: '11px', fontSize: 13, fontWeight: 600,
            background: 'white', color: '#111', border: 'none', borderRadius: 8,
            cursor: save.isPending ? 'not-allowed' : 'pointer', opacity: save.isPending ? 0.6 : 1,
          }}>
            {save.isPending ? 'Deploying…' : 'Save & Deploy'}
          </button>
          <button type="button"
            onClick={() => { if (!window.confirm('Reset all customizations? This cannot be undone.')) return; reset.mutate(); }}
            disabled={reset.isPending} style={{
              width: '100%', padding: '9px', fontSize: 11, fontWeight: 500, background: 'transparent',
              color: 'rgba(255,255,255,0.38)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8,
              cursor: reset.isPending ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}
            onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255,80,80,0.9)'; e.currentTarget.style.borderColor = 'rgba(255,80,80,0.35)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.38)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }}>
            <RotateCcw size={11} /> {reset.isPending ? 'Resetting…' : 'Reset to Defaults'}
          </button>
        </div>
      </div>

      {/* ── Collapse toggle ── */}
      <button type="button" onClick={() => setCollapsed(c => !c)} style={{
        position: 'absolute', left: collapsed ? 0 : 300, top: '50%', transform: 'translateY(-50%)',
        zIndex: 20, width: 20, height: 48, background: '#181818', border: 'none',
        borderRadius: '0 6px 6px 0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'rgba(255,255,255,0.4)', transition: 'left 0.25s', boxShadow: '2px 0 8px rgba(0,0,0,0.3)',
      }}>
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>

      {/* ── Live preview iframe ── */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', background: '#0d0d0d', overflow: 'hidden', padding: previewWidth === '100%' ? 0 : 16 }}>
        <div style={{
          width: previewWidth, transition: 'width 0.3s', display: 'flex', flexDirection: 'column',
          borderRadius: previewWidth === '100%' ? 0 : 10, overflow: 'hidden',
          boxShadow: previewWidth === '100%' ? 'none' : '0 8px 48px rgba(0,0,0,0.6)',
          flex: previewWidth === '100%' ? 1 : undefined,
          position: 'relative',
        }}>
          {/* Loading overlay while iframe initialises */}
          {!iframeReady && (
            <div style={{
              position: 'absolute', inset: 0, zIndex: 5,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: '#fafaf8', flexDirection: 'column', gap: 12,
            }}>
              <div style={{ width: 32, height: 32, border: '3px solid rgba(99,102,241,0.2)', borderTopColor: 'rgba(99,102,241,0.8)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
              <p style={{ fontSize: 12, color: '#999', fontFamily: 'sans-serif', margin: 0 }}>Loading preview…</p>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          )}
          <iframe
            ref={iframeRef}
            src={iframeSrc}
            style={{ flex: 1, border: 'none', width: '100%', height: '100%', display: 'block', opacity: iframeReady ? 1 : 0, transition: 'opacity 0.3s' }}
            title="Hotel website preview"
          />
        </div>
      </div>

    </div>
  );
}