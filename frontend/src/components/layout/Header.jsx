import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Bell, Sun, Moon, KeyRound, LogOut, ChevronDown, Menu } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { useUIStore } from '../../store/uiStore';
import ChangePasswordModal from '../shared/ChangePasswordModal';
import * as authApi from '../../lib/api/authApi';
import toast from 'react-hot-toast';

const TITLES = {
  '/dashboard': 'Dashboard',
  '/rooms': 'Rooms',
  '/reservations': 'Reservations',
  '/guests': 'Guests',
  '/housekeeping': 'Housekeeping',
  '/inventory': 'Inventory',
  '/maintenance': 'Maintenance',
  '/staff': 'Staff',
  '/reports': 'Reports',
  '/settings': 'Settings',
};

export default function Header() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { mode, toggleTheme } = useThemeStore();
  const { toggleSidebar } = useUIStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [changePw, setChangePw] = useState(false);
  const menuRef = useRef();
  const title = TITLES[pathname] || 'HMS Pro';

  useEffect(() => {
    const handler = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = async () => {
    try { await authApi.logout(); } catch (_) { }
    logout();
    navigate('/login');
    toast.success('Logged out');
  };

  return (
    <>
      <header
        className="h-14 flex items-center justify-between px-4 md:px-6 flex-shrink-0"
        style={{ backgroundColor: 'var(--bg-surface)', borderBottom: '1px solid var(--border-soft)' }}
      >
        <div className="flex items-center gap-3">
          {/* Hamburger - mobile only */}
          <button
            onClick={toggleSidebar}
            className="md:hidden w-8 h-8 flex items-center justify-center rounded-md"
            style={{ color: 'var(--text-muted)' }}
          >
            <Menu size={18} />
          </button>
          <h1 className="text-base font-semibold" style={{ color: 'var(--text-base)' }}>{title}</h1>

        </div>

        <div className="flex items-center gap-1">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="w-8 h-8 flex items-center justify-center rounded-md transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-subtle)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            {mode === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          </button>

          {/* Notifications */}
          <button
            className="relative w-8 h-8 flex items-center justify-center rounded-md"
            style={{ color: 'var(--text-muted)' }}
          >
            <Bell size={15} />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--s-red-text)' }} />
          </button>

          {/* Avatar dropdown */}
          <div className="relative ml-1" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(s => !s)}
              className="flex items-center gap-1.5 px-1.5 py-1 rounded-lg"
              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-subtle)'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold uppercase"
                style={{ backgroundColor: 'var(--brand-subtle)', color: 'var(--brand)' }}
              >
                {user?.full_name?.charAt(0) || 'U'}
              </div>
              <span className="hidden sm:block text-xs font-medium max-w-[80px] truncate" style={{ color: 'var(--text-base)' }}>
                {user?.full_name?.split(' ')[0]}
              </span>
              <ChevronDown size={12} style={{ color: 'var(--text-muted)' }} />
            </button>

            {menuOpen && (
              <div
                className="absolute right-0 top-full mt-1.5 w-52 rounded-xl shadow-lg z-50 overflow-hidden"
                style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-soft)' }}
              >
                <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border-soft)' }}>
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--text-base)' }}>{user?.full_name}</p>
                  <p className="text-xs truncate capitalize" style={{ color: 'var(--text-muted)' }}>{user?.role}</p>
                </div>
                <div className="p-1">
                  <button
                    onClick={() => { setChangePw(true); setMenuOpen(false); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-left"
                    style={{ color: 'var(--text-base)' }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-subtle)'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <KeyRound size={13} style={{ color: 'var(--text-muted)' }} />
                    Change Password
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-left"
                    style={{ color: 'var(--s-red-text)' }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--s-red-bg)'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <LogOut size={13} />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <ChangePasswordModal open={changePw} onClose={() => setChangePw(false)} />
    </>
  );
}
