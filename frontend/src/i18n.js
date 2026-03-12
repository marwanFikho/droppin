import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enCommon from './locales/en/common.json';
import arCommon from './locales/ar/common.json';
import enNavigation from './locales/en/navigation.json';
import arNavigation from './locales/ar/navigation.json';
import enAuth from './locales/en/auth.json';
import arAuth from './locales/ar/auth.json';
import enPublic from './locales/en/public.json';
import arPublic from './locales/ar/public.json';
import enTracking from './locales/en/tracking.json';
import arTracking from './locales/ar/tracking.json';
import enHelp from './locales/en/help.json';
import arHelp from './locales/ar/help.json';
import enLegal from './locales/en/legal.json';
import arLegal from './locales/ar/legal.json';
import enErrors from './locales/en/errors.json';
import arErrors from './locales/ar/errors.json';
import enDriver from './locales/en/driver.json';
import arDriver from './locales/ar/driver.json';
import enShop from './locales/en/shop.json';
import arShop from './locales/ar/shop.json';

const getInitialLanguage = () => {
  const savedLanguage = localStorage.getItem('selectedLanguage');
  return savedLanguage === 'ar' ? 'ar' : 'en';
};

const resources = {
  en: {
    translation: {
      ...enCommon,
      ...enNavigation,
      ...enAuth,
      ...enPublic,
      ...enTracking,
      ...enHelp,
      ...enLegal,
      ...enErrors,
      ...enDriver,
      ...enShop,
    },
  },
  ar: {
    translation: {
      ...arCommon,
      ...arNavigation,
      ...arAuth,
      ...arPublic,
      ...arTracking,
      ...arHelp,
      ...arLegal,
      ...arErrors,
      ...arDriver,
      ...arShop,
    },
  },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: getInitialLanguage(),
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n; 