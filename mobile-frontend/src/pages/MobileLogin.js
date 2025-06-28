import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './MobileLogin.css';
import { useTranslation } from 'react-i18next';

const MobileLogin = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  
  const { login } = useAuth();
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
    
    if (!formData.email.trim()) {
      newErrors.email = t('auth.login.validation.emailRequired');
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = t('auth.login.validation.emailInvalid');
    }
    
    if (!formData.password) {
      newErrors.password = t('auth.login.validation.passwordRequired');
    } else if (formData.password.length < 6) {
      newErrors.password = t('auth.login.validation.passwordLength');
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      const user = await login(formData);
      
      // Redirect based on user role
      switch (user.role) {
        case 'shop':
          navigate('/shop');
          break;
        case 'driver':
          navigate('/driver');
          break;
        case 'admin':
          navigate('/admin');
          break;
        default:
          navigate('/user');
      }
    } catch (error) {
      console.error('Login error:', error);
      setLoginError(error.message || t('auth.login.error.credentials'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mobile-login">
      <div className="mobile-login-container">
        <div className="mobile-login-header">
          <div className="mobile-login-icon">🔐</div>
          <h1 className="mobile-login-title">{t('auth.login.mobileTitle')}</h1>
          <p className="mobile-login-subtitle">{t('auth.login.mobileSubtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="mobile-login-form">
          {loginError && (
            <div className="alert alert-danger">
              {loginError}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email" className="form-label">{t('auth.login.email')}</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`form-control ${errors.email ? 'error' : ''}`}
              placeholder={t('auth.login.emailPlaceholder')}
              autoComplete="email"
            />
            {errors.email && <div className="error-message">{errors.email}</div>}
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">{t('auth.login.password')}</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={`form-control ${errors.password ? 'error' : ''}`}
              placeholder={t('auth.login.passwordPlaceholder')}
              autoComplete="current-password"
            />
            {errors.password && <div className="error-message">{errors.password}</div>}
          </div>

          <button
            type="submit"
            className="btn btn-primary w-100"
            disabled={loading}
          >
            {loading ? t('auth.login.buttonLoading') : t('auth.login.button')}
          </button>
        </form>

        <div className="mobile-login-footer">
          <p className="mobile-login-footer-text">
            {t('auth.login.noAccount')}{' '}
            <Link to="/register" className="mobile-login-link">
              {t('auth.login.registerLink')}
            </Link>
          </p>
          
          <div className="mobile-login-actions">
            <Link to="/register/shop" className="mobile-login-action-btn">
              {t('auth.login.registerShop')}
            </Link>
            <Link to="/register/driver" className="mobile-login-action-btn">
              {t('auth.login.registerDriver')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileLogin; 