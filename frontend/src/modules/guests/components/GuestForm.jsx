import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import * as guestApi from '../../../lib/api/guestApi';
import toast from 'react-hot-toast';

const ID_TYPES = ['passport', 'national_id', "driver's_license", 'voter_card', 'nin'];

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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="form-group sm:col-span-2">
          <label className="label" htmlFor="gf-full_name">Full Name *</label>
          <input id="gf-full_name" name="full_name" className="input" required
            value={form.full_name} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label className="label" htmlFor="gf-phone">Phone</label>
          <input id="gf-phone" name="phone" className="input" type="tel"
            placeholder="080xxxxxxxx" value={form.phone} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label className="label" htmlFor="gf-email">Email</label>
          <input id="gf-email" name="email" className="input" type="email"
            value={form.email} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label className="label" htmlFor="gf-nationality">Nationality</label>
          <input id="gf-nationality" name="nationality" className="input"
            placeholder="e.g. Nigerian" value={form.nationality} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label className="label" htmlFor="gf-dob">Date of Birth</label>
          <input id="gf-dob" name="date_of_birth" className="input" type="date"
            value={form.date_of_birth} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label className="label" htmlFor="gf-id_type">ID Type</label>
          <select id="gf-id_type" name="id_type" className="input" value={form.id_type} onChange={handleChange}>
            <option value="">— Select —</option>
            {ID_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
          </select>
        </div>

        <div className="form-group">
          <label className="label" htmlFor="gf-id_number">ID Number</label>
          <input id="gf-id_number" name="id_number" className="input"
            value={form.id_number} onChange={handleChange} />
        </div>

        <div className="form-group sm:col-span-2">
          <label className="label" htmlFor="gf-address">Address</label>
          <input id="gf-address" name="address" className="input"
            value={form.address} onChange={handleChange} />
        </div>

        <div className="form-group sm:col-span-2">
          <label className="label" htmlFor="gf-notes">Notes</label>
          <textarea id="gf-notes" name="notes" className="input" rows={2}
            value={form.notes} onChange={handleChange} />
        </div>
      </div>

      <button type="submit" disabled={save.isPending} className="btn-primary w-full justify-center py-2.5">
        {save.isPending ? 'Saving…' : isEdit ? 'Update Guest' : 'Add Guest'}
      </button>
    </form>
  );
}
