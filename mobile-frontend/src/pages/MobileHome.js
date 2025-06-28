import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './MobileHome.css';
import { useTranslation } from 'react-i18next';

const MobileHome = () => {
  const { currentUser } = useAuth();
  const { t } = useTranslation();

  const features = [
    {
      icon: '📦',
      title: t('home.features.tracking.title'),
      description: t('home.features.tracking.description')
    },
    {
      icon: '🚚',
      title: t('home.features.delivery.title'),
      description: t('home.features.delivery.description')
    },
    {
      icon: '🏪',
      title: t('home.features.shop.title'),
      description: t('home.features.shop.description')
    },
    {
      icon: '👤',
      title: t('home.features.dashboard.title'),
      description: t('home.features.dashboard.description')
    }
  ];

  const getDashboardLink = () => {
    if (!currentUser) return '/login';
    
    switch (currentUser.role) {
      case 'shop': return '/shop';
      case 'driver': return '/driver';
      case 'user': return '/user';
      case 'admin': return '/admin';
      default: return '/login';
    }
  };

  return (
    <div className="mobile-home">
      {/* Hero Section */}
      <section className="mobile-hero">
        <div className="mobile-hero-content">
          <div className="mobile-hero-icon">📦</div>
          <h1 className="mobile-hero-title">{t('home.hero.title')}</h1>
          <p className="mobile-hero-subtitle">
            {t('home.hero.subtitle')}
          </p>
          
          <div className="mobile-hero-actions">
            {currentUser ? (
              <Link to={getDashboardLink()} className="btn btn-primary">
                {t('home.hero.ctaDashboard')}
              </Link>
            ) : (
              <>
                <Link to="/login" className="btn btn-primary">
                  {t('home.hero.ctaLogin')}
                </Link>
                <Link to="/register" className="btn btn-outline">
                  {t('home.hero.ctaRegister')}
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="mobile-features">
        <div className="mobile-features-content">
          <h2 className="mobile-features-title">{t('home.features.title')}</h2>
          
          <div className="mobile-features-grid">
            {features.map((feature, index) => (
              <div key={index} className="mobile-feature-card">
                <div className="mobile-feature-icon">{feature.icon}</div>
                <h3 className="mobile-feature-title">{feature.title}</h3>
                <p className="mobile-feature-description">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Actions Section */}
      <section className="mobile-quick-actions">
        <div className="mobile-quick-actions-content">
          <h2 className="mobile-quick-actions-title">{t('home.quickActions.title')}</h2>
          
          <div className="mobile-quick-actions-grid">
            <Link to="/track" className="mobile-quick-action-card">
              <div className="mobile-quick-action-icon">🔍</div>
              <span className="mobile-quick-action-label">{t('home.quickActions.track')}</span>
            </Link>
            
            {!currentUser && (
              <>
                <Link to="/register/shop" className="mobile-quick-action-card">
                  <div className="mobile-quick-action-icon">🏪</div>
                  <span className="mobile-quick-action-label">{t('home.quickActions.registerShop')}</span>
                </Link>
                
                <Link to="/register/driver" className="mobile-quick-action-card">
                  <div className="mobile-quick-action-icon">🚚</div>
                  <span className="mobile-quick-action-label">{t('home.quickActions.registerDriver')}</span>
                </Link>
              </>
            )}
            
            {currentUser && currentUser.role === 'shop' && (
              <Link to="/shop/create-package" className="mobile-quick-action-card">
                <div className="mobile-quick-action-icon">➕</div>
                <span className="mobile-quick-action-label">{t('home.quickActions.createPackage')}</span>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Footer Section */}
      <section className="mobile-footer">
        <div className="mobile-footer-content">
          <p className="mobile-footer-text">
            {t('home.footer.copyright', { year: new Date().getFullYear() })}
          </p>
          <div className="mobile-footer-links">
            <Link to="/track">{t('home.footer.track')}</Link>
            <Link to="/login">{t('home.footer.login')}</Link>
            <Link to="/register">{t('home.footer.register')}</Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default MobileHome; 