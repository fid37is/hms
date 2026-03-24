// src/pages/LoginPage.jsx — redesigned to match landing page aesthetic

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import * as authApi from '../lib/api/authApi';
import toast from 'react-hot-toast';
import Logo from '../components/brand/cierlo_logo'

const FONT_LINK = 'https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600&display=swap';

export default function LoginPage() {
  const [form,    setForm]    = useState({ email: '', password: '' });
  const [show,    setShow]    = useState(false);
  const [loading, setLoading] = useState(false);
  const { setAuth }           = useAuthStore();
  const navigate              = useNavigate();

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authApi.login(form);
      const { access_token, user, must_change_password, org, orgs } = res.data.data;
      const permissions = user.permissions || [];
      setAuth({ user, token: access_token, permissions, must_change_password, org: org || null, orgs: orgs || [] });
      if (must_change_password) {
        navigate('/change-password', { replace: true });
      } else {
        toast.success(`Welcome back, ${user.full_name.split(' ')[0]}`);
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid credentials');
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
        .auth-form-logo {
          display: none; align-items: center; gap: 10px; margin-bottom: 36px;
          font-family: 'Instrument Serif', Georgia, serif; font-size: 20px; color: var(--text-base);
          text-decoration: none;
        }
        @media (max-width: 768px) { .auth-form-logo { display: flex !important; } }

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
        .auth-input-wrap { position: relative; }
        .auth-input-wrap .auth-input { padding-right: 44px; }
        .auth-eye {
          position: absolute; right: 14px; top: 50%; transform: translateY(-50%);
          background: none; border: none; cursor: pointer; color: var(--text-muted);
          display: flex; align-items: center; padding: 0;
          transition: color 0.2s;
        }
        .auth-eye:hover { color: var(--text-base); }

        .auth-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; }
        .auth-forgot { font-size: 13px; color: var(--text-sub); text-decoration: none; transition: color 0.2s; }
        .auth-forgot:hover { color: var(--text-base); }

        .auth-submit {
          width: 100%; height: 46px; border-radius: 8px; border: none; cursor: pointer;
          background: var(--sidebar-bg); color: rgba(255,235,210,0.95); font-family: 'DM Sans', sans-serif;
          font-size: 14px; font-weight: 500; display: flex; align-items: center;
          justify-content: center; gap: 8px; margin-top: 8px;
          transition: opacity 0.2s, transform 0.15s;
        }
        .auth-submit:hover:not(:disabled) { opacity: 0.86; transform: translateY(-1px); }
        .auth-submit:disabled { opacity: 0.5; cursor: not-allowed; }

        .auth-divider {
          display: flex; align-items: center; gap: 12px; margin: 24px 0;
          font-size: 12px; color: var(--text-muted);
        }
        .auth-divider::before, .auth-divider::after {
          content: ''; flex: 1; height: 1px; background: var(--border-soft);
        }

        .auth-footer { margin-top: 28px; text-align: center; font-size: 13px; color: var(--text-sub); }
        .auth-footer a { color: var(--text-base); font-weight: 500; text-decoration: none; }
        .auth-footer a:hover { text-decoration: underline; }

        .auth-back {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 13px; color: var(--text-sub); text-decoration: none;
          margin-bottom: 36px; transition: color 0.2s;
        }
        .auth-back:hover { color: var(--text-base); }

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
            <div>
              <div className="auth-stat-num">10+</div>
              <div className="auth-stat-label">Modules</div>
            </div>
            <div>
              <div className="auth-stat-num">28</div>
              <div className="auth-stat-label">DB tables</div>
            </div>
            <div>
              <div className="auth-stat-num">100%</div>
              <div className="auth-stat-label">Org isolated</div>
            </div>
          </div>
        </div>

        {/* Right panel — form */}
        <div className="auth-right">
          <div className="auth-form-wrap">
            <Link to="/" className="auth-back">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11.5 7H2.5M6.5 3.5L3 7l3.5 3.5"/>
              </svg>
              Back to home
            </Link>

            <h1 className="auth-form-title">Welcome back</h1>
            <p className="auth-form-sub">Sign in to your hotel workspace</p>

            <form onSubmit={handleSubmit}>
              <div className="auth-field">
                <label className="auth-label">Email address</label>
                <input
                  name="email" type="email" className="auth-input"
                  placeholder="you@hotel.com" required autoFocus
                  value={form.email} onChange={handleChange}
                />
              </div>

              <div className="auth-field">
                <div className="auth-row">
                  <label className="auth-label" style={{ marginBottom: 0 }}>Password</label>
                  <Link to="/forgot-password" className="auth-forgot">Forgot password?</Link>
                </div>
                <div className="auth-input-wrap">
                  <input
                    name="password" type={show ? 'text' : 'password'}
                    className="auth-input" placeholder="••••••••" required
                    value={form.password} onChange={handleChange}
                  />
                  <button type="button" className="auth-eye" onClick={() => setShow(s => !s)}>
                    {show ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <button type="submit" className="auth-submit" disabled={loading}>
                {loading ? 'Signing in…' : <>Sign in <ArrowRight size={15} /></>}
              </button>
            </form>

            <div className="auth-footer">
              Don't have an account?{' '}
              <Link to="/register">Start free trial</Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}