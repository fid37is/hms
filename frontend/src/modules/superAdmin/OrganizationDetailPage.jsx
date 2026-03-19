// src/modules/superAdmin/OrganizationDetailPage.jsx
import { useState }                          from 'react';
import { useParams, useNavigate }            from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast                                  from 'react-hot-toast';
import { getOrganization, updateOrganization } from '../../lib/api/superAdminApi';
import { formatCurrency, formatDateTime }      from '../../utils/format';
import { Card, Badge, StatCard, Table, PageHeader, Spinner } from './components';

const PLANS    = ['trial', 'active'];
const STATUSES = ['active', 'suspended', 'inactive'];

export default function OrganizationDetailPage() {
  const { orgId }     = useParams();
  const navigate      = useNavigate();
  const queryClient   = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [form,    setForm]    = useState({});

  const { data, isLoading } = useQuery({
    queryKey: ['sa-org', orgId],
    queryFn:  () => getOrganization(orgId).then(r => r.data.data),
    onSuccess: (d) => setForm({
      status:        d.organization.status,
      plan:          d.organization.plan,
      notes:         d.organization.notes || '',
      trial_ends_at: d.organization.trial_ends_at ? d.organization.trial_ends_at.split('T')[0] : '',
    }),
  });

  const mutation = useMutation({
    mutationFn: (payload) => updateOrganization(orgId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries(['sa-org', orgId]);
      queryClient.invalidateQueries(['sa-orgs']);
      queryClient.invalidateQueries(['sa-stats']);
      toast.success('Organization updated.');
      setEditing(false);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Update failed.'),
  });

  if (isLoading) return <Spinner />;
  if (!data) return <p style={{ color: 'var(--text-muted)', padding: 20 }}>Organization not found.</p>;

  const { organization: org, hotel_config: config, stats, recent_reservations, users } = data;

  const inputStyle = {
    padding: '7px 10px',
    background: 'var(--bg-subtle)',
    border: '1px solid var(--border-base)',
    borderRadius: 7,
    color: 'var(--text-base)',
    fontSize: 13,
    outline: 'none',
    width: '100%',
  };

  const roomStatusRows = Object.entries(stats?.room_breakdown || {}).map(([status, count]) => ({ status, count }));

  const userColumns = [
    { key: 'full_name', label: 'Name',      bold: true },
    { key: 'email',     label: 'Email',     render: u => <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{u.email}</span> },
    { key: 'is_active', label: 'Status',    render: u => <Badge status={u.is_active ? 'active' : 'inactive'} label={u.is_active ? 'Active' : 'Inactive'} /> },
    { key: 'last_login', label: 'Last Login', render: u => formatDateTime(u.last_login) },
    { key: 'created_at', label: 'Created',    render: u => formatDateTime(u.created_at) },
  ];

  const resColumns = [
    { key: 'reservation_no', label: 'Ref',    render: r => <span style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--brand)' }}>{r.reservation_no}</span> },
    { key: 'guest',   label: 'Guest',         render: r => r.guests?.full_name || '—' },
    { key: 'status',  label: 'Status',        render: r => <Badge status={r.status} label={r.status?.replace(/_/g, ' ')} /> },
    { key: 'check_in_date',  label: 'Check-in' },
    { key: 'check_out_date', label: 'Check-out' },
    { key: 'created_at', label: 'Created',    render: r => formatDateTime(r.created_at) },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <PageHeader
        title={config?.hotel_name || org.name}
        subtitle={`${org.slug}.cierlo.io${org.custom_domain ? ' · ' + org.custom_domain : ''}`}
        action={
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => navigate('/super-admin/organizations')}
              style={{ padding: '7px 14px', background: 'var(--bg-subtle)', border: '1px solid var(--border-base)', borderRadius: 7, color: 'var(--text-sub)', fontSize: 13, cursor: 'pointer' }}
            >
              ← Back
            </button>
            <button
              onClick={() => setEditing(!editing)}
              style={{ padding: '7px 14px', background: editing ? 'var(--bg-muted)' : 'var(--brand)', border: 'none', borderRadius: 7, color: editing ? 'var(--text-sub)' : '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
            >
              {editing ? 'Cancel' : 'Edit'}
            </button>
          </div>
        }
      />

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
        <StatCard label="Total Users"        value={stats?.total_users}        />
        <StatCard label="Total Rooms"        value={stats?.total_rooms}        />
        <StatCard label="Reservations"       value={stats?.total_reservations} />
        <StatCard label="Occupancy"          value={stats?.occupancy_rate}     accent />

      </div>

      {/* Org info + Edit panel */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Card title="Organization Info">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              ['Name',         org.name],
              ['Slug',         org.slug],
              ['Custom Domain',org.custom_domain || '—'],
              ['Country',      config?.country || '—'],
              ['City',         config?.city    || '—'],
              ['Currency',     config?.currency || '—'],
              ['Timezone',     config?.timezone || '—'],
              ['Check-in',     config?.check_in_time  || '—'],
              ['Check-out',    config?.check_out_time || '—'],
              ['Signed Up',    formatDateTime(org.created_at)],
            ].map(([label, val]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', flexShrink: 0 }}>{label}</span>
                <span style={{ fontSize: 12, color: 'var(--text-base)', fontWeight: 500, textAlign: 'right', wordBreak: 'break-all' }}>{val}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card title={editing ? 'Edit Subscription & Status' : 'Subscription & Status'}>
          {editing ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Status</label>
                <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} style={inputStyle}>
                  {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Plan</label>
                <select value={form.plan} onChange={e => setForm(f => ({ ...f, plan: e.target.value }))} style={inputStyle}>
                  {PLANS.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Trial Ends</label>
                <input type="date" value={form.trial_ends_at} onChange={e => setForm(f => ({ ...f, trial_ends_at: e.target.value }))} style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Internal Notes</label>
                <textarea
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  rows={3}
                  placeholder="Notes visible only to platform admins…"
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
              </div>
              <button
                disabled={mutation.isLoading}
                onClick={() => mutation.mutate(form)}
                style={{ padding: '9px', background: 'var(--brand)', border: 'none', borderRadius: 7, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
              >
                {mutation.isLoading ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                ['Status',    <Badge status={org.status} label={org.status} />],
                ['Plan',      <Badge status={org.plan}   label={org.plan}   />],
                ['Trial Ends', org.trial_ends_at ? formatDateTime(org.trial_ends_at) : '—'],
                ['Suspended At', org.suspended_at ? formatDateTime(org.suspended_at) : '—'],
              ].map(([label, val]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{label}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-base)', fontWeight: 500 }}>{val}</span>
                </div>
              ))}
              {org.notes && (
                <div style={{ marginTop: 8, padding: '10px 12px', background: 'var(--bg-subtle)', borderRadius: 7, fontSize: 12, color: 'var(--text-sub)', borderLeft: '3px solid var(--brand)' }}>
                  {org.notes}
                </div>
              )}

              {/* Room breakdown */}
              {roomStatusRows.length > 0 && (
                <>
                  <div style={{ marginTop: 8, fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.5px' }}>Room Breakdown</div>
                  {roomStatusRows.map(({ status, count }) => (
                    <div key={status} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 12, width: 90, color: 'var(--text-sub)', textTransform: 'capitalize' }}>{status.replace(/_/g, ' ')}</span>
                      <div style={{ flex: 1, height: 5, background: 'var(--bg-muted)', borderRadius: 99, overflow: 'hidden' }}>
                        <div style={{ height: '100%', borderRadius: 99, background: 'var(--brand)', width: `${stats?.total_rooms ? (count / stats.total_rooms) * 100 : 0}%` }} />
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-base)', width: 20, textAlign: 'right' }}>{count}</span>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </Card>
      </div>

      {/* Users */}
      <Card title={`Staff Users (${users?.length || 0})`} noPad>
        <Table columns={userColumns} rows={users || []} emptyText="No users found for this organization." />
      </Card>

      {/* Recent Reservations */}
      <Card title="Recent Reservations" noPad>
        <Table columns={resColumns} rows={recent_reservations || []} emptyText="No reservations found." />
      </Card>
    </div>
  );
}