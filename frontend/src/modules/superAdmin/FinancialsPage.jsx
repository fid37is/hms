// src/modules/superAdmin/FinancialsPage.jsx
//
// Shows YOUR revenue from subscription payments — not hotel revenue.
// MRR, ARR, active subscribers, payment history, monthly chart.

import { useQuery }    from '@tanstack/react-query';
import { getPlatformFinancials } from '../../lib/api/superAdminApi';
import { StatCard, Card, Badge, Table, BarChart, PageHeader, Spinner } from './components';

// Format kobo → ₦
const fmt = (cents) => {
  if (cents == null) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', minimumFractionDigits: 0,
  }).format(cents / 100);
};

export default function FinancialsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['sa-financials'],
    queryFn:  () => getPlatformFinancials().then(r => r.data.data),
    refetchInterval: 60_000,
  });

  if (isLoading) return <Spinner />;

  const s  = data?.summary        || {};
  const chart = data?.revenue_chart  || [];
  const payments = data?.recent_payments || [];

  const mrrGrowthDir = s.mrr_growth != null
    ? (parseFloat(s.mrr_growth) >= 0 ? 'up' : 'down')
    : null;

  const paymentColumns = [
    {
      key: 'org', label: 'Organization', bold: true,
      render: p => (
        <div>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-base)' }}>
            {p.organizations?.name || '—'}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            {p.organizations?.slug}
          </div>
        </div>
      ),
    },
    {
      key: 'amount', label: 'Amount',
      render: p => (
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--s-green-text)' }}>
          {fmt(p.amount)}
        </span>
      ),
    },
    {
      key: 'status', label: 'Status',
      render: p => <Badge status={p.status === 'success' ? 'active' : 'suspended'} label={p.status} />,
    },
    {
      key: 'paid_at', label: 'Date',
      render: p => new Date(p.paid_at).toLocaleDateString('en-NG', {
        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
      }),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <PageHeader
        title="Platform Revenue"
        subtitle="Subscription payments received from your customers"
      />

      {/* Primary metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
        <StatCard
          label="MRR"
          value={fmt(s.mrr)}
          delta={s.mrr_growth != null ? `${Math.abs(s.mrr_growth)}%` : null}
          deltaDir={mrrGrowthDir}
          sub="this month"
          accent
        />
        <StatCard
          label="ARR (Projected)"
          value={fmt(s.arr)}
          sub={`${s.active_paying || 0} active subscribers`}
        />
        <StatCard
          label="Total Revenue"
          value={fmt(s.total_revenue)}
          sub="all time"
        />
        <StatCard
          label="Last Month"
          value={fmt(s.last_month_rev)}
          sub="subscription revenue"
        />
      </div>

      {/* Subscriber health */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
        <StatCard label="Active Subscribers" value={s.active_paying}   sub="paying customers" />
        <StatCard label="On Trial"           value={s.on_trial}        sub="14-day free trial" />
        <StatCard label="Cancelled"          value={s.cancelled}       sub="churned" />
        <StatCard label="Trial → Paid"       value={s.conversion_rate} sub="conversion rate" accent />
      </div>

      {/* Revenue chart */}
      <Card title="Monthly Revenue — Last 12 Months">
        <BarChart
          data={chart.map(m => ({ label: m.label, value: m.value }))}
          height={130}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
          {chart.filter((_, i) => i % 3 === 0 || i === chart.length - 1).map(m => (
            <span key={m.label} style={{ fontSize: 10, color: 'var(--text-muted)' }}>
              {m.label}
            </span>
          ))}
        </div>
        <div style={{ marginTop: 12, display: 'flex', gap: 20 }}>
          {chart.slice(-3).map(m => (
            <div key={m.label} style={{
              padding: '8px 12px',
              background: 'var(--bg-subtle)',
              borderRadius: 7,
              display: 'flex', flexDirection: 'column', gap: 2,
            }}>
              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{m.label}</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-base)' }}>{fmt(m.value)}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Recent payments */}
      <Card title="Recent Payments" noPad>
        {payments.length === 0 ? (
          <div style={{ padding: '24px 16px', textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
            No payments yet. Payments will appear here once organizations subscribe.
          </div>
        ) : (
          <Table
            columns={paymentColumns}
            rows={payments}
            emptyText="No payments yet."
          />
        )}
      </Card>

      {/* If no payments at all, show a helpful note */}
      {s.total_revenue === 0 && (
        <div style={{
          padding: '16px 20px',
          background: 'var(--s-blue-bg)',
          border: '1px solid rgba(253,186,116,.2)',
          borderRadius: 9,
          fontSize: 13,
          color: 'var(--s-blue-text)',
          lineHeight: 1.6,
        }}>
          <strong>No payments recorded yet.</strong> Once organizations subscribe via Dodo Payments,
          payments will automatically appear here. Make sure your Dodo webhook is configured
          to point to: <code style={{ fontFamily: 'monospace', fontSize: 12 }}>/api/v1/subscriptions/webhook/dodo</code>
        </div>
      )}
    </div>
  );
}