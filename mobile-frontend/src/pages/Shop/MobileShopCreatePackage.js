import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { packageService } from '../../services/api';
import './MobileShopDashboard.css';

const CATEGORY_OPTIONS = [
  'Shoes', 'Perfumes', 'Clothes', 'Electronics', 'Accessories', 'Books', 'Other'
];

const initialForm = {
  packageDescription: '',
  category: '',
  weight: '',
  dimensions: { length: '', width: '', height: '' },
  deliveryAddress: {
    contactName: '', contactPhone: '', street: '', city: '', state: '', zipCode: '', country: '', instructions: ''
  },
  codAmount: '',
  shopNotes: ''
};

const MobileShopCreatePackage = () => {
  const [formData, setFormData] = useState(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData({
        ...formData,
        [parent]: { ...formData[parent], [child]: value }
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
      if (!formData.packageDescription || !formData.weight || !formData.category) {
        throw new Error('Please fill in all required fields');
      }
      if (!formData.deliveryAddress.contactName || !formData.deliveryAddress.contactPhone ||
          !formData.deliveryAddress.street || !formData.deliveryAddress.city ||
          !formData.deliveryAddress.state || !formData.deliveryAddress.zipCode ||
          !formData.deliveryAddress.country) {
        throw new Error('Please complete all delivery address fields');
      }
      const packageData = {
        ...formData,
        weight: parseFloat(formData.weight),
        dimensions: {
          length: formData.dimensions.length ? parseFloat(formData.dimensions.length) : 0,
          width: formData.dimensions.width ? parseFloat(formData.dimensions.width) : 0,
          height: formData.dimensions.height ? parseFloat(formData.dimensions.height) : 0
        },
        codAmount: formData.codAmount ? parseFloat(formData.codAmount) : 0,
        shopNotes: formData.shopNotes
      };
      await packageService.createPackage(packageData);
      setSuccess(true);
      setTimeout(() => navigate('/shop/packages', { replace: true }), 2000);
    } catch (err) {
      setError(err.message || 'Failed to create package. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mobile-shop-create-package" style={{marginLeft: '1rem', marginRight: '1rem', marginTop: '6rem'}}>
      <h2 className="mobile-shop-create-title">Create Package</h2>
      <form className="mobile-shop-create-form" onSubmit={handleSubmit}>
        <label>Description*</label>
        <input name="packageDescription" value={formData.packageDescription} onChange={handleChange} required />
        <label>Category*</label>
        <select name="category" value={formData.category} onChange={handleChange} required>
          <option value="">Select category</option>
          {CATEGORY_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
        <label>Weight (kg)*</label>
        <input name="weight" type="number" min="0" step="0.01" value={formData.weight} onChange={handleChange} required />
        <label>Dimensions (cm)</label>
        <div className="mobile-shop-create-dimensions">
          <input name="dimensions.length" type="number" min="0" step="0.1" placeholder="Length" value={formData.dimensions.length} onChange={handleChange} />
          <input name="dimensions.width" type="number" min="0" step="0.1" placeholder="Width" value={formData.dimensions.width} onChange={handleChange} />
          <input name="dimensions.height" type="number" min="0" step="0.1" placeholder="Height" value={formData.dimensions.height} onChange={handleChange} />
        </div>
        <label>Recipient Name*</label>
        <input name="deliveryAddress.contactName" value={formData.deliveryAddress.contactName} onChange={handleChange} required />
        <label>Recipient Phone*</label>
        <input name="deliveryAddress.contactPhone" value={formData.deliveryAddress.contactPhone} onChange={handleChange} required />
        <label>Delivery Address*</label>
        <input name="deliveryAddress.street" placeholder="Street" value={formData.deliveryAddress.street} onChange={handleChange} required />
        <input name="deliveryAddress.city" placeholder="City" value={formData.deliveryAddress.city} onChange={handleChange} required />
        <input name="deliveryAddress.state" placeholder="State" value={formData.deliveryAddress.state} onChange={handleChange} required />
        <input name="deliveryAddress.zipCode" placeholder="Zip Code" value={formData.deliveryAddress.zipCode} onChange={handleChange} />
        <input name="deliveryAddress.country" placeholder="Country" value={formData.deliveryAddress.country} onChange={handleChange} />
        <label>COD Amount</label>
        <input name="codAmount" type="number" min="0" step="0.01" value={formData.codAmount} onChange={handleChange} />
        <label>Shop Notes</label>
        <textarea name="notes" value={formData.shopNotes} onChange={handleChange} />
        {error && <div className="mobile-shop-create-error">{error}</div>}
        {success && <div className="mobile-shop-create-success">Package created successfully!</div>}
        <button type="submit" className="mobile-shop-create-btn" disabled={isSubmitting}>{isSubmitting ? 'Creating...' : 'Create Package'}</button>
      </form>
    </div>
  );
};

export default MobileShopCreatePackage; 