import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

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
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      // Handle nested fields
      const [parent, child] = name.split('.');
      setFormData({
        ...formData,
        [parent]: {
          ...formData[parent],
          [child]: value
        }
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
    
    setFormError(''); // Clear error when user types
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (formData.password !== formData.confirmPassword) {
      setFormError(t('auth.register.validation.passwordMatch'));
      return;
    }
    
    if (formData.password.length < 6) {
      setFormError(t('auth.register.validation.passwordLength'));
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
          message: t('shop.register.successMessage')
        } 
      });
    } catch (error) {
      setFormError(error.response?.data?.message || t('auth.register.validation.failed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-form-container">
        <div className="auth-header">
          <h2>{t('shop.register.title')}</h2>
          <p>{t('shop.register.subtitle')}</p>
          <div className="approval-notice">
            <p><strong>{t('shop.register.note')}:</strong> {t('shop.register.approvalNotice')}</p>
          </div>
        </div>
        
        {formError && <div className="auth-error">{formError}</div>}
        
        <form onSubmit={handleSubmit} className="auth-form">
          <h3>{t('shop.register.businessInfo')}</h3>
          <div className="form-group">
            <label htmlFor="businessName">{t('shop.register.businessName')}</label>
            <input
              type="text"
              id="businessName"
              name="businessName"
              value={formData.businessName}
              onChange={handleChange}
              placeholder={t('shop.register.businessNamePlaceholder')}
              required
            />
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="email">{t('shop.register.email')}</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder={t('shop.register.emailPlaceholder')}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="phone">{t('shop.register.businessPhone')}</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder={t('shop.register.businessPhonePlaceholder')}
                required
              />
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="password">{t('auth.register.password')}</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder={t('auth.register.passwordPlaceholder')}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="confirmPassword">{t('auth.register.confirmPassword')}</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder={t('auth.register.confirmPasswordPlaceholder')}
                required
              />
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="businessType">{t('shop.register.businessType')}</label>
            <input
              type="text"
              id="businessType"
              name="businessType"
              value={formData.businessType}
              onChange={handleChange}
              placeholder={t('shop.register.businessTypePlaceholder')}
              required
            />
          </div>
          
          <h4>{t('shop.register.contactPersonInfo')}</h4>
          <p className="form-info">{t('shop.register.contactPersonDescription')}</p>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="contactPerson.name">{t('shop.register.contactPersonName')}</label>
              <input
                type="text"
                id="contactPerson.name"
                name="contactPerson.name"
                value={formData.contactPerson.name}
                onChange={handleChange}
                placeholder={t('shop.register.contactPersonNamePlaceholder')}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="contactPerson.phone">{t('shop.register.contactPersonPhone')}</label>
              <input
                type="tel"
                id="contactPerson.phone"
                name="contactPerson.phone"
                value={formData.contactPerson.phone}
                onChange={handleChange}
                placeholder={t('shop.register.contactPersonPhonePlaceholder')}
                required
              />
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="contactPerson.email">{t('shop.register.contactPersonEmail')}</label>
            <input
              type="email"
              id="contactPerson.email"
              name="contactPerson.email"
              value={formData.contactPerson.email}
              onChange={handleChange}
              placeholder={t('shop.register.contactPersonEmailPlaceholder')}
              required
            />
          </div>
          
          <h4>{t('shop.register.businessAddress')}</h4>
          <div className="form-group">
            <label htmlFor="businessAddress.street">{t('auth.register.address.street')}</label>
            <input
              type="text"
              id="businessAddress.street"
              name="businessAddress.street"
              value={formData.businessAddress.street}
              onChange={handleChange}
              placeholder={t('auth.register.address.streetPlaceholder')}
              required
            />
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="businessAddress.city">{t('auth.register.address.city')}</label>
              <input
                type="text"
                id="businessAddress.city"
                name="businessAddress.city"
                value={formData.businessAddress.city}
                onChange={handleChange}
                placeholder={t('auth.register.address.cityPlaceholder')}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="businessAddress.state">{t('auth.register.address.state')}</label>
              <input
                type="text"
                id="businessAddress.state"
                name="businessAddress.state"
                value={formData.businessAddress.state}
                onChange={handleChange}
                placeholder={t('auth.register.address.statePlaceholder')}
                required
              />
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="businessAddress.zipCode">{t('auth.register.address.zipCode')}</label>
              <input
                type="text"
                id="businessAddress.zipCode"
                name="businessAddress.zipCode"
                value={formData.businessAddress.zipCode}
                onChange={handleChange}
                placeholder={t('auth.register.address.zipCodePlaceholder')}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="businessAddress.country">{t('auth.register.address.country')}</label>
              <input
                type="text"
                id="businessAddress.country"
                name="businessAddress.country"
                value={formData.businessAddress.country}
                onChange={handleChange}
                placeholder={t('auth.register.address.countryPlaceholder')}
                required
              />
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="registrationNumber">{t('shop.register.registrationNumber')}</label>
              <input
                type="text"
                id="registrationNumber"
                name="registrationNumber"
                value={formData.registrationNumber}
                onChange={handleChange}
                placeholder={t('shop.register.registrationNumberPlaceholder')}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="taxId">{t('shop.register.taxId')}</label>
              <input
                type="text"
                id="taxId"
                name="taxId"
                value={formData.taxId}
                onChange={handleChange}
                placeholder={t('shop.register.taxIdPlaceholder')}
              />
            </div>
          </div>
          
          <button 
            type="submit" 
            className="auth-button" 
            disabled={isSubmitting}
          >
            {isSubmitting ? t('shop.register.buttonLoading') : t('shop.register.button')}
          </button>
        </form>
        
        <div className="auth-links">
          <p>
            {t('auth.register.hasAccount')}{' '}
            <Link to="/login">{t('auth.register.loginLink')}</Link>
          </p>
          <div className="role-specific-links">
            <Link to="/register">{t('shop.register.registerCustomer')}</Link>
            <Link to="/register/driver">{t('shop.register.registerDriver')}</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShopRegister;
