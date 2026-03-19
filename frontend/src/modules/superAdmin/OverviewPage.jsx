// src/modules/superAdmin/OverviewPage.jsx
import { useQuery }  from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getPlatformStats, getSystemHealth, getPlatformActivity } from '../../lib/api/superAdminApi';
import { formatDateTime } from '../../utils/format';
import {
  StatCard, Card, Badge, BarChart, DonutChart, PageHeader, Spinner,
} from './components';

export default function OverviewPage() {
  const navigate = useNavigate();

  const { data: stats,  isLoading: loadingStats  } = useQuery({
    queryKey: ['sa-stats'],
    queryFn:  () => getPlatformStats().then(r => r.data.data),
    refetchInterval: 30_000,
  });

  const { data: health, isLoading: loadingHealth } = useQuery({
    queryKey: ['sa-health'],
    queryFn:  () => getSystemHealth().then(r => r.data.data),
    refetchInterval: 30_000,
  });

  const { data: activity, isLoading: loadingActivity } = useQuery({
    queryKey: ['sa-activity'],
    queryFn:  () => getPlatformActivity(15).then(r => r.data.data),
    refetchInterval: 20_000,
  });

  if (loadingStats) return <Spinner />;

  const t  = stats?.totals     || {};
  const bp = stats?.by_plan    || {};
  const bs = stats?.by_status  || {};

  // Signup chart — last 30 days, bucket into weeks for readability
  const chartData = (stats?.signup_chart || []).map(d => ({
    label: d.date,
    value: d.count,
  }));

  const planColors = {
    trial:      'var(--s-blue-text)',

  };

  const planSegments = Object.entries(bp).map(([plan, count]) => ({
    label: plan, value: count,
    color: planColors[plan] || 'var(--text-muted)',
  }));

  const statusSegments = [
    { label: 'Active',    value: bs.active    || 0, color: 'var(--s-green-text)' },
    { label: 'Trial',     value: bs.trial     || 0, color: 'var(--s-blue-text)'  },
    { label: 'Suspended', value: bs.suspended || 0, color: 'var(--s-red-text)'   },
    { label: 'Inactive',  value: bs.inactive  || 0, color: 'var(--s-gray-text)'  },
  ].filter(s => s.value > 0);

  const dbOk = health?.database?.status === 'ok';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <PageHeader
        title="Platform Overview"
        subtitle="Live metrics across all customer organizations"
        action={
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 12px', background: dbOk ? 'var(--s-green-bg)' : 'var(--s-red-bg)', borderRadius: 99, fontSize: 11, fontWeight: 600, color: dbOk ? 'var(--s-green-text)' : 'var(--s-red-text)' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor', display: 'inline-block' }} />
            {loadingHealth ? 'Checking…' : dbOk ? 'All Systems Operational' : 'System Issues Detected'}
          </div>
        }
      />

      {/* Primary KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
        <StatCard label="Total Organizations" value={t.organizations} sub="all time" accent />
        <StatCard label="Active Orgs"         value={t.active_orgs}   sub={`${t.trial_orgs || 0} on trial`} />
        <StatCard label="New This Month"      value={t.new_orgs_this_month} delta={`${t.new_orgs_this_week || 0} this week`} deltaDir="up" />
        <StatCard label="Total Users"         value={t.total_users?.toLocaleString()} sub="across all orgs" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
        <StatCard label="Total Rooms"          value={t.total_rooms?.toLocaleString()} sub="all orgs combined" />
        <StatCard label="Active Reservations"  value={t.active_reservations?.toLocaleString()} sub="confirmed + in-house" />
        <StatCard label="Suspended Orgs"       value={t.suspended_orgs} sub={t.suspended_orgs > 0 ? 'requires attention' : 'none'} />
        <StatCard label="DB Latency"           value={health?.database?.latency_ms != null ? `${health.database.latency_ms}ms` : '—'} sub={dbOk ? 'healthy' : 'error'} />
      </div>

      {/* Signup chart + breakdowns */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 14 }}>
        <Card title="Organization Signups — Last 30 Days">
          <BarChart data={chartData} height={110} />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
            {['30d ago', '', '', '', 'Today'].map((l, i) => (
              <span key={i} style={{ fontSize: 10, color: 'var(--text-muted)' }}>{l}</span>
            ))}
          </div>
        </Card>

        <Card title="By Plan">
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
            <DonutChart segments={planSegments} size={100} strokeWidth={16} />
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 5 }}>
              {planSegments.map(s => (
                <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: s.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: 'var(--text-sub)', textTransform: 'capitalize' }}>{s.label}</span>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-base)' }}>{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card title="By Status">
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
            <DonutChart segments={statusSegments} size={100} strokeWidth={16} />
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 5 }}>
              {statusSegments.map(s => (
                <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: s.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: 'var(--text-sub)', textTransform: 'capitalize' }}>{s.label}</span>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-base)' }}>{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Recent signups + Activity feed */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Card
          title="Recent Signups"
          noPad
          action={
            <button onClick={() => navigate('/super-admin/organizations')} style={{ fontSize: 12, color: 'var(--brand)', background: 'none', border: 'none', cursor: 'pointer' }}>
              View all →
            </button>
          }
        >
          {(stats?.recent_signups || []).map((org, i, arr) => (
            <div
              key={org.id}
              onClick={() => navigate(`/super-admin/organizations/${org.id}`)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 16px',
                borderBottom: i < arr.length - 1 ? '1px solid var(--border-soft)' : 'none',
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 30, height: 30, borderRadius: 8,
                  background: 'var(--bg-muted)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 700, color: 'var(--brand)', flexShrink: 0,
                }}>
                  {org.name?.[0]?.toUpperCase() || '?'}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-base)' }}>{org.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{org.slug} · {formatDateTime(org.created_at)}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <Badge status={org.plan}   label={org.plan}   />
                <Badge status={org.status} label={org.status} />
              </div>
            </div>
          ))}
        </Card>

        <Card title="Platform Activity" noPad action={
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--brand)', fontWeight: 600 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--brand)', display: 'inline-block', animation: 'pulse 2s ease-in-out infinite' }} />
            Live
          </div>
        }>
          {loadingActivity ? <Spinner /> : (activity || []).map((ev, i, arr) => (
            <div key={ev.id || i} style={{
              display: 'flex', gap: 10, padding: '8px 16px',
              borderBottom: i < arr.length - 1 ? '1px solid var(--border-soft)' : 'none',
            }}>
              <div style={{
                width: 8, height: 8, borderRadius: '50%', marginTop: 5, flexShrink: 0,
                background: ev.type === 'org_signup' ? 'var(--s-green-text)' : 'var(--brand)',
              }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, color: 'var(--text-sub)', lineHeight: 1.4 }}>
                  <strong style={{ color: 'var(--text-base)', fontWeight: 600 }}>
                    {ev.type === 'org_signup' ? 'New signup' : 'Reservation'}
                  </strong>
                  {' — '}{ev.label}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                  {formatDateTime(ev.created_at)}
                  {ev.meta && <span style={{ marginLeft: 8, padding: '1px 6px', background: 'var(--bg-muted)', borderRadius: 4, fontSize: 10 }}>{ev.meta}</span>}
                </div>
              </div>
            </div>
          ))}
        </Card>
      </div>

      {/* System Health */}
      {health && (
        <Card title="System Health">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            {[
              { label: 'Database', status: health.database?.status, detail: `${health.database?.latency_ms}ms latency` },
              { label: 'API Server', status: health.api?.status, detail: `Uptime ${Math.floor((health.api?.uptime || 0) / 3600)}h` },
              { label: 'Auth Errors (1h)', status: (health.auth_errors_last_hour || 0) > 5 ? 'error' : 'ok', detail: `${health.auth_errors_last_hour || 0} failed logins` },
            ].map(item => (
              <div key={item.label} style={{
                padding: '12px 14px',
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border-soft)',
                borderRadius: 8,
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <div style={{
                  width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
                  background: item.status === 'ok' ? 'var(--s-green-text)' : item.status === 'warning' ? 'var(--s-yellow-text)' : 'var(--s-red-text)',
                }} />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-base)' }}>{item.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{item.detail}</div>
                </div>
                <Badge status={item.status === 'ok' ? 'active' : 'suspended'} label={item.status === 'ok' ? 'Healthy' : 'Issue'} />
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}