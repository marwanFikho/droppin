import React, { useState, useEffect } from 'react';
import { packageService } from '../../services/api';
import api from '../../services/api';
import { sanitizeNameInput, validateName } from '../../utils/inputValidators';
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
  const { t } = useTranslation();
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
        setError(t('shop.profile.errors.loadProfile'));
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
        address: joinAddress(pickupAddress),
        shownShippingFees: shownShippingFees !== '' ? parseFloat(shownShippingFees) : null
      });
      setSuccess(t('shop.profile.success.updated'));
    } catch (err) {
      setError(t('shop.profile.errors.saveProfile'));
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    setPwError(null);
    setPwSuccess(null);
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPwError(t('shop.profile.errors.passwordFieldsRequired'));
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError(t('shop.profile.errors.passwordMismatch'));
      return;
    }
    try {
      const res = await api.post('/auth/change-password', { currentPassword, newPassword });
      setPwSuccess(res.data.message || t('shop.profile.success.passwordChanged'));
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    } catch (err) {
      setPwError(err.response?.data?.message || t('shop.profile.errors.changePassword'));
    }
  };

  const fetchApiKey = async () => {
    setApiKeyLoading(true);
    setApiKeyError(null);
    setApiKeySuccess(null);
    try {
      const res = await api.post('/shops/generate-api-key');
      setApiKey(res.data.apiKey);
      setApiKeySuccess(t('shop.profile.success.apiGenerated'));
    } catch (err) {
      setApiKeyError(t('shop.profile.errors.generateApiKey'));
    } finally {
      setApiKeyLoading(false);
    }
  };

  const handleCopyApiKey = () => {
    if (apiKey) {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        navigator.clipboard.writeText(apiKey);
        setApiKeySuccess(t('shop.profile.success.apiCopied'));
        setTimeout(() => setApiKeySuccess(null), 2000);
      } else {
        // Fallback for unsupported browsers or insecure context
        const textarea = document.createElement('textarea');
        textarea.value = apiKey;
        document.body.appendChild(textarea);
        textarea.select();
        try {
          document.execCommand('copy');
          setApiKeySuccess(t('shop.profile.success.apiCopied'));
          setTimeout(() => setApiKeySuccess(null), 2000);
        } catch (err) {
          setApiKeyError(t('shop.profile.errors.copyApiKey'));
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
    <div className="container-fluid px-3 px-md-4 py-4" style={{ maxWidth: '1100px' }}>
      <div className="rounded-4 shadow-sm p-4 mb-4 text-white" style={{ background: 'linear-gradient(135deg, #ff7a3d 0%, #fa8831 28%, #cd7955 52%, #9d8f8d 74%, #4e97ef 100%)' }}>
        <h2 className="h3 fw-bold mb-0">{t('shop.profile.title')}</h2>
      </div>

      <div className="rounded-4 shadow-sm p-3 p-md-4 mb-4" style={{ background: '#fffaf5' }}>
        <h3 className="h5 fw-bold">{t('shop.profile.api.title')}</h3>
        <p className="text-muted">{t('shop.profile.api.subtitle')}</p>
        {apiKey ? (
          <div className="d-flex flex-column flex-md-row align-items-md-center gap-2">
            <input type="text" value={apiKey} readOnly className="form-control" style={{ fontFamily: 'monospace' }} />
            <button type="button" onClick={handleCopyApiKey} className="btn btn-primary">{t('shop.profile.actions.copy')}</button>
          </div>
        ) : (
          <button type="button" onClick={fetchApiKey} disabled={apiKeyLoading} className="btn btn-primary">{apiKeyLoading ? t('shop.profile.actions.generating') : t('shop.profile.actions.generateApiKey')}</button>
        )}
        {apiKeyError && <div className="alert alert-danger py-2 mt-2 mb-0">{apiKeyError}</div>}
        {apiKeySuccess && <div className="alert alert-success py-2 mt-2 mb-0">{apiKeySuccess}</div>}
      </div>

      <form className="rounded-4 shadow-sm p-3 p-md-4" style={{ background: '#fffaf5' }} onSubmit={handleSave}>
        <div className="mb-3">
          <label className="form-label fw-semibold">{t('shop.profile.fields.shopName')}</label>
          <input type="text" value={shopName} disabled className="form-control" />
        </div>

        <div className="mb-3">
          <label className="form-label fw-semibold">{t('shop.profile.fields.defaultContactName')}</label>
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
            className="form-control"
          />
        </div>

        <div className="mb-3">
          <label className="form-label fw-semibold">{t('shop.profile.fields.defaultContactPhone')}</label>
          <input
            type="tel"
            value={contactPhone}
            onChange={e => {
              let val = e.target.value.replace(/[^0-9]/g, '');
              if (val.length > 11) val = val.slice(0, 11);
              setContactPhone(val);
            }}
            required
            pattern="01[0-9]{9}"
            inputMode="numeric"
            maxLength={11}
            autoComplete="tel"
            className="form-control"
          />
        </div>

        <div className="mb-3">
          <label className="form-label fw-semibold">{t('shop.profile.fields.defaultPickupLocation')}</label>
          <div className="row g-2">
            <div className="col-12"><input className="form-control" type="text" name="street" placeholder={t('shop.profile.placeholders.street')} value={pickupAddress.street} onChange={handleAddressChange} required /></div>
            <div className="col-md-6"><input className="form-control" type="text" name="city" placeholder={t('shop.profile.placeholders.city')} value={pickupAddress.city} onChange={handleAddressChange} required /></div>
            <div className="col-md-6"><input className="form-control" type="text" name="state" placeholder={t('shop.profile.placeholders.state')} value={pickupAddress.state} onChange={handleAddressChange} required /></div>
            <div className="col-md-6"><input className="form-control" type="text" name="zipCode" placeholder={t('shop.profile.placeholders.zipCode')} value={pickupAddress.zipCode} onChange={handleAddressChange} required /></div>
            <div className="col-md-6"><input className="form-control" type="text" name="country" placeholder={t('shop.profile.placeholders.country')} value={pickupAddress.country} onChange={handleAddressChange} required /></div>
          </div>
        </div>

        <div className="mb-3">
          <label className="form-label fw-semibold">{t('shop.profile.fields.shippingFees')}</label>
          <input type="number" value={shippingFees} disabled className="form-control" />
        </div>

        <div className="mb-3">
          <label className="form-label fw-semibold">{t('shop.profile.fields.shownShippingFees')}</label>
          {editingShownShippingFees ? (
            <div className="d-flex gap-2 align-items-center">
              <input
                type="number"
                value={shownShippingFeesDraft}
                onChange={e => setShownShippingFeesDraft(e.target.value)}
                min="0"
                step="0.01"
                className="form-control"
              />
              <button
                type="button"
                className="btn btn-success btn-sm"
                onClick={async () => {
                  if (parseFloat(shownShippingFeesDraft) > parseFloat(shippingFees)) {
                    setShownShippingFeesError(t('shop.profile.errors.shownShippingFeesExceeded'));
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
              >{t('shop.profile.actions.save')}</button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setEditingShownShippingFees(false);
                  setShownShippingFeesDraft(shownShippingFees);
                }}
              >{t('shop.profile.actions.cancel')}</button>
            </div>
          ) : (
            <div className="d-flex gap-2 align-items-center">
              <input
                type="number"
                value={shownShippingFees}
                disabled
                className="form-control"
              />
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => setEditingShownShippingFees(true)}
              >{t('shop.profile.actions.edit')}</button>
            </div>
          )}
        </div>

        {shownShippingFeesError && <div className="alert alert-danger py-2">{shownShippingFeesError}</div>}

        {!showChangePassword && (
          <button type="button" className="btn btn-primary mb-3" onClick={() => setShowChangePassword(true)}>
            {t('shop.profile.actions.changePassword')}
          </button>
        )}
        {showChangePassword && (
          <div className="border rounded-3 p-3 mb-3" style={{ backgroundColor: '#fff' }}>
            <h3 className="h6 fw-bold">{t('shop.profile.password.title')}</h3>
            <input className="form-control mb-2" type="password" placeholder={t('shop.profile.password.current')} value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
            <input className="form-control mb-2" type="password" placeholder={t('shop.profile.password.new')} value={newPassword} onChange={e => setNewPassword(e.target.value)} />
            <input className="form-control mb-2" type="password" placeholder={t('shop.profile.password.confirm')} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
            {pwError && <div className="alert alert-danger py-2">{pwError}</div>}
            {pwSuccess && <div className="alert alert-success py-2">{pwSuccess}</div>}
            <div className="d-flex gap-2">
              <button type="button" className="btn btn-secondary" onClick={() => { setShowChangePassword(false); setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); setPwError(null); setPwSuccess(null); }}>{t('shop.profile.actions.cancel')}</button>
              <button type="button" className="btn btn-primary" onClick={handleChangePassword}>{t('shop.profile.actions.changePassword')}</button>
            </div>
          </div>
        )}

        {error && <div className="alert alert-danger py-2">{error}</div>}
        {success && <div className="alert alert-success py-2">{success}</div>}
        <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? t('shop.profile.actions.saving') : t('shop.profile.actions.saveChanges')}</button>
      </form>
    </div>
  );
};

export default ShopProfile; 