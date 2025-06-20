import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { packageService } from '../../services/api';
import { ShopDashboardContext } from './Dashboard'; // Import the ShopDashboardContext

const CreatePackage = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Get access to the dashboard refresh function
  const { refreshDashboard } = useContext(ShopDashboardContext);
  
  const [formData, setFormData] = useState({
    packageDescription: '',
    weight: '',
    dimensions: {
      length: '',
      width: '',
      height: ''
    },
    pickupAddress: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: '',
      instructions: ''
    },
    deliveryAddress: {
      contactName: '',
      contactPhone: '',
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: '',
      instructions: ''
    },
    schedulePickupTime: '',
    priority: 'normal',
    notes: '',
    // Financial fields
    codAmount: ''
  });

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
    
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccess('');
    
    try {
      // Validate required fields
      if (!formData.packageDescription || !formData.weight || !formData.schedulePickupTime) {
        throw new Error('Please fill in all required fields');
      }
      
      if (!formData.deliveryAddress.contactName || !formData.deliveryAddress.contactPhone ||
          !formData.deliveryAddress.street || !formData.deliveryAddress.city ||
          !formData.deliveryAddress.state || !formData.deliveryAddress.zipCode ||
          !formData.deliveryAddress.country) {
        throw new Error('Please complete all delivery address fields');
      }
      
      // Format data for API
      const packageData = {
        ...formData,
        weight: parseFloat(formData.weight),
        dimensions: {
          length: formData.dimensions.length ? parseFloat(formData.dimensions.length) : 0,
          width: formData.dimensions.width ? parseFloat(formData.dimensions.width) : 0,
          height: formData.dimensions.height ? parseFloat(formData.dimensions.height) : 0
        },
        // Format financial fields as numbers
        codAmount: formData.codAmount ? parseFloat(formData.codAmount) : 0
      };
      
      // Submit to API
      const response = await packageService.createPackage(packageData);
      
      setSuccess('Package created successfully!');
      
      // Refresh the dashboard without logging out
      if (refreshDashboard) {
        console.log('Refreshing dashboard after package creation');
        refreshDashboard();
      }
      
      // Reset form
      setFormData({
        packageDescription: '',
        weight: '',
        dimensions: {
          length: '',
          width: '',
          height: ''
        },
        pickupAddress: {
          street: '',
          city: '',
          state: '',
          zipCode: '',
          country: '',
          instructions: ''
        },
        deliveryAddress: {
          contactName: '',
          contactPhone: '',
          street: '',
          city: '',
          state: '',
          zipCode: '',
          country: '',
          instructions: ''
        },
        schedulePickupTime: '',
        priority: 'normal',
        notes: '',
        codAmount: ''
      });
      
      // Redirect to packages list after a short delay
      // We'll show the success message briefly before redirecting
      setTimeout(() => {
        navigate('/shop/packages', { replace: true }); // Use replace to avoid breaking browser history
      }, 2000);
      
    } catch (err) {
      setError(err.message || 'Failed to create package. Please try again.');
      console.error('Error creating package:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="dashboard-content">
      <div className="content-header">
        <h1>Create New Package</h1>
        <p>Fill in the details to create a new delivery package</p>
      </div>
      
      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}
      
      <div className="form-container">
        <form onSubmit={handleSubmit} className="create-package-form">
          <div className="form-section">
            <h2>Package Information</h2>
            
            <div className="form-group">
              <label htmlFor="packageDescription">Package Description*</label>
              <input
                type="text"
                id="packageDescription"
                name="packageDescription"
                value={formData.packageDescription}
                onChange={handleChange}
                placeholder="Describe the package contents"
                required
              />
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
                  placeholder="Package weight"
                  step="0.01"
                  min="0.01"
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="priority">Priority</label>
                <select
                  id="priority"
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                >
                  <option value="normal">Normal</option>
                  <option value="express">Express</option>
                  <option value="same-day">Same Day</option>
                </select>
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="dimensions.length">Length (cm)</label>
                <input
                  type="number"
                  id="dimensions.length"
                  name="dimensions.length"
                  value={formData.dimensions.length}
                  onChange={handleChange}
                  placeholder="Length"
                  min="0"
                  step="0.1"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="dimensions.width">Width (cm)</label>
                <input
                  type="number"
                  id="dimensions.width"
                  name="dimensions.width"
                  value={formData.dimensions.width}
                  onChange={handleChange}
                  placeholder="Width"
                  min="0"
                  step="0.1"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="dimensions.height">Height (cm)</label>
                <input
                  type="number"
                  id="dimensions.height"
                  name="dimensions.height"
                  value={formData.dimensions.height}
                  onChange={handleChange}
                  placeholder="Height"
                  min="0"
                  step="0.1"
                />
              </div>
            </div>
          </div>
          
          <div className="form-section">
            <h2>Pickup Information</h2>
            
            <div className="form-group">
              <label htmlFor="schedulePickupTime">Scheduled Pickup Time*</label>
              <input
                type="datetime-local"
                id="schedulePickupTime"
                name="schedulePickupTime"
                value={formData.schedulePickupTime}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="pickupAddress.street">Street Address</label>
              <input
                type="text"
                id="pickupAddress.street"
                name="pickupAddress.street"
                value={formData.pickupAddress.street}
                onChange={handleChange}
                placeholder="Street address"
              />
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="pickupAddress.city">City</label>
                <input
                  type="text"
                  id="pickupAddress.city"
                  name="pickupAddress.city"
                  value={formData.pickupAddress.city}
                  onChange={handleChange}
                  placeholder="City"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="pickupAddress.state">State/Province</label>
                <input
                  type="text"
                  id="pickupAddress.state"
                  name="pickupAddress.state"
                  value={formData.pickupAddress.state}
                  onChange={handleChange}
                  placeholder="State/Province"
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="pickupAddress.zipCode">Zip/Postal Code</label>
                <input
                  type="text"
                  id="pickupAddress.zipCode"
                  name="pickupAddress.zipCode"
                  value={formData.pickupAddress.zipCode}
                  onChange={handleChange}
                  placeholder="Zip/Postal code"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="pickupAddress.country">Country</label>
                <input
                  type="text"
                  id="pickupAddress.country"
                  name="pickupAddress.country"
                  value={formData.pickupAddress.country}
                  onChange={handleChange}
                  placeholder="Country"
                />
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="pickupAddress.instructions">Pickup Instructions</label>
              <textarea
                id="pickupAddress.instructions"
                name="pickupAddress.instructions"
                value={formData.pickupAddress.instructions}
                onChange={handleChange}
                placeholder="Special instructions for pickup"
                rows="2"
              ></textarea>
            </div>
          </div>
          
          <div className="form-section">
            <h2>Delivery Information</h2>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="deliveryAddress.contactName">Contact Name*</label>
                <input
                  type="text"
                  id="deliveryAddress.contactName"
                  name="deliveryAddress.contactName"
                  value={formData.deliveryAddress.contactName}
                  onChange={handleChange}
                  placeholder="Recipient's name"
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="deliveryAddress.contactPhone">Contact Phone*</label>
                <input
                  type="tel"
                  id="deliveryAddress.contactPhone"
                  name="deliveryAddress.contactPhone"
                  value={formData.deliveryAddress.contactPhone}
                  onChange={handleChange}
                  placeholder="Recipient's phone"
                  required
                />
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="deliveryAddress.street">Street Address*</label>
              <input
                type="text"
                id="deliveryAddress.street"
                name="deliveryAddress.street"
                value={formData.deliveryAddress.street}
                onChange={handleChange}
                placeholder="Street address"
                required
              />
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="deliveryAddress.city">City*</label>
                <input
                  type="text"
                  id="deliveryAddress.city"
                  name="deliveryAddress.city"
                  value={formData.deliveryAddress.city}
                  onChange={handleChange}
                  placeholder="City"
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="deliveryAddress.state">State/Province*</label>
                <input
                  type="text"
                  id="deliveryAddress.state"
                  name="deliveryAddress.state"
                  value={formData.deliveryAddress.state}
                  onChange={handleChange}
                  placeholder="State/Province"
                  required
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="deliveryAddress.zipCode">Zip/Postal Code*</label>
                <input
                  type="text"
                  id="deliveryAddress.zipCode"
                  name="deliveryAddress.zipCode"
                  value={formData.deliveryAddress.zipCode}
                  onChange={handleChange}
                  placeholder="Zip/Postal code"
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="deliveryAddress.country">Country*</label>
                <input
                  type="text"
                  id="deliveryAddress.country"
                  name="deliveryAddress.country"
                  value={formData.deliveryAddress.country}
                  onChange={handleChange}
                  placeholder="Country"
                  required
                />
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="deliveryAddress.instructions">Delivery Instructions</label>
              <textarea
                id="deliveryAddress.instructions"
                name="deliveryAddress.instructions"
                value={formData.deliveryAddress.instructions}
                onChange={handleChange}
                placeholder="Special instructions for delivery"
                rows="2"
              ></textarea>
            </div>
          </div>
          
          <div className="form-section">
            <h2>Financial Information</h2>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="codAmount">Cash on Delivery Amount ($)</label>
                <input
                  type="number"
                  id="codAmount"
                  name="codAmount"
                  value={formData.codAmount}
                  onChange={handleChange}
                  placeholder="Amount to collect from recipient"
                  step="0.01"
                  min="0"
                />
                <small className="form-text">Leave at 0 if no payment collection is needed</small>
              </div>
            </div>
          </div>

          <div className="form-section">
            <h2>Additional Information</h2>
            
            <div className="form-group">
              <label htmlFor="notes">Notes</label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Any additional notes"
                rows="3"
              ></textarea>
            </div>
          </div>
          
          <div className="form-actions">
            <button 
              type="button" 
              className="btn-secondary"
              onClick={() => navigate('/shop')}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create Package'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePackage;
