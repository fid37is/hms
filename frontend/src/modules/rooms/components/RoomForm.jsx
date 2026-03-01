import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import * as roomApi from '../../../lib/api/roomApi';
import toast from 'react-hot-toast';

export default function RoomForm({ room, types = [], onSuccess }) {
  const isEdit = !!room;

  const [form, setForm] = useState(() => ({
    number:  room?.number  ?? '',
    floor:   room?.floor   != null ? String(room.floor) : '',
    type_id: room?.type_id ?? '',
    notes:   room?.notes   ?? '',
  }));

  const save = useMutation({
    mutationFn: (d) => isEdit ? roomApi.updateRoom(room.id, d) : roomApi.createRoom(d),
    onSuccess: () => { toast.success(isEdit ? 'Room updated' : 'Room created'); onSuccess(); },
    onError:   (e) => toast.error(e.response?.data?.message || 'Failed to save room'),
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    save.mutate({ ...form, floor: Number(form.floor) || null });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">

        <div className="form-group">
          <label className="label" htmlFor="rf-number">Room Number *</label>
          <input id="rf-number" name="number" className="input" required
            value={form.number} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label className="label" htmlFor="rf-floor">Floor</label>
          <input id="rf-floor" name="floor" type="number" className="input"
            value={form.floor} onChange={handleChange} />
        </div>

      </div>

      <div className="form-group">
        <label className="label" htmlFor="rf-type_id">Room Type *</label>
        <select id="rf-type_id" name="type_id" className="input" required
          value={form.type_id} onChange={handleChange}>
          <option value="">Select type…</option>
          {types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>

      <div className="form-group">
        <label className="label" htmlFor="rf-notes">Notes</label>
        <textarea id="rf-notes" name="notes" rows={2} className="input"
          value={form.notes} onChange={handleChange} />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button type="submit" disabled={save.isPending} className="btn-primary">
          {save.isPending ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Room'}
        </button>
      </div>
    </form>
  );
}
