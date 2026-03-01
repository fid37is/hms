import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import * as reportApi from '../../../lib/api/reportApi';
import LoadingSpinner from '../../../components/shared/LoadingSpinner';
import StatusBadge    from '../../../components/shared/StatusBadge';
import { formatCurrency, formatDateTime } from '../../../utils/format';

export default function NightAudit() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const { data, isLoading } = useQuery({
    queryKey: ['night-audit', date],
    queryFn:  () => reportApi.getNightAudit({ date }).then(r => r.data.data),
  });

  const Section = ({ title, children }) => (
    <div className="card overflow-hidden">
      <div className="card-header">
        <span className="text-sm font-semibold" style={{ color: 'var(--text-base)' }}>{title}</span>
      </div>
      <div className="card-body">{children}</div>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="form-group" style={{ maxWidth: '200px' }}>
        <label className="label">Audit Date</label>
        <input type="date" className="input" value={date}
          onChange={e => setDate(e.target.value)} />
      </div>

      {isLoading ? <LoadingSpinner center /> : data && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Arrivals',     value: data.arrivals?.length     || 0 },
              { label: 'Departures',   value: data.departures?.length   || 0 },
              { label: 'In House',     value: data.in_house?.length     || 0 },
              { label: 'Total Revenue',value: formatCurrency(data.totals?.payments || 0) },
            ].map(({ label, value }) => (
              <div key={label} className="stat-card">
                <p className="stat-label">{label}</p>
                <p className="stat-value">{value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Section title={`Arrivals (${data.arrivals?.length || 0})`}>
              {(data.arrivals || []).map(r => (
                <div key={r.id} className="flex justify-between text-sm py-1.5"
                  style={{ borderBottom: '1px solid var(--border-soft)' }}>
                  <span style={{ color: 'var(--text-base)' }}>{r.guests?.full_name}</span>
                  <span style={{ color: 'var(--text-muted)' }}>Room {r.rooms?.number || '—'}</span>
                </div>
              ))}
              {!data.arrivals?.length && <p className="text-sm" style={{ color: 'var(--text-muted)' }}>None</p>}
            </Section>

            <Section title={`Departures (${data.departures?.length || 0})`}>
              {(data.departures || []).map(r => (
                <div key={r.id} className="flex justify-between text-sm py-1.5"
                  style={{ borderBottom: '1px solid var(--border-soft)' }}>
                  <span style={{ color: 'var(--text-base)' }}>{r.guests?.full_name}</span>
                  <span style={{ color: 'var(--text-muted)' }}>Room {r.rooms?.number || '—'}</span>
                </div>
              ))}
              {!data.departures?.length && <p className="text-sm" style={{ color: 'var(--text-muted)' }}>None</p>}
            </Section>
          </div>

          <Section title="Payments">
            <div className="space-y-2">
              {(data.payments || []).map(p => (
                <div key={p.id} className="flex justify-between items-center text-sm py-1.5"
                  style={{ borderBottom: '1px solid var(--border-soft)' }}>
                  <div>
                    <span className="font-mono text-xs" style={{ color: 'var(--brand)' }}>{p.payment_no}</span>
                    <span className="ml-3 capitalize" style={{ color: 'var(--text-muted)' }}>
                      {p.method?.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <span className="font-medium" style={{ color: 'var(--s-green-text)' }}>
                    {formatCurrency(p.amount)}
                  </span>
                </div>
              ))}
              {!data.payments?.length && <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No payments</p>}
              {data.payments?.length > 0 && (
                <div className="flex justify-between font-semibold text-sm pt-2">
                  <span style={{ color: 'var(--text-base)' }}>Total</span>
                  <span style={{ color: 'var(--s-green-text)' }}>{formatCurrency(data.totals?.payments || 0)}</span>
                </div>
              )}
            </div>
          </Section>
        </>
      )}
    </div>
  );
}
