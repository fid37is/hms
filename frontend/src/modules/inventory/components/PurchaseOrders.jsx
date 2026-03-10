// src/modules/inventory/components/POForm.jsx
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import * as invApi from '../../../lib/api/inventoryApi';
import POLineItem from './LineItem';
import toast from 'react-hot-toast';

const BLANK_FORM = () => ({ supplier_id: '', expected_date: '', tax_rate: '0', notes: '' });
const BLANK_LINE = () => ({ item_id: '', name: '', quantity: '1', unit_cost: '' });

export default function POForm({ onSuccess }) {
  const qc = useQueryClient();

  const [form,  setForm]  = useState(BLANK_FORM);
  const [lines, setLines] = useState([BLANK_LINE()]);

  const { data: suppliers } = useQuery({
    queryKey: ['suppliers'],
    queryFn:  () => invApi.getSuppliers().then(r => r.data.data),
  });

  const { data: itemsData } = useQuery({
    queryKey: ['inventory-items-list'],
    queryFn:  () => invApi.getItems({}).then(r => r.data.data),
  });
  const items = itemsData || [];

  const create = useMutation({
    mutationFn: (d) => invApi.createPO(d),
    onSuccess: () => {
      toast.success('Purchase order created');
      qc.invalidateQueries(['purchase-orders']);
      onSuccess();
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const handleFormChange  = e => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  const handleLineChange  = (i, field, value) => setLines(prev => prev.map((l, idx) => {
    if (idx !== i) return l;
    const updated = { ...l, [field]: value };
    // Auto-populate name and unit_cost when an existing item is selected
    if (field === 'item_id' && value) {
      const found = (itemsData || []).find(it => it.id === value);
      if (found) {
        updated.name      = found.name;
        updated.unit_cost = found.unit_cost ? String(found.unit_cost / 100) : '';
      }
    }
    // Clear name/cost when item selection is cleared
    if (field === 'item_id' && !value) {
      updated.name      = '';
      updated.unit_cost = '';
    }
    return updated;
  }));
  const addLine           = () => setLines(prev => [...prev, BLANK_LINE()]);
  const removeLine        = (i) => setLines(prev => prev.filter((_, idx) => idx !== i));

  // Preview in naira (matches what user types); backend stores in kobo
  const subtotal  = lines.reduce((s, l) => s + (Number(l.quantity || 0) * Number(l.unit_cost || 0)), 0);
  const taxAmount = subtotal * (Number(form.tax_rate || 0) / 100);
  const total     = subtotal + taxAmount;

  const handleSubmit = e => {
    e.preventDefault();
    create.mutate({
      supplier_id:   form.supplier_id,
      expected_date: form.expected_date || null,
      notes:         form.notes || null,
      tax_rate:      Number(form.tax_rate || 0),
      items: lines.map(l => ({
        item_id:   l.item_id || null,
        name:      l.name,
        quantity:  Number(l.quantity),
        unit_cost: Math.round(Number(l.unit_cost) * 100),
      })),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">

      <div className="form-group">
        <label className="label" htmlFor="po-supplier">Supplier *</label>
        <select id="po-supplier" name="supplier_id" className="input" required
          value={form.supplier_id} onChange={handleFormChange}>
          <option value="">— Select supplier —</option>
          {(suppliers || []).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        {(suppliers || []).length === 0 && (
          <p className="text-xs mt-1" style={{ color: 'var(--s-yellow-text)' }}>
            No suppliers yet — add one in the Suppliers tab first.
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="form-group">
          <label className="label" htmlFor="po-date">Expected Date</label>
          <input id="po-date" name="expected_date" type="date" className="input"
            value={form.expected_date} onChange={handleFormChange} />
        </div>
        <div className="form-group">
          <label className="label" htmlFor="po-tax">Tax Rate (%)</label>
          <input id="po-tax" name="tax_rate" type="number" min="0" max="100" step="0.1" className="input"
            value={form.tax_rate} onChange={handleFormChange} />
        </div>
      </div>

      {/* Line items */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="label mb-0">Line Items *</label>
          <button type="button" onClick={addLine} className="btn-ghost text-xs flex items-center gap-1 py-1">
            <Plus size={12} /> Add Line
          </button>
        </div>
        <div className="space-y-2">
          {lines.map((line, i) => (
            <POLineItem
              key={i}
              index={i}
              line={line}
              items={items}
              onChange={handleLineChange}
              onRemove={lines.length > 1 ? removeLine : null}
            />
          ))}
        </div>
      </div>

      {/* Totals summary */}
      <div className="rounded-lg p-3 space-y-1 text-sm" style={{ backgroundColor: 'var(--bg-subtle)' }}>
        <div className="flex justify-between" style={{ color: 'var(--text-muted)' }}>
          <span>Subtotal</span>
          <span className="font-mono">₦{subtotal.toLocaleString()}</span>
        </div>
        {Number(form.tax_rate) > 0 && (
          <div className="flex justify-between" style={{ color: 'var(--text-muted)' }}>
            <span>Tax ({form.tax_rate}%)</span>
            <span className="font-mono">₦{taxAmount.toLocaleString()}</span>
          </div>
        )}
        <div className="flex justify-between font-semibold pt-1"
          style={{ borderTop: '1px solid var(--border-soft)', color: 'var(--text-base)' }}>
          <span>Total</span>
          <span className="font-mono">₦{total.toLocaleString()}</span>
        </div>
      </div>

      <div className="form-group">
        <label className="label" htmlFor="po-notes">Notes</label>
        <textarea id="po-notes" name="notes" rows={2} className="input"
          value={form.notes} onChange={handleFormChange} />
      </div>

      <div className="flex justify-end pt-1">
        <button type="submit" disabled={create.isPending} className="btn-primary">
          {create.isPending ? 'Creating…' : 'Create Purchase Order'}
        </button>
      </div>
    </form>
  );
}