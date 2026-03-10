import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Hotel, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import * as authApi from '../lib/api/authApi';
import toast from 'react-hot-toast';

function PasswordInput({ id, name, value, onChange, placeholder, show, onToggle }) {
  return (
    <div className="relative">
      <input
        id={id} name={name}
        type={show ? 'text' : 'password'}
        className="input pr-10" required minLength={8}
        placeholder={placeholder}
        value={value} onChange={onChange}
      />
      <button type="button" onClick={onToggle} tabIndex={-1}
        className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
        style={{ color: show ? 'var(--brand)' : 'var(--text-muted)' }}>
        {show ? <EyeOff size={14} /> : <Eye size={14} />}
      </button>
    </div>
  );
}

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
      await authApi.forceChangePassword({
        new_password: form.new_password,
      });
      clearMustChangePassword();
      toast.success(`Welcome, ${user?.full_name}! Password updated.`);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: 'var(--sidebar-bg)' }}>

      {/* Dot-grid background */}
      <div className="absolute inset-0 opacity-[0.04]"
        style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '28px 28px' }} />

      <div className="relative w-full max-w-[400px]">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4"
            style={{ backgroundColor: 'var(--accent)' }}>
            <Hotel size={22} style={{ color: 'var(--text-on-brand)' }} />
          </div>
          <h1 className="text-xl font-semibold" style={{ color: 'var(--sidebar-text-active)' }}>HMS Pro</h1>
        </div>

        <div className="card p-7">
          {/* Warning banner */}
          <div className="flex items-start gap-3 mb-5 p-3 rounded-lg"
            style={{ backgroundColor: 'var(--s-yellow-bg)' }}>
            <ShieldCheck size={16} style={{ color: 'var(--s-yellow-text)', flexShrink: 0, marginTop: 1 }} />
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--s-yellow-text)' }}>
                Password change required
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--s-yellow-text)', opacity: 0.8 }}>
                You're using a temporary password. Set a new one to continue.
              </p>
            </div>
          </div>

          <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>
            Hi <strong style={{ color: 'var(--text-base)' }}>{user?.full_name}</strong>,
            please choose a personal password.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="form-group">
              <label className="label" htmlFor="fcp-new">New Password</label>
              <PasswordInput
                id="fcp-new" name="new_password"
                placeholder="Min. 8 characters"
                value={form.new_password} onChange={handleChange}
                show={showNew} onToggle={() => setShowNew(s => !s)}
              />
            </div>

            <div className="form-group">
              <label className="label" htmlFor="fcp-confirm">Confirm New Password</label>
              <PasswordInput
                id="fcp-confirm" name="confirm"
                placeholder="Repeat your new password"
                value={form.confirm} onChange={handleChange}
                show={showCfm} onToggle={() => setShowCfm(s => !s)}
              />
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-2.5">
              {loading ? 'Saving…' : 'Set Password & Continue'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}