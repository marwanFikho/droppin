import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../App.css';
import { useTranslation } from 'react-i18next';

const Home = () => {
  const { currentUser } = useAuth();
  const { t } = useTranslation();

  // Redirect to the appropriate dashboard if logged in
  const getDashboardLink = () => {
    if (!currentUser) return '/login';
    
    switch (currentUser.role) {
      case 'shop':
        return '/shop';
      case 'driver':
        return '/driver';
      case 'admin':
        return '/admin';
      default:
        return '/user';
    }
  };

  return (
    <div className="home-container">
      <div className="hero-section">
        <div className="hero-content">
          <h1>{t('home.hero.title')}</h1>
          <h2>{t('home.hero.subtitle')}</h2>
          <p>{t('home.hero.description')}</p>
          
          {currentUser ? (
            <Link to={getDashboardLink()} className="cta-button">
              {t('home.hero.ctaDashboard')}
            </Link>
          ) : (
            <div className="cta-buttons">
              <Link to="/login" className="cta-button primary">
                {t('home.hero.ctaLogin')}
              </Link>
              <Link to="/register" className="cta-button secondary">
                {t('home.hero.ctaRegister')}
              </Link>
            </div>
          )}
        </div>
      </div>

      <div className="features-section">
        <h2>{t('home.features.title')}</h2>
        
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">📦</div>
            <h3>{t('home.features.shops.title')}</h3>
            <p>{t('home.features.shops.description')}</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">🚚</div>
            <h3>{t('home.features.drivers.title')}</h3>
            <p>{t('home.features.drivers.description')}</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">👤</div>
            <h3>{t('home.features.customers.title')}</h3>
            <p>{t('home.features.customers.description')}</p>
          </div>
        </div>
      </div>

      <div className="tracking-section">
        <h2>{t('home.tracking.title')}</h2>
        <div className="tracking-box">
          <Link to="/track" className="track-link">
            {t('home.tracking.button')}
          </Link>
        </div>
      </div>

      <footer className="home-footer">
        <div className="footer-content">
          <div className="footer-logo">{t('home.hero.title')}</div>
          <div className="footer-links">
            <Link to="/about">{t('home.footer.about')}</Link>
            <Link to="/contact">{t('home.footer.contact')}</Link>
            <Link to="/terms">{t('home.footer.terms')}</Link>
            <Link to="/privacy">{t('home.footer.privacy')}</Link>
          </div>
          <div className="footer-copyright">
            {t('home.footer.copyright', { year: new Date().getFullYear() })}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
