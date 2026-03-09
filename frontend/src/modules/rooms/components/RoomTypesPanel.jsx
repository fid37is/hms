import { useState, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Trash2, Pencil, Plus, Users, X, ImagePlus, ImageOff } from 'lucide-react';
import * as roomApi from '../../../lib/api/roomApi';
import { formatCurrency } from '../../../utils/format';
import LoadingSpinner from '../../../components/shared/LoadingSpinner';
import toast from 'react-hot-toast';

const CANCEL_OPTIONS = [
  { value: '24h',  label: 'Up to 24 hours before check-in' },
  { value: '48h',  label: 'Up to 48 hours before check-in' },
  { value: '72h',  label: 'Up to 72 hours before check-in' },
  { value: 'none', label: 'No free cancellation' },
];

// ── Single cover photo ─────────────────────────────────────
function CoverPhotoSection({ type }) {
  const qc      = useQueryClient();
  const fileRef = useRef(null);
  const cover   = (type.media || []).find(m => m.type === 'image' || m.type === 'gif');

  const upload = useMutation({
    mutationFn: (file) => roomApi.uploadRoomTypeMedia(type.id, file),
    onSuccess:  () => { toast.success('Cover photo updated'); qc.invalidateQueries(['room-types']); },
    onError:    (e) => toast.error(e.response?.data?.message || 'Upload failed'),
  });

  const remove = useMutation({
    mutationFn: () => roomApi.deleteRoomTypeMedia(type.id, cover.path),
    onSuccess:  () => { toast.success('Photo removed'); qc.invalidateQueries(['room-types']); },
    onError:    (e) => toast.error(e.response?.data?.message || 'Delete failed'),
  });

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    upload.mutate(file); // backend auto-replaces any existing cover
    e.target.value = '';
  };

  const busy = upload.isPending || remove.isPending;

  return (
    <div className="space-y-2">
      {cover ? (
        <div className="relative rounded-xl overflow-hidden group" style={{ aspectRatio: '16/7' }}>
          <img src={cover.url} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 50%)' }} />
          <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button type="button" onClick={() => fileRef.current?.click()} disabled={busy}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg"
              style={{ backgroundColor: 'rgba(0,0,0,0.65)', color: 'white' }}>
              <ImagePlus size={12} /> Change
            </button>
            <button type="button" onClick={() => remove.mutate()} disabled={busy}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg"
              style={{ backgroundColor: 'rgba(220,38,38,0.75)', color: 'white' }}>
              <Trash2 size={12} /> Remove
            </button>
          </div>
          {busy && (
            <div className="absolute inset-0 flex items-center justify-center"
              style={{ backgroundColor: 'rgba(0,0,0,0.35)' }}>
              <LoadingSpinner />
            </div>
          )}
        </div>
      ) : (
        <button type="button" onClick={() => fileRef.current?.click()} disabled={busy}
          className="w-full flex flex-col items-center justify-center gap-2 rounded-xl transition-colors"
          style={{ aspectRatio: '16/7', border: '2px dashed var(--border-base)', backgroundColor: 'var(--bg-subtle)' }}
          onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--brand)'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-base)'}>
          {busy ? <LoadingSpinner /> : (
            <>
              <ImageOff size={20} style={{ color: 'var(--text-muted)' }} />
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Click to upload cover photo</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)', opacity: 0.6 }}>JPG, PNG or WebP, max 2MB</p>
            </>
          )}
        </button>
      )}
      <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFile} />
    </div>
  );
}

