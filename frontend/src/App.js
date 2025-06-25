import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navigation from './components/Navigation';
import './App.css';
import './i18n';
import { useTranslation } from 'react-i18next';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ShopRegister from './pages/ShopRegister';
import DriverRegister from './pages/DriverRegister';
import RegistrationSuccess from './pages/RegistrationSuccess';
import ShopDashboard from './pages/Shop/Dashboard';
import DriverDashboard from './pages/Driver/Dashboard';
import UserDashboard from './pages/User/Dashboard';
import AdminDashboard from './pages/Admin/Dashboard';
import PackageTracking from './pages/PackageTracking';
import NotFound from './pages/NotFound';
import NewPickup from './pages/Shop/NewPickup';
import ShopPackages from './pages/Shop/ShopPackages';
import CreatePackage from './pages/Shop/CreatePackage';
import ShopProfile from './pages/Shop/ShopProfile';

// Unauthorized page component
const Unauthorized = () => (
  <div className="unauthorized-container">
    <h1>Access Denied</h1>
    <p>You don't have permission to access this page.</p>
    <button onClick={() => window.history.back()}>Go Back</button>
  </div>
);

// Protected route component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { currentUser, loading } = useAuth();
  const { t } = useTranslation();
  
  // If still loading, show loading spinner
  if (loading) {
    return <div className="loading-spinner">{t('common.loading')}</div>;
  }
  
  // If no user, redirect to login
  // If no user, redirect to login
  if (!currentUser) {
    // Clear any stale tokens
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    return <Navigate to="/login" />;
  }
  
  // Check role access
  if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
    return <Navigate to="/unauthorized" />;
  }

  // Additional check to prevent cross-role access
  const currentPath = window.location.pathname;
  const isAdminPath = currentPath.startsWith('/admin');
  const isShopPath = currentPath.startsWith('/shop');
  const isDriverPath = currentPath.startsWith('/driver');
  const isUserPath = currentPath.startsWith('/user');

  // Check if user is trying to access a dashboard that doesn't match their role
  if ((isAdminPath && currentUser.role !== 'admin') ||
      (isShopPath && currentUser.role !== 'shop') ||
      (isDriverPath && currentUser.role !== 'driver') ||
      (isUserPath && currentUser.role !== 'user')) {
    return <Navigate to="/unauthorized" replace />;
  }
  
  // If authorized, render the protected content
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
  const { i18n } = useTranslation();

  useEffect(() => {
    // Function to toggle RTL stylesheet
    const toggleRTLStylesheet = (isRTL) => {
      const rtlStylesheet = document.getElementById('rtl-stylesheet');
      const ltrStylesheet = document.querySelector('link[href*="bootstrap.min.css"]:not([href*="rtl"])');
      
      if (isRTL) {
        if (rtlStylesheet) rtlStylesheet.removeAttribute('disabled');
        if (ltrStylesheet) ltrStylesheet.setAttribute('disabled', '');
      } else {
        if (rtlStylesheet) rtlStylesheet.setAttribute('disabled', '');
        if (ltrStylesheet) ltrStylesheet.removeAttribute('disabled');
      }
    };

    // Set document direction and language
    const isRTL = i18n.language === 'ar';
    document.documentElement.lang = i18n.language;
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.body.classList.toggle('rtl', isRTL);
    
    // Toggle RTL stylesheet
    toggleRTLStylesheet(isRTL);

    // Cleanup function
    return () => {
      document.body.classList.remove('rtl');
    };
  }, [i18n.language]);

  return (
    <Router>
      <AuthProvider>
        <div className={`App ${i18n.language === 'ar' ? 'rtl' : ''}`}>
          <Navigation />
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/register/shop" element={<ShopRegister />} />
            <Route path="/register/driver" element={<DriverRegister />} />
            <Route path="/registration-success" element={<RegistrationSuccess />} />
            <Route path="/track/:trackingNumber?" element={<PackageTracking />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
            
            {/* Role-based protected routes */}
            <Route 
              path="/shop/*" 
              element={
                <ProtectedRoute allowedRoles={['shop', 'admin']}>
                  <ShopDashboard />
                </ProtectedRoute>
              }
            >
              <Route index element={
                // The dashboard main content (previously in ShopDashboard)
                <DashboardHome />
              } />
              <Route path="packages" element={<ShopPackages />} />
              <Route path="create-package" element={<CreatePackage />} />
              <Route path="profile" element={<ShopProfile />} />
              <Route path="new-pickup" element={<NewPickup />} />
            </Route>
            <Route 
              path="/driver/*" 
              element={
                <ProtectedRoute allowedRoles={['driver', 'admin']}>
                  <DriverDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/user/*" 
              element={
                <ProtectedRoute allowedRoles={['user', 'shop', 'driver', 'admin']}>
                  <UserDashboard />
                </ProtectedRoute>
              } 
            />
            {/* Admin route - single route to handle all admin paths */}
            <Route 
              path="/admin/*" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            
            {/* Not found route */}
            <Route path="*" element={<Navigate to="/login" />} />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
