import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const RegistrationSuccess = () => {
  const location = useLocation();
  const { t } = useTranslation();
  const { userType, message } = location.state || { 
    userType: 'user', 
    message: t('registration.success.defaultMessage')
  };

  return (
    <div className="auth-container">
      <div className="auth-form-container">
        <div className="auth-header">
          <h2>{t('registration.success.title')}</h2>
        </div>
        
        <div className="success-message">
          <div className="success-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          </div>
          
          <p>{message}</p>
          
          {userType === 'shop' && (
            <div className="approval-info">
              <h3>{t('registration.success.shop.nextSteps.title')}</h3>
              <ol>
                <li>{t('registration.success.shop.nextSteps.steps.1')}</li>
                <li>{t('registration.success.shop.nextSteps.steps.2')}</li>
                <li>{t('registration.success.shop.nextSteps.steps.3')}</li>
              </ol>
            </div>
          )}
          
          <div className="action-buttons">
            <Link to="/login" className="auth-button">
              {t('registration.success.actions.login')}
            </Link>
            <Link to="/" className="auth-button secondary">
              {t('registration.success.actions.home')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegistrationSuccess;
