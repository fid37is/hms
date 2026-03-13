import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/authStore';
import AppShell from './components/layout/AppShell';

// Pages
import LandingPage             from './pages/LandingPage';
import LoginPage               from './pages/LoginPage';
import RegisterPage            from './pages/RegisterPage';
import ForgotPasswordPage      from './pages/ForgotPasswordPage';
import ResetPasswordPage       from './pages/ResetPasswordPage';
import ForceChangePasswordPage from './pages/ForceChangePasswordPage';
import OnboardingPage          from './pages/OnboardingPage';
import DashboardPage           from './pages/DashboardPage';
import NotFoundPage            from './pages/NotFoundPage';
import TermsPage               from './pages/TermsPage';
import PrivacyPage             from './pages/PrivacyPage';

// Help pages (public)
import HelpPage     from './pages/HelpPage';
import DocsPage     from './pages/help/DocsPage';
import SupportPage  from './pages/help/SupportPage';
import FeedbackPage from './pages/help/FeedbackPage';
import StatusPage   from './pages/help/StatusPage';

// Modules
import RoomsPage         from './modules/rooms/RoomsPage';
import ReservationsPage  from './modules/reservations/ReservationsPage';
import GuestsPage        from './modules/guests/GuestsPage';
import GuestProfilePage  from './modules/guests/GuestProfilePage';
import FolioPage         from './modules/billing/FolioPage';
import BillingPage       from './modules/billing/BillingPage';
import HousekeepingPage  from './modules/housekeeping/HousekeepingPage';
import InventoryPage     from './modules/inventory/InventoryPage';
import MaintenancePage   from './modules/maintenance/MaintenancePage';
import StaffPage         from './modules/staff/StaffPage';
import ReportsPage       from './modules/reports/ReportsPage';
import ChatPage          from './modules/chat/ChatPage';
import SettingsPage      from './modules/settings/SettingsPage';
import CustomizePage     from './modules/settings/pages/CustomizePage';
import FnbPage           from './modules/fnb/FnbPage';
import NightAuditPage    from './modules/nightAudit/NightAuditPage';
import EventsPage        from './modules/events/EventsPage';

// Guard: blocked if not logged in, or if must change password
function Guard({ children }) {
  const token              = useAuthStore(s => s.token);
  const mustChangePassword = useAuthStore(s => s.mustChangePassword);
  if (!token)             return <Navigate to="/login" replace />;
  if (mustChangePassword) return <Navigate to="/change-password" replace />;
  return children;
}

function PublicRoute({ children }) {
  const token = useAuthStore(s => s.token);
  return token ? <Navigate to="/dashboard" replace /> : children;
}

function ChangePasswordRoute({ children }) {
  const token = useAuthStore(s => s.token);
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

function AuthRoute({ children }) {
  const token = useAuthStore(s => s.token);
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <>
      <Toaster position="top-right"
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
        {/* Landing */}
        <Route path="/" element={<LandingPage />} />

        {/* Auth */}
        <Route path="/login"           element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/register"        element={<PublicRoute><RegisterPage /></PublicRoute>} />
        <Route path="/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />
        <Route path="/reset-password"  element={<ResetPasswordPage />} />

        {/* Force password change */}
        <Route path="/change-password" element={
          <ChangePasswordRoute><ForceChangePasswordPage /></ChangePasswordRoute>
        } />

        {/* Onboarding */}
        <Route path="/onboarding" element={
          <AuthRoute><OnboardingPage /></AuthRoute>
        } />

        {/* Public pages — no auth required */}
        <Route path="/help"          element={<HelpPage />} />
        <Route path="/help/docs"     element={<DocsPage />} />
        <Route path="/help/support"  element={<SupportPage />} />
        <Route path="/help/feedback" element={<FeedbackPage />} />
        <Route path="/help/status"   element={<StatusPage />} />
        <Route path="/terms"         element={<TermsPage />} />
        <Route path="/privacy"       element={<PrivacyPage />} />

        {/* Protected app — inside AppShell */}
        <Route element={<Guard><AppShell /></Guard>}>
          <Route path="/dashboard"    element={<DashboardPage />} />
          <Route path="/rooms"        element={<RoomsPage />} />
          <Route path="/reservations" element={<ReservationsPage />} />
          <Route path="/guests"       element={<GuestsPage />} />
          <Route path="/guests/:id"   element={<GuestProfilePage />} />
          <Route path="/billing"      element={<BillingPage />} />
          <Route path="/folio/:id"    element={<FolioPage />} />
          <Route path="/housekeeping" element={<HousekeepingPage />} />
          <Route path="/inventory"    element={<InventoryPage />} />
          <Route path="/maintenance"  element={<MaintenancePage />} />
          <Route path="/staff"        element={<StaffPage />} />
          <Route path="/reports"      element={<ReportsPage />} />
          <Route path="/chat"         element={<ChatPage />} />
          <Route path="/fnb"          element={<FnbPage />} />
          <Route path="/night-audit"  element={<NightAuditPage />} />
          <Route path="/events"       element={<EventsPage />} />
          <Route path="/settings"     element={<SettingsPage />} />
        </Route>

        {/* Full-screen customizer — protected but no AppShell */}
        <Route path="/settings/customize" element={<Guard><CustomizePage /></Guard>} />

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  );
}