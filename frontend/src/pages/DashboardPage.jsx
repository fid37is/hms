import { useQuery } from '@tanstack/react-query';
import {
  BedDouble, Users, CalendarCheck, TrendingUp,
  ArrowRight, Sparkles, Clock, CheckCircle,
} from 'lucide-react';
import { getDashboard } from '../lib/api/reportApi';
import { formatCurrency } from '../utils/format';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import { useNavigate } from 'react-router-dom';

function StatCard({ icon: Icon, label, value, sub, accent = false }) {
  return (
    <div className="stat-card">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="stat-label truncate">{label}</p>
          <p className="stat-value">{value ?? '—'}</p>
          {sub && <p className="stat-delta truncate">{sub}</p>}
        </div>
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{
            backgroundColor: accent ? 'var(--brand-subtle)' : 'var(--bg-subtle)',
            color:           accent ? 'var(--brand)'        : 'var(--text-muted)',
          }}
        >
          <Icon size={18} />
        </div>
      </div>
    </div>
  );
}

function QuickLink({ label, to, icon: Icon }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(to)}
      className="flex items-center justify-between w-full px-3 py-3 rounded-md transition-colors text-left active:opacity-70"
      onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-subtle)'}
      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
    >
      <div className="flex items-center gap-3">
        <Icon size={15} style={{ color: 'var(--text-muted)' }} />
        <span className="text-sm font-medium" style={{ color: 'var(--text-base)' }}>{label}</span>
      </div>
      <ArrowRight size={13} style={{ color: 'var(--text-muted)' }} />
    </button>
  );
}

export default function DashboardPage() {
  const { data: res, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn:  () => getDashboard().then(r => r.data.data),
    refetchInterval: 60_000,
  });

  if (isLoading) return <LoadingSpinner center />;

  const stats   = res || {};
  const rooms   = stats.rooms       || {};
  const today   = stats.today       || {};
  const finance = stats.financials  || {};
  const hk      = stats.housekeeping || {};

  return (
    <div className="space-y-4">
      {/* Stat cards - 2 col mobile, 4 col desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={BedDouble}    label="Occupancy"       value={rooms.occupancy_rate || '0%'}    sub={`${rooms.breakdown?.occupied || 0} of ${rooms.total || 0} rooms`} accent />
        <StatCard icon={Users}        label="In House"        value={today.in_house ?? 0}              sub="checked in" />
        <StatCard icon={CalendarCheck} label="Arrivals Today" value={today.arrivals ?? 0}              sub={`${today.departures ?? 0} departures`} />
        <StatCard icon={TrendingUp}   label="Monthly Revenue" value={formatCurrency(finance.monthly_revenue || 0)} sub={`${formatCurrency(finance.open_balance || 0)} outstanding`} accent />
      </div>

      {/* Middle row - stacked on mobile, 3-col on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Room status */}
        <div className="card">
          <div className="card-header">
            <span className="text-sm font-semibold" style={{ color: 'var(--text-base)' }}>Room Status</span>
          </div>
          <div className="card-body space-y-3">
            {[
              { label: 'Available',    key: 'available',    color: 'var(--s-green-text)'  },
              { label: 'Occupied',     key: 'occupied',     color: 'var(--brand)'         },
              { label: 'Dirty',        key: 'dirty',        color: 'var(--s-yellow-text)' },
              { label: 'Maintenance',  key: 'maintenance',  color: 'var(--s-red-text)'    },
              { label: 'Out of Order', key: 'out_of_order', color: 'var(--s-gray-text)'   },
            ].map(({ label, key, color }) => {
              const count = rooms.breakdown?.[key] || 0;
              const pct   = rooms.total ? Math.round((count / rooms.total) * 100) : 0;
              return (
                <div key={key} className="flex items-center gap-3">
                  <span className="text-xs w-24 flex-shrink-0" style={{ color: 'var(--text-sub)' }}>{label}</span>
                  <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-muted)' }}>
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
                  </div>
                  <span className="text-xs font-medium w-5 text-right" style={{ color: 'var(--text-muted)' }}>{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Today's activity */}
        <div className="card">
          <div className="card-header">
            <span className="text-sm font-semibold" style={{ color: 'var(--text-base)' }}>Today's Activity</span>
          </div>
          <div className="card-body space-y-1">
            {[
              { icon: CheckCircle, label: 'Check-ins due',    value: today.arrivals   ?? 0, color: 'var(--s-green-text)'  },
              { icon: Clock,       label: 'Check-outs due',   value: today.departures ?? 0, color: 'var(--s-yellow-text)' },
              { icon: Users,       label: 'In-house guests',  value: today.in_house   ?? 0, color: 'var(--brand)'         },
              { icon: Sparkles,    label: 'Pending HK tasks', value: hk.pending_tasks ?? 0, color: 'var(--s-red-text)'    },
            ].map(({ icon: Icon, label, value, color }) => (
              <div key={label} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2.5">
                  <Icon size={15} style={{ color }} />
                  <span className="text-sm" style={{ color: 'var(--text-sub)' }}>{label}</span>
                </div>
                <span className="text-sm font-semibold" style={{ color: 'var(--text-base)' }}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick actions */}
        <div className="card">
          <div className="card-header">
            <span className="text-sm font-semibold" style={{ color: 'var(--text-base)' }}>Quick Actions</span>
          </div>
          <div className="card-body !p-2 space-y-0.5">
            <QuickLink label="New Reservation"    to="/reservations" icon={CalendarCheck} />
            <QuickLink label="Check-in Guest"     to="/reservations" icon={CheckCircle}   />
            <QuickLink label="Room Status Board"  to="/rooms"        icon={BedDouble}     />
            <QuickLink label="Housekeeping Tasks" to="/housekeeping" icon={Sparkles}      />
            <QuickLink label="Night Audit"        to="/reports"      icon={TrendingUp}    />
          </div>
        </div>
      </div>
    </div>
  );
}
