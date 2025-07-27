import React, { useState, useEffect } from 'react';
import { packageService, authService } from '../../services/api';
import { userService } from '../../services/api';
import './MobileShopDashboard.css';
import { useTranslation } from 'react-i18next';
import { sanitizeNameInput, validateName, validatePhone } from '../../utils/inputValidators';

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
  const [shippingFees, setShippingFees] = useState('');
  const [shownShippingFees, setShownShippingFees] = useState('');
  const [editingShownShippingFees, setEditingShownShippingFees] = useState(false);
  const [shownShippingFeesDraft, setShownShippingFeesDraft] = useState('');
  const [shownShippingFeesError, setShownShippingFeesError] = useState('');
  const [apiKey, setApiKey] = useState(null);
  const [apiKeyLoading, setApiKeyLoading] = useState(false);
  const [apiKeyError, setApiKeyError] = useState(null);
  const [apiKeySuccess, setApiKeySuccess] = useState(null);

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
        setShippingFees(shop.shippingFees !== undefined && shop.shippingFees !== null ? shop.shippingFees : '');
        setShownShippingFees(shop.shownShippingFees !== undefined && shop.shownShippingFees !== null ? shop.shownShippingFees : '');
        setShownShippingFeesDraft(shop.shownShippingFees !== undefined && shop.shownShippingFees !== null ? shop.shownShippingFees : '');
        setApiKey(shop.apiKey || null);
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

  const fetchApiKey = async () => {
    setApiKeyLoading(true);
    setApiKeyError(null);
    setApiKeySuccess(null);
    try {
      const res = await packageService.generateShopApiKey();
      setApiKey(res.data.apiKey);
      setApiKeySuccess('API key generated!');
    } catch (err) {
      setApiKeyError('Failed to generate API key.');
    } finally {
      setApiKeyLoading(false);
    }
  };

  const handleCopyApiKey = () => {
    if (apiKey) {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        navigator.clipboard.writeText(apiKey);
        setApiKeySuccess('API key copied to clipboard!');
        setTimeout(() => setApiKeySuccess(null), 2000);
      } else {
        // Fallback for unsupported browsers or insecure context
        const textarea = document.createElement('textarea');
        textarea.value = apiKey;
        document.body.appendChild(textarea);
        textarea.select();
        try {
          document.execCommand('copy');
          setApiKeySuccess('API key copied to clipboard!');
          setTimeout(() => setApiKeySuccess(null), 2000);
        } catch (err) {
          setApiKeyError('Failed to copy API key.');
        }
        document.body.removeChild(textarea);
      }
    }
  };

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
        <input
          type="text"
          value={contactName}
          onChange={e => {
            const val = sanitizeNameInput(e.target.value);
            if (!validateName(val) && val !== '') return;
            setContactName(val);
          }}
          required
          pattern="[A-Za-z\u0600-\u06FF ]+"
          inputMode="text"
          autoComplete="off"
        />
        <label>Default Contact Phone</label>
        <input
          type="tel"
          value={contactPhone}
          onChange={e => {
            let val = e.target.value.replace(/[^0-9]/g, '');
            if (val.length > 11) val = val.slice(0, 11);
            if (val && !/^01\d{0,9}$/.test(val)) return;
            setContactPhone(val);
          }}
          required
          pattern="01[0-9]{9}"
          inputMode="numeric"
          maxLength={11}
          autoComplete="tel"
        />
        <label>Shipping Fees (EGP)</label>
        <input type="number" value={shippingFees} disabled />
        <label>Shown Shipping Fees (EGP)</label>
        {editingShownShippingFees ? (
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <input
              type="number"
              value={shownShippingFeesDraft}
              onChange={e => setShownShippingFeesDraft(e.target.value)}
              min="0"
              step="0.01"
              style={{ flex: 1 }}
            />
            <button
              type="button"
              className="mobile-shop-create-btn"
              style={{ background: '#28a745', padding: '0.3rem 1rem', fontSize: '0.95rem' }}
              onClick={async () => {
                if (parseFloat(shownShippingFeesDraft) > parseFloat(shippingFees)) {
                  setShownShippingFeesError('Shown Shipping Fees cannot be greater than Shipping Fees.');
                  return;
                }
                setShownShippingFeesError('');
                setEditingShownShippingFees(false);
                setShownShippingFees(shownShippingFeesDraft);
                try {
                  await packageService.updateShopProfile({ shownShippingFees: parseFloat(shownShippingFeesDraft) });
                } catch (e) {
                  setShownShippingFeesError('Failed to update Shown Shipping Fees.');
                }
              }}
            >Save</button>
            <button
              type="button"
              className="mobile-shop-create-btn"
              style={{ background: '#888', padding: '0.3rem 1rem', fontSize: '0.95rem' }}
              onClick={() => {
                setEditingShownShippingFees(false);
                setShownShippingFeesDraft(shownShippingFees);
              }}
            >Cancel</button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <input
              type="number"
              value={shownShippingFees}
              disabled
              style={{ flex: 1 }}
            />
            <button
              type="button"
              className="mobile-shop-create-btn"
              style={{ background: '#007bff', padding: '0.3rem 1rem', fontSize: '0.95rem' }}
              onClick={() => setEditingShownShippingFees(true)}
            >Edit</button>
          </div>
        )}
        {shownShippingFeesError && <div className="mobile-shop-create-error">{shownShippingFeesError}</div>}
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
      <div className="mobile-api-key-section" style={{ marginBottom: '2rem', background: '#f8f9fa', padding: '1rem', borderRadius: '8px' }}>
        <h3>Shopify Integration API Key</h3>
        <p>Use this API key to connect your Shopify app to your Droppin shop account.</p>
        {apiKey ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <input type="text" value={apiKey} readOnly style={{ width: '100%', fontFamily: 'monospace' }} />
            <button type="button" onClick={handleCopyApiKey} className="mobile-shop-create-btn" style={{ background: '#007bff', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px' }}>Copy</button>
          </div>
        ) : (
          <button type="button" onClick={fetchApiKey} disabled={apiKeyLoading} className="mobile-shop-create-btn" style={{ background: '#007bff', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px' }}>{apiKeyLoading ? 'Generating...' : 'Generate API Key'}</button>
        )}
        {apiKeyError && <div className="mobile-shop-create-error">{apiKeyError}</div>}
        {apiKeySuccess && <div className="mobile-shop-create-success">{apiKeySuccess}</div>}
      </div>
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