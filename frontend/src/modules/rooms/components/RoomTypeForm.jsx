import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import * as roomApi from '../../../lib/api/roomApi';
import { formatCurrency } from '../../../utils/format';
import LoadingSpinner from '../../../components/shared/LoadingSpinner';
import toast from 'react-hot-toast';

const BLANK = () => ({ name: '', description: '', base_rate: '', max_occupancy: '2' });

export default function RoomTypeForm({ onSuccess }) {
  const qc = useQueryClient();
  const [form,     setForm]     = useState(BLANK);
  const [showForm, setShowForm] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['room-types'],
    queryFn:  () => roomApi.getRoomTypes().then(r => r.data.data),
  });

  const create = useMutation({
    mutationFn: (d) => roomApi.createRoomType(d),
    onSuccess: () => {
      toast.success('Room type created');
      setForm(BLANK()); setShowForm(false);
      qc.invalidateQueries(['room-types']);
      onSuccess?.();
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const del = useMutation({
    mutationFn: (id) => roomApi.deleteRoomType(id),
    onSuccess: () => { toast.success('Deleted'); qc.invalidateQueries(['room-types']); },
    onError:   (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    create.mutate({
      ...form,
      base_rate:    Number(form.base_rate) * 100,
      max_occupancy: Number(form.max_occupancy),
    });
  };

  const types = data || [];

  return (
    <div className="space-y-4">
      {/* List */}
      {isLoading ? <LoadingSpinner center /> : (
        <div className="divide-y" style={{ borderColor: 'var(--border-soft)' }}>
          {types.map(t => (
            <div key={t.id} className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-base)' }}>{t.name}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  {formatCurrency(t.base_rate)}/night · Max {t.max_occupancy} guests
                </p>
              </div>
              <button onClick={() => del.mutate(t.id)}
                className="btn-ghost p-1.5"
                style={{ color: 'var(--s-red-text)' }}>
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          {!types.length && (
            <p className="py-4 text-sm text-center" style={{ color: 'var(--text-muted)' }}>
              No room types yet
            </p>
          )}
        </div>
      )}

      {/* Add form */}
      {showForm ? (
        <form onSubmit={handleSubmit} className="space-y-3 pt-2"
          style={{ borderTop: '1px solid var(--border-soft)' }}>
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            New Room Type
          </p>
          <div className="grid grid-cols-2 gap-3">

            <div className="form-group">
              <label className="label" htmlFor="rtf-name">Name *</label>
              <input id="rtf-name" name="name" className="input" required
                value={form.name} onChange={handleChange} />
            </div>

            <div className="form-group">
              <label className="label" htmlFor="rtf-base_rate">Base Rate (₦) *</label>
              <input id="rtf-base_rate" name="base_rate" type="number" min="0" required className="input"
                value={form.base_rate} onChange={handleChange} />
            </div>

            <div className="form-group">
              <label className="label" htmlFor="rtf-max_occupancy">Max Occupancy</label>
              <input id="rtf-max_occupancy" name="max_occupancy" type="number" min="1" className="input"
                value={form.max_occupancy} onChange={handleChange} />
            </div>

            <div className="form-group">
              <label className="label" htmlFor="rtf-description">Description</label>
              <input id="rtf-description" name="description" className="input"
                value={form.description} onChange={handleChange} />
            </div>

          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={create.isPending} className="btn-primary">
              {create.isPending ? 'Saving…' : 'Create'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button onClick={() => setShowForm(true)} className="btn-secondary w-full justify-center">
          <Plus size={14} /> Add Room Type
        </button>
      )}
    </div>
  );
}
