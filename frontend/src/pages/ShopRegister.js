import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const ShopRegister = () => {
  const [formData, setFormData] = useState({
    // Business Information
    businessName: '',
    businessType: '',
    
    // Account Information
    username: '',
    password: '',
    confirmPassword: '',
    
    // Contact Information
    contactName: '',
    contactEmail: '',
    contactPhoneNumber: '',
    
    // Address Information
    businessAddress: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: ''
    },
    
    // Business Verification Information
    registrationNumber: '',
    taxId: ''
  });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const navigate = useNavigate();

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
    
    // Validations
    if (!formData.username) {
      setFormError('Username is required');
      return;
    }
    
    if (!formData.password) {
      setFormError('Password is required');
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setFormError('Passwords do not match');
      return;
    }
    
    if (!formData.contactEmail) {
      setFormError('Contact email is required');
      return;
    }
    
    if (!formData.businessName) {
      setFormError('Business name is required');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Format address string from the businessAddress object
      let addressString = '';
      if (formData.businessAddress) {
        addressString = [
          formData.businessAddress.street,
          formData.businessAddress.city && formData.businessAddress.state ? 
            `${formData.businessAddress.city}, ${formData.businessAddress.state}` : 
            (formData.businessAddress.city || formData.businessAddress.state || ''),
          formData.businessAddress.zipCode,
          formData.businessAddress.country
        ].filter(Boolean).join(', ');
      }
      
      // Prepare shop data for submission
      const shopData = {
        businessName: formData.businessName,
        businessType: formData.businessType,
        address: addressString,
        contactName: formData.contactName,
        contactEmail: formData.contactEmail,
        contactPhoneNumber: formData.contactPhoneNumber,
        registrationNumber: formData.registrationNumber,
        taxId: formData.taxId,
        username: formData.username,
        password: formData.password
      };
      
      // Send shop registration directly to the API
      // Make sure we're using the full URL with http://localhost:5000 prefix
      const API_URL = 'http://localhost:5000';
      const response = await axios.post(`${API_URL}/api/shops/register`, shopData);
      
      // Set the shop as logged in if registration is successful
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify({
          id: response.data.shop.id,
          role: 'shop',
          businessName: response.data.shop.businessName
        }));
        navigate('/registration-confirmation');
      }
    } catch (error) {
      console.error('Shop registration error:', error);
      
      // Extract and display the error message
      let errorMessage = 'Registration failed. Please try again.';
      
      if (error.response) {
        // The request was made and the server responded with a status code outside of 2xx
        console.log('Error response details:', error.response.data);
        errorMessage = error.response.data?.message || errorMessage;
      } else if (error.request) {
        // The request was made but no response was received
        console.log('Error request:', error.request);
        errorMessage = 'No response from server. Please check your connection.';
      } else {
        // Something happened in setting up the request
        console.log('Error message:', error.message);
        errorMessage = error.message || errorMessage;
      }
      
      setFormError(errorMessage);
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
        </div>
        
        {formError && <div className="auth-error">{formError}</div>}
        
        <form onSubmit={handleSubmit} className="auth-form">
          <h3>Account Information</h3>
          <p className="form-note">Note: You will use your business email to sign in to your account.</p>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Enter a username"
                required
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
                placeholder="Enter password"
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
                placeholder="Confirm password"
                required
              />
            </div>
          </div>
          
          <h3>Business Information</h3>
          <div className="form-row">
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
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="businessType">Business Type</label>
              <select
                id="businessType"
                name="businessType"
                value={formData.businessType}
                onChange={handleChange}
                required
              >
                <option value="">Select business type</option>
                <option value="Retail">Retail</option>
                <option value="Restaurant">Restaurant</option>
                <option value="Grocery">Grocery</option>
                <option value="Pharmacy">Pharmacy</option>
                <option value="Electronics">Electronics</option>
                <option value="Clothing">Clothing</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
          
          <h3>Contact Information</h3>
          <div className="form-group">
            <label htmlFor="contactName">Contact Person Name</label>
            <input
              type="text"
              id="contactName"
              name="contactName"
              value={formData.contactName}
              onChange={handleChange}
              placeholder="Name of contact person"
              required
            />
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="contactEmail">Contact Email</label>
              <input
                type="email"
                id="contactEmail"
                name="contactEmail"
                value={formData.contactEmail}
                onChange={handleChange}
                placeholder="Contact email address"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="contactPhoneNumber">Contact Phone</label>
              <input
                type="tel"
                id="contactPhoneNumber"
                name="contactPhoneNumber"
                value={formData.contactPhoneNumber}
                onChange={handleChange}
                placeholder="Contact phone number"
                required
              />
            </div>
          </div>
          
          <h3>Business Address</h3>
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
              <label htmlFor="businessAddress.zipCode">Zip/Postal Code</label>
              <input
                type="text"
                id="businessAddress.zipCode"
                name="businessAddress.zipCode"
                value={formData.businessAddress.zipCode}
                onChange={handleChange}
                placeholder="Zip/Postal code"
                required
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
          
          <h3>Business Verification</h3>
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
            <Link to="/register">Register as a Customer</Link>
            <Link to="/register/driver">Register as a Driver</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShopRegister;
