import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, AlertTriangle } from 'lucide-react';
import * as invApi    from '../../lib/api/inventoryApi';
import DataTable      from '../../components/shared/DataTable';
import Modal          from '../../components/shared/Modal';
import StatusBadge    from '../../components/shared/StatusBadge';
import ItemForm       from './components/ItemForm';
import MovementForm   from './components/MovementForm';
import PurchaseOrders from './components/PurchaseOrders';
import toast from 'react-hot-toast';

const TABS = ['Stock', 'Purchase Orders'];

export default function InventoryPage() {
  const qc = useQueryClient();
  const [tab,      setTab]      = useState('Stock');
  const [showItem, setShowItem] = useState(false);
  const [showMove, setShowMove] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [moveItem, setMoveItem] = useState(null);
  const [showLow,  setShowLow]  = useState(false);
  const [showPO,   setShowPO]   = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['inventory-items', showLow],
    queryFn:  () => showLow
      ? invApi.getLowStock().then(r => r.data.data)
      : invApi.getItems({}).then(r => r.data.data),
  });

  const items = data || [];

  const columns = [
    { key: 'name', label: 'Item',
      render: r => (
        <div>
          <p className="text-sm font-medium" style={{ color: 'var(--text-base)' }}>{r.name}</p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{r.category || '—'}</p>
        </div>
      )
    },
    { key: 'current_stock', label: 'Stock',
      render: r => (
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-sm font-medium"
            style={{ color: r.current_stock <= r.reorder_level ? 'var(--s-red-text)' : 'var(--text-base)' }}>
            {r.current_stock}
          </span>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{r.unit}</span>
          {r.current_stock <= r.reorder_level && <AlertTriangle size={12} style={{ color: 'var(--s-red-text)' }} />}
        </div>
      )
    },
    { key: 'reorder_level', label: 'Reorder At',
      render: r => <span className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>{r.reorder_level}</span>
    },
    { key: 'unit_cost', label: 'Unit Cost',
      render: r => r.unit_cost ? <span className="font-mono text-xs">₦{(r.unit_cost / 100).toLocaleString()}</span> : '—'
    },
    { key: 'supplier', label: 'Supplier', render: r => r.suppliers?.name || '—' },
    { key: 'actions', label: '', width: '140px',
      render: r => (
        <div className="flex gap-1.5">
          <button onClick={e => { e.stopPropagation(); setMoveItem(r); setShowMove(true); }}
            className="text-xs px-2.5 py-1 rounded-md"
            style={{ backgroundColor: 'var(--brand-subtle)', color: 'var(--brand)' }}>
            Movement
          </button>
          <button onClick={e => { e.stopPropagation(); setEditItem(r); setShowItem(true); }}
            className="btn-ghost text-xs px-2 py-1">
            Edit
          </button>
        </div>
      )
    },
  ];

  const MobileCard = ({ row: r }) => (
    <div className="card p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <p className="text-sm font-medium" style={{ color: 'var(--text-base)' }}>{r.name}</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {r.category || '—'} · {r.suppliers?.name || '—'}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <span className="font-mono text-sm font-semibold"
              style={{ color: r.current_stock <= r.reorder_level ? 'var(--s-red-text)' : 'var(--text-base)' }}>
              {r.current_stock} {r.unit}
            </span>
            {r.current_stock <= r.reorder_level && (
              <span className="badge text-xs" style={{ backgroundColor: 'var(--s-red-bg)', color: 'var(--s-red-text)' }}>
                Low Stock
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-1 flex-shrink-0">
          <button onClick={() => { setMoveItem(r); setShowMove(true); }}
            className="text-xs px-2.5 py-1.5 rounded-md"
            style={{ backgroundColor: 'var(--brand-subtle)', color: 'var(--brand)' }}>
            Movement
          </button>
          <button onClick={() => { setEditItem(r); setShowItem(true); }}
            className="btn-ghost text-xs px-2 py-1">
            Edit
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">

      {/* Tabs + action buttons on same row */}
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

        {/* Stock tab actions */}
        {tab === 'Stock' && (
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setShowLow(s => !s)}
              className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-md transition-all"
              style={{
                backgroundColor: showLow ? 'var(--s-red-bg)'      : 'var(--bg-surface)',
                color:           showLow ? 'var(--s-red-text)'    : 'var(--text-muted)',
                border:          showLow ? 'none'                  : '1px solid var(--border-base)',
              }}>
              <AlertTriangle size={12} />
              Low Stock
            </button>
            <button onClick={() => { setEditItem(null); setShowItem(true); }} className="btn-primary text-xs">
              <Plus size={14} /> Add
            </button>
          </div>
        )}

        {/* Purchase Orders tab action */}
        {tab === 'Purchase Orders' && (
          <button onClick={() => setShowPO(true)} className="btn-primary text-xs flex-shrink-0">
            <Plus size={14} /> New PO
          </button>
        )}
      </div>

      {tab === 'Stock' && (
        <DataTable
          columns={columns}
          data={items}
          loading={isLoading}
          emptyTitle="No items found"
          mobileCard={MobileCard}
        />
      )}
      {tab === 'Purchase Orders' && (
        <PurchaseOrders openForm={showPO} onFormClose={() => setShowPO(false)} />
      )}

      <Modal open={showItem} onClose={() => setShowItem(false)} title={editItem ? 'Edit Item' : 'Add Item'}>
        <ItemForm item={editItem} onSuccess={() => { setShowItem(false); qc.invalidateQueries(['inventory-items']); }} />
      </Modal>
      <Modal open={showMove} onClose={() => setShowMove(false)} title="Stock Movement">
        <MovementForm item={moveItem} onSuccess={() => { setShowMove(false); qc.invalidateQueries(['inventory-items']); }} />
      </Modal>
    </div>
  );
}