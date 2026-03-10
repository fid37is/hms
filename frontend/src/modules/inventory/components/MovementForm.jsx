// src/modules/inventory/components/MovementForm.jsx
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as invApi from '../../../lib/api/inventoryApi';
import toast from 'react-hot-toast';

export default function MovementForm({ item, onSuccess }) {
  const qc = useQueryClient();

  const [form, setForm] = useState({
    type:      'purchase',
    quantity:  '',
    unit_cost: '',
    reference: '',
    notes:     '',
  });

  const save = useMutation({
    mutationFn: (d) => invApi.recordMovement(item.id, d),
    onSuccess: () => {
      toast.success('Movement recorded');
      qc.invalidateQueries(['inventory-items']);
      onSuccess();
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const handleChange = e => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = e => {
    e.preventDefault();
    save.mutate({
      ...form,
      quantity:  Number(form.quantity),
      unit_cost: form.unit_cost ? Math.round(Number(form.unit_cost) * 100) : undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">

      {/* Current stock banner */}
      <div className="rounded-lg px-4 py-3 flex justify-between text-sm"
        style={{ backgroundColor: 'var(--bg-subtle)' }}>
        <span style={{ color: 'var(--text-muted)' }}>Current Stock</span>
        <span className="font-semibold font-mono" style={{ color: 'var(--text-base)' }}>
          {item?.current_stock} {item?.unit}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">

        <div className="form-group">
          <label className="label" htmlFor="mf-type">Movement Type *</label>
          <select id="mf-type" name="type" className="input"
            value={form.type} onChange={handleChange}>
            {[
              ['purchase',   'Purchase (in)'],
              ['usage',      'Usage (out)'],
              ['adjustment', 'Adjustment'],
              ['wastage',    'Wastage'],
              ['return',     'Return'],
            ].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>

        <div className="form-group">
          <label className="label" htmlFor="mf-quantity">Quantity *</label>
          <input id="mf-quantity" name="quantity" type="number" min="0.01" step="0.01"
            required className="input"
            value={form.quantity} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label className="label" htmlFor="mf-unit_cost">Unit Cost (₦)</label>
          <input id="mf-unit_cost" name="unit_cost" type="number" min="0" step="0.01" className="input"
            value={form.unit_cost} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label className="label" htmlFor="mf-reference">Reference</label>
          <input id="mf-reference" name="reference" className="input"
            placeholder="e.g. PO-001"
            value={form.reference} onChange={handleChange} />
        </div>

      </div>

      <div className="form-group">
        <label className="label" htmlFor="mf-notes">Notes</label>
        <textarea id="mf-notes" name="notes" rows={2} className="input"
          value={form.notes} onChange={handleChange} />
      </div>

      <div className="flex justify-end pt-1">
        <button type="submit" disabled={save.isPending} className="btn-primary">
          {save.isPending ? 'Saving…' : 'Record Movement'}
        </button>
      </div>
    </form>
  );
}