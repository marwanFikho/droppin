import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setFormError(''); // Clear error when user types
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Simple validation
    if (!formData.email || !formData.password) {
      setFormError('Please enter both email and password');
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
      setFormError(error.response?.data?.message || 'Failed to login. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-form-container">
        <div className="auth-header">
          <h2>Login to Droppin</h2>
          <p>Enter your credentials to access your account</p>
        </div>
        
        {formError && <div className="auth-error">{formError}</div>}
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              required
            />
          </div>
          
          <button 
            type="submit" 
            className="auth-button" 
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Logging in...' : 'Login'}
          </button>
        </form>
        
        <div className="auth-links">
          <p>
            Don't have an account?{' '}
            <Link to="/register">Register</Link>
          </p>
          <div className="role-specific-links">
            <Link to="/register/shop">Register as a Shop</Link>
            <Link to="/register/driver">Register as a Driver</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
