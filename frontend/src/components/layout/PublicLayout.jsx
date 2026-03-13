// Shared nav + footer for all public pages.
// Flame palette — warm, light, hospitality-first.

import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Logo from '../brand/cierlo_logo';

/* ── Palette ─────────────────────────────────────────────── */

const sans    = "'DM Sans', system-ui, sans-serif";
const serif   = "'Cormorant Garamond', Georgia, serif";

/* ── Shared border color on dark espresso footer ─────────── */

function Container({ children, style = {} }) {
  return <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', ...style }}>{children}</div>;
}

export default function PublicLayout({ children, scrolled = false, mobileMenu = false, onToggleMobile }) {
  const [_scrolled] = useState(scrolled);
  const [_mobile, setMobile] = useState(false);
  const { pathname } = useLocation();

  const isScrolled   = scrolled || _scrolled;
  const isMobileOpen = mobileMenu || _mobile;
  const toggleMobile = onToggleMobile || (() => setMobile(m => !m));

  const NAV_LINKS = pathname === '/'
    ? [['#features','Features'],['#modules','Modules'],['#saas','Platform'],['#pricing','Pricing']]
    : [['/?#features','Features'],['/?#modules','Modules'],['/?#saas','Platform'],['/?#pricing','Pricing']];

  const FOOTER_COLS = [
    {
      title: 'Product',
      links: [['/#features','Features'],['/#modules','All Modules'],['/#pricing','Pricing'],['/register','Sign up free']],
    },
    {
      title: 'Support',
      links: [['/help','Help Center'],['/help/docs','Documentation'],['/help/support','Contact Support'],['/help/feedback','Feature Requests'],['/help/status','System Status']],
    },
    {
      title: 'Company',
      links: [['/privacy','Privacy Policy'],['/terms','Terms of Service'],['mailto:hello@cierlo.com','hello@cierlo.com']],
    },
  ];

  return (
    <div style={{ background:'var(--bg-page)', color:'var(--text-base)', fontFamily:sans, overflowX: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400;1,600&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');

        .cl-nav-link { text-decoration:none; color:var(--sidebar-text); font-size:14px; font-family:${sans}; transition:color .15s; }
        .cl-nav-link:hover { color:var(--sidebar-text-active); }

        .cl-fl { text-decoration:none; color:var(--sidebar-text); font-size:13px; font-family:${sans}; transition:color .15s; }
        .cl-fl:hover { color:var(--sidebar-text-active); }

        .cl-cta {
          display:inline-flex; align-items:center; gap:8px;
          background:linear-gradient(135deg,var(--brand),var(--brand-hover)); color:#FFFFFF;
          font-family:${sans}; font-weight:500; border-radius:9px;
          text-decoration:none; border:none; cursor:pointer;
          transition:opacity .15s, transform .15s, box-shadow .15s;
          box-shadow:0 2px 12px rgba(var(--brand-rgb,234,108,10),0.35);
        }
        .cl-cta:hover { opacity:.92; transform:translateY(-1px); box-shadow:0 4px 20px rgba(234,108,10,0.45); }

        @media(max-width:768px) {
          .cl-nav-links    { display:none !important; }
          .cl-nav-menu-btn { display:flex !important; }
          .cl-footer-grid  { grid-template-columns:1fr 1fr !important; gap:36px !important; }
          .cl-footer-brand { grid-column:1/-1 !important; }
        }
        @media(max-width:480px) {
          .cl-footer-grid { grid-template-columns:1fr !important; }
        }
      `}</style>

      {/* ── NAV ─────────────────────────────────────────────── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background:'var(--sidebar-bg)',
        borderBottom: isScrolled ? '1px solid rgba(255,220,170,0.1)' : '1px solid transparent',
        transition: 'border-color .3s',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Logo size="sm" darkBg={false} responsive href="/" />

          <div className="cl-nav-links" style={{ display: 'flex', gap: 32 }}>
            {NAV_LINKS.map(([h, l]) => (
              <a key={l} href={h} className="cl-nav-link">{l}</a>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Link to="/login"
              style={{ fontSize: 14, color: 'rgba(255,220,170,0.5)', padding: '8px 14px', textDecoration: 'none', transition: 'color .15s', fontFamily: sans }}
              onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,220,170,0.9)'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,220,170,0.5)'}>
              Sign in
            </Link>
            <Link to="/register" className="cl-cta" style={{ fontSize: 14, padding: '9px 20px', borderRadius: 8 }}>
              Start free trial
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 6h7M6.5 3l3 3-3 3" /></svg>
            </Link>
            <button className="cl-nav-menu-btn" onClick={toggleMobile}
              style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,220,170,0.7)', padding: '6px', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 6h18M3 12h18M3 18h18" /></svg>
            </button>
          </div>
        </div>

        {isMobileOpen && (
          <div style={{ display: 'flex', flexDirection: 'column', borderTop: '1px solid rgba(255,220,170,0.1)', background:'var(--sidebar-bg)', padding: '16px 24px 20px' }}>
            {NAV_LINKS.map(([h, l]) => (
              <a key={l} href={h} className="cl-nav-link" style={{ padding: '12px 0', borderBottom: '1px solid rgba(255,220,170,0.1)', fontSize: 15 }} onClick={() => setMobile(false)}>{l}</a>
            ))}
          </div>
        )}
      </nav>

      {/* ── PAGE CONTENT ────────────────────────────────────── */}
      {children}

      {/* ── FOOTER ──────────────────────────────────────────── */}
      <footer style={{ background:'var(--sidebar-bg)', borderTop: '1px solid rgba(255,220,170,0.1)' }}>
        <Container style={{ padding: '64px 24px 48px' }}>
          <div className="cl-footer-grid" style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr 1fr 1fr', gap: 48 }}>
            <div className="cl-footer-brand">
              <Logo size="sm" darkBg={false} noLink />
              <p style={{ fontSize: 13, color: 'rgba(255,220,170,0.35)', lineHeight: 1.76, maxWidth: 220, marginTop: 14, fontFamily: sans }}>
                The modern hotel management platform for independent properties and growing groups.
              </p>
              <p style={{ fontSize: 12, color: 'rgba(255,220,170,0.18)', marginTop: 12, fontStyle: 'italic', fontFamily: serif }}>Your hotel, always on.</p>
            </div>
            {FOOTER_COLS.map(col => (
              <div key={col.title}>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(255,220,170,0.28)', marginBottom: 20, fontFamily: sans }}>{col.title}</p>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 13 }}>
                  {col.links.map(([h, l]) => (
                    <li key={l}>
                      {h.startsWith('mailto') || h.startsWith('http')
                        ? <a href={h} className="cl-fl">{l}</a>
                        : <Link to={h} className="cl-fl">{l}</Link>
                      }
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Container>
        <Container style={{ padding: '20px 24px', borderTop: '1px solid rgba(255,220,170,0.1)', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <span style={{ fontSize: 12, color: 'rgba(255,220,170,0.2)', fontFamily: sans }}>© 2026 Cierlo. All rights reserved.</span>
          <div style={{ display: 'flex', gap: 16 }}>
            <Link to="/terms"   className="cl-fl" style={{ fontSize: 12 }}>Terms</Link>
            <Link to="/privacy" className="cl-fl" style={{ fontSize: 12 }}>Privacy</Link>
          </div>
        </Container>
      </footer>
    </div>
  );
}