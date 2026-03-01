import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, BedDouble, CalendarCheck, Users, Receipt,
  Sparkles, Wrench, Package, HardHat, BarChart3, Settings,
  ChevronLeft, ChevronRight, Hotel, LogOut,
} from 'lucide-react';
import { useUIStore }   from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';
import * as authApi from '../../lib/api/authApi';

// Each nav item declares which permission it needs (null = always visible)
const NAV = [
  { to: '/dashboard',    icon: LayoutDashboard, label: 'Dashboard',    permission: null },
  { to: '/rooms',        icon: BedDouble,       label: 'Rooms',        permission: 'rooms:read' },
  { to: '/reservations', icon: CalendarCheck,   label: 'Reservations', permission: 'reservations:read' },
  { to: '/guests',       icon: Users,           label: 'Guests',       permission: 'guests:read' },
  { to: '/housekeeping', icon: Sparkles,        label: 'Housekeeping', permission: 'housekeeping:read' },
  { to: '/inventory',    icon: Package,         label: 'Inventory',    permission: 'inventory:read' },
  { to: '/maintenance',  icon: Wrench,          label: 'Maintenance',  permission: 'maintenance:read' },
  { to: '/staff',        icon: HardHat,         label: 'Staff',        permission: 'staff:read' },
  { to: '/reports',      icon: BarChart3,       label: 'Reports',      permission: 'reports:basic' },
  { to: '/settings',     icon: Settings,        label: 'Settings',     permission: 'settings:read' },
];

export default function Sidebar() {
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const { user, logout, hasPermission } = useAuthStore();
  const navigate = useNavigate();
  const w = sidebarOpen ? '240px' : '64px';

  const handleLogout = async () => {
    try { await authApi.logout(); } catch (_) {}
    logout();
    navigate('/login');
    toast.success('Logged out');
  };

  // Admin sees everything; others see only what their permissions allow
  const isAdmin    = user?.role?.toLowerCase() === 'admin';
  const visibleNav = NAV.filter(item =>
    item.permission === null || isAdmin || hasPermission(item.permission)
  );

  return (
    <aside
      className="fixed left-0 top-0 h-full z-30 flex flex-col transition-all duration-200"
      style={{ width: w, backgroundColor: 'var(--sidebar-bg)', borderRight: '1px solid var(--sidebar-border)' }}
    >
      {/* Logo */}
      <div
        className="flex items-center h-14 px-4 flex-shrink-0"
        style={{ borderBottom: '1px solid var(--sidebar-border)' }}
      >
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: 'var(--accent)' }}
          >
            <Hotel size={14} color="white" />
          </div>
          {sidebarOpen && (
            <span className="text-sm font-semibold truncate" style={{ color: 'var(--sidebar-text-active)' }}>
              HMS Pro
            </span>
          )}
        </div>
        <button
          onClick={toggleSidebar}
          className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded transition-colors"
          style={{ color: 'var(--sidebar-text)' }}
        >
          {sidebarOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
        </button>
      </div>

      {/* Nav items — only what this user can access */}
      <nav className="flex-1 sidebar-nav py-2 px-2 overflow-y-auto">
        {visibleNav.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} title={!sidebarOpen ? label : undefined} className="block">
            {({ isActive }) => (
              <div
                className="flex items-center gap-3 px-2.5 py-2 rounded-md mb-0.5 transition-all duration-100 cursor-pointer"
                style={{
                  backgroundColor: isActive ? 'var(--sidebar-item-active)' : 'transparent',
                  color:           isActive ? 'var(--sidebar-text-active)' : 'var(--sidebar-text)',
                }}
                onMouseEnter={e => !isActive && (e.currentTarget.style.backgroundColor = 'var(--sidebar-item-hover)')}
                onMouseLeave={e => !isActive && (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <Icon size={16} className="flex-shrink-0" />
                {sidebarOpen && <span className="text-sm font-medium truncate">{label}</span>}
                {isActive && sidebarOpen && (
                  <div className="ml-auto w-1 h-1 rounded-full" style={{ backgroundColor: 'var(--accent)' }} />
                )}
              </div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User footer */}
      <div className="flex-shrink-0 p-2" style={{ borderTop: '1px solid var(--sidebar-border)' }}>
        {sidebarOpen ? (
          <div className="flex items-center gap-2.5 px-2 py-2">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold uppercase"
              style={{ backgroundColor: 'var(--sidebar-item-active)', color: 'var(--accent)' }}
            >
              {user?.full_name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate" style={{ color: 'var(--sidebar-text-active)' }}>
                {user?.full_name}
              </p>
              <p className="text-xs truncate capitalize" style={{ color: 'var(--sidebar-text)' }}>
                {user?.role}
              </p>
            </div>
            <button onClick={handleLogout} title="Logout"
              className="flex-shrink-0 transition-colors" style={{ color: 'var(--sidebar-text)' }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--sidebar-text-active)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--sidebar-text)'}
            >
              <LogOut size={14} />
            </button>
          </div>
        ) : (
          <button onClick={handleLogout} title="Logout"
            className="w-full flex justify-center py-2 transition-colors"
            style={{ color: 'var(--sidebar-text)' }}
          >
            <LogOut size={16} />
          </button>
        )}
      </div>
    </aside>
  );
}
