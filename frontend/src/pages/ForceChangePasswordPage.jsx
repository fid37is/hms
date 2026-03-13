import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import * as authApi from '../lib/api/authApi';
import toast from 'react-hot-toast';
import Logo from '../components/brand/cierlo_logo';

const FONT_LINK = 'https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600&display=swap';

export default function ForceChangePasswordPage() {
  const [form,    setForm]    = useState({ new_password: '', confirm: '' });
  const [showNew, setShowNew] = useState(false);
  const [showCfm, setShowCfm] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user, clearMustChangePassword } = useAuthStore();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.new_password !== form.confirm) {
      toast.error('Passwords do not match');
      return;
    }
    if (form.new_password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    setLoading(true);
    try {
      await authApi.forceChangePassword({ new_password: form.new_password });
      clearMustChangePassword();
      toast.success(`Welcome, ${user?.full_name?.split(' ')[0]}! Password updated.`);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update password');
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
        .auth-form-sub { font-size: 14px; color: var(--text-sub); margin-bottom: 24px; }

        .auth-notice {
          display: flex; gap: 10px; align-items: flex-start;
          background: var(--s-yellow-bg); border: 1px solid #fde68a;
          border-radius: 8px; padding: 12px 14px; margin-bottom: 24px;
        }
        .auth-notice-icon { flex-shrink: 0; margin-top: 1px; color: var(--brand); }
        .auth-notice-title { font-size: 13px; font-weight: 500; color: var(--s-yellow-text); }
        .auth-notice-body  { font-size: 12px; color: var(--s-yellow-text); margin-top: 2px; line-height: 1.5; }

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

        .auth-hint { font-size: 12px; color: var(--text-muted); margin-top: 5px; }

        .auth-submit {
          width: 100%; height: 46px; border-radius: 8px; border: none; cursor: pointer;
          background: var(--sidebar-bg); color: rgba(255,235,210,0.95); font-family: 'DM Sans', sans-serif;
          font-size: 14px; font-weight: 500; display: flex; align-items: center;
          justify-content: center; gap: 8px; margin-top: 8px;
          transition: opacity 0.2s, transform 0.15s;
        }
        .auth-submit:hover:not(:disabled) { opacity: 0.86; transform: translateY(-1px); }
        .auth-submit:disabled { opacity: 0.5; cursor: not-allowed; }

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
        .auth-form-wrap > *:nth-child(6) { animation-delay: 0.30s; }
      `}</style>

      <div className="auth-page">
        {/* Left panel — identical to LoginPage */}
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

        {/* Right panel — password change form */}
        <div className="auth-right">
          <div className="auth-form-wrap">
            <h1 className="auth-form-title">Set your password</h1>
            <p className="auth-form-sub">
              Hi {user?.full_name?.split(' ')[0] || 'there'}, welcome aboard.
            </p>

            {/* Warning notice */}
            <div className="auth-notice">
              <ShieldCheck size={15} className="auth-notice-icon" />
              <div>
                <div className="auth-notice-title">Password change required</div>
                <div className="auth-notice-body">
                  You're signed in with a temporary password. Choose a personal one to continue.
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="auth-field">
                <label className="auth-label">New password</label>
                <div className="auth-input-wrap">
                  <input
                    name="new_password" type={showNew ? 'text' : 'password'}
                    className="auth-input" placeholder="Min. 8 characters" required
                    minLength={8} autoFocus
                    value={form.new_password} onChange={handleChange}
                  />
                  <button type="button" className="auth-eye" onClick={() => setShowNew(s => !s)}>
                    {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                <div className="auth-hint">At least 8 characters</div>
              </div>

              <div className="auth-field">
                <label className="auth-label">Confirm new password</label>
                <div className="auth-input-wrap">
                  <input
                    name="confirm" type={showCfm ? 'text' : 'password'}
                    className="auth-input" placeholder="Repeat your password" required
                    value={form.confirm} onChange={handleChange}
                  />
                  <button type="button" className="auth-eye" onClick={() => setShowCfm(s => !s)}>
                    {showCfm ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {/* Inline match feedback */}
                {form.confirm.length > 0 && (
                  <div className="auth-hint" style={{
                    color: form.new_password === form.confirm ? 'var(--s-green-text)' : 'var(--s-red-text)'
                  }}>
                    {form.new_password === form.confirm ? '✓ Passwords match' : 'Passwords do not match'}
                  </div>
                )}
              </div>

              <button type="submit" className="auth-submit" disabled={loading}>
                {loading ? 'Saving…' : <>Set password & continue <ArrowRight size={15} /></>}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}