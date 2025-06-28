import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import './MobileNavigation.css';

const MobileNavigation = () => {
  const { currentUser, logout } = useAuth();
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'ar' : 'en';
    i18n.changeLanguage(newLang);
  };

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
        { path: '/', label: t('navigation.home'), icon: '🏠' },
        { path: '/track', label: t('navigation.track'), icon: '📦' },
        { path: '/login', label: t('navigation.login'), icon: '🔐' }
      ];
    }

    switch (currentUser.role) {
      case 'shop':
        return [
          { path: '/shop', label: t('navigation.dashboard'), icon: '🏪' },
          { path: '/shop/packages', label: t('navigation.packages'), icon: '📦' },
          { path: '/shop/create-package', label: t('navigation.create'), icon: '➕' },
          { path: '/shop/new-pickup', label: t('navigation.pickup'), icon: '🚚' },
          { path: '/shop/wallet', label: t('navigation.wallet'), icon: '💰' }
        ];
      case 'driver':
        return [
          { path: '/driver', label: t('navigation.dashboard'), icon: '🚚' },
          { path: '/driver/profile', label: t('navigation.profile'), icon: '👤' }
        ];
      case 'user':
        return [
          { path: '/user', label: t('navigation.dashboard'), icon: '🏠' },
          { path: '/user/orders', label: t('navigation.orders'), icon: '📦' },
          { path: '/user/track', label: t('navigation.track'), icon: '🔍' },
          { path: '/user/profile', label: t('navigation.profile'), icon: '👤' }
        ];
      case 'admin':
        return [
          { path: '/admin', label: t('navigation.dashboard'), icon: '⚙️' },
          { path: '/admin/analytics', label: t('navigation.analytics'), icon: '📊' },
        ];
      default:
        return [
          { path: '/', label: t('navigation.home'), icon: '🏠' },
          { path: '/track', label: t('navigation.track'), icon: '📦' }
        ];
    }
  };

  const navigationItems = getNavigationItems();

  return (
    <>
      {/* Top navigation bar */}
      <nav className="mobile-top-nav" style={{ direction: 'ltr' }}>
        <div className="mobile-top-nav-content">
          <div className="mobile-logo">
            <Link to="/">
              <span className="mobile-logo-icon">📦</span>
              <span className="mobile-logo-text">{t('common.appName')}</span>
            </Link>
          </div>
          
          <div className="mobile-top-nav-actions">
            {/* Language Toggle */}
            <button onClick={toggleLanguage} className="mobile-lang-toggle-btn" aria-label="Toggle language">
              {i18n.language === 'en' ? t('common.switchToArabic') : t('common.switchToEnglish')}
              <svg className="mobile-lang-icon" width="16" height="16" viewBox="0 0 20 20" fill="currentColor" style={{marginLeft: '4px'}}>
                <g>
                  <path d="M3 7h10M3 7l3-3M3 7l3 3" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
                  <path d="M17 13H7M17 13l-3-3M17 13l-3 3" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
                </g>
              </svg>
            </button>
          
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