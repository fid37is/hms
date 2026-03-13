// src/modules/events/components/EventForm.jsx
import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { X } from 'lucide-react';
import * as eventApi from '../../../lib/api/eventApi';
import toast from 'react-hot-toast';

const EVENT_TYPES = ['wedding','conference','birthday','corporate','gala','exhibition','meeting','workshop','other'];
const LAYOUTS     = ['theatre','classroom','banquet','cocktail','boardroom','custom'];
const SOURCES     = ['direct','phone','website','referral','walk_in','other'];

const EMPTY = {
  title: '', client_name: '', client_email: '', client_phone: '',
  event_type: 'other', venue_id: '', event_date: '', start_time: '', end_time: '',
  guest_count: '', layout: 'banquet', source: 'direct',
  special_requests: '', internal_notes: '', catering_notes: '', setup_notes: '',
  deposit_due: '', discount: '',
};

export default function EventForm({ event, onClose, onSaved }) {
  const isEdit = !!event;
  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    if (event) {
      setForm({
        ...EMPTY,
        ...event,
        venue_id:    event.venue_id    || '',
        deposit_due: event.deposit_due ? event.deposit_due / 100 : '',
        discount:    event.discount    ? event.discount    / 100 : '',
      });
    }
  }, [event]);

  const { data: venuesData } = useQuery({
    queryKey: ['event-venues'],
    queryFn:  () => eventApi.getVenues().then(r => r.data.data),
  });
  const venues = venuesData || [];

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const mutation = useMutation({
    mutationFn: () => {
      const payload = {
        ...form,
        guest_count: parseInt(form.guest_count) || 0,
        deposit_due: form.deposit_due ? Math.round(parseFloat(form.deposit_due) * 100) : 0,
        discount:    form.discount    ? Math.round(parseFloat(form.discount)    * 100) : 0,
        venue_id:    form.venue_id || null,
      };
      return isEdit
        ? eventApi.updateEvent(event.id, payload)
        : eventApi.createEvent(payload);
    },
    onSuccess: () => {
      toast.success(isEdit ? 'Event updated.' : 'Event created.');
      onSaved();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to save event'),
  });

  const field = (label, key, type = 'text', props = {}) => (
    <div>
      <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>{label}</label>
      <input type={type} className="input text-sm w-full" value={form[key]}
        onChange={e => set(key, e.target.value)} {...props} />
    </div>
  );

  const select = (label, key, opts) => (
    <div>
      <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>{label}</label>
      <select className="input text-sm w-full" value={form[key]} onChange={e => set(key, e.target.value)}>
        {opts.map(o => (
          <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o.charAt(0).toUpperCase() + o.slice(1).replace(/_/g,' ')}</option>
        ))}
      </select>
    </div>
  );

  const textarea = (label, key, rows = 2) => (
    <div>
      <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>{label}</label>
      <textarea className="input text-sm w-full" rows={rows} value={form[key] || ''}
        onChange={e => set(key, e.target.value)} />
    </div>
  );

  return (
    <div className="slide-panel-overlay">
      <div className="slide-panel" style={{ maxWidth: 560 }}>
        {/* Header */}
        <div className="slide-panel-header">
          <div>
            <h2 className="text-base font-semibold" style={{ color: 'var(--text-base)' }}>
              {isEdit ? 'Edit Event' : 'New Event'}
            </h2>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {isEdit ? `Editing ${event.event_no}` : 'Fill in event details'}
            </p>
          </div>
          <button className="btn-ghost p-2 rounded-lg" onClick={onClose}><X size={16} /></button>
        </div>

        {/* Body */}
        <div className="slide-panel-body space-y-5">

          {/* Client */}
          <section>
            <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--text-muted)' }}>Client</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">{field('Client Name *', 'client_name')}</div>
              {field('Email', 'client_email', 'email')}
              {field('Phone', 'client_phone', 'tel')}
            </div>
          </section>

          {/* Event Details */}
          <section>
            <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--text-muted)' }}>Event Details</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">{field('Event Title *', 'title')}</div>
              {select('Event Type', 'event_type', EVENT_TYPES)}
              {select('Source', 'source', SOURCES)}
            </div>
          </section>

          {/* Venue & Timing */}
          <section>
            <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--text-muted)' }}>Venue & Timing</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Venue</label>
                <select className="input text-sm w-full" value={form.venue_id} onChange={e => set('venue_id', e.target.value)}>
                  <option value="">— No venue assigned —</option>
                  {venues.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                </select>
              </div>
              {field('Event Date *', 'event_date', 'date')}
              {select('Layout', 'layout', LAYOUTS)}
              {field('Start Time *', 'start_time', 'time')}
              {field('End Time *',   'end_time',   'time')}
              {field('Expected Guests', 'guest_count', 'number', { min: 0 })}
            </div>
          </section>

          {/* Financials */}
          <section>
            <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--text-muted)' }}>Financials</p>
            <div className="grid grid-cols-2 gap-3">
              {field('Deposit Due (₦)', 'deposit_due', 'number', { min: 0, step: '0.01' })}
              {field('Discount (₦)',    'discount',    'number', { min: 0, step: '0.01' })}
            </div>
          </section>

          {/* Notes */}
          <section>
            <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--text-muted)' }}>Notes</p>
            <div className="space-y-3">
              {textarea('Special Requests',   'special_requests')}
              {textarea('Catering Notes',      'catering_notes')}
              {textarea('Setup / Décor Notes', 'setup_notes')}
              {textarea('Internal Notes',      'internal_notes')}
            </div>
          </section>

        </div>

        {/* Footer */}
        <div className="slide-panel-footer">
          <button className="btn-ghost text-sm" onClick={onClose}>Cancel</button>
          <button className="btn-primary text-sm" onClick={() => mutation.mutate()} disabled={mutation.isPending}>
            {mutation.isPending ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Event'}
          </button>
        </div>
      </div>
    </div>
  );
}