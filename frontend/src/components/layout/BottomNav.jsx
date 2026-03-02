import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, BedDouble, CalendarCheck, Users,
  Sparkles, Package, Wrench, HardHat, BarChart3, Settings,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

const NAV = [
  { to: '/dashboard',    icon: LayoutDashboard, label: 'Home',         permission: null },
  { to: '/reservations', icon: CalendarCheck,   label: 'Bookings',     permission: 'reservations:read' },
  { to: '/rooms',        icon: BedDouble,       label: 'Rooms',        permission: 'rooms:read' },
  { to: '/guests',       icon: Users,           label: 'Guests',       permission: 'guests:read' },
  { to: '/housekeeping', icon: Sparkles,        label: 'Housekeeping', permission: 'housekeeping:read' },
  { to: '/inventory',    icon: Package,         label: 'Inventory',    permission: 'inventory:read' },
  { to: '/maintenance',  icon: Wrench,          label: 'Maintenance',  permission: 'maintenance:read' },
  { to: '/staff',        icon: HardHat,         label: 'Staff',        permission: 'staff:read' },
  { to: '/reports',      icon: BarChart3,       label: 'Reports',      permission: 'reports:basic' },
  { to: '/settings',     icon: Settings,        label: 'Settings',     permission: 'settings:read' },
];

export default function BottomNav() {
  const { user, hasPermission } = useAuthStore();
  const isAdmin = user?.role?.toLowerCase() === 'admin';

  const visible = NAV.filter(item =>
    item.permission === null || isAdmin || hasPermission(item.permission)
  ).slice(0, 5); // show max 5 in bottom nav

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-20 md:hidden flex items-center justify-around px-1 safe-area-pb"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderTop: '1px solid var(--border-soft)',
        paddingBottom: 'env(safe-area-inset-bottom, 8px)',
        height: '60px',
      }}
    >
      {visible.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          className="flex flex-col items-center justify-center flex-1 h-full gap-0.5 text-center min-w-0"
        >
          {({ isActive }) => (
            <>
              <Icon
                size={20}
                style={{ color: isActive ? 'var(--brand)' : 'var(--text-muted)', flexShrink: 0 }}
              />
              <span
                className="text-[10px] font-medium truncate w-full text-center px-0.5"
                style={{ color: isActive ? 'var(--brand)' : 'var(--text-muted)' }}
              >
                {label}
              </span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
