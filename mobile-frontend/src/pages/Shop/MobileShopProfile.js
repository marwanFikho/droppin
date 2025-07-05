import React, { useState, useEffect } from 'react';
import { packageService, authService } from '../../services/api';
import { userService } from '../../services/api';
import './MobileShopDashboard.css';
import { useTranslation } from 'react-i18next';

const initialAddress = {
  street: '', city: '', state: '', zipCode: '', country: ''
};

function parseAddress(addressStr) {
  if (!addressStr) return initialAddress;
  const [street, city, state, zipCode, country] = addressStr.split(',').map(s => s.trim());
  return { street: street || '', city: city || '', state: state || '', zipCode: zipCode || '', country: country || '' };
}

function joinAddress(addressObj) {
  return [addressObj.street, addressObj.city, addressObj.state, addressObj.zipCode, addressObj.country].join(', ');
}

const MobileShopProfile = () => {
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
  const { t, i18n } = useTranslation();
  const [lang, setLang] = React.useState(i18n.language || 'en');

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
        // Set language from shop profile
        const userLang = (shop.lang || 'en').toLowerCase();
        if (userLang === 'ar' || userLang === 'AR') {
          i18n.changeLanguage('ar');
          setLang('ar');
          localStorage.setItem('selectedLanguage', 'ar');
        } else {
          i18n.changeLanguage('en');
          setLang('en');
          localStorage.setItem('selectedLanguage', 'en');
        }
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

  const handleChangePassword = async (e) => {
    e.preventDefault();
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
      await authService.changePassword({ currentPassword, newPassword });
      setPwSuccess('Password changed successfully!');
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    } catch (err) {
      setPwError(
        err.response?.data?.message || err.message || 'Failed to change password.'
      );
    }
  };

  const handleLanguageChange = async () => {
    const newLang = lang === 'en' ? 'ar' : 'en';
    i18n.changeLanguage(newLang);
    setLang(newLang);
    localStorage.setItem('selectedLanguage', newLang);
    try {
      await userService.updateLanguage(newLang);
    } catch (err) {
      // Optionally handle error
    }
  };

  return (
    <div className="mobile-shop-profile" style={{marginLeft: '1rem', marginRight: '1rem', marginTop: '6rem'}}>
      <h2 className="mobile-shop-profile-title">Shop Profile</h2>
      <form className="mobile-shop-profile-form" onSubmit={handleSave}>
        <label>Shop Name</label>
        <input type="text" value={shopName} disabled />
        <label>Default Contact Name</label>
        <input type="text" value={contactName} onChange={e => setContactName(e.target.value)} required />
        <label>Default Contact Phone</label>
        <input type="tel" value={contactPhone} onChange={e => setContactPhone(e.target.value)} required />
        <label>Default Pickup Location</label>
        <input type="text" name="street" placeholder="Street" value={pickupAddress.street} onChange={handleAddressChange} required />
        <input type="text" name="city" placeholder="City" value={pickupAddress.city} onChange={handleAddressChange} required />
        <input type="text" name="state" placeholder="State" value={pickupAddress.state} onChange={handleAddressChange} required />
        <input type="text" name="zipCode" placeholder="Zip Code" value={pickupAddress.zipCode} onChange={handleAddressChange} required />
        <input type="text" name="country" placeholder="Country" value={pickupAddress.country} onChange={handleAddressChange} required />
        {error && <div className="mobile-shop-create-error">{error}</div>}
        {success && <div className="mobile-shop-create-success">{success}</div>}
        <button type="submit" className="mobile-shop-create-btn" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
      </form>
      <div className="mobile-change-password-section">
        <h3 className="mobile-change-password-title">Change Password</h3>
        <form className="mobile-change-password-form" onSubmit={handleChangePassword}>
          <input type="password" placeholder="Current Password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required />
          <input type="password" placeholder="New Password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
          <input type="password" placeholder="Confirm New Password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
          {pwError && <div className="mobile-shop-create-error">{pwError}</div>}
          {pwSuccess && <div className="mobile-shop-create-success">{pwSuccess}</div>}
          <button type="submit" className="mobile-shop-create-btn">Change Password</button>
        </form>
      </div>
      <button onClick={handleLanguageChange} className="mobile-shop-create-btn" style={{marginTop: '1.5rem'}}>
        {lang === 'en' ? t('profile.switchToArabic') : t('profile.switchToEnglish')}
      </button>
    </div>
  );
};

export default MobileShopProfile; 