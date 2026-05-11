// src/pages/ForgotPasswordPage.jsx

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Mail } from 'lucide-react';
import * as authApi from '../lib/api/authApi';
import toast from 'react-hot-toast';
import AuthLayout from '../components/layout/AuthLayout';

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
    <AuthLayout>
      {!sent ? (
        <>
          <Link to="/login" className="al-back">
            <ArrowLeft size={13} /> Back to login
          </Link>

          <h1 className="al-title">Forgot password?</h1>
          <p className="al-sub">Enter your work email and we'll send you a reset link.</p>

          <form onSubmit={handleSubmit}>
            <div className="al-field">
              <label className="al-label">Email address</label>
              <input
                type="email" className="al-input"
                placeholder="you@hotel.com" required autoFocus
                value={email} onChange={e => setEmail(e.target.value)}
              />
            </div>

            <button type="submit" className="al-submit" disabled={loading}>
              {loading ? 'Sending…' : <>Send reset link <ArrowRight size={15} /></>}
            </button>
          </form>

          <div className="al-footer">
            Remembered it?{' '}<Link to="/login">Back to sign in</Link>
          </div>
        </>
      ) : (
        <>
          <div className="al-success-icon">
            <Mail size={22} style={{ color: 'var(--s-green-text)' }} />
          </div>

          <h1 className="al-title">Check your inbox</h1>
          <p className="al-sub">
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

          <Link to="/login" className="al-back" style={{ marginBottom: 0 }}>
            <ArrowLeft size={13} /> Back to login
          </Link>
        </>
      )}
    </AuthLayout>
  );
}