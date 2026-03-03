import { useQuery } from '@tanstack/react-query';
import {
  BedDouble, Users, CalendarCheck, TrendingUp, ArrowRight,
  Sparkles, Clock, CheckCircle, Wrench, UserPlus, AlertTriangle,
  Package,
} from 'lucide-react';
import { getDashboard } from '../lib/api/reportApi';
import { formatCurrency } from '../utils/format';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import { useNavigate } from 'react-router-dom';

// ── Stat card ─────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, accent }) {
  return (
    <div className="card p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>{label}</p>
          <p className="text-2xl font-bold" style={{ color: 'var(--text-base)' }}>{value ?? '—'}</p>
          {sub && <p className="text-xs mt-1 truncate" style={{ color: 'var(--text-muted)' }}>{sub}</p>}
        </div>
        <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: accent ? 'var(--brand-subtle)' : 'var(--bg-subtle)', color: accent ? 'var(--brand)' : 'var(--text-muted)' }}>
          <Icon size={18} />
        </div>
      </div>
    </div>
  );
}

// ── Revenue bar chart (last 7 days) ───────────────────────
function RevenueChart({ data = [] }) {
  const max = Math.max(...data.map(d => d.amount), 1);
  const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  return (
    <div className="card">
      <div className="card-header">
        <span className="text-sm font-semibold" style={{ color: 'var(--text-base)' }}>Revenue — Last 7 Days</span>
        <span className="text-xs font-semibold" style={{ color: 'var(--brand)' }}>
          {formatCurrency(data.reduce((s, d) => s + d.amount, 0))}
        </span>
      </div>
      <div className="card-body">
        <div className="flex items-end gap-1.5 h-24">
          {data.map((d, i) => {
            const pct = (d.amount / max) * 100;
            const date = new Date(d.date + 'T12:00:00');
            return (
              <div key={d.date} className="flex-1 flex flex-col items-center gap-1 group">
                <div className="w-full rounded-t-sm transition-all relative"
                  style={{ height: `${Math.max(pct, 4)}%`, backgroundColor: pct > 0 ? 'var(--brand)' : 'var(--bg-muted)', opacity: pct > 0 ? 1 : 0.4 }}>
                  {d.amount > 0 && (
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs whitespace-nowrap px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10"
                      style={{ backgroundColor: 'var(--text-base)', color: 'var(--bg-surface)' }}>
                      {formatCurrency(d.amount)}
                    </div>
                  )}
                </div>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{days[date.getDay()]}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Room status bars ──────────────────────────────────────
function RoomStatus({ rooms }) {
  const rows = [
    { label: 'Available',    key: 'available',    color: 'var(--s-green-text)'  },
    { label: 'Occupied',     key: 'occupied',     color: 'var(--brand)'         },
    { label: 'Ready',        key: 'clean',        color: 'var(--s-blue-text)'   },
    { label: 'Dirty',        key: 'dirty',        color: 'var(--s-yellow-text)' },
    { label: 'Maintenance',  key: 'maintenance',  color: 'var(--s-red-text)'    },
    { label: 'Out of Order', key: 'out_of_order', color: 'var(--s-gray-text)'   },
  ];
  return (
    <div className="card">
      <div className="card-header">
        <span className="text-sm font-semibold" style={{ color: 'var(--text-base)' }}>Room Status</span>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{rooms.total} total</span>
      </div>
      <div className="card-body space-y-2.5">
        {rows.map(({ label, key, color }) => {
          const count = rooms.breakdown?.[key] || 0;
          const pct   = rooms.total ? Math.round((count / rooms.total) * 100) : 0;
          return (
            <div key={key} className="flex items-center gap-3">
              <span className="text-xs w-24 flex-shrink-0" style={{ color: 'var(--text-sub)' }}>{label}</span>
              <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-muted)' }}>
                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: color }} />
              </div>
              <span className="text-xs font-medium w-4 text-right" style={{ color: 'var(--text-muted)' }}>{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Today's activity ──────────────────────────────────────
function TodayActivity({ today, hk, maintenance }) {
  const rows = [
    { icon: CheckCircle, label: 'Check-ins due',       value: today.arrivals      ?? 0, color: 'var(--s-green-text)'  },
    { icon: Clock,       label: 'Check-outs due',      value: today.departures    ?? 0, color: 'var(--s-yellow-text)' },
    { icon: Users,       label: 'In-house guests',     value: today.in_house      ?? 0, color: 'var(--brand)'         },
    { icon: Sparkles,    label: 'Pending HK tasks',    value: hk.pending_tasks    ?? 0, color: 'var(--s-red-text)'    },
    { icon: Wrench,      label: 'Open maintenance',    value: maintenance.open_orders ?? 0, color: 'var(--s-yellow-text)' },
  ];
  return (
    <div className="card">
      <div className="card-header">
        <span className="text-sm font-semibold" style={{ color: 'var(--text-base)' }}>Today's Activity</span>
      </div>
      <div className="card-body space-y-0.5">
        {rows.map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2.5">
              <Icon size={14} style={{ color }} />
              <span className="text-sm" style={{ color: 'var(--text-sub)' }}>{label}</span>
            </div>
            <span className="text-sm font-semibold" style={{ color: value > 0 ? 'var(--text-base)' : 'var(--text-muted)' }}>{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Upcoming arrivals ─────────────────────────────────────
function UpcomingArrivals({ arrivals = [] }) {
  return (
    <div className="card">
      <div className="card-header">
        <span className="text-sm font-semibold" style={{ color: 'var(--text-base)' }}>Upcoming Arrivals</span>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Next 7 days</span>
      </div>
      <div className="card-body space-y-0">
        {arrivals.length === 0 ? (
          <p className="text-sm text-center py-4" style={{ color: 'var(--text-muted)' }}>No upcoming arrivals</p>
        ) : arrivals.map(r => (
          <div key={r.id} className="flex items-center justify-between py-2.5"
            style={{ borderBottom: '1px solid var(--border-soft)' }}>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: 'var(--text-base)' }}>
                {r.guests?.name || 'Guest'}
              </p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Room {r.rooms?.number} · {r.check_in_date}
              </p>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0 ml-2"
              style={{ backgroundColor: 'var(--s-blue-bg)', color: 'var(--s-blue-text)' }}>
              {r.reference_number}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Recent reservations ───────────────────────────────────
const RES_STATUS = {
  confirmed:   { label: 'Confirmed', bg: 'var(--s-blue-bg)',   color: 'var(--s-blue-text)'  },
  checked_in:  { label: 'In House',  bg: 'var(--s-green-bg)',  color: 'var(--s-green-text)' },
  checked_out: { label: 'Checked Out', bg: 'var(--s-gray-bg)', color: 'var(--s-gray-text)'  },
  cancelled:   { label: 'Cancelled', bg: 'var(--s-red-bg)',    color: 'var(--s-red-text)'   },
  pending:     { label: 'Pending',   bg: 'var(--s-yellow-bg)', color: 'var(--s-yellow-text)'},
};

function RecentReservations({ reservations = [] }) {
  const navigate = useNavigate();
  return (
    <div className="card">
      <div className="card-header">
        <span className="text-sm font-semibold" style={{ color: 'var(--text-base)' }}>Recent Reservations</span>
        <button onClick={() => navigate('/reservations')} className="text-xs flex items-center gap-1"
          style={{ color: 'var(--brand)' }}>
          View all <ArrowRight size={11} />
        </button>
      </div>
      <div className="card-body space-y-0">
        {reservations.length === 0 ? (
          <p className="text-sm text-center py-4" style={{ color: 'var(--text-muted)' }}>No reservations yet</p>
        ) : reservations.map(r => {
          const s = RES_STATUS[r.status] || RES_STATUS.pending;
          return (
            <div key={r.id} className="flex items-center justify-between py-2.5"
              style={{ borderBottom: '1px solid var(--border-soft)' }}>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: 'var(--text-base)' }}>
                  {r.guests?.name || 'Guest'}
                </p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Room {r.rooms?.number} · {r.check_in_date} → {r.check_out_date}
                </p>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0 ml-2 font-medium"
                style={{ backgroundColor: s.bg, color: s.color }}>
                {s.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Low stock alerts ──────────────────────────────────────
function LowStockAlerts({ items = [] }) {
  if (items.length === 0) return null;
  return (
    <div className="card">
      <div className="card-header">
        <div className="flex items-center gap-2">
          <AlertTriangle size={14} style={{ color: 'var(--s-yellow-text)' }} />
          <span className="text-sm font-semibold" style={{ color: 'var(--text-base)' }}>Low Stock Alerts</span>
        </div>
        <span className="text-xs px-2 py-0.5 rounded-full"
          style={{ backgroundColor: 'var(--s-yellow-bg)', color: 'var(--s-yellow-text)' }}>
          {items.length} items
        </span>
      </div>
      <div className="card-body space-y-0">
        {items.map(item => (
          <div key={item.id} className="flex items-center justify-between py-2.5"
            style={{ borderBottom: '1px solid var(--border-soft)' }}>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: 'var(--text-base)' }}>{item.name}</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{item.category}</p>
            </div>
            <div className="text-right flex-shrink-0 ml-3">
              <p className="text-sm font-semibold" style={{ color: 'var(--s-red-text)' }}>{item.current_stock} left</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>min {item.reorder_level}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Quick actions ─────────────────────────────────────────
function QuickActions() {
  const navigate = useNavigate();
  const links = [
    { label: 'New Reservation',    to: '/reservations',  icon: CalendarCheck },
    { label: 'Check-in Guest',     to: '/reservations',  icon: CheckCircle   },
    { label: 'Room Status Board',  to: '/rooms',         icon: BedDouble     },
    { label: 'Housekeeping Tasks', to: '/housekeeping',  icon: Sparkles      },
    { label: 'Inventory',          to: '/inventory',     icon: Package       },
    { label: 'Reports',            to: '/reports',       icon: TrendingUp    },
  ];
  return (
    <div className="card">
      <div className="card-header">
        <span className="text-sm font-semibold" style={{ color: 'var(--text-base)' }}>Quick Actions</span>
      </div>
      <div className="card-body !p-2 space-y-0.5">
        {links.map(({ label, to, icon: Icon }) => (
          <button key={label} onClick={() => navigate(to)}
            className="flex items-center justify-between w-full px-3 py-2.5 rounded-md transition-colors text-left"
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-subtle)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
            <div className="flex items-center gap-3">
              <Icon size={14} style={{ color: 'var(--text-muted)' }} />
              <span className="text-sm" style={{ color: 'var(--text-base)' }}>{label}</span>
            </div>
            <ArrowRight size={12} style={{ color: 'var(--text-muted)' }} />
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────
export default function DashboardPage() {
  const { data: res, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn:  () => getDashboard().then(r => r.data.data),
    refetchInterval: 60_000,
  });

  if (isLoading) return <LoadingSpinner center />;

  const stats       = res || {};
  const rooms       = stats.rooms            || {};
  const today       = stats.today            || {};
  const finance     = stats.financials       || {};
  const hk          = stats.housekeeping     || {};
  const maintenance = stats.maintenance      || {};
  const guests      = stats.guests           || {};
  const recentRes   = stats.recent_reservations || [];
  const upcoming    = stats.upcoming_arrivals   || [];
  const lowStock    = stats.low_stock_alerts    || [];

  return (
    <div className="space-y-4">

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={BedDouble}     label="Occupancy"       value={rooms.occupancy_rate || '0%'}             sub={`${rooms.breakdown?.occupied || 0} of ${rooms.total || 0} rooms`} accent />
        <StatCard icon={Users}         label="In House"        value={today.in_house ?? 0}                      sub="checked in" />
        <StatCard icon={CalendarCheck} label="Arrivals Today"  value={today.arrivals ?? 0}                      sub={`${today.departures ?? 0} departures`} />
        <StatCard icon={TrendingUp}    label="Monthly Revenue" value={formatCurrency(finance.monthly_revenue || 0)} sub={`${formatCurrency(finance.open_balance || 0)} outstanding`} accent />
      </div>

      {/* Second row — extra KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={UserPlus} label="New Guests"         value={guests.new_this_month ?? 0}          sub="this month" />
        <StatCard icon={Sparkles} label="HK Tasks Pending"  value={hk.pending_tasks ?? 0}               sub="housekeeping" />
        <StatCard icon={Wrench}   label="Maintenance Open"  value={maintenance.open_orders ?? 0}        sub="open orders" />
        <StatCard icon={Package}  label="Low Stock Items"   value={lowStock.length}                     sub="need reorder" />
      </div>

      {/* Revenue chart + Room status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <RevenueChart data={finance.revenue_chart || []} />
        </div>
        <RoomStatus rooms={rooms} />
      </div>

      {/* Middle row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <TodayActivity today={today} hk={hk} maintenance={maintenance} />
        <UpcomingArrivals arrivals={upcoming} />
        <QuickActions />
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <RecentReservations reservations={recentRes} />
        {lowStock.length > 0 && <LowStockAlerts items={lowStock} />}
      </div>

    </div>
  );
}