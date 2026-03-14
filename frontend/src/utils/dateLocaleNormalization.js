// Enforce dd/mm/yyyy date ordering across the app.
// This normalizes locale arguments for native date rendering APIs used throughout the UI.

const PATCH_FLAG = '__droppinDateLocalePatched__';

const mapLocale = (locale) => {
  if (!locale || typeof locale !== 'string') return 'en-GB';
  const normalized = locale.toLowerCase();
  if (normalized.startsWith('en')) return 'en-GB';
  if (normalized.startsWith('ar')) return 'ar-EG';
  return locale;
};

const normalizeLocales = (locales) => {
  if (!locales) return 'en-GB';
  if (Array.isArray(locales)) return locales.map(mapLocale);
  return mapLocale(locales);
};

export const applyGlobalDateLocaleNormalization = () => {
  if (typeof Date === 'undefined') return;
  if (Date[PATCH_FLAG]) return;

  const originalToLocaleDateString = Date.prototype.toLocaleDateString;
  const originalToLocaleString = Date.prototype.toLocaleString;

  Date.prototype.toLocaleDateString = function patchedToLocaleDateString(locales, options) {
    const normalizedLocales = normalizeLocales(locales);
    const normalizedOptions = {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      ...(options || {})
    };
    return originalToLocaleDateString.call(this, normalizedLocales, normalizedOptions);
  };

  Date.prototype.toLocaleString = function patchedToLocaleString(locales, options) {
    const normalizedLocales = normalizeLocales(locales);
    return originalToLocaleString.call(this, normalizedLocales, options);
  };

  Date[PATCH_FLAG] = true;
};
