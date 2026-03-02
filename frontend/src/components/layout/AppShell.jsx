import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar    from './Sidebar';
import BottomNav  from './BottomNav';
import Header     from './Header';
import { useUIStore } from '../../store/uiStore';

export default function AppShell() {
  const { sidebarOpen, setSidebar } = useUIStore();
  const { pathname } = useLocation();

  // Only close sidebar on nav on MOBILE — leave desktop state alone
  useEffect(() => {
    if (window.innerWidth < 768) setSidebar(false);
  }, [pathname]);

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: 'var(--bg-page)' }}>

      {/* ── Desktop sidebar — participates in flex layout ── */}
      <div
        className="hidden md:flex flex-col flex-shrink-0 h-full transition-all duration-200"
        style={{ width: sidebarOpen ? '240px' : '64px' }}
      >
        <Sidebar />
      </div>

      {/* ── Mobile overlay ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 md:hidden"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={() => setSidebar(false)}
        />
      )}

      {/* ── Mobile slide-in sidebar ── */}
      <div
        className={`fixed left-0 top-0 h-full z-30 md:hidden transition-transform duration-200 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar />
      </div>

      {/* ── Main content — takes remaining flex space ── */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 md:pb-6 page-enter">
          <Outlet />
        </main>
      </div>

      {/* ── Mobile bottom nav ── */}
      <BottomNav />
    </div>
  );
}