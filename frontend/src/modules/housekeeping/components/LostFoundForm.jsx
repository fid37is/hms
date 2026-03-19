// src/modules/housekeeping/components/LostFoundForm.jsx
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as hkApi from '../../../lib/api/housekeepingApi';
import toast from 'react-hot-toast';

const BLANK = () => ({ item_description: '', location_found: '', found_by: '', guest_name: '', notes: '' });

export default function LostFoundForm({ onSuccess, onClose }) {
  const qc = useQueryClient();
  const [form, setForm] = useState(BLANK());

  const create = useMutation({
    mutationFn: (d) => hkApi.createLostItem(d),
    onSuccess: () => {
      toast.success('Item logged');
      setForm(BLANK());
      qc.invalidateQueries(['lost-found']);
      onSuccess();
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  return (
    <form onSubmit={e => { e.preventDefault(); create.mutate(form); }} className="space-y-4">
      <div className="form-group">
        <label className="label" htmlFor="lf-item_description">Item Description *</label>
        <input id="lf-item_description" name="item_description" className="input" required
          value={form.item_description} onChange={handleChange} />
      </div>
      <div className="form-group">
        <label className="label" htmlFor="lf-location_found">Location Found *</label>
        <input id="lf-location_found" name="location_found" className="input" required
          value={form.location_found} onChange={handleChange} />
      </div>
      <div className="form-group">
        <label className="label" htmlFor="lf-found_by">Found By (staff)</label>
        <input id="lf-found_by" name="found_by" className="input"
          value={form.found_by} onChange={handleChange} />
      </div>
      <div className="form-group">
        <label className="label" htmlFor="lf-guest_name">Guest Name</label>
        <input id="lf-guest_name" name="guest_name" className="input"
          value={form.guest_name} onChange={handleChange} />
      </div>
      <div className="form-group">
        <label className="label" htmlFor="lf-notes">Notes</label>
        <textarea id="lf-notes" name="notes" rows={2} className="input"
          value={form.notes} onChange={handleChange} />
      </div>
      <div className="flex justify-end gap-2 pt-1">
        <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
        <button type="submit" disabled={create.isPending} className="btn-primary">
          {create.isPending ? 'Saving…' : 'Log Item'}
        </button>
      </div>
    </form>
  );
}