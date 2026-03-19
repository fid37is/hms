// src/modules/superAdmin/ActivityPage.jsx
import { useQuery } from '@tanstack/react-query';
import { getPlatformActivity } from '../../lib/api/superAdminApi';
import { formatDateTime } from '../../utils/format';
import { Card, PageHeader, Spinner } from './components';

const TYPE_META = {
  org_signup:   { label: 'New Signup',   color: 'var(--s-green-text)' },
  reservation:  { label: 'Reservation',  color: 'var(--brand)'        },
};

export default function ActivityPage() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['sa-activity-full'],
    queryFn:  () => getPlatformActivity(50).then(r => r.data.data),
    refetchInterval: 15_000,
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <PageHeader
        title="Platform Activity"
        subtitle="Cross-organization events — updates every 15 seconds"
        action={
          <button
            onClick={() => refetch()}
            style={{ padding: '6px 12px', background: 'var(--bg-subtle)', border: '1px solid var(--border-base)', borderRadius: 7, color: 'var(--text-sub)', fontSize: 12, cursor: 'pointer' }}
          >
            Refresh
          </button>
        }
      />

      <Card noPad>
        {isLoading ? <Spinner /> : (data || []).length === 0 ? (
          <p style={{ padding: '24px 16px', fontSize: 13, color: 'var(--text-muted)', textAlign: 'center' }}>No activity yet.</p>
        ) : (data || []).map((ev, i, arr) => {
          const meta = TYPE_META[ev.type] || { label: ev.type, color: 'var(--text-muted)' };
          return (
            <div key={ev.id || i} style={{
              display: 'flex', alignItems: 'flex-start', gap: 14,
              padding: '12px 16px',
              borderBottom: i < arr.length - 1 ? '1px solid var(--border-soft)' : 'none',
            }}>
              {/* Timeline dot */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 3 }}>
                <div style={{ width: 9, height: 9, borderRadius: '50%', background: meta.color, flexShrink: 0 }} />
                {i < arr.length - 1 && <div style={{ width: 1, flex: 1, background: 'var(--border-soft)', marginTop: 4 }} />}
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                  <span style={{
                    fontSize: 10, fontWeight: 600, textTransform: 'uppercase',
                    letterSpacing: '.5px', color: meta.color,
                  }}>
                    {meta.label}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {formatDateTime(ev.created_at)}
                  </span>
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-base)', fontWeight: 500 }}>
                  {ev.label}
                </div>
                {ev.meta && (
                  <span style={{
                    display: 'inline-block', marginTop: 4,
                    padding: '2px 7px', background: 'var(--bg-muted)',
                    borderRadius: 4, fontSize: 11, color: 'var(--text-muted)',
                    textTransform: 'capitalize',
                  }}>
                    {ev.meta}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </Card>
    </div>
  );
}