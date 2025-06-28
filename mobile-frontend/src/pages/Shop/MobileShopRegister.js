import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './MobileShopRegister.css';
import { useTranslation } from 'react-i18next';

const MobileShopRegister = () => {
  const [formData, setFormData] = useState({
    shopName: '',
    ownerName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    password: '',
    confirmPassword: ''
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [registerError, setRegisterError] = useState('');
  
  const { register } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.shopName.trim()) {
      newErrors.shopName = t('auth.register.shop.validation.shopNameRequired');
    }
    
    if (!formData.ownerName.trim()) {
      newErrors.ownerName = t('auth.register.shop.validation.ownerNameRequired');
    }
    
    if (!formData.email.trim()) {
      newErrors.email = t('auth.register.validation.emailRequired');
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = t('auth.register.validation.emailInvalid');
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = t('auth.register.shop.validation.phoneRequired');
    } else if (!/^[\+]?[1-9][\d]{0,15}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = t('auth.register.shop.validation.phoneInvalid');
    }
    
    if (!formData.address.trim()) {
      newErrors.address = t('auth.register.shop.validation.addressRequired');
    }
    
    if (!formData.city.trim()) {
      newErrors.city = t('auth.register.shop.validation.cityRequired');
    }
    
    if (!formData.state.trim()) {
      newErrors.state = t('auth.register.shop.validation.stateRequired');
    }
    
    if (!formData.zipCode.trim()) {
      newErrors.zipCode = t('auth.register.shop.validation.zipCodeRequired');
    } else if (!/^\d{5}(-\d{4})?$/.test(formData.zipCode)) {
      newErrors.zipCode = t('auth.register.shop.validation.zipCodeInvalid');
    }
    
    if (!formData.password) {
      newErrors.password = t('auth.register.validation.passwordRequired');
    } else if (formData.password.length < 6) {
      newErrors.password = t('auth.register.validation.passwordLength');
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = t('auth.register.validation.confirmPasswordRequired');
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t('auth.register.validation.passwordMismatch');
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setRegisterError('');
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      const userData = {
        ...formData,
        role: 'shop',
        shopInfo: {
          shopName: formData.shopName,
          ownerName: formData.ownerName,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode
        }
      };
      
      await register(userData);
      navigate('/registration-success');
    } catch (error) {
      console.error('Registration error:', error);
      setRegisterError(error.message || t('auth.register.error.failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mobile-shop-register">
      <div className="mobile-shop-register-container">
        <div className="mobile-shop-register-header">
          <div className="mobile-shop-register-icon">🏪</div>
          <h1 className="mobile-shop-register-title">{t('auth.register.shop.title')}</h1>
          <p className="mobile-shop-register-subtitle">{t('auth.register.shop.subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="mobile-shop-register-form">
          {registerError && (
            <div className="alert alert-danger">
              {registerError}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="shopName" className="form-label">{t('auth.register.shop.shopName')} *</label>
            <input
              type="text"
              id="shopName"
              name="shopName"
              value={formData.shopName}
              onChange={handleChange}
              className={`form-control ${errors.shopName ? 'error' : ''}`}
              placeholder={t('auth.register.shop.shopNamePlaceholder')}
            />
            {errors.shopName && <div className="error-message">{errors.shopName}</div>}
          </div>

          <div className="form-group">
            <label htmlFor="ownerName" className="form-label">{t('auth.register.shop.ownerName')} *</label>
            <input
              type="text"
              id="ownerName"
              name="ownerName"
              value={formData.ownerName}
              onChange={handleChange}
              className={`form-control ${errors.ownerName ? 'error' : ''}`}
              placeholder={t('auth.register.shop.ownerNamePlaceholder')}
            />
            {errors.ownerName && <div className="error-message">{errors.ownerName}</div>}
          </div>

          <div className="form-group">
            <label htmlFor="email" className="form-label">{t('auth.register.email')} *</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`form-control ${errors.email ? 'error' : ''}`}
              placeholder={t('auth.register.emailPlaceholder')}
              autoComplete="email"
            />
            {errors.email && <div className="error-message">{errors.email}</div>}
          </div>

          <div className="form-group">
            <label htmlFor="phone" className="form-label">{t('auth.register.shop.phone')} *</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className={`form-control ${errors.phone ? 'error' : ''}`}
              placeholder={t('auth.register.shop.phonePlaceholder')}
              autoComplete="tel"
            />
            {errors.phone && <div className="error-message">{errors.phone}</div>}
          </div>

          <div className="form-group">
            <label htmlFor="address" className="form-label">{t('auth.register.shop.address')} *</label>
            <input
              type="text"
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className={`form-control ${errors.address ? 'error' : ''}`}
              placeholder={t('auth.register.shop.addressPlaceholder')}
            />
            {errors.address && <div className="error-message">{errors.address}</div>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="city" className="form-label">{t('auth.register.shop.city')} *</label>
              <input
                type="text"
                id="city"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className={`form-control ${errors.city ? 'error' : ''}`}
                placeholder={t('auth.register.shop.city')}
              />
              {errors.city && <div className="error-message">{errors.city}</div>}
            </div>

            <div className="form-group">
              <label htmlFor="state" className="form-label">{t('auth.register.shop.state')} *</label>
              <input
                type="text"
                id="state"
                name="state"
                value={formData.state}
                onChange={handleChange}
                className={`form-control ${errors.state ? 'error' : ''}`}
                placeholder={t('auth.register.shop.state')}
              />
              {errors.state && <div className="error-message">{errors.state}</div>}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="zipCode" className="form-label">{t('auth.register.shop.zipCode')} *</label>
            <input
              type="text"
              id="zipCode"
              name="zipCode"
              value={formData.zipCode}
              onChange={handleChange}
              className={`form-control ${errors.zipCode ? 'error' : ''}`}
              placeholder={t('auth.register.shop.zipCodePlaceholder')}
            />
            {errors.zipCode && <div className="error-message">{errors.zipCode}</div>}
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">{t('auth.register.password')} *</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={`form-control ${errors.password ? 'error' : ''}`}
              placeholder={t('auth.register.passwordPlaceholder')}
              autoComplete="new-password"
            />
            {errors.password && <div className="error-message">{errors.password}</div>}
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword" className="form-label">{t('auth.register.confirmPassword')} *</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className={`form-control ${errors.confirmPassword ? 'error' : ''}`}
              placeholder={t('auth.register.confirmPasswordPlaceholder')}
              autoComplete="new-password"
            />
            {errors.confirmPassword && <div className="error-message">{errors.confirmPassword}</div>}
          </div>

          <button
            type="submit"
            className="btn btn-primary w-100"
            disabled={loading}
          >
            {loading ? t('auth.register.shop.buttonLoading') : t('auth.register.shop.button')}
          </button>
        </form>

        <div className="mobile-shop-register-footer">
          <p className="mobile-shop-register-footer-text">
            {t('auth.register.hasAccount')}{' '}
            <Link to="/login" className="mobile-shop-register-link">
              {t('auth.register.signIn')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default MobileShopRegister; 