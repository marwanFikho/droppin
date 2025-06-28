import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/images/logo.jpg';
import { useTranslation } from 'react-i18next';

const Navigation = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { t, i18n } = useTranslation();

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsMenuOpen(false); // Close menu on logout
  };

  // Get dashboard link based on user role
  const getDashboardLink = () => {
    if (!currentUser) return null;
    
    switch (currentUser.role) {
      case 'shop':
        return '/shop';
      case 'driver':
        return '/driver';
      case 'admin':
        return '/admin';
      case 'user':
        return '/user';
      default:
        return null;
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'ar' : 'en';
    i18n.changeLanguage(newLang);
  };

  return (
    <nav className="main-nav" style={{ direction: 'ltr' }}>
      <div className="nav-container">
        <div className="nav-logo">
          <Link to="/" onClick={closeMenu}>
            <img src={logo} alt="Droppin Logo" className="nav-logo-image" />
            <span className="logo-text">{t('common.appName')}</span>
          </Link>
        </div>

        <button className="hamburger-menu" onClick={toggleMenu}>
          {isMenuOpen ? '✕' : '☰'}
        </button>

        <div className={`nav-links ${isMenuOpen ? 'open' : ''}`}>
          <Link to="/" className="nav-link" onClick={closeMenu}>{t('navigation.home')}</Link>
          <Link to="/track" className="nav-link" onClick={closeMenu}>{t('navigation.trackPackage')}</Link>
          
          {currentUser ? (
            <>
              {getDashboardLink() && (
                <Link to={getDashboardLink()} className="nav-link" onClick={closeMenu}>
                  {t('navigation.dashboard')}
                </Link>
              )}
              <button onClick={handleLogout} className="nav-link logout-btn">{t('navigation.logout')}</button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link" onClick={closeMenu}>{t('navigation.login')}</Link>
              <Link to="/register" className="nav-link" onClick={closeMenu}>{t('navigation.register')}</Link>
            </>
          )}
          
          {/* Language toggle on the far right */}
          <button onClick={toggleLanguage} className="nav-link lang-toggle-btn">
            {i18n.language === 'en' ? t('common.switchToArabic') : t('common.switchToEnglish')}
            <svg className="lang-icon" width="18" height="18" viewBox="0 0 20 20" fill="currentColor" style={{marginLeft: '4px'}}>
              <g>
                <path d="M3 7h10M3 7l3-3M3 7l3 3" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
                <path d="M17 13H7M17 13l-3-3M17 13l-3 3" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
              </g>
            </svg>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
