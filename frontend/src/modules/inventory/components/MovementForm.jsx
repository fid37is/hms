import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import * as invApi from '../../../lib/api/inventoryApi';
import toast from 'react-hot-toast';

export default function MovementForm({ item, onSuccess }) {
  const [form, setForm] = useState(() => ({ type: 'in', quantity: '', notes: '' }));

  const save = useMutation({
    mutationFn: (d) => invApi.recordMovement(item.id, d),
    onSuccess: () => { toast.success('Movement recorded'); onSuccess(); },
    onError:   (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const setType = (type) => setForm(prev => ({ ...prev, type }));

  return (
    <form onSubmit={e => { e.preventDefault(); save.mutate({ ...form, quantity: Number(form.quantity) }); }}
      className="space-y-4">

      <div className="rounded-lg px-4 py-3 flex justify-between text-sm"
        style={{ backgroundColor: 'var(--bg-subtle)' }}>
        <span style={{ color: 'var(--text-muted)' }}>Current Stock</span>
        <span className="font-semibold font-mono" style={{ color: 'var(--text-base)' }}>
          {item.current_stock} {item.unit}
        </span>
      </div>

      <div className="form-group">
        <label className="label">Movement Type *</label>
        <div className="grid grid-cols-3 gap-2">
          {['in', 'out', 'adjustment'].map(t => (
            <button key={t} type="button" onClick={() => setType(t)}
              className="py-2 text-xs font-medium rounded-md capitalize transition-all"
              style={{
                backgroundColor: form.type === t ? 'var(--brand)' : 'var(--bg-subtle)',
                color:           form.type === t ? 'var(--text-on-brand)' : 'var(--text-sub)',
                border:          `1px solid ${form.type === t ? 'var(--brand)' : 'var(--border-soft)'}`,
              }}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label className="label" htmlFor="mf-quantity">Quantity *</label>
        <input id="mf-quantity" name="quantity" type="number" min="1" required className="input"
          value={form.quantity} onChange={handleChange} />
      </div>

      <div className="form-group">
        <label className="label" htmlFor="mf-notes">Notes</label>
        <input id="mf-notes" name="notes" className="input"
          placeholder="Reason, reference…"
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
