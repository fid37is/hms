import { useState } from 'react';
import SlidePanel from '../../components/shared/SlidePanel';
import { usePanelLayout }             from '../../hooks/usePanelLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import * as staffApi  from '../../lib/api/staffApi';
import DataTable       from '../../components/shared/DataTable';
import StatusBadge     from '../../components/shared/StatusBadge';
import ConfirmDialog   from '../../components/shared/ConfirmDialog';
import StaffForm       from './components/StaffForm';
import StaffDetail     from './components/StaffDetail';
import LeaveRequests   from './components/LeaveRequests';
import { formatDate }  from '../../utils/format';
import toast from 'react-hot-toast';

const TABS        = ['Staff', 'Leave Requests'];


export default function StaffPage() {
  const qc       = useQueryClient();

  const [tab,          setTab]          = useState('Staff');
  const [panel,        setPanel]        = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showLeaveForm,setShowLeaveForm]= useState(false);
  const [page,         setPage]         = useState(1);

  const openPanel  = (type, data = null) => setPanel({ type, data });
  const closePanel = () => setPanel(null);

  const { data: response, isLoading } = useQuery({
    queryKey: ['staff', page],
    queryFn:  () => staffApi.getStaff({ page, limit: 20 }).then(r => r.data),
  });

  const staff = response?.data || [];
  const meta  = response?.meta || {};

  const del = useMutation({
    mutationFn: (id) => staffApi.deleteStaff(id),
    onSuccess: () => { toast.success('Staff member terminated'); setDeleteTarget(null); qc.invalidateQueries(['staff']); },
    onError:   (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const panelTitle = { add: 'Add Staff', edit: 'Edit Staff', detail: 'Staff Profile' }[panel?.type] || '';

  const panelContent = () => {
    if (!panel) return null;
    if (panel.type === 'add')    return <StaffForm onSuccess={() => { closePanel(); qc.invalidateQueries(['staff']); }} onClose={closePanel} />;
    if (panel.type === 'edit')   return <StaffForm staff={panel.data} onSuccess={() => { closePanel(); qc.invalidateQueries(['staff']); }} onClose={closePanel} />;
    if (panel.type === 'detail') return <StaffDetail staffId={panel.data?.id} onClose={closePanel} />;
    return null;
  };

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
      ),
    },
    { key: 'department',      label: 'Dept',   render: r => r.departments?.name || '—' },
    { key: 'employment_type', label: 'Type',   render: r => <span className="text-xs capitalize">{r.employment_type?.replace(/_/g, ' ')}</span> },
    { key: 'phone',           label: 'Phone',  render: r => r.phone || '—' },
    { key: 'employment_date', label: 'Joined', render: r => formatDate(r.employment_date) },
    { key: 'status',          label: 'Status', render: r => <StatusBadge status={r.status || 'active'} /> },
    { key: 'actions', label: '', width: '100px',
      render: r => (
        <div className="flex gap-1.5 justify-end">
          <button onClick={e => { e.stopPropagation(); openPanel('edit', r); }} className="btn-ghost text-xs px-2 py-1">Edit</button>
          <button onClick={e => { e.stopPropagation(); setDeleteTarget(r); }}
            className="text-xs px-2 py-1 rounded-md"
            style={{ backgroundColor: 'var(--s-red-bg)', color: 'var(--s-red-text)' }}>
            <Trash2 size={12} />
          </button>
        </div>
      ),
    },
  ];

  const MobileCard = ({ row: r }) => (
    <div className="p-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold uppercase flex-shrink-0"
          style={{ backgroundColor: 'var(--brand-subtle)', color: 'var(--brand)' }}>
          {r.full_name?.charAt(0)}
        </div>
        <div className="flex-1 min-w-0" onClick={() => openPanel('detail', r)}>
          <p className="text-sm font-medium truncate" style={{ color: 'var(--text-base)' }}>{r.full_name}</p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{r.job_title || '—'} · {r.departments?.name || '—'}</p>
          <div className="flex items-center gap-2 mt-1"><StatusBadge status={r.status || 'active'} /></div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button onClick={() => openPanel('edit', r)} className="btn-ghost text-xs px-2 py-1">Edit</button>
          <button onClick={() => setDeleteTarget(r)}
            className="text-xs px-2 py-1 rounded-md"
            style={{ backgroundColor: 'var(--s-red-bg)', color: 'var(--s-red-text)' }}>
            <Trash2 size={12} />
          </button>
        </div>
      </div>
    </div>
  );

  const panelOpen = !!panel;
  const { contentStyle } = usePanelLayout(panelOpen);

  return (
    <div style={{ display: 'flex', gap: 0, minHeight: 0, position: 'relative', overflow: 'hidden' }}>

      {/* Main content */}
      <div style={{
        flex: 1, minWidth: 0,
        ...contentStyle,
      }}>
        <div className="space-y-4">

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex gap-1 p-1 rounded-lg overflow-x-auto" style={{ backgroundColor: 'var(--bg-subtle)' }}>
              {TABS.map(t => (
                <button key={t} onClick={() => { setTab(t); closePanel(); }}
                  className="px-3 py-1 text-xs font-medium rounded-md transition-all whitespace-nowrap"
                  style={{
                    backgroundColor: tab === t ? 'var(--bg-surface)' : 'transparent',
                    color:           tab === t ? 'var(--text-base)'  : 'var(--text-muted)',
                    boxShadow:       tab === t ? 'var(--shadow-xs)'  : 'none',
                  }}>
                  {t}
                </button>
              ))}
            </div>
            <div style={{ flex: 1 }} />
            {tab === 'Staff' && !panelOpen && (
              <button onClick={() => openPanel('add')} className="btn-primary text-xs">
                <Plus size={14} /> Add Staff
              </button>
            )}
            {tab === 'Leave Requests' && !panelOpen && (
              <button onClick={() => setShowLeaveForm(true)} className="btn-primary text-xs flex-shrink-0">
                <Plus size={14} /> Request Leave
              </button>
            )}
          </div>

          {tab === 'Staff' && (
            <>
              <DataTable columns={columns} data={staff} loading={isLoading}
                emptyTitle="No staff found" onRowClick={r => openPanel('detail', r)} mobileCard={MobileCard} />
              {meta.total > 20 && (
                <div className="hidden md:flex items-center justify-between">
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Page {meta.page} of {meta.totalPages}</p>
                  <div className="flex gap-2">
                    <button onClick={() => setPage(p => p - 1)} disabled={!meta.hasPrev} className="btn-secondary text-xs px-3">Prev</button>
                    <button onClick={() => setPage(p => p + 1)} disabled={!meta.hasNext} className="btn-secondary text-xs px-3">Next</button>
                  </div>
                </div>
              )}
            </>
          )}
          {tab === 'Leave Requests' && (
            <LeaveRequests openForm={showLeaveForm} onFormClose={() => setShowLeaveForm(false)} />
          )}
        </div>
      </div>

      {/* Mobile backdrop */}
      {/* Slide-in panel */}
      <SlidePanel open={panelOpen} onClose={closePanel} title={panelTitle}>
        {panelContent()}
      </SlidePanel>

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