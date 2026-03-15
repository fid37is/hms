// src/modules/events/components/VenuesPanel.jsx
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, X, MapPin, Users } from 'lucide-react';
import * as eventApi from '../../../lib/api/eventApi';
import { formatCurrency } from '../../../utils/format';
import toast from 'react-hot-toast';

const PANEL_WIDTH = 460;
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

function useIsMobile() {
  const [m, setM] = useState(window.innerWidth < 768);
  useEffect(() => {
    const h = () => setM(window.innerWidth < 768);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);
  return m;
}

function VenueForm({ venue, onClose, onSaved }) {
  const isEdit = !!venue;
  const [form, setForm] = useState(() => venue ? {
    ...EMPTY, ...venue,
    rate_per_hour: venue.rate_per_hour ? venue.rate_per_hour / 100 : '',
    rate_per_day:  venue.rate_per_day  ? venue.rate_per_day  / 100 : '',
  } : EMPTY);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const toggleAmenity = (a) => setForm(f => ({
    ...f,
    amenities: f.amenities.includes(a) ? f.amenities.filter(x => x !== a) : [...f.amenities, a],
  }));

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

  const F = ({ label, k, type = 'text', props = {} }) => (
    <div className="form-group">
      <label className="label">{label}</label>
      <input type={type} className="input text-sm w-full" value={form[k]}
        onChange={e => set(k, e.target.value)} {...props} />
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">

        {/* Details */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--text-muted)' }}>Details</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><F label="Venue Name *" k="name" /></div>
            <F label="Floor / Location" k="floor" />
            <div className="form-group">
              <label className="label">Status</label>
              <select className="input text-sm w-full" value={form.status} onChange={e => set('status', e.target.value)}>
                {STATUS_OPTS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
            </div>
            <div className="col-span-2 form-group">
              <label className="label">Description</label>
              <textarea className="input text-sm w-full" rows={2} value={form.description || ''}
                onChange={e => set('description', e.target.value)} />
            </div>
          </div>
        </div>

        {/* Capacities */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--text-muted)' }}>Capacities</p>
          <div className="grid grid-cols-3 gap-3">
            <F label="Max"       k="capacity_max"  type="number" props={{ min: 0 }} />
            <F label="Theatre"   k="cap_theatre"   type="number" props={{ min: 0 }} />
            <F label="Classroom" k="cap_classroom" type="number" props={{ min: 0 }} />
            <F label="Banquet"   k="cap_banquet"   type="number" props={{ min: 0 }} />
            <F label="Cocktail"  k="cap_cocktail"  type="number" props={{ min: 0 }} />
            <F label="Boardroom" k="cap_boardroom" type="number" props={{ min: 0 }} />
          </div>
        </div>

        {/* Pricing */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--text-muted)' }}>Pricing</p>
          <div className="grid grid-cols-2 gap-3">
            <F label="Rate per Hour (₦)" k="rate_per_hour" type="number" props={{ min: 0, step: '0.01' }} />
            <F label="Rate per Day (₦)"  k="rate_per_day"  type="number" props={{ min: 0, step: '0.01' }} />
          </div>
        </div>

        {/* Amenities */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--text-muted)' }}>Amenities</p>
          <div className="flex flex-wrap gap-2">
            {AMENITY_SUGGESTIONS.map(a => (
              <button key={a} onClick={() => toggleAmenity(a)}
                className="text-xs px-2.5 py-1 rounded-full border transition-all"
                style={{
                  borderColor:     form.amenities.includes(a) ? 'var(--brand)' : 'var(--border-base)',
                  backgroundColor: form.amenities.includes(a) ? 'var(--brand-subtle)' : 'transparent',
                  color:           form.amenities.includes(a) ? 'var(--brand)' : 'var(--text-sub)',
                }}>
                {a}
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="form-group">
          <label className="label">Notes</label>
          <textarea className="input text-sm w-full" rows={2} value={form.notes || ''}
            onChange={e => set('notes', e.target.value)} />
        </div>

      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-2 px-5 py-3 flex-shrink-0"
        style={{ borderTop: '1px solid var(--border-soft)' }}>
        <button className="btn-ghost text-sm" onClick={onClose}>Cancel</button>
        <button className="btn-primary text-sm" onClick={() => mut.mutate()} disabled={mut.isPending || !form.name}>
          {mut.isPending ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Venue'}
        </button>
      </div>
    </div>
  );
}

const STATUS_COLORS = {
  available:   'var(--s-green-text)',
  maintenance: 'var(--s-yellow-text)',
  blocked:     'var(--s-red-text)',
};

export default function VenuesPanel({ panel, setPanel }) {
  const qc       = useQueryClient();
  const isMobile = useIsMobile();

  const openPanel  = (venue = null) => setPanel({ venue });
  const closePanel = () => setPanel(null);
  const panelOpen  = !!panel;

  const { data: venues = [], isLoading } = useQuery({
    queryKey: ['event-venues'],
    queryFn:  () => eventApi.getVenues().then(r => r.data.data),
  });

  const deleteMut = useMutation({
    mutationFn: (id) => eventApi.deleteVenue(id),
    onSuccess: () => { toast.success('Venue deleted'); qc.invalidateQueries(['event-venues']); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const panelTitle = panel?.venue ? `Edit · ${panel.venue.name}` : 'New Venue';

  return (
    <div style={{ display: 'flex', gap: 0, position: 'relative' }}>

      {/* Left: venue cards */}
      <div style={{
        flex: 1, minWidth: 0,
        marginRight: panelOpen && !isMobile ? PANEL_WIDTH + 16 : 0,
        transition: 'margin-right 280ms cubic-bezier(0.4,0,0.2,1)',
      }}>
        <div className="space-y-4">

          {/* Venue grid */}
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
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-medium capitalize px-2 py-0.5 rounded-full"
                        style={{ color: STATUS_COLORS[v.status], backgroundColor: `${STATUS_COLORS[v.status]}18` }}>
                        {v.status}
                      </span>
                      {/* Hide edit button when this venue's panel is open */}
                      {!(panelOpen && panel.venue?.id === v.id) && (
                        <button className="btn-ghost p-1 rounded" onClick={() => openPanel(v)}>
                          <Edit2 size={12} />
                        </button>
                      )}
                      <button className="btn-ghost p-1 rounded"
                        onClick={() => { if (window.confirm('Delete this venue?')) deleteMut.mutate(v.id); }}>
                        <Trash2 size={12} style={{ color: 'var(--s-red-text)' }} />
                      </button>
                    </div>
                  </div>

                  {v.description && <p className="text-xs" style={{ color: 'var(--text-sub)' }}>{v.description}</p>}

                  <div className="flex flex-wrap gap-2">
                    {v.capacity_max  > 0 && <Cap label="Max"       val={v.capacity_max} />}
                    {v.cap_theatre   > 0 && <Cap label="Theatre"   val={v.cap_theatre} />}
                    {v.cap_classroom > 0 && <Cap label="Classroom" val={v.cap_classroom} />}
                    {v.cap_banquet   > 0 && <Cap label="Banquet"   val={v.cap_banquet} />}
                    {v.cap_cocktail  > 0 && <Cap label="Cocktail"  val={v.cap_cocktail} />}
                    {v.cap_boardroom > 0 && <Cap label="Boardroom" val={v.cap_boardroom} />}
                  </div>

                  {(v.rate_per_hour > 0 || v.rate_per_day > 0) && (
                    <div className="flex gap-4 text-xs" style={{ color: 'var(--text-sub)' }}>
                      {v.rate_per_hour > 0 && <span>{formatCurrency(v.rate_per_hour)}/hr</span>}
                      {v.rate_per_day  > 0 && <span>{formatCurrency(v.rate_per_day)}/day</span>}
                    </div>
                  )}

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
        </div>
      </div>

      {/* Mobile backdrop */}
      {isMobile && panelOpen && (
        <div onClick={closePanel} style={{
          position: 'fixed', inset: 0, zIndex: 49,
          backgroundColor: 'rgba(0,0,0,0.4)',
        }} />
      )}

      {/* Right: slide panel */}
      {panelOpen && (
        <div style={{
          position: 'fixed',
          top: isMobile ? 0 : 56,
          right: 0, bottom: 0,
          left: isMobile ? 0 : 'auto',
          width: isMobile ? '100%' : PANEL_WIDTH,
          zIndex: isMobile ? 50 : 30,
          backgroundColor: 'var(--bg-surface)',
          borderLeft: '1px solid var(--border-soft)',
          boxShadow: '-6px 0 24px rgba(0,0,0,0.08)',
          display: 'flex', flexDirection: 'column',
          animation: 'slideInPanel 240ms cubic-bezier(0.4,0,0.2,1)',
        }}>
          {/* Panel header */}
          <div className="flex items-center justify-between px-5 flex-shrink-0"
            style={{ height: 44, borderBottom: '1px solid var(--border-soft)' }}>
            <h2 className="text-sm font-semibold" style={{ color: 'var(--text-base)' }}>{panelTitle}</h2>
            <button onClick={closePanel}
              className="w-7 h-7 flex items-center justify-center rounded-md"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-subtle)'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
              <X size={15} />
            </button>
          </div>

          <VenueForm
            venue={panel.venue}
            onClose={closePanel}
            onSaved={() => { closePanel(); qc.invalidateQueries(['event-venues']); }}
          />
        </div>
      )}
    </div>
  );
}

function Cap({ label, val }) {
  return (
    <div className="flex items-center gap-1 text-xs px-2 py-0.5 rounded"
      style={{ backgroundColor: 'var(--bg-subtle)', color: 'var(--text-sub)', border: '1px solid var(--border-soft)' }}>
      <Users size={10} /><span>{val} {label}</span>
    </div>
  );
}