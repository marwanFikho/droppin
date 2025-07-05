import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { packageService } from '../../services/api';
import { ShopDashboardContext } from './Dashboard'; // Import the ShopDashboardContext

const CATEGORY_OPTIONS = [
  'Shoes',
  'Perfumes',
  'Clothes',
  'Electronics',
  'Accessories',
  'Books',
  'Other'
];

const parseAddress = (addressStr) => {
  if (!addressStr) return { street: '', city: '', state: '', zipCode: '', country: '' };
  const [street, city, state, zipCode, country] = addressStr.split(',').map(s => s.trim());
  return { street: street || '', city: city || '', state: state || '', zipCode: zipCode || '', country: country || '' };
};

const CreatePackage = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  
  // Get access to the dashboard refresh function
  const { refreshDashboard } = useContext(ShopDashboardContext);
  
  const [formData, setFormData] = useState({
    packageDescription: '',
    category: '',
    weight: '',
    dimensions: {
      length: '',
      width: '',
      height: ''
    },
    itemsNo: '',
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
    shopNotes: '',
    codAmount: '',
    deliveryCost: '',
    paymentMethod: '',
    paymentNotes: ''
  });

  // Fetch shop address on mount
  useEffect(() => {
    const fetchShopProfile = async () => {
      try {
        const res = await packageService.getShopProfile();
        const shop = res.data;
        const pickupAddress = parseAddress(shop.address);
        setFormData(prev => ({
          ...prev,
          pickupAddress: { ...pickupAddress, instructions: '' }
        }));
      } catch (err) {
        setError('Failed to load shop address.');
      }
    };
    fetchShopProfile();
  }, []);

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
      if (name === 'notes') {
        setFormData({ ...formData, shopNotes: value });
      } else {
        setFormData({ ...formData, [name]: value });
      }
    }
    
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    
    try {
      // Validate required fields
      if (!formData.packageDescription || !formData.weight || !formData.category) {
        throw new Error('Please fill in all required fields');
      }
      
      if (!formData.deliveryAddress.contactName || !formData.deliveryAddress.contactPhone ||
          !formData.deliveryAddress.street || !formData.deliveryAddress.city ||
          !formData.deliveryAddress.country) {
        throw new Error('Please complete all delivery address fields');
      }
      
      // Format data for API
      const packageData = {
        ...formData,
        weight: parseFloat(formData.weight),
        itemsNo: formData.itemsNo ? parseInt(formData.itemsNo, 10) : 1,
        dimensions: {
          length: formData.dimensions.length ? parseFloat(formData.dimensions.length) : 0,
          width: formData.dimensions.width ? parseFloat(formData.dimensions.width) : 0,
          height: formData.dimensions.height ? parseFloat(formData.dimensions.height) : 0
        },
        // Format financial fields as numbers
        codAmount: formData.codAmount ? parseFloat(formData.codAmount) : 0,
        deliveryCost: formData.deliveryCost ? parseFloat(formData.deliveryCost) : 0,
        paymentMethod: formData.paymentMethod || null,
        paymentNotes: formData.paymentNotes || null,
        shopNotes: formData.shopNotes
      };
      
      // Submit to API
      const response = await packageService.createPackage(packageData);
      
      // Show success modal instead of text alert
      setShowSuccessModal(true);
      
      // Refresh the dashboard
      if (refreshDashboard) {
        refreshDashboard();
      }
      
      // Reset form
      setFormData({
        packageDescription: '',
        category: '',
        weight: '',
        dimensions: {
          length: '',
          width: '',
          height: ''
        },
        itemsNo: '',
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
        shopNotes: '',
        codAmount: '',
        deliveryCost: '',
        paymentMethod: '',
        paymentNotes: ''
      });
      
      // Redirect after modal is shown
      setTimeout(() => {
        navigate('/shop/packages', { replace: true });
      }, 4000);
      
    } catch (err) {
      setError(err.message || 'Failed to create package. Please try again.');
      console.error('Error creating package:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="dashboard-content">
      {error && <div className="alert alert-error">{error}</div>}
      
      {/* Success Modal */}
      {showSuccessModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '8px',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
            maxWidth: '400px',
            width: '90%',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '3rem',
              color: '#4CAF50',
              marginBottom: '1rem'
            }}>
              ✓
            </div>
            <h2 style={{
              fontSize: '1.5rem',
              color: '#333',
              marginBottom: '1rem'
            }}>
              Package Created Successfully!
            </h2>
            <p style={{
              color: '#666',
              marginBottom: '1.5rem'
            }}>
              Your package has been created and is ready for pickup.
            </p>
            <div style={{
              fontSize: '0.9rem',
              color: '#888'
            }}>
              Redirecting to packages list...
            </div>
          </div>
        </div>
      )}

      <div className="form-container" style={{ maxWidth: '800px', margin: '0 auto' }}>
        <form onSubmit={handleSubmit} className="create-package-form">
          <div className="form-section" style={{ marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', color: '#ff8c00' }}>Package Information</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <div className="form-group">
                <label htmlFor="packageDescription">Description*</label>
                <input
                  type="text"
                  id="packageDescription"
                  name="packageDescription"
                  value={formData.packageDescription}
                  onChange={handleChange}
                  placeholder="Describe contents"
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="category">Category*</label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select category</option>
                  {CATEGORY_OPTIONS.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)'}}>
              <div className="form-group">
                <label htmlFor="weight">Weight (kg)*</label>
                <input
                  type="number"
                  id="weight"
                  name="weight"
                  value={formData.weight}
                  onChange={handleChange}
                  placeholder="Weight"
                  step="0.01"
                  min="0.01"
                  required
                  style={{ padding: '0.5rem' }}
                />
              </div>
              
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
                  style={{ padding: '0.5rem' }}
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
                  style={{ padding: '0.5rem' }}
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
                  style={{ padding: '0.5rem' }}
                />
              </div>
              </div>
                <label htmlFor="itemsNo">Number of Items in Package</label>
                <input
                  type="number"
                  id="itemsNo"
                  name="itemsNo"
                  value={formData.itemsNo}
                  onChange={handleChange}
                  placeholder="Enter number of items"
                  min="1"
                  required
                  style={{marginTop: '0.5rem', width: '100%' }}
                  />
        </div>
          
          <div className="form-section">
            <h2 style={{ fontSize: '1.2rem', color: '#ff8c00' }}>Delivery Information</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem'}}>
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
                  style={{ padding: '0.5rem' }}
                />
              </div>
              
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
                  style={{ padding: '0.5rem' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', marginTop: '0.5rem' }}>
              <div className="form-group">
                <label htmlFor="deliveryAddress.state">State</label>
                <input
                  type="text"
                  id="deliveryAddress.state"
                  name="deliveryAddress.state"
                  value={formData.deliveryAddress.state}
                  onChange={handleChange}
                  placeholder="State"
                  style={{ padding: '0.5rem' }}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="deliveryAddress.zipCode">Zip Code</label>
                <input
                  type="text"
                  id="deliveryAddress.zipCode"
                  name="deliveryAddress.zipCode"
                  value={formData.deliveryAddress.zipCode}
                  onChange={handleChange}
                  placeholder="Zip code"
                  style={{ padding: '0.5rem' }}
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
                  style={{ padding: '0.5rem' }}
                />
              </div>
            </div>
          </div>
          
          <div className="form-section" style={{ marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.2rem', color: '#ff8c00' }}>Additional Information</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <div className="form-group">
                <label htmlFor="shopNotes">Shop Notes</label>
                <textarea
                  id="shopNotes"
                  name="notes"
                  value={formData.shopNotes}
                  onChange={handleChange}
                  placeholder="Additional notes from the shop"
                  rows="2"
                  style={{ padding: '0.5rem', width: '100%' }}
                ></textarea>
              </div>
              
              <div className="form-group">
                <label htmlFor="codAmount">COD Amount (Cash on Delivery)</label>
                <input
                  type="number"
                  id="codAmount"
                  name="codAmount"
                  value={formData.codAmount}
                  onChange={handleChange}
                  placeholder="Leave blank if COD is not required"
                  min="0"
                  step="0.01"
                  style={{ padding: '0.5rem' }}
                />
              </div>
            </div>
          </div>
          
          <button 
            type="submit" 
            className="submit-btn" 
            disabled={isSubmitting}
            style={{
              width: '100%',
              padding: '0.75rem',
              backgroundColor: '#ff8c00',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              opacity: isSubmitting ? 0.7 : 1
            }}
          >
            {isSubmitting ? 'Creating...' : 'Create Package'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreatePackage;
