import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import * as folioApi from '../../../lib/api/folioApi';
import toast from 'react-hot-toast';

const DEPTS = ['room','food','beverage','laundry','spa','transport','telephone','minibar','other'];

export default function AddChargeForm({ folioId, onSuccess }) {
  const [form, setForm] = useState(() => ({
    department:  'room',
    description: '',
    quantity:    '1',
    unit_price:  '',
  }));

  const save = useMutation({
    mutationFn: (d) => folioApi.addCharge(folioId, d),
    onSuccess: () => { toast.success('Charge added'); onSuccess(); },
    onError:   (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const unitKobo = Math.round(Number(form.unit_price) * 100);
  const total    = unitKobo * Number(form.quantity);

  const handleSubmit = (e) => {
    e.preventDefault();
    save.mutate({
      ...form,
      quantity:   Number(form.quantity),
      unit_price: unitKobo,
      amount:     total,
      tax_amount: 0,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">

      <div className="form-group">
        <label className="label" htmlFor="ac-department">Department *</label>
        <select id="ac-department" name="department" className="input"
          value={form.department} onChange={handleChange}>
          {DEPTS.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      <div className="form-group">
        <label className="label" htmlFor="ac-description">Description *</label>
        <input id="ac-description" name="description" className="input" required
          placeholder="e.g. Room Service — Breakfast"
          value={form.description} onChange={handleChange} />
      </div>

      <div className="grid grid-cols-2 gap-4">

        <div className="form-group">
          <label className="label" htmlFor="ac-quantity">Quantity</label>
          <input id="ac-quantity" name="quantity" type="number" min="1" className="input"
            value={form.quantity} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label className="label" htmlFor="ac-unit_price">Unit Price (₦) *</label>
          <input id="ac-unit_price" name="unit_price" type="number" min="0" step="0.01" required className="input"
            value={form.unit_price} onChange={handleChange} />
        </div>

      </div>

      {total > 0 && (
        <div className="rounded-lg px-4 py-2.5 flex justify-between text-sm"
          style={{ backgroundColor: 'var(--bg-subtle)' }}>
          <span style={{ color: 'var(--text-muted)' }}>Total</span>
          <span className="font-semibold" style={{ color: 'var(--text-base)' }}>
            ₦{(total / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
          </span>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-1">
        <button type="submit" disabled={save.isPending} className="btn-primary">
          {save.isPending ? 'Posting…' : 'Post Charge'}
        </button>
      </div>
    </form>
  );
}
