import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as staffApi from '../../../lib/api/staffApi';
import DataTable     from '../../../components/shared/DataTable';
import StatusBadge   from '../../../components/shared/StatusBadge';
import Modal         from '../../../components/shared/Modal';
import { formatDate } from '../../../utils/format';
import toast from 'react-hot-toast';

const BLANK = () => ({ staff_id: '', leave_type: 'annual', start_date: '', end_date: '', reason: '' });

export default function LeaveRequests({ openForm, onFormClose }) {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form,     setForm]     = useState(BLANK());

  useEffect(() => { if (openForm) setShowForm(true); }, [openForm]);

  const handleClose = () => { setShowForm(false); onFormClose?.(); };

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
    onSuccess: () => {
      toast.success('Leave request submitted');
      handleClose();
      setForm(BLANK());
      qc.invalidateQueries(['leave-requests']);
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const review = useMutation({
    mutationFn: ({ id, status }) => staffApi.reviewLeave(id, { status }),
    onSuccess: () => { toast.success('Leave updated'); qc.invalidateQueries(['leave-requests']); },
    onError:   (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const columns = [
    { key: 'staff',      label: 'Staff',  render: r => r.staff?.full_name || '—' },
    { key: 'leave_type', label: 'Type',   render: r => <span className="capitalize">{r.leave_type?.replace(/_/g, ' ')}</span> },
    { key: 'start_date', label: 'From',   render: r => formatDate(r.start_date) },
    { key: 'end_date',   label: 'To',     render: r => formatDate(r.end_date) },
    { key: 'status',     label: 'Status', render: r => <StatusBadge status={r.status || 'pending'} /> },
    { key: 'actions', label: '', width: '140px',
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
      ),
    },
  ];

  return (
    <>
      <div className="card overflow-hidden">
        <DataTable columns={columns} data={data || []} loading={isLoading} emptyTitle="No leave requests" />
      </div>

      <Modal open={showForm} onClose={handleClose} title="Leave Request">
        <form onSubmit={e => { e.preventDefault(); create.mutate(form); }} className="space-y-4">
          <div className="form-group">
            <label className="label" htmlFor="lr-staff_id">Staff Member *</label>
            <select id="lr-staff_id" name="staff_id" className="input" required
              value={form.staff_id} onChange={handleChange}>
              <option value="">Select…</option>
              {(staffList || []).map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="label" htmlFor="lr-leave_type">Leave Type</label>
            <select id="lr-leave_type" name="leave_type" className="input"
              value={form.leave_type} onChange={handleChange}>
              {['annual','sick','maternity','paternity','unpaid','other'].map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="label" htmlFor="lr-start_date">Start Date *</label>
              <input id="lr-start_date" name="start_date" type="date" className="input" required
                value={form.start_date} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="label" htmlFor="lr-end_date">End Date *</label>
              <input id="lr-end_date" name="end_date" type="date" className="input" required
                value={form.end_date} onChange={handleChange} />
            </div>
          </div>
          <div className="form-group">
            <label className="label" htmlFor="lr-reason">Reason</label>
            <textarea id="lr-reason" name="reason" rows={2} className="input"
              value={form.reason} onChange={handleChange} />
          </div>
          <div className="flex justify-end pt-1">
            <button type="submit" disabled={create.isPending} className="btn-primary">
              {create.isPending ? 'Submitting…' : 'Submit Request'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}