import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import * as staffApi  from '../../lib/api/staffApi';
import PageHeader      from '../../components/shared/PageHeader';
import DataTable       from '../../components/shared/DataTable';
import StatusBadge     from '../../components/shared/StatusBadge';
import Modal           from '../../components/shared/Modal';
import StaffForm       from './components/StaffForm';
import StaffDetail     from './components/StaffDetail';
import LeaveRequests   from './components/LeaveRequests';
import { formatDate }  from '../../utils/format';
import toast from 'react-hot-toast';

const TABS = ['Staff', 'Leave Requests'];

export default function StaffPage() {
  const qc = useQueryClient();
  const [tab,       setTab]       = useState('Staff');
  const [showForm,  setShowForm]  = useState(false);
  const [editStaff, setEditStaff] = useState(null);
  const [selected,  setSelected]  = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['staff'],
    queryFn:  () => staffApi.getStaff({}).then(r => r.data.data),
  });

  const columns = [
    { key: 'full_name', label: 'Name',
      render: r => (
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold uppercase flex-shrink-0"
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
    { key: 'department',      label: 'Department', render: r => r.departments?.name || r.department_id || '—' },
    { key: 'employment_type', label: 'Type',
      render: r => <span className="text-xs capitalize">{r.employment_type?.replace(/_/g, ' ')}</span> },
    { key: 'phone',           label: 'Phone',      render: r => r.phone || '—' },
    { key: 'employment_date', label: 'Joined',     render: r => formatDate(r.employment_date) },
    { key: 'status',          label: 'Status',     render: r => <StatusBadge status={r.status || 'active'} /> },
    { key: 'actions', label: '', width: '80px',
      render: r => (
        <button onClick={e => { e.stopPropagation(); setEditStaff(r); setShowForm(true); }}
          className="btn-ghost text-xs px-2 py-1">Edit</button>
      )
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Staff"
        subtitle={`${(data || []).length} employees`}
        action={
          tab === 'Staff' && (
            <button onClick={() => { setEditStaff(null); setShowForm(true); }} className="btn-primary">
              <Plus size={15} /> Add Staff
            </button>
          )
        }
      />

      <div className="flex gap-1 p-1 rounded-lg w-fit" style={{ backgroundColor: 'var(--bg-subtle)' }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className="px-4 py-1.5 text-xs font-medium rounded-md transition-all"
            style={{
              backgroundColor: tab === t ? 'var(--bg-surface)' : 'transparent',
              color:           tab === t ? 'var(--text-base)'  : 'var(--text-muted)',
              boxShadow:       tab === t ? 'var(--shadow-xs)'  : 'none',
            }}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'Staff' && (
        <div className="card overflow-hidden">
          <DataTable columns={columns} data={data || []} loading={isLoading}
            emptyTitle="No staff found"
            onRowClick={r => setSelected(r)} />
        </div>
      )}

      {tab === 'Leave Requests' && <LeaveRequests />}

      <Modal open={showForm} onClose={() => setShowForm(false)}
        title={editStaff ? 'Edit Staff' : 'Add Staff'} size="lg">
        <StaffForm staff={editStaff}
          onSuccess={() => { setShowForm(false); qc.invalidateQueries(['staff']); }} />
      </Modal>

      <Modal open={!!selected} onClose={() => setSelected(null)}
        title={selected?.full_name || 'Staff Detail'} size="lg">
        {selected && <StaffDetail staffId={selected.id} />}
      </Modal>
    </div>
  );
}
