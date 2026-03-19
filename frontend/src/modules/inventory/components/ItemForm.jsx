// src/modules/inventory/components/ItemForm.jsx
import { useState, useMemo } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import * as invApi from '../../../lib/api/inventoryApi';
import toast from 'react-hot-toast';

// Shared category list — import this into SupplierForm too
export const INVENTORY_CATEGORIES = [
  { value: 'linen',        label: 'Linen & Bedding'   },
  { value: 'toiletries',   label: 'Toiletries'        },
  { value: 'cleaning',     label: 'Cleaning Supplies' },
  { value: 'food_beverage',label: 'Food & Beverage'   },
  { value: 'maintenance',  label: 'Maintenance'       },
  { value: 'office',       label: 'Office Supplies'   },
  { value: 'electronics',  label: 'Electronics'       },
  { value: 'furniture',    label: 'Furniture'         },
  { value: 'other',        label: 'Other'             },
];

export default function ItemForm({ item, onSuccess, onClose }) {
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

  const { data: allSuppliers } = useQuery({
    queryKey: ['suppliers'],
    queryFn:  () => invApi.getSuppliers().then(r => r.data.data),
  });

  // Filter suppliers to match the selected category.
  // If no category is selected, show all suppliers.
  const filteredSuppliers = useMemo(() => {
    const list = allSuppliers || [];
    if (!form.category) return list;
    return list.filter(s => s.category === form.category);
  }, [allSuppliers, form.category]);

  const noSuppliersInCategory = form.category && filteredSuppliers.length === 0;

  const save = useMutation({
    mutationFn: (d) => isEdit ? invApi.updateItem(item.id, d) : invApi.createItem(d),
    onSuccess: () => { toast.success(isEdit ? 'Item updated' : 'Item created'); onSuccess(); },
    onError:   (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => {
      const next = { ...prev, [name]: value };
      // Clear supplier if it no longer belongs to the newly selected category
      if (name === 'category' && prev.supplier_id) {
        const currentSupplier = (allSuppliers || []).find(s => s.id === prev.supplier_id);
        if (currentSupplier && currentSupplier.category !== value) {
          next.supplier_id = '';
        }
      }
      return next;
    });
  };

  const handleSubmit = e => {
    e.preventDefault();
    save.mutate({
      ...form,
      unit_cost:     form.unit_cost ? Math.round(Number(form.unit_cost) * 100) : 0,
      current_stock: Number(form.current_stock),
      reorder_level: Number(form.reorder_level),
      supplier_id:   form.supplier_id || null,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">

        <div className="form-group">
          <label className="label" htmlFor="if-name">Name *</label>
          <input id="if-name" name="name" className="input" required
            value={form.name} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label className="label" htmlFor="if-category">Category</label>
          <select id="if-category" name="category" className="input"
            value={form.category} onChange={handleChange}>
            <option value="">— None —</option>
            {INVENTORY_CATEGORIES.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
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
        <label className="label" htmlFor="if-supplier_id">
          Supplier
          {form.category && !noSuppliersInCategory && (
            <span className="ml-1.5 text-xs font-normal" style={{ color: 'var(--text-muted)' }}>
              — filtered by category
            </span>
          )}
        </label>
        <select id="if-supplier_id" name="supplier_id" className="input"
          value={form.supplier_id} onChange={handleChange}
          >
          <option value="">None</option>
          {filteredSuppliers.map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        {noSuppliersInCategory && (
          <p className="text-xs mt-1" style={{ color: 'var(--s-yellow-text)' }}>
            No suppliers registered under this category yet. You can still save without one.
          </p>
        )}
      </div>

      <div className="form-group">
        <label className="label" htmlFor="if-notes">Notes</label>
        <textarea id="if-notes" name="notes" rows={2} className="input"
          value={form.notes} onChange={handleChange} />
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
        <button type="submit" disabled={save.isPending} className="btn-primary">
          {save.isPending ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Item'}
        </button>
      </div>
    </form>
  );
}