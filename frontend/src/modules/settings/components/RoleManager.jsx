import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import * as configApi from '../../../lib/api/userApi';
import LoadingSpinner from '../../../components/shared/LoadingSpinner';
import ConfirmDialog  from '../../../components/shared/ConfirmDialog';
import toast from 'react-hot-toast';

const ALL_PERMISSIONS = [
  { group: 'Rooms',        perms: ['rooms:read','rooms:create','rooms:update','rooms:delete','rooms:status'] },
  { group: 'Reservations', perms: ['reservations:read','reservations:create','reservations:update','reservations:cancel','reservations:delete','reservations:checkin','reservations:checkout'] },
  { group: 'Guests',       perms: ['guests:read','guests:create','guests:update','guests:delete','guests:merge'] },
  { group: 'Billing',      perms: ['billing:read','billing:charge','billing:payment','billing:void','billing:refund','billing:discount','billing:approve','billing:export'] },
  { group: 'Housekeeping', perms: ['housekeeping:read','housekeeping:update','housekeeping:assign'] },
  { group: 'Inventory',    perms: ['inventory:read','inventory:update','inventory:delete','inventory:orders','inventory:approve'] },
  { group: 'Maintenance',  perms: ['maintenance:read','maintenance:create','maintenance:update','maintenance:assign','maintenance:resolve','maintenance:close'] },
  { group: 'Staff',        perms: ['staff:read','staff:create','staff:manage','staff:delete','staff:payroll'] },
  { group: 'F&B',          perms: ['fnb:read','fnb:create','fnb:update','fnb:delete','fnb:billing','fnb:menu'] },
  { group: 'Reports',      perms: ['reports:basic','reports:occupancy','reports:financial','reports:audit'] },
  { group: 'Night Audit',  perms: ['night_audit:read','night_audit:run'] },
  { group: 'Chat',         perms: ['chat:read','chat:reply'] },
  { group: 'Settings',     perms: ['settings:read','settings:update','settings:roles'] },
];

