import { useState } from 'react';
import { Navigate, Outlet, NavLink, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useSuperAdminStore } from '../../store/superAdminStore';
import Logo from '../../components/brand/cierlo_logo';
import SlidePanel from '../../components/shared/SlidePanel';
import { Eye, EyeOff } from 'lucide-react';
import { resetAdminPassword } from '../../lib/api/superAdminApi';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';

const NAV = [
  { to: '/super-admin',               label: 'Overview',      exact: true,  icon: <GridIcon /> },
  { to: '/super-admin/organizations', label: 'Organizations', exact: false, icon: <BuildingIcon /> },
  { to: '/super-admin/financials',    label: 'Financials',    exact: false, icon: <MoneyIcon /> },
  { to: '/super-admin/activity',      label: 'Activity',      exact: false, icon: <ActivityIcon /> },
  { to: '/super-admin/system',        label: 'System Health', exact: false, icon: <HeartIcon /> },
  { to: '/super-admin/admins',        label: 'Admins',        exact: false, icon: <AdminIcon /> },
];

function PasswordInput({ id, value, onChange, placeholder }) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      <input id={id} type={show ? 'text' : 'password'} className="input" required
        placeholder={placeholder || 'Min 8 characters'} value={value} onChange={onChange}
        style={{ paddingRight: 36 }} />
      <button type="button" onClick={() => setShow(v => !v)} style={{
        position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
        background: 'none', border: 'none', cursor: 'pointer',
        color: 'var(--text-muted)', display: 'flex', alignItems: 'center',
      }}>
        {show ? <EyeOff size={14} /> : <Eye size={14} />}
      </button>
    </div>
  );
}

export default function SuperAdminShell() {
  const isAuthenticated = useSuperAdminStore(s => s.isAuthenticated());
  const admin           = useSuperAdminStore(s => s.admin);
  const logout          = useSuperAdminStore(s => s.logout);
  const navigate        = useNavigate();
  const [collapsed,    setCollapsed]    = useState(false);
  const [changePwOpen, setChangePwOpen] = useState(false);
  const [newPassword,  setNewPassword]  = useState('');

  const resetPwd = useMutation({
    mutationFn: (password) => resetAdminPassword(admin.id, { password }),
    onSuccess: () => {
      toast.success('Password updated');
      setChangePwOpen(false);
      setNewPassword('');
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  if (!isAuthenticated) return <Navigate to="/super-admin/login" replace />;

  const handleLogout = () => { logout(); navigate('/super-admin/login', { replace: true }); };
  const w = collapsed ? 64 : 220;

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg-page)' }}>

      {/* Sidebar */}
      <nav style={{
        width: w, flexShrink: 0, transition: 'width 200ms ease',
        background: '#0E0805',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', flexDirection: 'column', overflowY: 'auto', overflowX: 'hidden',
      }}>
        {/* Logo + collapse toggle */}
        <div style={{ padding: '16px 12px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, minHeight: 56 }}>
          {!collapsed && (
            <button onClick={() => setCollapsed(false)} style={{ background: 'none', border: 'none', cursor: 'default', padding: 0, flexShrink: 0 }}>
              <Logo size="xs" noLink />
            </button>
          )}
          {collapsed && (
            <button onClick={() => setCollapsed(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, margin: '0 auto' }}>
              <Logo size="xs" variant="icon" noLink />
            </button>
          )}
          {!collapsed && (
            <button onClick={() => setCollapsed(true)} style={{
              width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 6,
              cursor: 'pointer', color: 'rgba(255,235,210,0.5)', flexShrink: 0,
            }}>
              <ChevronLeft size={13} />
            </button>
          )}
        </div>

        {/* Platform badge */}
        {!collapsed && (
          <div style={{ margin: '0 12px 12px', padding: '4px 10px', background: 'rgba(234,108,10,.12)', border: '1px solid rgba(234,108,10,.2)', borderRadius: 6 }}>
            <span style={{ fontSize: 10, color: 'var(--brand)', fontWeight: 600 }}>⬡ Super Admin Console</span>
          </div>
        )}

        {/* Nav */}
        <div style={{ padding: '0 8px', flex: 1 }}>
          {!collapsed && (
            <div style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,235,210,0.3)', textTransform: 'uppercase', letterSpacing: '.7px', padding: '4px 8px 6px' }}>
              Platform
            </div>
          )}
          {NAV.map(item => (
            <NavLink
              key={item.to} to={item.to} end={item.exact}
              title={collapsed ? item.label : undefined}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: collapsed ? 0 : 10,
                justifyContent: collapsed ? 'center' : 'flex-start',
                padding: collapsed ? '10px 0' : '8px 12px', margin: '1px 0',
                borderRadius: 7, textDecoration: 'none',
                fontSize: 13, fontWeight: 500,
                background: isActive ? 'rgba(234,108,10,.18)' : 'transparent',
                color: isActive ? '#FFEAD0' : 'rgba(255,235,210,.5)',
                transition: 'all .15s',
              })}
            >
              <span style={{ width: 16, height: 16, flexShrink: 0 }}>{item.icon}</span>
              {!collapsed && item.label}
            </NavLink>
          ))}
        </div>

        {/* Expand button when collapsed */}
        {collapsed && (
          <div style={{ padding: '8px', display: 'flex', justifyContent: 'center' }}>
            <button onClick={() => setCollapsed(false)} style={{
              width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 6,
              cursor: 'pointer', color: 'rgba(255,235,210,0.5)',
            }}>
              <ChevronRight size={13} />
            </button>
          </div>
        )}

        {/* User section */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: collapsed ? '12px 8px' : '12px 16px', marginTop: 'auto' }}>
          {!collapsed && (
            <>
              <div style={{ fontSize: 12, color: '#FFEAD0', fontWeight: 600, marginBottom: 2 }}>{admin?.full_name || 'Admin'}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,235,210,0.4)', marginBottom: 8 }}>{admin?.email}</div>
              <button onClick={() => setChangePwOpen(true)} style={{
                width: '100%', padding: '6px 10px', marginBottom: 6,
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 6, color: 'rgba(255,235,210,0.7)', fontSize: 11, fontWeight: 500, cursor: 'pointer', textAlign: 'center',
              }}>
                Change Password
              </button>
            </>
          )}
          <button onClick={handleLogout} style={{
            width: '100%', padding: collapsed ? '7px 0' : '7px 10px',
            background: 'rgba(251,146,60,.1)', border: '1px solid rgba(251,146,60,.2)',
            borderRadius: 6, color: 'var(--s-red-text)', fontSize: collapsed ? 10 : 12,
            fontWeight: 600, cursor: 'pointer', textAlign: 'center',
          }}>
            {collapsed ? '→' : 'Sign Out'}
          </button>
        </div>
      </nav>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Topbar */}
        <div style={{
          height: 52, flexShrink: 0,
          background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-soft)',
          display: 'flex', alignItems: 'center', padding: '0 20px', gap: 12,
        }}>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Platform Administration Console</span>
          <div style={{ flex: 1 }} />
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
          <Outlet />
        </div>
      </div>

      {/* Change Password SlidePanel */}
      <SlidePanel open={changePwOpen} onClose={() => { setChangePwOpen(false); setNewPassword(''); }} title="Change Password">
        <form onSubmit={e => { e.preventDefault(); resetPwd.mutate(newPassword); }} className="space-y-4">
          <div className="form-group">
            <label className="label">Account</label>
            <input className="input" disabled value={admin?.email || ''} />
          </div>
          <div className="form-group">
            <label className="label" htmlFor="cp-pw">New Password *</label>
            <PasswordInput id="cp-pw" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={() => { setChangePwOpen(false); setNewPassword(''); }} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={newPassword.length < 8 || resetPwd.isPending} className="btn-primary">
              {resetPwd.isPending ? 'Saving…' : 'Update Password'}
            </button>
          </div>
        </form>
      </SlidePanel>
    </div>
  );
}

