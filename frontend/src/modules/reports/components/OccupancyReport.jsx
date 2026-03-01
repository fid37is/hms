import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import * as reportApi from '../../../lib/api/reportApi';
import DataTable      from '../../../components/shared/DataTable';
import LoadingSpinner from '../../../components/shared/LoadingSpinner';
import StatusBadge    from '../../../components/shared/StatusBadge';
import { formatDate } from '../../../utils/format';

function today()      { return new Date().toISOString().split('T')[0]; }
function monthStart() { const d = new Date(); d.setDate(1); return d.toISOString().split('T')[0]; }

export default function OccupancyReport() {
  const [from, setFrom] = useState(monthStart());
  const [to,   setTo]   = useState(today());

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['report-occupancy', from, to],
    queryFn:  () => reportApi.getOccupancy({ date_from: from, date_to: to }).then(r => r.data.data),
    enabled:  !!(from && to),
  });

  const summary = data?.summary || {};

  const columns = [
    { key: 'reservation_no', label: 'Ref',
      render: r => <span className="font-mono text-xs" style={{ color: 'var(--brand)' }}>{r.reservation_no}</span> },
    { key: 'guest',      label: 'Guest',      render: r => r.guests?.full_name || '—' },
    { key: 'room',       label: 'Room',        render: r => r.rooms?.number || '—' },
    { key: 'check_in_date',  label: 'Check-in',   render: r => formatDate(r.check_in_date) },
    { key: 'check_out_date', label: 'Check-out',  render: r => formatDate(r.check_out_date) },
    { key: 'status',     label: 'Status',      render: r => <StatusBadge status={r.status} /> },
  ];

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
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Occupancy Rate',    value: summary.occupancy_rate   || '0%'  },
              { label: 'Total Room Nights', value: summary.total_room_nights || 0    },
              { label: 'Occupied Nights',   value: summary.occupied_nights   || 0    },
              { label: 'Total Rooms',       value: summary.total_rooms       || 0    },
            ].map(({ label, value }) => (
              <div key={label} className="stat-card">
                <p className="stat-label">{label}</p>
                <p className="stat-value">{value}</p>
              </div>
            ))}
          </div>
          <div className="card overflow-hidden">
            <div className="card-header">
              <span className="text-sm font-semibold" style={{ color: 'var(--text-base)' }}>Reservations</span>
            </div>
            <DataTable columns={columns} data={data.reservations || []} emptyTitle="No data" />
          </div>
        </>
      )}
    </div>
  );
}
