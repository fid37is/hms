import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import * as invApi   from '../../../lib/api/inventoryApi';
import DataTable     from '../../../components/shared/DataTable';
import StatusBadge   from '../../../components/shared/StatusBadge';
import Modal         from '../../../components/shared/Modal';
import POLineItem    from './POLineItem';
import { formatDate, formatCurrency } from '../../../utils/format';
import toast from 'react-hot-toast';

const BLANK_FORM = () => ({ supplier_id: '', expected_date: '', notes: '' });
const BLANK_LINE = () => ({ item_id: '', quantity: '1', unit_cost: '' });

export default function PurchaseOrders() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form,     setForm]     = useState(BLANK_FORM);
  const [lines,    setLines]    = useState([BLANK_LINE()]);

  const { data, isLoading } = useQuery({
    queryKey: ['purchase-orders'],
    queryFn:  () => invApi.getPurchaseOrders({}).then(r => r.data.data),
  });

  const { data: suppliers } = useQuery({
    queryKey: ['suppliers'],
    queryFn:  () => invApi.getSuppliers().then(r => r.data.data),
  });

  const { data: items } = useQuery({
    queryKey: ['inventory-items-list'],
    queryFn:  () => invApi.getItems({}).then(r => r.data.data),
  });

  const create = useMutation({
    mutationFn: (d) => invApi.createPO(d),
    onSuccess: () => {
      toast.success('Purchase order created');
      setShowForm(false);
      setForm(BLANK_FORM());
      setLines([BLANK_LINE()]);
      qc.invalidateQueries(['purchase-orders']);
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const approve = useMutation({
    mutationFn: (id) => invApi.approvePO(id),
    onSuccess: () => { toast.success('PO approved'); qc.invalidateQueries(['purchase-orders']); },
    onError:   (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const receive = useMutation({
    mutationFn: (id) => invApi.receivePO(id),
    onSuccess: () => {
      toast.success('PO received — stock updated');
      qc.invalidateQueries(['purchase-orders']);
      qc.invalidateQueries(['inventory-items']);
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  // Stable handler for the top-level form fields
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  // Stable handler for line items — receives (index, fieldName, value) from POLineItem
  const handleLineChange = (index, name, value) => {
    setLines(prev => prev.map((line, i) => i === index ? { ...line, [name]: value } : line));
  };

  const addLine    = () => setLines(prev => [...prev, BLANK_LINE()]);
  const removeLine = (index) => setLines(prev => prev.filter((_, i) => i !== index));

  const handleSubmit = (e) => {
    e.preventDefault();
    create.mutate({
      ...form,
      items: lines.map(l => ({
        item_id:   l.item_id,
        quantity:  Number(l.quantity),
        unit_cost: Math.round(Number(l.unit_cost) * 100),
      })),
    });
  };

  const columns = [
    { key: 'po_no', label: 'PO Number',
      render: r => <span className="font-mono text-xs font-medium" style={{ color: 'var(--brand)' }}>{r.po_no}</span> },
    { key: 'supplier',      label: 'Supplier', render: r => r.suppliers?.name || '—' },
    { key: 'total_amount',  label: 'Amount',   render: r => formatCurrency(r.total_amount || 0) },
    { key: 'expected_date', label: 'Expected', render: r => formatDate(r.expected_date) },
    { key: 'status',        label: 'Status',   render: r => <StatusBadge status={r.status} /> },
    { key: 'actions', label: '', width: '120px',
      render: r => (
        <div className="flex gap-1.5">
          {r.status === 'pending' && (
            <button onClick={e => { e.stopPropagation(); approve.mutate(r.id); }}
              className="text-xs px-2 py-1 rounded-md"
              style={{ backgroundColor: 'var(--brand-subtle)', color: 'var(--brand)' }}>
              Approve
            </button>
          )}
          {r.status === 'approved' && (
            <button onClick={e => { e.stopPropagation(); receive.mutate(r.id); }}
              className="text-xs px-2 py-1 rounded-md"
              style={{ backgroundColor: 'var(--s-green-bg)', color: 'var(--s-green-text)' }}>
              Receive
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setShowForm(true)} className="btn-primary">
          <Plus size={15} /> New PO
        </button>
      </div>

      <div className="card overflow-hidden">
        <DataTable columns={columns} data={data || []} loading={isLoading} emptyTitle="No purchase orders" />
      </div>

      <Modal open={showForm} onClose={() => setShowForm(false)} title="New Purchase Order" size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">

          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="label" htmlFor="po-supplier_id">Supplier *</label>
              <select id="po-supplier_id" name="supplier_id" className="input" required
                value={form.supplier_id} onChange={handleFormChange}>
                <option value="">Select…</option>
                {(suppliers || []).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="label" htmlFor="po-expected_date">Expected Date</label>
              <input id="po-expected_date" name="expected_date" type="date" className="input"
                value={form.expected_date} onChange={handleFormChange} />
            </div>
          </div>

          {/* Line items — each in its own component for stable handlers */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="label mb-0">Items *</label>
              <button type="button" onClick={addLine} className="btn-ghost text-xs py-1">
                + Add Line
              </button>
            </div>
            <div className="space-y-2">
              {lines.map((line, i) => (
                <POLineItem
                  key={i}
                  index={i}
                  line={line}
                  items={items || []}
                  onChange={handleLineChange}
                  onRemove={lines.length > 1 ? removeLine : null}
                />
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="label" htmlFor="po-notes">Notes</label>
            <textarea id="po-notes" name="notes" rows={2} className="input"
              value={form.notes} onChange={handleFormChange} />
          </div>

          <div className="flex justify-end pt-1">
            <button type="submit" disabled={create.isPending} className="btn-primary">
              {create.isPending ? 'Creating…' : 'Create PO'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}