function GridIcon()     { return <svg viewBox="0 0 16 16" fill="currentColor" width="16" height="16"><path d="M1 1h6v6H1V1zm8 0h6v6H9V1zM1 9h6v6H1V9zm8 0h6v6H9V9z"/></svg>; }
function BuildingIcon() { return <svg viewBox="0 0 16 16" fill="currentColor" width="16" height="16"><path d="M2 1a1 1 0 011-1h10a1 1 0 011 1v14H2V1zm3 2v2h2V3H5zm4 0v2h2V3H9zm-4 4v2h2V7H5zm4 0v2h2V7H9zm-4 4v4h6v-4H5z"/></svg>; }
function ActivityIcon() { return <svg viewBox="0 0 16 16" fill="currentColor" width="16" height="16"><path d="M0 8a.5.5 0 01.5-.5h2l2-5 3 10 2-7 1 2.5H15.5a.5.5 0 010 1H10a.5.5 0 01-.46-.31L9 7.07l-2 7a.5.5 0 01-.96.02L4 5.62 2.54 8.5H.5A.5.5 0 010 8z"/></svg>; }
function MoneyIcon()    { return <svg viewBox="0 0 16 16" fill="currentColor" width="16" height="16"><path d="M8 1a7 7 0 100 14A7 7 0 008 1zm.75 9.5v.5a.75.75 0 01-1.5 0v-.5H6a.75.75 0 010-1.5h2.25a.25.25 0 000-.5h-1.5a1.75 1.75 0 110-3.5v-.5a.75.75 0 011.5 0v.5H9a.75.75 0 010 1.5H6.75a.25.25 0 000 .5h1.5a1.75 1.75 0 010 3.5z"/></svg>; }
function AdminIcon()    { return <svg viewBox="0 0 16 16" fill="currentColor" width="16" height="16"><path d="M8 8a3 3 0 100-6 3 3 0 000 6zm-5 6a5 5 0 0110 0H3z"/></svg>; }
function HeartIcon()    { return <svg viewBox="0 0 16 16" fill="currentColor" width="16" height="16"><path d="M8 2.748l-.717-.737C5.6.281 2.514.878 1.4 3.053c-.523 1.023-.641 2.5.314 4.385.92 1.815 2.834 3.989 6.286 6.357 3.452-2.368 5.365-4.542 6.286-6.357.955-1.886.838-3.362.314-4.385C13.486.878 10.4.28 8.717 2.01L8 2.748z"/></svg>; }