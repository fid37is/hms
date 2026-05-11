// src/pages/LoginPage.jsx

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import * as authApi from '../lib/api/authApi';
import toast from 'react-hot-toast';
import AuthLayout from '../components/layout/AuthLayout';

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
    <AuthLayout>
      <Link to="/" className="al-back">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11.5 7H2.5M6.5 3.5L3 7l3.5 3.5"/>
        </svg>
        Back to home
      </Link>

      <h1 className="al-title">Welcome back</h1>
      <p className="al-sub">Sign in to your hotel workspace</p>

      <form onSubmit={handleSubmit}>
        <div className="al-field">
          <label className="al-label">Email address</label>
          <input
            name="email" type="email" className="al-input"
            placeholder="you@hotel.com" required autoFocus
            value={form.email} onChange={handleChange}
          />
        </div>

        <div className="al-field">
          <div className="al-label-row">
            <label className="al-label">Password</label>
            <Link to="/forgot-password" className="al-forgot">Forgot password?</Link>
          </div>
          <div className="al-input-wrap">
            <input
              name="password" type={show ? 'text' : 'password'}
              className="al-input" placeholder="••••••••" required
              value={form.password} onChange={handleChange}
            />
            <button type="button" className="al-eye" onClick={() => setShow(s => !s)}>
              {show ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>

        <button type="submit" className="al-submit" disabled={loading}>
          {loading ? 'Signing in…' : <>Sign in <ArrowRight size={15} /></>}
        </button>
      </form>

      <div className="al-footer">
        Don't have an account?{' '}
        <Link to="/register">Start free trial</Link>
      </div>
    </AuthLayout>
  );
}