// src/pages/RegisterPage.jsx — redesigned to match landing page aesthetic

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight, CheckCircle2, Building2 } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import api from '../lib/axios';
import toast from 'react-hot-toast';
import Logo from '../components/brand/Logo';

const FONT_LINK = 'https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600&display=swap';

const PERKS = [
  '14-day free trial, no credit card',
  'All 10 modules included',
  'Unlimited rooms & staff',
  'Guest website API integration',
];

function PasswordStrength({ password }) {
  if (!password) return null;
  const score = [password.length >= 8, /[A-Z]/.test(password), /\d/.test(password)].filter(Boolean).length;
  const colors = ['#ef4444', '#f59e0b', '#1a6b4a'];
  const labels = ['Weak', 'Fair', 'Strong'];
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
        {[0,1,2].map(i => (
          <div key={i} style={{
            flex: 1, height: 3, borderRadius: 2,
            background: i < score ? colors[score-1] : '#e8e6e1',
            transition: 'background 0.3s'
          }} />
        ))}
      </div>
      {score > 0 && (
        <span style={{ fontSize: 11, color: colors[score-1] }}>{labels[score-1]}</span>
      )}
    </div>
  );
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [form, setForm] = useState({
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
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link href={FONT_LINK} rel="stylesheet" />

      <style>{`
        .reg-page * { box-sizing: border-box; margin: 0; padding: 0; }
        .reg-page {
          min-height: 100vh; display: grid; grid-template-columns: 1fr 1fr;
          font-family: 'DM Sans', system-ui, sans-serif;
          -webkit-font-smoothing: antialiased;
        }
        @media (max-width: 768px) { .reg-page { grid-template-columns: 1fr; } .reg-left { display: none !important; } }

        .reg-left {
          background: #0a0a0a; padding: 48px;
          display: flex; flex-direction: column; justify-content: space-between;
          position: relative; overflow: hidden;
        }
        .reg-left-grid {
          position: absolute; inset: 0; opacity: 0.04;
          background-image: linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px);
          background-size: 40px 40px;
        }
        .reg-left-mid { position: relative; z-index: 1; }
        .reg-left-eyebrow {
          font-size: 11px; font-weight: 500; letter-spacing: 0.1em;
          text-transform: uppercase; color: #1a6b4a; margin-bottom: 20px;
        }
        .reg-left-headline {
          font-family: 'Instrument Serif', Georgia, serif;
          font-size: clamp(32px, 3vw, 48px); font-weight: 400;
          line-height: 1.1; letter-spacing: -0.02em; color: #fff; margin-bottom: 28px;
        }
        .reg-left-headline em { font-style: italic; color: rgba(255,255,255,0.35); }
        .reg-perks { display: flex; flex-direction: column; gap: 12px; }
        .reg-perk { display: flex; align-items: center; gap: 10px; font-size: 14px; font-weight: 300; color: rgba(255,255,255,0.55); }
        .reg-perk-check {
          width: 18px; height: 18px; border-radius: 50%; background: #1a6b4a;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }

        .reg-trial-badge {
          position: relative; z-index: 1;
          border: 1px solid rgba(255,255,255,0.1); border-radius: 10px;
          padding: 14px 18px; display: flex; align-items: center; gap: 12px;
        }
        .reg-trial-icon {
          width: 32px; height: 32px; background: rgba(26,107,74,0.3);
          border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .reg-trial-title { font-size: 13px; font-weight: 500; color: #fff; }
        .reg-trial-sub { font-size: 12px; color: rgba(255,255,255,0.4); margin-top: 1px; }

        .reg-right {
          background: #fff; display: flex; align-items: center; justify-content: center;
          padding: 40px; border-left: 1px solid #e8e6e1;
        }
        .reg-form-wrap { width: 100%; max-width: 380px; }

        .reg-steps { display: flex; align-items: center; gap: 8px; margin-bottom: 36px; }
        .reg-step-item { display: flex; align-items: center; gap: 8px; }
        .reg-step-circle {
          width: 26px; height: 26px; border-radius: 50%; font-size: 12px; font-weight: 600;
          display: flex; align-items: center; justify-content: center; transition: all 0.3s;
        }
        .reg-step-circle.done { background: #1a6b4a; color: #fff; }
        .reg-step-circle.active { background: #0a0a0a; color: #fff; }
        .reg-step-circle.idle { background: #f5f4f1; color: #b5b3ae; border: 1.5px solid #e8e6e1; }
        .reg-step-label { font-size: 12px; font-weight: 500; transition: color 0.3s; }
        .reg-step-connector { flex: 1; height: 1px; background: #e8e6e1; min-width: 20px; }

        .reg-form-title {
          font-family: 'Instrument Serif', Georgia, serif;
          font-size: 26px; font-weight: 400; letter-spacing: -0.01em;
          color: #1a1a1a; margin-bottom: 6px;
        }
        .reg-form-sub { font-size: 14px; color: #6b6b6b; margin-bottom: 28px; }

        .reg-field { margin-bottom: 16px; }
        .reg-label { display: block; font-size: 13px; font-weight: 500; color: #1a1a1a; margin-bottom: 6px; }
        .reg-input {
          width: 100%; height: 44px; padding: 0 14px;
          border: 1.5px solid #e8e6e1; border-radius: 8px;
          font-family: 'DM Sans', sans-serif; font-size: 14px; color: #1a1a1a;
          background: #fff; outline: none; transition: border-color 0.2s;
        }
        .reg-input:focus { border-color: #0a0a0a; }
        .reg-input::placeholder { color: #b5b3ae; }
        .reg-input-wrap { position: relative; }
        .reg-input-wrap .reg-input { padding-right: 44px; }
        .reg-eye {
          position: absolute; right: 14px; top: 50%; transform: translateY(-50%);
          background: none; border: none; cursor: pointer; color: #b5b3ae;
          display: flex; align-items: center; padding: 0; transition: color 0.2s;
        }
        .reg-eye:hover { color: #1a1a1a; }
        .reg-hint { font-size: 12px; color: #b5b3ae; margin-top: 5px; }
        .reg-hint span { color: #1a6b4a; }

        .reg-actions { display: flex; gap: 10px; margin-top: 8px; }
        .reg-btn-back {
          height: 46px; padding: 0 20px; border-radius: 8px;
          border: 1.5px solid #e8e6e1; background: #fff; cursor: pointer;
          font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 500; color: #6b6b6b;
          transition: border-color 0.2s, color 0.2s;
        }
        .reg-btn-back:hover { border-color: #0a0a0a; color: #1a1a1a; }
        .reg-btn-submit {
          flex: 1; height: 46px; border-radius: 8px; border: none; cursor: pointer;
          background: #0a0a0a; color: #fff; font-family: 'DM Sans', sans-serif;
          font-size: 14px; font-weight: 500; display: flex; align-items: center;
          justify-content: center; gap: 8px;
          transition: opacity 0.2s, transform 0.15s;
        }
        .reg-btn-submit:hover:not(:disabled) { opacity: 0.86; transform: translateY(-1px); }
        .reg-btn-submit:disabled { opacity: 0.5; cursor: not-allowed; }

        .reg-footer { margin-top: 24px; text-align: center; font-size: 13px; color: #6b6b6b; }
        .reg-footer a { color: #1a1a1a; font-weight: 500; text-decoration: none; }
        .reg-footer a:hover { text-decoration: underline; }

        .reg-back-link {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 13px; color: #6b6b6b; text-decoration: none; margin-bottom: 32px;
          transition: color 0.2s;
        }
        .reg-back-link:hover { color: #1a1a1a; }

        @keyframes regFadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .reg-form-body { animation: regFadeIn 0.3s ease both; }
      `}</style>

      <div className="reg-page">
        {/* Left panel */}
        <div className="reg-left">
          <div className="reg-left-grid" />
          <Logo size="sm" theme="light" />

          <div className="reg-left-mid">
            <div className="reg-left-eyebrow">Get started today</div>
            <h2 className="reg-left-headline">
              Your hotel<br/>workspace,<br/><em>ready in minutes</em>
            </h2>
            <div className="reg-perks">
              {PERKS.map(p => (
                <div key={p} className="reg-perk">
                  <div className="reg-perk-check">
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="2,5 4,7 8,3"/>
                    </svg>
                  </div>
                  {p}
                </div>
              ))}
            </div>
          </div>

          <div className="reg-trial-badge">
            <div className="reg-trial-icon">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#1a6b4a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            <div>
              <div className="reg-trial-title">14-day free trial</div>
              <div className="reg-trial-sub">No credit card required</div>
            </div>
          </div>
        </div>

        {/* Right panel — form */}
        <div className="reg-right">
          <div className="reg-form-wrap">
            <Link to="/" className="reg-back-link">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11.5 7H2.5M6.5 3.5L3 7l3.5 3.5"/>
              </svg>
              Back to home
            </Link>

            {/* Step indicator */}
            <div className="reg-steps">
              {['Organization', 'Your account'].map((label, i) => (
                <div key={label} className="reg-step-item" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div className={`reg-step-circle ${i < step ? 'done' : i === step ? 'active' : 'idle'}`}>
                    {i < step
                      ? <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="2,6 5,9 10,3"/></svg>
                      : i + 1
                    }
                  </div>
                  <span className="reg-step-label" style={{ color: i === step ? '#1a1a1a' : '#b5b3ae' }}>
                    {label}
                  </span>
                  {i < 1 && <div className="reg-step-connector" />}
                </div>
              ))}
            </div>

            {/* Step 0: Organization */}
            {step === 0 && (
              <form onSubmit={handleSubmit} className="reg-form-body">
                <h1 className="reg-form-title">Name your hotel</h1>
                <p className="reg-form-sub">This becomes your organization's workspace.</p>

                <div className="reg-field">
                  <label className="reg-label">Hotel or organization name</label>
                  <div className="reg-input-wrap" style={{ display: 'flex', alignItems: 'center' }}>
                    <Building2 size={15} style={{ position: 'absolute', left: 14, color: '#b5b3ae', pointerEvents: 'none' }} />
                    <input
                      name="org_name" type="text" className="reg-input"
                      style={{ paddingLeft: 40 }}
                      placeholder="Grand Palace Hotel" required minLength={2}
                      value={form.org_name} onChange={handleChange} autoFocus
                    />
                  </div>
                  {slugPreview && (
                    <p className="reg-hint">Workspace: <span>{slugPreview}.cierlo.io</span></p>
                  )}
                </div>

                <div className="reg-actions">
                  <button type="submit" className="reg-btn-submit">
                    Continue <ArrowRight size={15} />
                  </button>
                </div>
              </form>
            )}

            {/* Step 1: Admin account */}
            {step === 1 && (
              <form onSubmit={handleSubmit} className="reg-form-body">
                <h1 className="reg-form-title">Create your account</h1>
                <p className="reg-form-sub">You'll use this to sign in as the admin.</p>

                <div className="reg-field">
                  <label className="reg-label">Full name</label>
                  <input
                    name="admin_name" type="text" className="reg-input"
                    placeholder="Amara Okonkwo" required
                    value={form.admin_name} onChange={handleChange} autoFocus
                  />
                </div>

                <div className="reg-field">
                  <label className="reg-label">Email address</label>
                  <input
                    name="admin_email" type="email" className="reg-input"
                    placeholder="you@hotel.com" required
                    value={form.admin_email} onChange={handleChange}
                  />
                </div>

                <div className="reg-field">
                  <label className="reg-label">Password</label>
                  <div className="reg-input-wrap">
                    <input
                      name="admin_password" type={showPass ? 'text' : 'password'}
                      className="reg-input" placeholder="Min. 8 characters"
                      required minLength={8}
                      value={form.admin_password} onChange={handleChange}
                    />
                    <button type="button" className="reg-eye" onClick={() => setShowPass(s => !s)}>
                      {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  <PasswordStrength password={form.admin_password} />
                </div>

                <div className="reg-actions">
                  <button type="button" className="reg-btn-back" onClick={() => setStep(0)}>
                    Back
                  </button>
                  <button type="submit" className="reg-btn-submit" disabled={loading}>
                    {loading
                      ? 'Creating account…'
                      : <>Create account <ArrowRight size={15} /></>
                    }
                  </button>
                </div>
              </form>
            )}

            <div className="reg-footer">
              Already have an account?{' '}
              <Link to="/login">Sign in</Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}