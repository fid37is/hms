import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Hotel, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { supabaseClient } from '../lib/supabaseClient';
import toast from 'react-hot-toast';

export default function ResetPasswordPage() {
  const [form,    setForm]    = useState({ password: '', confirm: '' });
  const [show,    setShow]    = useState(false);
  const [loading, setLoading] = useState(false);
  const [done,    setDone]    = useState(false);
  const navigate              = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) {
      toast.error('Passwords do not match');
      return;
    }
    if (form.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabaseClient.auth.updateUser({ password: form.password });
      if (error) throw error;
      setDone(true);
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      toast.error(err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: 'var(--bg-page)' }}>
      <div className="w-full max-w-sm">

        <div className="flex flex-col items-center mb-8">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
            style={{ backgroundColor: 'var(--brand)' }}>
            <Hotel size={20} color="white" />
          </div>
          <h1 className="text-lg font-semibold" style={{ color: 'var(--text-base)' }}>HMS Pro</h1>
        </div>

        <div className="card p-6">
          {!done ? (
            <>
              <h2 className="text-base font-semibold mb-1" style={{ color: 'var(--text-base)' }}>
                Set new password
              </h2>
              <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>
                Choose a strong password for your account.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="form-group">
                  <label className="label" htmlFor="rp-password">New Password</label>
                  <div className="relative">
                    <input id="rp-password" name="password"
                      type={show ? 'text' : 'password'} className="input pr-10" required
                      minLength={8} placeholder="Min. 8 characters"
                      value={form.password} onChange={handleChange} />
                    <button type="button" onClick={() => setShow(s => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                      style={{ color: 'var(--text-muted)' }}>
                      {show ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label className="label" htmlFor="rp-confirm">Confirm Password</label>
                  <input id="rp-confirm" name="confirm"
                    type={show ? 'text' : 'password'} className="input" required
                    value={form.confirm} onChange={handleChange} />
                </div>

                <button type="submit" disabled={loading} className="btn-primary w-full">
                  {loading ? 'Saving…' : 'Set Password'}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center py-4 space-y-3">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto"
                style={{ backgroundColor: 'var(--s-green-bg)' }}>
                <CheckCircle size={20} style={{ color: 'var(--s-green-text)' }} />
              </div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-base)' }}>Password updated!</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Redirecting to login…</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}