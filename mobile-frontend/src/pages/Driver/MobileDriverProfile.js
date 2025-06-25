import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { driverService } from '../../services/api';
import './MobileDriverDashboard.css';
import { Colors } from 'chart.js';

const MobileDriverProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [availabilityLoading, setAvailabilityLoading] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await driverService.getDriverProfile();
        setProfile(res.data);
        setFormData(res.data);
      } catch (err) {
        setError('Failed to load profile.');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

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

  if (loading) return <div className="loading-spinner-container"><div className="loading-spinner"></div></div>;
  if (error) return <div className="mobile-error-message">{error}</div>;

  return (
    <div className="mobile-driver-dashboard" style={{ marginTop: '2rem' }}>
      <div className="mobile-driver-dashboard-container" style={{ paddingTop: 20 }}>
        <div className="mobile-shop-dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 className="mobile-shop-dashboard-title" style={{ margin: 0 }}>My Profile</h1>
        </div>

        {profile && (
          <>
            <div className="mobile-driver-profile-card">
              <div className="mobile-driver-profile-header">
                <h3>Personal Information</h3>
                <button onClick={isEditing ? handleCancel : () => setIsEditing(true)} className="mobile-profile-edit-btn">
                  {isEditing ? 'Cancel' : 'Edit'}
                </button>
              </div>
              {isEditing ? (
                <form onSubmit={handleSave} className="mobile-profile-form">
                  <div className="mobile-form-group">
                    <label>Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.User?.name || ''}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="mobile-form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.User?.email || ''}
                      readOnly
                      style={{ background: '#f0f0f0', cursor: 'not-allowed' }}
                    />
                  </div>
                  <div className="mobile-form-group">
                    <label>Phone</label>
                    <input
                      type="text"
                      name="phone"
                      value={formData.User?.phone || ''}
                      onChange={handleInputChange}
                    />
                  </div>
                  <button type="submit" className="mobile-profile-save-btn">Save Changes</button>
                </form>
              ) : (
                <div className="mobile-profile-details">
                  <div><strong>Name:</strong> {profile.User?.name}</div>
                  <div><strong>Email:</strong> {profile.User?.email}</div>
                  <div><strong>Phone:</strong> {profile.User?.phone}</div>
                  <div><strong>Working Area:</strong> {profile.workingArea}</div>
                </div>
              )}
            </div>

            <div className="mobile-driver-profile-card">
              <h3>Vehicle Information</h3>
              <div className="mobile-profile-details">
                <div><strong>Type:</strong> {profile.vehicleType}</div>
                <div><strong>Model:</strong> {profile.model}</div>
                <div><strong>License Plate:</strong> {profile.licensePlate}</div>
              </div>
            </div>

            <div className="mobile-driver-profile-card">
              <h3>Availability</h3>
              <div className="mobile-profile-availability">
                <span>{profile.isAvailable ? 'Available for deliveries' : 'Not available for deliveries'}</span>
                <button
                  onClick={handleToggleAvailability}
                  className={`mobile-availability-toggle ${profile.isAvailable ? 'on' : 'off'}`}
                  disabled={availabilityLoading}
                >
                  {availabilityLoading ? '...' : (profile.isAvailable ? 'Go Offline' : 'Go Online')}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MobileDriverProfile; 