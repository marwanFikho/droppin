import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './MobileDriverRegister.css';
import { useTranslation } from 'react-i18next';

const MobileDriverRegister = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    vehicleType: '',
    licenseNumber: '',
    password: '',
    confirmPassword: ''
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [registerError, setRegisterError] = useState('');
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const vehicleTypes = [
    t('auth.register.driver.vehicleTypes.car'),
    t('auth.register.driver.vehicleTypes.motorcycle'),
    t('auth.register.driver.vehicleTypes.van'),
    t('auth.register.driver.vehicleTypes.truck'),
    t('auth.register.driver.vehicleTypes.bicycle')
  ];

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
    
    if (!formData.firstName.trim()) {
      newErrors.firstName = t('auth.register.driver.validation.firstNameRequired');
    }
    
    if (!formData.lastName.trim()) {
      newErrors.lastName = t('auth.register.driver.validation.lastNameRequired');
    }
    
    if (!formData.email.trim()) {
      newErrors.email = t('auth.register.validation.emailRequired');
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = t('auth.register.validation.emailInvalid');
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = t('auth.register.driver.validation.phoneRequired');
    } else if (!/^[\+]?[1-9][\d]{0,15}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = t('auth.register.driver.validation.phoneInvalid');
    }
    
    if (!formData.address.trim()) {
      newErrors.address = t('auth.register.driver.validation.addressRequired');
    }
    
    if (!formData.city.trim()) {
      newErrors.city = t('auth.register.driver.validation.cityRequired');
    }
    
    if (!formData.state.trim()) {
      newErrors.state = t('auth.register.driver.validation.stateRequired');
    }
    
    if (!formData.zipCode.trim()) {
      newErrors.zipCode = t('auth.register.driver.validation.zipCodeRequired');
    } else if (!/^\d{5}(-\d{4})?$/.test(formData.zipCode)) {
      newErrors.zipCode = t('auth.register.driver.validation.zipCodeInvalid');
    }
    
    if (!formData.vehicleType) {
      newErrors.vehicleType = t('auth.register.driver.validation.vehicleTypeRequired');
    }
    
    if (!formData.licenseNumber.trim()) {
      newErrors.licenseNumber = t('auth.register.driver.validation.licenseRequired');
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
        role: 'driver',
        name: `${formData.firstName} ${formData.lastName}`,
        driverInfo: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
          vehicleType: formData.vehicleType,
          licenseNumber: formData.licenseNumber
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
    <div className="mobile-driver-register">
      <div className="mobile-driver-register-container">
        <div className="mobile-driver-register-header">
          <div className="mobile-driver-register-icon">🚚</div>
          <h1 className="mobile-driver-register-title">{t('auth.register.driver.title')}</h1>
          <p className="mobile-driver-register-subtitle">{t('auth.register.driver.subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="mobile-driver-register-form">
          {registerError && (
            <div className="alert alert-danger">
              {registerError}
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="firstName" className="form-label">{t('auth.register.driver.firstName')} *</label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className={`form-control ${errors.firstName ? 'error' : ''}`}
                placeholder={t('auth.register.driver.firstNamePlaceholder')}
              />
              {errors.firstName && <div className="error-message">{errors.firstName}</div>}
            </div>

            <div className="form-group">
              <label htmlFor="lastName" className="form-label">{t('auth.register.driver.lastName')} *</label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className={`form-control ${errors.lastName ? 'error' : ''}`}
                placeholder={t('auth.register.driver.lastNamePlaceholder')}
              />
              {errors.lastName && <div className="error-message">{errors.lastName}</div>}
            </div>
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
            <label htmlFor="phone" className="form-label">{t('auth.register.driver.phone')} *</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className={`form-control ${errors.phone ? 'error' : ''}`}
              placeholder={t('auth.register.driver.phonePlaceholder')}
              autoComplete="tel"
            />
            {errors.phone && <div className="error-message">{errors.phone}</div>}
          </div>

          <div className="form-group">
            <label htmlFor="address" className="form-label">{t('auth.register.driver.address')} *</label>
            <input
              type="text"
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className={`form-control ${errors.address ? 'error' : ''}`}
              placeholder={t('auth.register.driver.addressPlaceholder')}
            />
            {errors.address && <div className="error-message">{errors.address}</div>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="city" className="form-label">{t('auth.register.driver.city')} *</label>
              <input
                type="text"
                id="city"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className={`form-control ${errors.city ? 'error' : ''}`}
                placeholder={t('auth.register.driver.city')}
              />
              {errors.city && <div className="error-message">{errors.city}</div>}
            </div>

            <div className="form-group">
              <label htmlFor="state" className="form-label">{t('auth.register.driver.state')} *</label>
              <input
                type="text"
                id="state"
                name="state"
                value={formData.state}
                onChange={handleChange}
                className={`form-control ${errors.state ? 'error' : ''}`}
                placeholder={t('auth.register.driver.state')}
              />
              {errors.state && <div className="error-message">{errors.state}</div>}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="zipCode" className="form-label">{t('auth.register.driver.zipCode')} *</label>
            <input
              type="text"
              id="zipCode"
              name="zipCode"
              value={formData.zipCode}
              onChange={handleChange}
              className={`form-control ${errors.zipCode ? 'error' : ''}`}
              placeholder={t('auth.register.driver.zipCodePlaceholder')}
            />
            {errors.zipCode && <div className="error-message">{errors.zipCode}</div>}
          </div>

          <div className="form-group">
            <label htmlFor="vehicleType" className="form-label">{t('auth.register.driver.vehicleType')} *</label>
            <select
              id="vehicleType"
              name="vehicleType"
              value={formData.vehicleType}
              onChange={handleChange}
              className={`form-control ${errors.vehicleType ? 'error' : ''}`}
            >
              <option value="">{t('auth.register.driver.selectVehicle')}</option>
              {vehicleTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            {errors.vehicleType && <div className="error-message">{errors.vehicleType}</div>}
          </div>

          <div className="form-group">
            <label htmlFor="licenseNumber" className="form-label">{t('auth.register.driver.licenseNumber')} *</label>
            <input
              type="text"
              id="licenseNumber"
              name="licenseNumber"
              value={formData.licenseNumber}
              onChange={handleChange}
              className={`form-control ${errors.licenseNumber ? 'error' : ''}`}
              placeholder={t('auth.register.driver.licensePlaceholder')}
            />
            {errors.licenseNumber && <div className="error-message">{errors.licenseNumber}</div>}
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
            {loading ? t('auth.register.driver.buttonLoading') : t('auth.register.driver.button')}
          </button>
        </form>

        <div className="mobile-driver-register-footer">
          <p className="mobile-driver-register-footer-text">
            {t('auth.register.hasAccount')}{' '}
            <Link to="/login" className="mobile-driver-register-link">
              {t('auth.register.signIn')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default MobileDriverRegister; 