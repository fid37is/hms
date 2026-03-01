import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import * as reportApi from '../../lib/api/reportApi';
import PageHeader      from '../../components/shared/PageHeader';
import LoadingSpinner  from '../../components/shared/LoadingSpinner';
import OccupancyReport from './components/OccupancyReport';
import RevenueReport   from './components/RevenueReport';
import NightAudit      from './components/NightAudit';
import AuditLog        from './components/AuditLog';
import { formatCurrency } from '../../utils/format';

const TABS = ['Occupancy', 'Revenue', 'Night Audit', 'Audit Log'];

function today() { return new Date().toISOString().split('T')[0]; }
function monthStart() {
  const d = new Date(); d.setDate(1);
  return d.toISOString().split('T')[0];
}

export default function ReportsPage() {
  const [tab, setTab] = useState('Occupancy');

  return (
    <div className="space-y-5">
      <PageHeader title="Reports" />

      <div className="flex gap-1 p-1 rounded-lg w-fit" style={{ backgroundColor: 'var(--bg-subtle)' }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className="px-4 py-1.5 text-xs font-medium rounded-md transition-all"
            style={{
              backgroundColor: tab === t ? 'var(--bg-surface)' : 'transparent',
              color:           tab === t ? 'var(--text-base)'  : 'var(--text-muted)',
              boxShadow:       tab === t ? 'var(--shadow-xs)'  : 'none',
            }}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'Occupancy'  && <OccupancyReport />}
      {tab === 'Revenue'    && <RevenueReport />}
      {tab === 'Night Audit'&& <NightAudit />}
      {tab === 'Audit Log'  && <AuditLog />}
    </div>
  );
}
