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
    // In production this would POST to a support endpoint
    const mailto = `mailto:support@cierlo.com?subject=${encodeURIComponent(`[${form.category || 'General'}] ${form.subject}`)}&body=${encodeURIComponent(form.message)}`;
    window.location.href = mailto;
    setSent(true);
  };

  if (sent) return (
    <PublicLayout>
    <div className="max-w-lg pt-20 mx-auto mt-16 text-center">
      <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
        style={{ backgroundColor: 'var(--s-green-bg)' }}>
        <CheckCircle size={26} style={{ color: 'var(--s-green-text)' }} />
      </div>
      <h2 className="text-base font-semibold mb-2" style={{ color: 'var(--text-base)' }}>Message sent</h2>
      <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>
        We'll get back to you at your account email within 24 hours.
      </p>
      <button onClick={() => setSent(false)} className="btn-primary px-5 py-2 text-sm">Send another</button>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto pb-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        {[
          { icon: MessageCircle, label: 'Live Chat',    sub: 'Mon–Fri, 8am–6pm WAT',  color: '#3b82f6', action: null },
          { icon: Mail,          label: 'Email',        sub: 'support@cierlo.com',     color: '#10b981', action: 'mailto:support@cierlo.com' },
        ].map(({ icon: Icon, label, sub, color, action }) => (
          <a key={label} href={action || '#'}
            className="card p-4 flex items-center gap-3"
            style={{ textDecoration: 'none', opacity: action ? 1 : 0.6, cursor: action ? 'pointer' : 'default' }}>
            <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: `${color}18` }}>
              <Icon size={17} style={{ color }} />
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--text-base)' }}>{label}</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{sub}</p>
            </div>
          </a>
        ))}
      </div>

      <div className="card p-6 space-y-4">
        <h2 className="text-sm font-semibold" style={{ color: 'var(--text-base)' }}>Send a message</h2>

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

        <div className="flex justify-end">
          <button onClick={handleSubmit} disabled={!form.subject || !form.message}
            className="btn-primary px-5 py-2 text-sm">
            Send message
          </button>
        </div>
      </div>
    </div>
  );
    </PublicLayout>
  );
}