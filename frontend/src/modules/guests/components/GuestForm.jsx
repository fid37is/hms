import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import * as guestApi from '../../../lib/api/guestApi';
import toast from 'react-hot-toast';

export default function GuestForm({ guest, onSuccess }) {
  const isEdit = !!guest;

  const [form, setForm] = useState(() => ({
    full_name:     guest?.full_name     ?? '',
    email:         guest?.email         ?? '',
    phone:         guest?.phone         ?? '',
    nationality:   guest?.nationality   ?? '',
    id_type:       guest?.id_type       ?? '',
    id_number:     guest?.id_number     ?? '',
    date_of_birth: guest?.date_of_birth ?? '',
    address:       guest?.address       ?? '',
    notes:         guest?.notes         ?? '',
  }));

  const save = useMutation({
    mutationFn: (d) => isEdit ? guestApi.updateGuest(guest.id, d) : guestApi.createGuest(d),
    onSuccess: () => { toast.success(isEdit ? 'Guest updated' : 'Guest created'); onSuccess(); },
    onError:   (e) => toast.error(e.response?.data?.message || 'Failed to save'),
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  return (
    <form onSubmit={e => { e.preventDefault(); save.mutate(form); }} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">

        <div className="form-group">
          <label className="label" htmlFor="gf-full_name">Full Name *</label>
          <input id="gf-full_name" name="full_name" className="input" required
            value={form.full_name} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label className="label" htmlFor="gf-phone">Phone *</label>
          <input id="gf-phone" name="phone" className="input" required
            value={form.phone} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label className="label" htmlFor="gf-email">Email</label>
          <input id="gf-email" name="email" type="email" className="input"
            value={form.email} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label className="label" htmlFor="gf-nationality">Nationality</label>
          <input id="gf-nationality" name="nationality" className="input"
            value={form.nationality} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label className="label" htmlFor="gf-id_type">ID Type</label>
          <select id="gf-id_type" name="id_type" className="input"
            value={form.id_type} onChange={handleChange}>
            <option value="">Select…</option>
            {['passport','national_id','drivers_license','voters_card'].map(t => (
              <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="label" htmlFor="gf-id_number">ID Number</label>
          <input id="gf-id_number" name="id_number" className="input"
            value={form.id_number} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label className="label" htmlFor="gf-date_of_birth">Date of Birth</label>
          <input id="gf-date_of_birth" name="date_of_birth" type="date" className="input"
            value={form.date_of_birth} onChange={handleChange} />
        </div>

      </div>

      <div className="form-group">
        <label className="label" htmlFor="gf-address">Address</label>
        <input id="gf-address" name="address" className="input"
          value={form.address} onChange={handleChange} />
      </div>

      <div className="form-group">
        <label className="label" htmlFor="gf-notes">Notes</label>
        <textarea id="gf-notes" name="notes" rows={2} className="input"
          value={form.notes} onChange={handleChange} />
      </div>

      <div className="flex justify-end pt-1">
        <button type="submit" disabled={save.isPending} className="btn-primary">
          {save.isPending ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Guest'}
        </button>
      </div>
    </form>
  );
}
