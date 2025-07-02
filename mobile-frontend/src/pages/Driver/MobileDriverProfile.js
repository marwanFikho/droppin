import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { driverService } from '../../services/api';
import './MobileDriverDashboard.css';
import { Colors } from 'chart.js';
import { useTranslation } from 'react-i18next';

const MobileDriverProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const { t, i18n } = useTranslation();
  const [lang, setLang] = React.useState(null); // null until loaded
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await driverService.getDriverProfile();
        setProfile(res.data);
        setFormData(res.data);
        // Set language from profile
        const userLang = (res.data.user?.lang || res.data.lang || res.data.User?.lang || 'en').toLowerCase();
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

  const handleToggleAvailability = async () => {
    setAvailabilityLoading(true);
    try {
      await driverService.updateAvailability(!profile.isAvailable);
      setProfile(prev => ({ ...prev, isAvailable: !prev.isAvailable }));
    } catch (err) {
      setError('Failed to update availability.');
    } finally {
      setAvailabilityLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    // For personal info, update the nested User object
    if (['name', 'phone'].includes(name)) {
      setFormData(prev => ({
        ...prev,
        User: {
          ...prev.User,
          [name]: value,
        },
      }));
    } else {
      // For other fields like vehicle info
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleCancel = () => {
    setFormData(profile); // Reset changes
    setIsEditing(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    // Here you would call an API to update the profile
    // For now, we'll just update the local state
    setProfile(formData);
    setIsEditing(false);
  };

  const handleToggleLanguage = async () => {
    const newLang = lang === 'en' ? 'ar' : 'en';
    setSaving(true);
    setError(null);
    try {
      i18n.changeLanguage(newLang);
      setLang(newLang);
      // Save to backend using driverService
      await driverService.updateLanguage(newLang);
    } catch (err) {
      setError(t('profile.languageSaveError') || 'Failed to save language preference.');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !lang) return <div className="loading-spinner-container"><div className="loading-spinner"></div></div>;
  if (error) return <div className="mobile-error-message">{error}</div>;

  return (
    <div className="mobile-driver-dashboard" style={{ marginTop: '2rem' }}>
      <div className="mobile-driver-dashboard-container" style={{ paddingTop: 20 }}>
        <div className="mobile-shop-dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 className="mobile-shop-dashboard-title" style={{ margin: 0 }}>{t('driver.profile.myProfile')}</h1>
        </div>

        {profile && (
          <>
            <div className="mobile-driver-profile-card">
              <div className="mobile-driver-profile-header">
                <h3>{t('driver.profile.personalInfo')}</h3>
                <button onClick={isEditing ? handleCancel : () => setIsEditing(true)} className="mobile-profile-edit-btn">
                  {isEditing ? t('driver.profile.cancel') : t('driver.profile.edit')}
                </button>
              </div>
              {isEditing ? (
                <form onSubmit={handleSave} className="mobile-profile-form">
                  <div className="mobile-form-group">
                    <label>{t('driver.profile.name')}</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.User?.name || ''}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="mobile-form-group">
                    <label>{t('driver.profile.email')}</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.User?.email || ''}
                      readOnly
                      style={{ background: '#f0f0f0', cursor: 'not-allowed' }}
                    />
                  </div>
                  <div className="mobile-form-group">
                    <label>{t('driver.profile.phone')}</label>
                    <input
                      type="text"
                      name="phone"
                      value={formData.User?.phone || ''}
                      onChange={handleInputChange}
                    />
                  </div>
                  <button type="submit" className="mobile-profile-save-btn">{t('driver.profile.save')}</button>
                </form>
              ) : (
                <div className="mobile-profile-details">
                  <div><strong>{t('driver.profile.name')}:</strong> {profile.User?.name}</div>
                  <div><strong>{t('driver.profile.email')}:</strong> {profile.User?.email}</div>
                  <div><strong>{t('driver.profile.phone')}:</strong> {profile.User?.phone}</div>
                  <div><strong>{t('driver.profile.workingArea')}:</strong> {profile.workingArea}</div>
                </div>
              )}
            </div>

            <div className="mobile-driver-profile-card">
              <h3>{t('driver.profile.vehicleInfo')}</h3>
              <div className="mobile-profile-details">
                <div><strong>{t('driver.profile.type')}:</strong> {profile.vehicleType}</div>
                <div><strong>{t('driver.profile.model')}:</strong> {profile.model}</div>
                <div><strong>{t('driver.profile.licensePlate')}:</strong> {profile.licensePlate}</div>
              </div>
            </div>

            <div className="mobile-driver-profile-card">
              <h3>{t('driver.profile.availability')}</h3>
              <div className="mobile-profile-availability">
                <span>{profile.isAvailable ? t('driver.profile.available') : t('driver.profile.notAvailable')}</span>
                <button
                  onClick={handleToggleAvailability}
                  className={`mobile-availability-toggle ${profile.isAvailable ? 'on' : 'off'}`}
                  disabled={availabilityLoading}
                >
                  {availabilityLoading ? '...' : (profile.isAvailable ? t('driver.profile.goOffline') : t('driver.profile.goOnline'))}
                </button>
              </div>
            </div>
            <div className="mobile-driver-profile-card" style={{ marginTop: '1.5rem', maxWidth: 400, marginLeft: 'auto', marginRight: 'auto' }}>
              <h3>{t('profile.language')}</h3>
              <button onClick={handleToggleLanguage} className="mobile-user-dashboard-action-btn" disabled={saving}>
                {saving
                  ? t('profile.saving') || 'Saving...'
                  : lang === 'en'
                    ? t('profile.switchToArabic')
                    : t('profile.switchToEnglish')}
              </button>
              {error && <div className="mobile-user-dashboard-error">{error}</div>}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MobileDriverProfile; 