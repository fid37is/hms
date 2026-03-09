import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import * as reportApi from '../../../lib/api/reportApi';
import LoadingSpinner from '../../../components/shared/LoadingSpinner';
import { formatCurrency, formatDateTime } from '../../../utils/format';

export default function NightAudit() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const { data, isLoading, isError } = useQuery({
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

  const GuestRow = ({ r }) => (
    <div className="flex justify-between items-center text-sm py-1.5"
      style={{ borderBottom: '1px solid var(--border-soft)' }}>
      <span style={{ color: 'var(--text-base)' }}>{r.guests?.full_name || '—'}</span>
      <div className="flex items-center gap-4">
        {r.rate_per_night && (
          <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
            {formatCurrency(r.rate_per_night)}/night
          </span>
        )}
        <span style={{ color: 'var(--text-muted)' }}>Room {r.rooms?.number || '—'}</span>
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="form-group" style={{ maxWidth: '200px' }}>
        <label className="label">Audit Date</label>
        <input type="date" className="input" value={date}
          onChange={e => setDate(e.target.value)} />
      </div>

      {isLoading && <LoadingSpinner center />}

      {isError && (
        <div className="rounded-lg px-4 py-3 text-sm"
          style={{ backgroundColor: 'var(--s-red-bg)', color: 'var(--s-red-text)' }}>
          Failed to load night audit
        </div>
      )}

      {!isLoading && data && (
        <>
          {/* Summary stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Arrivals',      value: data.totals?.arrivals   || 0 },
              { label: 'Departures',    value: data.totals?.departures  || 0 },
              { label: 'In House',      value: data.totals?.in_house    || 0 },
              { label: 'Revenue',       value: formatCurrency(data.totals?.charges || 0) },
            ].map(({ label, value }) => (
              <div key={label} className="stat-card">
                <p className="stat-label">{label}</p>
                <p className="stat-value">{value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Arrivals */}
            <Section title={`Arrivals (${data.totals?.arrivals || 0})`}>
              {(data.arrivals || []).length
                ? data.arrivals.map(r => <GuestRow key={r.id} r={r} />)
                : <p className="text-sm" style={{ color: 'var(--text-muted)' }}>None</p>}
            </Section>

            {/* Departures */}
            <Section title={`Departures (${data.totals?.departures || 0})`}>
              {(data.departures || []).length
                ? data.departures.map(r => <GuestRow key={r.id} r={r} />)
                : <p className="text-sm" style={{ color: 'var(--text-muted)' }}>None</p>}
            </Section>
          </div>

          {/* In house */}
          <Section title={`In House (${data.totals?.in_house || 0})`}>
            {(data.in_house || []).length ? (
              <div className="grid grid-cols-2 gap-x-6">
                {data.in_house.map(r => <GuestRow key={r.id} r={r} />)}
              </div>
            ) : <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No guests in house</p>}
          </Section>

          <div className="grid grid-cols-2 gap-4">
            {/* Payments collected */}
            <Section title="Payments Collected">
              <div className="space-y-1">
                {(data.payments || []).length ? data.payments.map(p => (
                  <div key={p.id} className="flex justify-between items-center text-sm py-1.5"
                    style={{ borderBottom: '1px solid var(--border-soft)' }}>
                    <div>
                      <span className="font-mono text-xs" style={{ color: 'var(--brand)' }}>{p.payment_no}</span>
                      <span className="ml-3 capitalize" style={{ color: 'var(--text-muted)' }}>
                        {p.method?.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <span className="font-medium font-mono" style={{ color: 'var(--s-green-text)' }}>
                      {formatCurrency(p.amount)}
                    </span>
                  </div>
                )) : <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No payments</p>}
                {(data.payments || []).length > 0 && (
                  <div className="flex justify-between font-semibold text-sm pt-2">
                    <span style={{ color: 'var(--text-base)' }}>Total Collected</span>
                    <span style={{ color: 'var(--s-green-text)' }}>{formatCurrency(data.totals?.payments || 0)}</span>
                  </div>
                )}
              </div>
            </Section>

            {/* Revenue by department */}
            <Section title="Revenue by Department">
              <div className="space-y-1">
                {(data.by_department || []).length ? data.by_department.map(d => (
                  <div key={d.department} className="flex justify-between items-center text-sm py-1.5"
                    style={{ borderBottom: '1px solid var(--border-soft)' }}>
                    <span className="capitalize" style={{ color: 'var(--text-sub)' }}>{d.department}</span>
                    <span className="font-medium font-mono" style={{ color: 'var(--text-base)' }}>
                      {formatCurrency(d.total)}
                    </span>
                  </div>
                )) : <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No charges posted</p>}
                {(data.by_department || []).length > 0 && (
                  <div className="flex justify-between font-semibold text-sm pt-2">
                    <span style={{ color: 'var(--text-base)' }}>Total Billed</span>
                    <span style={{ color: 'var(--text-base)' }}>{formatCurrency(data.totals?.charges || 0)}</span>
                  </div>
                )}
              </div>
            </Section>
          </div>
        </>
      )}
    </div>
  );
}