// src/components/layout/AuthLayout.jsx

import Logo from '../brand/cierlo_logo';

const FONT_LINK = 'https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600&display=swap';

const DEFAULT_STATS = [
  { num: '10+',   label: 'Modules'       },
  { num: 'Multi', label: 'Property'      },
  { num: '100%',  label: 'Org isolated'  },
];

const DEFAULT_HEADLINE = (
  <>Everything your<br />hotel needs to<br /><em>run smoothly</em></>
);

const DEFAULT_BODY = 'Rooms, reservations, billing, housekeeping, inventory, maintenance, and staff — one platform, fully yours.';

const DEFAULT_EYEBROW = 'Your hotel, always on.';

export default function AuthLayout({
  children,
  eyebrow   = DEFAULT_EYEBROW,
  headline  = DEFAULT_HEADLINE,
  body      = DEFAULT_BODY,
  stats     = DEFAULT_STATS,
}) {
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link href={FONT_LINK} rel="stylesheet" />

      <style>{`
        .al-root * { box-sizing: border-box; margin: 0; padding: 0; }

        .al-root {
          min-height: 100vh;
          display: grid;
          grid-template-columns: 1fr 1fr;
          font-family: 'DM Sans', system-ui, sans-serif;
          -webkit-font-smoothing: antialiased;
        }
        @media (max-width: 768px) {
          .al-root  { grid-template-columns: 1fr; }
          .al-left  { display: none !important; }
        }

        /* ── LEFT PANEL ─────────────────────────────────── */
        .al-left {
          background: var(--sidebar-bg);
          padding: 48px 32px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          position: relative;
          overflow: hidden;
        }

        /* subtle grid texture */
        .al-left-grid {
          position: absolute; inset: 0; opacity: 0.04;
          background-image:
            linear-gradient(rgba(255,220,170,0.15) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,220,170,0.15) 1px, transparent 1px);
          background-size: 40px 40px;
          pointer-events: none;
        }

        /* logo — anchored top, same edge as stats */
        .al-left-logo { position: relative; z-index: 1; }

        /* hero copy — inset slightly for editorial hierarchy */
        .al-left-content {
          position: relative; z-index: 1;
          padding: 0 16px;
        }

        .al-eyebrow {
          font-size: 11px; font-weight: 500;
          letter-spacing: 0.1em; text-transform: uppercase;
          color: var(--accent);
          margin-bottom: 20px;
        }

        .al-headline {
          font-family: 'Instrument Serif', Georgia, serif;
          font-size: clamp(36px, 3.5vw, 52px);
          font-weight: 400; line-height: 1.08;
          letter-spacing: -0.02em;
          color: rgba(255,235,210,0.95);
          margin-bottom: 20px;
        }
        .al-headline em {
          font-style: italic;
          color: rgba(255,200,120,0.60);
        }

        .al-body {
          font-size: 14px; font-weight: 300;
          color: rgba(255,220,170,0.62);
          line-height: 1.7; max-width: 340px;
        }

        /* stats — anchored bottom, same edge as logo */
        .al-stats {
          position: relative; z-index: 1;
          display: flex; gap: 32px;
        }
        .al-stat-num {
          font-family: 'Instrument Serif', Georgia, serif;
          font-size: 28px;
          color: rgba(255,235,210,0.95);
          line-height: 1;
        }
        .al-stat-label {
          font-size: 12px;
          color: rgba(255,220,170,0.40);
          margin-top: 3px;
        }

        /* ── RIGHT PANEL ────────────────────────────────── */
        .al-right {
          background: var(--bg-page);
          display: flex; align-items: center; justify-content: center;
          padding: 40px;
          border-left: 1px solid var(--border-soft);
        }

        .al-form-wrap {
          width: 100%; max-width: 360px;
        }

        /* ── SHARED FORM PRIMITIVES ─────────────────────── */

        /* "← Back to home" / "← Back to login" links */
        .al-back {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 13px; color: var(--text-sub);
          text-decoration: none; margin-bottom: 36px;
          transition: color 0.2s;
        }
        .al-back:hover { color: var(--text-base); }

        /* Page heading */
        .al-title {
          font-family: 'Instrument Serif', Georgia, serif;
          font-size: 28px; font-weight: 400;
          letter-spacing: -0.01em;
          color: var(--text-base);
          margin-bottom: 6px; line-height: 1.2;
        }

        /* Subtitle */
        .al-sub {
          font-size: 14px; color: var(--text-sub);
          margin-bottom: 36px; line-height: 1.5;
        }

        /* Form field wrapper */
        .al-field { margin-bottom: 20px; }

        /* Label */
        .al-label {
          display: block;
          font-size: 12px; font-weight: 600;
          letter-spacing: 0.03em; text-transform: uppercase;
          color: var(--text-base); margin-bottom: 7px;
        }

        /* Input */
        .al-input {
          width: 100%; height: 44px; padding: 0 14px;
          border: 1.5px solid var(--border-soft); border-radius: 8px;
          font-family: 'DM Sans', sans-serif; font-size: 14px;
          color: var(--text-base); background: var(--bg-surface);
          outline: none; transition: border-color 0.2s;
          -webkit-font-smoothing: antialiased;
        }
        .al-input:focus { border-color: var(--brand); }
        .al-input::placeholder { color: var(--text-muted); }

        /* Password input wrapper (for eye toggle) */
        .al-input-wrap { position: relative; }
        .al-input-wrap .al-input { padding-right: 44px; }
        .al-eye {
          position: absolute; right: 14px; top: 50%; transform: translateY(-50%);
          background: none; border: none; cursor: pointer;
          color: var(--text-muted); display: flex; align-items: center;
          padding: 0; transition: color 0.2s;
        }
        .al-eye:hover { color: var(--text-base); }

        /* Label row (label + forgot link side by side) */
        .al-label-row {
          display: flex; align-items: center;
          justify-content: space-between; margin-bottom: 7px;
        }
        .al-label-row .al-label { margin-bottom: 0; }
        .al-forgot {
          font-size: 12px; color: var(--text-sub);
          text-decoration: none; transition: color 0.2s;
        }
        .al-forgot:hover { color: var(--text-base); }

        /* Primary submit button */
        .al-submit {
          width: 100%; height: 46px; border-radius: 8px;
          border: none; cursor: pointer;
          background: var(--sidebar-bg);
          color: rgba(255,235,210,0.95);
          font-family: 'DM Sans', sans-serif;
          font-size: 14px; font-weight: 500;
          display: flex; align-items: center;
          justify-content: center; gap: 8px;
          margin-top: 12px;
          transition: opacity 0.2s, transform 0.15s;
        }
        .al-submit:hover:not(:disabled) { opacity: 0.86; transform: translateY(-1px); }
        .al-submit:disabled { opacity: 0.5; cursor: not-allowed; }

        /* Secondary / back button (register step back) */
        .al-btn-secondary {
          height: 46px; padding: 0 20px; border-radius: 8px;
          border: 1.5px solid var(--border-soft);
          background: var(--bg-surface); cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px; font-weight: 500;
          color: var(--text-sub);
          transition: border-color 0.2s, color 0.2s;
        }
        .al-btn-secondary:hover { border-color: var(--sidebar-bg); color: var(--text-base); }

        /* Row of buttons (back + submit) */
        .al-btn-row { display: flex; gap: 10px; margin-top: 12px; }
        .al-btn-row .al-submit { margin-top: 0; }

        /* Footer link ("Already have an account? Sign in") */
        .al-footer {
          margin-top: 32px; text-align: center;
          font-size: 13px; color: var(--text-sub);
          padding-top: 24px;
          border-top: 1px solid var(--border-soft);
        }
        .al-footer a {
          color: var(--text-base); font-weight: 500;
          text-decoration: none;
        }
        .al-footer a:hover { text-decoration: underline; }

        /* Hint text below input (e.g. slug preview) */
        .al-hint { font-size: 12px; color: var(--text-muted); margin-top: 5px; }
        .al-hint span { color: var(--brand); }

        /* Success state icon */
        .al-success-icon {
          width: 52px; height: 52px; border-radius: 50%;
          background: var(--s-green-bg);
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 20px;
        }

        /* ── ANIMATIONS ─────────────────────────────────── */
        @keyframes alFadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .al-form-wrap > * { animation: alFadeUp 0.45s ease both; }
        .al-form-wrap > *:nth-child(1) { animation-delay: 0.05s; }
        .al-form-wrap > *:nth-child(2) { animation-delay: 0.10s; }
        .al-form-wrap > *:nth-child(3) { animation-delay: 0.15s; }
        .al-form-wrap > *:nth-child(4) { animation-delay: 0.20s; }
        .al-form-wrap > *:nth-child(5) { animation-delay: 0.25s; }
        .al-form-wrap > *:nth-child(6) { animation-delay: 0.30s; }
      `}</style>

      <div className="al-root">

        {/* ── LEFT PANEL ──────────────────────────────────── */}
        <div className="al-left">
          <div className="al-left-grid" />

          {/* Logo — top, at outer padding */}
          <div className="al-left-logo">
            <Logo size="sm" theme="light" />
          </div>

          {/* Hero copy — inset 16px more than logo/stats */}
          <div className="al-left-content">
            <div className="al-eyebrow">{eyebrow}</div>
            <h2 className="al-headline">{headline}</h2>
            <p className="al-body">{body}</p>
          </div>

          {/* Stats — bottom, at outer padding */}
          <div className="al-stats">
            {stats.map(s => (
              <div key={s.label}>
                <div className="al-stat-num">{s.num}</div>
                <div className="al-stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── RIGHT PANEL ─────────────────────────────────── */}
        <div className="al-right">
          <div className="al-form-wrap">
            {children}
          </div>
        </div>

      </div>
    </>
  );
}