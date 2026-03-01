import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/authStore';
import AppShell from './components/layout/AppShell';

// Pages
import LoginPage       from './pages/LoginPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage  from './pages/ResetPasswordPage';
import DashboardPage   from './pages/DashboardPage';
import NotFoundPage    from './pages/NotFoundPage';

// Modules
import RoomsPage          from './modules/rooms/RoomsPage';
import ReservationsPage   from './modules/reservations/ReservationsPage';
import GuestsPage         from './modules/guests/GuestsPage';
import GuestProfilePage   from './modules/guests/GuestProfilePage';
import FolioPage          from './modules/billing/FolioPage';
import HousekeepingPage   from './modules/housekeeping/HousekeepingPage';
import InventoryPage      from './modules/inventory/InventoryPage';
import MaintenancePage    from './modules/maintenance/MaintenancePage';
import StaffPage          from './modules/staff/StaffPage';
import ReportsPage        from './modules/reports/ReportsPage';
import SettingsPage       from './modules/settings/SettingsPage';

function Guard({ children }) {
  const token = useAuthStore(s => s.token);
  return token ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const token = useAuthStore(s => s.token);
  return token ? <Navigate to="/dashboard" replace /> : children;
}

export default function App() {
  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background:   'var(--bg-surface)',
            color:        'var(--text-base)',
            border:       '1px solid var(--border-soft)',
            borderRadius: '8px',
            fontSize:     '13px',
          },
        }}
      />
      <Routes>
        <Route path="/login"           element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />
        <Route path="/reset-password"  element={<ResetPasswordPage />} />

        <Route element={<Guard><AppShell /></Guard>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard"    element={<DashboardPage />} />
          <Route path="/rooms"        element={<RoomsPage />} />
          <Route path="/reservations" element={<ReservationsPage />} />
          <Route path="/guests"       element={<GuestsPage />} />
          <Route path="/guests/:id"   element={<GuestProfilePage />} />
          <Route path="/folio/:id"    element={<FolioPage />} />
          <Route path="/housekeeping" element={<HousekeepingPage />} />
          <Route path="/inventory"    element={<InventoryPage />} />
          <Route path="/maintenance"  element={<MaintenancePage />} />
          <Route path="/staff"        element={<StaffPage />} />
          <Route path="/reports"      element={<ReportsPage />} />
          <Route path="/settings"     element={<SettingsPage />} />
          <Route path="*"             element={<NotFoundPage />} />
        </Route>
      </Routes>
    </>
  );
}