import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { packageService } from '../../services/api';
import { ShopDashboardContext } from './Dashboard'; // Import the ShopDashboardContext
import { useTranslation } from 'react-i18next';

const CATEGORY_OPTIONS = [
  'shop.createPackage.category.shoes',
  'shop.createPackage.category.perfumes',
  'shop.createPackage.category.clothes',
  'shop.createPackage.category.electronics',
  'shop.createPackage.category.accessories',
  'shop.createPackage.category.books',
  'shop.createPackage.category.other'
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
  
  const { t } = useTranslation();
  
  const [formData, setFormData] = useState({
    packageDescription: '',
    category: '',
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
        setError(t('shop.createPackage.loadAddressError'));
      }
    };
    fetchShopProfile();
  }, [t]);

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
        throw new Error(t('shop.createPackage.requiredFields'));
      }
      
      if (!formData.deliveryAddress.contactName || !formData.deliveryAddress.contactPhone ||
          !formData.deliveryAddress.street || !formData.deliveryAddress.city ||
          !formData.deliveryAddress.country) {
        throw new Error(t('shop.createPackage.deliveryFields'));
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
      setError(err.message || t('shop.createPackage.createFailed'));
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
              {t('shop.createPackage.success.title')}
            </h2>
            <p style={{
              color: '#666',
              marginBottom: '1.5rem'
            }}>
              {t('shop.createPackage.success.message')}
            </p>
            <div style={{
              color: '#888',
              fontSize: '0.95rem',
              marginBottom: '1.5rem'
            }}>
              {t('shop.createPackage.success.redirect')}
            </div>
          </div>
        </div>
      )}

      <div className="form-container" style={{ maxWidth: '800px', margin: '0 auto' }}>
        <form onSubmit={handleSubmit} className="create-package-form">
          <div className="form-section" style={{ marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', color: '#ff8c00' }}>{t('shop.createPackage.packageInfo')}</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <div className="form-group">
                <label htmlFor="packageDescription">{t('shop.createPackage.description')}</label>
                <input
                  type="text"
                  id="packageDescription"
                  name="packageDescription"
                  value={formData.packageDescription}
                  onChange={handleChange}
                  placeholder={t('shop.createPackage.descriptionPlaceholder')}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="category">{t('shop.createPackage.category')}</label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                >
                  <option value="">{t('shop.createPackage.selectCategory')}</option>
                  {CATEGORY_OPTIONS.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)'}}>
              <div className="form-group">
                <label htmlFor="weight">{t('shop.createPackage.weight')}</label>
                <input
                  type="number"
                  id="weight"
                  name="weight"
                  value={formData.weight}
                  onChange={handleChange}
                  placeholder={t('shop.createPackage.weightPlaceholder')}
                  step="0.01"
                  min="0.01"
                  required
                  style={{ padding: '0.5rem' }}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="dimensions.length">{t('shop.createPackage.length')}</label>
                <input
                  type="number"
                  id="dimensions.length"
                  name="dimensions.length"
                  value={formData.dimensions.length}
                  onChange={handleChange}
                  placeholder={t('shop.createPackage.lengthPlaceholder')}
                  min="0"
                  step="0.1"
                  style={{ padding: '0.5rem' }}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="dimensions.width">{t('shop.createPackage.width')}</label>
                <input
                  type="number"
                  id="dimensions.width"
                  name="dimensions.width"
                  value={formData.dimensions.width}
                  onChange={handleChange}
                  placeholder={t('shop.createPackage.widthPlaceholder')}
                  min="0"
                  step="0.1"
                  style={{ padding: '0.5rem' }}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="dimensions.height">{t('shop.createPackage.height')}</label>
                <input
                  type="number"
                  id="dimensions.height"
                  name="dimensions.height"
                  value={formData.dimensions.height}
                  onChange={handleChange}
                  placeholder={t('shop.createPackage.heightPlaceholder')}
                  min="0"
                  step="0.1"
                  style={{ padding: '0.5rem' }}
                />
              </div>
            </div>
          </div>
          
          <div className="form-section">
            <h2 style={{ fontSize: '1.2rem', color: '#ff8c00' }}>{t('shop.createPackage.deliveryInfo')}</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <div className="form-group">
                <label htmlFor="deliveryAddress.contactName">{t('shop.createPackage.contactName')}</label>
                <input
                  type="text"
                  id="deliveryAddress.contactName"
                  name="deliveryAddress.contactName"
                  value={formData.deliveryAddress.contactName}
                  onChange={handleChange}
                  placeholder={t('shop.createPackage.contactNamePlaceholder')}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="deliveryAddress.contactPhone">{t('shop.createPackage.contactPhone')}</label>
                <input
                  type="tel"
                  id="deliveryAddress.contactPhone"
                  name="deliveryAddress.contactPhone"
                  value={formData.deliveryAddress.contactPhone}
                  onChange={handleChange}
                  placeholder={t('shop.createPackage.contactPhonePlaceholder')}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem'}}>
              <div className="form-group">
                <label htmlFor="deliveryAddress.street">{t('shop.createPackage.streetAddress')}</label>
                <input
                  type="text"
                  id="deliveryAddress.street"
                  name="deliveryAddress.street"
                  value={formData.deliveryAddress.street}
                  onChange={handleChange}
                  placeholder={t('shop.createPackage.streetAddressPlaceholder')}
                  required
                  style={{ padding: '0.5rem' }}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="deliveryAddress.city">{t('shop.createPackage.city')}</label>
                <input
                  type="text"
                  id="deliveryAddress.city"
                  name="deliveryAddress.city"
                  value={formData.deliveryAddress.city}
                  onChange={handleChange}
                  placeholder={t('shop.createPackage.cityPlaceholder')}
                  required
                  style={{ padding: '0.5rem' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', marginTop: '0.5rem' }}>
              <div className="form-group">
                <label htmlFor="deliveryAddress.state">{t('shop.createPackage.state')}</label>
                <input
                  type="text"
                  id="deliveryAddress.state"
                  name="deliveryAddress.state"
                  value={formData.deliveryAddress.state}
                  onChange={handleChange}
                  placeholder={t('shop.createPackage.statePlaceholder')}
                  style={{ padding: '0.5rem' }}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="deliveryAddress.zipCode">{t('shop.createPackage.zipCode')}</label>
                <input
                  type="text"
                  id="deliveryAddress.zipCode"
                  name="deliveryAddress.zipCode"
                  value={formData.deliveryAddress.zipCode}
                  onChange={handleChange}
                  placeholder={t('shop.createPackage.zipCodePlaceholder')}
                  style={{ padding: '0.5rem' }}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="deliveryAddress.country">{t('shop.createPackage.country')}</label>
                <input
                  type="text"
                  id="deliveryAddress.country"
                  name="deliveryAddress.country"
                  value={formData.deliveryAddress.country}
                  onChange={handleChange}
                  placeholder={t('shop.createPackage.countryPlaceholder')}
                  required
                  style={{ padding: '0.5rem' }}
                />
              </div>
            </div>
          </div>
          
          <div className="form-section" style={{ marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.2rem', color: '#ff8c00' }}>{t('shop.createPackage.additionalInfo')}</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <div className="form-group">
                <label htmlFor="shopNotes">{t('shop.createPackage.shopNotes')}</label>
                <textarea
                  id="shopNotes"
                  name="notes"
                  value={formData.shopNotes}
                  onChange={handleChange}
                  placeholder={t('shop.createPackage.shopNotesPlaceholder')}
                  rows="2"
                  style={{ padding: '0.5rem', width: '100%' }}
                ></textarea>
              </div>
              
              <div className="form-group">
                <label htmlFor="codAmount">{t('shop.createPackage.codAmount')}</label>
                <input
                  type="number"
                  id="codAmount"
                  name="codAmount"
                  value={formData.codAmount}
                  onChange={handleChange}
                  placeholder={t('shop.createPackage.codAmountPlaceholder')}
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
            {isSubmitting ? t('shop.createPackage.creating') : t('shop.createPackage.createPackage')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreatePackage;
