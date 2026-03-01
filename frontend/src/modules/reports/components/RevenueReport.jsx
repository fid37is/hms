import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import * as reportApi from '../../../lib/api/reportApi';
import LoadingSpinner from '../../../components/shared/LoadingSpinner';
import { formatCurrency } from '../../../utils/format';

function today()      { return new Date().toISOString().split('T')[0]; }
function monthStart() { const d = new Date(); d.setDate(1); return d.toISOString().split('T')[0]; }

export default function RevenueReport() {
  const [from, setFrom] = useState(monthStart());
  const [to,   setTo]   = useState(today());

  const { data, isLoading } = useQuery({
    queryKey: ['report-revenue', from, to],
    queryFn:  () => reportApi.getRevenue({ date_from: from, date_to: to }).then(r => r.data.data),
    enabled:  !!(from && to),
  });

  return (
    <div className="space-y-5">
      <div className="flex items-end gap-3">
        {[['From', from, setFrom], ['To', to, setTo]].map(([label, val, setFn]) => (
          <div key={label} className="form-group">
            <label className="label">{label}</label>
            <input type="date" className="input w-40" value={val} onChange={e => setFn(e.target.value)} />
          </div>
        ))}
      </div>

      {isLoading ? <LoadingSpinner center /> : data && (
        <>
          <div className="grid grid-cols-3 gap-4">
            <div className="stat-card col-span-1 lg:col-span-1">
              <p className="stat-label">Total Revenue</p>
              <p className="stat-value">{formatCurrency(data.total_revenue || 0)}</p>
            </div>
            <div className="stat-card">
              <p className="stat-label">Transactions</p>
              <p className="stat-value">{data.payment_count || 0}</p>
            </div>
            <div className="stat-card">
              <p className="stat-label">Average per Transaction</p>
              <p className="stat-value">
                {data.payment_count ? formatCurrency((data.total_revenue || 0) / data.payment_count) : '—'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="card">
              <div className="card-header">
                <span className="text-sm font-semibold" style={{ color: 'var(--text-base)' }}>By Payment Method</span>
              </div>
              <div className="card-body space-y-2">
                {(data.by_method || []).map(m => (
                  <div key={m.method} className="flex justify-between text-sm items-center">
                    <span className="capitalize" style={{ color: 'var(--text-sub)' }}>
                      {m.method?.replace(/_/g, ' ')}
                    </span>
                    <span className="font-medium font-mono" style={{ color: 'var(--text-base)' }}>
                      {formatCurrency(m.total)}
                    </span>
                  </div>
                ))}
                {!data.by_method?.length && (
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No data</p>
                )}
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <span className="text-sm font-semibold" style={{ color: 'var(--text-base)' }}>By Department</span>
              </div>
              <div className="card-body space-y-2">
                {(data.by_department || []).map(d => (
                  <div key={d.department} className="flex justify-between text-sm items-center">
                    <span className="capitalize" style={{ color: 'var(--text-sub)' }}>{d.department}</span>
                    <span className="font-medium font-mono" style={{ color: 'var(--text-base)' }}>
                      {formatCurrency(d.total)}
                    </span>
                  </div>
                ))}
                {!data.by_department?.length && (
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No data</p>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
