import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ShieldCheck, ShieldOff, ShieldAlert } from 'lucide-react';
import * as staffApi  from '../../../lib/api/staffApi';
import * as userApi   from '../../../lib/api/userApi';
import LoadingSpinner  from '../../../components/shared/LoadingSpinner';
import StatusBadge     from '../../../components/shared/StatusBadge';
import Modal           from '../../../components/shared/Modal';
import ConfirmDialog   from '../../../components/shared/ConfirmDialog';
import { formatDate, formatCurrency } from '../../../utils/format';
import toast from 'react-hot-toast';

// ─── Grant Access Form ────────────────────────────────────
function GrantAccessForm({ staff, roles, onSuccess }) {
  const [form, setForm] = useState({ email: staff.email || '', role_id: '', password: '' });

  const grant = useMutation({
    mutationFn: (d) => userApi.grantAccess(staff.id, d),
    onSuccess: () => { toast.success(`System access granted to ${staff.full_name}`); onSuccess(); },
    onError:   (e) => toast.error(e.response?.data?.message || 'Failed to grant access'),
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  return (
    <form
      onSubmit={e => { e.preventDefault(); grant.mutate(form); }}
      className="space-y-4"
    >
      <div
        className="rounded-lg px-4 py-3 text-sm"
        style={{ backgroundColor: 'var(--bg-subtle)' }}
      >
        <p className="font-medium" style={{ color: 'var(--text-base)' }}>{staff.full_name}</p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
          {staff.job_title} · {staff.departments?.name || 'No department'}
        </p>
      </div>

      <div className="form-group">
        <label className="label" htmlFor="ga-email">Login Email *</label>
        <input
          id="ga-email"
          name="email"
          type="email"
          className="input"
          required
          value={form.email}
          onChange={handleChange}
          placeholder="staff@hotel.com"
        />
      </div>

      <div className="form-group">
        <label className="label" htmlFor="ga-role">System Role *</label>
        <select
          id="ga-role"
          name="role_id"
          className="input"
          required
          value={form.role_id}
          onChange={handleChange}
        >
          <option value="">Select role…</option>
          {roles.map(r => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>
        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
          The role controls what this staff member can see and do in Cierlo
        </p>
      </div>

      <div className="form-group">
        <label className="label" htmlFor="ga-password">Temporary Password *</label>
        <input
          id="ga-password"
          name="password"
          type="password"
          className="input"
          required
          minLength={8}
          value={form.password}
          onChange={handleChange}
          placeholder="Min 8 characters"
        />
        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
          Ask them to change this on first login
        </p>
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <button type="submit" disabled={grant.isPending} className="btn-primary">
          {grant.isPending ? 'Granting access…' : 'Grant System Access'}
        </button>
      </div>
    </form>
  );
}

// ─── Main Component ───────────────────────────────────────
export default function StaffDetail({ staffId }) {
  const qc = useQueryClient();
  const [showGrant,  setShowGrant]  = useState(false);
  const [showRevoke, setShowRevoke] = useState(false);

  const { data: staff, isLoading } = useQuery({
    queryKey: ['staff-detail', staffId],
    queryFn:  () => staffApi.getStaffById(staffId).then(r => r.data.data),
  });

  const { data: shifts } = useQuery({
    queryKey: ['staff-shifts', staffId],
    queryFn:  () => staffApi.getShifts(staffId, { limit: 5 }).then(r => r.data.data),
  });

  const { data: roles } = useQuery({
    queryKey: ['roles'],
    queryFn:  () => userApi.getRoles().then(r => r.data.data),
  });

  const revoke = useMutation({
    mutationFn: () => userApi.revokeAccess(staffId),
    onSuccess: () => {
      toast.success('System access revoked');
      setShowRevoke(false);
      qc.invalidateQueries(['staff-detail', staffId]);
      qc.invalidateQueries(['users']);
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to revoke access'),
  });

  if (isLoading) return <LoadingSpinner center />;
  if (!staff)    return <p style={{ color: 'var(--text-muted)' }}>Not found</p>;

  const hasAccess = !!staff.user_id;

  return (
    <div className="space-y-5">

      {/* Personal info */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-3">
        {[
          ['Phone',           staff.phone             ],
          ['Email',           staff.email || '—'      ],
          ['Department',      staff.departments?.name || '—'],
          ['Job Title',       staff.job_title || '—'  ],
          ['Employment Type', staff.employment_type?.replace(/_/g, ' ')],
          ['Joined',          formatDate(staff.employment_date)],
          ['Salary',          formatCurrency(staff.salary || 0)],
          ['Status',          <StatusBadge status={staff.status || 'active'} />],
        ].map(([label, value]) => (
          <div key={label}>
            <p className="text-xs font-medium uppercase tracking-wider mb-0.5"
              style={{ color: 'var(--text-muted)' }}>{label}</p>
            <p className="text-sm" style={{ color: 'var(--text-sub)' }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Bank details */}
      {staff.bank_name && (
        <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--bg-subtle)' }}>
          <p className="text-xs font-medium uppercase tracking-wider mb-1"
            style={{ color: 'var(--text-muted)' }}>Bank Details</p>
          <p className="text-sm" style={{ color: 'var(--text-sub)' }}>
            {staff.bank_name}
            {staff.bank_account_no && <span className="font-mono ml-2">{staff.bank_account_no}</span>}
          </p>
        </div>
      )}

      {/* ── System Access Panel ── */}
      <div
        className="rounded-lg border p-4"
        style={{
          borderColor:     hasAccess ? 'var(--s-green-bg)' : 'var(--border-soft)',
          backgroundColor: hasAccess ? 'var(--s-green-bg)' : 'var(--bg-subtle)',
        }}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5">
              {hasAccess
                ? <ShieldCheck size={18} style={{ color: 'var(--s-green-text)' }} />
                : <ShieldAlert size={18} style={{ color: 'var(--text-muted)' }} />
              }
            </div>
            <div>
              <p className="text-sm font-semibold"
                style={{ color: hasAccess ? 'var(--s-green-text)' : 'var(--text-base)' }}>
                {hasAccess ? 'Has system access' : 'No system access'}
              </p>
              <p className="text-xs mt-0.5"
                style={{ color: hasAccess ? 'var(--s-green-text)' : 'var(--text-muted)', opacity: 0.8 }}>
                {hasAccess
                  ? 'This staff member can log into Cierlo'
                  : 'Grant access so this person can log in and use Cierlo'
                }
              </p>
            </div>
          </div>

          {hasAccess ? (
            <button
              onClick={() => setShowRevoke(true)}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md flex-shrink-0 transition-colors"
              style={{ backgroundColor: 'var(--s-red-bg)', color: 'var(--s-red-text)' }}
            >
              <ShieldOff size={13} /> Revoke Access
            </button>
          ) : (
            <button
              onClick={() => setShowGrant(true)}
              className="btn-primary text-xs px-3 py-1.5 flex-shrink-0"
            >
              <ShieldCheck size={13} /> Grant Access
            </button>
          )}
        </div>
      </div>

      {/* Recent shifts */}
      <div>
        <p className="text-xs font-medium uppercase tracking-wider mb-2"
          style={{ color: 'var(--text-muted)' }}>Recent Shifts</p>
        {(shifts || []).length ? (
          <div className="space-y-1.5">
            {shifts.map(s => (
              <div key={s.id}
                className="flex justify-between items-center text-sm px-3 py-2 rounded-md"
                style={{ backgroundColor: 'var(--bg-subtle)' }}>
                <span style={{ color: 'var(--text-sub)' }}>{formatDate(s.shift_date)}</span>
                <span className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
                  {s.scheduled_start} – {s.scheduled_end}
                </span>
                <StatusBadge status={s.status} />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No recent shifts</p>
        )}
      </div>

      {/* Grant access modal */}
      <Modal open={showGrant} onClose={() => setShowGrant(false)} title="Grant System Access">
        <GrantAccessForm
          staff={staff}
          roles={roles || []}
          onSuccess={() => {
            setShowGrant(false);
            qc.invalidateQueries(['staff-detail', staffId]);
            qc.invalidateQueries(['users']);
          }}
        />
      </Modal>

      {/* Revoke confirmation */}
      <ConfirmDialog
        open={showRevoke}
        danger
        title="Revoke System Access"
        message={`Remove Cierlo login access for ${staff.full_name}? Their staff record will remain intact but they will no longer be able to log in.`}
        loading={revoke.isPending}
        onClose={() => setShowRevoke(false)}
        onConfirm={() => revoke.mutate()}
      />
    </div>
  );
}