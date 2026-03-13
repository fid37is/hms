// src/modules/events/components/VenuesPanel.jsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, X, MapPin, Users } from 'lucide-react';
import * as eventApi from '../../../lib/api/eventApi';
import { formatCurrency } from '../../../utils/format';
import toast from 'react-hot-toast';

const STATUS_OPTS = ['available','maintenance','blocked'];
const AMENITY_SUGGESTIONS = [
  'Air Conditioning','Wi-Fi','Projector','Screen','Microphone','Stage',
  'Dance Floor','Bar Counter','Catering Kitchen','Natural Light','Outdoor Access',
  'Parking','Disabled Access','Private Entrance',
];

const EMPTY = {
  name: '', description: '', floor: '',
  capacity_max: '', cap_theatre: '', cap_classroom: '',
  cap_banquet: '', cap_cocktail: '', cap_boardroom: '',
  rate_per_hour: '', rate_per_day: '',
  amenities: [], status: 'available', notes: '',
};

function VenueForm({ venue, onClose, onSaved }) {
  const isEdit = !!venue;
  const [form, setForm] = useState(() => venue ? {
    ...EMPTY, ...venue,
    rate_per_hour: venue.rate_per_hour ? venue.rate_per_hour / 100 : '',
    rate_per_day:  venue.rate_per_day  ? venue.rate_per_day  / 100 : '',
  } : EMPTY);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const toggleAmenity = (a) => {
    setForm(f => ({
      ...f,
      amenities: f.amenities.includes(a) ? f.amenities.filter(x => x !== a) : [...f.amenities, a],
    }));
  };

  const mut = useMutation({
    mutationFn: () => {
      const payload = {
        ...form,
        capacity_max:  parseInt(form.capacity_max)  || 0,
        cap_theatre:   parseInt(form.cap_theatre)   || 0,
        cap_classroom: parseInt(form.cap_classroom) || 0,
        cap_banquet:   parseInt(form.cap_banquet)   || 0,
        cap_cocktail:  parseInt(form.cap_cocktail)  || 0,
        cap_boardroom: parseInt(form.cap_boardroom) || 0,
        rate_per_hour: form.rate_per_hour ? Math.round(parseFloat(form.rate_per_hour) * 100) : 0,
        rate_per_day:  form.rate_per_day  ? Math.round(parseFloat(form.rate_per_day)  * 100) : 0,
      };
      return isEdit ? eventApi.updateVenue(venue.id, payload) : eventApi.createVenue(payload);
    },
    onSuccess: () => { toast.success(isEdit ? 'Venue updated' : 'Venue created'); onSaved(); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const field = (label, key, type = 'text', props = {}) => (
    <div>
      <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>{label}</label>
      <input type={type} className="input text-sm w-full" value={form[key]}
        onChange={e => set(key, e.target.value)} {...props} />
    </div>
  );

  return (
    <div className="slide-panel-overlay">
      <div className="slide-panel" style={{ maxWidth: 520 }}>
        <div className="slide-panel-header">
          <h2 className="text-base font-semibold" style={{ color: 'var(--text-base)' }}>
            {isEdit ? 'Edit Venue' : 'New Venue'}
          </h2>
          <button className="btn-ghost p-2 rounded-lg" onClick={onClose}><X size={16} /></button>
        </div>

        <div className="slide-panel-body space-y-5">
          {/* Basic */}
          <section>
            <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--text-muted)' }}>Details</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">{field('Venue Name *', 'name')}</div>
              {field('Floor / Location', 'floor')}
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Status</label>
                <select className="input text-sm w-full" value={form.status} onChange={e => set('status', e.target.value)}>
                  {STATUS_OPTS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Description</label>
                <textarea className="input text-sm w-full" rows={2} value={form.description || ''} onChange={e => set('description', e.target.value)} />
              </div>
            </div>
          </section>

          {/* Capacities */}
          <section>
            <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--text-muted)' }}>Capacities</p>
            <div className="grid grid-cols-3 gap-3">
              {field('Max Capacity', 'capacity_max', 'number', { min: 0 })}
              {field('Theatre',   'cap_theatre',   'number', { min: 0 })}
              {field('Classroom', 'cap_classroom', 'number', { min: 0 })}
              {field('Banquet',   'cap_banquet',   'number', { min: 0 })}
              {field('Cocktail',  'cap_cocktail',  'number', { min: 0 })}
              {field('Boardroom', 'cap_boardroom', 'number', { min: 0 })}
            </div>
          </section>

          {/* Pricing */}
          <section>
            <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--text-muted)' }}>Pricing</p>
            <div className="grid grid-cols-2 gap-3">
              {field('Rate per Hour (₦)', 'rate_per_hour', 'number', { min: 0, step: '0.01' })}
              {field('Rate per Day (₦)',  'rate_per_day',  'number', { min: 0, step: '0.01' })}
            </div>
          </section>

          {/* Amenities */}
          <section>
            <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--text-muted)' }}>Amenities</p>
            <div className="flex flex-wrap gap-2">
              {AMENITY_SUGGESTIONS.map(a => (
                <button key={a} onClick={() => toggleAmenity(a)}
                  className="text-xs px-2.5 py-1 rounded-full border transition-all"
                  style={{
                    borderColor: form.amenities.includes(a) ? 'var(--brand)' : 'var(--border-base)',
                    backgroundColor: form.amenities.includes(a) ? 'var(--brand-subtle)' : 'transparent',
                    color: form.amenities.includes(a) ? 'var(--brand)' : 'var(--text-sub)',
                  }}>
                  {a}
                </button>
              ))}
            </div>
          </section>

          {/* Notes */}
          <section>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Notes</label>
            <textarea className="input text-sm w-full" rows={2} value={form.notes || ''} onChange={e => set('notes', e.target.value)} />
          </section>
        </div>

        <div className="slide-panel-footer">
          <button className="btn-ghost text-sm" onClick={onClose}>Cancel</button>
          <button className="btn-primary text-sm" onClick={() => mut.mutate()} disabled={mut.isPending || !form.name}>
            {mut.isPending ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Venue'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function VenuesPanel() {
  const qc = useQueryClient();
  const [showForm, setShowForm]   = useState(false);
  const [editVenue, setEditVenue] = useState(null);

  const { data: venues = [], isLoading } = useQuery({
    queryKey: ['event-venues'],
    queryFn:  () => eventApi.getVenues().then(r => r.data.data),
  });

  const deleteMut = useMutation({
    mutationFn: (id) => eventApi.deleteVenue(id),
    onSuccess: () => { toast.success('Venue deleted'); qc.invalidateQueries(['event-venues']); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const STATUS_COLORS = {
    available:   'var(--s-green-text)',
    maintenance: 'var(--s-yellow-text)',
    blocked:     'var(--s-red-text)',
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button className="btn-primary text-sm flex items-center gap-2"
          onClick={() => { setEditVenue(null); setShowForm(true); }}>
          <Plus size={15} /> Add Venue
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card h-40 animate-pulse" style={{ backgroundColor: 'var(--bg-subtle)' }} />
          ))}
        </div>
      ) : venues.length === 0 ? (
        <div className="card p-8 text-center">
          <MapPin size={32} className="mx-auto mb-3" style={{ color: 'var(--text-muted)', opacity: .4 }} />
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No venues yet. Add your first function space.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {venues.map(v => (
            <div key={v.id} className="card p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-sm" style={{ color: 'var(--text-base)' }}>{v.name}</p>
                  {v.floor && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{v.floor}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium capitalize px-2 py-0.5 rounded-full"
                    style={{ color: STATUS_COLORS[v.status], backgroundColor: `${STATUS_COLORS[v.status]}18` }}>
                    {v.status}
                  </span>
                  <button className="btn-ghost p-1 rounded" onClick={() => { setEditVenue(v); setShowForm(true); }}>
                    <Edit2 size={12} />
                  </button>
                  <button className="btn-ghost p-1 rounded"
                    onClick={() => { if (window.confirm('Delete this venue?')) deleteMut.mutate(v.id); }}>
                    <Trash2 size={12} style={{ color: 'var(--s-red-text)' }} />
                  </button>
                </div>
              </div>

              {v.description && (
                <p className="text-xs" style={{ color: 'var(--text-sub)' }}>{v.description}</p>
              )}

              {/* Capacities */}
              <div className="flex flex-wrap gap-2">
                {v.capacity_max  > 0 && <Cap label="Max"       val={v.capacity_max} />}
                {v.cap_theatre   > 0 && <Cap label="Theatre"   val={v.cap_theatre} />}
                {v.cap_classroom > 0 && <Cap label="Classroom" val={v.cap_classroom} />}
                {v.cap_banquet   > 0 && <Cap label="Banquet"   val={v.cap_banquet} />}
                {v.cap_cocktail  > 0 && <Cap label="Cocktail"  val={v.cap_cocktail} />}
                {v.cap_boardroom > 0 && <Cap label="Boardroom" val={v.cap_boardroom} />}
              </div>

              {/* Pricing */}
              {(v.rate_per_hour > 0 || v.rate_per_day > 0) && (
                <div className="flex gap-4 text-xs" style={{ color: 'var(--text-sub)' }}>
                  {v.rate_per_hour > 0 && <span>{formatCurrency(v.rate_per_hour)}/hr</span>}
                  {v.rate_per_day  > 0 && <span>{formatCurrency(v.rate_per_day)}/day</span>}
                </div>
              )}

              {/* Amenities */}
              {v.amenities?.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {v.amenities.slice(0, 6).map(a => (
                    <span key={a} className="text-xs px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: 'var(--bg-subtle)', color: 'var(--text-muted)', border: '1px solid var(--border-soft)' }}>
                      {a}
                    </span>
                  ))}
                  {v.amenities.length > 6 && (
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>+{v.amenities.length - 6}</span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <VenueForm
          venue={editVenue}
          onClose={() => { setShowForm(false); setEditVenue(null); }}
          onSaved={() => { setShowForm(false); setEditVenue(null); qc.invalidateQueries(['event-venues']); }}
        />
      )}
    </div>
  );
}

function Cap({ label, val }) {
  return (
    <div className="flex items-center gap-1 text-xs px-2 py-0.5 rounded"
      style={{ backgroundColor: 'var(--bg-subtle)', color: 'var(--text-sub)', border: '1px solid var(--border-soft)' }}>
      <Users size={10} />
      <span>{val} {label}</span>
    </div>
  );
}