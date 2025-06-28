import React from 'react';
import { Link } from 'react-router-dom';
import './MobileRegister.css';
import { useTranslation } from 'react-i18next';

const MobileRegister = () => {
  const { t } = useTranslation();

  const registrationOptions = [
    {
      title: t('mobile.register.shop.title'),
      description: t('mobile.register.shop.description'),
      icon: '🏪',
      link: '/register/shop',
      features: [
        t('mobile.register.shop.features.create'),
        t('mobile.register.shop.features.track'),
        t('mobile.register.shop.features.manage'),
        t('mobile.register.shop.features.analytics')
      ]
    },
    {
      title: t('mobile.register.driver.title'),
      description: t('mobile.register.driver.description'),
      icon: '🚚',
      link: '/register/driver',
      features: [
        t('mobile.register.driver.features.accept'),
        t('mobile.register.driver.features.track'),
        t('mobile.register.driver.features.earn'),
        t('mobile.register.driver.features.schedule')
      ]
    },
    {
      title: t('mobile.register.user.title'),
      description: t('mobile.register.user.description'),
      icon: '👤',
      link: '/register',
      features: [
        t('mobile.register.user.features.track'),
        t('mobile.register.user.features.history'),
        t('mobile.register.user.features.profile'),
        t('mobile.register.user.features.notifications')
      ]
    }
  ];

  return (
    <div className="mobile-register">
      <div className="mobile-register-container">
        <div className="mobile-register-header">
          <div className="mobile-register-icon">📝</div>
          <h1 className="mobile-register-title">{t('mobile.register.title')}</h1>
          <p className="mobile-register-subtitle">{t('mobile.register.subtitle')}</p>
        </div>

        <div className="mobile-register-options">
          {registrationOptions.map((option, index) => (
            <Link
              key={index}
              to={option.link}
              className="mobile-register-option"
            >
              <div className="mobile-register-option-icon">{option.icon}</div>
              <div className="mobile-register-option-content">
                <h3 className="mobile-register-option-title">{option.title}</h3>
                <p className="mobile-register-option-description">{option.description}</p>
                <ul className="mobile-register-option-features">
                  {option.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="mobile-register-option-feature">
                      ✓ {feature}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mobile-register-option-arrow">→</div>
            </Link>
          ))}
        </div>

        <div className="mobile-register-footer">
          <p className="mobile-register-footer-text">
            {t('auth.register.hasAccount')}{' '}
            <Link to="/login" className="mobile-register-link">
              {t('mobile.register.signIn')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default MobileRegister; 