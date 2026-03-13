import { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Logo from '../brand/cierlo_logo';
import {
  LayoutDashboard, BedDouble, CalendarCheck, Users, Receipt,
  Sparkles, Wrench, Package, HardHat, BarChart3, Settings,
  ChevronLeft, ChevronRight, LogOut, MessageSquare, UtensilsCrossed,
  KeyRound, ChevronUp, HelpCircle, Zap, Palette, Moon, CalendarDays,
} from 'lucide-react';
import { useUIStore }     from '../../store/uiStore';
import { useAuthStore }   from '../../store/authStore';
import { useUnreadCount } from '../../modules/chat/useUnreadCount';
import * as authApi from '../../lib/api/authApi';
import ChangePasswordModal from '../shared/ChangePasswordModal';
import toast from 'react-hot-toast';

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
  { to: '/night-audit',  icon: Moon,            label: 'Night Audit',  permission: 'night_audit:read' },
  { to: '/billing',      icon: Receipt,         label: 'Billing',      permission: 'billing:read' },
  { to: '/fnb',          icon: UtensilsCrossed, label: 'F&B',          permission: 'fnb:read' },
  { to: '/events',       icon: CalendarDays,    label: 'Events',       permission: 'events:read' },
  { to: '/chat',         icon: MessageSquare,   label: 'Guest Chat',   permission: 'chat:read' },
  { to: '/settings',     icon: Settings,        label: 'Settings',     permission: 'settings:read' },
];

const ROLE_NAV = {
  'manager':            ['rooms','reservations','guests','housekeeping','inventory','maintenance','staff','reports','billing','fnb','chat'],
  'receptionist':       ['rooms','reservations','guests','chat'],
  'cashier':            ['reservations','guests','billing','chat'],
  'housekeeper':        ['housekeeping','chat'],
  'maintenance':        ['maintenance','chat'],
  'hr officer':         ['staff','chat'],
  'bar staff':          ['fnb','inventory','chat'],
  'restaurant staff':   ['fnb','inventory','chat'],
  'security':           ['rooms','chat'],
  'front desk manager': ['rooms','reservations','guests','billing','reports','chat'],
  'front desk officer': ['rooms','reservations','guests','chat'],
  'f&b manager':        ['fnb','inventory','reports','staff','chat'],
  'fnb manager':        ['fnb','inventory','reports','staff','chat'],
  'food and beverage manager': ['fnb','inventory','reports','staff','chat'],
  'housekeeping manager':  ['housekeeping','inventory','staff','reports','chat'],
  'housekeeping supervisor':['housekeeping','staff','chat'],
  'maintenance manager':   ['maintenance','inventory','staff','reports','chat'],
  'maintenance supervisor':['maintenance','chat'],
  'finance manager':    ['billing','reports','chat'],
  'accounts manager':   ['billing','reports','chat'],
  'accountant':         ['billing','reports','chat'],
  'hr manager':         ['staff','reports','chat'],
  'rooms manager':      ['rooms','reservations','guests','housekeeping','reports','chat'],
  'reservations manager':['rooms','reservations','guests','billing','reports','chat'],
  'general manager':    ['rooms','reservations','guests','housekeeping','inventory','maintenance','staff','reports','billing','fnb','chat'],
  'gm':                 ['rooms','reservations','guests','housekeeping','inventory','maintenance','staff','reports','billing','fnb','chat'],
};

const getRolePagesByPattern = (roleName) => {
  if (!roleName) return [];
  const r = roleName.toLowerCase();
  const pages = new Set(['chat']);
  if (r.includes('manager') || r.includes('supervisor') || r.includes('head')) { pages.add('reports'); pages.add('staff'); }
  if (r.includes('f&b') || r.includes('fnb') || r.includes('food') || r.includes('beverage') || r.includes('restaurant') || r.includes('bar') || r.includes('kitchen')) { pages.add('fnb'); pages.add('inventory'); }
  if (r.includes('housekeeper') || r.includes('housekeeping') || r.includes('laundry')) { pages.add('housekeeping'); pages.add('inventory'); }
  if (r.includes('maintenance') || r.includes('engineering') || r.includes('technician')) { pages.add('maintenance'); pages.add('inventory'); }
  if (r.includes('front desk') || r.includes('reception') || r.includes('guest service') || r.includes('concierge')) { pages.add('rooms'); pages.add('reservations'); pages.add('guests'); }
  if (r.includes('reservation')) { pages.add('rooms'); pages.add('reservations'); pages.add('guests'); pages.add('billing'); }
  if (r.includes('room')) { pages.add('rooms'); pages.add('reservations'); pages.add('guests'); }
  if (r.includes('finance') || r.includes('account') || r.includes('billing') || r.includes('cashier')) { pages.add('billing'); pages.add('reservations'); pages.add('guests'); }
  if (r.includes('hr') || r.includes('human resource') || r.includes('payroll')) { pages.add('staff'); }
  if (r.includes('security') || r.includes('guard')) { pages.add('rooms'); }
  if (r.includes('inventory') || r.includes('store') || r.includes('procurement') || r.includes('supply')) { pages.add('inventory'); }
  if (pages.size <= 1) return [];
  return [...pages];
};

