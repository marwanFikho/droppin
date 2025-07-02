import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { userService, authService } from '../../services/api';
import './MobileUserDashboard.css';

const MobileUserProfile = () => {
  const { t, i18n } = useTranslation();
  const [lang, setLang] = useState(null); // null until loaded
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await authService.getProfile();
        const userLang = (res.data.user?.lang || res.data.lang || 'en').toLowerCase();
        i18n.changeLanguage(userLang);
        setLang(userLang);
      } catch (err) {
        setError('Failed to load profile.');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [i18n]);

  const handleToggleLanguage = async () => {
    const newLang = lang === 'en' ? 'ar' : 'en';
    setSaving(true);
    setError(null);
    try {
      i18n.changeLanguage(newLang);
      setLang(newLang);
      // Save to backend using userService
      await userService.updateLanguage(newLang);
    } catch (err) {
      setError(t('profile.languageSaveError') || 'Failed to save language preference.');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !lang) return <div className="loading-spinner-container"><div className="loading-spinner"></div></div>;
  if (error) return <div className="mobile-user-dashboard-error">{error}</div>;

  return (
    <div className="mobile-user-dashboard">
      <div className="mobile-user-dashboard-container">
        <div className="mobile-user-dashboard-header">
          <div className="mobile-user-dashboard-welcome">
            <h1 className="mobile-user-dashboard-title">{t('profile.title')}</h1>
            <p className="mobile-user-dashboard-subtitle">{t('profile.subtitle')}</p>
          </div>
          <div className="mobile-user-dashboard-icon">👤</div>
        </div>
        <div className="mobile-user-dashboard-section">
          <h2 className="mobile-user-dashboard-section-title">{t('profile.language')}</h2>
          <button onClick={handleToggleLanguage} className="mobile-user-dashboard-action-btn" disabled={saving}>
            {saving
              ? t('profile.saving') || 'Saving...'
              : lang === 'en'
                ? t('profile.switchToArabic')
                : t('profile.switchToEnglish')}
          </button>
          {error && <div className="mobile-user-dashboard-error">{error}</div>}
        </div>
      </div>
    </div>
  );
};

export default MobileUserProfile; 