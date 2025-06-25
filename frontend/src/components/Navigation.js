import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';
import logo from '../assets/images/logo.jpg';

const Navigation = () => {
  const { currentUser, logout } = useAuth();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
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
    }
  };

  const renderNavLinks = () => {
    const links = [
      <Link key="home" to="/" className="nav-link">{t('navigation.home')}</Link>,
      <Link key="track" to="/track" className="nav-link">{t('navigation.trackPackage')}</Link>
    ];

    const authLinks = currentUser ? [
      <Link key="dashboard" to={getDashboardLink()} className="nav-link">{t('navigation.dashboard')}</Link>,
      <button key="logout" onClick={handleLogout} className="nav-link logout-btn">{t('navigation.logout')}</button>
    ] : [
      <Link key="login" to="/login" className="nav-link">{t('navigation.login')}</Link>,
      <Link key="register" to="/register" className="nav-link">{t('navigation.register')}</Link>
    ];

    const allLinks = [...links, ...authLinks];
    return i18n.language === 'ar' ? allLinks.reverse() : allLinks;
  };

  return (
    <nav className="main-nav">
      <div className="nav-container">
        <div className="nav-logo">
          <Link to="/">
            <img src={logo} alt={t('common.appName')} className="nav-logo-image" />
            <span className="logo-text">{t('common.appName')}</span>
          </Link>
        </div>

        <div className="nav-links">
          {renderNavLinks()}
          <LanguageSwitcher />
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
