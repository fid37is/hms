import { NavLink, useNavigate } from 'react-router-dom';
import Logo from '../brand/logo';
import {
  LayoutDashboard, BedDouble, CalendarCheck, Users, Receipt,
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
  { to: '/billing',      icon: Receipt,         label: 'Billing',      permission: 'billing:read' },
  { to: '/chat',         icon: MessageSquare,   label: 'Guest Chat',   permission: 'chat' },
  { to: '/settings',     icon: Settings,        label: 'Settings',     permission: 'settings:read' },
];

// Pages each role can access when the permissions array is empty/not seeded
const ROLE_NAV = {
  'front desk manager': ['rooms','reservations','guests','reports','chat'],
  'receptionist':       ['rooms','reservations','guests','chat'],
  'cashier':            ['reservations','guests','chat'],
  'housekeeper':        ['housekeeping','chat'],
  'maintenance':        ['maintenance','chat'],
  'manager':            ['rooms','reservations','guests','housekeeping','inventory','maintenance','staff','reports','chat'],
  'hr officer':         ['staff','chat'],
  'bar staff':          ['inventory','chat'],
  'restaurant staff':   ['inventory','chat'],
  'security':           ['rooms','chat'],
};

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

  const isAdmin   = user?.role?.toLowerCase() === 'admin';
  const roleName  = user?.role?.toLowerCase() || '';
  const hasDept   = !!user?.department;
  const rolePages = ROLE_NAV[roleName] || [];

  const canSee = (item) => {
    if (item.permission === null) return true;   // Dashboard — always
    if (isAdmin) return true;                     // Admin sees all

    // Guest Chat — only if user belongs to a department
    if (item.permission === 'chat') return hasDept;

    // Explicit permission in JWT
    if (hasPermission(item.permission)) return true;

    // Fallback: role-name map (when permissions array not yet seeded in DB)
    const segment = item.to.replace('/', '');
    return rolePages.includes(segment);
  };

  const visibleNav = NAV.filter(canSee);

  return (
    <aside className="h-full flex flex-col transition-all duration-200"
      style={{ width: w, backgroundColor: 'var(--sidebar-bg)', borderRight: '1px solid var(--sidebar-border)' }}>

      {/* Logo */}
      <div className="flex-shrink-0 flex items-center"
        style={{ height: 56, borderBottom: '1px solid var(--sidebar-border)', padding: '0 12px', gap: 8, overflow: 'hidden' }}>
        {/* Icon always visible, same size */}
        <Logo size="sm" variant="icon" light noLink style={{ flexShrink: 0 }} />
        {/* Wordmark slides in/out */}
        <div style={{
          flex: 1, minWidth: 0,
          opacity: sidebarOpen ? 1 : 0,
          width: sidebarOpen ? 'auto' : 0,
          overflow: 'hidden',
          transition: 'opacity .2s ease, width .2s ease',
          whiteSpace: 'nowrap',
          fontFamily: "'DM Sans', system-ui, sans-serif",
          fontSize: 18, fontWeight: 700, letterSpacing: '-0.03em',
          color: '#ffffff',
        }}>
          Cierlo
        </div>
        <button onClick={toggleSidebar} className="flex-shrink-0 flex items-center justify-center rounded"
          style={{ color: 'var(--sidebar-text)', background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}>
          {sidebarOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
        </button>
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