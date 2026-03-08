import { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2, Pencil, Plus, Users, X, ImagePlus, ImageOff, ChevronLeft, ChevronRight } from 'lucide-react';
import * as roomApi from '../../../lib/api/roomApi';
import { formatCurrency } from '../../../utils/format';
import LoadingSpinner from '../../../components/shared/LoadingSpinner';
import toast from 'react-hot-toast';

/* ── Media uploader strip ─────────────────────────────────── */
function TypeMediaSection({ type }) {
  const qc      = useQueryClient();
  const fileRef = useRef(null);
  const photos  = (type.media || []).filter(m => m.type === 'image' || m.type === 'gif');
  const [previewing, setPreviewing] = useState(null); // index

  const upload = useMutation({
    mutationFn: (file) => roomApi.uploadRoomTypeMedia(type.id, file),
    onSuccess:  () => { toast.success('Photo added'); qc.invalidateQueries(['room-types']); },
    onError:    (e) => toast.error(e.response?.data?.message || 'Upload failed'),
  });

  const remove = useMutation({
    mutationFn: (path) => roomApi.deleteRoomTypeMedia(type.id, path),
    onSuccess:  () => { toast.success('Photo removed'); qc.invalidateQueries(['room-types']); setPreviewing(null); },
    onError:    (e) => toast.error(e.response?.data?.message || 'Delete failed'),
  });

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (file) upload.mutate(file);
    e.target.value = '';
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="label">Photos <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({photos.length}/8)</span></label>
        {photos.length < 8 && (
          <button type="button" onClick={() => fileRef.current?.click()}
            disabled={upload.isPending}
            className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-all"
            style={{ backgroundColor: 'var(--brand-subtle)', color: 'var(--brand)', border: '1px solid var(--brand)' }}>
            <ImagePlus size={12} />
            {upload.isPending ? 'Uploading…' : 'Add photo'}
          </button>
        )}
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      </div>

      {photos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-6 rounded-xl gap-2"
          style={{ backgroundColor: 'var(--bg-subtle)', border: '1px dashed var(--border-soft)' }}>
          <ImageOff size={18} style={{ color: 'var(--text-muted)' }} />
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No photos yet — add up to 8</p>
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-2">
          {photos.map((p, i) => (
            <div key={p.path} className="relative group rounded-lg overflow-hidden"
              style={{ aspectRatio: '4/3', backgroundColor: 'var(--bg-muted)' }}>
              <img src={p.url} alt="" className="w-full h-full object-cover cursor-pointer"
                onClick={() => setPreviewing(i)} />
              {i === 0 && (
                <span className="absolute top-1 left-1 text-[9px] font-bold px-1.5 py-0.5 rounded"
                  style={{ backgroundColor: 'rgba(0,0,0,0.6)', color: 'white' }}>Cover</span>
              )}
              <button type="button"
                onClick={() => remove.mutate(p.path)}
                disabled={remove.isPending}
                className="absolute top-1 right-1 w-5 h-5 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ backgroundColor: 'rgba(220,38,38,0.85)' }}>
                <X size={10} color="white" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {previewing !== null && photos[previewing] && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}
          onClick={() => setPreviewing(null)}>
          <button type="button" onClick={(e) => { e.stopPropagation(); setPreviewing(i => (i - 1 + photos.length) % photos.length); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center"
            style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}>
            <ChevronLeft size={18} color="white" />
          </button>
          <img src={photos[previewing].url} alt=""
            className="max-w-[80vw] max-h-[80vh] rounded-xl object-contain"
            onClick={e => e.stopPropagation()} />
          <button type="button" onClick={(e) => { e.stopPropagation(); setPreviewing(i => (i + 1) % photos.length); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center"
            style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}>
            <ChevronRight size={18} color="white" />
          </button>
          <button type="button"
            onClick={(e) => { e.stopPropagation(); remove.mutate(photos[previewing].path); }}
            className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
            style={{ backgroundColor: 'rgba(220,38,38,0.85)', color: 'white' }}>
            <Trash2 size={13} /> Remove photo
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Edit modal ───────────────────────────────────────────── */
function EditTypeModal({ type, onClose }) {
  const qc = useQueryClient();
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

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl p-5 space-y-4 overflow-y-auto"
        style={{ backgroundColor: 'var(--bg-surface)', boxShadow: '0 24px 48px rgba(0,0,0,0.2)', maxHeight: '90vh' }}>

        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text-base)' }}>Edit Room Type</h3>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-subtle)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
            <X size={14} />
          </button>
        </div>

        {/* Media section first — visual priority */}
        <TypeMediaSection type={type} />

        <div style={{ borderTop: '1px solid var(--border-soft)', paddingTop: 16 }}>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="form-group">
              <label className="label">Name *</label>
              <input name="name" className="input" required value={form.name} onChange={handleChange} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="form-group">
                <label className="label">Base Rate (₦) *</label>
                <input name="base_rate" type="number" min="0" className="input" required
                  value={form.base_rate} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="label">Max Guests</label>
                <input name="max_occupancy" type="number" min="1" className="input"
                  value={form.max_occupancy} onChange={handleChange} />
              </div>
            </div>
            <div className="form-group">
              <label className="label">Description</label>
              <textarea name="description" rows={2} className="input"
                value={form.description} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="label">Amenities</label>
              <input name="amenities" className="input" placeholder="WiFi, AC, TV (comma-separated)"
                value={form.amenities} onChange={handleChange} />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={onClose} className="btn-secondary text-xs">Cancel</button>
              <button type="submit" disabled={update.isPending} className="btn-primary text-xs">
                {update.isPending ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

/* ── Type card ────────────────────────────────────────────── */
function TypeCard({ type, onEdit }) {
  const qc      = useQueryClient();
  const photos  = (type.media || []).filter(m => m.type === 'image' || m.type === 'gif');
  const cover   = photos[0];
  const amenities = type.amenities || [];

  const del = useMutation({
    mutationFn: () => roomApi.deleteRoomType(type.id),
    onSuccess: () => { toast.success('Deleted'); qc.invalidateQueries(['room-types']); },
    onError:   (e) => toast.error(e.response?.data?.message || 'Cannot delete'),
  });

  return (
    <div className="card flex flex-col overflow-hidden" style={{ minHeight: 260 }}>
      {/* Cover photo or accent bar */}
      {cover ? (
        <div className="relative flex-shrink-0" style={{ height: 120 }}>
          <img src={cover.url} alt={type.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.45) 0%, transparent 55%)' }} />
          {photos.length > 1 && (
            <span className="absolute bottom-2 right-2 text-[10px] font-semibold px-1.5 py-0.5 rounded"
              style={{ backgroundColor: 'rgba(0,0,0,0.55)', color: 'white' }}>
              +{photos.length - 1} more
            </span>
          )}
        </div>
      ) : (
        <div className="h-1 rounded-t-[inherit] flex-shrink-0" style={{ backgroundColor: 'var(--brand)' }} />
      )}

      <div className="flex flex-col flex-1 p-4 min-h-0">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <p className="text-sm font-semibold leading-tight" style={{ color: 'var(--text-base)' }}>
            {type.name}
          </p>
          <div className="flex items-center gap-0.5 flex-shrink-0">
            <button onClick={() => onEdit(type)}
              className="w-6 h-6 rounded flex items-center justify-center transition-colors"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--bg-subtle)'; e.currentTarget.style.color = 'var(--text-base)'; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}>
              <Pencil size={12} />
            </button>
            <button onClick={() => del.mutate()}
              className="w-6 h-6 rounded flex items-center justify-center transition-colors"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--s-red-bg)'; e.currentTarget.style.color = 'var(--s-red-text)'; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}>
              <Trash2 size={12} />
            </button>
          </div>
        </div>

        {type.description && (
          <p className="text-xs mb-2 line-clamp-2" style={{ color: 'var(--text-muted)' }}>
            {type.description}
          </p>
        )}

        <div className="flex flex-wrap gap-1 flex-1 content-start overflow-hidden">
          {amenities.slice(0, 5).map(a => (
            <span key={a} className="text-xs px-2 py-0.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: 'var(--bg-subtle)', color: 'var(--text-sub)', border: '1px solid var(--border-soft)' }}>
              {a}
            </span>
          ))}
          {amenities.length > 5 && (
            <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: 'var(--bg-subtle)', color: 'var(--text-muted)' }}>
              +{amenities.length - 5}
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
            <p className="text-sm font-bold" style={{ color: 'var(--brand)' }}>
              {formatCurrency(type.base_rate)}
            </p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>/night</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Panel ────────────────────────────────────────────────── */
export default function RoomTypesPanel({ types = [], isLoading, onAddNew }) {
  const [editType, setEditType] = useState(null);

  if (isLoading) return <LoadingSpinner center />;

  if (types.length === 0) {
    return (
      <div className="card flex flex-col items-center justify-center py-20 gap-3">
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No room types yet</p>
        <button onClick={onAddNew} className="btn-primary text-xs">
          <Plus size={13} /> Add Room Type
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {types.map(t => (
          <TypeCard key={t.id} type={t} onEdit={setEditType} />
        ))}
      </div>

      {editType && (
        <EditTypeModal type={editType} onClose={() => setEditType(null)} />
      )}
    </>
  );
}