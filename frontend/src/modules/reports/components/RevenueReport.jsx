import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import * as reportApi from '../../../lib/api/reportApi';
import LoadingSpinner from '../../../components/shared/LoadingSpinner';
import { formatCurrency } from '../../../utils/format';

function today()      { return new Date().toISOString().split('T')[0]; }
function monthStart() { const d = new Date(); d.setDate(1); return d.toISOString().split('T')[0]; }

export default function RevenueReport() {
  const [from, setFrom] = useState(monthStart);
  const [to,   setTo]   = useState(today);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['report-revenue', from, to],
    queryFn:  () => reportApi.getRevenue({ date_from: from, date_to: to }).then(r => r.data.data),
    enabled:  !!(from && to),
    retry: 1,
  });

  return (
    <div className="space-y-5">
      {/* Date range controls — always visible */}
      <div className="flex items-end gap-4">
        <div className="form-group">
          <label className="label" htmlFor="rev-from">From</label>
          <input id="rev-from" type="date" className="input w-44"
            value={from} onChange={e => setFrom(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="label" htmlFor="rev-to">To</label>
          <input id="rev-to" type="date" className="input w-44"
            value={to} onChange={e => setTo(e.target.value)} />
        </div>
      </div>

      {/* Loading */}
      {isLoading && <LoadingSpinner center />}

      {/* Error */}
      {isError && (
        <div className="rounded-lg px-4 py-3 text-sm"
          style={{ backgroundColor: 'var(--s-red-bg)', color: 'var(--s-red-text)' }}>
          Failed to load revenue report: {error?.response?.data?.message || error?.message || 'Unknown error'}
        </div>
      )}

      {/* Results */}
      {!isLoading && data && (
        <>
          <div className="grid grid-cols-3 gap-4">
            <div className="stat-card">
              <p className="stat-label">Total Revenue</p>
              <p className="stat-value">{formatCurrency(data.total_revenue || 0)}</p>
            </div>
            <div className="stat-card">
              <p className="stat-label">Transactions</p>
              <p className="stat-value">{data.payment_count || 0}</p>
            </div>
            <div className="stat-card">
              <p className="stat-label">Avg per Transaction</p>
              <p className="stat-value">
                {data.payment_count
                  ? formatCurrency(Math.round((data.total_revenue || 0) / data.payment_count))
                  : '—'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="card">
              <div className="card-header">
                <span className="text-sm font-semibold" style={{ color: 'var(--text-base)' }}>
                  By Payment Method
                </span>
              </div>
              <div className="card-body space-y-2">
                {(data.by_method || []).length ? (data.by_method).map(m => (
                  <div key={m.method} className="flex justify-between text-sm items-center py-1"
                    style={{ borderBottom: '1px solid var(--border-soft)' }}>
                    <span className="capitalize" style={{ color: 'var(--text-sub)' }}>
                      {m.method?.replace(/_/g, ' ')}
                    </span>
                    <span className="font-medium font-mono" style={{ color: 'var(--text-base)' }}>
                      {formatCurrency(m.total)}
                    </span>
                  </div>
                )) : (
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No payments yet</p>
                )}
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <span className="text-sm font-semibold" style={{ color: 'var(--text-base)' }}>
                  By Department
                </span>
              </div>
              <div className="card-body space-y-2">
                {(data.by_department || []).length ? (data.by_department).map(d => (
                  <div key={d.department} className="flex justify-between text-sm items-center py-1"
                    style={{ borderBottom: '1px solid var(--border-soft)' }}>
                    <span className="capitalize" style={{ color: 'var(--text-sub)' }}>{d.department}</span>
                    <span className="font-medium font-mono" style={{ color: 'var(--text-base)' }}>
                      {formatCurrency(d.total)}
                    </span>
                  </div>
                )) : (
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No charges yet</p>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* No data yet (query succeeded but returned nothing) */}
      {!isLoading && !isError && !data && (
        <div className="card">
          <div className="card-body text-center py-10">
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Select a date range to view revenue data
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
