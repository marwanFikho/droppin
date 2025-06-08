import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import enTranslations from './locales/en.json';
import arTranslations from './locales/ar.json';

// Debug translations
console.log('Loading translations:', {
  en: enTranslations,
  ar: arTranslations
});

i18n
  .use(initReactI18next)
  .use(LanguageDetector)
  .init({
    fallbackLng: 'en',
    supportedLngs: ['en', 'ar'],
    debug: process.env.NODE_ENV === 'development',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
    resources: {
      en: {
        translation: enTranslations
      },
      ar: {
        translation: arTranslations
      }
    },
    // RTL languages
    rtl: ['ar']
  });

// Function to toggle RTL stylesheet
const toggleRTLStylesheet = (isRTL) => {
  const rtlStylesheet = document.getElementById('rtl-stylesheet');
  const ltrStylesheet = document.querySelector('link[href*="bootstrap.min.css"]:not([href*="rtl"])');
  
  if (isRTL) {
    if (rtlStylesheet) rtlStylesheet.removeAttribute('disabled');
    if (ltrStylesheet) ltrStylesheet.setAttribute('disabled', '');
  } else {
    if (rtlStylesheet) rtlStylesheet.setAttribute('disabled', '');
    if (ltrStylesheet) ltrStylesheet.removeAttribute('disabled');
  }
};

// Function to set document direction
export const setDocumentDirection = (language) => {
  const dir = language === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.dir = dir;
  document.documentElement.lang = language;
  // Add RTL class to body for global RTL styles
  document.body.classList.toggle('rtl', dir === 'rtl');
  // Toggle RTL stylesheet
  toggleRTLStylesheet(dir === 'rtl');
};

// Listen for language changes
i18n.on('languageChanged', (lng) => {
  setDocumentDirection(lng);
  // Debug translations after language change
  console.log('Language changed:', {
    language: lng,
    translations: i18n.getResourceBundle(lng, 'translation')
  });
});

// Set initial direction
setDocumentDirection(i18n.language);

// Debug translations
if (process.env.NODE_ENV === 'development') {
  i18n.on('initialized', () => {
    console.log('i18n initialized:', {
      language: i18n.language,
      languages: i18n.languages,
      translations: i18n.store.data
    });
  });

  i18n.on('loaded', (loaded) => {
    console.log('i18n loaded:', loaded);
  });

  i18n.on('failedLoading', (lng, ns, msg) => {
    console.error('i18n failed loading:', { lng, ns, msg });
  });
}

export default i18n; 