import React, { useState, useEffect } from 'react';
import { packageService } from '../../services/api';
import './ShopDashboard.css';
import { useTranslation } from 'react-i18next';

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
        setError(t('shop.profile.errors.loadProfile'));
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
      setError(t('shop.profile.errors.saveProfile'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="shop-profile-page" style={{ width: '500px', marginLeft: '900px', padding: '2rem' }}>
      <h2>{t('shop.profile.title')}</h2>
        <form className="shop-profile-form" onSubmit={handleSave}>
          <div className="form-group">
            <label>{t('shop.profile.labels.shopName')}</label>
            <input type="text" value={shopName} disabled />
          </div>
          <div className="form-group">
            <label>{t('shop.profile.labels.contactName')}</label>
            <input type="text" value={contactName} onChange={e => setContactName(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>{t('shop.profile.labels.contactPhone')}</label>
            <input type="tel" value={contactPhone} onChange={e => setContactPhone(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>{t('shop.profile.labels.pickupLocation')}</label>
            <input type="text" name="street" placeholder={t('shop.profile.placeholders.street')} value={pickupAddress.street} onChange={handleAddressChange} required />
            <input type="text" name="city" placeholder={t('shop.profile.placeholders.city')} value={pickupAddress.city} onChange={handleAddressChange} required />
            <input type="text" name="state" placeholder={t('shop.profile.placeholders.state')} value={pickupAddress.state} onChange={handleAddressChange} required />
            <input type="text" name="zipCode" placeholder={t('shop.profile.placeholders.zipCode')} value={pickupAddress.zipCode} onChange={handleAddressChange} required />
            <input type="text" name="country" placeholder={t('shop.profile.placeholders.country')} value={pickupAddress.country} onChange={handleAddressChange} required />
          </div>
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}
          <button type="submit" className="profile-save-btn" disabled={saving}>{saving ? t('shop.profile.saving') : t('shop.profile.saveChanges')}</button>
        </form>
    </div>
  );
};

export default ShopProfile; 