import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { driverService } from '../../services/api';
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

  if (loading || !lang) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger">{error}</div>
      </div>
    );
  }

  return (
    <div className="container-fluid px-3 px-md-4 py-4" style={{ maxWidth: '1100px' }}>
      {/* Back to Dashboard Button */}
      <div className="d-flex justify-content-end mb-3">
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
          <span style={{ fontSize: '18px' }}>←</span>
          Dashboard
        </Link>
      </div>

      <div className="rounded-4 shadow-sm p-4 p-md-5 mb-4 text-white" style={{ background: 'linear-gradient(135deg, #ff7a3d 0%, #fa8831 28%, #cd7955 52%, #9d8f8d 74%, #4e97ef 100%)' }}>
        <h1 className="h4 fw-bold mb-1">{t('driver.profile.myProfile')}</h1>
        <p className="mb-0" style={{ color: '#f8fafc' }}>Manage your personal info, availability, and language preferences.</p>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {profile && (
        <div className="row g-3">
          <div className="col-12 col-lg-8">
            <div className="rounded-4 shadow-sm p-3 p-md-4 h-100" style={{ background: '#fffaf5' }}>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h3 className="h5 fw-bold mb-0">{t('driver.profile.personalInfo')}</h3>
                <button onClick={isEditing ? handleCancel : () => setIsEditing(true)} className={isEditing ? 'btn btn-outline-secondary btn-sm' : 'btn btn-outline-primary btn-sm'}>
                  {isEditing ? t('driver.profile.cancel') : t('driver.profile.edit')}
                </button>
              </div>
              {isEditing ? (
                <form onSubmit={handleSave}>
                  <div className="mb-3">
                    <label className="form-label">{t('driver.profile.name')}</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.User?.name || ''}
                      onChange={handleInputChange}
                      className="form-control"
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">{t('driver.profile.email')}</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.User?.email || ''}
                      readOnly
                      className="form-control"
                      style={{ background: '#f0f0f0', cursor: 'not-allowed' }}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">{t('driver.profile.phone')}</label>
                    <input
                      type="text"
                      name="phone"
                      value={formData.User?.phone || ''}
                      onChange={handleInputChange}
                      className="form-control"
                    />
                  </div>
                  <button type="submit" className="btn btn-primary">{t('driver.profile.save')}</button>
                </form>
              ) : (
                <div className="row g-3">
                  <div className="col-md-6"><small className="text-muted d-block">{t('driver.profile.name')}</small><span>{profile.User?.name}</span></div>
                  <div className="col-md-6"><small className="text-muted d-block">{t('driver.profile.email')}</small><span>{profile.User?.email}</span></div>
                  <div className="col-md-6"><small className="text-muted d-block">{t('driver.profile.phone')}</small><span>{profile.User?.phone}</span></div>
                  <div className="col-md-6"><small className="text-muted d-block">{t('driver.profile.workingArea')}</small><span>{profile.workingArea || '-'}</span></div>
                </div>
              )}
            </div>
          </div>

          <div className="col-12 col-lg-4">
            <div className="rounded-4 shadow-sm p-3 p-md-4 mb-3" style={{ background: '#fffaf5' }}>
              <h3 className="h6 fw-bold mb-3">{t('driver.profile.vehicleInfo')}</h3>
              <div className="d-flex flex-column gap-2">
                <div><small className="text-muted d-block">{t('driver.profile.type')}</small><span>{profile.vehicleType || '-'}</span></div>
                <div><small className="text-muted d-block">{t('driver.profile.model')}</small><span>{profile.model || '-'}</span></div>
                <div><small className="text-muted d-block">{t('driver.profile.licensePlate')}</small><span>{profile.licensePlate || '-'}</span></div>
              </div>
            </div>

            <div className="rounded-4 shadow-sm p-3 p-md-4 mb-3" style={{ background: '#fffaf5' }}>
              <h3 className="h6 fw-bold mb-3">{t('driver.profile.availability')}</h3>
              <div className="d-flex justify-content-between align-items-center gap-2 flex-wrap">
                <span className={profile.isAvailable ? 'badge bg-success-subtle text-success-emphasis' : 'badge bg-secondary-subtle text-secondary-emphasis'}>
                  {profile.isAvailable ? t('driver.profile.available') : t('driver.profile.notAvailable')}
                </span>
                <button
                  onClick={handleToggleAvailability}
                  className={profile.isAvailable ? 'btn btn-outline-secondary btn-sm' : 'btn btn-success btn-sm'}
                  disabled={availabilityLoading}
                >
                  {availabilityLoading ? '...' : (profile.isAvailable ? t('driver.profile.goOffline') : t('driver.profile.goOnline'))}
                </button>
              </div>
            </div>

            <div className="rounded-4 shadow-sm p-3 p-md-4" style={{ background: '#fffaf5' }}>
              <h3 className="h6 fw-bold mb-3">{t('profile.language')}</h3>
              <button onClick={handleToggleLanguage} className="btn btn-outline-primary btn-sm" disabled={saving}>
                {saving
                  ? t('profile.saving') || 'Saving...'
                  : lang === 'en'
                    ? t('profile.switchToArabic')
                    : t('profile.switchToEnglish')}
              </button>
              {error && <div className="alert alert-danger py-2 mt-2 mb-0">{error}</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DriverProfile; 