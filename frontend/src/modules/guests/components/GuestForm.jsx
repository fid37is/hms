import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import * as guestApi from '../../../lib/api/guestApi';
import toast from 'react-hot-toast';

const ID_TYPES = [
  { value: 'passport',         label: 'Passport'          },
  { value: 'national_id',      label: 'National ID'       },
  { value: 'nin',              label: 'NIN'               },
  { value: 'drivers_license',  label: "Driver's License"  },
  { value: 'voters_card',      label: "Voter's Card"      },
  { value: 'residence_permit', label: 'Residence Permit'  },
  { value: 'other',            label: 'Other'             },
];

const CATEGORIES = [
  { value: 'regular',     label: 'Regular'     },
  { value: 'vip',         label: 'VIP'         },
  { value: 'corporate',   label: 'Corporate'   },
  { value: 'blacklisted', label: 'Blacklisted' },
];

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <p style={{
        fontSize: 11, fontWeight: 600, textTransform: 'uppercase',
        letterSpacing: '.6px', color: 'var(--text-muted)',
        marginBottom: 10, paddingBottom: 6,
        borderBottom: '1px solid var(--border-soft)',
      }}>
        {title}
      </p>
      {children}
    </div>
  );
}

export default function GuestForm({ guest, onSuccess, onClose }) {
  const isEdit = !!guest;

  const [form, setForm] = useState(() => ({
    full_name:     guest?.full_name     ?? '',
    email:         guest?.email         ?? '',
    phone:         guest?.phone         ?? '',
    nationality:   guest?.nationality   ?? '',
    date_of_birth: guest?.date_of_birth ?? '',
    address:       guest?.address       ?? '',
    company_name:  guest?.company_name  ?? '',
    id_type:       guest?.id_type       ?? '',
    id_number:     guest?.id_number     ?? '',
    category:      guest?.category      ?? 'regular',
    notes:         guest?.notes         ?? '',
  }));

  const save = useMutation({
    mutationFn: (d) => isEdit ? guestApi.updateGuest(guest.id, d) : guestApi.createGuest(d),
    onSuccess: () => { toast.success(isEdit ? 'Guest updated' : 'Guest added'); onSuccess(); },
    onError:   (e) => toast.error(e.response?.data?.message || 'Failed to save'),
  });

  const set = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  return (
    <form
      onSubmit={e => { e.preventDefault(); save.mutate(form); }}
      className="space-y-0"
    >
      {/* ── Personal Info ─────────────────────────────────────── */}
      <Section title="Personal Info">
        <div className="form-group">
          <label className="label" htmlFor="gf-name">Full Name *</label>
          <input id="gf-name" name="full_name" className="input" required
            placeholder="e.g. John Adeyemi"
            value={form.full_name} onChange={set} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="form-group">
            <label className="label" htmlFor="gf-phone">Phone</label>
            <input id="gf-phone" name="phone" className="input" type="tel"
              placeholder="080xxxxxxxx"
              value={form.phone} onChange={set} />
          </div>
          <div className="form-group">
            <label className="label" htmlFor="gf-email">Email</label>
            <input id="gf-email" name="email" className="input" type="email"
              placeholder="john@example.com"
              value={form.email} onChange={set} />
          </div>
          <div className="form-group">
            <label className="label" htmlFor="gf-dob">Date of Birth</label>
            <input id="gf-dob" name="date_of_birth" className="input" type="date"
              value={form.date_of_birth} onChange={set} />
          </div>
          <div className="form-group">
            <label className="label" htmlFor="gf-nat">Nationality</label>
            <input id="gf-nat" name="nationality" className="input"
              placeholder="e.g. Nigerian"
              value={form.nationality} onChange={set} />
          </div>
        </div>

        <div className="form-group">
          <label className="label" htmlFor="gf-addr">Address</label>
          <input id="gf-addr" name="address" className="input"
            placeholder="Home or billing address"
            value={form.address} onChange={set} />
        </div>
      </Section>

      {/* ── Identification ───────────────────────────────────── */}
      <Section title="Identification">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="form-group">
            <label className="label" htmlFor="gf-idtype">ID Type</label>
            <select id="gf-idtype" name="id_type" className="input"
              value={form.id_type} onChange={set}>
              <option value="">— Select —</option>
              {ID_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="label" htmlFor="gf-idnum">ID Number</label>
            <input id="gf-idnum" name="id_number" className="input"
              placeholder="Document number"
              value={form.id_number} onChange={set} />
          </div>
        </div>
      </Section>

      {/* ── Account & Classification ─────────────────────────── */}
      <Section title="Classification">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="form-group">
            <label className="label" htmlFor="gf-cat">Category</label>
            <select id="gf-cat" name="category" className="input"
              value={form.category} onChange={set}>
              {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="label" htmlFor="gf-company">Company</label>
            <input id="gf-company" name="company_name" className="input"
              placeholder="For corporate bookings"
              value={form.company_name} onChange={set} />
          </div>
        </div>

        <div className="form-group">
          <label className="label" htmlFor="gf-notes">Notes</label>
          <textarea id="gf-notes" name="notes" className="input" rows={2}
            placeholder="Preferences, special requests, internal notes…"
            value={form.notes} onChange={set} />
        </div>
      </Section>

      {/* ── Actions ──────────────────────────────────────────── */}
      <div className="flex justify-end gap-2 pt-2">
        {onClose && (
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
        )}
        <button type="submit" disabled={save.isPending} className="btn-primary">
          {save.isPending ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Guest'}
        </button>
      </div>
    </form>
  );
}