// src/modules/inventory/InventoryPage.jsx
import { useState, useEffect } from 'react';
import SlidePanel from '../../components/shared/SlidePanel';
import { usePanelLayout }             from '../../hooks/usePanelLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, AlertTriangle, Search, Pencil, Trash2, Phone, Mail, MapPin, Building2 } from 'lucide-react';
import * as invApi      from '../../lib/api/inventoryApi';
import DataTable        from '../../components/shared/DataTable';
import StatusBadge      from '../../components/shared/StatusBadge';
import ConfirmDialog    from '../../components/shared/ConfirmDialog';
import LoadingSpinner   from '../../components/shared/LoadingSpinner';
import EmptyState       from '../../components/shared/EmptyState';
import ItemForm         from './components/ItemForm';
import MovementForm     from './components/MovementForm';
import SupplierForm     from './components/Suppliers';
import POForm           from './components/PurchaseOrders';
import { formatDate, formatCurrency } from '../../utils/format';
import toast from 'react-hot-toast';

const TABS        = ['Stock', 'Purchase Orders', 'Suppliers'];

const CAT_LABELS = {
  linen: 'Linen', toiletries: 'Toiletries', cleaning: 'Cleaning',
  food_beverage: 'F&B', maintenance: 'Maintenance', office: 'Office',
  electronics: 'Electronics', furniture: 'Furniture', other: 'Other',
};
const TERM_LABELS = {
  immediate: 'Immediate', net_7: 'Net 7d', net_14: 'Net 14d',
  net_30: 'Net 30d', net_60: 'Net 60d', prepaid: 'Prepaid',
};

function useIsMobile() {
    useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);
  return isMobile;
}

