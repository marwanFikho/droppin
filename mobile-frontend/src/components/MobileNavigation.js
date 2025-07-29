import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './MobileNavigation.css';
import { notificationService } from '../services/api';
import { FaBell } from 'react-icons/fa';

const MobileNavigation = () => {
  const { currentUser, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // NOTE: All React hooks must be called at the top level, not conditionally!
  const [showNotifications, setShowNotifications] = React.useState(false);
  const [notifications, setNotifications] = React.useState([]);
  const [loadingNotifications, setLoadingNotifications] = React.useState(false);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const notificationDropdownRef = React.useRef(null);

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

  // All useState, useRef, useEffect hooks must be above this line
  // Fetch notifications when dropdown is opened
  React.useEffect(() => {
    if (showNotifications && currentUser && (currentUser.role === 'admin' || currentUser.role === 'shop')) {
      setLoadingNotifications(true);
      notificationService.getNotifications(currentUser.id, currentUser.role)
        .then(res => {
          setNotifications(res.data);
          setLoadingNotifications(false);
          // Mark all as read
          if (res.data.some(n => !n.isRead)) {
            notificationService.markAllRead(currentUser.id, currentUser.role).then(() => {
              setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
              setUnreadCount(0);
            });
          }
        })
        .catch(() => setLoadingNotifications(false));
    }
  }, [showNotifications, currentUser]);

  // Fetch unread count on mount or when currentUser changes
  React.useEffect(() => {
    if (currentUser && (currentUser.role === 'admin' || currentUser.role === 'shop')) {
      notificationService.getNotifications(currentUser.id, currentUser.role)
        .then(res => setUnreadCount(res.data.filter(n => !n.isRead).length))
        .catch(() => setUnreadCount(0));
    }
  }, [currentUser]);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    function handleClickOutside(event) {
      if (notificationDropdownRef.current && !notificationDropdownRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    }
    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications]);

  // Now move the conditional return here:
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