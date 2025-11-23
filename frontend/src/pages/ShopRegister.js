import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { validateName, sanitizeNameInput, validatePhone } from '../utils/inputValidators';

const ShopRegister = () => {
  const [formData, setFormData] = useState({
    businessName: '',
    email: '', // This will be the login email
    password: '',
    confirmPassword: '',
    phone: '', // Business phone
    businessType: '',
    contactPerson: {
      name: '', // Contact person's name
      phone: '',
      email: ''
    },
    businessAddress: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: ''
    },
    registrationNumber: '',
    taxId: ''
  });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    let newValue = value;
    // Business name and contact person name: sanitize and validate
    if (name === 'businessName' || name === 'contactPerson.name') {
      newValue = sanitizeNameInput(value);
      if (!validateName(newValue) && newValue !== '') return;
    }
    // Phone fields
    if (name === 'phone') {
      newValue = newValue.replace(/[^0-9]/g, '');
      if (newValue.length > 11) newValue = newValue.slice(0, 11);
      if (newValue && !/^0$|^01\d{0,9}$/.test(newValue)) return;
    }
    if (name === 'contactPerson.phone') {
      newValue = newValue.replace(/[^0-9]/g, '');
      if (newValue.length > 11) newValue = newValue.slice(0, 11);
    }
    if (name.includes('.')) {
      // Handle nested fields
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
    setFormError(''); // Clear error when user types
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Manual required fields (Zip/Postal Code is intentionally OPTIONAL)
    const required = [
      formData.businessName?.trim(),
      formData.email?.trim(),
      formData.phone?.trim(),
      formData.password,
      formData.confirmPassword,
      formData.businessType?.trim(),
      formData.contactPerson?.name?.trim(),
      formData.contactPerson?.phone?.trim(),
      formData.contactPerson?.email?.trim(),
      formData.businessAddress?.street?.trim(),
      formData.businessAddress?.city?.trim(),
      formData.businessAddress?.state?.trim(),
      formData.businessAddress?.country?.trim()
    ];
    if (required.some(v => !v)) {
      setFormError('Please fill in all required fields. Zip/Postal Code is optional.');
      return;
    }

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setFormError('Passwords do not match');
      return;
    }
    
    if (formData.password.length < 6) {
      setFormError('Password must be at least 6 characters');
      return;
    }

    // Business phone must match 01xxxxxxxxx
    if (!validatePhone(formData.phone)) {
      setFormError('Please enter a valid business phone number (01xxxxxxxxx)');
      return;
    }
    
    try {
      setIsSubmitting(true);
      // Create a new object with businessName as name
      const shopData = {
        ...formData,
        name: formData.businessName // Add name field using businessName
      };
      
      await register(shopData, 'shop');
      // Redirect to success page without auto-sign-in
      navigate('/registration-success', { 
        state: { 
          userType: 'shop', 
          message: 'Your shop account has been registered successfully! An administrator will review your application. You will be able to sign in once your account has been approved.' 
        } 
      });
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
          <p>Create a shop account to manage your deliveries</p>
          <div className="approval-notice">
            <p><strong>Note:</strong> Shop accounts require administrator approval before you can sign in. You will be notified once your account has been approved.</p>
          </div>
        </div>
        
        {formError && <div className="auth-error">{formError}</div>}
        
  <form onSubmit={handleSubmit} noValidate className="auth-form">
          <h3>Business Information</h3>
          <div className="form-group">
            <label htmlFor="businessName">Business Name</label>
            <input
              type="text"
              id="businessName"
              name="businessName"
              value={formData.businessName}
              onChange={handleChange}
              placeholder="Enter your business name"
              required
              pattern="[A-Za-z\u0600-\u06FF ]+"
              inputMode="text"
              autoComplete="off"
            />
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="email">Email (Used in login)</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter business email"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="phone">Business Phone Number</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Enter business phone number"
                required
                inputMode="numeric"
                maxLength={11}
                pattern="01[0-9]{9}"
                autoComplete="tel"
              />
            </div>
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
          
          <div className="form-group">
            <label htmlFor="businessType">Business Type</label>
            <input
              type="text"
              id="businessType"
              name="businessType"
              value={formData.businessType}
              onChange={handleChange}
              placeholder="E.g., Retail, Restaurant, etc."
              required
            />
          </div>
          
          <h4>Contact Person Information</h4>
          <p className="form-info">Please provide details of the person we should contact regarding this account.</p>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="contactPerson.name">Contact Person Name</label>
              <input
                type="text"
                id="contactPerson.name"
                name="contactPerson.name"
                value={formData.contactPerson.name}
                onChange={handleChange}
                placeholder="Contact person name"
                required
                pattern="[A-Za-z\u0600-\u06FF ]+"
                inputMode="text"
                autoComplete="off"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="contactPerson.phone">Contact Person Phone</label>
              <input
                type="tel"
                id="contactPerson.phone"
                name="contactPerson.phone"
                onChange={handleChange}
                placeholder="Contact person phone"
                required
                inputMode="numeric"
                maxLength={11}
                autoComplete="tel"
              />
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="contactPerson.email">Contact Person Email</label>
            <input
              type="email"
              id="contactPerson.email"
              name="contactPerson.email"
              value={formData.contactPerson.email}
              onChange={handleChange}
              placeholder="Contact person email"
              required
            />
          </div>
          
          <h4>Business Address</h4>
          <div className="form-group">
            <label htmlFor="businessAddress.street">Street Address</label>
            <input
              type="text"
              id="businessAddress.street"
              name="businessAddress.street"
              value={formData.businessAddress.street}
              onChange={handleChange}
              placeholder="Street address"
              required
            />
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="businessAddress.city">City</label>
              <input
                type="text"
                id="businessAddress.city"
                name="businessAddress.city"
                value={formData.businessAddress.city}
                onChange={handleChange}
                placeholder="City"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="businessAddress.state">State/Province</label>
              <input
                type="text"
                id="businessAddress.state"
                name="businessAddress.state"
                value={formData.businessAddress.state}
                onChange={handleChange}
                placeholder="State/Province"
                required
              />
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="businessAddress.zipCode">Zip/Postal Code (optional)</label>
              <input
                type="text"
                id="businessAddress.zipCode"
                name="businessAddress.zipCode"
                value={formData.businessAddress.zipCode}
                onChange={handleChange}
                placeholder="Zip/Postal code (optional)"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="businessAddress.country">Country</label>
              <input
                type="text"
                id="businessAddress.country"
                name="businessAddress.country"
                value={formData.businessAddress.country}
                onChange={handleChange}
                placeholder="Country"
                required
              />
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="registrationNumber">Business Registration Number</label>
              <input
                type="text"
                id="registrationNumber"
                name="registrationNumber"
                value={formData.registrationNumber}
                onChange={handleChange}
                placeholder="Registration number (optional)"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="taxId">Tax ID</label>
              <input
                type="text"
                id="taxId"
                name="taxId"
                value={formData.taxId}
                onChange={handleChange}
                placeholder="Tax ID (optional)"
              />
            </div>
          </div>
          
          <button 
            type="submit" 
            className="auth-button" 
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating Account...' : 'Register Shop'}
          </button>
        </form>
        
        <div className="auth-links">
          <p>
            Already have an account?{' '}
            <Link to="/login">Login</Link>
          </p>
          <div className="role-specific-links">
            <Link to="/register/driver">Register as a Driver</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShopRegister;
