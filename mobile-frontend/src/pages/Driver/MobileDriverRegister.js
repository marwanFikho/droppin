import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './MobileDriverRegister.css';
import { useTranslation } from 'react-i18next';
import { authService } from '../../services/api';
import { sanitizeNameInput, validateName, validatePhone } from '../../utils/inputValidators';

const MobileDriverRegister = () => {
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
    plateNumber: '',
    password: '',
    confirmPassword: ''
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [registerError, setRegisterError] = useState('');
  const [registerSuccess, setRegisterSuccess] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const vehicleTypes = [
    'Car',
    'Motorcycle',
    'Van',
    'Truck',
    'Bicycle'
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    let newValue = value;
    // Name fields: sanitize and validate
    if (name === 'firstName' || name === 'lastName') {
      newValue = sanitizeNameInput(value);
      if (!validateName(newValue) && newValue !== '') return;
    }
    // Phone field: restrict to numbers, length, and 01 prefix
    if (name === 'phone') {
      newValue = newValue.replace(/[^0-9]/g, '');
      if (newValue.length > 11) newValue = newValue.slice(0, 11);
      if (newValue && !/^0$|^01\d{0,9}$/.test(newValue)) return;
    }
    setFormData(prev => ({
      ...prev,
      [name]: newValue
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
      newErrors.firstName = 'First name is required';
    }
    
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!validatePhone(formData.phone.trim())) {
      newErrors.phone = 'Please enter a valid phone number (01xxxxxxxxx)';
    }
    
    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }
    
    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }
    
    if (!formData.state.trim()) {
      newErrors.state = 'State is required';
    }
    
    if (!formData.zipCode.trim()) {
      newErrors.zipCode = 'ZIP code is required';
    } else if (!/^\d{5,6}(-\d{4})?$/.test(formData.zipCode)) {
      newErrors.zipCode = 'Please enter a valid ZIP code';
    }
    
    if (!formData.vehicleType) {
      newErrors.vehicleType = 'Vehicle type is required';
    }
    
    if (!formData.licenseNumber.trim()) {
      newErrors.licenseNumber = 'License number is required';
    }
    
    if (!formData.plateNumber.trim()) {
      newErrors.plateNumber = 'Plate number is required';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
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
        name: `${formData.firstName} ${formData.lastName}`.trim(),
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        address: {
          street: formData.address,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
          country: '' // Optionally add to form
        },
        vehicleType: formData.vehicleType,
        vehicleDetails: {
          make: '', // Optionally add to form
          model: '', // Optionally add to form
          year: '', // Optionally add to form
          color: '', // Optionally add to form
          licensePlate: formData.plateNumber
        },
        licenseNumber: formData.licenseNumber,
        idNumber: '' // Optionally add to form
      };
      await authService.registerDriver(userData);
      setRegisterSuccess(true);
    } catch (error) {
      console.error('Registration error:', error);
      setRegisterError(error.message || 'Failed to register. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mobile-driver-register">
      <div className="mobile-driver-register-container">
        <div className="mobile-driver-register-header">
          <div className="mobile-driver-register-icon">🚚</div>
          <h1 className="mobile-driver-register-title">{t('driver.register.joinAsDriver')}</h1>
          <p className="mobile-driver-register-subtitle">{t('driver.register.startEarning')}</p>
        </div>

        <form onSubmit={handleSubmit} className="mobile-driver-register-form">
          {registerError && (
            <div className="alert alert-danger">
              {registerError}
            </div>
          )}

          {registerSuccess && (
            <div className="alert alert-success">
              Registration successful! Your driver account is pending admin approval. You will be able to sign in once approved.
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="firstName" className="form-label">{t('driver.register.firstName')}</label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className={`form-control ${errors.firstName ? 'error' : ''}`}
                placeholder={t('driver.register.firstName')}
                required
                pattern="[A-Za-z\u0600-\u06FF ]+"
                inputMode="text"
                autoComplete="off"
              />
              {errors.firstName && <div className="error-message">{errors.firstName}</div>}
            </div>

            <div className="form-group">
              <label htmlFor="lastName" className="form-label">{t('driver.register.lastName')}</label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className={`form-control ${errors.lastName ? 'error' : ''}`}
                placeholder={t('driver.register.lastName')}
                required
                pattern="[A-Za-z\u0600-\u06FF ]+"
                inputMode="text"
                autoComplete="off"
              />
              {errors.lastName && <div className="error-message">{errors.lastName}</div>}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="email" className="form-label">{t('driver.register.email')}</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`form-control ${errors.email ? 'error' : ''}`}
              placeholder={t('driver.register.email')}
              autoComplete="email"
            />
            {errors.email && <div className="error-message">{errors.email}</div>}
          </div>

          <div className="form-group">
            <label htmlFor="phone" className="form-label">{t('driver.register.phone')}</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className={`form-control ${errors.phone ? 'error' : ''}`}
              placeholder={t('driver.register.phone')}
              required
              pattern="01[0-9]{9}"
              inputMode="numeric"
              maxLength={11}
              autoComplete="tel"
            />
            {errors.phone && <div className="error-message">{errors.phone}</div>}
          </div>

          <div className="form-group">
            <label htmlFor="address" className="form-label">{t('driver.register.address')}</label>
            <input
              type="text"
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className={`form-control ${errors.address ? 'error' : ''}`}
              placeholder={t('driver.register.address')}
            />
            {errors.address && <div className="error-message">{errors.address}</div>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="city" className="form-label">{t('driver.register.city')}</label>
              <input
                type="text"
                id="city"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className={`form-control ${errors.city ? 'error' : ''}`}
                placeholder={t('driver.register.city')}
              />
              {errors.city && <div className="error-message">{errors.city}</div>}
            </div>

            <div className="form-group">
              <label htmlFor="state" className="form-label">{t('driver.register.state')}</label>
              <input
                type="text"
                id="state"
                name="state"
                value={formData.state}
                onChange={handleChange}
                className={`form-control ${errors.state ? 'error' : ''}`}
                placeholder={t('driver.register.state')}
              />
              {errors.state && <div className="error-message">{errors.state}</div>}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="zipCode" className="form-label">{t('driver.register.zipCode')}</label>
            <input
              type="text"
              id="zipCode"
              name="zipCode"
              value={formData.zipCode}
              onChange={handleChange}
              className={`form-control ${errors.zipCode ? 'error' : ''}`}
              placeholder={t('driver.register.zipCode')}
            />
            {errors.zipCode && <div className="error-message">{errors.zipCode}</div>}
          </div>

          <div className="form-group">
            <label htmlFor="vehicleType" className="form-label">{t('driver.register.vehicleType')}</label>
            <select
              id="vehicleType"
              name="vehicleType"
              value={formData.vehicleType}
              onChange={handleChange}
              className={`form-control ${errors.vehicleType ? 'error' : ''}`}
            >
              <option value="">{t('driver.register.selectVehicleType')}</option>
              {vehicleTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            {errors.vehicleType && <div className="error-message">{errors.vehicleType}</div>}
          </div>

          <div className="form-group">
            <label htmlFor="licenseNumber" className="form-label">{t('driver.register.licenseNumber') || "License Number"}</label>
            <input
              type="text"
              id="licenseNumber"
              name="licenseNumber"
              value={formData.licenseNumber}
              onChange={handleChange}
              className={`form-control ${errors.licenseNumber ? 'error' : ''}`}
              placeholder={t('driver.register.licenseNumber') || "License Number"}
            />
            {errors.licenseNumber && <div className="error-message">{errors.licenseNumber}</div>}
            <label htmlFor="plateNumber" className="form-label">Plate Number</label>
            <input
              type="text"
              id="plateNumber"
              name="plateNumber"
              value={formData.plateNumber}
              onChange={handleChange}
              className={`form-control ${errors.plateNumber ? 'error' : ''}`}
              placeholder="Plate Number"
            />
            {errors.plateNumber && <div className="error-message">{errors.plateNumber}</div>}
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">{t('driver.register.password')}</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={`form-control ${errors.password ? 'error' : ''}`}
              placeholder={t('driver.register.createPassword')}
              autoComplete="new-password"
            />
            {errors.password && <div className="error-message">{errors.password}</div>}
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword" className="form-label">{t('driver.register.confirmPassword')}</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className={`form-control ${errors.confirmPassword ? 'error' : ''}`}
              placeholder={t('driver.register.confirmYourPassword')}
              autoComplete="new-password"
            />
            {errors.confirmPassword && <div className="error-message">{errors.confirmPassword}</div>}
          </div>

          <button
            type="submit"
            className="btn btn-primary w-100"
            disabled={loading || registerSuccess}
          >
            {loading ? t('driver.register.creatingAccount') : t('driver.register.register')}
          </button>
        </form>

        <div className="mobile-driver-register-footer">
          <p className="mobile-driver-register-footer-text">
            {t('driver.register.alreadyHaveAccount')} 
            <Link to="/login" className="mobile-driver-register-link">
              {t('driver.register.signInHere')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default MobileDriverRegister; 