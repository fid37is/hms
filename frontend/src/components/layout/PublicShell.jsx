import { useNavigate, useLocation, Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import Logo from '../brand/cierlo_logo';
import { useAuthStore } from '../../store/authStore';

const TITLES = {
  '/help':          'Help & Support',
  '/help/docs':     'Documentation',
  '/help/support':  'Contact Support',
  '/help/feedback': 'Feature Requests',
  '/help/status':   'System Status',
};

const BREADCRUMB = {
  '/help/docs':     'Help & Support',
  '/help/support':  'Help & Support',
  '/help/feedback': 'Help & Support',
  '/help/status':   'Help & Support',
};

export default function PublicShell({ children }) {
  const navigate   = useNavigate();
  const { pathname } = useLocation();
  const { token }  = useAuthStore();

  const title      = TITLES[pathname] || 'Help';
  const parentPath = BREADCRUMB[pathname];

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--bg-base)' }}>
      {/* Top bar */}
      <header className="flex-shrink-0 flex items-center justify-between px-6"
        style={{ height: 56, borderBottom: '1px solid var(--border-soft)', backgroundColor: 'var(--bg-surface)' }}>
        <div className="flex items-center gap-3">
          <Logo size="sm" variant="icon" noLink />
          {parentPath ? (
            <div className="flex items-center gap-1.5 text-sm" style={{ color: 'var(--text-muted)' }}>
              <button onClick={() => navigate('/help')}
                className="flex items-center gap-1 hover:underline"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0 }}>
                <ChevronLeft size={14} />{parentPath}
              </button>
              <span>/</span>
              <span style={{ color: 'var(--text-base)', fontWeight: 500 }}>{title}</span>
            </div>
          ) : (
            <span className="text-sm font-semibold" style={{ color: 'var(--text-base)' }}>{title}</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {token ? (
            <Link to="/dashboard"
              className="text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
              style={{ color: 'var(--brand)', textDecoration: 'none', backgroundColor: 'var(--brand-subtle)' }}>
              Go to dashboard →
            </Link>
          ) : (
            <Link to="/login"
              className="text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
              style={{ color: 'var(--brand)', textDecoration: 'none', backgroundColor: 'var(--brand-subtle)' }}>
              Sign in →
            </Link>
          )}
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto px-6 py-6">
        {children}
      </main>
    </div>
  );
}