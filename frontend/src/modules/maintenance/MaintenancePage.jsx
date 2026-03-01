import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import * as maintApi  from '../../lib/api/maintenanceApi';
import PageHeader      from '../../components/shared/PageHeader';
import DataTable       from '../../components/shared/DataTable';
import StatusBadge     from '../../components/shared/StatusBadge';
import Modal           from '../../components/shared/Modal';
import WorkOrderForm   from './components/WorkOrderForm';
import WorkOrderDetail from './components/WorkOrderDetail';
import AssetRegister   from './components/AssetRegister';
import { formatDate }  from '../../utils/format';
import toast from 'react-hot-toast';

const TABS = ['Work Orders', 'Assets'];
const STATUS_FILTERS = ['', 'open', 'assigned', 'in_progress', 'resolved', 'closed'];

export default function MaintenancePage() {
  const qc = useQueryClient();
  const [tab,       setTab]       = useState('Work Orders');
  const [status,    setStatus]    = useState('');
  const [showForm,  setShowForm]  = useState(false);
  const [selected,  setSelected]  = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['work-orders', status],
    queryFn:  () => maintApi.getWorkOrders(status ? { status } : {}).then(r => r.data.data),
  });

  const columns = [
    { key: 'wo_no', label: 'WO Number',
      render: r => <span className="font-mono text-xs font-medium" style={{ color: 'var(--brand)' }}>{r.wo_no}</span> },
    { key: 'title', label: 'Issue',
      render: r => (
        <div>
          <p className="text-sm font-medium" style={{ color: 'var(--text-base)' }}>{r.title}</p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{r.location || r.rooms?.number ? `Room ${r.rooms?.number}` : '—'}</p>
        </div>
      )
    },
    { key: 'priority', label: 'Priority',
      render: r => {
        const colors = { urgent: 'var(--s-red-text)', high: 'var(--s-yellow-text)', normal: 'var(--text-muted)', low: 'var(--text-muted)' };
        return <span className="text-xs font-medium capitalize" style={{ color: colors[r.priority] }}>{r.priority}</span>;
      }
    },
    { key: 'assigned', label: 'Assigned To', render: r => r.assigned_to_user?.full_name || <span style={{ color: 'var(--text-muted)' }}>Unassigned</span> },
    { key: 'created_at', label: 'Raised', render: r => formatDate(r.created_at) },
    { key: 'status', label: 'Status', render: r => <StatusBadge status={r.status} /> },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Maintenance"
        subtitle={`${(data || []).length} work orders`}
        action={
          tab === 'Work Orders' && (
            <button onClick={() => setShowForm(true)} className="btn-primary">
              <Plus size={15} /> New Work Order
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

      {tab === 'Work Orders' && (
        <>
          <div className="flex gap-1.5 flex-wrap">
            {STATUS_FILTERS.map(s => (
              <button key={s} onClick={() => setStatus(s)}
                className="px-3 py-1 text-xs font-medium rounded-full border transition-all capitalize"
                style={{
                  backgroundColor: status === s ? 'var(--brand)'        : 'transparent',
                  color:           status === s ? 'var(--text-on-brand)' : 'var(--text-muted)',
                  borderColor:     status === s ? 'var(--brand)'        : 'var(--border-soft)',
                }}>
                {s || 'All'}
              </button>
            ))}
          </div>

          <div className="card overflow-hidden">
            <DataTable columns={columns} data={data || []} loading={isLoading}
              emptyTitle="No work orders"
              onRowClick={r => setSelected(r)} />
          </div>
        </>
      )}

      {tab === 'Assets' && <AssetRegister />}

      <Modal open={showForm} onClose={() => setShowForm(false)} title="New Work Order">
        <WorkOrderForm onSuccess={() => { setShowForm(false); qc.invalidateQueries(['work-orders']); }} />
      </Modal>

      <Modal open={!!selected} onClose={() => setSelected(null)} title={`Work Order ${selected?.wo_no || ''}`} size="lg">
        {selected && <WorkOrderDetail wo={selected}
          onUpdate={() => { setSelected(null); qc.invalidateQueries(['work-orders']); }} />}
      </Modal>
    </div>
  );
}
