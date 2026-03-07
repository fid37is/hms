// src/pages/LandingPage.jsx
// Miravance — "Advance Every Stay"
// Aesthetic: Editorial minimal. Ink + white dominant. Green is a single sharp accent.
// Layout: max-w-7xl (1280px) — full breathing room, nothing compressed.

import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Logo from '../components/brand/Logo';

/* ─── Palette ───────────────────────────────────────────────── */
const ink    = '#0D1A13';
const sub    = '#4A5E54';
const muted  = '#8A9E94';
const faint  = '#B8CCC4';
const border = '#E4EDE8';
const surface= '#F8FAF9';
const white  = '#FFFFFF';
const green  = '#166534';   // accent — used sparingly
const greenL = '#F0FDF4';   // very faint tint for selected states only

/* ─── Fonts ─────────────────────────────────────────────────── */
function Fonts() {
  useEffect(() => {
    if (document.getElementById('mv-gf')) return;
    const l = document.createElement('link');
    l.id = 'mv-gf'; l.rel = 'stylesheet';
    l.href = 'https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap';
    document.head.appendChild(l);
  }, []);
  return null;
}

/* ─── useInView ─────────────────────────────────────────────── */
function useInView() {
  const ref = useRef(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setOn(true); io.unobserve(el); } }, { rootMargin: '0px 0px -50px 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return [ref, on];
}

function Reveal({ children, delay = 0, style = {} }) {
  const [ref, on] = useInView();
  return (
    <div ref={ref} style={{ opacity: on ? 1 : 0, transform: on ? 'none' : 'translateY(24px)', transition: `opacity .6s ${delay}s ease, transform .6s ${delay}s ease`, ...style }}>
      {children}
    </div>
  );
}

/* ─── Container ─────────────────────────────────────────────── */
// max-w-7xl = 1280px, padding 0 48px each side
function Container({ children, style = {} }) {
  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 48px', ...style }}>
      {children}
    </div>
  );
}

/* ─── Dashboard mockup ──────────────────────────────────────── */
const SLIDES = ['Dashboard', 'Reservations', 'Housekeeping', 'Billing'];

function Badge({ label, color, bg }) {
  return <span style={{ display: 'inline-block', background: bg, color, fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 100, whiteSpace: 'nowrap' }}>{label}</span>;
}

