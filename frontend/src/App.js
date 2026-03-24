import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { MessagingProvider } from './context/MessagingContext';

// Pages — Public
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Checkout from './pages/Checkout';
import ManageSubscription from './pages/shared/ManageSubscription';

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

// Pages — Broker
import BrokerDashboard from './pages/broker/Dashboard';
import PostLoad from './pages/broker/PostLoad';
import ManageLoads from './pages/broker/ManageLoads';
import BrokerAnalytics from './pages/broker/BrokerAnalytics';
import BookingRequests from './pages/broker/BookingRequests';
import InstantBookSettings from './pages/broker/InstantBookSettings';
import BrokerLoadsInProgress from './pages/broker/LoadsInProgress';
import TrackLoad from './pages/broker/TrackLoad';
import BrokerLoadDetail from './pages/broker/LoadDetail';

// Pages — Shared
import Messages from './pages/shared/Messages';
import Network from './pages/shared/Network';
import BrokerProfile from './pages/shared/BrokerProfile';
import CarrierProfile from './pages/shared/CarrierProfile';
import Settings from './pages/shared/Settings';

// Pages — Admin
import AdminOverview from './pages/admin/AdminOverview';
import AdminUsers from './pages/admin/AdminUsers';
import AdminSubscriptions from './pages/admin/AdminSubscriptions';
import AdminRevenue from './pages/admin/AdminRevenue';
import AdminLoads from './pages/admin/AdminLoads';
import AdminWaitlist from './pages/admin/AdminWaitlist';

// Layout
import DashboardLayout from './components/layout/DashboardLayout';

// ─── Route guards ─────────────────────────────────────────────────────────────
function ProtectedRoute({ children, requiredRole }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-dark-900 flex items-center justify-center"><div className="w-8 h-8 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (requiredRole && user.role !== requiredRole) {
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
    return <Navigate to={`/${user.role}/dashboard`} replace />;
  }
  return children;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) {
    if (user.role === 'admin')  return <Navigate to="/admin" replace />;
    if (user.role === 'broker') return <Navigate to="/broker/dashboard" replace />;
    return <Navigate to="/carrier/dashboard" replace />;
  }
  return children;
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
          <Route path="analytics" element={<CarrierAnalytics />} />
          <Route path="network" element={<Network />} />
          <Route path="messages" element={<Messages />} />
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
          <Route path="analytics" element={<BrokerAnalytics />} />
          <Route path="messages" element={<Messages />} />
          <Route path="bookings" element={<BookingRequests />} />
          <Route path="instant-book" element={<InstantBookSettings />} />
          <Route path="active" element={<BrokerLoadsInProgress />} />
          <Route path="track/:bookingId" element={<TrackLoad />} />
          <Route path="network" element={<Network />} />
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
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
      <Route path="/checkout" element={<Checkout />} />
      <Route path="/broker-profile/:brokerId" element={
        <ProtectedRoute>
          <DashboardLayout><BrokerProfile /></DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/carrier-profile/:carrierId" element={
        <ProtectedRoute>
          <DashboardLayout><CarrierProfile /></DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/settings" element={
        <ProtectedRoute>
          <DashboardLayout><Settings /></DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/carrier/*" element={<CarrierRoutes />} />
      <Route path="/broker/*" element={<BrokerRoutes />} />
      <Route path="/admin/*" element={<AdminRoutes />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MessagingProvider>
        <BrowserRouter>
          <div className="dark">
            <AppRoutes />
          </div>
        </BrowserRouter>
      </MessagingProvider>
    </AuthProvider>
  );
}
