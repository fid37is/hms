import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, ChevronDown, ChevronRight } from 'lucide-react';
import * as configApi from '../../../lib/api/userApi';
import LoadingSpinner from '../../../components/shared/LoadingSpinner';
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

function RoleCard({ role, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const perms = role.permissions || [];

  return (
    <div className="card overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between px-4 py-3 text-left transition-colors"
        onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-subtle)'}
        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
      >
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--text-base)' }}>{role.name}</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {perms.length} permission{perms.length !== 1 ? 's' : ''}
          </p>
        </div>
        {expanded
          ? <ChevronDown size={15} style={{ color: 'var(--text-muted)' }} />
          : <ChevronRight size={15} style={{ color: 'var(--text-muted)' }} />
        }
      </button>

      {expanded && (
        <div className="px-4 pb-4 pt-2" style={{ borderTop: '1px solid var(--border-soft)' }}>
          <div className="flex flex-wrap gap-1.5">
            {perms.map(p => (
              <span
                key={p}
                className="badge badge-blue text-xs font-mono"
              >
                {p}
              </span>
            ))}
            {!perms.length && (
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No permissions assigned</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function CreateRoleForm({ onSuccess }) {
  const [name, setName] = useState('');
  const [selectedPerms, setSelectedPerms] = useState([]);

  const save = useMutation({
    mutationFn: (d) => configApi.createRole(d),
    onSuccess: () => { toast.success('Role created'); onSuccess(); },
    onError:   (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const toggle = (perm) => {
    setSelectedPerms(prev =>
      prev.includes(perm) ? prev.filter(p => p !== perm) : [...prev, perm]
    );
  };

  const toggleGroup = (perms) => {
    const allSelected = perms.every(p => selectedPerms.includes(p));
    if (allSelected) {
      setSelectedPerms(prev => prev.filter(p => !perms.includes(p)));
    } else {
      setSelectedPerms(prev => [...new Set([...prev, ...perms])]);
    }
  };

  return (
    <form
      onSubmit={e => {
        e.preventDefault();
        save.mutate({ name, permissions: selectedPerms });
      }}
      className="space-y-5"
    >
      <div className="form-group">
        <label className="label" htmlFor="role-name">Role Name *</label>
        <input
          id="role-name"
          name="role-name"
          className="input max-w-xs"
          required
          placeholder="e.g. Front Desk Manager"
          value={name}
          onChange={e => setName(e.target.value)}
        />
      </div>

      <div>
        <p className="label mb-3">Permissions</p>
        <div className="space-y-3">
          {ALL_PERMISSIONS.map(({ group, perms }) => {
            const allSelected = perms.every(p => selectedPerms.includes(p));
            return (
              <div key={group}>
                <div className="flex items-center gap-2 mb-1.5">
                  <input
                    type="checkbox"
                    id={`group-${group}`}
                    checked={allSelected}
                    onChange={() => toggleGroup(perms)}
                    className="rounded"
                    style={{ accentColor: 'var(--brand)' }}
                  />
                  <label
                    htmlFor={`group-${group}`}
                    className="text-xs font-semibold uppercase tracking-wider cursor-pointer"
                    style={{ color: 'var(--text-sub)' }}
                  >
                    {group}
                  </label>
                </div>
                <div className="flex flex-wrap gap-2 pl-5">
                  {perms.map(p => {
                    const isChecked = selectedPerms.includes(p);
                    const permLabel = p.split(':')[1];
                    return (
                      <label
                        key={p}
                        className="flex items-center gap-1.5 text-xs cursor-pointer"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggle(p)}
                          style={{ accentColor: 'var(--brand)' }}
                        />
                        <span className="capitalize">{permLabel}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <button type="submit" disabled={save.isPending} className="btn-primary">
        {save.isPending ? 'Creating…' : 'Create Role'}
      </button>
    </form>
  );
}

export default function RoleManager() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);

  const { data: roles, isLoading } = useQuery({
    queryKey: ['roles'],
    queryFn:  () => configApi.getRoles().then(r => r.data.data),
  });

  if (isLoading) return <LoadingSpinner center />;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setShowForm(s => !s)} className="btn-primary">
          <Plus size={15} /> {showForm ? 'Cancel' : 'New Role'}
        </button>
      </div>

      {showForm && (
        <div className="card p-5">
          <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-base)' }}>New Role</h3>
          <CreateRoleForm onSuccess={() => { setShowForm(false); qc.invalidateQueries(['roles']); }} />
        </div>
      )}

      <div className="space-y-2">
        {(roles || []).map(role => (
          <RoleCard key={role.id} role={role} />
        ))}
        {!roles?.length && (
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No roles defined</p>
        )}
      </div>
    </div>
  );
}