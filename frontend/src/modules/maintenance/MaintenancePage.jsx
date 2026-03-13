// src/modules/maintenance/MaintenancePage.jsx
import { useState, useRef, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, AlertTriangle, X, ChevronDown } from 'lucide-react';
import * as maintApi      from '../../lib/api/maintenanceApi';
import DataTable          from '../../components/shared/DataTable';
import StatusBadge        from '../../components/shared/StatusBadge';
import WorkOrderForm      from './components/WorkOrderForm';
import WorkOrderDetail    from './components/WorkOrderDetail';
import AssetForm          from './components/AssetForm';
import { formatDate }     from '../../utils/format';
import toast              from 'react-hot-toast';

const TABS = ['Work Orders', 'Assets'];
const STATUS_FILTERS = [
  { label: 'All statuses', value: '' },
  { label: 'Open',         value: 'open' },
  { label: 'Assigned',     value: 'assigned' },
  { label: 'In Progress',  value: 'in_progress' },
  { label: 'Resolved',     value: 'resolved' },
  { label: 'Closed',       value: 'closed' },
];
const PRIORITY_COLORS = {
  urgent: 'var(--s-red-text)', high: 'var(--s-yellow-text)',
  normal: 'var(--text-muted)', low: 'var(--text-muted)',
};
const today = new Date().toISOString().split('T')[0];

function StatusDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const selected = STATUS_FILTERS.find(f => f.value === value) || STATUS_FILTERS[0];

  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        className="btn-ghost text-xs flex items-center gap-1.5"
        style={{ minWidth: 130 }}>
        {selected.label}
        <ChevronDown size={12} style={{ opacity: 0.5, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }} />
      </button>
      {open && (
        <div className="card" style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0,
          minWidth: 160, zIndex: 50, padding: '4px',
          boxShadow: 'var(--shadow-md)',
        }}>
          {STATUS_FILTERS.map(f => (
            <button key={f.value}
              onClick={() => { onChange(f.value); setOpen(false); }}
              className="w-full text-left px-3 py-2 text-xs rounded-md transition-colors"
              style={{
                background: value === f.value ? 'var(--brand-subtle)' : 'transparent',
                color: value === f.value ? 'var(--brand)' : 'var(--text-base)',
                fontWeight: value === f.value ? 500 : 400,
              }}>
              {f.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function MaintenancePage() {
  const qc = useQueryClient();
  const [tab,          setTab]          = useState('Work Orders');
  const [status,       setStatus]       = useState('');
  const [panel,        setPanel]        = useState(null);
  const [selectedWO,   setSelectedWO]   = useState(null);
  const [selectedAsset,setSelectedAsset]= useState(null);

  const closePanel = () => { setPanel(null); setSelectedWO(null); setSelectedAsset(null); };

  const { data: woData,    isLoading: woLoading }    = useQuery({
    queryKey: ['work-orders', status],
    queryFn:  () => maintApi.getWorkOrders(status ? { status } : {}).then(r => r.data.data),
    enabled:  tab === 'Work Orders',
  });
  const { data: assetData, isLoading: assetLoading } = useQuery({
    queryKey: ['assets'],
    queryFn:  () => maintApi.getAssets({}).then(r => r.data.data),
    enabled:  tab === 'Assets',
  });

  const woColumns = [
    { key: 'wo_number', label: 'WO#',
      render: r => <span className="font-mono text-xs font-medium" style={{ color: 'var(--brand)' }}>{r.wo_number || r.wo_no || '—'}</span>,
    },
    { key: 'description', label: 'Issue',
      render: r => (
        <div>
          <p className="text-sm font-medium" style={{ color: 'var(--text-base)' }}>{r.description || '—'}</p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{r.rooms?.number ? `Room ${r.rooms.number}` : r.location || '—'}</p>
        </div>
      ),
    },
    { key: 'priority', label: 'Priority',
      render: r => <span className="text-xs font-medium capitalize" style={{ color: PRIORITY_COLORS[r.priority] }}>{r.priority}</span>,
    },
    { key: 'assigned', label: 'Assigned',
      render: r => r.assignee?.full_name || <span style={{ color: 'var(--text-muted)' }}>Unassigned</span>,
    },
    { key: 'created_at', label: 'Raised', render: r => formatDate(r.created_at) },
    { key: 'status',     label: 'Status', render: r => <StatusBadge status={r.status} /> },
  ];

  const assetColumns = [
    { key: 'name', label: 'Asset',
      render: r => (
        <div>
          <p className="text-sm font-medium" style={{ color: 'var(--text-base)' }}>{r.name}</p>
          <p className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{r.serial_number || '—'}</p>
        </div>
      ),
    },
    { key: 'category',         label: 'Category',    render: r => r.category || '—' },
    { key: 'location',         label: 'Location',    render: r => r.location  || '—' },
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

  const panelTitle = { 'new-wo':'New Work Order', 'view-wo':'Work Order Detail', 'new-asset':'Add Asset', 'edit-asset':'Edit Asset' }[panel];
  const panelContent = () => {
    if (panel === 'new-wo')     return <WorkOrderForm onSuccess={() => { closePanel(); qc.invalidateQueries(['work-orders']); }} />;
    if (panel === 'view-wo')    return selectedWO    ? <WorkOrderDetail workOrder={selectedWO} onClose={closePanel} /> : null;
    if (panel === 'new-asset')  return <AssetForm onSuccess={closePanel} />;
    if (panel === 'edit-asset') return selectedAsset ? <AssetForm asset={selectedAsset} onSuccess={closePanel} /> : null;
    return null;
  };

  return (
    <div className="flex h-full">
      {/* Main content */}
      <div className="flex-1 min-w-0 space-y-4">

        {/* ── Toolbar: tabs + filter + action in one row ── */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Tab toggle */}
          <div className="flex gap-1 p-1 rounded-lg" style={{ backgroundColor: 'var(--bg-subtle)' }}>
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

          {/* Status filter — only for Work Orders */}
          {tab === 'Work Orders' && (
            <StatusDropdown value={status} onChange={setStatus} />
          )}

          {/* Spacer */}
          <div style={{ flex: 1 }} />

          {/* Action button */}
          {tab === 'Work Orders'
            ? <button onClick={() => setPanel('new-wo')}    className="btn-primary text-xs"><Plus size={14} /> New WO</button>
            : <button onClick={() => setPanel('new-asset')} className="btn-primary text-xs"><Plus size={14} /> Add Asset</button>
          }
        </div>

        {/* ── Table ── */}
        {tab === 'Work Orders' && (
          <DataTable
            columns={woColumns} data={woData || []} loading={woLoading}
            emptyTitle="No work orders"
            onRowClick={r => { setSelectedWO(r); setPanel('view-wo'); }}
          />
        )}
        {tab === 'Assets' && (
          <DataTable
            columns={assetColumns} data={assetData || []} loading={assetLoading}
            emptyTitle="No assets registered"
          />
        )}
      </div>

      {/* ── Slide panel ── */}
      {panel && (
        <div className="flex-shrink-0 border-l"
          style={{ width: '480px', backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-base)', display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0" style={{ borderColor: 'var(--border-base)' }}>
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-base)' }}>{panelTitle}</h3>
            <button onClick={closePanel} className="btn-ghost p-1.5 rounded-lg"><X size={16} /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-5">{panelContent()}</div>
        </div>
      )}
    </div>
  );
}