// Shared permission picker used in both create and edit forms
function PermissionPicker({ selectedPerms, setSelectedPerms }) {
  const toggle = (perm) =>
    setSelectedPerms(prev => prev.includes(perm) ? prev.filter(p => p !== perm) : [...prev, perm]);

  const toggleGroup = (perms) => {
    const allSelected = perms.every(p => selectedPerms.includes(p));
    if (allSelected) setSelectedPerms(prev => prev.filter(p => !perms.includes(p)));
    else             setSelectedPerms(prev => [...new Set([...prev, ...perms])]);
  };

  return (
    <div className="space-y-3">
      {ALL_PERMISSIONS.map(({ group, perms }) => {
        const allSelected = perms.every(p => selectedPerms.includes(p));
        return (
          <div key={group}>
            <div className="flex items-center gap-2 mb-1.5">
              <input type="checkbox" id={`group-${group}`} checked={allSelected}
                onChange={() => toggleGroup(perms)} className="rounded"
                style={{ accentColor: 'var(--brand)' }} />
              <label htmlFor={`group-${group}`}
                className="text-xs font-semibold uppercase tracking-wider cursor-pointer"
                style={{ color: 'var(--text-sub)' }}>
                {group}
              </label>
            </div>
            <div className="flex flex-wrap gap-2 pl-5">
              {perms.map(p => (
                <label key={p} className="flex items-center gap-1.5 text-xs cursor-pointer"
                  style={{ color: 'var(--text-muted)' }}>
                  <input type="checkbox" checked={selectedPerms.includes(p)}
                    onChange={() => toggle(p)} style={{ accentColor: 'var(--brand)' }} />
                  <span className="capitalize">{p.split(':')[1]}</span>
                </label>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function RoleCard({ role, onEdit, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const perms = role.permissions || [];
  const isSystem = ['admin'].includes(role.name?.toLowerCase());

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center">
        <button type="button" onClick={() => setExpanded(e => !e)}
          className="flex-1 flex items-center justify-between px-4 py-3 text-left transition-colors"
          onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-subtle)'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--text-base)' }}>{role.name}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {perms.length} permission{perms.length !== 1 ? 's' : ''}
            </p>
          </div>
          {expanded
            ? <ChevronDown size={15} style={{ color: 'var(--text-muted)' }} />
            : <ChevronRight size={15} style={{ color: 'var(--text-muted)' }} />}
        </button>
        {!isSystem && (
          <div className="flex gap-1 pr-3">
            <button onClick={() => onEdit(role)} className="btn-ghost p-1.5 rounded-md">
              <Pencil size={13} />
            </button>
            <button onClick={() => onDelete(role)} className="btn-ghost p-1.5 rounded-md"
              style={{ color: 'var(--s-red-text)' }}>
              <Trash2 size={13} />
            </button>
          </div>
        )}
      </div>

      {expanded && (
        <div className="px-4 pb-4 pt-2" style={{ borderTop: '1px solid var(--border-soft)' }}>
          <div className="flex flex-wrap gap-1.5">
            {perms.length ? perms.map(p => (
              <span key={p} className="badge badge-blue text-xs font-mono">{p}</span>
            )) : (
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No permissions assigned</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function RoleForm({ role, onSuccess, onCancel }) {
  const isEdit = !!role;
  const [name, setName] = useState(role?.name || '');
  const [selectedPerms, setSelectedPerms] = useState(role?.permissions || []);
  const qc = useQueryClient();

  const save = useMutation({
    mutationFn: (d) => isEdit
      ? configApi.updateRole(role.id, d)
      : configApi.createRole(d),
    onSuccess: () => {
      toast.success(isEdit ? 'Role updated' : 'Role created');
      qc.invalidateQueries(['roles']);
      onSuccess();
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  return (
    <div className="card p-5">
      <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-base)' }}>
        {isEdit ? `Edit Role: ${role.name}` : 'New Role'}
      </h3>
      <form onSubmit={e => { e.preventDefault(); save.mutate({ name, permissions: selectedPerms }); }}
        className="space-y-5">
        <div className="form-group">
          <label className="label" htmlFor="role-name">Role Name *</label>
          <input id="role-name" className="input max-w-xs" required
            placeholder="e.g. Front Desk Manager"
            value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div>
          <p className="label mb-3">Permissions</p>
          <PermissionPicker selectedPerms={selectedPerms} setSelectedPerms={setSelectedPerms} />
        </div>
        <div className="flex gap-2">
          <button type="submit" disabled={save.isPending} className="btn-primary">
            {save.isPending ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Role'}
          </button>
          <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
        </div>
      </form>
    </div>
  );
}

export default function RoleManager() {
  const qc = useQueryClient();
  const [showForm,     setShowForm]     = useState(false);
  const [editingRole,  setEditingRole]  = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data: roles, isLoading } = useQuery({
    queryKey: ['roles'],
    queryFn:  () => configApi.getRoles().then(r => r.data.data),
  });

  const doDelete = useMutation({
    mutationFn: (id) => configApi.deleteRole(id),
    onSuccess:  () => { toast.success('Role deleted'); qc.invalidateQueries(['roles']); setDeleteTarget(null); },
    onError:    (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const handleEdit = (role) => {
    setShowForm(false);
    setEditingRole(role);
  };

  const handleClose = () => {
    setShowForm(false);
    setEditingRole(null);
  };

  if (isLoading) return <LoadingSpinner center />;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => { setEditingRole(null); setShowForm(s => !s); }} className="btn-primary text-xs">
          <Plus size={14} /> {showForm ? 'Cancel' : 'New Role'}
        </button>
      </div>

      {showForm && !editingRole && (
        <RoleForm onSuccess={handleClose} onCancel={handleClose} />
      )}

      {editingRole && (
        <RoleForm role={editingRole} onSuccess={handleClose} onCancel={handleClose} />
      )}

      <div className="space-y-2">
        {(roles || []).map(role => (
          <RoleCard
            key={role.id}
            role={role}
            onEdit={handleEdit}
            onDelete={setDeleteTarget}
          />
        ))}
        {!roles?.length && (
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No roles defined</p>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Role"
        message={`Delete "${deleteTarget?.name}"? Users with this role will lose access.`}
        confirmLabel="Delete"
        danger
        onConfirm={() => doDelete.mutate(deleteTarget.id)}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}