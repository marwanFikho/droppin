import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navigation from './components/Navigation';
import './App.css';

// Pages (no more generic Register import)
import Home from './pages/Home';
import Login from './pages/Login';
import ShopRegister from './pages/ShopRegister';
import DriverRegister from './pages/Driver/Register';
import RegistrationSuccess from './pages/RegistrationSuccess';
import ShopDashboard from './pages/Shop/Dashboard';
import DriverDashboard from './pages/Driver/DriverDashboard';
import DriverDeliveries from './pages/Driver/Deliveries';
import DriverProfile from './pages/Driver/Profile';
import AdminDashboard from './pages/Admin/Dashboard';
import PackageTracking from './pages/PackageTracking';
import DriverScanPickup from './pages/Driver/ScanPickup';
import NotFound from './pages/NotFound';
import NewPickup from './pages/Shop/NewPickup';
import ShopPackages from './pages/Shop/ShopPackages';
import CreatePackage from './pages/Shop/CreatePackage';
import ShopProfile from './pages/Shop/ShopProfile';
import ShopWallet from './pages/Shop/Wallet';
import About from './pages/About';
import Careers from './pages/Careers';
import Contact from './pages/Contact';
import Help from './pages/Help';
import Services from './pages/Services';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';

// Unauthorized page component
const Unauthorized = () => (
  <div className="unauthorized-container">
    <h1>Access Denied</h1>
    <p>You don't have permission to access this page.</p>
    <button onClick={() => window.history.back()}>Go Back</button>
  </div>
);

// Protected route component (no user role references)
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { currentUser, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }
  
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(currentUser.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  const currentPath = window.location.pathname;
  const isAdminPath = currentPath.startsWith('/admin');
  const isShopPath = currentPath.startsWith('/shop');
  const isDriverPath = currentPath.startsWith('/driver');

  if ((isAdminPath && currentUser.role !== 'admin') ||
      (isShopPath && currentUser.role !== 'shop') ||
      (isDriverPath && currentUser.role !== 'driver')) {
    return <Navigate to="/unauthorized" replace />;
  }
  
  return children;
};

// Add some CSS for the loading container and unauthorized page
const styles = `
  .loading-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    background-color: #f8f9fa;
  }
  
  .loading-spinner {
    width: 50px;
    height: 50px;
    border: 5px solid #f3f3f3;
    border-top: 5px solid #3498db;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .unauthorized-container {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    background-color: #f8f9fa;
    text-align: center;
    padding: 20px;
  }

  .unauthorized-container h1 {
    color: #dc3545;
    margin-bottom: 20px;
  }

  .unauthorized-container p {
    color: #6c757d;
    margin-bottom: 30px;
  }

  .unauthorized-container button {
    padding: 10px 20px;
    background-color: #007bff;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-size: 16px;
    transition: background-color 0.2s;
  }

  .unauthorized-container button:hover {
    background-color: #0056b3;
  }
`;

// Add styles to document
const styleSheet = document.createElement("style");
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);

// DashboardHome component for the main dashboard content
const DashboardHome = () => <Outlet />;

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="App">
          <Navigation />
          <Routes>
            {/* Public routes - no more /register */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register/shop" element={<ShopRegister />} />
            <Route path="/register/driver" element={<DriverRegister />} />
            <Route path="/registration-success" element={<RegistrationSuccess />} />
            <Route path="/track/:trackingNumber?" element={<PackageTracking />} />
            <Route path="/unauthorized" element={<Unauthorized />} />

            {/* Public informational pages */}
            <Route path="/about" element={<About />} />
            <Route path="/careers" element={<Careers />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/help" element={<Help />} />
            <Route path="/services" element={<Services />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            
            {/* Role-based protected routes */}
            <Route 
              path="/shop/*" 
              element={
                <ProtectedRoute allowedRoles={['shop', 'admin']}>
                  <ShopDashboard />
                </ProtectedRoute>
              }
            >
              <Route index element={<DashboardHome />} />
              <Route path="packages" element={<ShopPackages />} />
              <Route path="create-package" element={<CreatePackage />} />
              <Route path="profile" element={<ShopProfile />} />
              <Route path="new-pickup" element={<NewPickup />} />
              <Route path="wallet" element={<ShopWallet />} />
            </Route>

            <Route 
              path="/driver/*" 
              element={
                <ProtectedRoute allowedRoles={['driver', 'admin']}>
                  <Routes>
                    <Route index element={<DriverDashboard />} />
                    <Route path="dashboard" element={<DriverDashboard />} />
                    <Route path="deliveries" element={<DriverDeliveries />} />
                    <Route path="profile" element={<DriverProfile />} />
                    <Route path="scan-pickup" element={<DriverScanPickup />} />
                  </Routes>
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/admin/*" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            
            {/* Not found route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
