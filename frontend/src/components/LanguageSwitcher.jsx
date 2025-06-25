import React from 'react';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLanguage } from '@fortawesome/free-solid-svg-icons';

const LanguageSwitcher = () => {
  const { t, i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'ar' ? 'en' : 'ar';
    i18n.changeLanguage(newLang);
  };

  return (
    <button
      onClick={toggleLanguage}
      className="btn language-switcher"
      style={{ backgroundColor: '#f26226', color: '#fff', border: 'none' }}
      title={t('language')}
    >
      <FontAwesomeIcon 
        icon={faLanguage} 
        className={`me-2 ${i18n.language === 'ar' ? 'icon-mirror' : ''}`} 
      />
      <span>{i18n.language === 'ar' ? 'English' : 'العربية'}</span>
    </button>
  );
};

export default LanguageSwitcher; 