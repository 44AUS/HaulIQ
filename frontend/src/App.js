import { useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { MessagingProvider } from './context/MessagingContext';
import { AppThemeProvider, useThemeMode } from './context/ThemeContext';
import { Box, CircularProgress } from '@mui/material';
import UpdateNotifier from './components/UpdateNotifier';

// Pages — Public
import Landing from './pages/Landing';
import Login from './pages/Login';
import Checkout from './pages/Checkout';
import TermsOfService from './pages/TermsOfService';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Contact from './pages/Contact';
import Careers from './pages/Careers';
import ManageSubscription from './pages/shared/ManageSubscription';

// Pages — Public (no auth)
import DriverInvite from './pages/public/DriverInvite';

// Pages — Driver
import DriverDashboard from './pages/driver/Dashboard';
import DriverLoads from './pages/driver/Loads';
import DriverLoadDetail from './pages/driver/LoadDetail';
import DriverEarnings from './pages/driver/Earnings';

// Pages — Carrier
import CarrierDashboard from './pages/carrier/Dashboard';
import LoadBoard from './pages/carrier/LoadBoard';
import LoadDetail from './pages/carrier/LoadDetail';
import ProfitCalculator from './pages/carrier/ProfitCalculator';
import EarningsBrain from './pages/carrier/EarningsBrain';
import SavedLoads from './pages/carrier/SavedLoads';
import LoadHistory from './pages/carrier/LoadHistory';
import CarrierAnalytics from './pages/carrier/Analytics';
import CarrierLoadsInProgress from './pages/carrier/LoadsInProgress';
import ActiveLoadDetail from './pages/carrier/ActiveLoadDetail';
import PlaceBid from './pages/carrier/PlaceBid';
import CarrierPayments from './pages/carrier/Payments';
import Equipment from './pages/carrier/Equipment';
import LaneWatches from './pages/carrier/LaneWatches';
import Drivers from './pages/carrier/Drivers';
import LoadManager from './pages/carrier/LoadManager';
import Tools from './pages/carrier/Tools';

// Pages — Broker
import BrokerDashboard from './pages/broker/Dashboard';
import BrokerPayments from './pages/broker/Payments';
import PostLoad from './pages/broker/PostLoad';
import ManageLoads from './pages/broker/ManageLoads';
import BrokerAnalytics from './pages/broker/BrokerAnalytics';
import BookingRequests from './pages/broker/BookingRequests';
import InstantBookSettings from './pages/broker/InstantBookSettings';
import BrokerLoadsInProgress from './pages/broker/LoadsInProgress';
import TruckBoard from './pages/broker/TruckBoard';
import TrackLoad from './pages/broker/TrackLoad';
import DispatchDetail from './pages/broker/DispatchDetail';
import BrokerLoadDetail from './pages/broker/LoadDetail';
import LoadTemplates from './pages/broker/LoadTemplates';

// Pages — Shared
import Messages from './pages/shared/Messages';
import Network from './pages/shared/Network';
import Documents from './pages/shared/Documents';
import BrokerProfile from './pages/shared/BrokerProfile';
import CarrierProfile from './pages/shared/CarrierProfile';
import Settings from './pages/shared/Settings';
import Preferences from './pages/shared/Preferences';
import Billing from './pages/shared/Billing';
import MapView from './pages/shared/MapView';
import CalendarPage from './pages/shared/CalendarPage';

// Pages — Admin
import AdminOverview from './pages/admin/AdminOverview';
import AdminUsers from './pages/admin/AdminUsers';
import AdminSubscriptions from './pages/admin/AdminSubscriptions';
import AdminRevenue from './pages/admin/AdminRevenue';
import AdminLoads from './pages/admin/AdminLoads';
import AdminWaitlist from './pages/admin/AdminWaitlist';
import AdminPayments from './pages/admin/AdminPayments';
import AdminPlans from './pages/admin/AdminPlans';
import AdminContacts from './pages/admin/AdminContacts';
import AdminEquipmentTypes from './pages/admin/AdminEquipmentTypes';
import AdminEquipmentClasses from './pages/admin/AdminEquipmentClasses';

// Layout
import DashboardLayout from './components/layout/DashboardLayout';

// ─── Brand color sync ─────────────────────────────────────────────────────────
function BrandColorSync() {
  const { user } = useAuth();
  const { setBrandColor } = useThemeMode();
  const prevIdRef = useRef(null);
  useEffect(() => {
    if (user?.id && user.id !== prevIdRef.current) {
      prevIdRef.current = user.id;
      if (user.brand_color) setBrandColor(user.brand_color);
    }
    if (!user) prevIdRef.current = null;
  }, [user?.id, user?.brand_color, setBrandColor]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

// ─── Route guards ─────────────────────────────────────────────────────────────
function roleDashboard(role) {
  if (role === 'admin')   return '/admin';
  if (role === 'driver')  return '/driver/dashboard';
  return `/${role}/dashboard`;
}

function ProtectedRoute({ children, requiredRole }) {
  const { user, loading } = useAuth();
  if (loading) return <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CircularProgress /></Box>;
  if (!user) return <Navigate to="/login" replace />;
  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to={roleDashboard(user.role)} replace />;
  }
  return children;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to={roleDashboard(user.role)} replace />;
  return children;
}

// ─── Driver routes ────────────────────────────────────────────────────────────
function DriverRoutes() {
  return (
    <ProtectedRoute requiredRole="driver">
      <DashboardLayout>
        <Routes>
          <Route path="dashboard" element={<DriverDashboard />} />
          <Route path="loads" element={<DriverLoads />} />
          <Route path="loads/:bookingId" element={<DriverLoadDetail />} />
          <Route path="earnings" element={<DriverEarnings />} />
          <Route path="messages" element={<Messages />} />
          <Route path="*" element={<Navigate to="dashboard" replace />} />
        </Routes>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

// ─── Carrier routes ──────────────────────────────────────────────────────────
function CarrierRoutes() {
  return (
    <ProtectedRoute requiredRole="carrier">
      <DashboardLayout>
        <Routes>
          <Route path="dashboard" element={<CarrierDashboard />} />
          <Route path="loads" element={<LoadBoard />} />
          <Route path="loads/:id" element={<LoadDetail />} />
          <Route path="calculator" element={<ProfitCalculator />} />
          <Route path="brain" element={<EarningsBrain />} />
          <Route path="saved" element={<SavedLoads />} />
          <Route path="history" element={<LoadHistory />} />
          <Route path="active" element={<CarrierLoadsInProgress />} />
          <Route path="active/:bookingId" element={<ActiveLoadDetail />} />
          <Route path="loads/:id/bid" element={<PlaceBid />} />
          <Route path="payments" element={<CarrierPayments />} />
          <Route path="analytics" element={<CarrierAnalytics />} />
          <Route path="equipment" element={<Equipment />} />
          <Route path="lane-watches" element={<LaneWatches />} />
          <Route path="drivers" element={<Drivers />} />
          <Route path="job-manager" element={<LoadManager />} />
          <Route path="tools" element={<Tools />} />
          <Route path="calendar" element={<CalendarPage />} />
          <Route path="network" element={<Network />} />
          <Route path="messages" element={<Messages />} />
          <Route path="documents" element={<Documents />} />
          <Route path="billing" element={<Billing />} />
          <Route path="subscription" element={<ManageSubscription />} />
          <Route path="*" element={<Navigate to="dashboard" replace />} />
        </Routes>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

// ─── Broker routes ───────────────────────────────────────────────────────────
function BrokerRoutes() {
  return (
    <ProtectedRoute requiredRole="broker">
      <DashboardLayout>
        <Routes>
          <Route path="dashboard" element={<BrokerDashboard />} />
          <Route path="post" element={<PostLoad />} />
          <Route path="loads" element={<ManageLoads />} />
          <Route path="loads/:id" element={<BrokerLoadDetail />} />
          <Route path="templates" element={<LoadTemplates />} />
          <Route path="analytics" element={<BrokerAnalytics />} />
          <Route path="messages" element={<Messages />} />
          <Route path="bookings" element={<BookingRequests />} />
          <Route path="instant-book" element={<InstantBookSettings />} />
          <Route path="payments" element={<BrokerPayments />} />
          <Route path="active" element={<BrokerLoadsInProgress />} />
          <Route path="trucks" element={<TruckBoard />} />
          <Route path="calendar" element={<CalendarPage />} />
          <Route path="track/:bookingId" element={<TrackLoad />} />
          <Route path="dispatch/:bookingId" element={<DispatchDetail />} />
          <Route path="network" element={<Network />} />
          <Route path="documents" element={<Documents />} />
          <Route path="billing" element={<Billing />} />
          <Route path="subscription" element={<ManageSubscription />} />
          <Route path="*" element={<Navigate to="dashboard" replace />} />
        </Routes>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

// ─── Admin routes ─────────────────────────────────────────────────────────────
function AdminRoutes() {
  return (
    <ProtectedRoute requiredRole="admin">
      <DashboardLayout>
        <Routes>
          <Route index element={<AdminOverview />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="loads" element={<AdminLoads />} />
          <Route path="subscriptions" element={<AdminSubscriptions />} />
          <Route path="revenue" element={<AdminRevenue />} />
          <Route path="waitlist" element={<AdminWaitlist />} />
          <Route path="payments" element={<AdminPayments />} />
          <Route path="plans" element={<AdminPlans />} />
          <Route path="equipment" element={<AdminEquipmentTypes />} />
          <Route path="equipment-classes" element={<AdminEquipmentClasses />} />
          <Route path="contacts" element={<AdminContacts />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

// ─── App root ─────────────────────────────────────────────────────────────────
function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/terms" element={<TermsOfService />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/careers" element={<Careers />} />
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/signup" element={<Navigate to="/" replace />} />
      <Route path="/checkout" element={<Checkout />} />
      <Route path="/b/:brokerId" element={
        <ProtectedRoute>
          <DashboardLayout><BrokerProfile /></DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/c/:carrierId" element={
        <ProtectedRoute>
          <DashboardLayout><CarrierProfile /></DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/settings" element={
        <ProtectedRoute>
          <DashboardLayout><Settings /></DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/preferences" element={
        <ProtectedRoute>
          <DashboardLayout><Preferences /></DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/preferences/branding" element={<Navigate to="/preferences?tab=branding" replace />} />
      <Route path="/map/:lat/:lng/:city/:name" element={<ProtectedRoute><DashboardLayout><MapView /></DashboardLayout></ProtectedRoute>} />
      <Route path="/map/:lat/:lng/:city" element={<ProtectedRoute><DashboardLayout><MapView /></DashboardLayout></ProtectedRoute>} />
      <Route path="/invite/driver" element={<DriverInvite />} />
      <Route path="/driver/*" element={<DriverRoutes />} />
      <Route path="/carrier/*" element={<CarrierRoutes />} />
      <Route path="/broker/*" element={<BrokerRoutes />} />
      <Route path="/admin/*" element={<AdminRoutes />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AppThemeProvider>
      <AuthProvider>
        <MessagingProvider>
          <BrowserRouter>
            <UpdateNotifier />
            <BrandColorSync />
            <AppRoutes />
          </BrowserRouter>
        </MessagingProvider>
      </AuthProvider>
    </AppThemeProvider>
  );
}
