import { useState, useEffect } from 'react';
import SlidePanel, { PANEL_WIDTH } from '../../../components/shared/SlidePanel';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ShieldCheck, ShieldOff, Trash2, Search, UserCheck,
  KeyRound, UserPlus, ChevronRight, Eye, EyeOff,
} from 'lucide-react';
import * as userApi  from '../../../lib/api/userApi';
import * as staffApi from '../../../lib/api/staffApi';
import * as authApi  from '../../../lib/api/authApi';
import DataTable     from '../../../components/shared/DataTable';
import StatusBadge   from '../../../components/shared/StatusBadge';
import ConfirmDialog from '../../../components/shared/ConfirmDialog';
import { formatDate } from '../../../utils/format';
import toast from 'react-hot-toast';


function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);
  return isMobile;
}

// ── Reusable password input with visibility toggle ───────────────────────────
function PasswordInput({ id, name, value, onChange, placeholder, required, minLength, autoFocus }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        id={id} name={name} type={show ? 'text' : 'password'}
        className="input pr-10" required={required} minLength={minLength}
        placeholder={placeholder} value={value} onChange={onChange}
        autoFocus={autoFocus}
      />
      <button
        type="button"
        onClick={() => setShow(s => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
        style={{ color: show ? 'var(--brand)' : 'var(--text-muted)' }}
        tabIndex={-1}
        onMouseEnter={e => e.currentTarget.style.color = 'var(--brand)'}
        onMouseLeave={e => e.currentTarget.style.color = show ? 'var(--brand)' : 'var(--text-muted)'}>
        {show ? <EyeOff size={15} /> : <Eye size={15} />}
      </button>
    </div>
  );
}

// ── Grant Access Panel Content ────────────────────────────────────────────────
function GrantAccessForm({ onSuccess, existingUsers = [] }) {
  const [step,     setStep]     = useState('search'); // 'search' | 'configure'
  const [search,   setSearch]   = useState('');
  const [selected, setSelected] = useState(null);
  const [form,     setForm]     = useState({ email: '', role_id: '', password: '' });

  const { data: staffList } = useQuery({
    queryKey: ['staff-no-access'],
    queryFn:  () => staffApi.getStaff({}).then(r => (r.data.data || []).filter(s => !s.user_id)),
  });

  const { data: roles } = useQuery({
    queryKey: ['roles'],
    queryFn:  () => userApi.getRoles().then(r => r.data.data),
  });

  // Detect if the chosen role already exists in this staff member's department
  const conflictWarning = (() => {
    if (!form.role_id || !selected) return null;
    const role = (roles || []).find(r => String(r.id) === String(form.role_id));
    if (!role) return null;
    const dept = selected.department || selected.department_name || null;
    // Find existing users with same role in same department
    const conflicts = existingUsers.filter(u =>
      String(u.role_id) === String(form.role_id) &&
      u.is_active &&
      dept && u.department &&
      u.department.toLowerCase() === dept.toLowerCase()
    );
    if (conflicts.length === 0) return null;
    return {
      role: role.name,
      dept,
      names: conflicts.map(u => u.full_name),
    };
  })();

  const grant = useMutation({
    mutationFn: (d) => userApi.grantAccess(selected.id, d),
    onSuccess: () => {
      toast.success(`Access granted to ${selected.full_name}`);
      onSuccess();
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to grant access'),
  });

  const filtered = (staffList || []).filter(s =>
    s.full_name.toLowerCase().includes(search.toLowerCase()) ||
    (s.phone || '').includes(search)
  );

  const handleSelect = (s) => {
    setSelected(s);
    setForm(prev => ({ ...prev, email: s.email || '' }));
    setStep('configure');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  // ── Step 1: pick a staff member ───────────────────────────────────────────
  if (step === 'search') {
    return (
      <div className="space-y-4">
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Select a staff member to give them login access to the system.
        </p>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--text-muted)' }} />
          <input className="input pl-9" placeholder="Search by name or phone…"
            value={search} onChange={e => setSearch(e.target.value)} autoFocus />
        </div>
        <div className="space-y-1 max-h-[calc(100vh-260px)] overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="text-sm py-8 text-center" style={{ color: 'var(--text-muted)' }}>
              {(staffList || []).length === 0
                ? 'All staff already have system access'
                : 'No matching staff found'}
            </p>
          ) : filtered.map(s => (
            <button key={s.id} type="button" onClick={() => handleSelect(s)}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-colors group"
              style={{ border: '1px solid var(--border-soft)' }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-subtle)'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold uppercase flex-shrink-0"
                style={{ backgroundColor: 'var(--brand-subtle)', color: 'var(--brand)' }}>
                {s.full_name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: 'var(--text-base)' }}>
                  {s.full_name}
                </p>
                <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                  {s.job_title || s.department || s.phone || '—'}
                </p>
              </div>
              <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 flex-shrink-0 transition-opacity"
                style={{ color: 'var(--text-muted)' }} />
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ── Step 2: configure credentials & role ─────────────────────────────────
  return (
    <div className="space-y-5">
      {/* Selected staff card */}
      <div className="flex items-center gap-3 px-3 py-3 rounded-lg"
        style={{ backgroundColor: 'var(--bg-subtle)', border: '1px solid var(--border-soft)' }}>
        <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold uppercase flex-shrink-0"
          style={{ backgroundColor: 'var(--brand-subtle)', color: 'var(--brand)' }}>
          {selected.full_name.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium" style={{ color: 'var(--text-base)' }}>{selected.full_name}</p>
          <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
            {selected.job_title || selected.department || '—'}
          </p>
        </div>
        <button type="button" onClick={() => { setStep('search'); setSelected(null); }}
          className="text-xs px-2 py-1 rounded-md transition-colors"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-muted)'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
          Change
        </button>
      </div>

      <form onSubmit={e => { e.preventDefault(); grant.mutate(form); }} className="space-y-4">
        {/* Email */}
        <div className="form-group">
          <label className="label" htmlFor="ga-email">Login Email *</label>
          <input id="ga-email" name="email" type="email" className="input" required
            placeholder="staff@hotel.com"
            value={form.email} onChange={handleChange} />
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            This will be their username to log in.
          </p>
        </div>

        {/* Role */}
        <div className="form-group">
          <label className="label" htmlFor="ga-role_id">System Role *</label>
          <select id="ga-role_id" name="role_id" className="input" required
            value={form.role_id} onChange={handleChange}>
            <option value="">Select a role…</option>
            {(roles || []).map(r => (
              <option key={r.id} value={r.id}>
                {r.name}{r.permissions?.length ? ` — ${r.permissions.length} permissions` : ''}
              </option>
            ))}
          </select>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            Roles control which modules and actions this user can access.
          </p>
        </div>

        {/* Conflict warning */}
        {conflictWarning && (
          <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-lg"
            style={{ backgroundColor: 'var(--s-yellow-bg)', border: '1px solid var(--s-yellow-text)', borderOpacity: 0.3 }}>
            <span style={{ color: 'var(--s-yellow-text)', fontSize: 14, flexShrink: 0, marginTop: 1 }}>⚠</span>
            <div>
              <p className="text-xs font-semibold" style={{ color: 'var(--s-yellow-text)' }}>
                Duplicate role in this department
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--s-yellow-text)', opacity: 0.85 }}>
                <strong>{conflictWarning.names.join(', ')}</strong> already{' '}
                {conflictWarning.names.length > 1 ? 'have' : 'has'} the{' '}
                <strong>{conflictWarning.role}</strong> role in <strong>{conflictWarning.dept}</strong>.
                You can still proceed if two people share this role.
              </p>
            </div>
          </div>
        )}

        {/* Temporary password */}
        <div className="form-group">
          <label className="label" htmlFor="ga-password">Temporary Password *</label>
          <PasswordInput id="ga-password" name="password" required
            minLength={8} placeholder="Min. 8 characters"
            value={form.password} onChange={handleChange} />
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            Share this with the staff member — they'll be prompted to change it on first login.
          </p>
        </div>

        <div className="pt-2">
          <button type="submit" disabled={grant.isPending} className="btn-primary w-full justify-center">
            <UserCheck size={14} />
            {grant.isPending ? 'Granting Access…' : 'Grant System Access'}
          </button>
        </div>
      </form>
    </div>
  );
}

// ── Reset Password Panel Content ──────────────────────────────────────────────
function ResetPasswordForm({ user, onSuccess }) {
  const [password, setPassword] = useState('');

  const reset = useMutation({
    mutationFn: ({ id, password }) => authApi.adminResetPassword(id, { password }),
    onSuccess: () => { toast.success('Password reset successfully'); onSuccess(); },
    onError:   (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 px-3 py-3 rounded-lg"
        style={{ backgroundColor: 'var(--bg-subtle)', border: '1px solid var(--border-soft)' }}>
        <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold uppercase flex-shrink-0"
          style={{ backgroundColor: 'var(--brand-subtle)', color: 'var(--brand)' }}>
          {user?.full_name?.charAt(0)}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium" style={{ color: 'var(--text-base)' }}>{user?.full_name}</p>
          <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{user?.email}</p>
        </div>
      </div>

      <div className="form-group">
        <label className="label" htmlFor="rp-password">New Temporary Password</label>
      <PasswordInput id="rp-password" name="password" minLength={8}
        placeholder="Min. 8 characters"
        value={password} onChange={e => setPassword(e.target.value)} autoFocus />
        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
          The user will be prompted to change this on next login.
        </p>
      </div>

      <button
        disabled={password.length < 8 || reset.isPending}
        onClick={() => reset.mutate({ id: user.id, password })}
        className="btn-primary w-full justify-center">
        <KeyRound size={14} />
        {reset.isPending ? 'Resetting…' : 'Reset Password'}
      </button>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function UserManagement() {
  const qc       = useQueryClient();
  const isMobile = useIsMobile();

  const [panel,        setPanel]        = useState(null); // 'grant' | 'reset'
  const [resetTarget,  setResetTarget]  = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [search,       setSearch]       = useState('');

  const closePanel = () => { setPanel(null); setResetTarget(null); };
  const panelOpen  = !!panel;
  const panelTitle = panel === 'grant' ? 'Grant System Access'
                   : panel === 'reset' ? 'Reset Password'
                   : '';

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
    onSuccess: () => {
      toast.success('User removed');
      setDeleteTarget(null);
      qc.invalidateQueries(['users']);
      qc.invalidateQueries(['staff']);
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const filteredUsers = (users || []).filter(u => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      u.full_name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.roles?.name?.toLowerCase().includes(q)
    );
  });

  const columns = [
    {
      key: 'full_name', label: 'User',
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
      ),
    },
    { key: 'role',       label: 'Role',       render: r => r.roles?.name || '—' },
    { key: 'department', label: 'Department', render: r => r.department || '—' },
    { key: 'last_login', label: 'Last Login', render: r => r.last_login ? formatDate(r.last_login) : 'Never' },
    { key: 'status',     label: 'Status',     render: r => <StatusBadge status={r.is_active ? 'active' : 'inactive'} /> },
    {
      key: 'actions', label: '', width: '180px',
      render: r => (
        <div className="flex gap-1.5 justify-end">
          <button
            onClick={e => { e.stopPropagation(); setResetTarget(r); setPanel('reset'); }}
            title="Reset password"
            className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-md transition-colors"
            style={{ backgroundColor: 'var(--bg-subtle)', color: 'var(--text-muted)' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--brand-subtle)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--bg-subtle)'}>
            <KeyRound size={12} />
          </button>
          <button onClick={e => { e.stopPropagation(); toggle.mutate(r); }}
            className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-md transition-colors"
            style={{
              backgroundColor: r.is_active ? 'var(--s-yellow-bg)' : 'var(--s-green-bg)',
              color:           r.is_active ? 'var(--s-yellow-text)' : 'var(--s-green-text)',
            }}>
            {r.is_active
              ? <><ShieldOff size={12} /> Disable</>
              : <><ShieldCheck size={12} /> Enable</>}
          </button>
          <button onClick={e => { e.stopPropagation(); setDeleteTarget(r); }}
            className="flex items-center text-xs px-2 py-1 rounded-md"
            style={{ backgroundColor: 'var(--s-red-bg)', color: 'var(--s-red-text)' }}>
            <Trash2 size={12} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', gap: 0, minHeight: 0, position: 'relative' }}>

      {/* ── Main content ──────────────────────────────────────────────────── */}
      <div style={{
        flex: 1,
        minWidth: 0,
        marginRight: panelOpen && !isMobile ? PANEL_WIDTH + 16 : 0,
        transition: 'margin-right 280ms cubic-bezier(0.4, 0, 0.2, 1)',
      }}>
        <div className="space-y-4">

          {/* Controls row */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative" style={{ width: 220 }}>
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--text-muted)' }} />
              <input className="input pl-8 text-sm" placeholder="Search users…"
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div style={{ flex: 1 }} />
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''}
            </span>
            <button onClick={() => setPanel('grant')} className="btn-primary text-xs">
              <UserPlus size={14} /> Grant Access
            </button>
          </div>

          <div className="card overflow-hidden">
            <DataTable
              columns={columns}
              data={filteredUsers}
              loading={isLoading}
              emptyTitle="No system users yet"
              emptySubtitle="Click 'Grant Access' to give a staff member login access"
            />
          </div>
        </div>
      </div>

      <SlidePanel open={panelOpen} onClose={closePanel} title={panelTitle}>
        {panel === 'grant' && (
          <GrantAccessForm
            existingUsers={users || []}
            onSuccess={() => {
              closePanel();
              qc.invalidateQueries(['users']);
              qc.invalidateQueries(['staff']);
              qc.invalidateQueries(['staff-no-access']);
            }}
          />
        )}
        {panel === 'reset' && resetTarget && (
          <ResetPasswordForm
            user={resetTarget}
            onSuccess={closePanel}
          />
        )}
      </SlidePanel>

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleteTarget} danger
        title="Remove User Account"
        message={`Remove system access for ${deleteTarget?.full_name}? Their staff record stays intact.`}
        loading={del.isPending}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => del.mutate(deleteTarget.id)}
      />
    </div>
  );
}