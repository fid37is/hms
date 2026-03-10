// src/modules/inventory/components/SupplierForm.jsx
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as invApi from '../../../lib/api/inventoryApi';
import { INVENTORY_CATEGORIES } from './ItemForm';
import toast from 'react-hot-toast';

const BLANK = () => ({
  name: '', contact_person: '', email: '', phone: '',
  address: '', category: '', payment_terms: '', notes: '',
});

export default function SupplierForm({ supplier, onSuccess }) {
  const isEdit = !!supplier;
  const qc = useQueryClient();

  const [form, setForm] = useState(() => isEdit ? {
    name:           supplier.name           || '',
    contact_person: supplier.contact_person || supplier.contact_name || '',
    email:          supplier.email          || '',
    phone:          supplier.phone          || '',
    address:        supplier.address        || '',
    category:       supplier.category       || '',
    payment_terms:  supplier.payment_terms  || '',
    notes:          supplier.notes          || '',
  } : BLANK());

  const save = useMutation({
    mutationFn: (d) => isEdit ? invApi.updateSupplier(supplier.id, d) : invApi.createSupplier(d),
    onSuccess: () => {
      toast.success(isEdit ? 'Supplier updated' : 'Supplier created');
      qc.invalidateQueries(['suppliers']);
      onSuccess();
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to save supplier'),
  });

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const handleSubmit = e => { e.preventDefault(); save.mutate(form); };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">

        <div className="col-span-2 form-group">
          <label className="label" htmlFor="sf-name">Supplier Name *</label>
          <input id="sf-name" name="name" className="input" required
            placeholder="e.g. Lagos Linen Co."
            value={form.name} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label className="label" htmlFor="sf-contact">Contact Person</label>
          <input id="sf-contact" name="contact_person" className="input"
            placeholder="Full name"
            value={form.contact_person} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label className="label" htmlFor="sf-category">Category</label>
          <select id="sf-category" name="category" className="input"
            value={form.category} onChange={handleChange}>
            <option value="">— None —</option>
            {INVENTORY_CATEGORIES.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="label" htmlFor="sf-email">Email</label>
          <input id="sf-email" name="email" type="email" className="input"
            placeholder="supplier@email.com"
            value={form.email} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label className="label" htmlFor="sf-phone">Phone</label>
          <input id="sf-phone" name="phone" className="input"
            placeholder="+234..."
            value={form.phone} onChange={handleChange} />
        </div>

        <div className="col-span-2 form-group">
          <label className="label" htmlFor="sf-address">Address</label>
          <input id="sf-address" name="address" className="input"
            placeholder="Street, City, State"
            value={form.address} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label className="label" htmlFor="sf-terms">Payment Terms</label>
          <select id="sf-terms" name="payment_terms" className="input"
            value={form.payment_terms} onChange={handleChange}>
            <option value="">— Select —</option>
            {[
              ['immediate','Immediate'],
              ['net_7',    'Net 7 days'],
              ['net_14',   'Net 14 days'],
              ['net_30',   'Net 30 days'],
              ['net_60',   'Net 60 days'],
              ['prepaid',  'Prepaid'],
            ].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>

        <div className="form-group">
          <label className="label" htmlFor="sf-notes">Notes</label>
          <input id="sf-notes" name="notes" className="input"
            placeholder="Any additional notes"
            value={form.notes} onChange={handleChange} />
        </div>

      </div>

      <div className="flex justify-end pt-1">
        <button type="submit" className="btn-primary" disabled={save.isPending}>
          {save.isPending ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Supplier'}
        </button>
      </div>
    </form>
  );
}