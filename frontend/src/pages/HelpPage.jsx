// src/pages/LandingPage.jsx
// Cierlo — "Your hotel, always on."
// Aesthetic: Dark-first premium hospitality. Warm amber accents on deep navy-charcoal.
// Nav + Hero + Stats + Footer: dark #0D0F14. Mid-sections: warm white/off-white.
// Mobile-first responsive throughout.

import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Logo from '../components/brand/cierlo_logo'
import DashboardDemo from '../components/marketing/DashboardDemo';
import PublicLayout from '../components/layout/PublicLayout';

/* ─── Single consistent dark ────────────────────────────────── */
const dark    = '#0D0F14';   // ONE dark — nav, hero, stats, footer, CTA
const darkSub = '#1A1D24';   // cards/surfaces on dark bg
const darkBrd = 'rgba(255,255,255,0.08)';

/* ─── Light section palette ─────────────────────────────────── */
const ink    = '#0D0F14';
const sub    = '#4B5563';
const muted  = '#9CA3AF';
const faint  = '#D1D5DB';
const border = '#E5E7EB';
const surface= '#F9FAFB';
const white  = '#FFFFFF';

/* ─── Brand accent ──────────────────────────────────────────── */
const amber  = '#D97706';
const amberL = '#FEF3C7';
const amberG = 'linear-gradient(135deg,#F59E0B,#D97706)';

/* ─── Fonts ─────────────────────────────────────────────────── */
function Fonts() {
  useEffect(() => {
    if (document.getElementById('cl-gf')) return;
    const l = document.createElement('link');
    l.id = 'cl-gf'; l.rel = 'stylesheet';
    l.href = 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400;1,600&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap';
    document.head.appendChild(l);
  }, []);
  return null;
}

const serif = "'Cormorant Garamond', Georgia, serif";
const sans  = "'DM Sans', system-ui, sans-serif";

/* ─── useInView ─────────────────────────────────────────────── */
function useInView(offset = '-60px') {
  const ref = useRef(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setOn(true); io.unobserve(el); } },
      { rootMargin: `0px 0px ${offset} 0px` }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return [ref, on];
}

function Reveal({ children, delay = 0, style = {} }) {
  const [ref, on] = useInView();
  return (
    <div ref={ref} style={{
      opacity: on ? 1 : 0,
      transform: on ? 'none' : 'translateY(28px)',
      transition: `opacity .65s ${delay}s ease, transform .65s ${delay}s ease`,
      ...style
    }}>
      {children}
    </div>
  );
}

/* ─── Container ─────────────────────────────────────────────── */
function Container({ children, style = {} }) {
  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', ...style }}>
      {children}
    </div>
  );
}

