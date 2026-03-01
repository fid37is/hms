// Settings → Users
// Shows all system login accounts. These are staff members who have been
// granted HMS access. User accounts are created FROM the Staff module —
// this view is for managing existing accounts only.

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, ShieldOff, ExternalLink } from 'lucide-react';
import * as userApi   from '../../../lib/api/userApi';
import DataTable      from '../../../components/shared/DataTable';
import StatusBadge    from '../../../components/shared/StatusBadge';
import { formatDate } from '../../../utils/format';
import toast from 'react-hot-toast';

export default function UserManagement() {
  const qc       = useQueryClient();
  const navigate = useNavigate();

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn:  () => userApi.getUsers().then(r => r.data.data),
  });

  const toggle = useMutation({
    mutationFn: (u) => userApi.toggleUser(u.id, { is_active: !u.is_active }),
    onSuccess:  () => { toast.success('Account updated'); qc.invalidateQueries(['users']); },
    onError:    (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const columns = [
    { key: 'full_name', label: 'Name',
      render: r => (
        <div className="flex items-center gap-3">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold uppercase flex-shrink-0"
            style={{ backgroundColor: 'var(--brand-subtle)', color: 'var(--brand)' }}
          >
            {r.full_name?.charAt(0)}
          </div>
          <div>
            <p className="text-sm font-medium" style={{ color: 'var(--text-base)' }}>{r.full_name}</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{r.email}</p>
          </div>
        </div>
      )
    },
    { key: 'role',       label: 'Role',       render: r => r.roles?.name || '—' },
    { key: 'department', label: 'Department',  render: r => r.department || '—' },
    { key: 'last_login', label: 'Last Login',  render: r => r.last_login ? formatDate(r.last_login) : 'Never' },
    { key: 'status',     label: 'Status',
      render: r => <StatusBadge status={r.is_active ? 'active' : 'inactive'} />
    },
    { key: 'actions', label: '', width: '180px',
      render: r => (
        <div className="flex gap-1.5 justify-end">
          <button
            onClick={e => { e.stopPropagation(); navigate('/staff'); }}
            className="btn-ghost text-xs px-2 py-1 gap-1"
            title="View staff record"
          >
            <ExternalLink size={12} /> Staff
          </button>
          <button
            onClick={e => { e.stopPropagation(); toggle.mutate(r); }}
            className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-md transition-colors"
            style={{
              backgroundColor: r.is_active ? 'var(--s-red-bg)'    : 'var(--s-green-bg)',
              color:           r.is_active ? 'var(--s-red-text)'   : 'var(--s-green-text)',
            }}
          >
            {r.is_active
              ? <><ShieldOff size={12} /> Disable</>
              : <><ShieldCheck size={12} /> Enable</>
            }
          </button>
        </div>
      )
    },
  ];

  return (
    <div className="space-y-4 max-w-4xl">
      {/* Explanatory banner */}
      <div
        className="rounded-lg px-4 py-3 text-sm"
        style={{ backgroundColor: 'var(--brand-subtle)', color: 'var(--brand)' }}
      >
        <p className="font-medium mb-0.5">System accounts are managed from the Staff module</p>
        <p className="text-xs opacity-80">
          To grant a staff member access to HMS, open their profile in Staff → Grant System Access.
          This view lets you enable, disable, or review existing accounts.
        </p>
      </div>

      <div className="card overflow-hidden">
        <DataTable
          columns={columns}
          data={users || []}
          loading={isLoading}
          emptyTitle="No system users yet"
          emptySubtitle="Go to Staff → open a staff profile → Grant System Access"
        />
      </div>
    </div>
  );
}
