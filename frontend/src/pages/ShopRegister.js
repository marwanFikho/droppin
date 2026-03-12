import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { validateName, sanitizeNameInput, validatePhone } from '../utils/inputValidators';

const ShopRegister = () => {
  const [formData, setFormData] = useState({
    businessName: '',
    email: '', // This will be the login email
    password: '',
    confirmPassword: '',
    phone: '', // Business phone
    businessType: '',
    contactPerson: {
      name: '', // Contact person's name
      phone: '',
      email: ''
    },
    businessAddress: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: ''
    },
    registrationNumber: '',
    taxId: ''
  });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { register } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let newValue = value;
    // Business name and contact person name: sanitize and validate
    if (name === 'businessName' || name === 'contactPerson.name') {
      newValue = sanitizeNameInput(value);
      if (!validateName(newValue) && newValue !== '') return;
    }
    // Phone fields
    if (name === 'phone') {
      newValue = newValue.replace(/[^0-9]/g, '');
      if (newValue.length > 11) newValue = newValue.slice(0, 11);
      if (newValue && !/^0$|^01\d{0,9}$/.test(newValue)) return;
    }
    if (name === 'contactPerson.phone') {
      newValue = newValue.replace(/[^0-9]/g, '');
      if (newValue.length > 11) newValue = newValue.slice(0, 11);
    }
    if (name.includes('.')) {
      // Handle nested fields
      const [parent, child] = name.split('.');
      setFormData({
        ...formData,
        [parent]: {
          ...formData[parent],
          [child]: newValue
        }
      });
    } else {
      setFormData({ ...formData, [name]: newValue });
    }
    setFormError(''); // Clear error when user types
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Manual required fields (Zip/Postal Code is intentionally OPTIONAL)
    const required = [
      formData.businessName?.trim(),
      formData.email?.trim(),
      formData.phone?.trim(),
      formData.password,
      formData.confirmPassword,
      formData.businessType?.trim(),
      formData.contactPerson?.name?.trim(),
      formData.contactPerson?.phone?.trim(),
      formData.contactPerson?.email?.trim(),
      formData.businessAddress?.street?.trim(),
      formData.businessAddress?.city?.trim(),
      formData.businessAddress?.state?.trim(),
      formData.businessAddress?.country?.trim()
    ];
    if (required.some(v => !v)) {
      setFormError(t('shopRegister.errors.requiredFields'));
      return;
    }

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setFormError(t('shopRegister.errors.passwordMismatch'));
      return;
    }
    
    if (formData.password.length < 6) {
      setFormError(t('shopRegister.errors.passwordMinLength'));
      return;
    }

    // Business phone must match 01xxxxxxxxx
    if (!validatePhone(formData.phone)) {
      setFormError(t('shopRegister.errors.invalidBusinessPhone'));
      return;
    }
    
    try {
      setIsSubmitting(true);
      // Create a new object with businessName as name
      const shopData = {
        ...formData,
        name: formData.businessName // Add name field using businessName
      };
      
      await register(shopData, 'shop');
      // Redirect to success page without auto-sign-in
      navigate('/registration-success', { 
        state: { 
          userType: 'shop', 
          message: t('shopRegister.successMessage')
        } 
      });
    } catch (error) {
      setFormError(error.response?.data?.message || t('shopRegister.errors.registrationFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container-fluid d-flex align-items-center justify-content-center" style={{ minHeight: 'calc(100vh - 80px)', background: 'linear-gradient(135deg, #ff7a3d 0%, #fa8831 28%, #cd7955 52%, #9d8f8d 74%, #4e97ef 100%)', padding: '2rem 0' }}>
      <div className="w-100" style={{ maxWidth: '980px' }}>
        <div className="card shadow-lg border-3" style={{ borderColor: '#FF6B00' }}>
          <div className="card-body p-4 p-md-5">
            <div className="text-center mb-4">
              <h2 className="card-title fw-700 mb-2" style={{ color: '#1f2937' }}>{t('shopRegister.title')}</h2>
              <p className="text-muted mb-3">{t('shopRegister.subtitle')}</p>
              <div className="alert alert-warning py-2 mb-0">
                <strong>{t('shopRegister.noteLabel')}</strong> {t('shopRegister.noteText')}
              </div>
            </div>

            {formError && (
              <div className="alert alert-danger alert-dismissible fade show mb-4" role="alert">
                {formError}
                <button type="button" className="btn-close" onClick={() => setFormError('')}></button>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              <h4 className="fw-bold mb-3" style={{ color: '#FF6B00' }}>{t('shopRegister.sections.businessInfo')}</h4>
              <div className="row g-3 mb-4">
                <div className="col-12">
                  <label htmlFor="businessName" className="form-label fw-600">{t('shopRegister.fields.businessName')}</label>
                  <input
                    type="text"
                    id="businessName"
                    name="businessName"
                    value={formData.businessName}
                    onChange={handleChange}
                    className="form-control"
                    placeholder={t('shopRegister.placeholders.businessName')}
                    required
                    pattern="[A-Za-z\u0600-\u06FF ]+"
                    inputMode="text"
                    autoComplete="off"
                  />
                </div>
                <div className="col-md-6">
                  <label htmlFor="email" className="form-label fw-600">{t('shopRegister.fields.email')}</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="form-control"
                    placeholder={t('shopRegister.placeholders.email')}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label htmlFor="phone" className="form-label fw-600">{t('shopRegister.fields.businessPhone')}</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="form-control"
                    placeholder={t('shopRegister.placeholders.phone')}
                    required
                    inputMode="numeric"
                    maxLength={11}
                    pattern="01[0-9]{9}"
                    autoComplete="tel"
                  />
                </div>
                <div className="col-md-6">
                  <label htmlFor="password" className="form-label fw-600">{t('shopRegister.fields.password')}</label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="form-control"
                    placeholder={t('shopRegister.placeholders.password')}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label htmlFor="confirmPassword" className="form-label fw-600">{t('shopRegister.fields.confirmPassword')}</label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="form-control"
                    placeholder={t('shopRegister.placeholders.confirmPassword')}
                    required
                  />
                </div>
                <div className="col-12">
                  <label htmlFor="businessType" className="form-label fw-600">{t('shopRegister.fields.businessType')}</label>
                  <input
                    type="text"
                    id="businessType"
                    name="businessType"
                    value={formData.businessType}
                    onChange={handleChange}
                    className="form-control"
                    placeholder={t('shopRegister.placeholders.businessType')}
                    required
                  />
                </div>
              </div>

              <h4 className="fw-bold mb-2" style={{ color: '#FF6B00' }}>{t('shopRegister.sections.contactInfo')}</h4>
              <p className="text-muted small mb-3">{t('shopRegister.contactInfoDescription')}</p>
              <div className="row g-3 mb-4">
                <div className="col-md-6">
                  <label htmlFor="contactPerson.name" className="form-label fw-600">{t('shopRegister.fields.contactName')}</label>
                  <input
                    type="text"
                    id="contactPerson.name"
                    name="contactPerson.name"
                    value={formData.contactPerson.name}
                    onChange={handleChange}
                    className="form-control"
                    placeholder={t('shopRegister.placeholders.contactName')}
                    required
                    pattern="[A-Za-z\u0600-\u06FF ]+"
                    inputMode="text"
                    autoComplete="off"
                  />
                </div>
                <div className="col-md-6">
                  <label htmlFor="contactPerson.phone" className="form-label fw-600">{t('shopRegister.fields.contactPhone')}</label>
                  <input
                    type="tel"
                    id="contactPerson.phone"
                    name="contactPerson.phone"
                    value={formData.contactPerson.phone}
                    onChange={handleChange}
                    className="form-control"
                    placeholder={t('shopRegister.placeholders.phone')}
                    required
                    inputMode="numeric"
                    maxLength={11}
                    autoComplete="tel"
                  />
                </div>
                <div className="col-12">
                  <label htmlFor="contactPerson.email" className="form-label fw-600">{t('shopRegister.fields.contactEmail')}</label>
                  <input
                    type="email"
                    id="contactPerson.email"
                    name="contactPerson.email"
                    value={formData.contactPerson.email}
                    onChange={handleChange}
                    className="form-control"
                    placeholder={t('shopRegister.placeholders.contactEmail')}
                    required
                  />
                </div>
              </div>

              <h4 className="fw-bold mb-3" style={{ color: '#FF6B00' }}>{t('shopRegister.sections.address')}</h4>
              <div className="row g-3 mb-4">
                <div className="col-12">
                  <label htmlFor="businessAddress.street" className="form-label fw-600">{t('shopRegister.fields.streetAddress')}</label>
                  <input
                    type="text"
                    id="businessAddress.street"
                    name="businessAddress.street"
                    value={formData.businessAddress.street}
                    onChange={handleChange}
                    className="form-control"
                    placeholder={t('shopRegister.placeholders.streetAddress')}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label htmlFor="businessAddress.city" className="form-label fw-600">{t('shopRegister.fields.city')}</label>
                  <input
                    type="text"
                    id="businessAddress.city"
                    name="businessAddress.city"
                    value={formData.businessAddress.city}
                    onChange={handleChange}
                    className="form-control"
                    placeholder={t('shopRegister.placeholders.city')}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label htmlFor="businessAddress.state" className="form-label fw-600">{t('shopRegister.fields.state')}</label>
                  <input
                    type="text"
                    id="businessAddress.state"
                    name="businessAddress.state"
                    value={formData.businessAddress.state}
                    onChange={handleChange}
                    className="form-control"
                    placeholder={t('shopRegister.placeholders.state')}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label htmlFor="businessAddress.zipCode" className="form-label fw-600">{t('shopRegister.fields.zipCodeOptional')}</label>
                  <input
                    type="text"
                    id="businessAddress.zipCode"
                    name="businessAddress.zipCode"
                    value={formData.businessAddress.zipCode}
                    onChange={handleChange}
                    className="form-control"
                    placeholder={t('shopRegister.placeholders.zipCodeOptional')}
                  />
                </div>
                <div className="col-md-6">
                  <label htmlFor="businessAddress.country" className="form-label fw-600">{t('shopRegister.fields.country')}</label>
                  <input
                    type="text"
                    id="businessAddress.country"
                    name="businessAddress.country"
                    value={formData.businessAddress.country}
                    onChange={handleChange}
                    className="form-control"
                    placeholder={t('shopRegister.placeholders.country')}
                    required
                  />
                </div>
              </div>

              <h4 className="fw-bold mb-3" style={{ color: '#FF6B00' }}>{t('shopRegister.sections.legal')}</h4>
              <div className="row g-3 mb-4">
                <div className="col-md-6">
                  <label htmlFor="registrationNumber" className="form-label fw-600">{t('shopRegister.fields.registrationNumber')}</label>
                  <input
                    type="text"
                    id="registrationNumber"
                    name="registrationNumber"
                    value={formData.registrationNumber}
                    onChange={handleChange}
                    className="form-control"
                    placeholder={t('shopRegister.placeholders.registrationNumberOptional')}
                  />
                </div>
                <div className="col-md-6">
                  <label htmlFor="taxId" className="form-label fw-600">{t('shopRegister.fields.taxId')}</label>
                  <input
                    type="text"
                    id="taxId"
                    name="taxId"
                    value={formData.taxId}
                    onChange={handleChange}
                    className="form-control"
                    placeholder={t('shopRegister.placeholders.taxIdOptional')}
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary w-100 fw-600 py-2" disabled={isSubmitting}>
                {isSubmitting ? t('shopRegister.submitting') : t('shopRegister.submit')}
              </button>
            </form>

            <hr className="my-4" />
            <div className="text-center">
              <p className="mb-2 text-muted">
                {t('shopRegister.alreadyHaveAccount')} <Link to="/login" className="text-decoration-none">{t('shopRegister.login')}</Link>
              </p>
              <Link to="/register/driver" className="btn btn-outline-secondary btn-sm">{t('shopRegister.registerAsDriver')}</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShopRegister;
