import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faSave, faBox, faUser, faFileAlt, faWeightHanging, faRuler, faMapMarkedAlt, faPhone, faTimesCircle } from '@fortawesome/free-solid-svg-icons';
import './PackageForms.css';

const API_URL = 'http://localhost:5000';

const EditPackage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    // Package details
    packageDescription: '',
    weight: '',
    dimensions: '',
    
    // Pickup information
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
  
  const [packageStatus, setPackageStatus] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Get package details
        const packageResponse = await axios.get(`${API_URL}/api/packages/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const packageData = packageResponse.data;
        
        // Get users list for recipient selection
        const usersResponse = await axios.get(`${API_URL}/api/users`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setUsers(usersResponse.data);
        
        // Set package data to form
        setFormData({
          packageDescription: packageData.packageDescription || '',
          weight: packageData.weight?.toString() || '',
          dimensions: packageData.dimensions || '',
          pickupContactName: packageData.pickupContactName || '',
          pickupContactPhone: packageData.pickupContactPhone || '',
          pickupAddress: packageData.pickupAddress || '',
          deliveryContactName: packageData.deliveryContactName || '',
          deliveryContactPhone: packageData.deliveryContactPhone || '',
          deliveryAddress: packageData.deliveryAddress || '',
          recipientUserId: packageData.userId || '',
          notes: packageData.notes || ''
        });
        
        setPackageStatus(packageData.status);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching package data:', error);
        setError('Failed to load package data. Please try again.');
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id, navigate]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
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
      
      // Update package via API
      await axios.put(
        `${API_URL}/api/packages/${id}`, 
        packageData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setSuccess('Package updated successfully');
      
      // Navigate back after short delay
      setTimeout(() => {
        navigate('/shop/dashboard');
      }, 2000);
    } catch (error) {
      console.error('Error updating package:', error);
      setError(error.response?.data?.message || 'Failed to update package. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleCancelPackage = async () => {
    if (!window.confirm('Are you sure you want to cancel this package? This cannot be undone.')) {
      return;
    }
    
    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      
      // Cancel package via API
      await axios.put(
        `${API_URL}/api/packages/${id}/status`, 
        { status: 'cancelled', notes: 'Cancelled by shop' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setSuccess('Package cancelled successfully');
      
      // Navigate back after short delay
      setTimeout(() => {
        navigate('/shop/dashboard');
      }, 2000);
    } catch (error) {
      console.error('Error cancelling package:', error);
      setError(error.response?.data?.message || 'Failed to cancel package. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };
  
  if (loading) {
    return <div className="loading">Loading package data...</div>;
  }
  
  // Only allow editing if package is still in pending status
  const isEditable = packageStatus === 'pending';
  
  return (
    <div className="edit-package-container">
      <div className="page-header">
        <button onClick={() => navigate('/shop')} className="btn back-btn">
          <FontAwesomeIcon icon={faArrowLeft} /> Back to Dashboard
        </button>
        <h2>{isEditable ? 'Edit Package' : 'View Package'}</h2>
      </div>
      
      {!isEditable && (
        <div className="info-message">
          This package is in <strong>{packageStatus}</strong> status and can no longer be edited.
        </div>
      )}
      
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
              disabled={!isEditable}
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
                disabled={!isEditable}
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
                disabled={!isEditable}
              />
            </div>
          </div>
        </div>
        
        <div className="form-section">
          <h3>Pickup Information</h3>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="pickupContactName">Contact Name</label>
              <input
                type="text"
                id="pickupContactName"
                name="pickupContactName"
                value={formData.pickupContactName}
                onChange={handleChange}
                disabled={!isEditable}
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
                disabled={!isEditable}
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
              disabled={!isEditable}
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
                disabled={!isEditable}
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
                disabled={!isEditable}
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
              disabled={!isEditable}
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
              disabled={!isEditable}
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
              disabled={!isEditable}
            ></textarea>
          </div>
        </div>
        
        <div className="form-actions">
          <button 
            type="button" 
            className="btn secondary-btn"
            onClick={() => navigate('/shop')}
          >
            Back
          </button>
          
          {isEditable && (
            <>
              <button 
                type="button" 
                className="btn danger-btn"
                onClick={handleCancelPackage}
                disabled={submitting}
              >
                Cancel Package
              </button>
              
              <button 
                type="submit" 
                className="btn primary-btn"
                disabled={submitting}
              >
                <FontAwesomeIcon icon={faSave} /> {submitting ? 'Saving...' : 'Save Changes'}
              </button>
            </>
          )}
        </div>
      </form>
    </div>
  );
};

export default EditPackage;
