import React from 'react';
import { Link } from 'react-router-dom';
import './MobileNotFound.css';
import { useTranslation } from 'react-i18next';

const MobileNotFound = () => {
  const { t } = useTranslation();
  return (
    <div className="mobile-not-found">
      <div className="mobile-not-found-container">
        <div className="mobile-not-found-content">
          <div className="mobile-not-found-icon">🔍</div>
          <h1 className="mobile-not-found-title">{t('notFound.title')}</h1>
          <p className="mobile-not-found-subtitle">
            {t('notFound.message')}
          </p>
          
          <div className="mobile-not-found-actions">
            <Link to="/" className="btn btn-primary">
              {t('notFound.backToHome')}
            </Link>
            <Link to="/track" className="btn btn-outline">
              {t('notFound.trackPackage')}
            </Link>
          </div>
          
          <div className="mobile-not-found-help">
            <p className="mobile-not-found-help-text">
              {t('notFound.help.title')}
            </p>
            <div className="mobile-not-found-links">
              <Link to="/login" className="mobile-not-found-link">
                {t('notFound.help.login')}
              </Link>
              <Link to="/register" className="mobile-not-found-link">
                {t('notFound.help.register')}
              </Link>
              <Link to="/help" className="mobile-not-found-link">
                {t('notFound.help.helpCenter')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileNotFound; 