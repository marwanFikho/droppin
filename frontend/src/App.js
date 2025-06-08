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

// Protected route component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { currentUser, loading } = useAuth();
  const { t } = useTranslation();
  
  // If still loading, show loading spinner
  if (loading) {
    return <div className="loading-spinner">{t('common.loading')}</div>;
  }
  
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
  
  return children;
};

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
            
            {/* Role-based protected routes */}
            <Route 
              path="/shop/*" 
              element={
                <ProtectedRoute allowedRoles={['shop', 'admin']}>
                  <ShopDashboard />
                </ProtectedRoute>
              } 
            />
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
