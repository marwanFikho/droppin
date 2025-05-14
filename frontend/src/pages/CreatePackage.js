import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faSave, faBox, faUser, faFileAlt, faWeightHanging, faRuler, faMapMarkedAlt, faPhone } from '@fortawesome/free-solid-svg-icons';
import './PackageForms.css';

const API_URL = 'http://localhost:5000';

const CreatePackage = () => {
  const [formData, setFormData] = useState({
    // Package details
    packageDescription: '',
    weight: '',
    dimensions: '',
    
    // Pickup information (default to shop address)
    useShopAddressAsPickup: true,
    pickupContactName: '',
    pickupContactPhone: '',
    pickupAddress: '',
    
    // Recipient information
    deliveryContactName: '',
    deliveryContactPhone: '',
    deliveryAddress: '',
    recipientUserId: '',
    
    // Additional information
    notes: ''
  });
  
  const [shopData, setShopData] = useState(null);
  const [users, setUsers] = useState([]);
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
    
    const fetchData = async () => {
      try {
        setLoading(true);
        console.log('Fetching shop profile data for package creation form...');
        
        // Get shop profile data
        const shopResponse = await axios.get(`${API_URL}/api/shops/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log('Shop data received:', shopResponse.data.businessName);
        setShopData(shopResponse.data);
        
        // Prefill pickup information with shop data
        setFormData(prev => ({
          ...prev,
          pickupContactName: shopResponse.data.contactName,
          pickupContactPhone: shopResponse.data.contactPhoneNumber,
          pickupAddress: shopResponse.data.address
        }));
        
        console.log('Fetching users for recipient selection...');
        // Get users list for recipient selection
        const usersResponse = await axios.get(`${API_URL}/api/users`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setUsers(usersResponse.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        console.error('Error details:', error.response?.data);
        setError(`Failed to load data: ${error.response?.data?.message || error.message}`);
        setLoading(false);
      }
    };
    
    fetchData();
  }, [navigate]);
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      if (name === 'useShopAddressAsPickup' && checked) {
        // If using shop address, populate pickup fields with shop data
        setFormData({
          ...formData,
          useShopAddressAsPickup: checked,
          pickupContactName: shopData?.contactName || '',
          pickupContactPhone: shopData?.contactPhoneNumber || '',
          pickupAddress: shopData?.address || ''
        });
      } else {
        setFormData({
          ...formData,
          [name]: checked
        });
      }
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
      // Validate form
      if (!formData.packageDescription) {
        setError('Package description is required');
        setSubmitting(false);
        return;
      }
      
      if (!formData.weight) {
        setError('Package weight is required');
        setSubmitting(false);
        return;
      }
      
      if (!formData.deliveryContactName || !formData.deliveryContactPhone || !formData.deliveryAddress) {
        setError('Delivery contact information and address are required');
        setSubmitting(false);
        return;
      }
      
      const token = localStorage.getItem('token');
      
      // Create package data object
      const packageData = {
        packageDescription: formData.packageDescription,
        weight: parseFloat(formData.weight),
        dimensions: formData.dimensions,
        pickupContactName: formData.pickupContactName,
        pickupContactPhone: formData.pickupContactPhone,
        pickupAddress: formData.pickupAddress,
        deliveryContactName: formData.deliveryContactName,
        deliveryContactPhone: formData.deliveryContactPhone,
        deliveryAddress: formData.deliveryAddress,
        recipientUserId: formData.recipientUserId || null,
        notes: formData.notes
      };
      
      console.log('Submitting package data:', packageData);
      
      // Submit package to API
      const response = await axios.post(
        `${API_URL}/api/packages`, 
        packageData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      console.log('Package creation response:', response.data);
      
      setSuccess(`Package created successfully with tracking number: ${response.data.package.trackingNumber}`);
      
      // Reset form and navigate without timeout to avoid 404 errors
      // Just show success message for a moment before navigating
      setTimeout(() => {
        // Use window.location.href instead of navigate to force a full page reload
        // This ensures that we reload all state and the shop dashboard
        window.location.href = '/shop';
      }, 1500);
    } catch (error) {
      console.error('Error creating package:', error);
      console.error('Error response:', error.response?.data);
      setError(error.response?.data?.message || 'Failed to create package. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };
  
  if (loading) {
    return <div className="loading">Loading package form...</div>;
  }
  
  return (
    <div className="create-package-container">
      <div className="page-header">
        <button 
          onClick={() => window.location.href = '/shop'} 
          className="btn back-btn"
          type="button"
        >
          <FontAwesomeIcon icon={faArrowLeft} /> Back to Dashboard
        </button>
        <h2>Create New Package</h2>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
      
      <form onSubmit={handleSubmit} className="package-form">
        <div className="form-section">
          <h3>Package Details</h3>
          <div className="form-group">
            <label htmlFor="packageDescription">Package Description*</label>
            <textarea
              id="packageDescription"
              name="packageDescription"
              value={formData.packageDescription}
              onChange={handleChange}
              placeholder="Describe the contents of the package"
              required
            ></textarea>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="weight">Weight (kg)*</label>
              <input
                type="number"
                id="weight"
                name="weight"
                value={formData.weight}
                onChange={handleChange}
                step="0.1"
                min="0.1"
                placeholder="Package weight"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="dimensions">Dimensions (LxWxH cm)</label>
              <input
                type="text"
                id="dimensions"
                name="dimensions"
                value={formData.dimensions}
                onChange={handleChange}
                placeholder="e.g., 30x20x10"
              />
            </div>
          </div>
        </div>
        
        <div className="form-section">
          <h3>Pickup Information</h3>
          <div className="form-group checkbox-group">
            <input
              type="checkbox"
              id="useShopAddressAsPickup"
              name="useShopAddressAsPickup"
              checked={formData.useShopAddressAsPickup}
              onChange={handleChange}
            />
            <label htmlFor="useShopAddressAsPickup">Use my shop address as pickup location</label>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="pickupContactName">Contact Name</label>
              <input
                type="text"
                id="pickupContactName"
                name="pickupContactName"
                value={formData.pickupContactName}
                onChange={handleChange}
                disabled={formData.useShopAddressAsPickup}
                placeholder="Pickup contact name"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="pickupContactPhone">Contact Phone</label>
              <input
                type="text"
                id="pickupContactPhone"
                name="pickupContactPhone"
                value={formData.pickupContactPhone}
                onChange={handleChange}
                disabled={formData.useShopAddressAsPickup}
                placeholder="Pickup contact phone"
              />
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="pickupAddress">Pickup Address</label>
            <textarea
              id="pickupAddress"
              name="pickupAddress"
              value={formData.pickupAddress}
              onChange={handleChange}
              disabled={formData.useShopAddressAsPickup}
              placeholder="Full pickup address"
            ></textarea>
          </div>
        </div>
        
        <div className="form-section">
          <h3>Delivery Information</h3>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="deliveryContactName">Contact Name*</label>
              <input
                type="text"
                id="deliveryContactName"
                name="deliveryContactName"
                value={formData.deliveryContactName}
                onChange={handleChange}
                placeholder="Recipient name"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="deliveryContactPhone">Contact Phone*</label>
              <input
                type="text"
                id="deliveryContactPhone"
                name="deliveryContactPhone"
                value={formData.deliveryContactPhone}
                onChange={handleChange}
                placeholder="Recipient phone"
                required
              />
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="deliveryAddress">Delivery Address*</label>
            <textarea
              id="deliveryAddress"
              name="deliveryAddress"
              value={formData.deliveryAddress}
              onChange={handleChange}
              placeholder="Full delivery address"
              required
            ></textarea>
          </div>
          
          <div className="form-group">
            <label htmlFor="recipientUserId">Link to System User (optional)</label>
            <select
              id="recipientUserId"
              name="recipientUserId"
              value={formData.recipientUserId}
              onChange={handleChange}
            >
              <option value="">-- Select User --</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.email})
                </option>
              ))}
            </select>
            <small className="form-help">Link this package to a registered user for tracking</small>
          </div>
        </div>
        
        <div className="form-section">
          <h3>Additional Information</h3>
          <div className="form-group">
            <label htmlFor="notes">Notes</label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Special instructions or notes"
            ></textarea>
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
            <FontAwesomeIcon icon={faSave} /> {submitting ? 'Creating...' : 'Create Package'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreatePackage;
