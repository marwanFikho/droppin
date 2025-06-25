import React, { useState, useEffect } from 'react';
import { packageService } from '../../services/api';
import api from '../../services/api';
import './ShopDashboard.css';

const initialAddress = {
  street: '',
  city: '',
  state: '',
  zipCode: '',
  country: ''
};

function parseAddress(addressStr) {
  if (!addressStr) return initialAddress;
  const [street, city, state, zipCode, country] = addressStr.split(',').map(s => s.trim());
  return { street: street || '', city: city || '', state: state || '', zipCode: zipCode || '', country: country || '' };
}

function joinAddress(addressObj) {
  return [addressObj.street, addressObj.city, addressObj.state, addressObj.zipCode, addressObj.country].join(', ');
}

const ShopProfile = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [shopName, setShopName] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [pickupAddress, setPickupAddress] = useState(initialAddress);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwError, setPwError] = useState(null);
  const [pwSuccess, setPwSuccess] = useState(null);
  const [showChangePassword, setShowChangePassword] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const res = await packageService.getShopProfile();
        const shop = res.data;
        setShopName(shop.businessName || shop.name || '');
        setContactName(shop.contactPersonName || shop.contactPerson?.name || '');
        setContactPhone(shop.contactPersonPhone || shop.contactPerson?.phone || '');
        setPickupAddress(parseAddress(shop.address));
      } catch (err) {
        setError('Failed to load profile.');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    setPickupAddress(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await packageService.updateShopProfile({
        businessName: shopName,
        contactPerson: { name: contactName, phone: contactPhone },
        address: joinAddress(pickupAddress)
      });
      setSuccess('Profile updated successfully!');
    } catch (err) {
      setError('Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    setPwError(null);
    setPwSuccess(null);
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPwError('All password fields are required.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError('New passwords do not match.');
      return;
    }
    try {
      const res = await api.post('/auth/change-password', { currentPassword, newPassword });
      setPwSuccess(res.data.message || 'Password changed successfully!');
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    } catch (err) {
      setPwError(err.response?.data?.message || 'Failed to change password.');
    }
  };

  return (
    <div className="shop-profile-page" style={{ width: '500px', marginLeft: '900px', padding: '2rem' }}>
      <h2>Shop Profile</h2>
        <form className="shop-profile-form" onSubmit={handleSave}>
          <div className="form-group">
            <label>Shop Name</label>
            <input type="text" value={shopName} disabled />
          </div>
          <div className="form-group">
            <label>Default Contact Name</label>
            <input type="text" value={contactName} onChange={e => setContactName(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Default Contact Phone</label>
            <input type="tel" value={contactPhone} onChange={e => setContactPhone(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Default Pickup Location</label>
            <input type="text" name="street" placeholder="Street" value={pickupAddress.street} onChange={handleAddressChange} required />
            <input type="text" name="city" placeholder="City" value={pickupAddress.city} onChange={handleAddressChange} required />
            <input type="text" name="state" placeholder="State" value={pickupAddress.state} onChange={handleAddressChange} required />
            <input type="text" name="zipCode" placeholder="Zip Code" value={pickupAddress.zipCode} onChange={handleAddressChange} required />
            <input type="text" name="country" placeholder="Country" value={pickupAddress.country} onChange={handleAddressChange} required />
          </div>
          {!showChangePassword && (
            <button type="button" className="profile-save-btn" style={{marginBottom: '1rem', background: '#007bff'}} onClick={() => setShowChangePassword(true)}>
              Change Password
            </button>
          )}
          {showChangePassword && (
            <div className="change-password-fields">
              <h3>Change Password</h3>
              <input style={{ marginBottom: '10px', width: '100%' }} type="password" placeholder="Current Password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
              <input style={{ marginBottom: '10px', width: '100%' }} type="password" placeholder="New Password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
              <input style={{ marginBottom: '10px', width: '100%' }} type="password" placeholder="Confirm New Password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
              {pwError && <div className="error-message">{pwError}</div>}
              {pwSuccess && <div className="success-message">{pwSuccess}</div>}
              <div style={{display:'flex',gap:'0.5rem'}}>
                <button type="button" className="profile-save-btn" style={{background:'#888'}} onClick={() => { setShowChangePassword(false); setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); setPwError(null); setPwSuccess(null); }}>Cancel</button>
                <button type="button" className="profile-save-btn" style={{background:'#007bff'}} onClick={handleChangePassword}>Change Password</button>
              </div>
            </div>
          )}
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}
          <button type="submit" className="profile-save-btn" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
        </form>
    </div>
  );
};

export default ShopProfile; 