import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faSave } from '@fortawesome/free-solid-svg-icons';

const API_URL = 'http://localhost:5000';

const EditShopProfile = () => {
  const [formData, setFormData] = useState({
    businessName: '',
    businessType: '',
    registrationNumber: '',
    taxId: '',
    
    // Address information
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: ''
    },
    
    // Contact information
    contactName: '',
    contactEmail: '',
    contactPhoneNumber: ''
  });
  
  const [originalAddress, setOriginalAddress] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const navigate = useNavigate();
  
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    
    const fetchShopProfile = async () => {
      try {
        setLoading(true);
        
        const response = await axios.get(`${API_URL}/api/shops/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const shopData = response.data;
        setOriginalAddress(shopData.address || '');
        
        // Parse address string back into an object if possible
        let addressObject = {
          street: '',
          city: '',
          state: '',
          zipCode: '',
          country: ''
        };
        
        if (shopData.address) {
          const addressParts = shopData.address.split(', ');
          if (addressParts.length >= 4) {
            addressObject = {
              street: addressParts[0] || '',
              city: addressParts.length > 1 ? addressParts[1].split(',')[0] || '' : '',
              state: addressParts.length > 1 ? 
                (addressParts[1].includes(',') ? addressParts[1].split(',')[1].trim() : '') : '',
              zipCode: addressParts.length > 2 ? addressParts[2] || '' : '',
              country: addressParts.length > 3 ? addressParts[3] || '' : ''
            };
          }
        }
        
        setFormData({
          businessName: shopData.businessName || '',
          businessType: shopData.businessType || '',
          registrationNumber: shopData.registrationNumber || '',
          taxId: shopData.taxId || '',
          address: addressObject,
          contactName: shopData.contactName || '',
          contactEmail: shopData.contactEmail || '',
          contactPhoneNumber: shopData.contactPhoneNumber || ''
        });
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching shop profile:', error);
        setError('Failed to load shop profile. Please try again.');
        setLoading(false);
      }
    };
    
    fetchShopProfile();
  }, [navigate]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      // Handle address fields
      const [parent, child] = name.split('.');
      setFormData({
        ...formData,
        [parent]: {
          ...formData[parent],
          [child]: value
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');
    
    try {
      // Format address string from the address object
      let addressString = '';
      if (formData.address) {
        addressString = [
          formData.address.street,
          formData.address.city && formData.address.state ? 
            `${formData.address.city}, ${formData.address.state}` : 
            (formData.address.city || formData.address.state || ''),
          formData.address.zipCode,
          formData.address.country
        ].filter(Boolean).join(', ');
      }
      
      const token = localStorage.getItem('token');
      
      // Prepare data for API submission
      const shopData = {
        businessName: formData.businessName,
        businessType: formData.businessType,
        registrationNumber: formData.registrationNumber,
        taxId: formData.taxId,
        address: addressString,
        contactName: formData.contactName,
        contactEmail: formData.contactEmail,
        contactPhoneNumber: formData.contactPhoneNumber,
      };
      
      // Send updated shop profile to the API
      await axios.put(`${API_URL}/api/shops/profile/update`, shopData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSuccess('Shop profile updated successfully');
      
      // Redirect after short delay
      setTimeout(() => {
        navigate('/shop');
      }, 2000);
    } catch (error) {
      console.error('Error updating shop profile:', error);
      setError(error.response?.data?.message || 'Failed to update profile. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };
  
  if (loading) {
    return <div className="loading">Loading shop profile...</div>;
  }
  
  return (
    <div className="edit-profile-container">
      <div className="page-header">
        <button onClick={() => navigate('/shop')} className="btn back-btn">
          <FontAwesomeIcon icon={faArrowLeft} /> Back to Dashboard
        </button>
        <h2>Edit Shop Profile</h2>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
      
      <form onSubmit={handleSubmit} className="profile-form">
        <div className="form-section">
          <h3>Business Information</h3>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="businessName">Business Name*</label>
              <input
                type="text"
                id="businessName"
                name="businessName"
                value={formData.businessName}
                onChange={handleChange}
                placeholder="Business name"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="businessType">Business Type*</label>
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
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="registrationNumber">Registration Number</label>
              <input
                type="text"
                id="registrationNumber"
                name="registrationNumber"
                value={formData.registrationNumber}
                onChange={handleChange}
                placeholder="Business registration number"
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
                placeholder="Tax ID or VAT number"
              />
            </div>
          </div>
        </div>
        
        <div className="form-section">
          <h3>Business Address</h3>
          <div className="form-group">
            <label htmlFor="address.street">Street Address*</label>
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
              <label htmlFor="address.city">City*</label>
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
              <label htmlFor="address.state">State/Province*</label>
              <input
                type="text"
                id="address.state"
                name="address.state"
                value={formData.address.state}
                onChange={handleChange}
                placeholder="State or province"
                required
              />
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="address.zipCode">ZIP/Postal Code*</label>
              <input
                type="text"
                id="address.zipCode"
                name="address.zipCode"
                value={formData.address.zipCode}
                onChange={handleChange}
                placeholder="ZIP or postal code"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="address.country">Country*</label>
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
        
        <div className="form-section">
          <h3>Contact Information</h3>
          <div className="form-group">
            <label htmlFor="contactName">Contact Person Name*</label>
            <input
              type="text"
              id="contactName"
              name="contactName"
              value={formData.contactName}
              onChange={handleChange}
              placeholder="Full name of contact person"
              required
            />
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="contactEmail">Contact Email*</label>
              <input
                type="email"
                id="contactEmail"
                name="contactEmail"
                value={formData.contactEmail}
                onChange={handleChange}
                placeholder="Email address"
                required
              />
              <small className="form-help">This email is used for login and business communications</small>
            </div>
            
            <div className="form-group">
              <label htmlFor="contactPhoneNumber">Contact Phone*</label>
              <input
                type="tel"
                id="contactPhoneNumber"
                name="contactPhoneNumber"
                value={formData.contactPhoneNumber}
                onChange={handleChange}
                placeholder="Phone number"
                required
              />
            </div>
          </div>
        </div>
        
        <div className="form-actions">
          <button 
            type="button" 
            className="btn secondary-btn"
            onClick={() => navigate('/shop')}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="btn primary-btn"
            disabled={submitting}
          >
            <FontAwesomeIcon icon={faSave} /> {submitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditShopProfile;
