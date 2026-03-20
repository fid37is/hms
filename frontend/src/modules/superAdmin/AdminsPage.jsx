import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MoreVertical, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { listAdmins, createAdmin, toggleAdmin, deleteAdmin, resetAdminPassword } from '../../lib/api/superAdminApi';
import { PageHeader, Card } from './components';
import { useSuperAdminStore } from '../../store/superAdminStore';
import SlidePanel from '../../components/shared/SlidePanel';
import { formatDateTime } from '../../utils/format';
import toast from 'react-hot-toast';

const BLANK = () => ({ full_name: '', email: '', password: '' });

// ── Confirm Dialog ────────────────────────────────────────────────────────────
function ConfirmDialog({ open, title, message, confirmLabel = 'Confirm', danger = false, onConfirm, onClose }) {
  if (!open) return null;
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backgroundColor: 'rgba(0,0,0,0.5)',
    }} onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--bg-surface)', borderRadius: 12,
          border: '1px solid var(--border-soft)',
          padding: 24, width: 360, maxWidth: '90vw',
          boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
        }}
      >
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 16 }}>
          {danger && (
            <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--s-red-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <AlertTriangle size={16} style={{ color: 'var(--s-red-text)' }} />
            </div>
          )}
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-base)', marginBottom: 4 }}>{title}</p>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>{message}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onClose} className="btn-secondary" style={{ fontSize: 13 }}>Cancel</button>
          <button
            onClick={() => { onConfirm(); onClose(); }}
            className="btn-primary"
            style={{ fontSize: 13, background: danger ? 'var(--s-red-text)' : undefined, borderColor: danger ? 'var(--s-red-text)' : undefined }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Avatar ────────────────────────────────────────────────────────────────────
function Avatar({ name }) {
  return (
    <div style={{
      width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
      background: 'var(--brand-subtle)', color: 'var(--brand)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 700, fontSize: 13,
    }}>
      {name?.charAt(0)?.toUpperCase()}
    </div>
  );
}

// ── Password Input with show/hide ─────────────────────────────────────────────
function PasswordInput({ id, value, onChange, placeholder }) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      <input id={id} type={show ? 'text' : 'password'} className="input" required
        placeholder={placeholder || 'Min 8 characters'} value={value} onChange={onChange}
        style={{ paddingRight: 36 }} />
      <button type="button" onClick={() => setShow(v => !v)} style={{
        position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
        background: 'none', border: 'none', cursor: 'pointer',
        color: 'var(--text-muted)', display: 'flex', alignItems: 'center',
      }}>
        {show ? <EyeOff size={14} /> : <Eye size={14} />}
      </button>
    </div>
  );
}

