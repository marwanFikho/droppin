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
