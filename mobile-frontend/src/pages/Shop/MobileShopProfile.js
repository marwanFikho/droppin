import React, { useState, useEffect } from 'react';
import { packageService, authService } from '../../services/api';
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
  const { t } = useTranslation();

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
        setError(t('shop.profile.error.loadProfile'));
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [t]);

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
      setSuccess(t('shop.profile.success.update'));
    } catch (err) {
      setError(t('shop.profile.error.saveProfile'));
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwError(null);
    setPwSuccess(null);
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPwError(t('shop.profile.error.passwordRequired'));
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError(t('shop.profile.error.passwordMismatch'));
      return;
    }
    try {
      await authService.changePassword({ currentPassword, newPassword });
      setPwSuccess(t('shop.profile.success.passwordChanged'));
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    } catch (err) {
      setPwError(
        err.response?.data?.message || err.message || t('shop.profile.error.changePassword')
      );
    }
  };

  return (
    <div className="mobile-shop-profile" style={{marginLeft: '1rem', marginRight: '1rem', marginTop: '6rem'}}>
      <h2 className="mobile-shop-profile-title">{t('shop.profile.title')}</h2>
      <form className="mobile-shop-profile-form" onSubmit={handleSave}>
        <label>{t('shop.profile.shopName')}</label>
        <input type="text" value={shopName} disabled />
        <label>{t('shop.profile.contactName')}</label>
        <input type="text" value={contactName} onChange={e => setContactName(e.target.value)} required />
        <label>{t('shop.profile.contactPhone')}</label>
        <input type="tel" value={contactPhone} onChange={e => setContactPhone(e.target.value)} required />
        <label>{t('shop.profile.pickupLocation')}</label>
        <input type="text" name="street" placeholder={t('shop.profile.street')} value={pickupAddress.street} onChange={handleAddressChange} required />
        <input type="text" name="city" placeholder={t('shop.profile.city')} value={pickupAddress.city} onChange={handleAddressChange} required />
        <input type="text" name="state" placeholder={t('shop.profile.state')} value={pickupAddress.state} onChange={handleAddressChange} required />
        <input type="text" name="zipCode" placeholder={t('shop.profile.zipCode')} value={pickupAddress.zipCode} onChange={handleAddressChange} required />
        <input type="text" name="country" placeholder={t('shop.profile.country')} value={pickupAddress.country} onChange={handleAddressChange} required />
        {error && <div className="mobile-shop-create-error">{error}</div>}
        {success && <div className="mobile-shop-create-success">{success}</div>}
        <button type="submit" className="mobile-shop-create-btn" disabled={saving}>{saving ? t('shop.profile.saving') : t('shop.profile.saveChanges')}</button>
      </form>
      <div className="mobile-change-password-section">
        <h3 className="mobile-change-password-title">{t('shop.profile.changePassword')}</h3>
        <form className="mobile-change-password-form" onSubmit={handleChangePassword}>
          <input type="password" placeholder={t('shop.profile.currentPassword')} value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required />
          <input type="password" placeholder={t('shop.profile.newPassword')} value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
          <input type="password" placeholder={t('shop.profile.confirmNewPassword')} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
          {pwError && <div className="mobile-shop-create-error">{pwError}</div>}
          {pwSuccess && <div className="mobile-shop-create-success">{pwSuccess}</div>}
          <button type="submit" className="mobile-shop-create-btn">{t('shop.profile.changePasswordBtn')}</button>
        </form>
      </div>
    </div>
  );
};

export default MobileShopProfile; 