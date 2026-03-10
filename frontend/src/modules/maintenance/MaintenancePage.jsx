// src/modules/maintenance/MaintenancePage.jsx
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, AlertTriangle, X } from 'lucide-react';
import * as maintApi      from '../../lib/api/maintenanceApi';
import PageHeader         from '../../components/shared/PageHeader';
import DataTable          from '../../components/shared/DataTable';
import StatusBadge        from '../../components/shared/StatusBadge';
import WorkOrderForm      from './components/WorkOrderForm';
import WorkOrderDetail    from './components/WorkOrderDetail';
import AssetForm          from './components/AssetForm';
import { formatDate, formatCurrency } from '../../utils/format';
import toast from 'react-hot-toast';

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
const today = new Date().toISOString().split('T')[0];

export default function MaintenancePage() {
  const qc = useQueryClient();
  const [tab,        setTab]        = useState('Work Orders');
  const [status,     setStatus]     = useState('');
  const [panel,      setPanel]      = useState(null); // 'new-wo' | 'view-wo' | 'new-asset' | 'edit-asset'
  const [selectedWO, setSelectedWO] = useState(null);
  const [selectedAsset, setSelectedAsset] = useState(null);

  const closePanel = () => { setPanel(null); setSelectedWO(null); setSelectedAsset(null); };

  // ── Queries ─────────────────────────────────────────────
  const { data: woData, isLoading: woLoading } = useQuery({
    queryKey: ['work-orders', status],
    queryFn:  () => maintApi.getWorkOrders(status ? { status } : {}).then(r => r.data.data),
    enabled:  tab === 'Work Orders',
  });

  const { data: assetData, isLoading: assetLoading } = useQuery({
    queryKey: ['assets'],
    queryFn:  () => maintApi.getAssets({}).then(r => r.data.data),
    enabled:  tab === 'Assets',
  });

  // ── WO columns ──────────────────────────────────────────
  const woColumns = [
    { key: 'wo_number', label: 'WO#',
      render: r => (
        <span className="font-mono text-xs font-medium" style={{ color: 'var(--brand)' }}>
          {r.wo_number || r.wo_no || '—'}
        </span>
      ),
    },
    { key: 'description', label: 'Issue',
      render: r => (
        <div>
          <p className="text-sm font-medium" style={{ color: 'var(--text-base)' }}>
            {r.description || '—'}
          </p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {r.rooms?.number ? `Room ${r.rooms.number}` : r.location || '—'}
          </p>
        </div>
      ),
    },
    { key: 'priority', label: 'Priority',
      render: r => (
        <span className="text-xs font-medium capitalize" style={{ color: PRIORITY_COLORS[r.priority] }}>
          {r.priority}
        </span>
      ),
    },
    { key: 'assigned', label: 'Assigned',
      render: r => r.assignee?.full_name || <span style={{ color: 'var(--text-muted)' }}>Unassigned</span>,
    },
    { key: 'created_at', label: 'Raised', render: r => formatDate(r.created_at) },
    { key: 'status', label: 'Status', render: r => <StatusBadge status={r.status} /> },
  ];

  // ── Asset columns ────────────────────────────────────────
  const assetColumns = [
    { key: 'name', label: 'Asset',
      render: r => (
        <div>
          <p className="text-sm font-medium" style={{ color: 'var(--text-base)' }}>{r.name}</p>
          <p className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{r.serial_number || '—'}</p>
        </div>
      ),
    },
    { key: 'category', label: 'Category', render: r => r.category || '—' },
    { key: 'location',  label: 'Location', render: r => r.location  || '—' },
    { key: 'next_service_due', label: 'Next Service',
      render: r => {
        const due = r.next_service_due && r.next_service_due <= today;
        return (
          <span style={{ color: due ? 'var(--s-red-text)' : 'var(--text-sub)' }}>
            {r.next_service_due ? formatDate(r.next_service_due) : '—'}
            {due && <AlertTriangle size={12} className="inline ml-1" />}
          </span>
        );
      },
    },
    { key: 'status', label: 'Status', render: r => <StatusBadge status={r.status} /> },
    { key: 'actions', label: '',
      render: r => (
        <button className="btn-ghost text-xs px-2 py-1"
          onClick={e => { e.stopPropagation(); setSelectedAsset(r); setPanel('edit-asset'); }}>
          Edit
        </button>
      ),
    },
  ];

  // ── Panel content ────────────────────────────────────────
  const panelTitle = {
    'new-wo':     'New Work Order',
    'view-wo':    'Work Order Detail',
    'new-asset':  'Add Asset',
    'edit-asset': 'Edit Asset',
  }[panel];

  const panelContent = () => {
    if (panel === 'new-wo')    return <WorkOrderForm onSuccess={() => { closePanel(); qc.invalidateQueries(['work-orders']); }} />;
    if (panel === 'view-wo')   return selectedWO ? <WorkOrderDetail workOrder={selectedWO} onClose={closePanel} /> : null;
    if (panel === 'new-asset') return <AssetForm onSuccess={closePanel} />;
    if (panel === 'edit-asset') return selectedAsset ? <AssetForm asset={selectedAsset} onSuccess={closePanel} /> : null;
    return null;
  };

  const tabAction = tab === 'Work Orders'
    ? <button onClick={() => setPanel('new-wo')} className="btn-primary text-xs"><Plus size={14} /> New WO</button>
    : <button onClick={() => setPanel('new-asset')} className="btn-primary text-xs"><Plus size={14} /> Add Asset</button>;

  return (
    <div className="flex h-full" style={{ gap: panel ? '0' : undefined }}>
      {/* Main content */}
      <div className="flex-1 min-w-0 space-y-4" style={{ transition: 'all 0.2s' }}>
        <PageHeader
          title="Maintenance"
          subtitle={tab === 'Work Orders' ? `${(woData || []).length} work orders` : `${(assetData || []).length} assets`}
          action={tabAction}
        />

        {/* Tabs */}
        <div className="overflow-x-auto pb-1">
          <div className="flex gap-1 p-1 rounded-lg w-max" style={{ backgroundColor: 'var(--bg-subtle)' }}>
            {TABS.map(t => (
              <button key={t} onClick={() => { setTab(t); closePanel(); }}
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

        {/* Work Orders tab */}
        {tab === 'Work Orders' && (
          <>
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
              columns={woColumns} data={woData || []} loading={woLoading}
              emptyTitle="No work orders"
              onRowClick={r => { setSelectedWO(r); setPanel('view-wo'); }}
            />
          </>
        )}

        {/* Assets tab */}
        {tab === 'Assets' && (
          <DataTable
            columns={assetColumns} data={assetData || []} loading={assetLoading}
            emptyTitle="No assets registered"
          />
        )}
      </div>

      {/* Slide panel */}
      {panel && (
        <div className="flex-shrink-0 border-l"
          style={{
            width: '480px',
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-base)',
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
          }}>
          {/* Panel header */}
          <div className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0"
            style={{ borderColor: 'var(--border-base)' }}>
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-base)' }}>
              {panelTitle}
            </h3>
            <button onClick={closePanel} className="btn-ghost p-1.5 rounded-lg">
              <X size={16} />
            </button>
          </div>
          {/* Panel body */}
          <div className="flex-1 overflow-y-auto p-5">
            {panelContent()}
          </div>
        </div>
      )}
    </div>
  );
}