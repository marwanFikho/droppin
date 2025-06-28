import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

const Unauthorized = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { t } = useTranslation();

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleGoHome = () => {
    if (currentUser) {
      // Redirect to appropriate dashboard based on role
      switch (currentUser.role) {
        case 'shop':
          navigate('/shop');
          break;
        case 'driver':
          navigate('/driver');
          break;
        case 'admin':
          navigate('/admin');
          break;
        default:
          navigate('/');
      }
    } else {
      navigate('/');
    }
  };

  return (
    <div className="unauthorized-container">
      <div className="unauthorized-content">
        <h1>{t('unauthorized.title')}</h1>
        <div className="unauthorized-icon">⚠️</div>
        <p>{t('unauthorized.message')}</p>
        <div className="unauthorized-actions">
          <button onClick={handleGoBack} className="btn-secondary">
            {t('unauthorized.goBack')}
          </button>
          <button onClick={handleGoHome} className="btn-primary">
            {t('unauthorized.goTo', { destination: currentUser ? t('unauthorized.dashboard') : t('unauthorized.home') })}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized; 