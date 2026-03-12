import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const { t } = useTranslation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setFormError(''); // Clear error when user types
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Simple validation
    if (!formData.email || !formData.password) {
      setFormError(t('login.missingFields'));
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
      setFormError(error.response?.data?.message || t('login.invalidCredentials'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container-fluid d-flex align-items-center justify-content-center" style={{ minHeight: 'calc(100vh - 80px)', background: 'linear-gradient(135deg, #ff7a3d 0%, #fa8831 28%, #cd7955 52%, #9d8f8d 74%, #4e97ef 100%)', padding: '2rem 0' }}>
      <div className="w-100" style={{ maxWidth: '450px' }}>
        <div className="card shadow-lg border-3" style={{ borderColor: '#FF6B00' }}>
          <div className="card-body p-5">
            {/* Header */}
            <div className="text-center mb-4">
              <h2 className="card-title fw-700 mb-2" style={{ color: '#1f2937' }}>
                {t('login.title', { brand: t('brand.name') })}
              </h2>
              <p className="text-muted">{t('login.subtitle')}</p>
            </div>

            {/* Error Alert */}
            {formError && (
              <div className="alert alert-danger alert-dismissible fade show mb-4" role="alert">
                {formError}
                <button type="button" className="btn-close" onClick={() => setFormError('')}></button>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit}>
              {/* Email Field */}
              <div className="mb-3">
                <label htmlFor="email" className="form-label fw-600" style={{ color: '#1f2937' }}>
                  {t('login.email')}
                </label>
                <input
                  type="email"
                  className="form-control"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder={t('login.emailPlaceholder')}
                  required
                />
              </div>

              {/* Password Field */}
              <div className="mb-4">
                <label htmlFor="password" className="form-label fw-600" style={{ color: '#1f2937' }}>
                  {t('login.password')}
                </label>
                <input
                  type="password"
                  className="form-control"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder={t('login.passwordPlaceholder')}
                  required
                />
              </div>

              {/* Submit Button */}
              <button 
                type="submit" 
                className="btn btn-primary w-100 fw-600 py-2 mb-3"
                disabled={isSubmitting}
              >
                {isSubmitting ? t('login.submitting') : t('login.submit')}
              </button>
            </form>

            {/* Divider */}
            <hr className="my-3" />

            {/* Registration Links */}
            <div className="text-center">
              <p className="small text-muted mb-3">
                {t('login.noAccount')}
              </p>
              <div className="d-grid gap-2">
                <Link to="/register/shop" className="btn btn-outline-primary fw-600 mb-2">
                  {t('login.registerAsShop')}
                </Link>
                <Link to="/register/driver" className="btn btn-outline-secondary fw-600">
                  {t('login.registerAsDriver')}
                </Link>
              </div>
            </div>

            {/* Back Link */}
            <div className="text-center mt-4">
              <Link to="/" className="text-decoration-none small text-muted">
                {`← ${t('login.backToHome')}`}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
