import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import * as folioApi from '../../../lib/api/folioApi';
import { formatCurrency } from '../../../utils/format';
import toast from 'react-hot-toast';

const METHODS = ['cash','card','bank_transfer','mobile_money','complimentary','other'];

export default function PaymentForm({ folioId, balance, onSuccess }) {
  const [form, setForm] = useState(() => ({
    amount: (balance / 100).toFixed(2),
    method: 'cash',
    notes:  '',
  }));

  const save = useMutation({
    mutationFn: (d) => folioApi.addPayment(folioId, d),
    onSuccess: () => { toast.success('Payment recorded'); onSuccess(); },
    onError:   (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  return (
    <form onSubmit={e => {
      e.preventDefault();
      save.mutate({ ...form, amount: Math.round(Number(form.amount) * 100) });
    }} className="space-y-4">

      <div className="rounded-lg px-4 py-3 flex justify-between text-sm"
        style={{ backgroundColor: 'var(--bg-subtle)' }}>
        <span style={{ color: 'var(--text-muted)' }}>Balance Due</span>
        <span className="font-semibold"
          style={{ color: balance > 0 ? 'var(--s-red-text)' : 'var(--s-green-text)' }}>
          {formatCurrency(balance)}
        </span>
      </div>

      <div className="form-group">
        <label className="label" htmlFor="pf-method">Payment Method *</label>
        <select id="pf-method" name="method" className="input"
          value={form.method} onChange={handleChange}>
          {METHODS.map(m => <option key={m} value={m}>{m.replace(/_/g, ' ')}</option>)}
        </select>
      </div>

      <div className="form-group">
        <label className="label" htmlFor="pf-amount">Amount (₦) *</label>
        <input id="pf-amount" name="amount" type="number" min="0" step="0.01" required className="input"
          value={form.amount} onChange={handleChange} />
      </div>

      <div className="form-group">
        <label className="label" htmlFor="pf-notes">Notes</label>
        <input id="pf-notes" name="notes" className="input"
          placeholder="Reference, receipt no…"
          value={form.notes} onChange={handleChange} />
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <button type="submit" disabled={save.isPending} className="btn-primary">
          {save.isPending ? 'Recording…' : 'Record Payment'}
        </button>
      </div>
    </form>
  );
}