export default function Sidebar() {
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const { user, logout, hasPermission } = useAuthStore();
  const navigate    = useNavigate();
  const unreadCount = useUnreadCount();
  const [menuOpen,  setMenuOpen]  = useState(false);
  const [changePw,  setChangePw]  = useState(false);
  const menuRef = useRef();

  const { data: org } = useQuery({
    queryKey: ['org-profile'],
    queryFn:  () => authApi.getOrg().then(r => r.data.data),
    staleTime: 5 * 60 * 1000,
  });
  const isTrial   = org?.plan === 'trial';
  const isExpired = org?.status === 'expired' || org?.status === 'suspended';
  const w = sidebarOpen ? '240px' : '64px';

  // Close menu on outside click
  useEffect(() => {
    const handler = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = async () => {
    try { await authApi.logout(); } catch (_) {}
    logout(); navigate('/login'); toast.success('Logged out');
  };

  const isAdmin  = user?.role?.toLowerCase() === 'admin';
  const roleName = user?.role?.toLowerCase() || '';
  const hasDept  = !!user?.department;
  const rolePages = ROLE_NAV[roleName] || getRolePagesByPattern(roleName);

  const canSee = (item) => {
    if (item.permission === null) return true;
    if (isAdmin) return true;
    if (item.permission === 'chat:read') return hasDept;
    if (hasPermission(item.permission)) return true;
    const segment = item.to.replace('/', '');
    return rolePages.includes(segment);
  };

  const visibleNav = NAV.filter(canSee);

  const menuItem = (icon, label, onClick, danger = false) => (
    <button
      onClick={() => { setMenuOpen(false); onClick(); }}
      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-left transition-colors"
      style={{ color: danger ? 'var(--s-red-text)' : 'var(--text-base)', background: 'none', border: 'none', cursor: 'pointer' }}
      onMouseEnter={e => e.currentTarget.style.backgroundColor = danger ? 'var(--s-red-bg)' : 'var(--bg-subtle)'}
      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
    >
      {icon}
      <span>{label}</span>
    </button>
  );

  return (
    <>
      <aside className="h-full flex flex-col transition-all duration-200"
        style={{ width: w, backgroundColor: 'var(--sidebar-bg)', borderRight: '1px solid var(--sidebar-border)' }}>

        {/* Logo row */}
        <div className="flex-shrink-0 flex items-center"
          style={{ height: 56, borderBottom: '1px solid var(--sidebar-border)', padding: '0 8px', gap: 6 }}>

          {/* Logo — always visible. Clicking it expands sidebar when collapsed */}
          <button
            onClick={() => { if (!sidebarOpen) toggleSidebar(); }}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: sidebarOpen ? 'default' : 'pointer', padding: 0, flexShrink: 0 }}
            title={!sidebarOpen ? 'Expand sidebar' : undefined}
          >
            <Logo size="sm" variant="icon" light noLink style={{ flexShrink: 0 }} />
          </button>

          {/* "Cierlo" wordmark — only visible when expanded */}
          <span style={{
            flex: 1, minWidth: 0,
            opacity: sidebarOpen ? 1 : 0,
            maxWidth: sidebarOpen ? 120 : 0,
            overflow: 'hidden',
            transition: 'opacity .2s ease, max-width .2s ease',
            whiteSpace: 'nowrap',
            fontFamily: "'DM Sans', system-ui, sans-serif",
            fontSize: 18, fontWeight: 700, letterSpacing: '-0.03em',
            color: '#ffffff',
            pointerEvents: 'none',
          }}>
            Cierlo
          </span>

          {/* Collapse toggle — only visible when expanded */}
          {sidebarOpen && (
            <button
              onClick={toggleSidebar}
              title="Collapse"
              className="flex-shrink-0 flex items-center justify-center rounded-md transition-colors"
              style={{ width: 28, height: 28, color: 'var(--sidebar-text)', background: 'none', border: 'none', cursor: 'pointer' }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--sidebar-item-hover)'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <ChevronLeft size={14} />
            </button>
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
        <div className="flex-shrink-0 p-2 relative" style={{ borderTop: '1px solid var(--sidebar-border)' }} ref={menuRef}>

          {/* Popup menu — anchors above footer */}
          {menuOpen && (
            <div className="absolute bottom-full mb-1 rounded-xl shadow-xl overflow-hidden z-50"
              style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-soft)', left: 0, width: 220 }}>
              {/* User info header */}
              <div className="px-3 py-2.5" style={{ borderBottom: '1px solid var(--border-soft)' }}>
                <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-base)' }}>{user?.full_name}</p>
                <p className="text-xs truncate capitalize" style={{ color: 'var(--text-muted)' }}>{user?.role}</p>
              </div>
              {/* Upgrade banner — trial or expired */}
              {(isTrial || isExpired) && (
                <div className="mx-2 mt-2 mb-1 px-3 py-2 rounded-lg"
                  style={{ backgroundColor: isExpired ? 'var(--s-red-bg)' : '#fef9ec', border: `1px solid ${isExpired ? 'var(--s-red-border, #fca5a5)' : '#fde68a'}` }}>
                  <p className="text-xs font-semibold" style={{ color: isExpired ? 'var(--s-red-text)' : '#92400e' }}>
                    {isExpired ? '⚠ Subscription expired' : `⚡ Trial plan — ${org?.plan}`}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: isExpired ? 'var(--s-red-text)' : '#b45309', opacity: 0.85 }}>
                    {isExpired ? 'Renew to restore access' : 'Upgrade for full access'}
                  </p>
                  <a href="mailto:sales@cierlo.com"
                    className="inline-block mt-1.5 text-xs font-semibold px-2.5 py-1 rounded-md"
                    style={{ backgroundColor: isExpired ? 'var(--s-red-text)' : '#d97706', color: '#fff', textDecoration: 'none' }}>
                    {isExpired ? 'Renew now' : 'Upgrade plan'} →
                  </a>
                </div>
              )}
              <div className="p-1">
                {menuItem(<Palette size={14} />, 'Customise',       () => window.open('/settings/customize', '_blank'))}
                {menuItem(<HelpCircle size={14} />, 'Help & Support', () => window.open('/help', '_blank'))}
                {menuItem(<Settings size={14} />, 'Settings',        () => navigate('/settings'))}
                {menuItem(<KeyRound size={14} />, 'Change Password', () => setChangePw(true))}
                <div style={{ height: 1, backgroundColor: 'var(--border-soft)', margin: '4px 0' }} />
                {menuItem(<LogOut size={14} />, 'Sign out', handleLogout, true)}
              </div>
            </div>
          )}

          {/* Footer trigger button */}
          <button
            onClick={() => setMenuOpen(s => !s)}
            className="w-full flex items-center rounded-lg transition-colors"
            style={{
              gap: 8, padding: sidebarOpen ? '6px 8px' : '6px',
              background: 'none', border: 'none', cursor: 'pointer',
              justifyContent: sidebarOpen ? 'flex-start' : 'center',
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--sidebar-item-hover)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
            title={!sidebarOpen ? user?.full_name : undefined}
          >
            {/* Avatar */}
            <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold uppercase"
              style={{ backgroundColor: 'var(--sidebar-item-active)', color: 'var(--accent)' }}>
              {user?.full_name?.charAt(0) || 'U'}
            </div>
            {/* Name + role */}
            {sidebarOpen && (
              <>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-xs font-medium truncate" style={{ color: 'var(--sidebar-text-active)' }}>{user?.full_name}</p>
                  <p className="text-xs truncate capitalize" style={{ color: 'var(--sidebar-text)' }}>{user?.role}</p>
                </div>
                <ChevronUp size={13} style={{ color: 'var(--sidebar-text)', flexShrink: 0, transform: menuOpen ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} />
              </>
            )}
          </button>
        </div>
      </aside>

      <ChangePasswordModal open={changePw} onClose={() => setChangePw(false)} />
    </>
  );
}