import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Hotel, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import * as authApi from '../lib/api/authApi';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [form,    setForm]    = useState({ email: '', password: '' });
  const [show,    setShow]    = useState(false);
  const [loading, setLoading] = useState(false);
  const { setAuth }           = useAuthStore();
  const navigate              = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authApi.login(form);
      const { access_token, user, permissions, must_change_password } = res.data.data;
      setAuth({ user, token: access_token, permissions, must_change_password });
      if (must_change_password) {
        // Don't greet yet — send to force-change screen
        navigate('/change-password', { replace: true });
      } else {
        toast.success(`Welcome, ${user.full_name}`);
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: 'var(--sidebar-bg)' }}>
      <div className="absolute inset-0 opacity-[0.04]"
        style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '28px 28px' }} />

      <div className="relative w-full max-w-[380px]">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4"
            style={{ backgroundColor: 'var(--accent)' }}>
            <Hotel size={22} color="white" />
          </div>
          <h1 className="text-white text-xl font-semibold tracking-tight">HMS Pro</h1>
          <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Hotel Management System</p>
        </div>

        <div className="card p-7">
          <h2 className="text-base font-semibold mb-5" style={{ color: 'var(--text-base)' }}>
            Sign in to your account
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="form-group">
              <label className="label">Email address</label>
              <input type="email" className="input" placeholder="you@hotel.com" required autoFocus
                value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>

            <div className="form-group">
              <div className="flex items-center justify-between mb-1">
                <label className="label mb-0">Password</label>
                <Link to="/forgot-password" className="text-xs" style={{ color: 'var(--brand)' }}>
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input type={show ? 'text' : 'password'} className="input pr-10"
                  placeholder="••••••••" required
                  value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
                <button type="button" onClick={() => setShow(!show)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--text-muted)' }}>
                  {show ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-2.5 mt-1">
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs mt-6" style={{ color: 'rgba(255,255,255,0.2)' }}>
          © {new Date().getFullYear()} HMS Pro — Staff Portal
        </p>
      </div>
    </div>
  );
}