// ── Rate plans section ─────────────────────────────────────
function RatePlansSection({ typeId }) {
  const qc = useQueryClient();
  const [adding, setAdding] = useState(false);
  const BLANK = () => ({ name: '', rate_per_night: '', description: '', cancellation_policy: 'refundable', free_cancellation_window: '24h', payment_timing: 'at_property' });
  const [form, setForm] = useState(BLANK());

  const { data: plans = [], isLoading } = useQuery({
    queryKey: ['rate-plans', typeId],
    queryFn:  () => roomApi.getRatePlans(typeId).then(r => r.data.data),
  });

  const create = useMutation({
    mutationFn: (d) => roomApi.createRatePlan(typeId, d),
    onSuccess: () => {
      toast.success('Rate plan added');
      qc.invalidateQueries(['rate-plans', typeId]);
      setAdding(false);
      setForm(BLANK());
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const del = useMutation({
    mutationFn: (id) => roomApi.deleteRatePlan(id),
    onSuccess: () => { toast.success('Deleted'); qc.invalidateQueries(['rate-plans', typeId]); },
    onError:   (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    create.mutate({ ...form, rate_per_night: Math.round(Number(form.rate_per_night) * 100) });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
          Rate Plans {!isLoading && <span style={{ fontWeight: 400 }}>({plans.length})</span>}
        </p>
        {!adding && (
          <button type="button" onClick={() => setAdding(true)}
            className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg"
            style={{ backgroundColor: 'var(--brand-subtle)', color: 'var(--brand)', border: '1px solid var(--brand)' }}>
            <Plus size={12} /> Add plan
          </button>
        )}
      </div>

      {isLoading ? <LoadingSpinner /> : plans.length === 0 && !adding ? (
        <p className="text-xs py-4 text-center" style={{ color: 'var(--text-muted)' }}>
          No rate plans yet. The base rate is used for all bookings.
        </p>
      ) : (
        <div className="space-y-2">
          {plans.map(p => (
            <div key={p.id} className="flex items-start justify-between gap-3 rounded-lg px-3 py-2.5"
              style={{ backgroundColor: 'var(--bg-subtle)', border: '1px solid var(--border-soft)' }}>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-base)' }}>{p.name}</p>
                  <span className="text-xs px-1.5 py-0.5 rounded-full capitalize"
                    style={{ backgroundColor: 'var(--brand-subtle)', color: 'var(--brand)' }}>
                    {(p.cancellation_policy || 'refundable').replace('_', '-')}
                  </span>
                </div>
                {p.description && <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{p.description}</p>}
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  {p.payment_timing === 'now' ? 'Pay now' : 'Pay at property'}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <p className="text-sm font-bold" style={{ color: 'var(--brand)' }}>{formatCurrency(p.rate_per_night)}</p>
                <button type="button" onClick={() => del.mutate(p.id)} disabled={del.isPending}
                  className="w-6 h-6 rounded flex items-center justify-center"
                  style={{ color: 'var(--text-muted)' }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--s-red-bg)'; e.currentTarget.style.color = 'var(--s-red-text)'; }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}>
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {adding && (
        <div className="rounded-xl p-4 space-y-3" style={{ backgroundColor: 'var(--bg-subtle)', border: '1px solid var(--border-soft)' }}>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="form-group">
                <label className="label">Plan Name *</label>
                <input className="input" placeholder="e.g. Flexible Rate" required
                  value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="label">Rate / Night (N) *</label>
                <input className="input" type="number" min="0" placeholder="e.g. 50000" required
                  value={form.rate_per_night} onChange={e => setForm(p => ({ ...p, rate_per_night: e.target.value }))} />
              </div>
            </div>
            <div className="form-group">
              <label className="label">Description (optional)</label>
              <input className="input" placeholder="Shown to guests during booking"
                value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="form-group">
                <label className="label">Cancellation</label>
                <select className="input" value={form.cancellation_policy}
                  onChange={e => setForm(p => ({ ...p, cancellation_policy: e.target.value }))}>
                  <option value="refundable">Refundable</option>
                  <option value="non_refundable">Non-refundable</option>
                </select>
              </div>
              <div className="form-group">
                <label className="label">Payment</label>
                <select className="input" value={form.payment_timing}
                  onChange={e => setForm(p => ({ ...p, payment_timing: e.target.value }))}>
                  <option value="at_property">Pay at property</option>
                  <option value="now">Pay now</option>
                </select>
              </div>
            </div>
            {form.cancellation_policy === 'refundable' && (
              <div className="form-group">
                <label className="label">Free Cancellation Window</label>
                <select className="input" value={form.free_cancellation_window}
                  onChange={e => setForm(p => ({ ...p, free_cancellation_window: e.target.value }))}>
                  {CANCEL_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            )}
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setAdding(false)} className="btn-secondary text-xs">Cancel</button>
              <button type="submit" disabled={create.isPending} className="btn-primary text-xs">
                {create.isPending ? 'Saving...' : 'Save Plan'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

// ── Edit modal ─────────────────────────────────────────────
function EditTypeModal({ type, onClose }) {
  const qc = useQueryClient();
  const [tab, setTab] = useState('details');
  const [form, setForm] = useState({
    name:          type.name,
    description:   type.description || '',
    base_rate:     String(type.base_rate / 100),
    max_occupancy: String(type.max_occupancy),
    amenities:     (type.amenities || []).join(', '),
  });

  const update = useMutation({
    mutationFn: (d) => roomApi.updateRoomType(type.id, d),
    onSuccess: () => { toast.success('Room type updated'); qc.invalidateQueries(['room-types']); onClose(); },
    onError:   (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    update.mutate({
      name:          form.name,
      description:   form.description || null,
      base_rate:     Math.round(Number(form.base_rate) * 100),
      max_occupancy: Number(form.max_occupancy),
      amenities:     form.amenities ? form.amenities.split(',').map(a => a.trim()).filter(Boolean) : [],
    });
  };

  const TABS = [
    { key: 'details', label: 'Details' },
    { key: 'cover',   label: 'Cover Photo' },
    { key: 'rates',   label: 'Rate Plans' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl flex flex-col"
        style={{ backgroundColor: 'var(--bg-surface)', boxShadow: '0 24px 48px rgba(0,0,0,0.2)', height: '560px', maxHeight: '90vh' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-0 flex-shrink-0">
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text-base)' }}>{type.name}</h3>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-subtle)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
            <X size={14} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-5 pt-3 flex-shrink-0" style={{ borderBottom: '1px solid var(--border-soft)' }}>
          {TABS.map(t => (
            <button key={t.key} type="button" onClick={() => setTab(t.key)}
              className="px-3 py-2 text-xs font-medium transition-all"
              style={{
                color: tab === t.key ? 'var(--brand)' : 'var(--text-muted)',
                borderBottom: tab === t.key ? '2px solid var(--brand)' : '2px solid transparent',
                marginBottom: -1,
              }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Content — scrollable, fills remaining height */}
        <div className="overflow-y-auto flex-1 p-5">
          {tab === 'details' && (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="form-group">
                <label className="label">Name *</label>
                <input className="input" required value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="form-group">
                  <label className="label">Base Rate (N) *</label>
                  <input type="number" min="0" className="input" required value={form.base_rate}
                    onChange={e => setForm(p => ({ ...p, base_rate: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="label">Max Guests</label>
                  <input type="number" min="1" className="input" value={form.max_occupancy}
                    onChange={e => setForm(p => ({ ...p, max_occupancy: e.target.value }))} />
                </div>
              </div>
              <div className="form-group">
                <label className="label">Description</label>
                <textarea rows={2} className="input" value={form.description}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="label">Amenities</label>
                <input className="input" placeholder="WiFi, AC, TV (comma-separated)" value={form.amenities}
                  onChange={e => setForm(p => ({ ...p, amenities: e.target.value }))} />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={onClose} className="btn-secondary text-xs">Cancel</button>
                <button type="submit" disabled={update.isPending} className="btn-primary text-xs">
                  {update.isPending ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          )}
          {tab === 'cover' && <CoverPhotoSection type={type} />}
          {tab === 'rates' && <RatePlansSection typeId={type.id} />}
        </div>
      </div>
    </div>
  );
}

// ── Type card ──────────────────────────────────────────────
function TypeCard({ type, onEdit }) {
  const qc      = useQueryClient();
  const cover   = (type.media || []).find(m => m.type === 'image' || m.type === 'gif');
  const amenities = type.amenities || [];

  const del = useMutation({
    mutationFn: () => roomApi.deleteRoomType(type.id),
    onSuccess: () => { toast.success('Deleted'); qc.invalidateQueries(['room-types']); },
    onError:   (e) => toast.error(e.response?.data?.message || 'Cannot delete'),
  });

  return (
    <div className="card flex flex-col overflow-hidden cursor-pointer" style={{ minHeight: 220 }}
      onClick={() => onEdit(type)}>

      {cover ? (
        <div className="relative flex-shrink-0" style={{ height: 110 }}>
          <img src={cover.url} alt={type.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 55%)' }} />
        </div>
      ) : (
        <div className="h-1 rounded-t-[inherit] flex-shrink-0" style={{ backgroundColor: 'var(--brand)' }} />
      )}

      <div className="flex flex-col flex-1 p-4 min-h-0">
        <div className="flex items-start justify-between gap-2 mb-2">
          <p className="text-sm font-semibold leading-tight" style={{ color: 'var(--text-base)' }}>{type.name}</p>
          <div className="flex items-center gap-0.5 flex-shrink-0" onClick={e => e.stopPropagation()}>
            <button onClick={() => onEdit(type)}
              className="w-6 h-6 rounded flex items-center justify-center"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--bg-subtle)'; e.currentTarget.style.color = 'var(--text-base)'; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}>
              <Pencil size={12} />
            </button>
            <button onClick={() => del.mutate()}
              className="w-6 h-6 rounded flex items-center justify-center"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--s-red-bg)'; e.currentTarget.style.color = 'var(--s-red-text)'; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}>
              <Trash2 size={12} />
            </button>
          </div>
        </div>

        {type.description && (
          <p className="text-xs mb-2 line-clamp-2" style={{ color: 'var(--text-muted)' }}>{type.description}</p>
        )}

        <div className="flex flex-wrap gap-1 flex-1 content-start overflow-hidden">
          {amenities.slice(0, 4).map(a => (
            <span key={a} className="text-xs px-2 py-0.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: 'var(--bg-subtle)', color: 'var(--text-sub)', border: '1px solid var(--border-soft)' }}>
              {a}
            </span>
          ))}
          {amenities.length > 4 && (
            <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: 'var(--bg-subtle)', color: 'var(--text-muted)' }}>
              +{amenities.length - 4}
            </span>
          )}
        </div>

        <div className="mt-auto pt-3 flex items-center justify-between flex-shrink-0"
          style={{ borderTop: '1px solid var(--border-soft)' }}>
          <div className="flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
            <Users size={11} />
            <span className="text-xs">{type.max_occupancy} guests</span>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold" style={{ color: 'var(--brand)' }}>{formatCurrency(type.base_rate)}</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>/night</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Panel ──────────────────────────────────────────────────
export default function RoomTypesPanel({ types = [], isLoading, onAddNew }) {
  const [editType, setEditType] = useState(null);

  if (isLoading) return <LoadingSpinner center />;

  if (types.length === 0) {
    return (
      <div className="card flex flex-col items-center justify-center py-20 gap-3">
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No room types yet</p>
        <button onClick={onAddNew} className="btn-primary text-xs"><Plus size={13} /> Add Room Type</button>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {types.map(t => <TypeCard key={t.id} type={t} onEdit={setEditType} />)}
      </div>
      {editType && <EditTypeModal type={editType} onClose={() => setEditType(null)} />}
    </>
  );
}