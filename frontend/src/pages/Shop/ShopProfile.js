import React, { useState, useEffect } from 'react';
import { packageService } from '../../services/api';
import api from '../../services/api';
import './ShopDashboard.css';
import { sanitizeNameInput, validateName, validatePhone } from '../../utils/inputValidators';

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
  const [apiKey, setApiKey] = useState(null);
  const [apiKeyLoading, setApiKeyLoading] = useState(false);
  const [apiKeyError, setApiKeyError] = useState(null);
  const [apiKeySuccess, setApiKeySuccess] = useState(null);
  const [shippingFees, setShippingFees] = useState('');
  const [shownShippingFees, setShownShippingFees] = useState('');
  const [editingShownShippingFees, setEditingShownShippingFees] = useState(false);
  const [shownShippingFeesDraft, setShownShippingFeesDraft] = useState('');
  const [shownShippingFeesError, setShownShippingFeesError] = useState('');

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
        address: joinAddress(pickupAddress),
        shownShippingFees: shownShippingFees !== '' ? parseFloat(shownShippingFees) : null
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

  const fetchApiKey = async () => {
    setApiKeyLoading(true);
    setApiKeyError(null);
    setApiKeySuccess(null);
    try {
      const res = await api.post('/shops/generate-api-key');
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

  useEffect(() => {
    // Try to fetch the API key on mount (if it exists)
    const getKey = async () => {
      try {
        const res = await api.post('/shops/generate-api-key');
        setApiKey(res.data.apiKey);
      } catch {}
    };
    getKey();
  }, []);

  return (
    <div className="shop-profile-page" style={{ width: '500px', marginLeft: '900px', padding: '2rem' }}>
      <h2>Shop Profile</h2>
      {/* API Key Section */}
      <div className="api-key-section" style={{ marginBottom: '2rem', background: '#f8f9fa', padding: '1rem', borderRadius: '8px' }}>
        <h3>Shopify Integration API Key</h3>
        <p>Use this API key to connect your Shopify app to your Droppin shop account.</p>
        {apiKey ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <input type="text" value={apiKey} readOnly style={{ width: '300px', fontFamily: 'monospace' }} />
            <button type="button" onClick={handleCopyApiKey} style={{ background: '#007bff', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px' }}>Copy</button>
          </div>
        ) : (
          <button type="button" onClick={fetchApiKey} disabled={apiKeyLoading} style={{ background: '#007bff', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px' }}>{apiKeyLoading ? 'Generating...' : 'Generate API Key'}</button>
        )}
        {apiKeyError && <div className="error-message">{apiKeyError}</div>}
        {apiKeySuccess && <div className="success-message">{apiKeySuccess}</div>}
      </div>
      <form className="shop-profile-form" onSubmit={handleSave}>
        <div className="form-group">
          <label>Shop Name</label>
          <input type="text" value={shopName} disabled />
        </div>
        <div className="form-group">
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
        </div>
        <div className="form-group">
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
        </div>
        <div className="form-group">
          <label>Default Pickup Location</label>
          <input type="text" name="street" placeholder="Street" value={pickupAddress.street} onChange={handleAddressChange} required />
          <input type="text" name="city" placeholder="City" value={pickupAddress.city} onChange={handleAddressChange} required />
          <input type="text" name="state" placeholder="State" value={pickupAddress.state} onChange={handleAddressChange} required />
          <input type="text" name="zipCode" placeholder="Zip Code" value={pickupAddress.zipCode} onChange={handleAddressChange} required />
          <input type="text" name="country" placeholder="Country" value={pickupAddress.country} onChange={handleAddressChange} required />
        </div>
        <div className="form-group">
          <label>Shipping Fees (EGP)</label>
          <input type="number" value={shippingFees} disabled />
        </div>
        <div className="form-group">
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
                className="profile-save-btn"
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
                    // Optionally show error
                  }
                }}
              >Save</button>
              <button
                type="button"
                className="profile-save-btn"
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
                className="profile-save-btn"
                style={{ background: '#007bff', padding: '0.3rem 1rem', fontSize: '0.95rem' }}
                onClick={() => setEditingShownShippingFees(true)}
              >Edit</button>
            </div>
          )}
        </div>
        {shownShippingFeesError && <div className="error-message">{shownShippingFeesError}</div>}
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