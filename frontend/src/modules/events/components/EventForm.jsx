// src/modules/events/components/EventForm.jsx
import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
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
        ...EMPTY, ...event,
        venue_id:    event.venue_id    || '',
        deposit_due: event.deposit_due ? event.deposit_due / 100 : '',
        discount:    event.discount    ? event.discount    / 100 : '',
      });
    } else {
      setForm(EMPTY);
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
      return isEdit ? eventApi.updateEvent(event.id, payload) : eventApi.createEvent(payload);
    },
    onSuccess: () => { toast.success(isEdit ? 'Event updated.' : 'Event created.'); onSaved(); },
    onError:   (err) => toast.error(err.response?.data?.message || 'Failed to save event'),
  });

  const F = ({ label, k, type = 'text', props = {} }) => (
    <div className="form-group">
      <label className="label">{label}</label>
      <input type={type} className="input text-sm w-full" value={form[k]}
        onChange={e => set(k, e.target.value)} {...props} />
    </div>
  );

  const S = ({ label, k, opts }) => (
    <div className="form-group">
      <label className="label">{label}</label>
      <select className="input text-sm w-full" value={form[k]} onChange={e => set(k, e.target.value)}>
        {opts.map(o => (
          <option key={o.value ?? o} value={o.value ?? o}>
            {o.label ?? (o.charAt(0).toUpperCase() + o.slice(1).replace(/_/g,' '))}
          </option>
        ))}
      </select>
    </div>
  );

  const T = ({ label, k, rows = 2 }) => (
    <div className="form-group">
      <label className="label">{label}</label>
      <textarea className="input text-sm w-full" rows={rows} value={form[k] || ''}
        onChange={e => set(k, e.target.value)} />
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">

        {/* Client */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--text-muted)' }}>Client</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><F label="Client Name *" k="client_name" /></div>
            <F label="Email" k="client_email" type="email" />
            <F label="Phone" k="client_phone" type="tel" />
          </div>
        </div>

        {/* Event Details */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--text-muted)' }}>Event Details</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><F label="Event Title *" k="title" /></div>
            <S label="Event Type" k="event_type" opts={EVENT_TYPES} />
            <S label="Source"     k="source"     opts={SOURCES} />
          </div>
        </div>

        {/* Venue & Timing */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--text-muted)' }}>Venue & Timing</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 form-group">
              <label className="label">Venue</label>
              <select className="input text-sm w-full" value={form.venue_id} onChange={e => set('venue_id', e.target.value)}>
                <option value="">— No venue assigned —</option>
                {venues.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </div>
            <F label="Event Date *"    k="event_date"  type="date" />
            <S label="Layout"          k="layout"      opts={LAYOUTS} />
            <F label="Start Time *"    k="start_time"  type="time" />
            <F label="End Time *"      k="end_time"    type="time" />
            <div className="col-span-2"><F label="Expected Guests" k="guest_count" type="number" props={{ min: 0 }} /></div>
          </div>
        </div>

        {/* Financials */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--text-muted)' }}>Financials</p>
          <div className="grid grid-cols-2 gap-3">
            <F label="Deposit Due (₦)" k="deposit_due" type="number" props={{ min: 0, step: '0.01' }} />
            <F label="Discount (₦)"    k="discount"    type="number" props={{ min: 0, step: '0.01' }} />
          </div>
        </div>

        {/* Notes */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--text-muted)' }}>Notes</p>
          <div className="space-y-3">
            <T label="Special Requests"   k="special_requests" />
            <T label="Catering Notes"     k="catering_notes" />
            <T label="Setup / Décor"      k="setup_notes" />
            <T label="Internal Notes"     k="internal_notes" />
          </div>
        </div>

      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-2 px-5 py-3 flex-shrink-0"
        style={{ borderTop: '1px solid var(--border-soft)' }}>
        <button className="btn-ghost text-sm" onClick={onClose}>Cancel</button>
        <button className="btn-primary text-sm" onClick={() => mutation.mutate()} disabled={mutation.isPending}>
          {mutation.isPending ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Event'}
        </button>
      </div>
    </div>
  );
}