// src/modules/maintenance/components/AssetForm.jsx
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as maintApi from '../../../lib/api/maintenanceApi';
import toast from 'react-hot-toast';

const ASSET_CATEGORIES = [
  { value: 'hvac',        label: 'HVAC / Air Conditioning' },
  { value: 'electrical',  label: 'Electrical'              },
  { value: 'plumbing',    label: 'Plumbing'                },
  { value: 'furniture',   label: 'Furniture'               },
  { value: 'appliance',   label: 'Appliance'               },
  { value: 'vehicle',     label: 'Vehicle'                 },
  { value: 'it',          label: 'IT / Technology'         },
  { value: 'security',    label: 'Security Systems'        },
  { value: 'structural',  label: 'Structural'              },
  { value: 'other',       label: 'Other'                   },
];

// Auto-generate serial: SN-YYYYMMDD-XXXX
const generateSerial = () => {
  const date = new Date().toISOString().slice(0,10).replace(/-/g,'');
  const rand = Math.random().toString(36).substring(2,6).toUpperCase();
  return `SN-${date}-${rand}`;
};

const BLANK = () => ({
  name:             '',
  category:         '',
  customCategory:   '',
  location:         '',
  serial_number:    generateSerial(),
  purchase_date:    '',
  purchase_cost:    '',
  warranty_expiry:  '',
  next_service_due: '',
  status:           'operational',
  notes:            '',
});

export default function AssetForm({ asset, onSuccess, onClose }) {
  const isEdit = !!asset;
  const qc = useQueryClient();

  const [form, setForm] = useState(() => isEdit ? {
    name:             asset.name             || '',
    category:         asset.category         || '',
    customCategory:   '',
    location:         asset.location         || '',
    serial_number:    asset.serial_number    || '',
    purchase_date:    asset.purchase_date    || '',
    purchase_cost:    asset.purchase_cost    ? String(asset.purchase_cost / 100) : '',
    warranty_expiry:  asset.warranty_expiry  || '',
    next_service_due: asset.next_service_due || '',
    status:           asset.status           || 'operational',
    notes:            asset.notes            || '',
  } : BLANK());

  const isCustomCategory = form.category === '__custom__';

  const save = useMutation({
    mutationFn: (d) => isEdit ? maintApi.updateAsset(asset.id, d) : maintApi.createAsset(d),
    onSuccess: () => {
      toast.success(isEdit ? 'Asset updated' : 'Asset added');
      qc.invalidateQueries(['assets']);
      onSuccess();
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to save asset'),
  });

  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = e => {
    e.preventDefault();
    const category = isCustomCategory ? form.customCategory : form.category;
    save.mutate({
      name:             form.name,
      category:         category || null,
      location:         form.location || null,
      serial_number:    form.serial_number || null,
      purchase_date:    form.purchase_date || null,
      purchase_cost:    form.purchase_cost ? Math.round(Number(form.purchase_cost) * 100) : 0,
      warranty_expiry:  form.warranty_expiry  || null,
      next_service_due: form.next_service_due || null,
      status:           form.status,
      notes:            form.notes || null,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">

        <div className="col-span-2 form-group">
          <label className="label" htmlFor="af-name">Asset Name *</label>
          <input id="af-name" name="name" className="input" required
            placeholder="e.g. Daikin Split AC Unit — Room 101"
            value={form.name} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label className="label" htmlFor="af-category">Category</label>
          <select id="af-category" name="category" className="input"
            value={form.category} onChange={handleChange}>
            <option value="">— None —</option>
            {ASSET_CATEGORIES.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
            <option value="__custom__">Custom…</option>
          </select>
        </div>

        {isCustomCategory && (
          <div className="form-group">
            <label className="label" htmlFor="af-customCategory">Custom Category *</label>
            <input id="af-customCategory" name="customCategory" className="input"
              required={isCustomCategory}
              placeholder="Enter category name"
              value={form.customCategory} onChange={handleChange} />
          </div>
        )}

        <div className="form-group">
          <label className="label" htmlFor="af-location">Location</label>
          <input id="af-location" name="location" className="input"
            placeholder="e.g. Room 101, Lobby"
            value={form.location} onChange={handleChange} />
        </div>

        <div className="col-span-2 form-group">
          <label className="label" htmlFor="af-serial_number">
            Serial Number
            <button type="button"
              onClick={() => setForm(p => ({ ...p, serial_number: generateSerial() }))}
              className="ml-2 text-xs px-1.5 py-0.5 rounded"
              style={{ color: 'var(--brand)', border: '1px solid var(--brand)', opacity: 0.8 }}>
              Regenerate
            </button>
          </label>
          <input id="af-serial_number" name="serial_number" className="input"
            placeholder="Auto-generated"
            value={form.serial_number} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label className="label" htmlFor="af-purchase_date">Purchase Date</label>
          <input id="af-purchase_date" name="purchase_date" type="date" className="input"
            value={form.purchase_date} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label className="label" htmlFor="af-purchase_cost">Purchase Cost (₦)</label>
          <input id="af-purchase_cost" name="purchase_cost" type="number" min="0" step="0.01" className="input"
            value={form.purchase_cost} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label className="label" htmlFor="af-warranty_expiry">Warranty Expiry</label>
          <input id="af-warranty_expiry" name="warranty_expiry" type="date" className="input"
            value={form.warranty_expiry} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label className="label" htmlFor="af-next_service_due">Next Service Due</label>
          <input id="af-next_service_due" name="next_service_due" type="date" className="input"
            value={form.next_service_due} onChange={handleChange} />
        </div>

        {isEdit && (
          <div className="form-group">
            <label className="label" htmlFor="af-status">Status</label>
            <select id="af-status" name="status" className="input"
              value={form.status} onChange={handleChange}>
              <option value="operational">Operational</option>
              <option value="under_repair">Under Repair</option>
              <option value="decommissioned">Decommissioned</option>
            </select>
          </div>
        )}

      </div>

      <div className="form-group">
        <label className="label" htmlFor="af-notes">Notes</label>
        <textarea id="af-notes" name="notes" rows={2} className="input"
          value={form.notes} onChange={handleChange} />
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
        <button type="submit" disabled={save.isPending} className="btn-primary">
          {save.isPending ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Asset'}
        </button>
      </div>
    </form>
  );
}