function DashSlide({ k }) {
  return (
    <div key={k}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 12 }}>
        {[
          { l: 'Occupancy', v: '87%', d: '↑ 4%', hi: true },
          { l: 'In House',  v: '42',  d: '6 checking out' },
          { l: 'Arrivals',  v: '11',  d: '3 unassigned' },
          { l: 'Revenue',   v: '₦2.4M', d: '↑ 12%', hi: true },
        ].map((k, i) => (
          <div key={i} style={{ background: white, border: `1px solid ${border}`, borderRadius: 8, padding: '11px 13px', animation: `mvup .35s ${i * .07}s both` }}>
            <div style={{ fontSize: 10, color: muted, marginBottom: 3 }}>{k.l}</div>
            <div style={{ fontSize: 19, fontWeight: 700, letterSpacing: '-.02em', color: ink }}>{k.v}</div>
            <div style={{ fontSize: 10, color: k.hi ? green : muted, marginTop: 2 }}>{k.d}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div style={{ background: white, border: `1px solid ${border}`, borderRadius: 8, padding: '12px 14px', animation: 'mvup .35s .3s both' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: ink, marginBottom: 10 }}>Recent Reservations</div>
          {[
            ['Emeka Okafor',  '304', 'Checked In',  green,   greenL],
            ['Ngozi Adeyemi', '201', 'Confirmed',   '#1d4ed8','#eff6ff'],
            ['David Chen',    '112', 'Arriving',    '#b45309','#fffbeb'],
            ['Sarah Bello',   '408', 'Checked Out', muted,   surface],
          ].map(([n, r, s, c, bg], i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: i < 3 ? `1px solid ${surface}` : 'none', fontSize: 11 }}>
              <div><div style={{ fontWeight: 500, color: ink }}>{n}</div><div style={{ color: faint, fontSize: 10 }}>Rm {r}</div></div>
              <Badge label={s} color={c} bg={bg} />
            </div>
          ))}
        </div>
        <div style={{ background: white, border: `1px solid ${border}`, borderRadius: 8, padding: '12px 14px', animation: 'mvup .35s .37s both' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: ink, marginBottom: 12 }}>Revenue — 7 days</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5, height: 72 }}>
            {[40, 62, 50, 78, 95, 82, 66].map((h, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                <div style={{ width: '100%', borderRadius: '3px 3px 0 0', background: i === 4 ? green : border, height: `${h}%` }} />
                <div style={{ fontSize: 9, color: faint }}>{'MTWTFSS'[i]}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ResSlide({ k }) {
  const rows = [
    ['Emeka Okafor',  '304 — Deluxe',   'Mar 4', 'Mar 7', 'Checked In',  green,   greenL],
    ['Ngozi Adeyemi', '201 — Standard', 'Mar 5', 'Mar 8', 'Confirmed',   '#1d4ed8','#eff6ff'],
    ['David Chen',    '112 — Suite',    'Mar 5', 'Mar 9', 'Arriving',    '#b45309','#fffbeb'],
    ['Sarah Bello',   '408 — Deluxe',   'Mar 1', 'Mar 4', 'Checked Out', muted,   surface],
    ['Michael Eze',   '305 — Standard', 'Mar 6', 'Mar 8', 'Confirmed',   '#1d4ed8','#eff6ff'],
  ];
  return (
    <div key={k} style={{ animation: 'mvup .35s both' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {['All','In House','Arriving','Checked Out'].map((t, i) => (
            <span key={t} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 100, cursor: 'default', background: i === 0 ? ink : surface, color: i === 0 ? white : muted, fontWeight: i === 0 ? 600 : 400 }}>{t}</span>
          ))}
        </div>
        <span style={{ background: green, color: white, fontSize: 11, fontWeight: 500, padding: '5px 12px', borderRadius: 7, cursor: 'default' }}>+ New</span>
      </div>
      <div style={{ background: white, border: `1px solid ${border}`, borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr .8fr .8fr 1.3fr', padding: '8px 14px', background: surface, borderBottom: `1px solid ${border}` }}>
          {['Guest','Room','In','Out','Status'].map(h => <div key={h} style={{ fontSize: 9, fontWeight: 700, color: muted, textTransform: 'uppercase', letterSpacing: '.06em' }}>{h}</div>)}
        </div>
        {rows.map(([n, r, ci, co, s, c, bg], i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 2fr .8fr .8fr 1.3fr', padding: '9px 14px', borderBottom: i < 4 ? `1px solid ${surface}` : 'none', animation: `mvup .28s ${i * .06}s both` }}>
            <div style={{ fontSize: 12, fontWeight: 500, color: ink }}>{n}</div>
            <div style={{ fontSize: 11, color: muted }}>{r}</div>
            <div style={{ fontSize: 11, color: muted }}>{ci}</div>
            <div style={{ fontSize: 11, color: muted }}>{co}</div>
            <Badge label={s} color={c} bg={bg} />
          </div>
        ))}
      </div>
    </div>
  );
}

function HkSlide({ k }) {
  const tasks = [
    ['101','Full clean','Amaka O.','High','In Progress','#b45309','#fffbeb'],
    ['204','Turndown','Tunde A.','Normal','Pending','#1d4ed8','#eff6ff'],
    ['308','Deep clean','Chidi E.','High','Pending','#1d4ed8','#eff6ff'],
    ['412','Inspection','Ngozi B.','Low','Done', green, greenL],
    ['115','Restock','Fatima I.','Normal','Done', green, greenL],
  ];
  return (
    <div key={k} style={{ animation: 'mvup .35s both' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 9, marginBottom: 11 }}>
        {[['Total','18',ink],['In Progress','4','#b45309'],['Pending','9','#1d4ed8'],['Done','5',green]].map(([l,v,c],i)=>(
          <div key={i} style={{ background: white, border: `1px solid ${border}`, borderRadius: 8, padding: '10px 12px', textAlign: 'center', animation: `mvup .3s ${i*.07}s both` }}>
            <div style={{ fontSize: 19, fontWeight: 700, color: c }}>{v}</div>
            <div style={{ fontSize: 10, color: muted, marginTop: 2 }}>{l}</div>
          </div>
        ))}
      </div>
      <div style={{ background: white, border: `1px solid ${border}`, borderRadius: 8, overflow: 'hidden' }}>
        {tasks.map(([room, task, who, pri, status, c, bg], i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', borderBottom: i < 4 ? `1px solid ${surface}` : 'none', animation: `mvup .28s ${.18+i*.06}s both` }}>
            <div style={{ width: 32, height: 32, borderRadius: 7, background: surface, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: ink, flexShrink: 0 }}>{room}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: ink }}>{task}</div>
              <div style={{ fontSize: 10, color: muted }}>{who}</div>
            </div>
            <span style={{ fontSize: 10, fontWeight: 600, color: pri === 'High' ? '#b45309' : muted, marginRight: 4 }}>{pri}</span>
            <Badge label={status} color={c} bg={bg} />
          </div>
        ))}
      </div>
    </div>
  );
}

function BillSlide({ k }) {
  return (
    <div key={k} style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 10, animation: 'mvup .35s both' }}>
      <div style={{ background: white, border: `1px solid ${border}`, borderRadius: 8, padding: '14px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 11 }}>
          <div><div style={{ fontSize: 12, fontWeight: 600, color: ink }}>Folio #F-2091</div><div style={{ fontSize: 10, color: muted }}>Emeka Okafor · Room 304</div></div>
          <Badge label="Open" color={green} bg={greenL} />
        </div>
        {[['Room Rate × 3','₦135,000'],['Breakfast × 3','₦15,000'],['Airport Transfer','₦12,000'],['Mini-bar','₦4,500']].map(([d,a],i)=>(
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: i < 3 ? `1px solid ${surface}` : 'none', fontSize: 11 }}>
            <span style={{ color: muted }}>{d}</span><span style={{ fontWeight: 500, color: ink }}>{a}</span>
          </div>
        ))}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 9, paddingTop: 9, borderTop: `1.5px solid ${border}` }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: ink }}>Total</span>
          <span style={{ fontSize: 15, fontWeight: 700, color: green }}>₦166,500</span>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        <div style={{ background: white, border: `1px solid ${border}`, borderRadius: 8, padding: '12px 14px' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: ink, marginBottom: 9 }}>Payments</div>
          {[['Card','₦100,000','Mar 4'],['Transfer','₦50,000','Mar 5']].map(([m,a,d],i)=>(
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: i===0?`1px solid ${surface}`:'none', fontSize: 11 }}>
              <div><div style={{ fontWeight: 500, color: ink }}>{m}</div><div style={{ fontSize: 10, color: faint }}>{d}</div></div>
              <span style={{ color: green, fontWeight: 600 }}>{a}</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 6, fontSize: 11 }}>
            <span style={{ color: muted }}>Balance due</span>
            <span style={{ fontWeight: 700, color: '#dc2626' }}>₦16,500</span>
          </div>
        </div>
        <div style={{ background: ink, borderRadius: 8, padding: '14px 16px' }}>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,.5)', marginBottom: 3 }}>Revenue this month</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: white, letterSpacing: '-.02em' }}>₦4.8M</div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,.45)', marginTop: 2 }}>↑ 18% vs last month</div>
        </div>
      </div>
    </div>
  );
}

