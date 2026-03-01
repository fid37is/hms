import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import * as reportApi from '../../../lib/api/reportApi';
import DataTable      from '../../../components/shared/DataTable';
import { formatDateTime } from '../../../utils/format';

export default function AuditLog() {
  const [filters, setFilters] = useState({ table_name: '', action: '', page: 1 });

  const { data, isLoading } = useQuery({
    queryKey: ['audit-log', filters],
    queryFn:  () => reportApi.getAuditLog(filters).then(r => r.data),
  });

  const set = (k, v) => setFilters(f => ({ ...f, [k]: v, page: 1 }));

  const columns = [
    { key: 'created_at', label: 'Time', render: r => (
      <span className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>{formatDateTime(r.created_at)}</span>
    )},
    { key: 'action',     label: 'Action',
      render: r => {
        const colors = { CREATE: 'var(--s-green-text)', UPDATE: 'var(--brand)', DELETE: 'var(--s-red-text)' };
        return <span className="font-mono text-xs font-medium" style={{ color: colors[r.action] || 'var(--text-muted)' }}>{r.action}</span>;
      }
    },
    { key: 'table_name', label: 'Table',
      render: r => <span className="font-mono text-xs" style={{ color: 'var(--text-sub)' }}>{r.table_name}</span> },
    { key: 'user',       label: 'User',   render: r => r.users?.full_name || '—' },
    { key: 'ip_address', label: 'IP',     render: r => (
      <span className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>{r.ip_address || '—'}</span>
    )},
  ];

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <div className="form-group">
          <label className="label">Table</label>
          <input className="input w-40 text-xs" placeholder="e.g. reservations"
            value={filters.table_name} onChange={e => set('table_name', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="label">Action</label>
          <select className="input w-36" value={filters.action} onChange={e => set('action', e.target.value)}>
            <option value="">All</option>
            {['CREATE','UPDATE','DELETE','LOGIN','LOGOUT'].map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="card overflow-hidden">
        <DataTable columns={columns} data={data?.data || []} loading={isLoading} emptyTitle="No audit logs" />
      </div>

      {data?.meta && data.meta.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm" style={{ color: 'var(--text-muted)' }}>
          <span>Page {data.meta.page} of {data.meta.totalPages}</span>
          <div className="flex gap-2">
            <button disabled={!data.meta.hasPrev}
              onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))} className="btn-secondary text-xs px-3">
              Previous
            </button>
            <button disabled={!data.meta.hasNext}
              onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))} className="btn-secondary text-xs px-3">
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
