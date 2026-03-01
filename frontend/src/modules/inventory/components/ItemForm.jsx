import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import * as invApi from '../../../lib/api/inventoryApi';
import toast from 'react-hot-toast';

export default function ItemForm({ item, onSuccess }) {
  const isEdit = !!item;

  const [form, setForm] = useState(() => ({
    name:          item?.name          ?? '',
    category:      item?.category      ?? '',
    unit:          item?.unit          ?? 'pieces',
    current_stock: item?.current_stock != null ? String(item.current_stock) : '0',
    reorder_level: item?.reorder_level != null ? String(item.reorder_level) : '10',
    unit_cost:     item?.unit_cost     != null ? String(item.unit_cost / 100) : '',
    supplier_id:   item?.supplier_id   ?? '',
    notes:         item?.notes         ?? '',
  }));

  const { data: suppliers } = useQuery({
    queryKey: ['suppliers'],
    queryFn:  () => invApi.getSuppliers().then(r => r.data.data),
  });

  const save = useMutation({
    mutationFn: (d) => isEdit ? invApi.updateItem(item.id, d) : invApi.createItem(d),
    onSuccess: () => { toast.success(isEdit ? 'Item updated' : 'Item created'); onSuccess(); },
    onError:   (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    save.mutate({
      ...form,
      unit_cost:     Math.round(Number(form.unit_cost) * 100) || null,
      current_stock: Number(form.current_stock),
      reorder_level: Number(form.reorder_level),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">

        <div className="form-group">
          <label className="label" htmlFor="if-name">Name *</label>
          <input id="if-name" name="name" className="input" required
            value={form.name} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label className="label" htmlFor="if-category">Category</label>
          <input id="if-category" name="category" className="input"
            placeholder="e.g. Linens"
            value={form.category} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label className="label" htmlFor="if-unit">Unit *</label>
          <select id="if-unit" name="unit" className="input"
            value={form.unit} onChange={handleChange}>
            {['pieces','kg','litres','boxes','rolls','sets','units'].map(u => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="label" htmlFor="if-unit_cost">Unit Cost (₦)</label>
          <input id="if-unit_cost" name="unit_cost" type="number" min="0" step="0.01" className="input"
            value={form.unit_cost} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label className="label" htmlFor="if-current_stock">Current Stock</label>
          <input id="if-current_stock" name="current_stock" type="number" min="0" className="input"
            value={form.current_stock} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label className="label" htmlFor="if-reorder_level">Reorder Level</label>
          <input id="if-reorder_level" name="reorder_level" type="number" min="0" className="input"
            value={form.reorder_level} onChange={handleChange} />
        </div>

      </div>

      <div className="form-group">
        <label className="label" htmlFor="if-supplier_id">Supplier</label>
        <select id="if-supplier_id" name="supplier_id" className="input"
          value={form.supplier_id} onChange={handleChange}>
          <option value="">None</option>
          {(suppliers || []).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      <div className="flex justify-end pt-1">
        <button type="submit" disabled={save.isPending} className="btn-primary">
          {save.isPending ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Item'}
        </button>
      </div>
    </form>
  );
}
