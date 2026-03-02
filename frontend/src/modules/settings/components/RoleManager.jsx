import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Shield, ChevronDown } from 'lucide-react';
import * as configApi from '../../../lib/api/userApi';
import LoadingSpinner from '../../../components/shared/LoadingSpinner';
import Modal          from '../../../components/shared/Modal';
import toast from 'react-hot-toast';

const ALL_PERMISSIONS = [
  { group: 'Rooms',        perms: ['rooms:read','rooms:write','rooms:manage'] },
  { group: 'Reservations', perms: ['reservations:read','reservations:write','reservations:manage'] },
  { group: 'Guests',       perms: ['guests:read','guests:write'] },
  { group: 'Billing',      perms: ['billing:read','billing:write','billing:void'] },
  { group: 'Housekeeping', perms: ['housekeeping:read','housekeeping:write'] },
  { group: 'Inventory',    perms: ['inventory:read','inventory:write','inventory:approve'] },
  { group: 'Maintenance',  perms: ['maintenance:read','maintenance:write'] },
  { group: 'Staff',        perms: ['staff:read','staff:write','staff:manage'] },
  { group: 'Reports',      perms: ['reports:read','reports:export'] },
  { group: 'Settings',     perms: ['settings:read','settings:write'] },
];

function PermissionsPanel({ role }) {
  const groupedPerms = ALL_PERMISSIONS
    .map(({ group, perms }) => ({
      group,
      assigned: perms.filter(p => (role.permissions || []).includes(p)),
    }))
    .filter(g => g.assigned.length > 0);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold" style={{ color: 'var(--text-base)' }}>
          {role.name}
        </h3>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
          {(role.permissions || []).length} permissions across {groupedPerms.length} module{groupedPerms.length !== 1 ? 's' : ''}
        </p>
      </div>

      {groupedPerms.length > 0 ? (
        <div className="space-y-4">
          {groupedPerms.map(({ group, assigned }) => (
            <div key={group}>
              <p className="text-xs font-semibold uppercase tracking-wider mb-2"
                style={{ color: 'var(--text-muted)' }}>
                {group}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {assigned.map(p => (
                  <span key={p} className="badge badge-blue font-mono text-xs">{p}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          No permissions assigned to this role.
        </p>
      )}
    </div>
  );
}

function CreateRoleForm({ onSuccess }) {
  const [name,          setName]          = useState('');
  const [selectedPerms, setSelectedPerms] = useState([]);

  const save = useMutation({
    mutationFn: (d) => configApi.createRole(d),
    onSuccess: () => { toast.success('Role created'); onSuccess(); },
    onError:   (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const toggle = (perm) => {
    setSelectedPerms(prev => prev.includes(perm) ? prev.filter(p => p !== perm) : [...prev, perm]);
  };

  const toggleGroup = (perms) => {
    const allSelected = perms.every(p => selectedPerms.includes(p));
    setSelectedPerms(prev =>
      allSelected ? prev.filter(p => !perms.includes(p)) : [...new Set([...prev, ...perms])]
    );
  };

  return (
    <form onSubmit={e => { e.preventDefault(); save.mutate({ name, permissions: selectedPerms }); }} className="space-y-5">
      <div className="form-group">
        <label className="label" htmlFor="role-name">Role Name *</label>
        <input id="role-name" className="input max-w-xs" required
          placeholder="e.g. Front Desk Manager"
          value={name} onChange={e => setName(e.target.value)} />
      </div>

      <div>
        <p className="label mb-3">Permissions</p>
        <div className="space-y-4">
          {ALL_PERMISSIONS.map(({ group, perms }) => {
            const allSelected = perms.every(p => selectedPerms.includes(p));
            return (
              <div key={group}>
                <div className="flex items-center gap-2 mb-2">
                  <input type="checkbox" id={`group-${group}`} checked={allSelected}
                    onChange={() => toggleGroup(perms)}
                    style={{ accentColor: 'var(--brand)' }} />
                  <label htmlFor={`group-${group}`}
                    className="text-xs font-semibold uppercase tracking-wider cursor-pointer"
                    style={{ color: 'var(--text-sub)' }}>
                    {group}
                  </label>
                </div>
                <div className="flex flex-wrap gap-3 pl-5">
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
      </div>

      <div className="flex justify-end pt-1">
        <button type="submit" disabled={save.isPending} className="btn-primary">
          {save.isPending ? 'Creating…' : 'Create Role'}
        </button>
      </div>
    </form>
  );
}

export default function RoleManager({ openForm, onFormClose }) {
  const qc = useQueryClient();
  const [showForm,   setShowForm]   = useState(false);
  const [activeRole, setActiveRole] = useState(null);
  // Mobile accordion — which role is expanded inline
  const [expandedId, setExpandedId] = useState(null);
  const detailRef = useRef(null);

  useEffect(() => { if (openForm) setShowForm(true); }, [openForm]);
  const handleClose = () => { setShowForm(false); onFormClose?.(); };

  const { data: roles, isLoading } = useQuery({
    queryKey: ['roles'],
    queryFn:  () => configApi.getRoles().then(r => r.data.data),
  });

  if (isLoading) return <LoadingSpinner center />;

  const handleRoleClick = (role) => {
    // Desktop: set active role for right panel
    setActiveRole(role);
    // Mobile: toggle accordion
    setExpandedId(prev => prev === role.id ? null : role.id);
  };

  return (
    <>
      {/* ── Mobile: accordion list ── */}
      <div className="md:hidden space-y-1.5">
        {(roles || []).map(role => {
          const isExpanded = expandedId === role.id;
          return (
            <div key={role.id} className="card overflow-hidden">
              <button
                onClick={() => handleRoleClick(role)}
                className="w-full flex items-center justify-between px-4 py-3 text-left"
                style={{
                  backgroundColor: isExpanded ? 'var(--brand-subtle)' : 'transparent',
                }}
              >
                <div>
                  <p className="text-sm font-medium"
                    style={{ color: isExpanded ? 'var(--brand)' : 'var(--text-base)' }}>
                    {role.name}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    {(role.permissions || []).length} permission{(role.permissions || []).length !== 1 ? 's' : ''}
                  </p>
                </div>
                <ChevronDown
                  size={15}
                  style={{
                    color: 'var(--text-muted)',
                    transform: isExpanded ? 'rotate(180deg)' : 'none',
                    transition: 'transform 0.2s',
                    flexShrink: 0,
                  }}
                />
              </button>
              {isExpanded && (
                <div className="px-4 pb-4 pt-2" style={{ borderTop: '1px solid var(--border-soft)' }}>
                  <PermissionsPanel role={role} />
                </div>
              )}
            </div>
          );
        })}
        {!roles?.length && (
          <p className="text-sm p-4" style={{ color: 'var(--text-muted)' }}>No roles defined yet.</p>
        )}
      </div>

      {/* ── Desktop: master-detail ── */}
      <div className="hidden md:grid md:grid-cols-5 gap-4" style={{ minHeight: '420px' }}>

        {/* Left — role list */}
        <div className="col-span-2 space-y-1.5">
          {(roles || []).map(role => {
            const isActive = activeRole?.id === role.id;
            return (
              <button key={role.id} onClick={() => setActiveRole(role)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-lg text-left transition-all"
                style={{
                  backgroundColor: isActive ? 'var(--brand-subtle)' : 'var(--bg-surface)',
                  border: `1px solid ${isActive ? 'var(--brand)' : 'var(--border-soft)'}`,
                }}>
                <div>
                  <p className="text-sm font-medium"
                    style={{ color: isActive ? 'var(--brand)' : 'var(--text-base)' }}>
                    {role.name}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    {(role.permissions || []).length} permission{(role.permissions || []).length !== 1 ? 's' : ''}
                  </p>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                  style={{ color: isActive ? 'var(--brand)' : 'var(--text-muted)', flexShrink: 0 }}>
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            );
          })}
          {!roles?.length && (
            <p className="text-sm p-4" style={{ color: 'var(--text-muted)' }}>No roles defined yet.</p>
          )}
        </div>

        {/* Right — permissions detail */}
        <div className="col-span-3 card p-5">
          {!activeRole ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12 gap-3">
              <div className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ backgroundColor: 'var(--bg-subtle)' }}>
                <Shield size={22} style={{ color: 'var(--text-muted)' }} />
              </div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-base)' }}>
                Select a role to inspect
              </p>
              <p className="text-xs max-w-xs" style={{ color: 'var(--text-muted)' }}>
                Pick any role on the left to see exactly what its holders can see and do across HMS.
              </p>
            </div>
          ) : (
            <PermissionsPanel role={activeRole} />
          )}
        </div>
      </div>

      <Modal open={showForm} onClose={handleClose} title="New Role" size="lg">
        <CreateRoleForm onSuccess={() => { handleClose(); qc.invalidateQueries(['roles']); }} />
      </Modal>
    </>
  );
}