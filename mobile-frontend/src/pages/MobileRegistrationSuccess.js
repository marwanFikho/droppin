import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import './MobileRegistrationSuccess.css';

const MobileRegistrationSuccess = () => {
  const { currentUser } = useAuth();
  const { t } = useTranslation();

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

  const getWelcomeMessage = () => {
    if (!currentUser) return t('registrationSuccess.welcome.default');
    
    switch (currentUser.role) {
      case 'shop': return t('registrationSuccess.welcome.shop');
      case 'driver': return t('registrationSuccess.welcome.driver');
      case 'user': return t('registrationSuccess.welcome.user');
      case 'admin': return t('registrationSuccess.welcome.admin');
      default: return t('registrationSuccess.welcome.default');
    }
  };

  const getNextSteps = () => {
    if (!currentUser) return [];
    
    switch (currentUser.role) {
      case 'shop':
        return [
          t('registrationSuccess.nextSteps.shop.create'),
          t('registrationSuccess.nextSteps.shop.profile'),
          t('registrationSuccess.nextSteps.shop.view'),
          t('registrationSuccess.nextSteps.shop.track')
        ];
      case 'driver':
        return [
          t('registrationSuccess.nextSteps.driver.profile'),
          t('registrationSuccess.nextSteps.driver.accept'),
          t('registrationSuccess.nextSteps.driver.routes'),
          t('registrationSuccess.nextSteps.driver.earnings')
        ];
      case 'user':
        return [
          t('registrationSuccess.nextSteps.user.track'),
          t('registrationSuccess.nextSteps.user.history'),
          t('registrationSuccess.nextSteps.user.profile'),
          t('registrationSuccess.nextSteps.user.preferences')
        ];
      case 'admin':
        return [
          t('registrationSuccess.nextSteps.admin.users'),
          t('registrationSuccess.nextSteps.admin.analytics'),
          t('registrationSuccess.nextSteps.admin.monitor'),
          t('registrationSuccess.nextSteps.admin.settings')
        ];
      default:
        return [
          t('registrationSuccess.nextSteps.default.explore'),
          t('registrationSuccess.nextSteps.default.track'),
          t('registrationSuccess.nextSteps.default.profile')
        ];
    }
  };

  return (
    <div className="mobile-registration-success">
      <div className="mobile-registration-success-container">
        <div className="mobile-registration-success-header">
          <div className="mobile-registration-success-icon">✅</div>
          <h1 className="mobile-registration-success-title">{t('registrationSuccess.title')}</h1>
          <p className="mobile-registration-success-subtitle">{getWelcomeMessage()}</p>
        </div>

        <div className="mobile-registration-success-content">
          <div className="mobile-registration-success-card">
            <h2 className="mobile-registration-success-card-title">{t('registrationSuccess.nextSteps.title')}</h2>
            <ul className="mobile-registration-success-steps">
              {getNextSteps().map((step, index) => (
                <li key={index} className="mobile-registration-success-step">
                  <span className="mobile-registration-success-step-number">{index + 1}</span>
                  <span className="mobile-registration-success-step-text">{step}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mobile-registration-success-actions">
            <Link to={getDashboardLink()} className="btn btn-primary">
              {t('registrationSuccess.actions.dashboard')}
            </Link>
            <Link to="/" className="btn btn-outline">
              {t('registrationSuccess.actions.home')}
            </Link>
          </div>
        </div>

        <div className="mobile-registration-success-footer">
          <p className="mobile-registration-success-footer-text">
            {t('registrationSuccess.footer.help')}
          </p>
          <div className="mobile-registration-success-footer-links">
            <Link to="/help" className="mobile-registration-success-footer-link">
              {t('registrationSuccess.footer.helpCenter')}
            </Link>
            <Link to="/contact" className="mobile-registration-success-footer-link">
              {t('registrationSuccess.footer.contact')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileRegistrationSuccess; 