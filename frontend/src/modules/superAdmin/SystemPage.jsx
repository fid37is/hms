// src/modules/superAdmin/SystemPage.jsx
import { useQuery } from '@tanstack/react-query';
import { getSystemHealth, getPlatformStats } from '../../lib/api/superAdminApi';
import { formatDateTime } from '../../utils/format';
import { Card, Badge, StatCard, PageHeader, Spinner } from './components';

function HealthRow({ label, status, detail, extra }) {
  const isOk      = status === 'ok';
  const isWarning = status === 'warning';
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14,
      padding: '14px 16px',
      borderBottom: '1px solid var(--border-soft)',
    }}>
      <div style={{
        width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
        background: isOk ? 'var(--s-green-text)' : isWarning ? 'var(--s-yellow-text)' : 'var(--s-red-text)',
      }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-base)' }}>{label}</div>
        {detail && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{detail}</div>}
      </div>
      {extra && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{extra}</div>}
      <Badge
        status={isOk ? 'active' : isWarning ? 'trial' : 'suspended'}
        label={isOk ? 'Healthy' : isWarning ? 'Warning' : 'Error'}
      />
    </div>
  );
}

export default function SystemPage() {
  const { data: health, isLoading: loadingHealth, refetch, dataUpdatedAt } = useQuery({
    queryKey: ['sa-health'],
    queryFn:  () => getSystemHealth().then(r => r.data.data),
    refetchInterval: 30_000,
  });

  const { data: stats } = useQuery({
    queryKey: ['sa-stats'],
    queryFn:  () => getPlatformStats().then(r => r.data.data),
  });

  const dbOk       = health?.database?.status === 'ok';
  const apiOk      = health?.api?.status === 'ok';
  const authErrors = health?.logins_last_hour || 0;
  const authStatus = authErrors > 10 ? 'error' : authErrors > 3 ? 'warning' : 'ok';

  const uptimeSec  = health?.api?.uptime || 0;
  const uptimeStr  = uptimeSec < 3600
    ? `${Math.floor(uptimeSec / 60)}m`
    : `${Math.floor(uptimeSec / 3600)}h ${Math.floor((uptimeSec % 3600) / 60)}m`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <PageHeader
        title="System Health"
        subtitle="Infrastructure and platform status"
        action={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {dataUpdatedAt && (
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                Last checked {formatDateTime(dataUpdatedAt)}
              </span>
            )}
            <button
              onClick={() => refetch()}
              style={{ padding: '6px 12px', background: 'var(--bg-subtle)', border: '1px solid var(--border-base)', borderRadius: 7, color: 'var(--text-sub)', fontSize: 12, cursor: 'pointer' }}
            >
              Refresh
            </button>
          </div>
        }
      />

      {/* Overall status banner */}
      {!loadingHealth && (
        <div style={{
          padding: '12px 16px',
          background: (dbOk && apiOk && authStatus === 'ok') ? 'var(--s-green-bg)' : 'var(--s-yellow-bg)',
          border: `1px solid ${(dbOk && apiOk && authStatus === 'ok') ? 'rgba(74,222,128,.2)' : 'rgba(252,211,77,.2)'}`,
          borderRadius: 9,
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <div style={{
            width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
            background: (dbOk && apiOk && authStatus === 'ok') ? 'var(--s-green-text)' : 'var(--s-yellow-text)',
          }} />
          <span style={{
            fontSize: 13, fontWeight: 600,
            color: (dbOk && apiOk && authStatus === 'ok') ? 'var(--s-green-text)' : 'var(--s-yellow-text)',
          }}>
            {(dbOk && apiOk && authStatus === 'ok')
              ? 'All systems operational'
              : 'Some systems need attention'}
          </span>
        </div>
      )}

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
        <StatCard label="API Server"   value={apiOk ? 'Online' : 'Degraded'} accent={apiOk} />
        <StatCard label="DB Latency"   value={health?.database?.latency_ms != null ? `${health.database.latency_ms}ms` : '—'} sub={dbOk ? 'healthy' : 'error'} />
        <StatCard label="API Uptime"   value={uptimeStr} sub="since last restart" />
        <StatCard label="Auth Errors"  value={authErrors} sub="last 60 minutes" />
      </div>

      {/* Service checks */}
      <Card title="Service Status" noPad>
        {loadingHealth ? <Spinner /> : (
          <>
            <HealthRow
              label="Database (Supabase Postgres)"
              status={health?.database?.status}
              detail="Primary data store — all tenant data"
              extra={`${health?.database?.latency_ms ?? '?'}ms`}
            />
            <HealthRow
              label="API Server"
              status={health?.api?.status}
              detail="Express.js backend — all tenant requests"
              extra={`Uptime ${uptimeStr}`}
            />
            <HealthRow
              label="Authentication Service"
              status={authStatus}
              detail="Supabase Auth — login and session management"
              extra={`${authErrors} failed login${authErrors !== 1 ? 's' : ''} (1h)`}
            />
          </>
        )}
      </Card>

      {/* Platform numbers */}
      {stats && (
        <Card title="Platform Totals">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            {[
              ['Organizations',   stats.totals?.organizations],
              ['Active Orgs',     stats.totals?.active_orgs],
              ['Trial Orgs',      stats.totals?.trial_orgs],
              ['Suspended Orgs',  stats.totals?.suspended_orgs],
              ['Total Users',     stats.totals?.total_users],
              ['Total Rooms',     stats.totals?.total_rooms],
              ['Active Reservations', stats.totals?.active_reservations],
              ['New Orgs (Month)', stats.totals?.new_orgs_this_month],
              ['New Orgs (Week)',  stats.totals?.new_orgs_this_week],
            ].map(([label, value]) => (
              <div key={label} style={{ padding: '10px 12px', background: 'var(--bg-subtle)', borderRadius: 7 }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3 }}>{label}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-base)' }}>{value ?? '—'}</div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}