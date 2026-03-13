import PublicLayout from '../../components/layout/PublicLayout';
import { useState } from 'react';
import { ChevronUp, Plus, CheckCircle } from 'lucide-react';

const INITIAL = [
  { id: 1, title: 'Mobile app for staff', desc: 'Native iOS/Android app for housekeepers and maintenance staff.', votes: 34, status: 'planned', mine: false },
  { id: 2, title: 'Channel manager integration', desc: 'Sync availability with Booking.com, Expedia, and Airbnb automatically.', votes: 28, status: 'reviewing', mine: false },
  { id: 3, title: 'Dynamic pricing rules', desc: 'Automatically adjust room rates based on occupancy and season.', votes: 21, status: 'reviewing', mine: false },
  { id: 4, title: 'SMS notifications to guests', desc: 'Send automated SMS for booking confirmation, check-in reminders.', votes: 19, status: 'planned', mine: false },
  { id: 5, title: 'Offline mode', desc: 'Allow basic operations when internet is unavailable.', votes: 15, status: 'considering', mine: false },
  { id: 6, title: 'Custom report builder', desc: 'Drag-and-drop interface to build custom reports and export to Excel.', votes: 12, status: 'considering', mine: false },
];

const STATUS_STYLE = {
  planned:     { label: 'Planned',     bg: '#dbeafe', color: '#1d4ed8' },
  reviewing:   { label: 'Reviewing',   bg: '#fef9c3', color: '#854d0e' },
  considering: { label: 'Considering', bg: 'var(--bg-subtle)', color: 'var(--text-muted)' },
  done:        { label: 'Done',        bg: '#dcfce7', color: '#15803d' },
};

export default function FeedbackPage() {
  const [items, setItems] = useState(INITIAL);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', desc: '' });
  const [submitted, setSubmitted] = useState(false);

  const vote = (id) => {
    setItems(prev => prev.map(i => i.id === id
      ? { ...i, votes: i.mine ? i.votes - 1 : i.votes + 1, mine: !i.mine }
      : i
    ).sort((a, b) => b.votes - a.votes));
  };

  const submit = () => {
    if (!form.title.trim()) return;
    setItems(prev => [
      { id: Date.now(), title: form.title, desc: form.desc, votes: 1, status: 'considering', mine: true },
      ...prev,
    ].sort((a, b) => b.votes - a.votes));
    setForm({ title: '', desc: '' });
    setShowForm(false);
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <PublicLayout>
    <div className="max-w-2xl pt-20 mx-auto pb-8 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Vote on features you want to see. Most-voted get built first.
        </p>
        <button onClick={() => setShowForm(s => !s)} className="btn-primary flex items-center gap-1.5 px-3 py-1.5 text-xs">
          <Plus size={13} /> Suggest feature
        </button>
      </div>

      {submitted && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm"
          style={{ backgroundColor: 'var(--s-green-bg)', color: 'var(--s-green-text)' }}>
          <CheckCircle size={15} /> Feature request submitted — thanks!
        </div>
      )}

      {showForm && (
        <div className="card p-5 space-y-3">
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text-base)' }}>New feature request</h3>
          <div className="form-group">
            <label className="label">Title *</label>
            <input className="input" placeholder="e.g. Mobile app for housekeepers"
              value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="label">Description</label>
            <textarea className="input" rows={3} placeholder="More detail about the feature and why it would help…"
              value={form.desc} onChange={e => setForm(f => ({ ...f, desc: e.target.value }))} />
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowForm(false)} className="btn-secondary px-4 py-1.5 text-sm">Cancel</button>
            <button onClick={submit} disabled={!form.title.trim()} className="btn-primary px-4 py-1.5 text-sm">Submit</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {items.map(item => {
          const s = STATUS_STYLE[item.status] || STATUS_STYLE.considering;
          return (
            <div key={item.id} className="card p-4 flex items-start gap-4">
              <button onClick={() => vote(item.id)}
                className="flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg flex-shrink-0 transition-colors"
                style={{
                  border: `1px solid ${item.mine ? 'var(--brand)' : 'var(--border-soft)'}`,
                  backgroundColor: item.mine ? 'var(--brand-subtle)' : 'transparent',
                  cursor: 'pointer',
                }}>
                <ChevronUp size={14} style={{ color: item.mine ? 'var(--brand)' : 'var(--text-muted)' }} />
                <span className="text-xs font-bold" style={{ color: item.mine ? 'var(--brand)' : 'var(--text-base)' }}>
                  {item.votes}
                </span>
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-base)' }}>{item.title}</p>
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{ backgroundColor: s.bg, color: s.color }}>
                    {s.label}
                  </span>
                </div>
                {item.desc && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{item.desc}</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
    </PublicLayout>
  );
}