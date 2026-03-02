import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import * as maintApi  from '../../lib/api/maintenanceApi';
import DataTable       from '../../components/shared/DataTable';
import StatusBadge     from '../../components/shared/StatusBadge';
import Modal           from '../../components/shared/Modal';
import WorkOrderForm   from './components/WorkOrderForm';
import WorkOrderDetail from './components/WorkOrderDetail';
import AssetRegister   from './components/AssetRegister';
import { formatDate }  from '../../utils/format';

const TABS = ['Work Orders', 'Assets'];
const STATUS_FILTERS = [
  { label: 'All',         value: '' },
  { label: 'Open',        value: 'open' },
  { label: 'Assigned',    value: 'assigned' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Resolved',    value: 'resolved' },
  { label: 'Closed',      value: 'closed' },
];

const PRIORITY_COLORS = {
  urgent: 'var(--s-red-text)', high: 'var(--s-yellow-text)',
  normal: 'var(--text-muted)', low: 'var(--text-muted)',
};

export default function MaintenancePage() {
  const qc = useQueryClient();
  const [tab,         setTab]         = useState('Work Orders');
  const [status,      setStatus]      = useState('');
  const [showWOForm,  setShowWOForm]  = useState(false);
  const [showAsset,   setShowAsset]   = useState(false);
  const [selected,    setSelected]    = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['work-orders', status],
    queryFn:  () => maintApi.getWorkOrders(status ? { status } : {}).then(r => r.data.data),
  });

  const columns = [
    { key: 'wo_no', label: 'WO#',
      render: r => <span className="font-mono text-xs font-medium" style={{ color: 'var(--brand)' }}>{r.wo_no}</span>
    },
    { key: 'title', label: 'Issue',
      render: r => (
        <div>
          <p className="text-sm font-medium" style={{ color: 'var(--text-base)' }}>{r.title}</p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {r.rooms?.number ? `Room ${r.rooms.number}` : r.location || '—'}
          </p>
        </div>
      )
    },
    { key: 'priority', label: 'Priority',
      render: r => <span className="text-xs font-medium capitalize" style={{ color: PRIORITY_COLORS[r.priority] }}>{r.priority}</span>
    },
    { key: 'assigned',   label: 'Assigned', render: r => r.assigned_to_user?.full_name || <span style={{ color: 'var(--text-muted)' }}>Unassigned</span> },
    { key: 'created_at', label: 'Raised',   render: r => formatDate(r.created_at) },
    { key: 'status',     label: 'Status',   render: r => <StatusBadge status={r.status} /> },
  ];

  const MobileCard = ({ row: r }) => (
    <div className="card p-4 cursor-pointer active:opacity-80" onClick={() => setSelected(r)}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs" style={{ color: 'var(--brand)' }}>{r.wo_no}</span>
            <span className="text-xs font-medium capitalize" style={{ color: PRIORITY_COLORS[r.priority] }}>{r.priority}</span>
          </div>
          <p className="text-sm font-medium" style={{ color: 'var(--text-base)' }}>{r.title}</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {r.rooms?.number ? `Room ${r.rooms.number}` : r.location || '—'} · {r.assigned_to_user?.full_name || 'Unassigned'}
          </p>
        </div>
        <StatusBadge status={r.status} />
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

        {tab === 'Work Orders' && (
          <button onClick={() => setShowWOForm(true)} className="btn-primary text-xs flex-shrink-0">
            <Plus size={14} /> New WO
          </button>
        )}
        {tab === 'Assets' && (
          <button onClick={() => setShowAsset(true)} className="btn-primary text-xs flex-shrink-0">
            <Plus size={14} /> Add Asset
          </button>
        )}
      </div>

      {tab === 'Work Orders' && (
        <>
          {/* Status filter */}
          <div className="overflow-x-auto pb-1">
            <div className="flex gap-1 p-1 rounded-lg w-max" style={{ backgroundColor: 'var(--bg-subtle)' }}>
              {STATUS_FILTERS.map(f => (
                <button key={f.value} onClick={() => setStatus(f.value)}
                  className="px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap"
                  style={{
                    backgroundColor: status === f.value ? 'var(--bg-surface)' : 'transparent',
                    color:           status === f.value ? 'var(--text-base)'  : 'var(--text-muted)',
                    boxShadow:       status === f.value ? 'var(--shadow-xs)'  : 'none',
                  }}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          <DataTable
            columns={columns}
            data={data || []}
            loading={isLoading}
            emptyTitle="No work orders"
            onRowClick={setSelected}
            mobileCard={MobileCard}
          />
        </>
      )}

      {tab === 'Assets' && (
        <AssetRegister openForm={showAsset} onFormClose={() => setShowAsset(false)} />
      )}

      <Modal open={showWOForm} onClose={() => setShowWOForm(false)} title="New Work Order">
        <WorkOrderForm onSuccess={() => { setShowWOForm(false); qc.invalidateQueries(['work-orders']); }} />
      </Modal>
      <Modal open={!!selected} onClose={() => setSelected(null)} title="Work Order Detail" size="lg">
        {selected && (
          <WorkOrderDetail
            workOrder={selected}
            onClose={() => setSelected(null)}
            onUpdate={() => { setSelected(null); qc.invalidateQueries(['work-orders']); }}
          />
        )}
      </Modal>
    </div>
  );
}