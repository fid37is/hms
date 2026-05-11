// src/pages/RegisterPage.jsx

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight, Building2 } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import api from '../lib/axios';
import toast from 'react-hot-toast';
import AuthLayout from '../components/layout/AuthLayout';

const REGISTER_STATS = [
  { num: '14',    label: 'Day free trial' },
  { num: '10+',   label: 'Modules'        },
  { num: '100%',  label: 'Org isolated'   },
];

const REGISTER_HEADLINE = (
  <>Your hotel<br />workspace,<br /><em>ready in minutes</em></>
);

const REGISTER_PERKS = [
  '14-day free trial, no credit card',
  'All 10 modules included',
  'Unlimited rooms & staff',
  'Guest website included',
];

function PasswordStrength({ password }) {
  if (!password) return null;
  const score = [password.length >= 8, /[A-Z]/.test(password), /\d/.test(password)].filter(Boolean).length;
  const colors = ['#ef4444', '#f59e0b', '#16a34a'];
  const labels = ['Weak', 'Fair', 'Strong'];
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            flex: 1, height: 3, borderRadius: 2,
            background: i < score ? colors[score - 1] : 'var(--border-soft)',
            transition: 'background 0.3s',
          }} />
        ))}
      </div>
      {score > 0 && (
        <span style={{ fontSize: 11, color: colors[score - 1] }}>{labels[score - 1]}</span>
      )}
    </div>
  );
}

// Perk list rendered inside left panel body slot
function PerkList() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
      {REGISTER_PERKS.map(p => (
        <div key={p} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, fontWeight: 300, color: 'rgba(255,220,170,0.62)' }}>
          <div style={{
            width: 17, height: 17, borderRadius: '50%',
            background: 'rgba(22,163,74,0.7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <svg width="9" height="9" viewBox="0 0 10 10" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="2,5 4,7 8,3" />
            </svg>
          </div>
          {p}
        </div>
      ))}
    </div>
  );
}

export default function RegisterPage() {
  const navigate    = useNavigate();
  const { setAuth } = useAuthStore();
  const [step,      setStep]     = useState(0);
  const [loading,   setLoading]  = useState(false);
  const [showPass,  setShowPass] = useState(false);
  const [form,      setForm]     = useState({
    org_name: '', admin_name: '', admin_email: '', admin_password: '',
  });

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (step < 1) { setStep(s => s + 1); return; }
    setLoading(true);
    try {
      await api.post('/auth/register-org', form);
      const loginRes = await api.post('/auth/login', {
        email: form.admin_email, password: form.admin_password,
      });
      const { access_token, user, permissions, must_change_password } = loginRes.data.data;
      setAuth({ user, token: access_token, permissions, must_change_password });
      toast.success(`Welcome, ${user.full_name.split(' ')[0]}! Let's set up your hotel.`);
      navigate('/onboarding', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const slugPreview = form.org_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  return (
    <AuthLayout
      eyebrow="Get started today"
      headline={REGISTER_HEADLINE}
      body={<PerkList />}
      stats={REGISTER_STATS}
    >
      <Link to="/" className="al-back">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11.5 7H2.5M6.5 3.5L3 7l3.5 3.5" />
        </svg>
        Back to home
      </Link>

      {/* Step indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 32 }}>
        {['Organization', 'Your account'].map((label, i) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 26, height: 26, borderRadius: '50%',
              fontSize: 12, fontWeight: 600,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: i < step ? '#16a34a' : i === step ? 'var(--sidebar-bg)' : 'var(--bg-subtle)',
              color: i <= step ? 'rgba(255,235,210,0.95)' : 'var(--text-muted)',
              border: i > step ? '1.5px solid var(--border-soft)' : 'none',
              transition: 'all 0.3s',
            }}>
              {i < step
                ? <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="2,6 5,9 10,3" /></svg>
                : i + 1}
            </div>
            <span style={{
              fontSize: 12, fontWeight: 500,
              color: i === step ? 'var(--text-base)' : 'var(--text-muted)',
              transition: 'color 0.3s',
            }}>
              {label}
            </span>
            {i < 1 && <div style={{ flex: 1, height: 1, minWidth: 20, background: 'var(--border-soft)' }} />}
          </div>
        ))}
      </div>

      {/* Step 0: Organization */}
      {step === 0 && (
        <form onSubmit={handleSubmit}>
          <h1 className="al-title">Name your hotel</h1>
          <p className="al-sub">This becomes your organization's workspace.</p>

          <div className="al-field">
            <label className="al-label">Hotel or organization name</label>
            <div className="al-input-wrap">
              <Building2 size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
              <input
                name="org_name" type="text" className="al-input"
                style={{ paddingLeft: 40 }}
                placeholder="Grand Palace Hotel" required minLength={2}
                value={form.org_name} onChange={handleChange} autoFocus
              />
            </div>
            {slugPreview && (
              <p className="al-hint">Workspace: <span>{slugPreview}.cierlo.app</span></p>
            )}
          </div>

          <button type="submit" className="al-submit">
            Continue <ArrowRight size={15} />
          </button>
        </form>
      )}

      {/* Step 1: Admin account */}
      {step === 1 && (
        <form onSubmit={handleSubmit}>
          <h1 className="al-title">Create your account</h1>
          <p className="al-sub">You'll use this to sign in as the admin.</p>

          <div className="al-field">
            <label className="al-label">Full name</label>
            <input
              name="admin_name" type="text" className="al-input"
              placeholder="Amara Okonkwo" required
              value={form.admin_name} onChange={handleChange} autoFocus
            />
          </div>

          <div className="al-field">
            <label className="al-label">Email address</label>
            <input
              name="admin_email" type="email" className="al-input"
              placeholder="you@hotel.com" required
              value={form.admin_email} onChange={handleChange}
            />
          </div>

          <div className="al-field">
            <label className="al-label">Password</label>
            <div className="al-input-wrap">
              <input
                name="admin_password" type={showPass ? 'text' : 'password'}
                className="al-input" placeholder="Min. 8 characters"
                required minLength={8}
                value={form.admin_password} onChange={handleChange}
              />
              <button type="button" className="al-eye" onClick={() => setShowPass(s => !s)}>
                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            <PasswordStrength password={form.admin_password} />
          </div>

          <div className="al-btn-row">
            <button type="button" className="al-btn-secondary" onClick={() => setStep(0)}>
              Back
            </button>
            <button type="submit" className="al-submit" disabled={loading}>
              {loading ? 'Creating account…' : <>Create account <ArrowRight size={15} /></>}
            </button>
          </div>
        </form>
      )}

      <div className="al-footer">
        Already have an account?{' '}<Link to="/login">Sign in</Link>
      </div>
    </AuthLayout>
  );
}