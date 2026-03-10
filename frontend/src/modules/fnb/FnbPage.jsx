// src/frontend/src/modules/fnb/FnbPage.jsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, X, UtensilsCrossed, ChevronRight } from 'lucide-react';
import * as fnbApi from '../../lib/api/fnbApi';
import PageHeader  from '../../components/shared/PageHeader';
import DataTable   from '../../components/shared/DataTable';
import StatusBadge from '../../components/shared/StatusBadge';
import { formatCurrency, formatDateTime } from '../../utils/format';
import toast from 'react-hot-toast';

const TABS = ['Orders', 'Tables', 'Menu', 'Outlets'];

const TABLE_STATUS_COLORS = {
  available: 'var(--s-green-text)',
  occupied:  'var(--s-red-text)',
  reserved:  'var(--s-yellow-text)',
  closed:    'var(--text-muted)',
};

const ORDER_STATUS_STEPS = ['open','sent','preparing','ready','served','billed'];

export default function FnbPage() {
  const qc = useQueryClient();
  const [tab,           setTab]           = useState('Orders');
  const [panel,         setPanel]         = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderFilter,   setOrderFilter]   = useState('');
  const [activeOutlet,  setActiveOutlet]  = useState('');

  const closePanel = () => { setPanel(null); setSelectedOrder(null); };

  // ── Queries ──────────────────────────────────────────────
  const { data: outlets }  = useQuery({ queryKey: ['fnb-outlets'],  queryFn: () => fnbApi.getOutlets().then(r => r.data.data) });
  const { data: tables, isLoading: tablesLoading } = useQuery({ queryKey: ['fnb-tables', activeOutlet],  queryFn: () => fnbApi.getTables(activeOutlet ? { outlet_id: activeOutlet } : {}).then(r => r.data.data), enabled: tab === 'Tables' });
  const { data: menuItems, isLoading: menuLoading } = useQuery({ queryKey: ['fnb-menu', activeOutlet],   queryFn: () => fnbApi.getMenu(activeOutlet ? { outlet_id: activeOutlet } : {}).then(r => r.data.data),   enabled: tab === 'Menu' });
  const { data: categories } = useQuery({ queryKey: ['fnb-categories'], queryFn: () => fnbApi.getCategories({}).then(r => r.data.data) });
  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ['fnb-orders', orderFilter, activeOutlet],
    queryFn:  () => fnbApi.getOrders({ ...(orderFilter ? { status: orderFilter } : {}), ...(activeOutlet ? { outlet_id: activeOutlet } : {}) }).then(r => r.data.data),
    enabled: tab === 'Orders',
  });

  // ── Panel content ─────────────────────────────────────────
  const panelTitle = {
    'new-order':    'New Order',
    'view-order':   selectedOrder ? `Order ${selectedOrder.order_no || ''}` : 'Order',
    'new-menu':     'Add Menu Item',
    'new-outlet':   'Add Outlet',
    'new-table':    'Add Table',
  }[panel] || '';

  // ── Order columns ─────────────────────────────────────────
  const orderColumns = [
    { key: 'order_no', label: 'Order #', render: r => <span className="font-mono text-xs font-semibold" style={{ color: 'var(--brand)' }}>{r.order_no || '—'}</span> },
    { key: 'outlet',   label: 'Outlet',  render: r => r.fnb_outlets?.name || '—' },
    { key: 'table',    label: 'Table',   render: r => r.fnb_tables?.number ? `Table ${r.fnb_tables.number}` : '—' },
    { key: 'total',    label: 'Total',   render: r => formatCurrency(r.total || 0) },
    { key: 'opened',   label: 'Opened',  render: r => formatDateTime(r.created_at) },
    { key: 'status',   label: 'Status',  render: r => <StatusBadge status={r.status} /> },
  ];

  // ── Table grid ────────────────────────────────────────────
  const TableGrid = () => (
    <div className="grid grid-cols-4 gap-3">
      {(tables || []).map(t => (
        <div key={t.id} className="card p-4 cursor-pointer text-center space-y-1"
          onClick={() => { if (t.status === 'available') { setPanel('new-order'); } }}>
          <p className="text-2xl font-bold" style={{ color: 'var(--text-base)' }}>{t.number}</p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{t.capacity} seats</p>
          <p className="text-xs font-medium capitalize" style={{ color: TABLE_STATUS_COLORS[t.status] }}>{t.status}</p>
        </div>
      ))}
      {(tables || []).length === 0 && !tablesLoading && (
        <div className="col-span-4 text-center py-8" style={{ color: 'var(--text-muted)' }}>
          <UtensilsCrossed size={32} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">No tables set up yet</p>
        </div>
      )}
    </div>
  );

  // ── Menu list ─────────────────────────────────────────────
  const menuColumns = [
    { key: 'name',     label: 'Item',     render: r => (
        <div>
          <p className="text-sm font-medium" style={{ color: 'var(--text-base)' }}>{r.name}</p>
          {r.description && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{r.description}</p>}
        </div>
      )
    },
    { key: 'category', label: 'Category', render: r => r.fnb_categories?.name || '—' },
    { key: 'price',    label: 'Price',    render: r => formatCurrency(r.price) },
    { key: 'status',   label: 'Status',   render: r => <StatusBadge status={r.status} /> },
  ];

  // ── Forms (inline in panel) ───────────────────────────────
  const NewOrderForm = () => {
    const [form, setForm] = useState({ outlet_id: activeOutlet || '', table_id: '', notes: '' });
    const save = useMutation({
      mutationFn: d => fnbApi.createOrder(d),
      onSuccess: (r) => {
        toast.success('Order opened');
        qc.invalidateQueries(['fnb-orders']);
        qc.invalidateQueries(['fnb-tables']);
        setSelectedOrder(r.data.data);
        setPanel('view-order');
      },
      onError: e => toast.error(e.response?.data?.message || 'Failed'),
    });
    return (
      <form onSubmit={e => { e.preventDefault(); save.mutate({ ...form, outlet_id: form.outlet_id || null, table_id: form.table_id || null }); }} className="space-y-4">
        <div className="form-group">
          <label className="label">Outlet</label>
          <select className="input" value={form.outlet_id} onChange={e => setForm(p => ({ ...p, outlet_id: e.target.value }))}>
            <option value="">— None —</option>
            {(outlets || []).map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="label">Table</label>
          <select className="input" value={form.table_id} onChange={e => setForm(p => ({ ...p, table_id: e.target.value }))}>
            <option value="">— No table / Takeaway —</option>
            {(tables || []).filter(t => t.status === 'available').map(t => <option key={t.id} value={t.id}>Table {t.number} ({t.capacity} seats)</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="label">Notes</label>
          <textarea className="input" rows={2} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
        </div>
        <div className="flex justify-end">
          <button type="submit" className="btn-primary" disabled={save.isPending}>{save.isPending ? 'Opening…' : 'Open Order'}</button>
        </div>
      </form>
    );
  };

  const OrderDetail = ({ order }) => {
    const [items, setItems] = useState([{ menu_item_id: '', name: '', price: '', quantity: 1, notes: '' }]);
    const addItems = useMutation({
      mutationFn: d => fnbApi.addItems(order.id, d),
      onSuccess: () => { toast.success('Items added'); qc.invalidateQueries(['fnb-orders']); closePanel(); },
      onError: e => toast.error(e.response?.data?.message || 'Failed'),
    });
    const advance = useMutation({
      mutationFn: s => fnbApi.updateStatus(order.id, s),
      onSuccess: () => { toast.success('Status updated'); qc.invalidateQueries(['fnb-orders']); closePanel(); },
      onError: e => toast.error(e.response?.data?.message || 'Failed'),
    });
    const bill = useMutation({
      mutationFn: () => fnbApi.billOrder(order.id),
      onSuccess: () => { toast.success('Order billed'); qc.invalidateQueries(['fnb-orders']); qc.invalidateQueries(['fnb-tables']); closePanel(); },
      onError: e => toast.error(e.response?.data?.message || 'Failed'),
    });
    const cancel = useMutation({
      mutationFn: () => fnbApi.cancelOrder(order.id),
      onSuccess: () => { toast.success('Order cancelled'); qc.invalidateQueries(['fnb-orders']); qc.invalidateQueries(['fnb-tables']); closePanel(); },
      onError: e => toast.error(e.response?.data?.message || 'Failed'),
    });

    const updateItem = (i, field, val) => setItems(prev => prev.map((it, idx) => {
      if (idx !== i) return it;
      const updated = { ...it, [field]: val };
      if (field === 'menu_item_id' && val) {
        const found = (menuItems || []).find(m => m.id === val);
        if (found) { updated.name = found.name; updated.price = String(found.price / 100); }
      }
      return updated;
    }));

    const submitItems = e => {
      e.preventDefault();
      const payload = items.filter(i => i.name).map(i => ({
        menu_item_id: i.menu_item_id || null,
        name: i.name,
        price: Math.round(Number(i.price) * 100),
        quantity: Number(i.quantity) || 1,
        notes: i.notes || null,
      }));
      if (!payload.length) return toast.error('Add at least one item');
      addItems.mutate({ items: payload });
    };

    const nextStatus = ORDER_STATUS_STEPS[ORDER_STATUS_STEPS.indexOf(order.status) + 1];
    const isActive = !['billed','cancelled'].includes(order.status);

    return (
      <div className="space-y-5">
        {/* Summary */}
        <div className="grid grid-cols-2 gap-3">
          {[
            ['Outlet',  order.fnb_outlets?.name || '—'],
            ['Table',   order.fnb_tables?.number ? `Table ${order.fnb_tables.number}` : '—'],
            ['Status',  <StatusBadge status={order.status} />],
            ['Total',   formatCurrency(order.total || 0)],
          ].map(([l, v]) => (
            <div key={l}><p className="label mb-0.5">{l}</p><p className="text-sm" style={{ color: 'var(--text-sub)' }}>{v}</p></div>
          ))}
        </div>

        {/* Existing items */}
        {(order.fnb_order_items || []).length > 0 && (
          <div>
            <p className="label mb-2">Items</p>
            <div className="space-y-1">
              {order.fnb_order_items.map(i => (
                <div key={i.id} className="flex justify-between text-sm py-1" style={{ borderBottom: '1px solid var(--border-soft)' }}>
                  <span style={{ color: 'var(--text-base)' }}>{i.quantity}× {i.name}</span>
                  <span style={{ color: 'var(--text-muted)' }}>{formatCurrency(i.subtotal)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add items */}
        {isActive && (
          <form onSubmit={submitItems} className="space-y-3">
            <p className="label">Add Items</p>
            {items.map((it, i) => (
              <div key={i} className="grid grid-cols-12 gap-1.5 items-end">
                <div className="col-span-5">
                  <select className="input text-xs" value={it.menu_item_id}
                    onChange={e => updateItem(i, 'menu_item_id', e.target.value)}>
                    <option value="">Custom / select</option>
                    {(menuItems || []).map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
                <div className="col-span-3">
                  <input className="input text-xs" placeholder="Name *" required value={it.name}
                    onChange={e => updateItem(i, 'name', e.target.value)} />
                </div>
                <div className="col-span-2">
                  <input className="input text-xs" type="number" min="0" step="0.01" placeholder="₦" value={it.price}
                    onChange={e => updateItem(i, 'price', e.target.value)} />
                </div>
                <div className="col-span-1">
                  <input className="input text-xs" type="number" min="1" placeholder="Qty" value={it.quantity}
                    onChange={e => updateItem(i, 'quantity', e.target.value)} />
                </div>
                <div className="col-span-1 flex justify-center">
                  {items.length > 1 && (
                    <button type="button" onClick={() => setItems(p => p.filter((_,idx) => idx !== i))}
                      className="btn-ghost p-1" style={{ color: 'var(--s-red-text)' }}>
                      <X size={13} />
                    </button>
                  )}
                </div>
              </div>
            ))}
            <div className="flex gap-2">
              <button type="button" onClick={() => setItems(p => [...p, { menu_item_id: '', name: '', price: '', quantity: 1, notes: '' }])}
                className="btn-ghost text-xs"><Plus size={12} /> Add row</button>
              <button type="submit" disabled={addItems.isPending} className="btn-primary text-xs">
                {addItems.isPending ? 'Adding…' : 'Add to Order'}
              </button>
            </div>
          </form>
        )}

        {/* Actions */}
        {isActive && (
          <div className="flex gap-2 flex-wrap pt-2" style={{ borderTop: '1px solid var(--border-soft)' }}>
            {nextStatus && nextStatus !== 'billed' && (
              <button onClick={() => advance.mutate(nextStatus)} disabled={advance.isPending}
                className="btn-primary text-xs capitalize">
                {advance.isPending ? '…' : `Mark ${nextStatus}`}
              </button>
            )}
            {order.status === 'served' && (
              <button onClick={() => bill.mutate()} disabled={bill.isPending} className="btn-primary text-xs">
                {bill.isPending ? 'Billing…' : 'Bill Order'}
              </button>
            )}
            <button onClick={() => cancel.mutate()} disabled={cancel.isPending}
              className="btn-ghost text-xs" style={{ color: 'var(--s-red-text)' }}>
              {cancel.isPending ? '…' : 'Cancel Order'}
            </button>
          </div>
        )}
      </div>
    );
  };

  const NewMenuItemForm = () => {
    const [form, setForm] = useState({ outlet_id: activeOutlet || '', category_id: '', name: '', description: '', price: '', status: 'available' });
    const save = useMutation({
      mutationFn: d => fnbApi.createMenuItem(d),
      onSuccess: () => { toast.success('Menu item added'); qc.invalidateQueries(['fnb-menu']); closePanel(); },
      onError: e => toast.error(e.response?.data?.message || 'Failed'),
    });
    return (
      <form onSubmit={e => { e.preventDefault(); save.mutate({ ...form, price: Math.round(Number(form.price) * 100), outlet_id: form.outlet_id || null, category_id: form.category_id || null }); }} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 form-group">
            <label className="label">Item Name *</label>
            <input className="input" required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="label">Outlet</label>
            <select className="input" value={form.outlet_id} onChange={e => setForm(p => ({ ...p, outlet_id: e.target.value }))}>
              <option value="">— All outlets —</option>
              {(outlets || []).map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="label">Category</label>
            <select className="input" value={form.category_id} onChange={e => setForm(p => ({ ...p, category_id: e.target.value }))}>
              <option value="">— None —</option>
              {(categories || []).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="label">Price (₦) *</label>
            <input className="input" type="number" min="0" step="0.01" required value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="label">Status</label>
            <select className="input" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
              <option value="available">Available</option>
              <option value="unavailable">Unavailable</option>
              <option value="seasonal">Seasonal</option>
            </select>
          </div>
          <div className="col-span-2 form-group">
            <label className="label">Description</label>
            <textarea className="input" rows={2} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
          </div>
        </div>
        <div className="flex justify-end">
          <button type="submit" className="btn-primary" disabled={save.isPending}>{save.isPending ? 'Saving…' : 'Add Item'}</button>
        </div>
      </form>
    );
  };

  const NewOutletForm = () => {
    const [form, setForm] = useState({ name: '', type: 'restaurant', description: '' });
    const save = useMutation({
      mutationFn: d => fnbApi.createOutlet(d),
      onSuccess: () => { toast.success('Outlet created'); qc.invalidateQueries(['fnb-outlets']); closePanel(); },
      onError: e => toast.error(e.response?.data?.message || 'Failed'),
    });
    return (
      <form onSubmit={e => { e.preventDefault(); save.mutate(form); }} className="space-y-4">
        <div className="form-group">
          <label className="label">Outlet Name *</label>
          <input className="input" required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. The Rooftop Bar" />
        </div>
        <div className="form-group">
          <label className="label">Type</label>
          <select className="input" value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
            {['restaurant','bar','room_service','cafe','other'].map(t => <option key={t} value={t} className="capitalize">{t.replace('_',' ')}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="label">Description</label>
          <textarea className="input" rows={2} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
        </div>
        <div className="flex justify-end">
          <button type="submit" className="btn-primary" disabled={save.isPending}>{save.isPending ? 'Saving…' : 'Create Outlet'}</button>
        </div>
      </form>
    );
  };

  const NewTableForm = () => {
    const [form, setForm] = useState({ outlet_id: activeOutlet || '', number: '', capacity: 2 });
    const save = useMutation({
      mutationFn: d => fnbApi.createTable(d),
      onSuccess: () => { toast.success('Table added'); qc.invalidateQueries(['fnb-tables']); closePanel(); },
      onError: e => toast.error(e.response?.data?.message || 'Failed'),
    });
    return (
      <form onSubmit={e => { e.preventDefault(); save.mutate({ ...form, capacity: Number(form.capacity), outlet_id: form.outlet_id || null }); }} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="form-group">
            <label className="label">Table Number *</label>
            <input className="input" required value={form.number} onChange={e => setForm(p => ({ ...p, number: e.target.value }))} placeholder="e.g. T1, A3" />
          </div>
          <div className="form-group">
            <label className="label">Capacity</label>
            <input className="input" type="number" min="1" value={form.capacity} onChange={e => setForm(p => ({ ...p, capacity: e.target.value }))} />
          </div>
          <div className="col-span-2 form-group">
            <label className="label">Outlet</label>
            <select className="input" value={form.outlet_id} onChange={e => setForm(p => ({ ...p, outlet_id: e.target.value }))}>
              <option value="">— None —</option>
              {(outlets || []).map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
          </div>
        </div>
        <div className="flex justify-end">
          <button type="submit" className="btn-primary" disabled={save.isPending}>{save.isPending ? 'Saving…' : 'Add Table'}</button>
        </div>
      </form>
    );
  };

  const panelContent = () => {
    if (panel === 'new-order')  return <NewOrderForm />;
    if (panel === 'view-order' && selectedOrder) return <OrderDetail order={selectedOrder} />;
    if (panel === 'new-menu')   return <NewMenuItemForm />;
    if (panel === 'new-outlet') return <NewOutletForm />;
    if (panel === 'new-table')  return <NewTableForm />;
    return null;
  };

  const tabAction = () => {
    if (tab === 'Orders')  return <button onClick={() => setPanel('new-order')}  className="btn-primary text-xs"><Plus size={14}/> New Order</button>;
    if (tab === 'Menu')    return <button onClick={() => setPanel('new-menu')}   className="btn-primary text-xs"><Plus size={14}/> Add Item</button>;
    if (tab === 'Outlets') return <button onClick={() => setPanel('new-outlet')} className="btn-primary text-xs"><Plus size={14}/> Add Outlet</button>;
    if (tab === 'Tables')  return <button onClick={() => setPanel('new-table')}  className="btn-primary text-xs"><Plus size={14}/> Add Table</button>;
  };

  const ORDER_FILTERS = ['','open','sent','preparing','ready','served','billed','cancelled'];

  return (
    <div className="flex h-full">
      <div className="flex-1 min-w-0 space-y-4">
        <PageHeader title="F&B" subtitle="Food & Beverage" action={tabAction()} />

        {/* Outlet filter + tabs */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-1 p-1 rounded-lg" style={{ backgroundColor: 'var(--bg-subtle)' }}>
            {TABS.map(t => (
              <button key={t} onClick={() => { setTab(t); closePanel(); }}
                className="px-4 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap"
                style={{ backgroundColor: tab === t ? 'var(--bg-surface)' : 'transparent', color: tab === t ? 'var(--text-base)' : 'var(--text-muted)', boxShadow: tab === t ? 'var(--shadow-xs)' : 'none' }}>
                {t}
              </button>
            ))}
          </div>

          {(outlets || []).length > 0 && (
            <select className="input text-xs py-1 w-auto" value={activeOutlet} onChange={e => setActiveOutlet(e.target.value)}>
              <option value="">All Outlets</option>
              {(outlets || []).map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
          )}
        </div>

        {/* Orders tab */}
        {tab === 'Orders' && (
          <>
            <div className="flex gap-1 p-1 rounded-lg w-max" style={{ backgroundColor: 'var(--bg-subtle)' }}>
              {ORDER_FILTERS.map(f => (
                <button key={f || 'all'} onClick={() => setOrderFilter(f)}
                  className="px-3 py-1.5 text-xs font-medium rounded-md capitalize whitespace-nowrap"
                  style={{ backgroundColor: orderFilter === f ? 'var(--bg-surface)' : 'transparent', color: orderFilter === f ? 'var(--text-base)' : 'var(--text-muted)', boxShadow: orderFilter === f ? 'var(--shadow-xs)' : 'none' }}>
                  {f || 'All'}
                </button>
              ))}
            </div>
            <DataTable columns={orderColumns} data={ordersData || []} loading={ordersLoading}
              emptyTitle="No orders" onRowClick={r => { setSelectedOrder(r); setPanel('view-order'); }} />
          </>
        )}

        {/* Tables tab */}
        {tab === 'Tables' && <TableGrid />}

        {/* Menu tab */}
        {tab === 'Menu' && (
          <DataTable columns={menuColumns} data={menuItems || []} loading={menuLoading} emptyTitle="No menu items" />
        )}

        {/* Outlets tab */}
        {tab === 'Outlets' && (
          <div className="space-y-2">
            {(outlets || []).map(o => (
              <div key={o.id} className="card px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-base)' }}>{o.name}</p>
                  <p className="text-xs capitalize" style={{ color: 'var(--text-muted)' }}>{o.type.replace('_',' ')}</p>
                </div>
                <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
              </div>
            ))}
            {(outlets || []).length === 0 && (
              <p className="text-sm text-center py-8" style={{ color: 'var(--text-muted)' }}>No outlets created yet — add your first outlet to get started.</p>
            )}
          </div>
        )}
      </div>

      {/* Slide panel */}
      {panel && (
        <div className="flex-shrink-0 border-l" style={{ width: '480px', backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-base)', display: 'flex', flexDirection: 'column', height: '100%' }}>
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