// ── Kebab Menu ────────────────────────────────────────────────────────────────
function KebabMenu({ admin, onReset, onToggle, onDelete }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const canDelete = !admin.is_active; // can only delete deactivated admins

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const items = [
    {
      label: 'Reset Password',
      action: () => { onReset(admin); setOpen(false); },
      disabled: false,
      danger: false,
    },
    {
      label: admin.is_active ? 'Deactivate' : 'Activate',
      action: () => { onToggle(admin); setOpen(false); },
      disabled: false,
      danger: !admin.is_active, // deactivate is neutral, activate is fine too
    },
    {
      label: 'Delete',
      action: () => { onDelete(admin); setOpen(false); },
      disabled: !canDelete,
      danger: true,
      hint: canDelete ? '' : 'Deactivate first',
    },
  ];

  return (
    <div ref={ref} style={{ position: 'relative', flexShrink: 0 }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'transparent', border: 'none', borderRadius: 6, cursor: 'pointer',
          color: 'var(--text-muted)', transition: 'background .15s',
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-subtle)'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      >
        <MoreVertical size={15} />
      </button>
      {open && (
        <div style={{
          position: 'absolute', right: 0, top: '100%', marginTop: 4, zIndex: 50,
          background: 'var(--bg-surface)', border: '1px solid var(--border-soft)',
          borderRadius: 8, padding: 4, minWidth: 160,
          boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
        }}>
          {items.map(item => (
            <button
              key={item.label}
              onClick={item.disabled ? undefined : item.action}
              title={item.hint || undefined}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                width: '100%', padding: '8px 12px',
                textAlign: 'left', background: 'none', border: 'none',
                borderRadius: 5,
                cursor: item.disabled ? 'not-allowed' : 'pointer',
                fontSize: 12,
                color: item.disabled ? 'var(--text-muted)' : item.danger ? 'var(--s-red-text)' : 'var(--text-base)',
                opacity: item.disabled ? 0.45 : 1,
                transition: 'background .1s',
              }}
              onMouseEnter={e => { if (!item.disabled) e.currentTarget.style.background = item.danger ? 'var(--s-red-bg)' : 'var(--bg-subtle)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AdminsPage() {
  const qc           = useQueryClient();
  const currentAdmin = useSuperAdminStore(s => s.admin);
  const currentId    = currentAdmin?.id;
  const isSuperAdmin = currentAdmin?.role === 'super_admin';

  const [panel,       setPanel]       = useState(null); // 'add' | 'reset'
  const [resetTarget, setResetTarget] = useState(null);
  const [confirm,     setConfirm]     = useState(null); // { type: 'toggle'|'delete', admin }
  const [form,        setForm]        = useState(BLANK());
  const [newPassword, setNewPassword] = useState('');

  const { data: admins = [], isLoading } = useQuery({
    queryKey: ['sa-admins'],
    queryFn:  () => listAdmins().then(r => r.data.data),
  });

  const add = useMutation({
    mutationFn: (d) => createAdmin(d),
    onSuccess: () => { toast.success('Admin created'); setPanel(null); setForm(BLANK()); qc.invalidateQueries(['sa-admins']); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const toggle = useMutation({
    mutationFn: (id) => toggleAdmin(id),
    onSuccess: () => { toast.success('Status updated'); qc.invalidateQueries(['sa-admins']); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const remove = useMutation({
    mutationFn: (id) => deleteAdmin(id),
    onSuccess: () => { toast.success('Admin deleted'); qc.invalidateQueries(['sa-admins']); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const resetPwd = useMutation({
    mutationFn: ({ id, password }) => resetAdminPassword(id, { password }),
    onSuccess: () => { toast.success('Password updated'); setPanel(null); setResetTarget(null); setNewPassword(''); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const openReset  = (admin) => { setResetTarget(admin); setPanel('reset'); };
  const closePanel = () => { setPanel(null); setResetTarget(null); setNewPassword(''); setForm(BLANK()); };

  return (
    <div style={{ display: 'flex', position: 'relative' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          <PageHeader
            title="Admins"
            subtitle="Manage platform super admin accounts"
            action={isSuperAdmin && !panel ? (
              <button className="btn-primary text-xs" onClick={() => setPanel('add')}>+ Add Admin</button>
            ) : null}
          />

          <Card title={`${admins.length} admin${admins.length !== 1 ? 's' : ''}`} noPad>
            {isLoading ? (
              <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Loading…</div>
            ) : admins.map((admin, i) => (
              <div key={admin.id} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                borderBottom: i < admins.length - 1 ? '1px solid var(--border-soft)' : 'none',
              }}>
                <Avatar name={admin.full_name} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-base)', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    {admin.full_name}
                    {admin.id === currentId && (
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: 'var(--brand-subtle)', color: 'var(--brand)' }}>YOU</span>
                    )}
                    {admin.role === 'super_admin' && (
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: 'var(--s-yellow-bg)', color: 'var(--s-yellow-text)' }}>SUPER ADMIN</span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{admin.email}</div>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'right', flexShrink: 0 }}>
                  {admin.last_login ? `Last login ${formatDateTime(admin.last_login)}` : 'Never logged in'}
                </div>
                <div style={{
                  padding: '3px 8px', borderRadius: 5, fontSize: 11, fontWeight: 600, flexShrink: 0,
                  background: admin.is_active ? 'var(--s-green-bg)' : 'var(--s-red-bg)',
                  color: admin.is_active ? 'var(--s-green-text)' : 'var(--s-red-text)',
                }}>
                  {admin.is_active ? 'Active' : 'Inactive'}
                </div>
                {isSuperAdmin && admin.id !== currentId && admin.role !== 'super_admin' && (
                  <KebabMenu
                    admin={admin}
                    onReset={openReset}
                    onToggle={(a) => setConfirm({ type: 'toggle', admin: a })}
                    onDelete={(a) => setConfirm({ type: 'delete', admin: a })}
                  />
                )}
              </div>
            ))}
          </Card>
        </div>
      </div>

      {/* Add Admin panel */}
      <SlidePanel open={panel === 'add'} onClose={closePanel} title="Add Admin">
        <form onSubmit={e => { e.preventDefault(); add.mutate(form); }} className="space-y-4">
          <div className="form-group">
            <label className="label" htmlFor="a-name">Full Name *</label>
            <input id="a-name" className="input" required placeholder="Jane Smith"
              value={form.full_name} onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="label" htmlFor="a-email">Email *</label>
            <input id="a-email" type="email" className="input" required placeholder="jane@example.com"
              value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="label" htmlFor="a-pw">Password *</label>
            <PasswordInput id="a-pw" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={closePanel} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={add.isPending} className="btn-primary">
              {add.isPending ? 'Creating…' : 'Create Admin'}
            </button>
          </div>
        </form>
      </SlidePanel>

      {/* Reset Password panel */}
      <SlidePanel open={panel === 'reset'} onClose={closePanel} title="Reset Password">
        <form onSubmit={e => { e.preventDefault(); resetPwd.mutate({ id: resetTarget.id, password: newPassword }); }} className="space-y-4">
          <div className="form-group">
            <label className="label">Admin</label>
            <input className="input" disabled value={resetTarget?.email || ''} />
          </div>
          <div className="form-group">
            <label className="label" htmlFor="rp-pw">New Password *</label>
            <PasswordInput id="rp-pw" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={closePanel} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={newPassword.length < 8 || resetPwd.isPending} className="btn-primary">
              {resetPwd.isPending ? 'Saving…' : 'Reset Password'}
            </button>
          </div>
        </form>
      </SlidePanel>

      {/* Deactivate/Activate confirm */}
      <ConfirmDialog
        open={confirm?.type === 'toggle'}
        title={confirm?.admin?.is_active ? `Deactivate ${confirm?.admin?.full_name}?` : `Activate ${confirm?.admin?.full_name}?`}
        message={confirm?.admin?.is_active
          ? 'This admin will no longer be able to log in. You can reactivate them at any time.'
          : 'This admin will be able to log in again.'}
        confirmLabel={confirm?.admin?.is_active ? 'Deactivate' : 'Activate'}
        danger={confirm?.admin?.is_active}
        onConfirm={() => toggle.mutate(confirm.admin.id)}
        onClose={() => setConfirm(null)}
      />

      {/* Delete confirm */}
      <ConfirmDialog
        open={confirm?.type === 'delete'}
        title={`Delete ${confirm?.admin?.full_name}?`}
        message={`This will permanently remove ${confirm?.admin?.email} from the platform. This cannot be undone.`}
        confirmLabel="Delete permanently"
        danger
        onConfirm={() => remove.mutate(confirm.admin.id)}
        onClose={() => setConfirm(null)}
      />
    </div>
  );
}