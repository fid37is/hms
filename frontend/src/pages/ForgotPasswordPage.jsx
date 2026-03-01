import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Hotel, ArrowLeft, Mail } from 'lucide-react';
import * as authApi from '../lib/api/authApi';
import toast from 'react-hot-toast';

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
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: 'var(--bg-page)' }}>
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
            style={{ backgroundColor: 'var(--brand)' }}>
            <Hotel size={20} color="white" />
          </div>
          <h1 className="text-lg font-semibold" style={{ color: 'var(--text-base)' }}>HMS Pro</h1>
        </div>

        <div className="card p-6">
          {!sent ? (
            <>
              <h2 className="text-base font-semibold mb-1" style={{ color: 'var(--text-base)' }}>
                Forgot password
              </h2>
              <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>
                Enter your email and we'll send a reset link.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="form-group">
                  <label className="label" htmlFor="fp-email">Email</label>
                  <input id="fp-email" name="email" type="email" className="input" required
                    value={email} onChange={e => setEmail(e.target.value)} />
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full">
                  {loading ? 'Sending…' : 'Send Reset Link'}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center py-4 space-y-3">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto"
                style={{ backgroundColor: 'var(--s-green-bg)' }}>
                <Mail size={20} style={{ color: 'var(--s-green-text)' }} />
              </div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-base)' }}>Check your email</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                If <strong>{email}</strong> has an account, a reset link has been sent.
              </p>
            </div>
          )}
        </div>

        <div className="mt-4 text-center">
          <Link to="/login" className="inline-flex items-center gap-1.5 text-sm transition-colors"
            style={{ color: 'var(--text-muted)' }}>
            <ArrowLeft size={13} /> Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}