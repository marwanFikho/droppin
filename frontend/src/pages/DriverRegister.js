import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

const DriverRegister = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: ''
    },
    vehicleType: 'car',
    vehicleDetails: {
      make: '',
      model: '',
      year: '',
      color: '',
      licensePlate: ''
    },
    licenseNumber: '',
    idNumber: ''
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
      await register(formData, 'driver');
      // Redirect to a success page instead of the driver dashboard
      navigate('/registration-success', { 
        state: { 
          userType: 'driver', 
          message: t('driver.register.successMessage')
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
          <h2>{t('driver.register.title')}</h2>
          <p>{t('driver.register.subtitle')}</p>
          <div className="approval-notice">
            <p><strong>{t('driver.register.note')}:</strong> {t('driver.register.approvalNotice')}</p>
          </div>
        </div>
        
        {formError && <div className="auth-error">{formError}</div>}
        
        <form onSubmit={handleSubmit} className="auth-form">
          <h3>{t('driver.register.personalInfo')}</h3>
          <div className="form-group">
            <label htmlFor="name">{t('auth.register.fullName')}</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder={t('auth.register.fullNamePlaceholder')}
              required
            />
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="email">{t('auth.register.email')}</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder={t('auth.register.emailPlaceholder')}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="phone">{t('auth.register.phone')}</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder={t('auth.register.phonePlaceholder')}
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
          
          <h3>{t('driver.register.addressInfo')}</h3>
          <div className="form-group">
            <label htmlFor="address.street">{t('auth.register.address.street')}</label>
            <input
              type="text"
              id="address.street"
              name="address.street"
              value={formData.address.street}
              onChange={handleChange}
              placeholder={t('auth.register.address.streetPlaceholder')}
              required
            />
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="address.city">{t('auth.register.address.city')}</label>
              <input
                type="text"
                id="address.city"
                name="address.city"
                value={formData.address.city}
                onChange={handleChange}
                placeholder={t('auth.register.address.cityPlaceholder')}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="address.state">{t('auth.register.address.state')}</label>
              <input
                type="text"
                id="address.state"
                name="address.state"
                value={formData.address.state}
                onChange={handleChange}
                placeholder={t('auth.register.address.statePlaceholder')}
                required
              />
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="address.zipCode">{t('auth.register.address.zipCode')}</label>
              <input
                type="text"
                id="address.zipCode"
                name="address.zipCode"
                value={formData.address.zipCode}
                onChange={handleChange}
                placeholder={t('auth.register.address.zipCodePlaceholder')}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="address.country">{t('auth.register.address.country')}</label>
              <input
                type="text"
                id="address.country"
                name="address.country"
                value={formData.address.country}
                onChange={handleChange}
                placeholder={t('auth.register.address.countryPlaceholder')}
                required
              />
            </div>
          </div>
          
          <h3>{t('driver.register.vehicleInfo')}</h3>
          <div className="form-group">
            <label htmlFor="vehicleType">{t('driver.register.vehicleType')}</label>
            <select
              id="vehicleType"
              name="vehicleType"
              value={formData.vehicleType}
              onChange={handleChange}
              required
            >
              <option value="car">{t('driver.register.vehicleTypes.car')}</option>
              <option value="motorcycle">{t('driver.register.vehicleTypes.motorcycle')}</option>
              <option value="bicycle">{t('driver.register.vehicleTypes.bicycle')}</option>
              <option value="van">{t('driver.register.vehicleTypes.van')}</option>
              <option value="truck">{t('driver.register.vehicleTypes.truck')}</option>
            </select>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="vehicleDetails.make">{t('driver.register.vehicleMake')}</label>
              <input
                type="text"
                id="vehicleDetails.make"
                name="vehicleDetails.make"
                value={formData.vehicleDetails.make}
                onChange={handleChange}
                placeholder={t('driver.register.vehicleMakePlaceholder')}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="vehicleDetails.model">{t('driver.register.vehicleModel')}</label>
              <input
                type="text"
                id="vehicleDetails.model"
                name="vehicleDetails.model"
                value={formData.vehicleDetails.model}
                onChange={handleChange}
                placeholder={t('driver.register.vehicleModelPlaceholder')}
                required
              />
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="vehicleDetails.year">{t('driver.register.vehicleYear')}</label>
              <input
                type="number"
                id="vehicleDetails.year"
                name="vehicleDetails.year"
                value={formData.vehicleDetails.year}
                onChange={handleChange}
                placeholder={t('driver.register.vehicleYearPlaceholder')}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="vehicleDetails.color">{t('driver.register.vehicleColor')}</label>
              <input
                type="text"
                id="vehicleDetails.color"
                name="vehicleDetails.color"
                value={formData.vehicleDetails.color}
                onChange={handleChange}
                placeholder={t('driver.register.vehicleColorPlaceholder')}
                required
              />
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="vehicleDetails.licensePlate">{t('driver.register.licensePlate')}</label>
            <input
              type="text"
              id="vehicleDetails.licensePlate"
              name="vehicleDetails.licensePlate"
              value={formData.vehicleDetails.licensePlate}
              onChange={handleChange}
              placeholder={t('driver.register.licensePlatePlaceholder')}
              required
            />
          </div>
          
          <h3>{t('driver.register.identification')}</h3>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="licenseNumber">{t('driver.register.driversLicense')}</label>
              <input
                type="text"
                id="licenseNumber"
                name="licenseNumber"
                value={formData.licenseNumber}
                onChange={handleChange}
                placeholder={t('driver.register.driversLicensePlaceholder')}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="idNumber">{t('driver.register.idNumber')}</label>
              <input
                type="text"
                id="idNumber"
                name="idNumber"
                value={formData.idNumber}
                onChange={handleChange}
                placeholder={t('driver.register.idNumberPlaceholder')}
                required
              />
            </div>
          </div>
          
          <button 
            type="submit" 
            className="auth-button" 
            disabled={isSubmitting}
          >
            {isSubmitting ? t('driver.register.buttonLoading') : t('driver.register.button')}
          </button>
        </form>
        
        <div className="auth-links">
          <p>
            {t('auth.register.hasAccount')}{' '}
            <Link to="/login">{t('auth.register.loginLink')}</Link>
          </p>
          <div className="role-specific-links">
            <Link to="/register">{t('driver.register.registerCustomer')}</Link>
            <Link to="/register/shop">{t('driver.register.registerShop')}</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DriverRegister;
