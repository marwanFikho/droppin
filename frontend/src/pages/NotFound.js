import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const NotFound = () => {
  const { t } = useTranslation();

  return (
    <div className="not-found-container">
      <div className="not-found-content">
        <h1>{t('errors.notFound.code')}</h1>
        <h2>{t('errors.notFound.title')}</h2>
        <p>{t('errors.notFound.message')}</p>
        <Link to="/" className="home-button">
          {t('errors.notFound.backHome')}
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
