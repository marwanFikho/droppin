import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './MobileNavigation.css';

const MobileNavigation = () => {
  const { currentUser, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Don't show navigation on certain pages
  const hideNavigationOn = ['/login', '/register', '/register/shop', '/register/driver', '/registration-success'];
  if (hideNavigationOn.includes(location.pathname)) {
    return null;
  }

  // Get navigation items based on user role
  const getNavigationItems = () => {
    if (!currentUser) {
      return [
        { path: '/', label: 'Home', icon: '🏠' },
        { path: '/track', label: 'Track', icon: '📦' },
        { path: '/login', label: 'Login', icon: '🔐' }
      ];
    }

    switch (currentUser.role) {
      case 'shop':
        return [
          { path: '/shop', label: 'Dashboard', icon: '🏪' },
          { path: '/shop/packages', label: 'Packages', icon: '📦' },
          { path: '/shop/create-package', label: 'Create', icon: '➕' },
          { path: '/shop/new-pickup', label: 'Pickup', icon: '🚚' },
          { path: '/shop/wallet', label: 'Wallet', icon: '💰' }
        ];
      case 'driver':
        return [
          { path: '/driver', label: 'Dashboard', icon: '🚚' },
          { path: '/driver/profile', label: 'Profile', icon: '👤' }
        ];
      case 'user':
        return [
          { path: '/user', label: 'Dashboard', icon: '🏠' },
          { path: '/user/orders', label: 'Orders', icon: '📦' },
          { path: '/user/track', label: 'Track', icon: '🔍' },
          { path: '/user/profile', label: 'Profile', icon: '👤' }
        ];
      case 'admin':
        return [
          { path: '/admin', label: 'Dashboard', icon: '⚙️' },
          { path: '/admin/analytics', label: 'Analytics', icon: '📊' },
        ];
      default:
        return [
          { path: '/', label: 'Home', icon: '🏠' },
          { path: '/track', label: 'Track', icon: '📦' }
        ];
    }
  };

  const navigationItems = getNavigationItems();

  return (
    <>
      {/* Top navigation bar */}
      <nav className="mobile-top-nav">
        <div className="mobile-top-nav-content">
          <div className="mobile-logo">
            <Link to="/">
              <span className="mobile-logo-icon">📦</span>
              <span className="mobile-logo-text">Droppin</span>
            </Link>
          </div>
          
          {currentUser && (
            <div className="mobile-user-menu">
              <div className="mobile-user-info">
                <span className="mobile-user-name">{currentUser.name || currentUser.email}</span>
                <span className="mobile-user-role">{currentUser.role}</span>
              </div>
              <button 
                onClick={handleLogout}
                className="mobile-logout-btn"
                aria-label="Logout"
              >
                🚪
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Bottom navigation bar */}
      <nav className="mobile-bottom-nav">
        <div className="mobile-bottom-nav-content">
          {navigationItems.map((item) => {
            let isActive = false;
            if (item.path === '/shop') {
              isActive = location.pathname === '/shop';
            } else {
              isActive = location.pathname === item.path;
            }
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`mobile-nav-item ${isActive ? 'active' : ''}`}
              >
                <span className="mobile-nav-icon">{item.icon}</span>
                <span className="mobile-nav-label">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
};

export default MobileNavigation; 