import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { validateName, sanitizeNameInput, validatePhone } from '../utils/inputValidators';

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    let newValue = value;
    // Name field: sanitize and validate
    if (name === 'name') {
      newValue = sanitizeNameInput(value);
      if (!validateName(newValue) && newValue !== '') return; // block invalid
    }
    // Phone field: restrict to numbers and length
    if (name === 'phone') {
      newValue = newValue.replace(/[^0-9]/g, '');
      if (newValue.length > 11) newValue = newValue.slice(0, 11);
      if (newValue && !/^01\d{0,9}$/.test(newValue)) return; // block if not starting with 01
    }
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData({
        ...formData,
        [parent]: {
          ...formData[parent],
          [child]: newValue
        }
      });
    } else {
      setFormData({ ...formData, [name]: newValue });
    }
    setFormError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (formData.password !== formData.confirmPassword) {
      setFormError('Passwords do not match');
      return;
    }
    
    if (formData.password.length < 6) {
      setFormError('Password must be at least 6 characters');
      return;
    }
    
    try {
      setIsSubmitting(true);
      await register(formData);
      navigate('/user'); // Redirect to user dashboard after successful registration
    } catch (error) {
      setFormError(error.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-form-container">
        <div className="auth-header">
          <h2>Register Your Shop</h2>
          <p>Sign up your shop to start managing deliveries</p>
        </div>
        {formError && <div className="auth-error">{formError}</div>}
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="name">Shop Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your shop name"
              required
              pattern="[A-Za-z\u0600-\u06FF ]+"
              inputMode="text"
              autoComplete="off"
            />
          </div>
          <div className="form-group">
            <label htmlFor="email">Shop Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your shop email"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="phone">Shop Phone Number</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Enter your shop phone number"
              required
              pattern="01[0-9]{9}"
              inputMode="numeric"
              maxLength={11}
              autoComplete="tel"
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Create a password"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm your password"
                required
              />
            </div>
          </div>
          <div className="address-section">
            <h3>Shop Address Information</h3>
            <div className="form-group">
              <label htmlFor="address.street">Street Address</label>
              <input
                type="text"
                id="address.street"
                name="address.street"
                value={formData.address.street}
                onChange={handleChange}
                placeholder="Street address"
                required
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="address.city">City</label>
                <input
                  type="text"
                  id="address.city"
                  name="address.city"
                  value={formData.address.city}
                  onChange={handleChange}
                  placeholder="City"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="address.state">State/Province</label>
                <input
                  type="text"
                  id="address.state"
                  name="address.state"
                  value={formData.address.state}
                  onChange={handleChange}
                  placeholder="State/Province"
                  required
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="address.zipCode">Zip/Postal Code</label>
                <input
                  type="text"
                  id="address.zipCode"
                  name="address.zipCode"
                  value={formData.address.zipCode}
                  onChange={handleChange}
                  placeholder="Zip/Postal code"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="address.country">Country</label>
                <input
                  type="text"
                  id="address.country"
                  name="address.country"
                  value={formData.address.country}
                  onChange={handleChange}
                  placeholder="Country"
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
            {isSubmitting ? 'Registering Shop...' : 'Register Shop'}
          </button>
        </form>
        <div className="auth-links">
          <p>
            Already have an account?{' '}
            <Link to="/login">Login</Link>
          </p>
          <div className="role-specific-links">
            <Link to="/register/driver" className="auth-button secondary">Register as a Driver</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
