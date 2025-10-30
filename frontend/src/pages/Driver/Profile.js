import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { driverService } from '../../services/api';
import './DriverDashboard.css';
import { useTranslation } from 'react-i18next';

const DriverProfile = () => {
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
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="driver-dashboard">
      {/* Back to Dashboard Button */}
      <div style={{ 
        position: 'fixed', 
        top: '0.5rem', 
        right: '1rem', 
        zIndex: 1000
      }}>
        <Link 
          to="/driver" 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem',
            background: 'linear-gradient(135deg, #f36325 0%, #004b6f 100%)',
            color: 'white',
            padding: '0.75rem 1rem',
            borderRadius: '50px',
            textDecoration: 'none',
            fontWeight: '500',
            fontSize: '14px',
            boxShadow: '0 4px 12px rgba(243, 99, 37, 0.3)',
            transition: 'all 0.3s ease',
            border: 'none',
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = 'linear-gradient(135deg, #e55a1f 0%, #003d5a 100%)';
            e.target.style.boxShadow = '0 6px 20px rgba(243, 99, 37, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'linear-gradient(135deg, #f36325 0%, #004b6f 100%)';
            e.target.style.boxShadow = '0 4px 12px rgba(243, 99, 37, 0.3)';
          }}
        >
          <span style={{ fontSize: '18px' }}>📊</span>
          Dashboard
        </Link>
      </div>

      <div className="driver-dashboard-container" style={{ padding: '0.5rem 1rem' }}>
        <div className="shop-dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h1 className="shop-dashboard-title" style={{ margin: 0 }}>{t('driver.profile.myProfile')}</h1>
        </div>

        {profile && (
          <>
            <div className="driver-profile-card">
              <div className="driver-profile-header">
                <h3>{t('driver.profile.personalInfo')}</h3>
                <button onClick={isEditing ? handleCancel : () => setIsEditing(true)} className="profile-edit-btn">
                  {isEditing ? t('driver.profile.cancel') : t('driver.profile.edit')}
                </button>
              </div>
              {isEditing ? (
                <form onSubmit={handleSave} className="profile-form">
                  <div className="form-group">
                    <label>{t('driver.profile.name')}</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.User?.name || ''}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>{t('driver.profile.email')}</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.User?.email || ''}
                      readOnly
                      style={{ background: '#f0f0f0', cursor: 'not-allowed' }}
                    />
                  </div>
                  <div className="form-group">
                    <label>{t('driver.profile.phone')}</label>
                    <input
                      type="text"
                      name="phone"
                      value={formData.User?.phone || ''}
                      onChange={handleInputChange}
                    />
                  </div>
                  <button type="submit" className="profile-save-btn">{t('driver.profile.save')}</button>
                </form>
              ) : (
                <div className="profile-details">
                  <div><strong>{t('driver.profile.name')}:</strong> {profile.User?.name}</div>
                  <div><strong>{t('driver.profile.email')}:</strong> {profile.User?.email}</div>
                  <div><strong>{t('driver.profile.phone')}:</strong> {profile.User?.phone}</div>
                  <div><strong>{t('driver.profile.workingArea')}:</strong> {profile.workingArea}</div>
                </div>
              )}
            </div>

            <div className="driver-profile-card">
              <h3>{t('driver.profile.vehicleInfo')}</h3>
              <div className="profile-details">
                <div><strong>{t('driver.profile.type')}:</strong> {profile.vehicleType}</div>
                <div><strong>{t('driver.profile.model')}:</strong> {profile.model}</div>
                <div><strong>{t('driver.profile.licensePlate')}:</strong> {profile.licensePlate}</div>
              </div>
            </div>

            <div className="driver-profile-card">
              <h3>{t('driver.profile.availability')}</h3>
              <div className="profile-availability">
                <span>{profile.isAvailable ? t('driver.profile.available') : t('driver.profile.notAvailable')}</span>
                <button
                  onClick={handleToggleAvailability}
                  className={`availability-toggle ${profile.isAvailable ? 'on' : 'off'}`}
                  disabled={availabilityLoading}
                >
                  {availabilityLoading ? '...' : (profile.isAvailable ? t('driver.profile.goOffline') : t('driver.profile.goOnline'))}
                </button>
              </div>
            </div>
            <div className="driver-profile-card" style={{ marginTop: '1.5rem', maxWidth: 400, marginLeft: 'auto', marginRight: 'auto' }}>
              <h3>{t('profile.language')}</h3>
              <button onClick={handleToggleLanguage} className="user-dashboard-action-btn" disabled={saving}>
                {saving
                  ? t('profile.saving') || 'Saving...'
                  : lang === 'en'
                    ? t('profile.switchToArabic')
                    : t('profile.switchToEnglish')}
              </button>
              {error && <div className="user-dashboard-error">{error}</div>}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DriverProfile; 