import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2, Pencil, Plus, Users, Check, X } from 'lucide-react';
import * as roomApi from '../../../lib/api/roomApi';
import { formatCurrency } from '../../../utils/format';
import LoadingSpinner from '../../../components/shared/LoadingSpinner';
import toast from 'react-hot-toast';

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
    onSuccess: () => {
      toast.success('Room type updated');
      qc.invalidateQueries(['room-types']);
      onClose();
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

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
      <div className="relative w-full max-w-md rounded-2xl p-5 space-y-4"
        style={{ backgroundColor: 'var(--bg-surface)', boxShadow: '0 24px 48px rgba(0,0,0,0.2)' }}>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text-base)' }}>Edit Room Type</h3>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-subtle)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
            <X size={14} />
          </button>
        </div>

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
  );
}

function TypeCard({ type, onEdit }) {
  const qc = useQueryClient();
  const amenities = type.amenities || [];

  const del = useMutation({
    mutationFn: () => roomApi.deleteRoomType(type.id),
    onSuccess: () => { toast.success('Deleted'); qc.invalidateQueries(['room-types']); },
    onError:   (e) => toast.error(e.response?.data?.message || 'Cannot delete'),
  });

  return (
    <div className="card flex flex-col" style={{ aspectRatio: '1 / 1' }}>
      {/* Top accent bar */}
      <div className="h-1 rounded-t-[inherit] flex-shrink-0" style={{ backgroundColor: 'var(--brand)' }} />

      <div className="flex flex-col flex-1 p-4 min-h-0">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2 mb-3">
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

        {/* Description */}
        {type.description && (
          <p className="text-xs mb-3 line-clamp-2 flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
            {type.description}
          </p>
        )}

        {/* Amenities — scrollable if many */}
        <div className="flex flex-wrap gap-1 flex-1 content-start overflow-hidden">
          {amenities.slice(0, 6).map(a => (
            <span key={a} className="text-xs px-2 py-0.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: 'var(--bg-subtle)', color: 'var(--text-sub)', border: '1px solid var(--border-soft)' }}>
              {a}
            </span>
          ))}
          {amenities.length > 6 && (
            <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: 'var(--bg-subtle)', color: 'var(--text-muted)' }}>
              +{amenities.length - 6} more
            </span>
          )}
        </div>

        {/* Footer */}
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