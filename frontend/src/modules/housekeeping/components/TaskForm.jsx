import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import * as hkApi   from '../../../lib/api/housekeepingApi';
import * as roomApi from '../../../lib/api/roomApi';
import toast from 'react-hot-toast';

const TASK_TYPES = ['checkout_clean','stayover_clean','deep_clean','turndown','inspection','special_request'];
const PRIORITIES = ['low','normal','high','urgent'];

export default function TaskForm({ task, onSuccess }) {
  const isEdit = !!task;

  const [form, setForm] = useState(() => ({
    room_id:   task?.room_id   ?? '',
    task_type: task?.task_type ?? 'checkout_clean',
    priority:  task?.priority  ?? 'normal',
    notes:     task?.notes     ?? '',
  }));

  const { data: rooms } = useQuery({
    queryKey: ['rooms'],
    queryFn:  () => roomApi.getRooms({}).then(r => r.data.data),
  });

  const save = useMutation({
    mutationFn: (d) => isEdit ? hkApi.updateTask(task.id, d) : hkApi.createTask(d),
    onSuccess: () => { toast.success(isEdit ? 'Task updated' : 'Task created'); onSuccess(); },
    onError:   (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  return (
    <form onSubmit={e => { e.preventDefault(); save.mutate(form); }} className="space-y-4">

      <div className="form-group">
        <label className="label" htmlFor="tf-room_id">Room *</label>
        <select id="tf-room_id" name="room_id" className="input" required
          value={form.room_id} onChange={handleChange}>
          <option value="">Select room…</option>
          {(rooms || []).map(r => (
            <option key={r.id} value={r.id}>Room {r.number} — {r.status}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">

        <div className="form-group">
          <label className="label" htmlFor="tf-task_type">Task Type *</label>
          <select id="tf-task_type" name="task_type" className="input"
            value={form.task_type} onChange={handleChange}>
            {TASK_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
          </select>
        </div>

        <div className="form-group">
          <label className="label" htmlFor="tf-priority">Priority</label>
          <select id="tf-priority" name="priority" className="input"
            value={form.priority} onChange={handleChange}>
            {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

      </div>

      <div className="form-group">
        <label className="label" htmlFor="tf-notes">Notes</label>
        <textarea id="tf-notes" name="notes" rows={2} className="input"
          value={form.notes} onChange={handleChange} />
      </div>

      <div className="flex justify-end pt-1">
        <button type="submit" disabled={save.isPending} className="btn-primary">
          {save.isPending ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Task'}
        </button>
      </div>
    </form>
  );
}
