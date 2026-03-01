import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, AlertTriangle } from 'lucide-react';
import * as invApi    from '../../lib/api/inventoryApi';
import PageHeader      from '../../components/shared/PageHeader';
import DataTable       from '../../components/shared/DataTable';
import Modal           from '../../components/shared/Modal';
import StatusBadge     from '../../components/shared/StatusBadge';
import LoadingSpinner  from '../../components/shared/LoadingSpinner';
import ItemForm        from './components/ItemForm';
import MovementForm    from './components/MovementForm';
import PurchaseOrders  from './components/PurchaseOrders';
import toast from 'react-hot-toast';

const TABS = ['Stock', 'Purchase Orders'];

export default function InventoryPage() {
  const qc = useQueryClient();
  const [tab,       setTab]       = useState('Stock');
  const [showItem,  setShowItem]  = useState(false);
  const [showMove,  setShowMove]  = useState(false);
  const [editItem,  setEditItem]  = useState(null);
  const [moveItem,  setMoveItem]  = useState(null);
  const [showLow,   setShowLow]   = useState(false);

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
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-medium"
            style={{ color: r.current_stock <= r.reorder_level ? 'var(--s-red-text)' : 'var(--text-base)' }}>
            {r.current_stock}
          </span>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{r.unit}</span>
          {r.current_stock <= r.reorder_level && (
            <AlertTriangle size={12} style={{ color: 'var(--s-red-text)' }} />
          )}
        </div>
      )
    },
    { key: 'reorder_level', label: 'Reorder At',
      render: r => <span className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>{r.reorder_level}</span> },
    { key: 'unit_cost', label: 'Unit Cost',
      render: r => r.unit_cost
        ? <span className="font-mono text-xs">₦{(r.unit_cost / 100).toLocaleString()}</span>
        : '—'
    },
    { key: 'supplier', label: 'Supplier', render: r => r.suppliers?.name || '—' },
    { key: 'actions', label: '', width: '120px',
      render: r => (
        <div className="flex gap-1.5">
          <button onClick={e => { e.stopPropagation(); setMoveItem(r); setShowMove(true); }}
            className="text-xs px-2.5 py-1 rounded-md"
            style={{ backgroundColor: 'var(--brand-subtle)', color: 'var(--brand)' }}>
            Movement
          </button>
          <button onClick={e => { e.stopPropagation(); setEditItem(r); setShowItem(true); }}
            className="btn-ghost text-xs px-2 py-1">Edit</button>
        </div>
      )
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Inventory"
        subtitle={`${items.length} items`}
        action={
          tab === 'Stock' && (
            <div className="flex gap-2">
              <button
                onClick={() => setShowLow(!showLow)}
                className={showLow ? 'btn-danger' : 'btn-secondary'}
              >
                <AlertTriangle size={14} /> {showLow ? 'Show All' : 'Low Stock'}
              </button>
              <button onClick={() => { setEditItem(null); setShowItem(true); }} className="btn-primary">
                <Plus size={15} /> Add Item
              </button>
            </div>
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

      {tab === 'Stock' && (
        <div className="card overflow-hidden">
          <DataTable columns={columns} data={items} loading={isLoading}
            emptyTitle={showLow ? 'No low stock items' : 'No inventory items'} />
        </div>
      )}

      {tab === 'Purchase Orders' && <PurchaseOrders />}

      <Modal open={showItem} onClose={() => setShowItem(false)}
        title={editItem ? 'Edit Item' : 'Add Item'}>
        <ItemForm item={editItem}
          onSuccess={() => { setShowItem(false); qc.invalidateQueries(['inventory-items']); }} />
      </Modal>

      <Modal open={showMove} onClose={() => setShowMove(false)} title="Record Movement">
        {moveItem && <MovementForm item={moveItem}
          onSuccess={() => { setShowMove(false); qc.invalidateQueries(['inventory-items']); }} />}
      </Modal>
    </div>
  );
}
