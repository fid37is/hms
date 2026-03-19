// src/modules/superAdmin/SuperAdminResetPasswordPage.jsx
//
// Supabase sends the admin to:
//   /super-admin/reset-password#access_token=...&type=recovery
//
// The Supabase client picks up the token from the URL fragment
// automatically when you call getSession(). Then we call
// supabase.auth.updateUser({ password }) to set the new password.

import { useState, useEffect }  from 'react';
import { useNavigate }           from 'react-router-dom';
import { supabaseClient }        from '../../lib/supabaseClient';

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

export default function SuperAdminResetPasswordPage() {
  const navigate = useNavigate();

  const [password,  setPassword]  = useState('');
  const [confirm,   setConfirm]   = useState('');
  const [showPw,    setShowPw]    = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [done,      setDone]      = useState(false);
  const [error,     setError]     = useState('');
  const [tokenReady, setTokenReady] = useState(false);

  // Supabase embeds the recovery token in the URL hash.
  // Calling getSession() exchanges it for a live session automatically.
  useEffect(() => {
    supabaseClient.auth.getSession().then(({ data }) => {
      if (data?.session) {
        setTokenReady(true);
      } else {
        setError('Reset link is invalid or has expired. Please request a new one.');
      }
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const { error: updateError } = await supabaseClient.auth.updateUser({ password });
      if (updateError) throw updateError;

      // Sign out the temporary recovery session — admin must log in fresh
      await supabaseClient.auth.signOut();
      setDone(true);
      setTimeout(() => navigate('/super-admin/login'), 3000);
    } catch (err) {
      setError(err.message || 'Failed to update password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputBase = {
    width: '100%',
    background: 'var(--bg-subtle)',
    border: '1px solid var(--border-base)',
    borderRadius: 7, color: 'var(--text-base)',
    fontSize: 14, outline: 'none',
  };

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg-page)',
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

        <div className="card" style={{ padding: '28px 32px' }}>
          {done ? (
            /* Success */
            <div style={{ textAlign: 'center', padding: '8px 0' }}>
              <div style={{
                width: 48, height: 48, borderRadius: '50%',
                background: 'var(--s-green-bg)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px',
              }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                  stroke="var(--s-green-text)" strokeWidth="2" strokeLinecap="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-base)', marginBottom: 8 }}>
                Password updated
              </p>
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                Redirecting to sign in…
              </p>
            </div>
          ) : (
            <>
              <p style={{
                fontSize: 11, fontWeight: 600, textTransform: 'uppercase',
                letterSpacing: '.6px', color: 'var(--brand)', marginBottom: 8,
              }}>
                Set New Password
              </p>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
                Choose a strong password for your admin account.
              </p>

              {error && (
                <div style={{
                  marginBottom: 14, padding: '10px 12px',
                  background: 'var(--s-red-bg)',
                  border: '1px solid rgba(251,146,60,.25)',
                  borderRadius: 7, fontSize: 12,
                  color: 'var(--s-red-text)',
                }}>
                  {error}
                  {!tokenReady && (
                    <span>
                      {' '}
                      <a href="/super-admin/forgot-password"
                        style={{ color: 'var(--brand)', textDecoration: 'none' }}>
                        Request a new link →
                      </a>
                    </span>
                  )}
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

                {/* New password */}
                <div>
                  <label style={{ fontSize: 12, color: 'var(--text-sub)', display: 'block', marginBottom: 5 }}>
                    New Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPw ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Min. 8 characters"
                      required
                      minLength={8}
                      disabled={!tokenReady}
                      style={{ ...inputBase, padding: '9px 40px 9px 12px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(s => !s)}
                      style={{
                        position: 'absolute', right: 10, top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none', border: 'none', padding: '2px',
                        cursor: 'pointer',
                        color: showPw ? 'var(--brand)' : 'var(--text-muted)',
                        display: 'flex', alignItems: 'center',
                        transition: 'color .15s',
                      }}
                    >
                      {showPw ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  </div>

                  {/* Strength indicator */}
                  {password.length > 0 && (
                    <StrengthBar password={password} />
                  )}
                </div>

                {/* Confirm password */}
                <div>
                  <label style={{ fontSize: 12, color: 'var(--text-sub)', display: 'block', marginBottom: 5 }}>
                    Confirm Password
                  </label>
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    placeholder="Repeat new password"
                    required
                    disabled={!tokenReady}
                    style={{
                      ...inputBase, padding: '9px 12px',
                      border: `1px solid ${confirm && confirm !== password ? 'rgba(251,146,60,.6)' : 'var(--border-base)'}`,
                    }}
                  />
                  {confirm && confirm !== password && (
                    <p style={{ fontSize: 11, color: 'var(--s-red-text)', marginTop: 4 }}>
                      Passwords do not match
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading || !tokenReady}
                  className="btn-primary"
                  style={{
                    marginTop: 4, width: '100%', justifyContent: 'center',
                    opacity: (loading || !tokenReady) ? 0.5 : 1,
                    cursor: (loading || !tokenReady) ? 'not-allowed' : 'pointer',
                  }}
                >
                  {loading ? 'Saving…' : 'Set New Password'}
                </button>
              </form>
            </>
          )}
        </div>

        <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', marginTop: 20 }}>
          This console is restricted to platform administrators.
        </p>
      </div>
    </div>
  );
}

// ── Password strength bar ──────────────────────────────────
function StrengthBar({ password }) {
  const score = [
    password.length >= 8,
    password.length >= 12,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length;

  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very strong'];
  const colors = ['', '#FB923C', '#FCD34D', '#86EFAC', '#4ADE80', '#4ADE80'];

  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} style={{
            flex: 1, height: 3, borderRadius: 99,
            background: i <= score ? colors[score] : 'var(--bg-muted)',
            transition: 'background .2s',
          }} />
        ))}
      </div>
      <p style={{ fontSize: 11, color: colors[score] || 'var(--text-muted)', margin: 0 }}>
        {labels[score] || ''}
      </p>
    </div>
  );
}