export default function InventoryPage() {
  const qc       = useQueryClient();

  const [tab,          setTab]          = useState('Stock');
  const [panel,        setPanel]        = useState(null); // { type, data }
  const [search,       setSearch]       = useState('');
  const [showLow,      setShowLow]      = useState(false);
  const [poFilter,     setPoFilter]     = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);

  const openPanel  = (type, data = null) => setPanel({ type, data });
  const closePanel = () => setPanel(null);
  const onDone     = (keys = []) => {
    closePanel();
    keys.forEach(k => qc.invalidateQueries([k]));
  };

  // ── Queries ───────────────────────────────────────────────────────────────
  const { data: stockData,     isLoading: stockLoading     } = useQuery({
    queryKey: ['inventory-items', showLow],
    queryFn:  () => showLow
      ? invApi.getLowStock().then(r => r.data.data)
      : invApi.getItems({}).then(r => r.data.data),
  });

  const { data: suppliersData, isLoading: suppliersLoading } = useQuery({
    queryKey: ['suppliers'],
    queryFn:  () => invApi.getSuppliers().then(r => r.data.data),
  });

  const { data: poData,        isLoading: poLoading        } = useQuery({
    queryKey: ['purchase-orders', poFilter],
    queryFn:  () => invApi.getPurchaseOrders(poFilter ? { status: poFilter } : {}).then(r => r.data.data),
  });

  // ── Mutations ─────────────────────────────────────────────────────────────
  const doDeleteSupplier = useMutation({
    mutationFn: (id) => invApi.deleteSupplier(id),
    onSuccess:  () => { toast.success('Supplier deactivated'); qc.invalidateQueries(['suppliers']); setDeleteTarget(null); },
    onError:    (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const approvePO = useMutation({
    mutationFn: (id) => invApi.approvePO(id),
    onSuccess: () => { toast.success('PO approved'); qc.invalidateQueries(['purchase-orders']); },
    onError:   (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const receivePO = useMutation({
    mutationFn: (id) => invApi.receivePO(id),
    onSuccess: () => {
      toast.success('PO received — stock updated');
      qc.invalidateQueries(['purchase-orders']);
      qc.invalidateQueries(['inventory-items']);
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const cancelPO = useMutation({
    mutationFn: (id) => invApi.cancelPO(id),
    onSuccess: () => { toast.success('PO cancelled'); qc.invalidateQueries(['purchase-orders']); },
    onError:   (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  // ── Derived data ──────────────────────────────────────────────────────────
  const items     = (stockData     || []).filter(r =>
    !search ||
    r.name?.toLowerCase().includes(search.toLowerCase()) ||
    r.category?.toLowerCase().includes(search.toLowerCase())
  );
  const suppliers = suppliersData  || [];
  const pos       = poData         || [];

  // ── Panel config ──────────────────────────────────────────────────────────
  const panelTitle = {
    'new-item':      'Add Item',
    'edit-item':     'Edit Item',
    'movement':      'Stock Movement',
    'new-supplier':  'Add Supplier',
    'edit-supplier': 'Edit Supplier',
    'new-po':        'New Purchase Order',
  }[panel?.type] || '';

  const panelContent = () => {
    if (!panel) return null;
    switch (panel.type) {
      case 'new-item':
        return <ItemForm onSuccess={() => onDone(['inventory-items'])} onClose={closePanel} />;
      case 'edit-item':
        return <ItemForm item={panel.data} onSuccess={() => onDone(['inventory-items'])} onClose={closePanel} />;
      case 'movement':
        return <MovementForm item={panel.data} onSuccess={() => onDone(['inventory-items'])} onClose={closePanel} />;
      case 'new-supplier':
        return <SupplierForm onSuccess={() => onDone(['suppliers'])} />;
      case 'edit-supplier':
        return <SupplierForm supplier={panel.data} onSuccess={() => onDone(['suppliers'])} />;
      case 'new-po':
        return <POForm onSuccess={() => onDone(['purchase-orders'])} />;
      default:
        return null;
    }
  };

  // ── Stock columns ─────────────────────────────────────────────────────────
  const stockColumns = [
    { key: 'name', label: 'Item',
      render: r => (
        <div>
          <p className="text-sm font-medium" style={{ color: 'var(--text-base)' }}>{r.name}</p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{r.category || '—'}</p>
        </div>
      ),
    },
    { key: 'current_stock', label: 'Stock',
      render: r => (
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-sm font-medium"
            style={{ color: r.current_stock <= r.reorder_level ? 'var(--s-red-text)' : 'var(--text-base)' }}>
            {r.current_stock}
          </span>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{r.unit}</span>
          {r.current_stock <= r.reorder_level && (
            <AlertTriangle size={12} style={{ color: 'var(--s-red-text)' }} />
          )}
        </div>
      ),
    },
    { key: 'reorder_level', label: 'Reorder At',
      render: r => <span className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>{r.reorder_level}</span>,
    },
    { key: 'unit_cost', label: 'Unit Cost',
      render: r => r.unit_cost
        ? <span className="font-mono text-xs">₦{(r.unit_cost / 100).toLocaleString()}</span>
        : '—',
    },
    { key: 'actions', label: '', width: '150px',
      render: r => (
        <div className="flex gap-1.5 justify-end">
          <button onClick={e => { e.stopPropagation(); openPanel('movement', r); }}
            className="text-xs px-2.5 py-1 rounded-md"
            style={{ backgroundColor: 'var(--brand-subtle)', color: 'var(--brand)' }}>
            Movement
          </button>
          <button onClick={e => { e.stopPropagation(); openPanel('edit-item', r); }}
            className="btn-ghost text-xs px-2 py-1">
            Edit
          </button>
        </div>
      ),
    },
  ];

  // ── PO columns ────────────────────────────────────────────────────────────
  const poColumns = [
    { key: 'po_no', label: 'PO #',
      render: r => <span className="font-mono text-xs font-medium" style={{ color: 'var(--brand)' }}>{r.po_no}</span>,
    },
    { key: 'supplier',     label: 'Supplier', render: r => r.suppliers?.name || '—' },
    { key: 'items',        label: 'Items',    render: r => `${(r.items || []).length} line${(r.items||[]).length !== 1 ? 's' : ''}` },
    { key: 'total_amount', label: 'Total',    render: r => formatCurrency(r.total || r.total_amount || 0) },
    { key: 'expected_date',label: 'Expected', render: r => r.expected_date ? formatDate(r.expected_date) : '—' },
    { key: 'status',       label: 'Status',   render: r => <StatusBadge status={r.status} /> },
    { key: 'actions', label: '', width: '160px',
      render: r => (
        <div className="flex gap-1.5 justify-end flex-wrap">
          {r.status === 'draft' && (
            <button onClick={e => { e.stopPropagation(); approvePO.mutate(r.id); }}
              className="text-xs px-2.5 py-1 rounded-md"
              style={{ backgroundColor: 'var(--s-green-bg)', color: 'var(--s-green-text)' }}>
              Approve
            </button>
          )}
          {r.status === 'approved' && (
            <button onClick={e => { e.stopPropagation(); receivePO.mutate(r.id); }}
              className="btn-primary text-xs px-2.5 py-1">
              Receive
            </button>
          )}
          {['draft', 'approved'].includes(r.status) && (
            <button onClick={e => { e.stopPropagation(); cancelPO.mutate(r.id); }}
              className="text-xs px-2.5 py-1 rounded-md"
              style={{ backgroundColor: 'var(--s-red-bg)', color: 'var(--s-red-text)' }}>
              Cancel
            </button>
          )}
        </div>
      ),
    },
  ];

  const panelOpen = !!panel;
  const { contentStyle } = usePanelLayout(panelOpen);

  return (
    <div style={{ display: 'flex', gap: 0, minHeight: 0, position: 'relative', overflow: 'hidden' }}>

      {/* ── Left: main content ── */}
      <div style={{
        flex: 1,
        minWidth: 0,
        ...contentStyle,
      }}>
        <div className="space-y-4">

          {/* Controls row */}
          <div className="flex items-center gap-2 flex-wrap">

            {tab === 'Stock' && (
              <div className="relative" style={{ width: 200 }}>
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--text-muted)' }} />
                <input className="input pl-8 text-sm" placeholder="Search items…"
                  value={search} onChange={e => setSearch(e.target.value)} />
              </div>
            )}

            {tab === 'Purchase Orders' && (
              <select className="input text-sm" style={{ width: 'auto' }}
                value={poFilter} onChange={e => setPoFilter(e.target.value)}>
                <option value="">All Statuses</option>
                {['draft','approved','received','cancelled'].map(s => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
            )}

            {/* Tab switcher */}
            <div className="flex gap-0.5 p-1 rounded-lg overflow-x-auto"
              style={{ backgroundColor: 'var(--bg-subtle)' }}>
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

            {/* Tab-specific action buttons */}
            {tab === 'Stock' && (
              <>
                <button onClick={() => setShowLow(s => !s)}
                  className="text-xs px-3 py-1.5 rounded-md transition-all flex items-center gap-1"
                  style={{
                    backgroundColor: showLow ? 'var(--s-red-bg)'  : 'var(--bg-surface)',
                    color:           showLow ? 'var(--s-red-text)' : 'var(--text-muted)',
                    border:          showLow ? 'none'              : '1px solid var(--border-base)',
                  }}>
                  <AlertTriangle size={12} /> Low Stock
                </button>
                {!panelOpen && (
                <button onClick={() => openPanel('new-item')} className="btn-primary text-xs">
                  <Plus size={14} /> Add Item
                </button>
                )}
              </>
            )}
            {tab === 'Purchase Orders' && !panelOpen && (
              <button onClick={() => openPanel('new-po')} className="btn-primary text-xs">
                <Plus size={14} /> New PO
              </button>
            )}
            {tab === 'Suppliers' && !panelOpen && (
              <button onClick={() => openPanel('new-supplier')} className="btn-primary text-xs">
                <Plus size={14} /> Add Supplier
              </button>
            )}
          </div>

          {/* ── Tab content ── */}
          {tab === 'Stock' && (
            <DataTable
              columns={stockColumns}
              data={items}
              loading={stockLoading}
              emptyTitle="No items found"
            />
          )}

          {tab === 'Purchase Orders' && (
            <DataTable
              columns={poColumns}
              data={pos}
              loading={poLoading}
              emptyTitle="No purchase orders yet"
            />
          )}

          {tab === 'Suppliers' && (
            suppliersLoading ? <LoadingSpinner /> :
            suppliers.length === 0 ? (
              <EmptyState
                title="No suppliers yet"
                description="Add suppliers to assign them to inventory items and purchase orders."
              />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {suppliers.map(s => (
                  <div key={s.id} className="card p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: 'var(--brand-subtle)', color: 'var(--brand)' }}>
                          <Building2 size={14} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-base)' }}>{s.name}</p>
                          {(s.contact_person || s.contact_name) && (
                            <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                              {s.contact_person || s.contact_name}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <button onClick={() => openPanel('edit-supplier', s)}
                          className="btn-ghost p-1.5 rounded-md">
                          <Pencil size={13} />
                        </button>
                        <button onClick={() => setDeleteTarget(s)}
                          className="btn-ghost p-1.5 rounded-md"
                          style={{ color: 'var(--s-red-text)' }}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {s.category && (
                        <span className="badge text-xs"
                          style={{ backgroundColor: 'var(--brand-subtle)', color: 'var(--brand)' }}>
                          {CAT_LABELS[s.category] || s.category}
                        </span>
                      )}
                      {s.payment_terms && (
                        <span className="badge text-xs"
                          style={{ backgroundColor: 'var(--bg-subtle)', color: 'var(--text-muted)' }}>
                          {TERM_LABELS[s.payment_terms] || s.payment_terms}
                        </span>
                      )}
                    </div>

                    <div className="space-y-1">
                      {s.phone && (
                        <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                          <Phone size={11} /><span>{s.phone}</span>
                        </div>
                      )}
                      {s.email && (
                        <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                          <Mail size={11} /><span className="truncate">{s.email}</span>
                        </div>
                      )}
                      {s.address && (
                        <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                          <MapPin size={11} /><span className="truncate">{s.address}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

        </div>
      </div>

      {/* ── Mobile backdrop ── */}
      {/* ── Right: slide-in panel ── */}
      <SlidePanel open={panelOpen} onClose={closePanel} title={panelTitle}>
        {panelContent()}
      </SlidePanel>

      {/* Delete supplier confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Deactivate Supplier"
        message={`Remove "${deleteTarget?.name}" from your active suppliers? This won't affect existing purchase orders.`}
        confirmLabel="Deactivate"
        danger
        onConfirm={() => doDeleteSupplier.mutate(deleteTarget.id)}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}