import { useState } from 'react';
import OccupancyReport from './components/OccupancyReport';
import RevenueReport   from './components/RevenueReport';
import NightAudit      from './components/NightAudit';
import AuditLog        from './components/AuditLog';

const TABS = ['Occupancy', 'Revenue', 'Night Audit', 'Audit Log'];

export default function ReportsPage() {
  const [tab, setTab] = useState('Occupancy');

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto pb-1">
        <div className="flex gap-1 p-1 rounded-lg w-max" style={{ backgroundColor: 'var(--bg-subtle)' }}>
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className="px-4 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap"
              style={{
                backgroundColor: tab === t ? 'var(--bg-surface)' : 'transparent',
                color:           tab === t ? 'var(--text-base)'  : 'var(--text-muted)',
                boxShadow:       tab === t ? 'var(--shadow-xs)'  : 'none',
              }}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {tab === 'Occupancy'   && <OccupancyReport />}
      {tab === 'Revenue'     && <RevenueReport />}
      {tab === 'Night Audit' && <NightAudit />}
      {tab === 'Audit Log'   && <AuditLog />}
    </div>
  );
}