/* ─── Badge ─────────────────────────────────────────────────── */
function Badge({ label, color, bg }) {
  return (
    <span style={{ display:'inline-block', background:bg, color, fontSize:10, fontWeight:600, padding:'2px 7px', borderRadius:100, whiteSpace:'nowrap' }}>
      {label}
    </span>
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

/* ─── Pricing ───────────────────────────────────────────────── */
const PRICES = {
  NGN: { symbol:'₦',   monthly:50000, annual:480000, locale:'en-NG' },
  USD: { symbol:'$',   monthly:29,    annual:279,    locale:'en-US' },
  GBP: { symbol:'£',   monthly:23,    annual:220,    locale:'en-GB' },
  EUR: { symbol:'€',   monthly:27,    annual:259,    locale:'en-DE' },
  GHS: { symbol:'₵',   monthly:450,   annual:4320,   locale:'en-GH' },
  KES: { symbol:'KSh', monthly:3800,  annual:36500,  locale:'en-KE' },
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
  return amount.toLocaleString(locale, { maximumFractionDigits:0 });
}

function PricingSection() {
  const [annual, setAnnual] = useState(false);
  const currency = useCurrency();
  const p = PRICES[currency];
  const monthlyDisplay = annual ? Math.round(p.annual/12) : p.monthly;
  const saving = p.monthly*12 - p.annual;

  const feats = [
    { cat:'Operations',   items:['Reservations & check-in/out','Room management & rate plans','Billing, folios & payments','Housekeeping task management'] },
    { cat:'Back office',  items:['Inventory & purchase orders','Maintenance & asset register','Staff, shifts & leave requests','Reports & revenue analytics'] },
    { cat:'Guest-facing', items:['Booking website included','Guest profiles & stay history','Real-time availability sync','Custom domain support'] },
    { cat:'Platform',     items:['Unlimited rooms & staff','Role-based access control','Fully isolated workspace','All future modules included'] },
  ];

  return (
    <div id="pricing" style={{ background:dark, padding:'96px 0' }}>
      <style>{`
        @media(max-width:768px) {
          .cl-pricing-grid { grid-template-columns: 1fr !important; gap: 40px !important; }
          .cl-pricing-feats { grid-template-columns: 1fr 1fr !important; }
        }
        @media(max-width:480px) {
          .cl-pricing-feats { grid-template-columns: 1fr !important; }
        }
      `}</style>
      <Container>
        <Reveal>
          <div style={{ textAlign:'center', marginBottom:64 }}>
            <p style={{ fontSize:11, fontWeight:600, letterSpacing:'.12em', textTransform:'uppercase', color:amber, marginBottom:14 }}>Pricing</p>
            <h2 style={{ fontFamily:serif, fontSize:'clamp(36px,4vw,56px)', fontWeight:400, letterSpacing:'-.025em', color:white, lineHeight:1.06, marginBottom:12 }}>
              Simple, honest <em style={{ fontStyle:'italic', color:'rgba(255,255,255,.4)' }}>pricing</em>
            </h2>
            <p style={{ fontSize:17, color:'rgba(255,255,255,.45)', maxWidth:440, margin:'0 auto', lineHeight:1.7 }}>
              One plan. Every module. No add-ons, no upgrade walls, no surprises.
            </p>
          </div>
        </Reveal>

        <Reveal delay={.1}>
          <div className="cl-pricing-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:48, alignItems:'center', maxWidth:1000, margin:'0 auto' }}>
            {/* Left: features */}
            <div>
              <p style={{ fontSize:12, fontWeight:600, color:amber, letterSpacing:'.06em', textTransform:'uppercase', marginBottom:14 }}>Everything. One plan.</p>
              <h3 style={{ fontFamily:serif, fontSize:'clamp(26px,3vw,38px)', fontWeight:400, color:white, lineHeight:1.1, marginBottom:10 }}>
                Every module included<br /><em style={{ fontStyle:'italic', color:'rgba(255,255,255,.35)' }}>from day one.</em>
              </h3>
              <p style={{ fontSize:15, color:'rgba(255,255,255,.45)', lineHeight:1.72, marginBottom:36, maxWidth:380 }}>
                No starter tiers. No feature walls. The full platform — one flat monthly fee.
              </p>
              <div className="cl-pricing-feats" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'22px 28px' }}>
                {feats.map(({ cat, items }) => (
                  <div key={cat}>
                    <p style={{ fontSize:10, fontWeight:700, letterSpacing:'.08em', textTransform:'uppercase', color:'rgba(255,255,255,.3)', marginBottom:10 }}>{cat}</p>
                    <ul style={{ listStyle:'none', display:'flex', flexDirection:'column', gap:7 }}>
                      {items.map(f => (
                        <li key={f} style={{ display:'flex', alignItems:'flex-start', gap:8, fontSize:13, color:'rgba(255,255,255,.55)', lineHeight:1.4 }}>
                          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke={amber} strokeWidth="2.5" strokeLinecap="round" style={{ flexShrink:0, marginTop:2 }}><polyline points="3,8 6,11 13,5"/></svg>
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: price card */}
            <div style={{ background:darkSub, borderRadius:16, padding:'40px 36px', border:`1px solid ${darkBrd}`, position:'relative', overflow:'hidden' }}>
              <div style={{ position:'absolute', top:-40, right:-40, width:180, height:180, borderRadius:'50%', background:'rgba(217,119,6,.07)', filter:'blur(40px)', pointerEvents:'none' }} />
              <div style={{ position:'relative', zIndex:1 }}>
                {/* Trial badge */}
                <div style={{ display:'inline-flex', alignItems:'center', gap:6, background:'rgba(217,119,6,.15)', border:'1px solid rgba(217,119,6,.3)', borderRadius:100, padding:'4px 12px', marginBottom:28 }}>
                  <div style={{ width:5, height:5, borderRadius:'50%', background:amber, animation:'clpulse 2s infinite' }} />
                  <span style={{ fontSize:10, fontWeight:600, color:'#FDE68A', letterSpacing:'.06em', textTransform:'uppercase' }}>14-day free trial</span>
                </div>

                {/* Toggle */}
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:24 }}>
                  <button onClick={() => setAnnual(false)} style={{ fontSize:13, fontWeight:!annual?600:400, color:!annual?white:'rgba(255,255,255,.3)', background:'none', border:'none', cursor:'pointer', padding:0, fontFamily:sans }}>Monthly</button>
                  <button onClick={() => setAnnual(a => !a)} style={{ width:40, height:22, borderRadius:100, border:'none', cursor:'pointer', position:'relative', background:annual?amber:'rgba(255,255,255,.12)', transition:'background .2s', flexShrink:0 }}>
                    <div style={{ position:'absolute', top:3, left:annual?21:3, width:16, height:16, borderRadius:'50%', background:white, transition:'left .2s' }} />
                  </button>
                  <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                    <button onClick={() => setAnnual(true)} style={{ fontSize:13, fontWeight:annual?600:400, color:annual?white:'rgba(255,255,255,.3)', background:'none', border:'none', cursor:'pointer', padding:0, fontFamily:sans }}>Annual</button>
                    {annual && <span style={{ fontSize:10, fontWeight:700, background:'rgba(217,119,6,.2)', color:'#FDE68A', padding:'2px 8px', borderRadius:100 }}>2 months free</span>}
                  </div>
                </div>

                {/* Price */}
                <div style={{ marginBottom:4 }}>
                  <div style={{ display:'flex', alignItems:'flex-end', gap:5, lineHeight:1 }}>
                    <span style={{ fontFamily:serif, fontSize:68, fontWeight:400, letterSpacing:'-.03em', color:white }}>{p.symbol}{fmt(monthlyDisplay, p.locale)}</span>
                    <span style={{ fontSize:13, color:'rgba(255,255,255,.3)', paddingBottom:12 }}>/mo</span>
                  </div>
                </div>
                <p style={{ fontSize:12, color:'rgba(255,255,255,.25)', marginBottom:28 }}>
                  {annual ? `Billed ${p.symbol}${fmt(p.annual, p.locale)} annually` : `Or ${p.symbol}${fmt(Math.round(p.annual/12), p.locale)}/mo billed annually — save ${p.symbol}${fmt(saving, p.locale)}`}
                </p>

                <div style={{ height:1, background:darkBrd, marginBottom:24 }} />

                <div style={{ display:'flex', flexDirection:'column', gap:9, marginBottom:28 }}>
                  {['All 10 modules, nothing locked','Unlimited rooms & staff accounts','Guest booking website included','No setup fees, cancel any time'].map(f => (
                    <div key={f} style={{ display:'flex', alignItems:'center', gap:9 }}>
                      <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke={amber} strokeWidth="2.5" strokeLinecap="round" style={{ flexShrink:0 }}><polyline points="3,8 6,11 13,5"/></svg>
                      <span style={{ fontSize:13, color:'rgba(255,255,255,.65)' }}>{f}</span>
                    </div>
                  ))}
                </div>

                <Link to="/register" style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, background:amberG, color:white, fontSize:15, fontWeight:500, padding:'13px', borderRadius:9, textDecoration:'none', fontFamily:sans, transition:'opacity .15s, transform .15s' }}
                  onMouseEnter={e => { e.currentTarget.style.opacity='.88'; e.currentTarget.style.transform='translateY(-1px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.opacity='1'; e.currentTarget.style.transform='none'; }}>
                  Start free trial
                  <svg width="13" height="13" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 6h7M6.5 3l3 3-3 3"/></svg>
                </Link>
                <p style={{ textAlign:'center', fontSize:11, color:'rgba(255,255,255,.2)', marginTop:10 }}>No credit card required</p>
              </div>
            </div>
          </div>
        </Reveal>
      </Container>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   PAGE
══════════════════════════════════════════════════════════════ */
export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', h, { passive:true });
    return () => window.removeEventListener('scroll', h);
  }, []);

  return (
    <PublicLayout scrolled={scrolled} mobileMenu={mobileMenu} onToggleMobile={() => setMobileMenu(m => !m)}>
      <Fonts />
      <style>{`
        @keyframes clup    { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:none} }
        @keyframes clfade  { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:none} }
        @keyframes clpulse { 0%,100%{opacity:1} 50%{opacity:.3} }
        @keyframes clprog  { from{width:0} to{width:100%} }
        @keyframes clglow  { 0%,100%{opacity:.6} 50%{opacity:1} }

        .cl-cta {
          display:inline-flex; align-items:center; gap:8px;
          background:${amberG}; color:${white};
          font-family:${sans}; font-weight:500; border-radius:9px;
          text-decoration:none; border:none; cursor:pointer;
          transition:opacity .15s, transform .15s;
        }
        .cl-cta:hover { opacity:.88; transform:translateY(-1px); }

        .cl-ghost {
          display:inline-flex; align-items:center; gap:8px;
          background:transparent; color:${ink};
          font-family:${sans}; font-weight:400; border-radius:9px;
          text-decoration:none; border:1.5px solid ${border}; cursor:pointer;
          transition:border-color .15s, background .15s;
        }
        .cl-ghost:hover { border-color:${ink}; background:${surface}; }

        .cl-nav-link { text-decoration:none; color:rgba(255,255,255,.55); font-size:14px; transition:color .15s; }
        .cl-nav-link:hover { color:rgba(255,255,255,.95); }

        .cl-feat-card { background:${white}; transition:background .15s; cursor:default; }
        .cl-feat-card:hover { background:${surface} !important; }

        .cl-mod-card { border:1px solid ${border}; background:${white}; border-radius:12px; padding:22px 18px; cursor:default; transition:border-color .15s, transform .15s; }
        .cl-mod-card:hover { border-color:${ink}; transform:translateY(-2px); }

        .cl-testi { border:1px solid ${border}; border-radius:14px; background:${white}; padding:32px 28px; transition:border-color .15s; }
        .cl-testi:hover { border-color:${ink}; }

        .cl-fl { text-decoration:none; color:rgba(255,255,255,.4); font-size:14px; transition:color .15s; }
        .cl-fl:hover { color:rgba(255,255,255,.8); }

        /* ── MOBILE ────────────────────────────────────────── */
        @media(max-width:768px) {
          .cl-hero-grid { grid-template-columns:1fr !important; text-align:center; }
          .cl-hero-btns { justify-content:center !important; }
          .cl-hero-badge { justify-content:center !important; }
          .cl-stats-grid { grid-template-columns:repeat(2,1fr) !important; }
          .cl-features-grid { grid-template-columns:1fr !important; }
          .cl-feat-3col { grid-template-columns:1fr !important; }
          .cl-modules-grid { grid-template-columns:repeat(2,1fr) !important; }
          .cl-steps-grid { grid-template-columns:1fr !important; gap:48px !important; }
          .cl-saas-grid { grid-template-columns:1fr !important; }
          .cl-testi-grid { grid-template-columns:1fr !important; }
          .cl-pricing-grid { grid-template-columns:1fr !important; }
          .cl-footer-grid { grid-template-columns:1fr 1fr !important; gap:36px !important; }
          .cl-footer-brand { grid-column:1/-1 !important; }
          .cl-nav-links { display:none !important; }
          .cl-nav-menu-btn { display:flex !important; }
          .cl-mobile-menu { display:${mobileMenu?'flex':'none'} !important; }
          .cl-container { padding:0 20px !important; }
          .cl-section { padding:72px 0 !important; }
          .cl-hero-section { padding-top:112px !important; padding-bottom:72px !important; }
          .cl-mockup-wrap { display:none !important; }
          .cl-pillars-grid { grid-template-columns:1fr !important; }
        }
        @media(max-width:480px) {
          .cl-stats-grid { grid-template-columns:repeat(2,1fr) !important; }
          .cl-modules-grid { grid-template-columns:1fr 1fr !important; }
          .cl-footer-grid { grid-template-columns:1fr !important; }
        }
      `}</style>

      {/* ══ HERO ═══════════════════════════════════════════════ */}
      <section className="cl-hero-section" style={{ background:dark, paddingTop:140, paddingBottom:96, position:'relative', overflow:'hidden' }}>
        {/* Ambient glow */}
        <div style={{ position:'absolute', top:'10%', left:'50%', transform:'translateX(-50%)', width:600, height:400, background:'radial-gradient(ellipse,rgba(217,119,6,.12) 0%,transparent 70%)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', inset:0, opacity:.025, backgroundImage:`linear-gradient(rgba(255,255,255,.6) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.6) 1px,transparent 1px)`, backgroundSize:'52px 52px', pointerEvents:'none' }} />

        <Container>
          <div className="cl-hero-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:72, alignItems:'center' }}>
            {/* Left */}
            <div>
              <div className="cl-hero-badge" style={{ display:'inline-flex', alignItems:'center', gap:8, border:'1px solid rgba(217,119,6,.3)', background:'rgba(217,119,6,.08)', borderRadius:100, padding:'5px 14px', marginBottom:28, animation:'clfade .5s ease both' }}>
                <div style={{ width:6, height:6, borderRadius:'50%', background:amber, animation:'clpulse 2s infinite' }} />
                <span style={{ fontSize:11, fontWeight:500, color:'#FDE68A', letterSpacing:'.06em', textTransform:'uppercase' }}>Now open for hotels</span>
              </div>

              <h1 style={{ fontFamily:serif, fontSize:'clamp(52px,6vw,88px)', fontWeight:400, lineHeight:1.0, letterSpacing:'-.025em', color:white, marginBottom:20, animation:'clfade .5s .08s ease both' }}>
                Your hotel,<br />
                <em style={{ fontStyle:'italic', color:amber }}>always on.</em>
              </h1>

              <p style={{ fontSize:18, fontWeight:300, color:'rgba(255,255,255,.5)', lineHeight:1.72, marginBottom:40, maxWidth:420, animation:'clfade .5s .16s ease both' }}>
                One platform connecting every room, reservation, guest, and department — so nothing is ever missed, and every guest feels welcomed.
              </p>

              <div className="cl-hero-btns" style={{ display:'flex', gap:12, alignItems:'center', marginBottom:20, animation:'clfade .5s .24s ease both' }}>
                <Link to="/register" className="cl-cta" style={{ fontSize:16, padding:'14px 32px', borderRadius:10 }}>
                  Start free trial
                  <svg width="13" height="13" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 6h7M6.5 3l3 3-3 3"/></svg>
                </Link>
                <a href="#features" style={{ fontSize:16, color:'rgba(255,255,255,.45)', padding:'14px 20px', textDecoration:'none', borderRadius:10, border:'1px solid rgba(255,255,255,.1)', fontFamily:sans, transition:'all .15s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(255,255,255,.25)'; e.currentTarget.style.color='rgba(255,255,255,.8)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor='rgba(255,255,255,.1)'; e.currentTarget.style.color='rgba(255,255,255,.45)'; }}>
                  See features
                </a>
              </div>
              <p style={{ fontSize:12, color:'rgba(255,255,255,.25)', animation:'clfade .5s .32s ease both' }}>
                <span style={{ color:'rgba(255,255,255,.5)', fontWeight:500 }}>14-day free trial</span> · No credit card · Cancel anytime
              </p>
            </div>

            {/* Trust signals — right side on desktop */}
            <div style={{ animation:'clfade .7s .3s ease both' }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                {[
                  { icon:'M3 3h7v9H3zM14 3h7v5h-7zM14 12h7v9h-7zM3 16h7v5H3z', title:'10+ Modules', desc:'Every department in one platform' },
                  { icon:'M22 12h-4l-3 9L9 3l-3 9H2', title:'Real-time', desc:'Live updates across your whole team' },
                  { icon:'M3 11h18v11H3zM7 11V7a5 5 0 0 1 10 0v4', title:'100% Private', desc:'Your data, fully isolated' },
                  { icon:'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z', title:'Role-based', desc:'10 built-in access levels' },
                ].map((c,i) => (
                  <div key={i} style={{ background:darkSub, border:`1px solid ${darkBrd}`, borderRadius:12, padding:'22px 20px', animation:`clfade .5s ${.3+i*.07}s ease both` }}>
                    <div style={{ width:34, height:34, background:'rgba(217,119,6,.12)', border:'1px solid rgba(217,119,6,.2)', borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:14, color:amber }}>
                      <Icon d={c.icon} size={15} />
                    </div>
                    <div style={{ fontSize:14, fontWeight:600, color:white, marginBottom:4 }}>{c.title}</div>
                    <div style={{ fontSize:12, color:'rgba(255,255,255,.35)', lineHeight:1.5 }}>{c.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* ══ STATS ══════════════════════════════════════════════ */}
      <div style={{ background:darkSub, borderBottom:`1px solid ${darkBrd}` }}>
        <Container>
          <div className="cl-stats-grid" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)' }}>
            {[['10+','Modules included'],['∞','Rooms supported'],['14','Days free trial'],['100%','Data privacy']].map(([n,l],i) => (
              <Reveal key={i} delay={i*.07}>
                <div style={{ padding:'40px 28px', textAlign:'center', borderRight:i<3?`1px solid ${darkBrd}`:'none' }}>
                  <div style={{ fontFamily:serif, fontSize:'clamp(36px,3.5vw,52px)', fontWeight:400, color:white, lineHeight:1 }}>{n}</div>
                  <div style={{ fontSize:13, color:'rgba(255,255,255,.35)', marginTop:6 }}>{l}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </div>

      {/* ══ FEATURES MOCKUP ════════════════════════════════════ */}
      <div id="features" className="cl-section" style={{ padding:'96px 0', borderBottom:`1px solid ${border}` }}>
        <Container>
          <Reveal>
            <div style={{ textAlign:'center', marginBottom:56 }}>
              <p style={{ fontSize:11, fontWeight:600, letterSpacing:'.12em', textTransform:'uppercase', color:amber, marginBottom:14 }}>Platform</p>
              <h2 style={{ fontFamily:serif, fontSize:'clamp(36px,4vw,56px)', fontWeight:400, letterSpacing:'-.025em', color:ink, lineHeight:1.06, marginBottom:12 }}>
                See it in action
              </h2>
              <p style={{ fontSize:17, color:sub, maxWidth:440, margin:'0 auto', lineHeight:1.7 }}>
                A live dashboard keeping your entire operation visible — from the moment a guest books to the moment they check out.
              </p>
            </div>
          </Reveal>
          <Reveal delay={.1}>
            <div className="cl-mockup-wrap">
              <DashboardDemo />
            </div>
          </Reveal>
        </Container>
      </div>

      {/* ══ PILLARS ════════════════════════════════════════════ */}
      <div className="cl-section" style={{ background:surface, padding:'96px 0', borderBottom:`1px solid ${border}` }}>
        <Container>
          <Reveal>
            <div style={{ textAlign:'center', marginBottom:56 }}>
              <p style={{ fontSize:11, fontWeight:600, letterSpacing:'.12em', textTransform:'uppercase', color:amber, marginBottom:14 }}>The Cierlo Way</p>
              <h2 style={{ fontFamily:serif, fontSize:'clamp(36px,4vw,56px)', fontWeight:400, letterSpacing:'-.025em', color:ink, lineHeight:1.06 }}>Built on three principles</h2>
            </div>
          </Reveal>
          <div className="cl-pillars-grid" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:2, background:border, border:`1px solid ${border}`, borderRadius:16, overflow:'hidden' }}>
            {[
              { n:'01', t:'Visibility', em:'See your entire operation clearly', d:'A real-time view of every room, booking, staff member, and revenue stream. No blind spots, no surprises.' },
              { n:'02', t:'Control', em:'One platform, zero chaos', d:'Every department — front desk, housekeeping, maintenance, billing — connected in one seamless system.' },
              { n:'03', t:'Growth', em:'Built to scale with you', d:'From your first room to your hundredth, from one property to a group — Cierlo grows alongside your business.' },
            ].map((p,i) => (
              <Reveal key={i} delay={i*.1}>
                <div style={{ background:white, padding:'44px 40px' }}>
                  <div style={{ fontFamily:serif, fontSize:44, color:border, lineHeight:1, marginBottom:22 }}>{p.n}</div>
                  <div style={{ fontSize:20, fontWeight:600, color:ink, marginBottom:5 }}>{p.t}</div>
                  <div style={{ fontSize:12, color:amber, fontStyle:'italic', marginBottom:14 }}>{p.em}</div>
                  <div style={{ fontSize:15, color:sub, lineHeight:1.72 }}>{p.d}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </div>

      {/* ══ FEATURE CARDS ══════════════════════════════════════ */}
      <div id="modules" className="cl-section" style={{ padding:'96px 0', borderBottom:`1px solid ${border}` }}>
        <Container>
          <Reveal>
            <div style={{ marginBottom:56 }}>
              <p style={{ fontSize:11, fontWeight:600, letterSpacing:'.12em', textTransform:'uppercase', color:amber, marginBottom:14 }}>All modules</p>
              <h2 style={{ fontFamily:serif, fontSize:'clamp(36px,4vw,56px)', fontWeight:400, letterSpacing:'-.025em', color:ink, lineHeight:1.06, marginBottom:12 }}>
                Everything your hotel<br /><em style={{ fontStyle:'italic' }}>needs to operate</em>
              </h2>
              <p style={{ fontSize:17, color:sub, lineHeight:1.72, maxWidth:480 }}>
                One platform covering every department — so your team spends less time switching tools and more time with guests.
              </p>
            </div>
          </Reveal>
          <div className="cl-feat-3col" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:1, background:border, border:`1px solid ${border}`, borderRadius:16, overflow:'hidden' }}>
            {[
              { icon:'M3 3h7v9H3zM14 3h7v5h-7zM14 12h7v9h-7zM3 16h7v5H3z', n:'Room Management', d:'Manage every room from a single view. Set types, rates, track status in real time, and upload photos.', tags:['Room types','Rate plans','Photo gallery'] },
              { icon:'M3 4h18v18H3zM16 2v4M8 2v4M3 10h18', n:'Reservations', d:'Take bookings from any source, assign rooms, check guests in and out, handle cancellations.', tags:['Check-in / out','Room assignment','Cancellations'] },
              { icon:'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', n:'Guest Profiles', d:'Every guest gets a rich profile with stay history and loyalty points. Spot a returning VIP before they arrive.', tags:['Stay history','Loyalty points','ID on file'] },
              { icon:'M2 5h20v14H2zM2 10h20', n:'Billing & Folio', d:'Every charge, payment, and adjustment tracked on the guest folio. Close a bill in seconds at checkout.', tags:['Itemized charges','Multi-method pay','Shift reports'] },
              { icon:'M3 9l4-4 4 4 4-4 4 4v11H3z', n:'Housekeeping', d:'Assign tasks, track room status in real time, and manage lost-and-found items from one place.', tags:['Task assignment','Room status','Lost & found'] },
              { icon:'M4 7h16M4 12h16M4 17h10', n:'Inventory', d:'Keep stock under control. Get alerted before you run out. Raise purchase orders and track deliveries.', tags:['Stock alerts','Purchase orders','Suppliers'] },
              { icon:'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z', n:'Maintenance', d:'Log faults, assign technicians, track work orders from open to closed. Keep an asset register.', tags:['Work orders','Asset register','Cost tracking'] },
              { icon:'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', n:'Staff & HR', d:'Manage your whole team from onboarding to shifts to leave requests. Grant exact access levels.', tags:['Departments','Shift scheduling','Leave requests'] },
              { icon:'M22 12h-4l-3 9L9 3l-3 9H2', n:'Reports & Analytics', d:'See revenue trends, occupancy rates, and performance at a glance. Pull detailed reports any time.', tags:['Revenue charts','Occupancy rate','Guest analytics'] },
            ].map((f,i) => (
              <Reveal key={i} delay={(i%3)*.08}>
                <div className="cl-feat-card" style={{ padding:'36px 32px' }}>
                  <div style={{ width:38, height:38, background:surface, borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:18, color:ink }}>
                    <Icon d={f.icon} size={17} />
                  </div>
                  <div style={{ fontSize:16, fontWeight:600, color:ink, marginBottom:8 }}>{f.n}</div>
                  <div style={{ fontSize:14, color:sub, lineHeight:1.7, marginBottom:16 }}>{f.d}</div>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                    {f.tags.map(t => <span key={t} style={{ fontSize:11, color:muted, background:surface, border:`1px solid ${border}`, padding:'3px 10px', borderRadius:100 }}>{t}</span>)}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </div>

      {/* ══ HOW IT WORKS ═══════════════════════════════════════ */}
      <div id="saas" style={{ background:dark, padding:'96px 0' }}>
        <Container>
          <div className="cl-steps-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:80, alignItems:'start' }}>
            <div>
              <Reveal>
                <p style={{ fontSize:11, fontWeight:600, letterSpacing:'.12em', textTransform:'uppercase', color:amber, marginBottom:14 }}>Getting started</p>
                <h2 style={{ fontFamily:serif, fontSize:'clamp(36px,4vw,54px)', fontWeight:400, letterSpacing:'-.025em', color:white, lineHeight:1.06, marginBottom:48 }}>
                  Up and running<br /><em style={{ fontStyle:'italic', color:'rgba(255,255,255,.4)' }}>in minutes</em>
                </h2>
              </Reveal>
              {[
                { n:'1', t:'Register your hotel', d:'Sign up in 60 seconds. Your workspace is created instantly — fully private to your property.' },
                { n:'2', t:'Configure hotel details', d:'Add your name, contact info, currency, check-in times, and tax rates.' },
                { n:'3', t:'Add room types & rooms', d:'Create categories with rates and amenities, then add individual rooms with photos.' },
                { n:'4', t:'Invite your team', d:'Add staff, assign departments, and set access levels — front desk, housekeeping, manager.' },
                { n:'5', t:'Go live instantly', d:'Your booking website is automatically linked via your unique subdomain. No API keys or setup needed.' },
              ].map((s,i) => (
                <Reveal key={i} delay={i*.07}>
                  <div style={{ display:'flex', gap:22, padding:'22px 0', borderBottom:i<4?`1px solid ${darkBrd}`:'none' }}>
                    <div style={{ fontFamily:serif, fontSize:32, color:'rgba(255,255,255,.12)', lineHeight:1, flexShrink:0, width:28, paddingTop:2 }}>{s.n}</div>
                    <div>
                      <div style={{ fontSize:16, fontWeight:600, color:white, marginBottom:5 }}>{s.t}</div>
                      <div style={{ fontSize:14, color:'rgba(255,255,255,.4)', lineHeight:1.68 }}>{s.d}</div>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>

            <Reveal delay={.15}>
              <div style={{ position:'sticky', top:96, background:darkSub, border:`1px solid ${darkBrd}`, borderRadius:14, padding:'32px 28px' }}>
                <p style={{ fontSize:11, fontWeight:600, letterSpacing:'.08em', textTransform:'uppercase', color:'rgba(255,255,255,.3)', marginBottom:20 }}>Your setup checklist</p>
                {[
                  { l:'Hotel details configured', done:true },
                  { l:'Room types added', done:true },
                  { l:'Rooms added with photos', done:true },
                  { l:'Staff members added', done:false },
                  { l:'Booking website connected', done:false },
                ].map((c,i) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'11px 12px', background:'rgba(255,255,255,.03)', border:`1px solid ${darkBrd}`, borderRadius:8, marginBottom:7, fontSize:13, color:white }}>
                    <div style={{ width:20, height:20, borderRadius:'50%', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', background:c.done?amber:'transparent', border:c.done?'none':'1px solid rgba(255,255,255,.15)' }}>
                      {c.done && <svg width="9" height="9" viewBox="0 0 10 10" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="2,5 4,7 8,3"/></svg>}
                    </div>
                    <span style={{ color:c.done?'rgba(255,255,255,.55)':'rgba(255,255,255,.8)' }}>{c.l}</span>
                  </div>
                ))}

                <div style={{ marginTop:20, padding:'14px 16px', background:'rgba(217,119,6,.08)', border:'1px solid rgba(217,119,6,.2)', borderRadius:10 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                    <div style={{ width:6, height:6, borderRadius:'50%', background:amber, animation:'clpulse 2s infinite' }} />
                    <span style={{ fontSize:11, fontWeight:600, letterSpacing:'.06em', textTransform:'uppercase', color:'#FDE68A' }}>Your hotel, online</span>
                  </div>
                  <span style={{ fontFamily:"'SF Mono','Fira Code',monospace", fontSize:13, color:'#93c5fd' }}>amarahotel.cierlo.io</span>
                </div>
              </div>
            </Reveal>
          </div>
        </Container>
      </div>

      {/* ══ TESTIMONIALS ═══════════════════════════════════════ */}
      <div className="cl-section" style={{ padding:'96px 0', borderBottom:`1px solid ${border}` }}>
        <Container>
          <Reveal>
            <div style={{ textAlign:'center', marginBottom:56 }}>
              <p style={{ fontSize:11, fontWeight:600, letterSpacing:'.12em', textTransform:'uppercase', color:amber, marginBottom:14 }}>From the field</p>
              <h2 style={{ fontFamily:serif, fontSize:'clamp(36px,4vw,56px)', fontWeight:400, letterSpacing:'-.025em', color:ink, lineHeight:1.06 }}>
                Hotels running<br /><em style={{ fontStyle:'italic' }}>on Cierlo</em>
              </h2>
            </div>
          </Reveal>
          <div className="cl-testi-grid" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:20 }}>
            {[
              { q:"Check-in used to take 10 minutes of fumbling through spreadsheets. Now it's 90 seconds. The folio handles everything our accountants need at month end.", n:'Amara Okonkwo', r:'GM, Grand Palms Hotel', i:'AO' },
              { q:"The housekeeping module alone was worth it. Tasks are assigned the moment a room becomes free, and we haven't lost a single item from lost & found since.", n:'Kofi Boateng', r:'Operations Director, Accra Suites', i:'KB' },
              { q:"Our booking website shows live availability and real room photos automatically. Guests can browse and book directly — it all just works.", n:'Fatima Ibrahim', r:'Owner, Heritage Boutique Hotel', i:'FI' },
            ].map((t,i) => (
              <Reveal key={i} delay={i*.1}>
                <div className="cl-testi">
                  <div style={{ fontFamily:serif, fontSize:48, color:border, lineHeight:1, marginBottom:12 }}>"</div>
                  <p style={{ fontSize:15, color:sub, lineHeight:1.76, fontWeight:300, marginBottom:24 }}>{t.q}</p>
                  <div style={{ display:'flex', alignItems:'center', gap:11 }}>
                    <div style={{ width:38, height:38, borderRadius:'50%', background:surface, border:`1px solid ${border}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:600, color:ink }}>{t.i}</div>
                    <div><div style={{ fontSize:13, fontWeight:600, color:ink }}>{t.n}</div><div style={{ fontSize:12, color:muted }}>{t.r}</div></div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </div>

      {/* ══ PRICING ════════════════════════════════════════════ */}
      <PricingSection />

      {/* ══ CTA ════════════════════════════════════════════════ */}
      <div style={{ background:white, padding:'112px 0' }}>
        <Container>
          <Reveal>
            <div style={{ textAlign:'center', maxWidth:600, margin:'0 auto' }}>
              <p style={{ fontSize:11, fontWeight:600, letterSpacing:'.12em', textTransform:'uppercase', color:amber, marginBottom:16 }}>Get started</p>
              <h2 style={{ fontFamily:serif, fontSize:'clamp(40px,5vw,68px)', fontWeight:400, letterSpacing:'-.025em', color:ink, lineHeight:1.04, marginBottom:16 }}>
                The light is on.<br /><em style={{ fontStyle:'italic', color:muted }}>Is your hotel ready?</em>
              </h2>
              <p style={{ fontSize:17, fontWeight:300, color:sub, maxWidth:400, margin:'0 auto 40px', lineHeight:1.72 }}>
                Sign up in 60 seconds. Your workspace is ready before you finish your coffee.
              </p>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:12, flexWrap:'wrap', marginBottom:16 }}>
                <Link to="/register" className="cl-cta" style={{ fontSize:16, padding:'15px 40px', borderRadius:10 }}>
                  Start your free trial
                  <svg width="13" height="13" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 6h7M6.5 3l3 3-3 3"/></svg>
                </Link>
                <Link to="/login" className="cl-ghost" style={{ fontSize:16, padding:'15px 28px', borderRadius:10 }}>
                  Sign in to account
                </Link>
              </div>
              <p style={{ fontSize:12, color:faint }}>No credit card required · Cancel any time</p>
            </div>
          </Reveal>
        </Container>
      </div>

      {/* ══ FOOTER ═════════════════════════════════════════════ */}
    </PublicLayout>
  );
}