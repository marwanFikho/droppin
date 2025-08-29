import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import MobileNavigation from './components/MobileNavigation';
import './App.css';

// Pages
import MobileHome from './pages/MobileHome';
import MobileLogin from './pages/MobileLogin';
import MobileRegister from './pages/MobileRegister';
import MobileShopRegister from './pages/Shop/MobileShopRegister';
import MobileDriverRegister from './pages/Driver/MobileDriverRegister';
import MobileRegistrationSuccess from './pages/MobileRegistrationSuccess';
import MobileShopDashboard from './pages/Shop/MobileShopDashboard';
import MobileDriverDashboard from './pages/Driver/MobileDriverDashboard';
import MobileDriverDeliveries from './pages/Driver/MobileDriverDeliveries';
import MobileDriverProfile from './pages/Driver/MobileDriverProfile';
import MobileUserDashboard from './pages/User/MobileUserDashboard';
import MobileAdminDashboard from './pages/Admin/MobileAdminDashboard';
import MobilePackageTracking from './pages/MobilePackageTracking';
import MobileNotFound from './pages/MobileNotFound';
import MobileShopPackages from './pages/Shop/MobileShopPackages';
import MobileShopCreatePackage from './pages/Shop/MobileShopCreatePackage';
import MobileShopProfile from './pages/Shop/MobileShopProfile';
import MobileShopNewPickup from './pages/Shop/MobileShopNewPickup';
import MobileShopWallet from './pages/Shop/MobileShopWallet';
import MobileAdminAnalytics from './pages/Admin/MobileAdminAnalytics';
import ScanPickup from './pages/Driver/ScanPickup';
import MobileUserProfile from './pages/User/MobileUserProfile';
// Informational Pages
import MobileAbout from './pages/MobileAbout';
import MobileCareers from './pages/MobileCareers';
import MobileContact from './pages/MobileContact';
import MobileHelp from './pages/MobileHelp';
import MobileServices from './pages/MobileServices';
import MobileTerms from './pages/MobileTerms';
import MobilePrivacy from './pages/MobilePrivacy';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="mobile-loading-container">
        <div className="mobile-loading-spinner">Loading...</div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(currentUser.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// Dashboard Layout Component
const DashboardLayout = () => {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="mobile-app">
      <MobileNavigation />
      <main className="mobile-main-content">
        <Outlet />
      </main>
    </div>
  );
};

// Global Mobile Header Component
const GlobalMobileHeader = () => {
  return (
    <header className="global-mobile-header">
      <div className="global-mobile-header-content">
        <Link to="/" className="global-mobile-logo">
          <span className="global-mobile-logo-icon">📦</span>
          <span className="global-mobile-logo-text">Droppin</span>
        </Link>
      </div>
    </header>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="mobile-app">
          <GlobalMobileHeader />
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<MobileHome />} />
            <Route path="/login" element={<MobileLogin />} />
            <Route path="/register" element={<MobileRegister />} />
            <Route path="/register/shop" element={<MobileShopRegister />} />
            <Route path="/register/driver" element={<MobileDriverRegister />} />
            <Route path="/registration-success" element={<MobileRegistrationSuccess />} />
            <Route path="/track" element={<MobilePackageTracking />} />
            <Route path="/track/:trackingNumber" element={<MobilePackageTracking />} />

            {/* Public Informational Pages */}
            <Route path="/about" element={<MobileAbout />} />
            <Route path="/careers" element={<MobileCareers />} />
            <Route path="/contact" element={<MobileContact />} />
            <Route path="/help" element={<MobileHelp />} />
            <Route path="/services" element={<MobileServices />} />
            <Route path="/terms" element={<MobileTerms />} />
            <Route path="/privacy" element={<MobilePrivacy />} />

            {/* Protected Dashboard Routes */}
            <Route path="/shop" element={
              <ProtectedRoute allowedRoles={['shop']}>
                <DashboardLayout />
              </ProtectedRoute>
            }>
              <Route index element={<MobileShopDashboard />} />
              <Route path="packages" element={<MobileShopPackages />} />
              <Route path="create-package" element={
                <ProtectedRoute allowedRoles={['shop']}>
                  <MobileShopCreatePackage />
                </ProtectedRoute>
              } />
              <Route path="profile" element={
                <ProtectedRoute allowedRoles={['shop']}>
                  <MobileShopProfile />
                </ProtectedRoute>
              } />
              <Route path="new-pickup" element={
                <ProtectedRoute allowedRoles={['shop']}>
                  <MobileShopNewPickup />
                </ProtectedRoute>
              } />
              <Route path="wallet" element={
                <ProtectedRoute allowedRoles={['shop']}>
                  <MobileShopWallet />
                </ProtectedRoute>
              } />
            </Route>

            <Route path="/driver" element={
              <ProtectedRoute allowedRoles={['driver']}>
                <DashboardLayout />
              </ProtectedRoute>
            }>
              <Route index element={<MobileDriverDashboard />} />
              <Route path="deliveries" element={
                <ProtectedRoute allowedRoles={['driver']}>
                  <MobileDriverDeliveries />
                </ProtectedRoute>
              } />
              <Route path="profile" element={
                <ProtectedRoute allowedRoles={['driver']}>
                  <MobileDriverProfile />
                </ProtectedRoute>
              } />
              <Route path="scan-pickup" element={<ScanPickup />} />
            </Route>

            <Route path="/user" element={
              <ProtectedRoute allowedRoles={['user']}>
                <DashboardLayout />
              </ProtectedRoute>
            }>
              <Route index element={<MobileUserDashboard />} />
              <Route path="profile" element={<MobileUserProfile />} />
            </Route>

            <Route path="/admin" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <DashboardLayout />
              </ProtectedRoute>
            }>
              <Route index element={<MobileAdminDashboard />} />
              <Route path="analytics" element={<MobileAdminAnalytics />} />
            </Route>

            {/* 404 Route */}
            <Route path="*" element={<MobileNotFound />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App; 