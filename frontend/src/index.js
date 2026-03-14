import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import reportWebVitals from './reportWebVitals';
import i18n from './i18n';
import { applyGlobalDateLocaleNormalization } from './utils/dateLocaleNormalization';

applyGlobalDateLocaleNormalization();

const syncDocumentLanguage = (language) => {
  const normalizedLanguage = language === 'ar' ? 'ar' : 'en';
  document.documentElement.lang = normalizedLanguage;
  document.documentElement.dir = normalizedLanguage === 'ar' ? 'rtl' : 'ltr';
};

syncDocumentLanguage(i18n.language);
i18n.on('languageChanged', syncDocumentLanguage);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
