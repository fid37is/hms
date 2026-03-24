import PublicLayout from '../../components/layout/PublicLayout';
import { useState } from 'react';
import { MessageCircle, Mail, CheckCircle } from 'lucide-react';

const CATEGORIES = [
  'Getting started', 'Reservations', 'Billing & payments',
  'Staff & permissions', 'F&B', 'Housekeeping',
  'Guest website', 'Technical issue', 'Other',
];

export default function SupportPage() {
  const [form, setForm] = useState({ category: '', subject: '', message: '' });
  const [sent, setSent] = useState(false);

  const handleSubmit = () => {
    if (!form.subject || !form.message) return;
    const mailto = `mailto:support@cierlo.com?subject=${encodeURIComponent(`[${form.category || 'General'}] ${form.subject}`)}&body=${encodeURIComponent(form.message)}`;
    window.location.href = mailto;
    setSent(true);
  };

  return (
    <PublicLayout>
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '100px 24px 64px' }}>

        {sent ? (
          <div style={{ textAlign: 'center', paddingTop: 40 }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--s-green-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <CheckCircle size={26} style={{ color: 'var(--s-green-text)' }} />
            </div>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-base)', marginBottom: 8 }}>Message sent</h2>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 20 }}>
              We'll get back to you at your account email within 24 hours.
            </p>
            <button onClick={() => setSent(false)} className="btn-primary px-5 py-2 text-sm">Send another</button>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: 32 }}>
              <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 8 }}>Support</p>
              <h1 style={{ fontSize: 'clamp(28px,4vw,40px)', fontWeight: 600, color: 'var(--text-base)', marginBottom: 8 }}>Contact Support</h1>
              <p style={{ fontSize: 15, color: 'var(--text-sub)' }}>We usually respond within a few hours on business days.</p>
            </div>

            {/* Contact options */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 28 }}>
              {[
                { icon: MessageCircle, label: 'Live Chat', sub: 'Mon–Fri, 8am–6pm WAT', color: '#3b82f6', action: null },
                { icon: Mail,          label: 'Email',     sub: 'support@cierlo.com',   color: '#10b981', action: 'mailto:support@cierlo.com' },
              ].map(({ icon: Icon, label, sub, color, action }) => (
                <a key={label} href={action || '#'}
                  className="card"
                  style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none', opacity: action ? 1 : 0.55, cursor: action ? 'pointer' : 'default' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={17} style={{ color }} />
                  </div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-base)', marginBottom: 2 }}>{label}</p>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{sub}</p>
                  </div>
                </a>
              ))}
            </div>

            {/* Form */}
            <div className="card" style={{ padding: 24 }}>
              <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-base)', marginBottom: 20 }}>Send a message</h2>
              <div className="space-y-4">
                <div className="form-group">
                  <label className="label">Category</label>
                  <select className="input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                    <option value="">Select a topic…</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="label">Subject *</label>
                  <input className="input" placeholder="Brief description of your issue"
                    value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="label">Message *</label>
                  <textarea className="input" rows={5}
                    placeholder="Describe your issue in detail. Include steps to reproduce if it's a bug."
                    value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button onClick={handleSubmit} disabled={!form.subject || !form.message} className="btn-primary px-5 py-2 text-sm">
                    Send message
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </PublicLayout>
  );
}