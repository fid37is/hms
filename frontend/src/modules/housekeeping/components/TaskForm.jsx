import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import * as hkApi   from '../../../lib/api/housekeepingApi';
import * as roomApi  from '../../../lib/api/roomApi';
import * as staffApi from '../../../lib/api/staffApi';
import toast from 'react-hot-toast';

const TASK_TYPES = ['checkout_clean','stayover_clean','deep_clean','turndown','inspection','special_request'];
const PRIORITIES = ['low','normal','high','urgent'];

export default function TaskForm({ task, onSuccess, onClose }) {
  const isEdit = !!task;

  const [form, setForm] = useState(() => ({
    room_id:     task?.room_id            ?? '',
    task_type:   task?.task_type          ?? 'checkout_clean',
    priority:    task?.priority           ?? 'normal',
    assigned_to: task?.assigned?.id       ?? '',  // backend returns assigned:{id,full_name}
    notes:       task?.notes              ?? '',
  }));

  // On create: only dirty rooms. On edit: dirty rooms + current task room (may not be dirty)
  const { data: dirtyRooms } = useQuery({
    queryKey: ['rooms', 'dirty'],
    queryFn:  () => roomApi.getRooms({ status: 'dirty' }).then(r => r.data.data),
  });

  // Merge current room into the list so it shows when editing
  const rooms = (() => {
    const list = dirtyRooms || [];
    if (!isEdit || !task?.rooms) return list;
    const alreadyIn = list.some(r => r.id === task.rooms.id);
    return alreadyIn ? list : [task.rooms, ...list];
  })();

  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn:  () => staffApi.getDepartments().then(r => r.data.data),
  });

  const { data: allStaff } = useQuery({
    queryKey: ['staff', 'housekeeping-only'],
    queryFn:  () => staffApi.getStaff({ limit: 500, status: 'active' }).then(r => r.data.data),
  });

  const hkDeptIds = (departments || [])
    .filter(d => d.name?.toLowerCase().includes('housekeeping') || d.name?.toLowerCase().includes('house keeping'))
    .map(d => d.id);

  const hkStaff = (allStaff || []).filter(s =>
    hkDeptIds.length > 0
      ? hkDeptIds.includes(s.departments?.id)
      : s.departments?.name?.toLowerCase().includes('housekeep')
  );

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
          {rooms?.length === 0 && <option disabled value="">No dirty rooms at the moment</option>}
          {rooms.map(r => (
            <option key={r.id} value={r.id}>
              Room {r.number}{r.floor ? ` · Floor ${r.floor}` : ''}{r.status && r.status !== 'dirty' ? ` (${r.status})` : ''}
            </option>
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
        <label className="label" htmlFor="tf-assigned_to">Assign To
          <span className="ml-1.5 text-xs font-normal" style={{ color: 'var(--text-muted)' }}>— housekeeping staff</span>
        </label>
        <select id="tf-assigned_to" name="assigned_to" className="input"
          value={form.assigned_to} onChange={handleChange}>
          <option value="">Unassigned</option>
          {hkStaff.map(s => (
            <option key={s.id} value={s.id}>
              {s.full_name}{s.job_title ? ` — ${s.job_title}` : ''}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label className="label" htmlFor="tf-notes">Notes</label>
        <textarea id="tf-notes" name="notes" rows={2} className="input"
          value={form.notes} onChange={handleChange} />
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
        <button type="submit" disabled={save.isPending} className="btn-primary">
          {save.isPending ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Task'}
        </button>
      </div>
    </form>
  );
}