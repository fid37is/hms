// src/modules/superAdmin/SuperAdminLoginPage.jsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link }           from 'react-router-dom';
import toast                           from 'react-hot-toast';
import { superAdminLogin }             from '../../lib/api/superAdminApi';
import { useSuperAdminStore }          from '../../store/superAdminStore';

const COOLDOWN_SECONDS = 5 * 60;

function EyeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  );
}

function fmtCountdown(secs) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function SuperAdminLoginPage() {
  const navigate  = useNavigate();
  const setAuth   = useSuperAdminStore(s => s.setAuth);

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    const stored = sessionStorage.getItem('sa_cooldown_until');
    if (stored) {
      const remaining = Math.ceil((Number(stored) - Date.now()) / 1000);
      if (remaining > 0) startCountdown(remaining);
    }
    return () => clearInterval(timerRef.current);
  }, []);

  function startCountdown(seconds) {
    setCooldown(seconds);
    const until = Date.now() + seconds * 1000;
    sessionStorage.setItem('sa_cooldown_until', String(until));
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      const remaining = Math.ceil((until - Date.now()) / 1000);
      if (remaining <= 0) {
        clearInterval(timerRef.current);
        setCooldown(0);
        sessionStorage.removeItem('sa_cooldown_until');
      } else {
        setCooldown(remaining);
      }
    }, 1000);
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (cooldown > 0) return;
    setLoading(true);
    try {
      const res  = await superAdminLogin(email, password);
      const data = res.data.data;
      setAuth({ admin: data.admin, access_token: data.access_token });
      sessionStorage.removeItem('sa_cooldown_until');
      navigate('/super-admin', { replace: true });
    } catch (err) {
      const status  = err.response?.status;
      const message = err.response?.data?.message || 'Login failed.';
      if (status === 429) {
        startCountdown(COOLDOWN_SECONDS);
      } else {
        toast.error(message);
      }
    } finally {
      setLoading(false);
    }
  };

  const isLocked  = cooldown > 0;
  const canSubmit = !loading && !isLocked;

  const inputBase = {
    width: '100%',
    background: 'var(--bg-subtle)',
    border: `1px solid ${isLocked ? 'rgba(251,146,60,.4)' : 'var(--border-base)'}`,
    borderRadius: 7,
    color: isLocked ? 'var(--text-muted)' : 'var(--text-base)',
    fontSize: 14,
    outline: 'none',
    transition: 'border-color .15s',
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-page)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 44, height: 44, background: 'var(--brand)', borderRadius: 12,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 12px',
          }}>
            <svg width="22" height="22" viewBox="0 0 18 18" fill="none">
              <path d="M3 14V8l6-5 6 5v6H11v-4H7v4H3Z" fill="white"/>
            </svg>
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-base)', margin: 0 }}>
            Cierlo HMS
          </h1>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
            Platform Admin Console
          </p>
        </div>

        {/* Card */}
        <div className="card" style={{ padding: '28px 32px' }}>
          <p style={{
            fontSize: 11, fontWeight: 600, textTransform: 'uppercase',
            letterSpacing: '.6px', color: 'var(--brand)', marginBottom: 20,
          }}>
            Super Admin Sign In
          </p>

          {/* Cooldown banner */}
          {isLocked && (
            <div style={{
              marginBottom: 18, padding: '12px 14px',
              background: 'var(--s-red-bg)',
              border: '1px solid rgba(251,146,60,.25)',
              borderRadius: 8,
              display: 'flex', alignItems: 'flex-start', gap: 10,
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="var(--s-red-text)" strokeWidth="2" strokeLinecap="round"
                style={{ flexShrink: 0, marginTop: 1 }}>
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <div>
                <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--s-red-text)', margin: 0 }}>
                  Too many attempts — access locked
                </p>
                <p style={{ fontSize: 12, color: 'var(--s-red-text)', opacity: .8, marginTop: 3 }}>
                  Try again in{' '}
                  <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 13, letterSpacing: '.5px' }}>
                    {fmtCountdown(cooldown)}
                  </span>
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Email */}
            <div>
              <label style={{ fontSize: 12, color: 'var(--text-sub)', display: 'block', marginBottom: 5 }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@cierlo.io"
                required
                disabled={isLocked}
                style={{ ...inputBase, padding: '9px 12px' }}
              />
            </div>

            {/* Password + visibility toggle */}
            <div>
              <label style={{ fontSize: 12, color: 'var(--text-sub)', display: 'block', marginBottom: 5 }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={isLocked}
                  style={{ ...inputBase, padding: '9px 40px 9px 12px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(s => !s)}
                  disabled={isLocked}
                  title={showPw ? 'Hide password' : 'Show password'}
                  style={{
                    position: 'absolute', right: 10, top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none', border: 'none', padding: '2px',
                    cursor: isLocked ? 'not-allowed' : 'pointer',
                    color: showPw ? 'var(--brand)' : 'var(--text-muted)',
                    display: 'flex', alignItems: 'center',
                    transition: 'color .15s',
                  }}
                >
                  {showPw ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={!canSubmit}
              className="btn-primary"
              style={{
                marginTop: 6, width: '100%', justifyContent: 'center',
                opacity: canSubmit ? 1 : 0.5,
                cursor: canSubmit ? 'pointer' : 'not-allowed',
              }}
            >
              {loading ? 'Signing in…' : isLocked ? `Locked — ${fmtCountdown(cooldown)}` : 'Sign In'}
            </button>

            {/* Forgot password */}
            <p style={{ textAlign: 'center', margin: 0 }}>
              <Link
                to="/super-admin/forgot-password"
                style={{ fontSize: 12, color: 'var(--text-muted)', textDecoration: 'none', transition: 'color .15s' }}
                onMouseEnter={e => e.target.style.color = 'var(--brand)'}
                onMouseLeave={e => e.target.style.color = 'var(--text-muted)'}
              >
                Forgot password?
              </Link>
            </p>

          </form>
        </div>

        <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', marginTop: 20 }}>
          This console is restricted to platform administrators.
        </p>
      </div>
    </div>
  );
}