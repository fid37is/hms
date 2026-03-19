// src/modules/superAdmin/SuperAdminShell.jsx
import { Navigate, Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useSuperAdminStore } from '../../store/superAdminStore';

const NAV = [
  { to: '/super-admin',               label: 'Overview',       exact: true,  icon: <GridIcon /> },
  { to: '/super-admin/organizations', label: 'Organizations',  exact: false, icon: <BuildingIcon /> },
  { to: '/super-admin/financials',    label: 'Financials',     exact: false, icon: <MoneyIcon /> },
  { to: '/super-admin/activity',      label: 'Activity',       exact: false, icon: <ActivityIcon /> },
  { to: '/super-admin/system',        label: 'System Health',  exact: false, icon: <HeartIcon /> },
];

export default function SuperAdminShell() {
  const isAuthenticated = useSuperAdminStore(s => s.isAuthenticated());
  const admin           = useSuperAdminStore(s => s.admin);
  const logout          = useSuperAdminStore(s => s.logout);
  const navigate        = useNavigate();

  if (!isAuthenticated) return <Navigate to="/super-admin/login" replace />;

  const handleLogout = () => {
    logout();
    navigate('/super-admin/login', { replace: true });
  };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg-page)' }}>
      {/* Sidebar */}
      <nav style={{
        width: 220, flexShrink: 0,
        background: '#0E0805',
        borderRight: '1px solid var(--border-soft)',
        display: 'flex', flexDirection: 'column',
        overflowY: 'auto',
      }}>
        {/* Logo */}
        <div style={{ padding: '16px 16px 8px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32,
            background: 'var(--brand)', borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
              <path d="M3 14V8l6-5 6 5v6H11v-4H7v4H3Z" fill="white"/>
            </svg>
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#FFEAD0' }}>Cierlo HMS</div>
            <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.6px', fontWeight: 600 }}>
              Platform Admin
            </div>
          </div>
        </div>

        {/* Platform badge */}
        <div style={{ margin: '4px 12px 12px', padding: '4px 10px', background: 'rgba(234,108,10,.12)', border: '1px solid rgba(234,108,10,.2)', borderRadius: 6 }}>
          <span style={{ fontSize: 10, color: 'var(--brand)', fontWeight: 600 }}>⬡ Super Admin Console</span>
        </div>

        {/* Nav */}
        <div style={{ padding: '0 8px', flex: 1 }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.7px', padding: '4px 8px 6px' }}>
            Platform
          </div>
          {NAV.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 12px', margin: '1px 0',
                borderRadius: 7, textDecoration: 'none',
                fontSize: 13, fontWeight: 500,
                background: isActive ? 'rgba(234,108,10,.18)' : 'transparent',
                color: isActive ? '#FFEAD0' : 'rgba(255,235,210,.5)',
                transition: 'all .15s',
              })}
            >
              <span style={{ width: 16, height: 16, flexShrink: 0 }}>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </div>

        {/* User + logout */}
        <div style={{ borderTop: '1px solid var(--border-soft)', padding: '12px 16px', marginTop: 'auto' }}>
          <div style={{ fontSize: 12, color: '#FFEAD0', fontWeight: 600, marginBottom: 2 }}>
            {admin?.full_name || 'Admin'}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 10 }}>
            {admin?.email}
          </div>
          <button
            onClick={handleLogout}
            style={{
              width: '100%', padding: '7px 10px',
              background: 'rgba(251,146,60,.1)', border: '1px solid rgba(251,146,60,.2)',
              borderRadius: 6, color: 'var(--s-red-text)', fontSize: 12,
              fontWeight: 600, cursor: 'pointer', textAlign: 'center',
            }}
          >
            Sign Out
          </button>
        </div>
      </nav>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Topbar */}
        <div style={{
          height: 52, flexShrink: 0,
          background: 'var(--bg-surface)',
          borderBottom: '1px solid var(--border-soft)',
          display: 'flex', alignItems: 'center',
          padding: '0 20px', gap: 12,
        }}>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Platform Administration Console</span>
          <div style={{ flex: 1 }} />
          <div style={{ fontSize: 12, color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }} id="sa-clock" />
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}

// ─── Inline SVG icons ─────────────────────────────────────
function GridIcon() {
  return <svg viewBox="0 0 16 16" fill="currentColor" width="16" height="16"><path d="M1 1h6v6H1V1zm8 0h6v6H9V1zM1 9h6v6H1V9zm8 0h6v6H9V9z"/></svg>;
}
function BuildingIcon() {
  return <svg viewBox="0 0 16 16" fill="currentColor" width="16" height="16"><path d="M2 1a1 1 0 011-1h10a1 1 0 011 1v14H2V1zm3 2v2h2V3H5zm4 0v2h2V3H9zm-4 4v2h2V7H5zm4 0v2h2V7H9zm-4 4v4h6v-4H5z"/></svg>;
}
function ActivityIcon() {
  return <svg viewBox="0 0 16 16" fill="currentColor" width="16" height="16"><path d="M0 8a.5.5 0 01.5-.5h2l2-5 3 10 2-7 1 2.5H15.5a.5.5 0 010 1H10a.5.5 0 01-.46-.31L9 7.07l-2 7a.5.5 0 01-.96.02L4 5.62 2.54 8.5H.5A.5.5 0 010 8z"/></svg>;
}
function MoneyIcon() {
  return <svg viewBox="0 0 16 16" fill="currentColor" width="16" height="16"><path d="M8 1a7 7 0 100 14A7 7 0 008 1zm.75 9.5v.5a.75.75 0 01-1.5 0v-.5H6a.75.75 0 010-1.5h2.25a.25.25 0 000-.5h-1.5a1.75 1.75 0 110-3.5v-.5a.75.75 0 011.5 0v.5H9a.75.75 0 010 1.5H6.75a.25.25 0 000 .5h1.5a1.75 1.75 0 010 3.5z"/></svg>;
}
function HeartIcon() {
  return <svg viewBox="0 0 16 16" fill="currentColor" width="16" height="16"><path d="M8 2.748l-.717-.737C5.6.281 2.514.878 1.4 3.053c-.523 1.023-.641 2.5.314 4.385.92 1.815 2.834 3.989 6.286 6.357 3.452-2.368 5.365-4.542 6.286-6.357.955-1.886.838-3.362.314-4.385C13.486.878 10.4.28 8.717 2.01L8 2.748z"/></svg>;
}