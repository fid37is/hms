import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import * as staffApi  from '../../lib/api/staffApi';
import DataTable       from '../../components/shared/DataTable';
import StatusBadge     from '../../components/shared/StatusBadge';
import Modal           from '../../components/shared/Modal';
import ConfirmDialog   from '../../components/shared/ConfirmDialog';
import StaffForm       from './components/StaffForm';
import StaffDetail     from './components/StaffDetail';
import LeaveRequests   from './components/LeaveRequests';
import { formatDate }  from '../../utils/format';
import toast from 'react-hot-toast';

const TABS = ['Staff', 'Leave Requests'];

export default function StaffPage() {
  const qc = useQueryClient();
  const [tab,            setTab]            = useState('Staff');
  const [showForm,       setShowForm]       = useState(false);
  const [editStaff,      setEditStaff]      = useState(null);
  const [deleteTarget,   setDeleteTarget]   = useState(null);
  const [selected,       setSelected]       = useState(null);
  const [showLeaveForm,  setShowLeaveForm]  = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['staff'],
    queryFn:  () => staffApi.getStaff({}).then(r => r.data.data),
  });

  const del = useMutation({
    mutationFn: (id) => staffApi.deleteStaff(id),
    onSuccess: () => { toast.success('Staff member terminated'); setDeleteTarget(null); qc.invalidateQueries(['staff']); },
    onError:   (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const columns = [
    { key: 'full_name', label: 'Name',
      render: r => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold uppercase flex-shrink-0"
            style={{ backgroundColor: 'var(--brand-subtle)', color: 'var(--brand)' }}>
            {r.full_name?.charAt(0)}
          </div>
          <div>
            <p className="text-sm font-medium" style={{ color: 'var(--text-base)' }}>{r.full_name}</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{r.job_title || '—'}</p>
          </div>
        </div>
      )
    },
    { key: 'department',      label: 'Dept',   render: r => r.departments?.name || '—' },
    { key: 'employment_type', label: 'Type',   render: r => <span className="text-xs capitalize">{r.employment_type?.replace(/_/g, ' ')}</span> },
    { key: 'phone',           label: 'Phone',  render: r => r.phone || '—' },
    { key: 'employment_date', label: 'Joined', render: r => formatDate(r.employment_date) },
    { key: 'status',          label: 'Status', render: r => <StatusBadge status={r.status || 'active'} /> },
    { key: 'actions', label: '', width: '100px',
      render: r => (
        <div className="flex gap-1.5">
          <button onClick={e => { e.stopPropagation(); setEditStaff(r); setShowForm(true); }}
            className="btn-ghost text-xs px-2 py-1">Edit</button>
          <button onClick={e => { e.stopPropagation(); setDeleteTarget(r); }}
            className="text-xs px-2 py-1 rounded-md"
            style={{ backgroundColor: 'var(--s-red-bg)', color: 'var(--s-red-text)' }}>
            <Trash2 size={12} />
          </button>
        </div>
      )
    },
  ];

  const MobileCard = ({ row: r }) => (
    <div className="card p-4 active:opacity-80">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold uppercase flex-shrink-0"
          style={{ backgroundColor: 'var(--brand-subtle)', color: 'var(--brand)' }}>
          {r.full_name?.charAt(0)}
        </div>
        <div className="flex-1 min-w-0" onClick={() => setSelected(r)}>
          <p className="text-sm font-medium truncate" style={{ color: 'var(--text-base)' }}>{r.full_name}</p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {r.job_title || '—'} · {r.departments?.name || '—'}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <StatusBadge status={r.status || 'active'} />
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button onClick={() => { setEditStaff(r); setShowForm(true); }}
            className="btn-ghost text-xs px-2 py-1">Edit</button>
          <button onClick={() => setDeleteTarget(r)}
            className="text-xs px-2 py-1 rounded-md"
            style={{ backgroundColor: 'var(--s-red-bg)', color: 'var(--s-red-text)' }}>
            <Trash2 size={12} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">

      {/* Tabs + action button on same row */}
      <div className="flex items-center justify-between gap-3">
        <div className="overflow-x-auto pb-1">
          <div className="flex gap-1 p-1 rounded-lg w-max" style={{ backgroundColor: 'var(--bg-subtle)' }}>
            {TABS.map(t => (
              <button key={t} onClick={() => setTab(t)}
                className="px-4 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap"
                style={{
                  backgroundColor: tab === t ? 'var(--bg-surface)' : 'transparent',
                  color:           tab === t ? 'var(--text-base)'  : 'var(--text-muted)',
                  boxShadow:       tab === t ? 'var(--shadow-xs)'  : 'none',
                }}>
                {t}
              </button>
            ))}
          </div>
        </div>

        {tab === 'Staff' && (
          <button
            onClick={() => { setEditStaff(null); setShowForm(true); }}
            className="btn-primary text-xs flex-shrink-0"
          >
            <Plus size={14} /> Add
          </button>
        )}
        {tab === 'Leave Requests' && (
          <button
            onClick={() => setShowLeaveForm(true)}
            className="btn-primary text-xs flex-shrink-0"
          >
            <Plus size={14} /> Request Leave
          </button>
        )}
      </div>

      {tab === 'Staff' && (
        <DataTable
          columns={columns}
          data={data || []}
          loading={isLoading}
          emptyTitle="No staff found"
          onRowClick={r => setSelected(r)}
          mobileCard={MobileCard}
        />
      )}
      {tab === 'Leave Requests' && (
        <LeaveRequests openForm={showLeaveForm} onFormClose={() => setShowLeaveForm(false)} />
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title={editStaff ? 'Edit Staff' : 'Add Staff'} size="lg">
        <StaffForm staff={editStaff} onSuccess={() => { setShowForm(false); qc.invalidateQueries(['staff']); }} />
      </Modal>
      <Modal open={!!selected} onClose={() => setSelected(null)} title="Staff Profile" size="lg">
        {selected && <StaffDetail staffId={selected.id} onClose={() => setSelected(null)} />}
      </Modal>
      <ConfirmDialog
        open={!!deleteTarget} onClose={() => setDeleteTarget(null)}
        onConfirm={() => del.mutate(deleteTarget?.id)}
        title="Terminate Staff Member"
        message={`Remove ${deleteTarget?.full_name} from the system? This action cannot be undone.`}
        confirmLabel="Terminate" danger
      />
    </div>
  );
}