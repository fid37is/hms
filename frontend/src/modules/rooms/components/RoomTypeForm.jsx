// Modal form — just the create form, no list
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as roomApi from '../../../lib/api/roomApi';
import toast from 'react-hot-toast';

const BLANK = () => ({ name: '', description: '', base_rate: '', max_occupancy: '2', amenities: '' });

export default function RoomTypeForm({ onSuccess }) {
  const qc   = useQueryClient();
  const [form, setForm] = useState(BLANK);

  const create = useMutation({
    mutationFn: (d) => roomApi.createRoomType(d),
    onSuccess: () => {
      toast.success('Room type created');
      setForm(BLANK());
      qc.invalidateQueries(['room-types']);
      onSuccess?.();
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Parse amenities from comma-separated string
    const amenities = form.amenities
      ? form.amenities.split(',').map(a => a.trim()).filter(Boolean)
      : [];
    create.mutate({
      name:          form.name,
      description:   form.description || null,
      base_rate:     Number(form.base_rate) * 100,
      max_occupancy: Number(form.max_occupancy),
      amenities,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="form-group col-span-2">
          <label className="label" htmlFor="rtf-name">Type Name *</label>
          <input id="rtf-name" name="name" className="input" required
            placeholder="e.g. Standard, Deluxe, Suite"
            value={form.name} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label className="label" htmlFor="rtf-rate">Base Rate (₦) *</label>
          <input id="rtf-rate" name="base_rate" type="number" min="0" required className="input"
            placeholder="e.g. 45000"
            value={form.base_rate} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label className="label" htmlFor="rtf-occ">Max Occupancy</label>
          <input id="rtf-occ" name="max_occupancy" type="number" min="1" className="input"
            value={form.max_occupancy} onChange={handleChange} />
        </div>

        <div className="form-group col-span-2">
          <label className="label" htmlFor="rtf-desc">Description</label>
          <textarea id="rtf-desc" name="description" rows={2} className="input"
            placeholder="Brief description shown to guests…"
            value={form.description} onChange={handleChange} />
        </div>

        <div className="form-group col-span-2">
          <label className="label" htmlFor="rtf-amenities">Amenities</label>
          <input id="rtf-amenities" name="amenities" className="input"
            placeholder="WiFi, AC, TV, Mini Bar (comma-separated)"
            value={form.amenities} onChange={handleChange} />
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            Separate each amenity with a comma
          </p>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <button type="submit" disabled={create.isPending} className="btn-primary">
          {create.isPending ? 'Creating…' : 'Create Room Type'}
        </button>
      </div>
    </form>
  );
}