import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navigation from './components/Navigation';
import './App.css';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ShopRegister from './pages/ShopRegister';
import DriverRegister from './pages/DriverRegister';
import ShopDashboard from './pages/ShopDashboard';
import CreatePackage from './pages/CreatePackage';
import EditPackage from './pages/EditPackage';
import EditShopProfile from './pages/EditShopProfile';
import DriverDashboard from './pages/Driver/Dashboard';
import UserDashboard from './pages/User/Dashboard';
import AdminDashboard from './pages/Admin/Dashboard';
import PackageTracking from './pages/PackageTracking';
import NotFound from './pages/NotFound';
import RegistrationConfirmation from './pages/RegistrationConfirmation';

// Protected route component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { currentUser, loading } = useAuth();
  
  if (loading) {
    return <div className="loading-spinner">Loading...</div>;
  }
  
  if (!currentUser) {
    return <Navigate to="/login" />;
  }
  
  if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
    return <Navigate to="/unauthorized" />;
  }
  
  return children;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="App">
          <Navigation />
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/register/shop" element={<ShopRegister />} />
            <Route path="/register/driver" element={<DriverRegister />} />
            <Route path="/registration-confirmation" element={<RegistrationConfirmation />} />
            <Route path="/track/:trackingNumber?" element={<PackageTracking />} />
            
            {/* Role-based protected routes */}
            <Route 
              path="/shop/*" 
              element={
                <ProtectedRoute allowedRoles={['shop', 'admin']}>
                  <Routes>
                    <Route path="/" element={<ShopDashboard />} />
                    <Route path="package/create" element={<CreatePackage />} />
                    <Route path="package/edit/:id" element={<EditPackage />} />
                    <Route path="profile/edit" element={<EditShopProfile />} />
                  </Routes>
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
