import { useLocation } from 'react-router-dom';
import { Bell, Sun, Moon } from 'lucide-react';
import { useAuthStore }  from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';

const TITLES = {
  '/dashboard':    'Dashboard',
  '/rooms':        'Rooms',
  '/reservations': 'Reservations',
  '/guests':       'Guests',
  '/housekeeping': 'Housekeeping',
  '/inventory':    'Inventory',
  '/maintenance':  'Maintenance',
  '/staff':        'Staff',
  '/reports':      'Reports',
  '/settings':     'Settings',
};

export default function Header() {
  const { pathname }              = useLocation();
  const user                      = useAuthStore((s) => s.user);
  const { mode, toggleTheme }     = useThemeStore();
  const title = TITLES[pathname] || 'HMS Pro';

  return (
    <header
      className="h-14 flex items-center justify-between px-6 flex-shrink-0"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderBottom:    '1px solid var(--border-soft)',
      }}
    >
      <h1 className="text-sm font-semibold" style={{ color: 'var(--text-base)' }}>
        {title}
      </h1>

      <div className="flex items-center gap-1">

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="w-8 h-8 flex items-center justify-center rounded-md transition-colors"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-subtle)'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
          title={mode === 'dark' ? 'Switch to light' : 'Switch to dark'}
        >
          {mode === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
        </button>

        {/* Notifications */}
        <button
          className="relative w-8 h-8 flex items-center justify-center rounded-md transition-colors"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-subtle)'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <Bell size={15} />
          <span
            className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: 'var(--s-red-text)' }}
          />
        </button>

        {/* Avatar */}
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold uppercase ml-1"
          style={{
            backgroundColor: 'var(--brand-subtle)',
            color:           'var(--brand)',
          }}
        >
          {user?.full_name?.charAt(0) || 'U'}
        </div>
      </div>
    </header>
  );
}