// src/modules/superAdmin/OrganizationsPage.jsx
import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { listOrganizations, updateOrganization } from '../../lib/api/superAdminApi';
import { formatDateTime } from '../../utils/format';
import { Card, Badge, Table, PageHeader, Spinner } from './components';

const PLANS   = ['', 'trial', 'active'];
const STATUSES = ['', 'active', 'trial', 'suspended', 'inactive'];

export default function OrganizationsPage() {
  const navigate      = useNavigate();
  const queryClient   = useQueryClient();
  const [search,   setSearch]   = useState('');
  const [status,   setStatus]   = useState('');
  const [plan,     setPlan]     = useState('');
  const [page,     setPage]     = useState(1);
  const [editing,  setEditing]  = useState(null); // { org, field }

  const { data, isLoading } = useQuery({
    queryKey: ['sa-orgs', search, status, plan, page],
    queryFn:  () => listOrganizations({ search, status, plan, page, limit: 20 }).then(r => r.data),
    keepPreviousData: true,
  });

  const mutation = useMutation({
    mutationFn: ({ orgId, payload }) => updateOrganization(orgId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries(['sa-orgs']);
      queryClient.invalidateQueries(['sa-stats']);
      toast.success('Organization updated.');
      setEditing(null);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Update failed.'),
  });

  const orgs  = data?.data || [];
  const total = data?.meta?.total || 0;
  const totalPages = data?.meta?.totalPages || 1;

  const handleStatusChange = useCallback((org, newStatus) => {
    if (!window.confirm(`Set "${org.name}" to ${newStatus}?`)) return;
    mutation.mutate({ orgId: org.id, payload: { status: newStatus } });
  }, [mutation]);

  const handlePlanChange = useCallback((org, newPlan) => {
    mutation.mutate({ orgId: org.id, payload: { plan: newPlan } });
  }, [mutation]);

  const inputStyle = {
    padding: '7px 10px',
    background: 'var(--bg-subtle)',
    border: '1px solid var(--border-base)',
    borderRadius: 7,
    color: 'var(--text-base)',
    fontSize: 13,
    outline: 'none',
  };

  const columns = [
    {
      key: 'name', label: 'Organization', bold: true,
      render: org => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 7,
            background: 'var(--bg-muted)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 700, color: 'var(--brand)', flexShrink: 0,
          }}>
            {org.name?.[0]?.toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-base)' }}>{org.name}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{org.slug}{org.custom_domain ? ` · ${org.custom_domain}` : ''}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'plan', label: 'Plan',
      render: org => (
        <select
          value={org.plan}
          onClick={e => e.stopPropagation()}
          onChange={e => handlePlanChange(org, e.target.value)}
          style={{ ...inputStyle, padding: '3px 6px', fontSize: 11, cursor: 'pointer' }}
        >
          {PLANS.filter(Boolean).map(p => (
            <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
          ))}
        </select>
      ),
    },
    {
      key: 'status', label: 'Status',
      render: org => (
        <select
          value={org.status}
          onClick={e => e.stopPropagation()}
          onChange={e => handleStatusChange(org, e.target.value)}
          style={{ ...inputStyle, padding: '3px 6px', fontSize: 11, cursor: 'pointer' }}
        >
          {STATUSES.filter(Boolean).map(s => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
      ),
    },
    { key: '_counts.users',               label: 'Users',        render: org => org._counts?.users ?? '—' },
    { key: '_counts.rooms',               label: 'Rooms',        render: org => org._counts?.rooms ?? '—' },
    { key: '_counts.active_reservations', label: 'Active Res.',  render: org => org._counts?.active_reservations ?? '—' },
    { key: 'created_at', label: 'Signed Up', render: org => formatDateTime(org.created_at) },
    {
      key: 'actions', label: '',
      render: org => (
        <button
          onClick={e => { e.stopPropagation(); navigate(`/super-admin/organizations/${org.id}`); }}
          style={{ fontSize: 12, color: 'var(--brand)', background: 'none', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}
        >
          Details →
        </button>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <PageHeader
        title="Organizations"
        subtitle={`${total} total organizations on the platform`}
      />

      {/* Filters */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <input
          type="search"
          placeholder="Search by name, slug, or domain…"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          style={{ ...inputStyle, width: 260 }}
        />
        <select
          value={status}
          onChange={e => { setStatus(e.target.value); setPage(1); }}
          style={inputStyle}
        >
          {STATUSES.map(s => <option key={s} value={s}>{s ? s.charAt(0).toUpperCase() + s.slice(1) : 'All Statuses'}</option>)}
        </select>
        <select
          value={plan}
          onChange={e => { setPlan(e.target.value); setPage(1); }}
          style={inputStyle}
        >
          {PLANS.map(p => <option key={p} value={p}>{p ? p.charAt(0).toUpperCase() + p.slice(1) : 'All Plans'}</option>)}
        </select>
        {(search || status || plan) && (
          <button
            onClick={() => { setSearch(''); setStatus(''); setPlan(''); setPage(1); }}
            style={{ ...inputStyle, color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            Clear
          </button>
        )}
        <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-muted)' }}>
          {total} result{total !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Table */}
      <Card noPad>
        {isLoading ? <Spinner /> : (
          <Table
            columns={columns}
            rows={orgs}
            emptyText="No organizations match your filters."
          />
        )}
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
          <button
            disabled={page <= 1}
            onClick={() => setPage(p => p - 1)}
            style={{ ...inputStyle, cursor: page <= 1 ? 'not-allowed' : 'pointer', opacity: page <= 1 ? 0.4 : 1 }}
          >
            ← Prev
          </button>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Page {page} of {totalPages}</span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage(p => p + 1)}
            style={{ ...inputStyle, cursor: page >= totalPages ? 'not-allowed' : 'pointer', opacity: page >= totalPages ? 0.4 : 1 }}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}