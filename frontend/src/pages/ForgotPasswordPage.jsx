import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Mail, ArrowLeft } from 'lucide-react';
import * as authApi from '../lib/api/authApi';
import toast from 'react-hot-toast';
import Logo from '../components/brand/cierlo_logo';

const FONT_LINK = 'https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600&display=swap';

export default function ForgotPasswordPage() {
  const [email,   setEmail]   = useState('');
  const [loading, setLoading] = useState(false);
  const [sent,    setSent]    = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authApi.forgotPassword({ email });
      setSent(true);
    } catch {
      toast.error('Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link href={FONT_LINK} rel="stylesheet" />

      <style>{`
        .auth-page * { box-sizing: border-box; margin: 0; padding: 0; }
        .auth-page {
          min-height: 100vh; display: grid; grid-template-columns: 1fr 1fr;
          font-family: 'DM Sans', system-ui, sans-serif;
          -webkit-font-smoothing: antialiased;
        }
        @media (max-width: 768px) { .auth-page { grid-template-columns: 1fr; } .auth-left { display: none !important; } }

        .auth-left {
          background: var(--sidebar-bg); padding: 48px;
          display: flex; flex-direction: column; justify-content: space-between;
          position: relative; overflow: hidden;
        }
        .auth-left-grid {
          position: absolute; inset: 0; opacity: 0.04;
          background-image: linear-gradient(rgba(255,220,170,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,220,170,0.15) 1px, transparent 1px);
          background-size: 40px 40px;
        }
        .auth-left-content { position: relative; z-index: 1; }
        .auth-left-eyebrow {
          font-size: 11px; font-weight: 500; letter-spacing: 0.1em;
          text-transform: uppercase; color: var(--accent); margin-bottom: 20px;
        }
        .auth-left-headline {
          font-family: 'Instrument Serif', Georgia, serif;
          font-size: clamp(36px, 3.5vw, 52px); font-weight: 400; line-height: 1.08;
          letter-spacing: -0.02em; color: rgba(255,235,210,0.95); margin-bottom: 20px;
        }
        .auth-left-headline em { font-style: italic; color: rgba(255,220,170,0.35); }
        .auth-left-body { font-size: 14px; font-weight: 300; color: rgba(255,220,170,0.45); line-height: 1.7; max-width: 340px; }
        .auth-left-stats { display: flex; gap: 32px; position: relative; z-index: 1; }
        .auth-stat-num {
          font-family: 'Instrument Serif', Georgia, serif;
          font-size: 28px; color: rgba(255,235,210,0.95); line-height: 1;
        }
        .auth-stat-label { font-size: 12px; color: rgba(255,220,170,0.35); margin-top: 3px; }

        .auth-right {
          background: var(--bg-page); display: flex; align-items: center; justify-content: center;
          padding: 40px; border-left: 1px solid var(--border-soft);
        }
        .auth-form-wrap { width: 100%; max-width: 360px; }

        .auth-form-title {
          font-family: 'Instrument Serif', Georgia, serif;
          font-size: 28px; font-weight: 400; letter-spacing: -0.01em;
          color: var(--text-base); margin-bottom: 6px; line-height: 1.2;
        }
        .auth-form-sub { font-size: 14px; color: var(--text-sub); margin-bottom: 32px; }

        .auth-field { margin-bottom: 18px; }
        .auth-label {
          display: block; font-size: 13px; font-weight: 500;
          color: var(--text-base); margin-bottom: 6px;
        }
        .auth-input {
          width: 100%; height: 44px; padding: 0 14px;
          border: 1.5px solid var(--border-soft); border-radius: 8px;
          font-family: 'DM Sans', sans-serif; font-size: 14px; color: var(--text-base);
          background: var(--bg-surface); outline: none; transition: border-color 0.2s;
          -webkit-font-smoothing: antialiased;
        }
        .auth-input:focus { border-color: var(--brand); }
        .auth-input::placeholder { color: var(--text-muted); }

        .auth-submit {
          width: 100%; height: 46px; border-radius: 8px; border: none; cursor: pointer;
          background: var(--sidebar-bg); color: rgba(255,235,210,0.95); font-family: 'DM Sans', sans-serif;
          font-size: 14px; font-weight: 500; display: flex; align-items: center;
          justify-content: center; gap: 8px; margin-top: 8px;
          transition: opacity 0.2s, transform 0.15s;
        }
        .auth-submit:hover:not(:disabled) { opacity: 0.86; transform: translateY(-1px); }
        .auth-submit:disabled { opacity: 0.5; cursor: not-allowed; }

        .auth-back {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 13px; color: var(--text-sub); text-decoration: none;
          margin-bottom: 36px; transition: color 0.2s;
        }
        .auth-back:hover { color: var(--text-base); }

        .auth-success-icon {
          width: 52px; height: 52px; border-radius: 50%;
          background: var(--s-green-bg); display: flex; align-items: center;
          justify-content: center; margin-bottom: 20px;
        }

        @keyframes authFadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .auth-form-wrap > * { animation: authFadeUp 0.45s ease both; }
        .auth-form-wrap > *:nth-child(1) { animation-delay: 0.05s; }
        .auth-form-wrap > *:nth-child(2) { animation-delay: 0.10s; }
        .auth-form-wrap > *:nth-child(3) { animation-delay: 0.15s; }
        .auth-form-wrap > *:nth-child(4) { animation-delay: 0.20s; }
        .auth-form-wrap > *:nth-child(5) { animation-delay: 0.25s; }
      `}</style>

      <div className="auth-page">
        {/* Left panel */}
        <div className="auth-left">
          <div className="auth-left-grid" />
          <Logo size="sm" theme="light" />

          <div className="auth-left-content">
            <div className="auth-left-eyebrow">Your hotel, always on.</div>
            <h2 className="auth-left-headline">
              Everything your<br/>hotel needs to<br/><em>run smoothly</em>
            </h2>
            <p className="auth-left-body">
              Rooms, reservations, billing, housekeeping, inventory, maintenance, and staff — one platform, fully yours.
            </p>
          </div>

          <div className="auth-left-stats">
            <div><div className="auth-stat-num">10+</div><div className="auth-stat-label">Modules</div></div>
            <div><div className="auth-stat-num">28</div><div className="auth-stat-label">DB tables</div></div>
            <div><div className="auth-stat-num">100%</div><div className="auth-stat-label">Org isolated</div></div>
          </div>
        </div>

        {/* Right panel */}
        <div className="auth-right">
          <div className="auth-form-wrap">
            {!sent ? (
              <>
                <Link to="/login" className="auth-back">
                  <ArrowLeft size={13} /> Back to login
                </Link>

                <h1 className="auth-form-title">Forgot password?</h1>
                <p className="auth-form-sub">
                  Enter your work email and we'll send you a reset link.
                </p>

                <form onSubmit={handleSubmit}>
                  <div className="auth-field">
                    <label className="auth-label">Email address</label>
                    <input
                      name="email" type="email" className="auth-input"
                      placeholder="you@hotel.com" required autoFocus
                      value={email} onChange={e => setEmail(e.target.value)}
                    />
                  </div>

                  <button type="submit" className="auth-submit" disabled={loading}>
                    {loading ? 'Sending…' : <>Send reset link <ArrowRight size={15} /></>}
                  </button>
                </form>
              </>
            ) : (
              <>
                <div className="auth-success-icon">
                  <Mail size={22} style={{ color: 'var(--s-green-text)' }} />
                </div>

                <h1 className="auth-form-title">Check your inbox</h1>
                <p className="auth-form-sub">
                  If <strong style={{ color: 'var(--text-base)' }}>{email}</strong> has an account,
                  a password reset link is on its way.
                </p>

                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 28, lineHeight: 1.6 }}>
                  Didn't get it? Check your spam folder, or{' '}
                  <button
                    onClick={() => setSent(false)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-base)', fontWeight: 500, fontSize: 13, padding: 0, fontFamily: 'inherit' }}>
                    try a different email
                  </button>.
                </p>

                <Link to="/login" className="auth-back" style={{ marginBottom: 0 }}>
                  <ArrowLeft size={13} /> Back to login
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}