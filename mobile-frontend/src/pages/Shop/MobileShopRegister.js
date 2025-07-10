import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './MobileShopRegister.css';
import { authService } from '../../services/api';

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
    country: '', // NEW
    businessType: '', // NEW
    contactPersonEmail: '', // NEW
    registrationNumber: '', // NEW
    taxId: '', // NEW
    password: '',
    confirmPassword: ''
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [registerError, setRegisterError] = useState('');
  const [registerSuccess, setRegisterSuccess] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

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
      newErrors.shopName = 'Shop name is required';
    }
    
    if (!formData.ownerName.trim()) {
      newErrors.ownerName = 'Owner name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\d{11}$/.test(formData.phone.trim())) {
      newErrors.phone = 'Please enter a valid phone number';
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

    if (!formData.businessType.trim()) {
      newErrors.businessType = 'Business type is required';
    }
    if (!formData.contactPersonEmail.trim()) {
      newErrors.contactPersonEmail = 'Contact person email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.contactPersonEmail)) {
      newErrors.contactPersonEmail = 'Please enter a valid email';
    }
    if (!formData.country.trim()) {
      newErrors.country = 'Country is required';
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
        businessName: formData.shopName,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        businessType: formData.businessType,
        contactPerson: {
          name: formData.ownerName,
          phone: formData.phone,
          email: formData.contactPersonEmail
        },
        businessAddress: {
          street: formData.address,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
          country: formData.country
        },
        registrationNumber: formData.registrationNumber,
        taxId: formData.taxId
      };
      
      await authService.registerShop(userData);
      setRegisterSuccess(true);
    } catch (error) {
      console.error('Registration error:', error);
      setRegisterError(error.message || 'Failed to register. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mobile-shop-register">
      <div className="mobile-shop-register-container">
        <div className="mobile-shop-register-header">
          <div className="mobile-shop-register-icon">🏪</div>
          <h1 className="mobile-shop-register-title">Register Your Shop</h1>
          <p className="mobile-shop-register-subtitle">Join our delivery network</p>
        </div>

        <form onSubmit={handleSubmit} className="mobile-shop-register-form">
          {registerError && (
            <div className="alert alert-danger">
              {registerError}
            </div>
          )}
          {registerSuccess && (
            <div className="alert alert-success">
              Registration successful! Your shop account is pending admin approval. You will be able to sign in once approved.
            </div>
          )}

          <div className="form-group">
            <label htmlFor="shopName" className="form-label">Shop Name *</label>
            <input
              type="text"
              id="shopName"
              name="shopName"
              value={formData.shopName}
              onChange={handleChange}
              className={`form-control ${errors.shopName ? 'error' : ''}`}
              placeholder="Enter your shop name"
            />
            {errors.shopName && <div className="error-message">{errors.shopName}</div>}
          </div>

          <div className="form-group">
            <label htmlFor="ownerName" className="form-label">Owner Name *</label>
            <input
              type="text"
              id="ownerName"
              name="ownerName"
              value={formData.ownerName}
              onChange={handleChange}
              className={`form-control ${errors.ownerName ? 'error' : ''}`}
              placeholder="Enter owner's full name"
            />
            {errors.ownerName && <div className="error-message">{errors.ownerName}</div>}
          </div>

          <div className="form-group">
            <label htmlFor="email" className="form-label">Email *</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`form-control ${errors.email ? 'error' : ''}`}
              placeholder="Enter your email"
              autoComplete="email"
            />
            {errors.email && <div className="error-message">{errors.email}</div>}
          </div>

          <div className="form-group">
            <label htmlFor="phone" className="form-label">Phone Number *</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className={`form-control ${errors.phone ? 'error' : ''}`}
              placeholder="Enter phone number"
              autoComplete="tel"
            />
            {errors.phone && <div className="error-message">{errors.phone}</div>}
          </div>

          <div className="form-group">
            <label htmlFor="address" className="form-label">Address *</label>
            <input
              type="text"
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className={`form-control ${errors.address ? 'error' : ''}`}
              placeholder="Enter shop address"
            />
            {errors.address && <div className="error-message">{errors.address}</div>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="city" className="form-label">City *</label>
              <input
                type="text"
                id="city"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className={`form-control ${errors.city ? 'error' : ''}`}
                placeholder="City"
              />
              {errors.city && <div className="error-message">{errors.city}</div>}
            </div>

            <div className="form-group">
              <label htmlFor="state" className="form-label">State *</label>
              <input
                type="text"
                id="state"
                name="state"
                value={formData.state}
                onChange={handleChange}
                className={`form-control ${errors.state ? 'error' : ''}`}
                placeholder="State"
              />
              {errors.state && <div className="error-message">{errors.state}</div>}
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="country" className="form-label">Country *</label>
            <input
              type="text"
              id="country"
              name="country"
              value={formData.country}
              onChange={handleChange}
              className={`form-control ${errors.country ? 'error' : ''}`}
              placeholder="Country"
            />
            {errors.country && <div className="error-message">{errors.country}</div>}
          </div>
          <div className="form-group">
            <label htmlFor="zipCode" className="form-label">ZIP Code *</label>
            <input
              type="text"
              id="zipCode"
              name="zipCode"
              value={formData.zipCode}
              onChange={handleChange}
              className={`form-control ${errors.zipCode ? 'error' : ''}`}
              placeholder="Enter ZIP code"
            />
            {errors.zipCode && <div className="error-message">{errors.zipCode}</div>}
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">Password *</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={`form-control ${errors.password ? 'error' : ''}`}
              placeholder="Create a password"
              autoComplete="new-password"
            />
            {errors.password && <div className="error-message">{errors.password}</div>}
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword" className="form-label">Confirm Password *</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className={`form-control ${errors.confirmPassword ? 'error' : ''}`}
              placeholder="Confirm your password"
              autoComplete="new-password"
            />
            {errors.confirmPassword && <div className="error-message">{errors.confirmPassword}</div>}
          </div>

          <div className="form-group">
            <label htmlFor="businessType" className="form-label">Business Type *</label>
            <input
              type="text"
              id="businessType"
              name="businessType"
              value={formData.businessType}
              onChange={handleChange}
              className={`form-control ${errors.businessType ? 'error' : ''}`}
              placeholder="E.g., Retail, Restaurant, etc."
            />
            {errors.businessType && <div className="error-message">{errors.businessType}</div>}
          </div>
          <div className="form-group">
            <label htmlFor="contactPersonEmail" className="form-label">Contact Person Email *</label>
            <input
              type="email"
              id="contactPersonEmail"
              name="contactPersonEmail"
              value={formData.contactPersonEmail}
              onChange={handleChange}
              className={`form-control ${errors.contactPersonEmail ? 'error' : ''}`}
              placeholder="Contact person email"
              autoComplete="email"
            />
            {errors.contactPersonEmail && <div className="error-message">{errors.contactPersonEmail}</div>}
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="registrationNumber" className="form-label">Registration Number</label>
              <input
                type="text"
                id="registrationNumber"
                name="registrationNumber"
                value={formData.registrationNumber}
                onChange={handleChange}
                className="form-control"
                placeholder="Registration number (optional)"
              />
            </div>
            <div className="form-group">
              <label htmlFor="taxId" className="form-label">Tax ID</label>
              <input
                type="text"
                id="taxId"
                name="taxId"
                value={formData.taxId}
                onChange={handleChange}
                className="form-control"
                placeholder="Tax ID (optional)"
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary w-100"
            disabled={loading || registerSuccess}
          >
            {loading ? 'Creating Account...' : 'Register Shop'}
          </button>
        </form>

        <div className="mobile-shop-register-footer">
          <p className="mobile-shop-register-footer-text">
            Already have an account?{' '}
            <Link to="/login" className="mobile-shop-register-link">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default MobileShopRegister; 