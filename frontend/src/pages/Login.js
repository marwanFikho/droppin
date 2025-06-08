import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setFormError(''); // Clear error when user types
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Simple validation
    if (!formData.email || !formData.password) {
      setFormError(t('auth.login.error.required'));
      return;
    }
    
    try {
      setIsSubmitting(true);
      console.log('Attempting login with:', { email: formData.email });
      const user = await login(formData);
      console.log('Login successful:', user);
      
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
      console.error('Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      setFormError(error.response?.data?.message || t('auth.login.error.credentials'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-form-container">
        <div className="auth-header">
          <h2>{t('auth.login.title')}</h2>
          <p>{t('auth.login.subtitle')}</p>
        </div>
        
        {formError && <div className="auth-error">{formError}</div>}
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">{t('auth.login.email')}</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder={t('auth.login.emailPlaceholder')}
              className="form-control auth-input"
              dir="auto"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">{t('auth.login.password')}</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder={t('auth.login.passwordPlaceholder')}
              className="form-control"
              required
            />
          </div>
          
          <button 
            type="submit" 
            className="auth-button" 
            disabled={isSubmitting}
          >
            {isSubmitting ? t('auth.login.buttonLoading') : t('auth.login.button')}
          </button>
        </form>
        
        <div className="auth-links">
          <p>
            {t('auth.login.noAccount')}{' '}
            <Link to="/register">{t('auth.login.registerLink')}</Link>
          </p>
          <div className="role-specific-links">
            <Link to="/register/shop">{t('auth.login.registerShop')}</Link>
            <Link to="/register/driver">{t('auth.login.registerDriver')}</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
