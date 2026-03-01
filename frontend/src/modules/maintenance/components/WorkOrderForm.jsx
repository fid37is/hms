import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import * as maintApi from '../../../lib/api/maintenanceApi';
import * as roomApi  from '../../../lib/api/roomApi';
import toast from 'react-hot-toast';

export default function WorkOrderForm({ onSuccess }) {
  const [form, setForm] = useState(() => ({
    title:       '',
    description: '',
    priority:    'normal',
    room_id:     '',
    location:    '',
    category:    'general',
  }));

  const { data: rooms } = useQuery({
    queryKey: ['rooms'],
    queryFn:  () => roomApi.getRooms({}).then(r => r.data.data),
  });

  const save = useMutation({
    mutationFn: (d) => maintApi.createWO(d),
    onSuccess: () => { toast.success('Work order created'); onSuccess(); },
    onError:   (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  return (
    <form onSubmit={e => { e.preventDefault(); save.mutate(form); }} className="space-y-4">

      <div className="form-group">
        <label className="label" htmlFor="wo-title">Title / Issue *</label>
        <input id="wo-title" name="title" className="input" required
          placeholder="e.g. AC not working"
          value={form.title} onChange={handleChange} />
      </div>

      <div className="grid grid-cols-2 gap-4">

        <div className="form-group">
          <label className="label" htmlFor="wo-priority">Priority</label>
          <select id="wo-priority" name="priority" className="input"
            value={form.priority} onChange={handleChange}>
            {['low','normal','high','urgent'].map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        <div className="form-group">
          <label className="label" htmlFor="wo-category">Category</label>
          <select id="wo-category" name="category" className="input"
            value={form.category} onChange={handleChange}>
            {['general','electrical','plumbing','hvac','furniture','appliance','structural','other'].map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="label" htmlFor="wo-room_id">Room</label>
          <select id="wo-room_id" name="room_id" className="input"
            value={form.room_id} onChange={handleChange}>
            <option value="">None / Other area</option>
            {(rooms || []).map(r => <option key={r.id} value={r.id}>Room {r.number}</option>)}
          </select>
        </div>

        <div className="form-group">
          <label className="label" htmlFor="wo-location">Location</label>
          <input id="wo-location" name="location" className="input"
            placeholder="e.g. Lobby, Restaurant"
            value={form.location} onChange={handleChange} />
        </div>

      </div>

      <div className="form-group">
        <label className="label" htmlFor="wo-description">Description</label>
        <textarea id="wo-description" name="description" rows={3} className="input"
          value={form.description} onChange={handleChange} />
      </div>

      <div className="flex justify-end pt-1">
        <button type="submit" disabled={save.isPending} className="btn-primary">
          {save.isPending ? 'Creating…' : 'Create Work Order'}
        </button>
      </div>
    </form>
  );
}