function DashMockup() {
  const [slide, setSlide] = useState(0);
  const [key, setKey] = useState(0);
  const NAV = ['Dashboard','Rooms','Reservations','Guests','Billing','Housekeeping','Inventory','Maintenance','Staff','Reports'];

  useEffect(() => {
    const t = setInterval(() => { setSlide(s => (s + 1) % 4); setKey(k => k + 1); }, 3800);
    return () => clearInterval(t);
  }, []);

  const jump = i => { setSlide(i); setKey(k => k + 1); };

  return (
    <div style={{ borderRadius: 16, overflow: 'hidden', border: `1px solid ${border}`, boxShadow: `0 2px 4px rgba(0,0,0,.04), 0 20px 64px rgba(13,26,19,.12)` }}>
      {/* Chrome */}
      <div style={{ height: 42, background: white, borderBottom: `1px solid ${border}`, display: 'flex', alignItems: 'center', gap: 7, padding: '0 16px' }}>
        {['#ff5f57','#febc2e','#28c840'].map(c => <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />)}
        <div style={{ marginLeft: 10, background: surface, border: `1px solid ${border}`, borderRadius: 5, padding: '3px 16px', fontSize: 11, color: faint }}>app.miravance.io</div>
      </div>
      {/* Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', height: 480 }}>
        {/* Sidebar — dark, brand */}
        <div style={{ background: '#0D2018', display: 'flex', flexDirection: 'column', padding: '16px 0' }}>
          <div style={{ padding: '0 14px 16px', borderBottom: '1px solid rgba(255,255,255,.07)', marginBottom: 6 }}>
            <Logo size="sm" theme="light" noLink />
          </div>
          {NAV.map(item => {
            const active = item === SLIDES[slide];
            return (
              <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', fontSize: 12, cursor: 'default', color: active ? white : 'rgba(255,255,255,.32)', background: active ? 'rgba(255,255,255,.07)' : 'transparent', borderRight: active ? `2px solid ${white}` : '2px solid transparent', transition: 'all .3s' }}>
                <div style={{ width: 3, height: 3, borderRadius: '50%', background: 'currentColor', flexShrink: 0 }} />
                {item}
              </div>
            );
          })}
        </div>
        {/* Main */}
        <div style={{ background: surface, display: 'flex', flexDirection: 'column' }}>
          <div style={{ background: white, borderBottom: `1px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', height: 42, flexShrink: 0 }}>
            <div style={{ display: 'flex' }}>
              {SLIDES.map((s, i) => (
                <button key={s} onClick={() => jump(i)} style={{ height: 42, padding: '0 13px', border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: 'DM Sans, system-ui, sans-serif', fontSize: 12, fontWeight: i === slide ? 600 : 400, color: i === slide ? ink : muted, borderBottom: i === slide ? `2px solid ${ink}` : '2px solid transparent', transition: 'all .2s' }}>{s}</button>
              ))}
            </div>
            <span style={{ fontSize: 11, color: faint }}>Amara · Admin</span>
          </div>
          <div style={{ flex: 1, padding: 14, overflow: 'hidden' }}>
            {slide === 0 && <DashSlide k={key} />}
            {slide === 1 && <ResSlide k={key} />}
            {slide === 2 && <HkSlide k={key} />}
            {slide === 3 && <BillSlide k={key} />}
          </div>
        </div>
      </div>
      {/* Progress */}
      <div style={{ height: 2, background: border, position: 'relative', overflow: 'hidden' }}>
        <div key={key} style={{ position: 'absolute', inset: '0 auto 0 0', background: ink, animation: 'mvprog 3.8s linear both' }} />
      </div>
    </div>
  );
}

/* ─── Icon ──────────────────────────────────────────────────── */
function Icon({ d, size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

/* ─── PricingCard ───────────────────────────────────────── */

const PRICES = {
  NGN: { symbol: '₦', monthly: 50000,  annual: 480000,  locale: 'en-NG' },
  USD: { symbol: '$', monthly: 29,      annual: 279,     locale: 'en-US' },
  GBP: { symbol: '£', monthly: 23,      annual: 220,     locale: 'en-GB' },
  EUR: { symbol: '€', monthly: 27,      annual: 259,     locale: 'en-DE' },
  GHS: { symbol: '₵', monthly: 450,     annual: 4320,    locale: 'en-GH' },
  KES: { symbol: 'KSh', monthly: 3800,  annual: 36500,   locale: 'en-KE' },
};

function useCurrency() {
  const [currency, setCurrency] = useState('USD');
  useEffect(() => {
    fetch('https://ipapi.co/json/')
      .then(r => r.json())
      .then(d => {
        const map = { NG:'NGN', US:'USD', GB:'GBP', DE:'EUR', FR:'EUR', GH:'GHS', KE:'KES' };
        const c = map[d.country_code];
        if (c && PRICES[c]) setCurrency(c);
      })
      .catch(() => {});
  }, []);
  return currency;
}

function fmt(amount, locale) {
  return amount.toLocaleString(locale, { maximumFractionDigits: 0 });
}

function PricingCard({ serif, sans, ink, sub, muted, border, surface, white, green, greenL, faint }) {
  const [annual, setAnnual] = useState(false);
  const currency = useCurrency();
  const p = PRICES[currency];

  const monthlyDisplay  = annual ? Math.round(p.annual / 12) : p.monthly;
  const annualDisplay   = p.annual;
  const saving          = p.monthly * 12 - p.annual;

  const feats = [
    { cat: 'Operations',  items: ['Reservations & check-in/out', 'Room management & rate plans', 'Billing, folios & payments', 'Housekeeping task management'] },
    { cat: 'Back office', items: ['Inventory & purchase orders', 'Maintenance & asset register', 'Staff, shifts & leave requests', 'Reports & revenue analytics'] },
    { cat: 'Guest-facing',items: ['Booking website included', 'Guest profiles & stay history', 'Real-time availability sync', 'Custom domain support'] },
    { cat: 'Platform',    items: ['Unlimited rooms & staff', 'Role-based access control', 'Fully isolated workspace', 'All future modules included'] },
  ];

  return (
    <Reveal>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center', maxWidth: 1100, margin: '0 auto' }}>

        {/* ── LEFT: what's included ── */}
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: green, letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 16 }}>
            Everything. One plan.
          </p>
          <h3 style={{ fontFamily: serif, fontSize: 'clamp(28px,3vw,40px)', fontWeight: 400, letterSpacing: '-.02em', color: ink, lineHeight: 1.1, marginBottom: 12 }}>
            Every module included<br /><em style={{ fontStyle: 'italic' }}>from day one.</em>
          </h3>
          <p style={{ fontSize: 16, color: sub, lineHeight: 1.72, marginBottom: 40, maxWidth: 400 }}>
            No starter tiers. No feature walls. No surprise add-ons. The full platform — yours for one flat monthly fee.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '28px 32px' }}>
            {feats.map(({ cat, items }) => (
              <div key={cat}>
                <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: muted, marginBottom: 12 }}>{cat}</p>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 9 }}>
                  {items.map(f => (
                    <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 9, fontSize: 13.5, color: sub, lineHeight: 1.45 }}>
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke={ink} strokeWidth="2.5" strokeLinecap="round" style={{ flexShrink: 0, marginTop: 1 }}><polyline points="3,8 6,11 13,5"/></svg>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* ── RIGHT: price card ── */}
        <div style={{ background: ink, borderRadius: 20, padding: '48px 44px', boxShadow: '0 24px 80px rgba(13,26,19,.2)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, opacity: .03, backgroundImage: 'linear-gradient(rgba(255,255,255,.8) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.8) 1px,transparent 1px)', backgroundSize: '32px 32px' }} />

          <div style={{ position: 'relative', zIndex: 1 }}>
            {/* Trial badge */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'rgba(22,101,52,.35)', border: '1px solid rgba(22,101,52,.5)', borderRadius: 100, padding: '5px 14px', marginBottom: 32 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: green, animation: 'mvpulse 2s infinite' }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: '#86efac', letterSpacing: '.06em', textTransform: 'uppercase' }}>14-day free trial</span>
            </div>

            {/* Toggle */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
              <button onClick={() => setAnnual(false)}
                style={{ fontSize: 13, fontWeight: !annual ? 600 : 400, color: !annual ? white : 'rgba(255,255,255,.35)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: sans }}>
                Monthly
              </button>
              <button onClick={() => setAnnual(a => !a)}
                style={{ width: 44, height: 24, borderRadius: 100, border: 'none', cursor: 'pointer', position: 'relative', background: annual ? green : 'rgba(255,255,255,.15)', transition: 'background .2s', flexShrink: 0 }}>
                <div style={{ position: 'absolute', top: 3, left: annual ? 23 : 3, width: 18, height: 18, borderRadius: '50%', background: white, transition: 'left .2s' }} />
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button onClick={() => setAnnual(true)}
                  style={{ fontSize: 13, fontWeight: annual ? 600 : 400, color: annual ? white : 'rgba(255,255,255,.35)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: sans }}>
                  Annual
                </button>
                {annual && (
                  <span style={{ fontSize: 11, fontWeight: 700, background: 'rgba(22,101,52,.3)', color: '#86efac', padding: '2px 9px', borderRadius: 100 }}>
                    2 months free
                  </span>
                )}
              </div>
            </div>

            {/* Price */}
            <div style={{ marginBottom: 6 }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, lineHeight: 1 }}>
                <span style={{ fontFamily: serif, fontSize: 76, fontWeight: 400, letterSpacing: '-.03em', color: white }}>
                  {p.symbol}{fmt(monthlyDisplay, p.locale)}
                </span>
                <span style={{ fontSize: 14, color: 'rgba(255,255,255,.35)', paddingBottom: 14 }}>/mo</span>
              </div>
            </div>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,.3)', marginBottom: 36 }}>
              {annual
                ? `Billed ${p.symbol}${fmt(annualDisplay, p.locale)} annually`
                : `Or ${p.symbol}${fmt(Math.round(p.annual / 12), p.locale)}/mo billed annually — save ${p.symbol}${fmt(saving, p.locale)}`}
            </p>

            <div style={{ height: 1, background: 'rgba(255,255,255,.1)', marginBottom: 32 }} />

            {/* What you get summary */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 11, marginBottom: 36 }}>
              {['All 10 modules, nothing locked', 'Unlimited rooms & staff accounts', 'Guest booking website included', 'No setup fees, cancel any time'].map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke={green} strokeWidth="2.5" strokeLinecap="round" style={{ flexShrink: 0 }}><polyline points="3,8 6,11 13,5"/></svg>
                  <span style={{ fontSize: 14, color: 'rgba(255,255,255,.72)' }}>{f}</span>
                </div>
              ))}
            </div>

            {/* CTA */}
            <Link to="/register" className="mv-cta" style={{ background: white, color: ink, fontSize: 16, padding: '14px', borderRadius: 10, display: 'flex', justifyContent: 'center', fontFamily: sans, fontWeight: 500 }}>
              Start free trial
              <svg width="13" height="13" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 8 }}><path d="M2.5 6h7M6.5 3l3 3-3 3"/></svg>
            </Link>
            <p style={{ textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,.2)', marginTop: 12 }}>No credit card required</p>
          </div>
        </div>

      </div>
    </Reveal>
  );
}

/* ══════════════════════════════════════════════════════════════
   PAGE
══════════════════════════════════════════════════════════════ */
export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, []);

  const serif = "'Instrument Serif', Georgia, serif";
  const sans  = "'DM Sans', system-ui, sans-serif";

  return (
    <div style={{ background: white, color: ink, fontFamily: sans, overflowX: 'hidden' }}>
      <Fonts />
      <style>{`
        @keyframes mvup   { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:none} }
        @keyframes mvfade { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:none} }
        @keyframes mvpulse{ 0%,100%{opacity:1} 50%{opacity:.3} }
        @keyframes mvprog { from{width:0} to{width:100%} }
        .mv-nav-link { text-decoration:none; color:${muted}; font-size:15px; transition:color .15s; }
        .mv-nav-link:hover { color:${ink}; }
        .mv-cta { display:inline-flex;align-items:center;gap:8px;background:${green};color:${white};
          font-family:${sans};font-weight:500;border-radius:9px;text-decoration:none;border:none;cursor:pointer;
          transition:opacity .15s, transform .15s; }
        .mv-cta:hover { opacity:.88; transform:translateY(-1px); }
        .mv-ghost { display:inline-flex;align-items:center;gap:8px;background:transparent;color:${ink};
          font-family:${sans};font-weight:400;border-radius:9px;text-decoration:none;border:1.5px solid ${border};cursor:pointer;
          transition:border-color .15s, background .15s; }
        .mv-ghost:hover { border-color:${ink}; background:${surface}; }
        .mv-feat-card { background:${white}; transition:background .15s; cursor:default; }
        .mv-feat-card:hover { background:${surface} !important; }
        .mv-mod-card  { border:1px solid ${border}; background:${white}; border-radius:12px; padding:24px 20px; cursor:default; transition:border-color .15s, transform .15s; }
        .mv-mod-card:hover { border-color:${ink}; transform:translateY(-2px); }
        .mv-testi { border:1px solid ${border}; border-radius:16px; background:${white}; padding:36px 32px; transition:border-color .15s; }
        .mv-testi:hover { border-color:${ink}; }
        .mv-fl { text-decoration:none; color:${muted}; font-size:15px; transition:color .15s; }
        .mv-fl:hover { color:${ink}; }
      `}</style>

      {/* ── NAV ─────────────────────────────────────────────── */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, background: 'rgba(255,255,255,.96)', backdropFilter: 'blur(16px)', borderBottom: `1px solid ${scrolled ? border : 'transparent'}`, transition: 'border-color .3s' }}>
        <Container style={{ height: 68, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Logo size="md" theme="dark" />
          <div style={{ display: 'flex', gap: 36 }}>
            {[['#features','Features'],['#modules','Modules'],['#saas','For Hotels'],['#pricing','Pricing']].map(([h,l]) => (
              <a key={h} href={h} className="mv-nav-link">{l}</a>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <Link to="/login" className="mv-nav-link" style={{ padding: '8px 14px' }}>Sign in</Link>
            <Link to="/register" className="mv-cta" style={{ fontSize: 15, padding: '9px 20px' }}>
              Start free trial
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 6h7M6.5 3l3 3-3 3"/></svg>
            </Link>
          </div>
        </Container>
      </nav>

      {/* ── HERO ────────────────────────────────────────────── */}
      <section style={{ paddingTop: 148, paddingBottom: 96, borderBottom: `1px solid ${border}` }}>
        <Container>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: 80, alignItems: 'center' }}>
            {/* Left */}
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, border: `1px solid ${border}`, borderRadius: 100, padding: '5px 14px', marginBottom: 32, animation: 'mvfade .5s ease both' }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: green, animation: 'mvpulse 2s infinite' }} />
                <span style={{ fontSize: 12, fontWeight: 500, color: muted, letterSpacing: '.06em', textTransform: 'uppercase' }}>Now open for hotels</span>
              </div>

              <h1 style={{ fontFamily: serif, fontSize: 'clamp(60px, 6.5vw, 96px)', fontWeight: 400, lineHeight: 1.0, letterSpacing: '-.03em', color: ink, marginBottom: 24, animation: 'mvfade .5s .08s ease both' }}>
                Advance<br />
                <em style={{ fontStyle: 'italic', color: green }}>every stay.</em>
              </h1>

              <p style={{ fontSize: 18, fontWeight: 300, color: sub, lineHeight: 1.72, marginBottom: 44, maxWidth: 440, animation: 'mvfade .5s .16s ease both' }}>
                Miravance gives your hotel complete visibility over every room, booking, guest, and department — so you can keep advancing, every single day.
              </p>

              <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 22, animation: 'mvfade .5s .24s ease both' }}>
                <Link to="/register" className="mv-cta" style={{ fontSize: 17, padding: '14px 32px', borderRadius: 10 }}>
                  Start your free trial
                  <svg width="13" height="13" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 6h7M6.5 3l3 3-3 3"/></svg>
                </Link>
                <a href="#features" className="mv-ghost" style={{ fontSize: 17, padding: '14px 24px', borderRadius: 10 }}>See features</a>
              </div>

              <p style={{ fontSize: 13, color: faint, animation: 'mvfade .5s .32s ease both' }}>
                <span style={{ color: ink, fontWeight: 500 }}>14-day free trial</span> · No credit card · Cancel anytime
              </p>
            </div>

            {/* Mockup */}
            <div style={{ animation: 'mvfade .7s .26s ease both' }}>
              <DashMockup />
            </div>
          </div>
        </Container>
      </section>

      {/* ── STATS ───────────────────────────────────────────── */}
      <div style={{ borderBottom: `1px solid ${border}` }}>
        <Container>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)' }}>
            {[['10+','Modules included'],['∞','Rooms on Pro'],['14','Days free'],['100%','Data privacy']].map(([n,l],i) => (
              <Reveal key={i} delay={i * .07}>
                <div style={{ padding: '48px 32px', textAlign: 'center', borderRight: i < 3 ? `1px solid ${border}` : 'none' }}>
                  <div style={{ fontFamily: serif, fontSize: 52, color: ink, lineHeight: 1, letterSpacing: '-.02em' }}>{n}</div>
                  <div style={{ fontSize: 14, color: muted, marginTop: 8 }}>{l}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </div>

      {/* ── PILLARS ─────────────────────────────────────────── */}
      <div style={{ padding: '104px 0', borderBottom: `1px solid ${border}` }}>
        <Container>
          <Reveal>
            <div style={{ textAlign: 'center', marginBottom: 72 }}>
              <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: muted, marginBottom: 16 }}>The Miravance Way</p>
              <h2 style={{ fontFamily: serif, fontSize: 'clamp(38px,4vw,58px)', fontWeight: 400, letterSpacing: '-.025em', color: ink, lineHeight: 1.06 }}>Built on three principles</h2>
            </div>
          </Reveal>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 2, background: border, border: `1px solid ${border}`, borderRadius: 16, overflow: 'hidden' }}>
            {[
              { n:'01', t:'Visibility', em:'Mira — to see clearly', d:'A real-time view of every room, booking, staff member, and revenue stream. No blind spots, no surprises.' },
              { n:'02', t:'Advancement', em:'Vance — always forward', d:'Tools that grow with your hotel — from your first room to your hundredth, from one property to a group.' },
              { n:'03', t:'Control', em:'One platform, zero chaos', d:'Every department — front desk, housekeeping, maintenance, billing — connected in one seamless system.' },
            ].map((p, i) => (
              <Reveal key={i} delay={i * .1}>
                <div style={{ background: white, padding: '52px 48px' }}>
                  <div style={{ fontFamily: serif, fontSize: 48, color: border, lineHeight: 1, marginBottom: 28 }}>{p.n}</div>
                  <div style={{ fontSize: 22, fontWeight: 600, color: ink, marginBottom: 6 }}>{p.t}</div>
                  <div style={{ fontSize: 13, color: green, fontStyle: 'italic', marginBottom: 16 }}>{p.em}</div>
                  <div style={{ fontSize: 16, color: sub, lineHeight: 1.72 }}>{p.d}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </div>

      {/* ── FEATURES ────────────────────────────────────────── */}
      <div id="features" style={{ padding: '104px 0', borderBottom: `1px solid ${border}` }}>
        <Container>
          <Reveal>
            <div style={{ marginBottom: 72 }}>
              <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: muted, marginBottom: 18 }}>Core platform</p>
              <h2 style={{ fontFamily: serif, fontSize: 'clamp(38px,4vw,58px)', fontWeight: 400, letterSpacing: '-.025em', color: ink, lineHeight: 1.06, marginBottom: 16 }}>
                Everything your hotel<br /><em style={{ fontStyle: 'italic' }}>needs to operate</em>
              </h2>
              <p style={{ fontSize: 18, color: sub, lineHeight: 1.72, maxWidth: 500 }}>One platform covering every department — so your team spends less time switching tools and more time with guests.</p>
            </div>
          </Reveal>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 1, background: border, border: `1px solid ${border}`, borderRadius: 16, overflow: 'hidden' }}>
            {[
              { icon:'M3 3h7v9H3zM14 3h7v5h-7zM14 12h7v9h-7zM3 16h7v5H3z', n:'Room Management', d:'Manage every room from a single view. Set types, rates, track status in real time, and upload photos to each room profile.', tags:['Room types','Rate plans','Photo gallery'] },
              { icon:'M3 4h18v18H3zM16 2v4M8 2v4M3 10h18', n:'Reservations', d:'Take bookings from any source, assign rooms, check guests in and out, and handle cancellations — one clean workflow.', tags:['Check-in / out','Room assignment','Cancellations'] },
              { icon:'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', n:'Guest Profiles', d:'Every guest gets a rich profile with stay history and loyalty points. Spot a returning VIP before they arrive.', tags:['Stay history','Loyalty points','ID on file'] },
              { icon:'M2 5h20v14H2zM2 10h20', n:'Billing & Folio', d:'Every charge, payment, and adjustment tracked on the guest folio. Close a bill in seconds at checkout.', tags:['Itemized charges','Multi-method pay','Shift reports'] },
              { icon:'M3 9l4-4 4 4 4-4 4 4v11H3z', n:'Housekeeping', d:'Assign tasks, track room status in real time, and manage lost-and-found items from one place your team uses daily.', tags:['Task assignment','Room status','Lost & found'] },
              { icon:'M4 7h16M4 12h16M4 17h10', n:'Inventory', d:'Keep stock under control. Get alerted before you run out. Raise purchase orders and track deliveries.', tags:['Stock alerts','Purchase orders','Suppliers'] },
              { icon:'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z', n:'Maintenance', d:'Log faults, assign technicians, track work orders from open to closed. Keep an asset register so nothing is missed.', tags:['Work orders','Asset register','Cost tracking'] },
              { icon:'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', n:'Staff & HR', d:'Manage your whole team from onboarding to shifts to leave requests. Grant each person exactly the access they need.', tags:['Departments','Shift scheduling','Leave requests'] },
              { icon:'M22 12h-4l-3 9L9 3l-3 9H2', n:'Reports & Analytics', d:'See revenue trends, occupancy rates, and performance at a glance. Pull detailed reports any time.', tags:['Revenue charts','Occupancy rate','Guest analytics'] },
            ].map((f, i) => (
              <Reveal key={i} delay={(i % 3) * .08}>
                <div className="mv-feat-card" style={{ padding: '44px 40px' }}>
                  <div style={{ width: 40, height: 40, background: surface, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 22, color: ink }}>
                    <Icon d={f.icon} size={19} />
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 600, color: ink, marginBottom: 10 }}>{f.n}</div>
                  <div style={{ fontSize: 15, color: sub, lineHeight: 1.7, marginBottom: 20 }}>{f.d}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                    {f.tags.map(t => <span key={t} style={{ fontSize: 12, color: muted, background: surface, border: `1px solid ${border}`, padding: '3px 11px', borderRadius: 100 }}>{t}</span>)}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </div>

      {/* ── MODULES ─────────────────────────────────────────── */}
      <div id="modules" style={{ background: surface, padding: '104px 0', borderBottom: `1px solid ${border}` }}>
        <Container>
          <Reveal>
            <div style={{ textAlign: 'center', marginBottom: 72 }}>
              <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: muted, marginBottom: 16 }}>All modules</p>
              <h2 style={{ fontFamily: serif, fontSize: 'clamp(38px,4vw,58px)', fontWeight: 400, letterSpacing: '-.025em', color: ink, lineHeight: 1.06 }}>
                One plan. <em style={{ fontStyle: 'italic' }}>Everything included.</em>
              </h2>
              <p style={{ fontSize: 17, color: sub, maxWidth: 480, margin: '16px auto 0', lineHeight: 1.7 }}>All 10 modules with every account — no add-ons, no upgrade walls.</p>
            </div>
          </Reveal>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 14 }}>
            {[
              { i:'M2 14V6l6-4 6 4v8M5 9h3v5', n:'Rooms', d:'Types, rates, availability.' },
              { i:'M3 4h18v18H3zM16 2v4M8 2v4M3 10h18', n:'Reservations', d:'Full booking lifecycle.' },
              { i:'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', n:'Guests', d:'Profiles, history, loyalty.' },
              { i:'M2 5h20v14H2zM2 10h20', n:'Billing', d:'Folios, payments, reports.' },
              { i:'M3 9l4-4 4 4 4-4 4 4v11H3z', n:'Housekeeping', d:'Tasks, status, lost & found.' },
              { i:'M4 7h16M4 12h16M4 17h10', n:'Inventory', d:'Stock, orders, suppliers.' },
              { i:'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z', n:'Maintenance', d:'Work orders, assets.' },
              { i:'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', n:'Staff & HR', d:'Team, shifts, leave.' },
              { i:'M22 12h-4l-3 9L9 3l-3 9H2', n:'Reports', d:'Revenue, analytics.' },
              { i:'M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4', n:'Settings', d:'Config, users, roles & access.' },
            ].map((m, i) => (
              <Reveal key={i} delay={(i % 5) * .06}>
                <div className="mv-mod-card">
                  <div style={{ width: 36, height: 36, background: white, border: `1px solid ${border}`, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14, color: ink }}>
                    <Icon d={m.i} size={16} />
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: ink, marginBottom: 5 }}>{m.n}</div>
                  <div style={{ fontSize: 12.5, color: muted, lineHeight: 1.6 }}>{m.d}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </div>

      {/* ── HOW IT WORKS ────────────────────────────────────── */}
      <div style={{ padding: '104px 0', borderBottom: `1px solid ${border}` }}>
        <Container>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 96, alignItems: 'start' }}>
            <div>
              <Reveal>
                <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: muted, marginBottom: 18 }}>Getting started</p>
                <h2 style={{ fontFamily: serif, fontSize: 'clamp(38px,4vw,58px)', fontWeight: 400, letterSpacing: '-.025em', color: ink, lineHeight: 1.06, marginBottom: 56 }}>
                  Up and running<br /><em style={{ fontStyle: 'italic' }}>in minutes</em>
                </h2>
              </Reveal>
              {[
                { n:'1', t:'Register your hotel', d:'Sign up in 60 seconds. Your workspace is created instantly — fully private to your property.' },
                { n:'2', t:'Set up hotel details', d:'Add your name, contact info, currency, check-in times, and tax rates.' },
                { n:'3', t:'Add room types and rooms', d:'Create categories with rates and amenities, then add individual rooms with photos.' },
                { n:'4', t:'Invite your team', d:'Add staff, assign departments, and set access levels — front desk, housekeeping, manager.' },
                { n:'5', t:'Connect your guest website', d:'Your booking website is automatically linked to your hotel via your unique subdomain. No API keys or technical setup needed.' },
              ].map((s, i) => (
                <Reveal key={i} delay={i * .07}>
                  <div style={{ display: 'flex', gap: 24, padding: '24px 0', borderBottom: i < 4 ? `1px solid ${border}` : 'none' }}>
                    <div style={{ fontFamily: serif, fontSize: 36, color: border, lineHeight: 1, flexShrink: 0, width: 32, paddingTop: 2 }}>{s.n}</div>
                    <div>
                      <div style={{ fontSize: 17, fontWeight: 600, color: ink, marginBottom: 6 }}>{s.t}</div>
                      <div style={{ fontSize: 15, color: sub, lineHeight: 1.68 }}>{s.d}</div>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
            <Reveal delay={.15}>
              <div style={{ position: 'sticky', top: 96, background: surface, border: `1px solid ${border}`, borderRadius: 16, padding: '36px 32px' }}>
                <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase', color: muted, marginBottom: 24 }}>Your setup checklist</p>
                {[
                  { l:'Hotel details configured', done: true },
                  { l:'Room types added', done: true },
                  { l:'Rooms added with photos', done: true },
                  { l:'Staff members added', done: false },
                  { l:'Booking website connected', done: false },
                ].map((c, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '12px 14px', background: white, border: `1px solid ${border}`, borderRadius: 9, marginBottom: 8, fontSize: 14, color: ink }}>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: c.done ? ink : white, border: c.done ? 'none' : `1.5px solid ${border}` }}>
                      {c.done && <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="2,5 4,7 8,3"/></svg>}
                    </div>
                    <span style={{ color: c.done ? sub : ink }}>{c.l}</span>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </Container>
      </div>

      {/* ── SAAS ────────────────────────────────────────────── */}
      <div id="saas" style={{ background: surface, padding: '104px 0', borderBottom: `1px solid ${border}` }}>
        <Container>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 96, alignItems: 'center' }}>
            <div>
              <Reveal>
                <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: muted, marginBottom: 18 }}>Built for SaaS</p>
                <h2 style={{ fontFamily: serif, fontSize: 'clamp(38px,4vw,54px)', fontWeight: 400, letterSpacing: '-.025em', color: ink, lineHeight: 1.06, marginBottom: 16 }}>
                  Your data.<br /><em style={{ fontStyle: 'italic' }}>Yours alone.</em>
                </h2>
                <p style={{ fontSize: 17, color: sub, lineHeight: 1.72, marginBottom: 40 }}>Every hotel gets a completely private workspace. Your guests, reservations, and revenue are never visible to another property.</p>
              </Reveal>
              {[
                { icon:'M3 11h18v11H3zM7 11V7a5 5 0 0 1 10 0v4', t:'Fully isolated workspace', d:"Your organisation's data is private at every level. No cross-contamination between properties." },
                { icon:'M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7', t:'Connect your booking website', d:'Your guest website is automatically linked via your unique subdomain. No API keys, no configuration — it works the moment you sign up.' },
                { icon:'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z', t:'Granular access control', d:'10 built-in roles from Front Desk to GM. Each staff member sees only what they need.' },
              ].map((f, i) => (
                <Reveal key={i} delay={i * .08}>
                  <div style={{ display: 'flex', gap: 16, marginBottom: 28 }}>
                    <div style={{ width: 38, height: 38, background: white, border: `1px solid ${border}`, borderRadius: 9, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 2, color: ink }}>
                      <Icon d={f.icon} size={17} />
                    </div>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 600, color: ink, marginBottom: 4 }}>{f.t}</div>
                      <div style={{ fontSize: 14, color: sub, lineHeight: 1.68 }}>{f.d}</div>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
            <Reveal delay={.15}>
              <div style={{ background: '#0D2018', borderRadius: 16, padding: '36px 40px' }}>
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,.3)', marginBottom: 24 }}>Your hotel, instantly online</div>

                {/* Subdomain pill */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 10, padding: '14px 18px', marginBottom: 12 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: green, flexShrink: 0, animation: 'mvpulse 2s infinite' }} />
                  <span style={{ fontFamily: "'SF Mono','Fira Code',monospace", fontSize: 14, color: '#90cdf4' }}>amarahotel.miravance.io</span>
                  <span style={{ marginLeft: 'auto', fontSize: 11, color: 'rgba(255,255,255,.25)' }}>Live</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24, padding: '0 4px' }}>
                  <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,.08)' }} />
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,.2)' }}>auto-connected</span>
                  <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,.08)' }} />
                </div>

                {/* What syncs */}
                {[
                  ['Room availability', 'Real-time'],
                  ['Room photos & rates', 'Always current'],
                  ['Guest bookings', 'Instant'],
                  ['Hotel config & branding', 'Automatic'],
                ].map(([label, tag], i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i < 3 ? '1px solid rgba(255,255,255,.06)' : 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke={green} strokeWidth="2.5" strokeLinecap="round"><polyline points="3,8 6,11 13,5"/></svg>
                      <span style={{ fontSize: 13, color: 'rgba(255,255,255,.7)' }}>{label}</span>
                    </div>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,.25)' }}>{tag}</span>
                  </div>
                ))}

                <div style={{ marginTop: 24, padding: '14px 16px', background: 'rgba(255,255,255,.04)', borderRadius: 8, fontSize: 12, color: 'rgba(255,255,255,.3)', fontStyle: 'italic', lineHeight: 1.6 }}>
                  No API keys. No environment variables.<br />Register → your website is live.
                </div>
              </div>
            </Reveal>
          </div>
        </Container>
      </div>

      {/* ── TESTIMONIALS ────────────────────────────────────── */}
      <div style={{ padding: '104px 0', borderBottom: `1px solid ${border}` }}>
        <Container>
          <Reveal>
            <div style={{ textAlign: 'center', marginBottom: 72 }}>
              <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: muted, marginBottom: 16 }}>From the field</p>
              <h2 style={{ fontFamily: serif, fontSize: 'clamp(38px,4vw,58px)', fontWeight: 400, letterSpacing: '-.025em', color: ink, lineHeight: 1.06 }}>
                Hotels that advance<br /><em style={{ fontStyle: 'italic' }}>with Miravance</em>
              </h2>
            </div>
          </Reveal>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24 }}>
            {[
              { q:"Check-in used to take 10 minutes of fumbling through spreadsheets. Now it's 90 seconds. The folio handles everything our accountants need at month end.", n:'Amara Okonkwo', r:'GM, Grand Palms Hotel', i:'AO' },
              { q:"The housekeeping module alone was worth it. Tasks are assigned the moment a room becomes free, and we haven't lost a single item from lost & found since we started.", n:'Kofi Boateng', r:'Operations Director, Accra Suites', i:'KB' },
              { q:"Our booking website shows live availability and real room photos automatically. Guests can browse and book directly — it all just works, no technical setup on our end.", n:'Fatima Ibrahim', r:'Owner, Heritage Boutique Hotel', i:'FI' },
            ].map((t, i) => (
              <Reveal key={i} delay={i * .1}>
                <div className="mv-testi">
                  <div style={{ fontFamily: serif, fontSize: 56, color: border, lineHeight: 1, marginBottom: 14 }}>"</div>
                  <p style={{ fontSize: 16, color: sub, lineHeight: 1.76, fontWeight: 300, marginBottom: 26 }}>{t.q}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: surface, border: `1px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600, color: ink }}>{t.i}</div>
                    <div><div style={{ fontSize: 14, fontWeight: 600, color: ink }}>{t.n}</div><div style={{ fontSize: 13, color: muted }}>{t.r}</div></div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </div>

      {/* ── PRICING ─────────────────────────────────────────── */}
      <div id="pricing" style={{ background: surface, padding: '104px 0', borderBottom: `1px solid ${border}` }}>
        <Container>
          <Reveal>
            <div style={{ textAlign: 'center', marginBottom: 72 }}>
              <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: muted, marginBottom: 16 }}>Pricing</p>
              <h2 style={{ fontFamily: serif, fontSize: 'clamp(38px,4vw,58px)', fontWeight: 400, letterSpacing: '-.025em', color: ink, lineHeight: 1.06 }}>
                Simple, honest <em style={{ fontStyle: 'italic' }}>pricing</em>
              </h2>
              <p style={{ fontSize: 17, color: sub, maxWidth: 480, margin: '16px auto 0', lineHeight: 1.7 }}>
                One plan. Every module. No add-ons, no upgrade walls, no surprises.
              </p>
            </div>
          </Reveal>

          {/* Billing toggle + card */}
          <PricingCard serif={serif} sans={sans} ink={ink} sub={sub} muted={muted} border={border} surface={surface} white={white} green={green} greenL={greenL} faint={faint} />
        </Container>
      </div>

      {/* ── CTA ─────────────────────────────────────────────── */}
      <Reveal>
        <Container style={{ padding: '0 48px 104px' }}>
          <div style={{ background: ink, borderRadius: 20, padding: '96px 72px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', inset: 0, opacity: .035, backgroundImage: 'linear-gradient(rgba(255,255,255,.8) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.8) 1px,transparent 1px)', backgroundSize: '44px 44px' }} />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <h2 style={{ fontFamily: serif, fontSize: 'clamp(44px,5vw,72px)', fontWeight: 400, letterSpacing: '-.03em', color: white, lineHeight: 1.04, marginBottom: 20 }}>
                Advance every stay,<br /><em style={{ fontStyle: 'italic', color: 'rgba(255,255,255,.4)' }}>starting today</em>
              </h2>
              <p style={{ fontSize: 18, fontWeight: 300, color: 'rgba(255,255,255,.45)', maxWidth: 480, margin: '0 auto 44px' }}>Sign up in 60 seconds. Your workspace is ready before you finish your coffee.</p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 20 }}>
                <Link to="/register" className="mv-cta" style={{ background: white, color: ink, fontSize: 17, padding: '14px 36px', borderRadius: 10 }}>
                  Start your free trial
                  <svg width="13" height="13" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 6h7M6.5 3l3 3-3 3"/></svg>
                </Link>
                <Link to="/login" style={{ fontSize: 17, color: 'rgba(255,255,255,.4)', padding: '14px 24px', textDecoration: 'none', borderRadius: 10, transition: 'color .15s, background .15s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,.06)'; e.currentTarget.style.color = 'rgba(255,255,255,.7)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,.4)'; }}>
                  Sign in to account
                </Link>
              </div>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,.22)' }}>No credit card required · Cancel any time</p>
            </div>
          </div>
        </Container>
      </Reveal>

      {/* ── FOOTER ──────────────────────────────────────────── */}
      <footer style={{ borderTop: `1px solid ${border}` }}>
        <Container style={{ padding: '64px 48px 48px', display: 'grid', gridTemplateColumns: '1.8fr 1fr 1fr 1fr', gap: 52 }}>
          <div>
            <Logo size="md" theme="dark" noLink style={{ marginBottom: 16 }} />
            <p style={{ fontSize: 14, color: muted, lineHeight: 1.76, maxWidth: 240, marginTop: 16 }}>The modern hotel management platform for independent properties and growing groups.</p>
            <p style={{ fontSize: 13, color: faint, marginTop: 14, fontStyle: 'italic' }}>Advance Every Stay</p>
          </div>
          {[
            { title:'Product', links:[['#features','Features'],['#modules','All Modules'],['#pricing','Pricing'],['/register','Sign up free']] },
            { title:'Modules', links:[['#modules','Rooms & Reservations'],['#modules','Billing & Folio'],['#modules','Housekeeping'],['#modules','Inventory & Maintenance'],['#modules','Staff & Reports']] },
            { title:'Company', links:[['#','About'],['#','Privacy Policy'],['#','Terms of Service'],['mailto:hello@miravance.io','Contact']] },
          ].map(col => (
            <div key={col.title}>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.09em', textTransform: 'uppercase', color: ink, marginBottom: 22 }}>{col.title}</p>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 14 }}>
                {col.links.map(([h, l]) => <li key={l}><a href={h} className="mv-fl">{l}</a></li>)}
              </ul>
            </div>
          ))}
        </Container>
        <Container style={{ padding: '20px 48px', borderTop: `1px solid ${border}`, display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, color: faint }}>© 2026 Miravance. All rights reserved.</span>
          <span style={{ fontSize: 13, color: faint }}>Built for modern hospitality.</span>
        </Container>
      </footer>
    </div>
  );
}