import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

const Register = () => {
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
    }
  });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      // Handle nested address fields
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
      await register(formData);
      navigate('/user'); // Redirect to user dashboard after successful registration
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
          <h2>{t('auth.register.title')}</h2>
          <p>{t('auth.register.subtitle')}</p>
        </div>
        
        {formError && <div className="auth-error">{formError}</div>}
        
        <form onSubmit={handleSubmit} className="auth-form">
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
          
          <div className="address-section">
            <h3>{t('auth.register.address.title')}</h3>
            
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
          </div>
          
          <button 
            type="submit" 
            className="auth-button" 
            disabled={isSubmitting}
          >
            {isSubmitting ? t('auth.register.buttonLoading') : t('auth.register.button')}
          </button>
        </form>
        
        <div className="auth-links">
          <p>
            {t('auth.register.hasAccount')}{' '}
            <Link to="/login">{t('auth.register.loginLink')}</Link>
          </p>
          <div className="role-specific-links">
            <p>{t('auth.register.roleLinks.title')}</p>
            <Link to="/register/shop">{t('auth.register.roleLinks.shop')}</Link>
            <Link to="/register/driver">{t('auth.register.roleLinks.driver')}</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
