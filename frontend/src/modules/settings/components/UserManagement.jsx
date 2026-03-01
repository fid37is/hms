import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ShieldCheck, ShieldOff, Trash2, Plus, Search, UserCheck, KeyRound } from 'lucide-react';
import * as userApi   from '../../../lib/api/userApi';
import * as staffApi  from '../../../lib/api/staffApi';
import * as authApi   from '../../../lib/api/authApi';
import DataTable      from '../../../components/shared/DataTable';
import StatusBadge    from '../../../components/shared/StatusBadge';
import Modal          from '../../../components/shared/Modal';
import ConfirmDialog  from '../../../components/shared/ConfirmDialog';
import { formatDate } from '../../../utils/format';
import toast from 'react-hot-toast';

// ── Grant Access Modal ─────────────────────────────────────
function GrantAccessModal({ onClose, onSuccess }) {
  const [search,   setSearch]   = useState('');
  const [selected, setSelected] = useState(null);
  const [form,     setForm]     = useState(() => ({ role_id: '', password: '' }));

  const { data: staffList } = useQuery({
    queryKey: ['staff-no-access'],
    queryFn:  () => staffApi.getStaff({}).then(r =>
      // Only show staff without a system account
      (r.data.data || []).filter(s => !s.user_id)
    ),
  });

  const { data: roles } = useQuery({
    queryKey: ['roles'],
    queryFn:  () => userApi.getRoles().then(r => r.data.data),
  });

  const grant = useMutation({
    mutationFn: (d) => userApi.grantAccess(selected.id, d),
    onSuccess: () => { toast.success(`Access granted to ${selected.full_name}`); onSuccess(); },
    onError:   (e) => toast.error(e.response?.data?.message || 'Failed to grant access'),
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const filtered = (staffList || []).filter(s =>
    s.full_name.toLowerCase().includes(search.toLowerCase()) ||
    (s.phone || '').includes(search)
  );

  return (
    <div className="space-y-4">
      {!selected ? (
        <>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Select a staff member to give system access.
          </p>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--text-muted)' }} />
            <input className="input pl-9" placeholder="Search staff by name or phone…"
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="space-y-1 max-h-60 overflow-y-auto">
            {filtered.map(s => (
              <button key={s.id} type="button" onClick={() => setSelected(s)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors"
                style={{ border: '1px solid var(--border-soft)' }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-subtle)'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold uppercase flex-shrink-0"
                  style={{ backgroundColor: 'var(--brand-subtle)', color: 'var(--brand)' }}>
                  {s.full_name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-base)' }}>{s.full_name}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.job_title || s.phone}</p>
                </div>
              </button>
            ))}
            {!filtered.length && (
              <p className="text-sm py-4 text-center" style={{ color: 'var(--text-muted)' }}>
                {staffList?.length === 0 ? 'All staff already have system access' : 'No staff found'}
              </p>
            )}
          </div>
        </>
      ) : (
        <>
          {/* Selected staff summary */}
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg"
            style={{ backgroundColor: 'var(--bg-subtle)' }}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold uppercase"
              style={{ backgroundColor: 'var(--brand-subtle)', color: 'var(--brand)' }}>
              {selected.full_name.charAt(0)}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium" style={{ color: 'var(--text-base)' }}>{selected.full_name}</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{selected.job_title || '—'}</p>
            </div>
            <button type="button" onClick={() => setSelected(null)}
              className="text-xs" style={{ color: 'var(--text-muted)' }}>Change</button>
          </div>

          <form onSubmit={e => { e.preventDefault(); grant.mutate({ ...form, email: selected.email }); }}
            className="space-y-4">

            <div className="form-group">
              <label className="label" htmlFor="ga-role_id">Role *</label>
              <select id="ga-role_id" name="role_id" className="input" required
                value={form.role_id} onChange={handleChange}>
                <option value="">Select role…</option>
                {(roles || []).map(r => (
                  <option key={r.id} value={r.id}>
                    {r.name} {r.permissions?.length ? `(${r.permissions.length} permissions)` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="label" htmlFor="ga-password">Temporary Password *</label>
              <input id="ga-password" name="password" type="password" className="input" required
                minLength={8} placeholder="Min. 8 characters"
                value={form.password} onChange={handleChange} />
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                Share this with the staff member. They should change it after first login.
              </p>
            </div>

            <div className="flex justify-end">
              <button type="submit" disabled={grant.isPending} className="btn-primary">
                <UserCheck size={14} />
                {grant.isPending ? 'Granting…' : 'Grant Access'}
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────
export default function UserManagement() {
  const qc = useQueryClient();
  const [showGrant,    setShowGrant]    = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [resetTarget,  setResetTarget]  = useState(null);
  const [newPassword,  setNewPassword]  = useState('');

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn:  () => userApi.getUsers().then(r => r.data.data),
  });

  const toggle = useMutation({
    mutationFn: (u) => userApi.toggleUser(u.id, { is_active: !u.is_active }),
    onSuccess:  () => { toast.success('Account updated'); qc.invalidateQueries(['users']); },
    onError:    (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const del = useMutation({
    mutationFn: (id) => userApi.deleteUser(id),
    onSuccess:  () => {
      toast.success('User removed');
      setDeleteTarget(null);
      qc.invalidateQueries(['users']);
      qc.invalidateQueries(['staff']);
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const resetPw = useMutation({
    mutationFn: ({ id, password }) => authApi.adminResetPassword(id, { password }),
    onSuccess: () => {
      toast.success('Password reset successfully');
      setResetTarget(null);
      setNewPassword('');
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const columns = [
    { key: 'full_name', label: 'Name',
      render: r => (
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold uppercase flex-shrink-0"
            style={{ backgroundColor: 'var(--brand-subtle)', color: 'var(--brand)' }}>
            {r.full_name?.charAt(0)}
          </div>
          <div>
            <p className="text-sm font-medium" style={{ color: 'var(--text-base)' }}>{r.full_name}</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{r.email}</p>
          </div>
        </div>
      )
    },
    { key: 'role',       label: 'Role',      render: r => r.roles?.name || '—' },
    { key: 'department', label: 'Department', render: r => r.department || '—' },
    { key: 'last_login', label: 'Last Login', render: r => r.last_login ? formatDate(r.last_login) : 'Never' },
    { key: 'status',     label: 'Status',     render: r => <StatusBadge status={r.is_active ? 'active' : 'inactive'} /> },
    { key: 'actions',    label: '',           width: '180px',
      render: r => (
        <div className="flex gap-1.5 justify-end">
          <button
            onClick={e => { e.stopPropagation(); setResetTarget(r); }}
            title="Reset password"
            className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-md transition-colors"
            style={{ backgroundColor: 'var(--bg-subtle)', color: 'var(--text-muted)' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--brand-subtle)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--bg-subtle)'}>
            <KeyRound size={12} />
          </button>
          <button
            onClick={e => { e.stopPropagation(); toggle.mutate(r); }}
            title={r.is_active ? 'Disable' : 'Enable'}
            className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-md transition-colors"
            style={{
              backgroundColor: r.is_active ? 'var(--s-yellow-bg)' : 'var(--s-green-bg)',
              color:           r.is_active ? 'var(--s-yellow-text)' : 'var(--s-green-text)',
            }}>
            {r.is_active ? <><ShieldOff size={12} /> Disable</> : <><ShieldCheck size={12} /> Enable</>}
          </button>
          <button
            onClick={e => { e.stopPropagation(); setDeleteTarget(r); }}
            className="flex items-center text-xs px-2 py-1 rounded-md transition-colors"
            style={{ backgroundColor: 'var(--s-red-bg)', color: 'var(--s-red-text)' }}>
            <Trash2 size={12} />
          </button>
        </div>
      )
    },
  ];

  return (
    <div className="space-y-4">

      <div className="flex items-center justify-between">
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Grant staff members access to log into the HMS system.
        </p>
        <button onClick={() => setShowGrant(true)} className="btn-primary">
          <Plus size={15} /> Grant Access
        </button>
      </div>

      <div className="card overflow-hidden">
        <DataTable columns={columns} data={users || []} loading={isLoading}
          emptyTitle="No system users yet"
          emptySubtitle="Click 'Grant Access' to give a staff member login access" />
      </div>

      <Modal open={showGrant} onClose={() => setShowGrant(false)} title="Grant System Access">
        <GrantAccessModal
          onClose={() => setShowGrant(false)}
          onSuccess={() => { setShowGrant(false); qc.invalidateQueries(['users']); qc.invalidateQueries(['staff']); }}
        />
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        danger
        title="Remove User Account"
        message={`Remove system access for ${deleteTarget?.full_name}? Their login will be disabled. Their staff record stays intact.`}
        loading={del.isPending}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => del.mutate(deleteTarget.id)}
      />

      {/* Admin Reset Password */}
      <Modal open={!!resetTarget} onClose={() => { setResetTarget(null); setNewPassword(''); }}
        title="Reset Password" size="sm">
        <div className="space-y-4">
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Set a new temporary password for <strong style={{ color: 'var(--text-base)' }}>
            {resetTarget?.full_name}</strong>. Share it with them securely.
          </p>
          <div className="form-group">
            <label className="label" htmlFor="arp-password">New Password</label>
            <input id="arp-password" type="password" className="input"
              minLength={8} placeholder="Min. 8 characters"
              value={newPassword} onChange={e => setNewPassword(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => { setResetTarget(null); setNewPassword(''); }}
              className="btn-secondary">Cancel</button>
            <button
              disabled={newPassword.length < 8 || resetPw.isPending}
              onClick={() => resetPw.mutate({ id: resetTarget.id, password: newPassword })}
              className="btn-primary">
              {resetPw.isPending ? 'Resetting…' : 'Reset Password'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}