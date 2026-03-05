// HMS/frontend/src/components/layout/Sidebar.jsx
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, BedDouble, CalendarCheck, Users,
  Sparkles, Wrench, Package, HardHat, BarChart3, Settings,
  ChevronLeft, ChevronRight, LogOut, MessageSquare,
} from 'lucide-react';
import { useUIStore }     from '../../store/uiStore';
import { useAuthStore }   from '../../store/authStore';
import { useUnreadCount } from '../../modules/chat/useUnreadCount';
import toast from 'react-hot-toast';
import * as authApi from '../../lib/api/authApi';

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
  { to: '/chat',         icon: MessageSquare,   label: 'Guest Chat',   permission: null },
  { to: '/settings',     icon: Settings,        label: 'Settings',     permission: 'settings:read' },
];

export default function Sidebar() {
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const { user, logout, hasPermission } = useAuthStore();
  const navigate    = useNavigate();
  const unreadCount = useUnreadCount();
  const w = sidebarOpen ? '240px' : '64px';

  const handleLogout = async () => {
    try { await authApi.logout(); } catch (_) {}
    logout(); navigate('/login'); toast.success('Logged out');
  };

  const isAdmin    = user?.role?.toLowerCase() === 'admin';
  const visibleNav = NAV.filter(item =>
    item.permission === null || isAdmin || hasPermission(item.permission)
  );

  return (
    <aside className="h-full flex flex-col transition-all duration-200"
      style={{ width: w, backgroundColor: 'var(--sidebar-bg)', borderRight: '1px solid var(--sidebar-border)' }}>

      {/* Logo */}
      <div className="flex-shrink-0"
        style={{ height: 56, position: 'relative', borderBottom: '1px solid var(--sidebar-border)' }}>
        {sidebarOpen ? (
          <div className="flex items-center h-full px-4 gap-2.5">
            <img src="/mira-logo.png" alt="Miravance" className="flex-shrink-0"
              style={{ height: 28, width: 'auto' }} />
            <span className="flex-1 truncate" style={{
              fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 17,
              letterSpacing: '-0.01em', color: 'var(--sidebar-text-active)', userSelect: 'none',
            }}>Miravance</span>
            <button onClick={toggleSidebar} className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded"
              style={{ color: 'var(--sidebar-text)' }}>
              <ChevronLeft size={14} />
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-center h-full">
              <img src="/mira-logo.png" alt="Miravance" style={{ height: 28, width: 'auto' }} />
            </div>
            <button onClick={toggleSidebar} style={{
              position: 'absolute', top: 8, right: 8, width: 16, height: 16,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'none', border: 'none', cursor: 'pointer', color: 'var(--sidebar-text)',
            }}>
              <ChevronRight size={11} />
            </button>
          </>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 sidebar-nav py-2 px-2 overflow-y-auto">
        {visibleNav.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} title={!sidebarOpen ? label : undefined} className="block">
            {({ isActive }) => (
              <div className="flex items-center gap-3 px-2.5 py-2.5 rounded-md mb-0.5 transition-all duration-100 cursor-pointer"
                style={{
                  backgroundColor: isActive ? 'var(--sidebar-item-active)' : 'transparent',
                  color:           isActive ? 'var(--sidebar-text-active)' : 'var(--sidebar-text)',
                }}
                onMouseEnter={e => !isActive && (e.currentTarget.style.backgroundColor = 'var(--sidebar-item-hover)')}
                onMouseLeave={e => !isActive && (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                {/* Icon with unread badge for chat */}
                <div className="relative flex-shrink-0">
                  <Icon size={16} />
                  {to === '/chat' && unreadCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 text-[9px] font-bold rounded-full flex items-center justify-center text-white"
                      style={{ backgroundColor: 'var(--accent)', minWidth: 14, height: 14, padding: '0 3px' }}>
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </div>
                {sidebarOpen && <span className="text-sm font-medium truncate">{label}</span>}
              </div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User footer */}
      <div className="flex-shrink-0 p-2" style={{ borderTop: '1px solid var(--sidebar-border)' }}>
        {sidebarOpen ? (
          <div className="flex items-center gap-2.5 px-2 py-2">
            <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold uppercase"
              style={{ backgroundColor: 'var(--sidebar-item-active)', color: 'var(--accent)' }}>
              {user?.full_name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate" style={{ color: 'var(--sidebar-text-active)' }}>{user?.full_name}</p>
              <p className="text-xs truncate capitalize" style={{ color: 'var(--sidebar-text)' }}>{user?.role}</p>
            </div>
            <button onClick={handleLogout} style={{ color: 'var(--sidebar-text)' }}><LogOut size={14} /></button>
          </div>
        ) : (
          <button onClick={handleLogout} className="w-full flex justify-center py-2" style={{ color: 'var(--sidebar-text)' }}>
            <LogOut size={16} />
          </button>
        )}
      </div>
    </aside>
  );
}