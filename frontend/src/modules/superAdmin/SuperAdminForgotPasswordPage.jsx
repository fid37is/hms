// src/modules/superAdmin/SuperAdminForgotPasswordPage.jsx
//
// Sends a Supabase password reset email directly from the client.
// No backend endpoint needed — supabase.auth.resetPasswordForEmail()
// works for any auth.users row including platform admins.
// The email link redirects to /super-admin/reset-password.

import { useState }          from 'react';
import { Link }              from 'react-router-dom';
import { supabaseClient }    from '../../lib/supabaseClient';

export default function SuperAdminForgotPasswordPage() {
  const [email,   setEmail]   = useState('');
  const [loading, setLoading] = useState(false);
  const [sent,    setSent]    = useState(false);
  const [error,   setError]   = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { error: resetError } = await supabaseClient.auth.resetPasswordForEmail(
        email,
        // redirectTo must be in your Supabase "Redirect URLs" allowlist
        { redirectTo: `${window.location.origin}/super-admin/reset-password` }
      );
      if (resetError) throw resetError;
      setSent(true);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputBase = {
    width: '100%', padding: '9px 12px',
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
          {!sent ? (
            <>
              <p style={{
                fontSize: 11, fontWeight: 600, textTransform: 'uppercase',
                letterSpacing: '.6px', color: 'var(--brand)', marginBottom: 8,
              }}>
                Reset Password
              </p>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
                Enter your admin email and we'll send a reset link.
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
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
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
                    style={inputBase}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary"
                  style={{ width: '100%', justifyContent: 'center', opacity: loading ? 0.6 : 1 }}
                >
                  {loading ? 'Sending…' : 'Send Reset Link'}
                </button>

                <p style={{ textAlign: 'center', margin: 0 }}>
                  <Link
                    to="/super-admin/login"
                    style={{ fontSize: 12, color: 'var(--text-muted)', textDecoration: 'none' }}
                    onMouseEnter={e => e.target.style.color = 'var(--brand)'}
                    onMouseLeave={e => e.target.style.color = 'var(--text-muted)'}
                  >
                    ← Back to sign in
                  </Link>
                </p>
              </form>
            </>
          ) : (
            /* Success state */
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
                Check your email
              </p>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20, lineHeight: 1.5 }}>
                A reset link was sent to <strong style={{ color: 'var(--text-sub)' }}>{email}</strong>.
                It expires in 1 hour.
              </p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 0 }}>
                Didn't receive it?{' '}
                <button
                  onClick={() => setSent(false)}
                  style={{ background: 'none', border: 'none', color: 'var(--brand)', fontSize: 12, cursor: 'pointer', padding: 0 }}
                >
                  Try again
                </button>
              </p>
            </div>
          )}
        </div>

        <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', marginTop: 20 }}>
          This console is restricted to platform administrators.
        </p>
      </div>
    </div>
  );
}