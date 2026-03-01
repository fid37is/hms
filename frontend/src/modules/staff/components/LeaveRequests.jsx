import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import * as staffApi from '../../../lib/api/staffApi';
import DataTable     from '../../../components/shared/DataTable';
import StatusBadge   from '../../../components/shared/StatusBadge';
import Modal         from '../../../components/shared/Modal';
import { formatDate } from '../../../utils/format';
import toast from 'react-hot-toast';

const EMPTY = { staff_id: '', leave_type: 'annual', start_date: '', end_date: '', reason: '' };

export default function LeaveRequests() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);

  const { data, isLoading } = useQuery({
    queryKey: ['leave-requests'],
    queryFn:  () => staffApi.getLeaveRequests({}).then(r => r.data.data),
  });

  const { data: staffList } = useQuery({
    queryKey: ['staff'],
    queryFn:  () => staffApi.getStaff({}).then(r => r.data.data),
  });

  const create = useMutation({
    mutationFn: (d) => staffApi.createLeave(d),
    onSuccess: () => { toast.success('Leave request submitted'); setShowForm(false); setForm(EMPTY); qc.invalidateQueries(['leave-requests']); },
    onError:   (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const review = useMutation({
    mutationFn: ({ id, status }) => staffApi.reviewLeave(id, { status }),
    onSuccess: () => { toast.success('Leave updated'); qc.invalidateQueries(['leave-requests']); },
    onError:   (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const columns = [
    { key: 'staff',      label: 'Staff',      render: r => r.staff?.full_name || '—' },
    { key: 'leave_type', label: 'Type',        render: r => <span className="capitalize">{r.leave_type?.replace(/_/g, ' ')}</span> },
    { key: 'start_date', label: 'From',        render: r => formatDate(r.start_date) },
    { key: 'end_date',   label: 'To',          render: r => formatDate(r.end_date)   },
    { key: 'status',     label: 'Status',      render: r => <StatusBadge status={r.status || 'pending'} /> },
    { key: 'actions',    label: '', width: '140px',
      render: r => r.status === 'pending' && (
        <div className="flex gap-1.5">
          <button onClick={e => { e.stopPropagation(); review.mutate({ id: r.id, status: 'approved' }); }}
            className="text-xs px-2 py-1 rounded-md"
            style={{ backgroundColor: 'var(--s-green-bg)', color: 'var(--s-green-text)' }}>
            Approve
          </button>
          <button onClick={e => { e.stopPropagation(); review.mutate({ id: r.id, status: 'rejected' }); }}
            className="text-xs px-2 py-1 rounded-md"
            style={{ backgroundColor: 'var(--s-red-bg)', color: 'var(--s-red-text)' }}>
            Reject
          </button>
        </div>
      )
    },
  ];

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setShowForm(true)} className="btn-primary">
          <Plus size={15} /> Request Leave
        </button>
      </div>

      <div className="card overflow-hidden">
        <DataTable columns={columns} data={data || []} loading={isLoading} emptyTitle="No leave requests" />
      </div>

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Leave Request">
        <form onSubmit={e => { e.preventDefault(); create.mutate(form); }} className="space-y-4">
          <div className="form-group">
            <label className="label">Staff Member *</label>
            <select className="input" required value={form.staff_id} onChange={e => set('staff_id', e.target.value)}>
              <option value="">Select…</option>
              {(staffList || []).map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="label">Leave Type</label>
            <select className="input" value={form.leave_type} onChange={e => set('leave_type', e.target.value)}>
              {['annual','sick','maternity','paternity','unpaid','other'].map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="label">Start Date *</label>
              <input type="date" className="input" required value={form.start_date}
                onChange={e => set('start_date', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="label">End Date *</label>
              <input type="date" className="input" required value={form.end_date}
                onChange={e => set('end_date', e.target.value)} />
            </div>
          </div>
          <div className="form-group">
            <label className="label">Reason</label>
            <textarea className="input" rows={2} value={form.reason}
              onChange={e => set('reason', e.target.value)} />
          </div>
          <div className="flex justify-end pt-1">
            <button type="submit" disabled={create.isPending} className="btn-primary">
              {create.isPending ? 'Submitting…' : 'Submit Request'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
