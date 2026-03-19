import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import * as guestApi from '../../../lib/api/guestApi';
import toast from 'react-hot-toast';

const ID_TYPES = [
  { value: 'passport',         label: 'Passport'         },
  { value: 'national_id',      label: 'National ID'      },
  { value: 'nin',              label: 'NIN'               },
  { value: 'drivers_license',  label: "Driver's License" },
  { value: 'voters_card',      label: "Voter's Card"     },
  { value: 'residence_permit', label: 'Residence Permit' },
  { value: 'other',            label: 'Other'            },
];

export default function GuestForm({ guest, onSuccess, onClose }) {
  const isEdit = !!guest;
  const [form, setForm] = useState(() => ({
    full_name:     guest?.full_name     ?? '',
    email:         guest?.email         ?? '',
    phone:         guest?.phone         ?? '',
    nationality:   guest?.nationality   ?? '',
    company_name:  guest?.company_name  ?? '',
    id_type:       guest?.id_type       ?? '',
    id_number:     guest?.id_number     ?? '',
    date_of_birth: guest?.date_of_birth ?? '',
    address:       guest?.address       ?? '',
    category:      guest?.category      ?? 'regular',
    notes:         guest?.notes         ?? '',
  }));

  const save = useMutation({
    mutationFn: (d) => isEdit ? guestApi.updateGuest(guest.id, d) : guestApi.createGuest(d),
    onSuccess: () => { toast.success(isEdit ? 'Guest updated' : 'Guest created'); onSuccess(); },
    onError:   (e) => toast.error(e.response?.data?.message || 'Failed to save'),
  });

  const set = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-5 py-4">
        <div className="grid grid-cols-2 gap-3">

          <div className="form-group col-span-2">
            <label className="label">Full Name *</label>
            <input name="full_name" className="input" required value={form.full_name} onChange={set} />
          </div>

          <div className="form-group">
            <label className="label">Phone</label>
            <input name="phone" className="input" type="tel" placeholder="080xxxxxxxx"
              value={form.phone} onChange={set} />
          </div>

          <div className="form-group">
            <label className="label">Email</label>
            <input name="email" className="input" type="email" value={form.email} onChange={set} />
          </div>

          <div className="form-group">
            <label className="label">Nationality</label>
            <input name="nationality" className="input" placeholder="e.g. Nigerian"
              value={form.nationality} onChange={set} />
          </div>

          <div className="form-group">
            <label className="label">Date of Birth</label>
            <input name="date_of_birth" className="input" type="date"
              value={form.date_of_birth} onChange={set} />
          </div>

          <div className="form-group col-span-2">
            <label className="label">Company / Organisation</label>
            <input name="company_name" className="input" placeholder="For corporate bookings"
              value={form.company_name} onChange={set} />
          </div>

          <div className="form-group">
            <label className="label">ID Type</label>
            <select name="id_type" className="input" value={form.id_type} onChange={set}>
              <option value="">— Select —</option>
              {ID_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label className="label">ID Number</label>
            <input name="id_number" className="input" value={form.id_number} onChange={set} />
          </div>

          <div className="form-group col-span-2">
            <label className="label">Address</label>
            <input name="address" className="input" value={form.address} onChange={set} />
          </div>

          <div className="form-group">
            <label className="label">Category</label>
            <select name="category" className="input" value={form.category} onChange={set}>
              <option value="regular">Regular</option>
              <option value="vip">VIP</option>
              <option value="corporate">Corporate</option>
              <option value="blacklisted">Blacklisted</option>
            </select>
          </div>

          <div className="form-group col-span-2">
            <label className="label">Notes</label>
            <textarea name="notes" className="input" rows={2} value={form.notes} onChange={set} />
          </div>

        </div>
      </div>

      {/* Sticky footer */}
      <div className="flex items-center justify-end gap-2 px-5 py-3 flex-shrink-0"
        style={{ borderTop: '1px solid var(--border-soft)' }}>
        {onClose && <button type="button" className="btn-ghost text-sm" onClick={onClose}>Cancel</button>}
        <button type="button" disabled={save.isPending} className="btn-primary text-sm"
          onClick={() => save.mutate(form)}>
          {save.isPending ? 'Saving…' : isEdit ? 'Update Guest' : 'Add Guest'}
        </button>
      </div>
    </div>
  );
}