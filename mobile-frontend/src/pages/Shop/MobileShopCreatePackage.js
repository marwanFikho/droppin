import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { packageService } from '../../services/api';
import './MobileShopDashboard.css';
import { sanitizeNameInput, validateName, validatePhone } from '../../utils/inputValidators';

const CATEGORY_OPTIONS = [
  'Shoes', 'Perfumes', 'Clothes', 'Electronics', 'Accessories', 'Books', 'Other'
];

const initialAddress = { street: '', city: '', state: '', zipCode: '', country: '', instructions: '' };
function parseAddress(addressStr) {
  if (!addressStr) return initialAddress;
  const [street, city, state, zipCode, country] = addressStr.split(',').map(s => s.trim());
  return { street: street || '', city: city || '', state: state || '', zipCode: zipCode || '', country: country || '', instructions: '' };
}

const initialForm = {
  packageDescription: '',
  category: '',
  weight: '',
  dimensions: { length: '', width: '', height: '' },
  itemsNo: '',
  pickupAddress: initialAddress, // auto-fetched, not shown
  deliveryAddress: {
    contactName: '', contactPhone: '', street: '', city: '', state: '', zipCode: '', country: '', instructions: ''
  },
  shopNotes: '',
  codAmount: '',
  // Hidden fields, sent as null/empty
  schedulePickupTime: '',
  deliveryCost: '',
  paymentMethod: '',
  paymentNotes: ''
};

const MobileShopCreatePackage = () => {
  const [formData, setFormData] = useState(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch shop profile and set pickup address automatically
    const fetchShopProfile = async () => {
      try {
        const res = await packageService.getShopProfile();
        const shop = res.data;
        const pickupAddress = parseAddress(shop.address);
        setFormData(prev => ({ ...prev, pickupAddress }));
      } catch (err) {
        // Optionally handle error
      }
    };
    fetchShopProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let newValue = value;
    
    // Delivery contact name: sanitize and allow any input
    if (name === 'deliveryAddress.contactName') {
      newValue = sanitizeNameInput(value);
    }
    // Delivery contact phone: restrict to numbers and format as 01xxxxxxxxx
    else if (name === 'deliveryAddress.contactPhone') {
      newValue = newValue.replace(/[^0-9]/g, '');
      if (newValue.length > 11) newValue = newValue.slice(0, 11);
      // Allow any number input, validation will be done on submit
    }
    // Shop notes: allow any input
    else if (name === 'notes') {
      newValue = value; // Allow any characters in shop notes
    }
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData({
        ...formData,
        [parent]: { ...formData[parent], [child]: newValue }
      });
    } else {
      if (name === 'notes') {
        setFormData({ ...formData, shopNotes: newValue });
      } else {
        setFormData({ ...formData, [name]: newValue });
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
          !formData.deliveryAddress.country) {
        throw new Error('Please complete all delivery address fields');
      }
      
      // Validate phone number format (01xxxxxxxxx)
      if (!/^01\d{9}$/.test(formData.deliveryAddress.contactPhone)) {
        throw new Error('Phone number must be in format: 01xxxxxxxxx (11 digits starting with 01)');
      }
      if (!formData.itemsNo) {
        throw new Error('Please enter the number of items in the package');
      }
      const packageData = {
        packageDescription: formData.packageDescription,
        category: formData.category,
        weight: parseFloat(formData.weight),
        dimensions: {
          length: formData.dimensions.length ? parseFloat(formData.dimensions.length) : 0,
          width: formData.dimensions.width ? parseFloat(formData.dimensions.width) : 0,
          height: formData.dimensions.height ? parseFloat(formData.dimensions.height) : 0
        },
        itemsNo: formData.itemsNo ? parseInt(formData.itemsNo, 10) : 1,
        pickupAddress: formData.pickupAddress, // auto-fetched
        deliveryAddress: {
          contactName: formData.deliveryAddress.contactName,
          contactPhone: formData.deliveryAddress.contactPhone,
          street: formData.deliveryAddress.street,
          city: formData.deliveryAddress.city,
          state: formData.deliveryAddress.state,
          zipCode: formData.deliveryAddress.zipCode,
          country: formData.deliveryAddress.country,
          instructions: ''
        },
        shopNotes: formData.shopNotes,
        codAmount: formData.codAmount ? parseFloat(formData.codAmount) : 0,
        // Hidden fields sent as null/empty
        schedulePickupTime: '',
        deliveryCost: '',
        paymentMethod: '',
        paymentNotes: ''
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
        <label>Length (cm)</label>
        <input name="dimensions.length" type="number" min="0" step="0.1" placeholder="Length" value={formData.dimensions.length} onChange={handleChange} />
        <label>Width (cm)</label>
        <input name="dimensions.width" type="number" min="0" step="0.1" placeholder="Width" value={formData.dimensions.width} onChange={handleChange} />
        <label>Height (cm)</label>
        <input name="dimensions.height" type="number" min="0" step="0.1" placeholder="Height" value={formData.dimensions.height} onChange={handleChange} />
        <label>Number of Items in Package</label>
        <input name="itemsNo" type="number" min="1" value={formData.itemsNo} onChange={handleChange} required />
        <hr style={{margin: '1.5rem 0'}} />
        <label>Contact Name*</label>
        <input name="deliveryAddress.contactName" value={formData.deliveryAddress.contactName} onChange={handleChange} required inputMode="text" autoComplete="off" />
        <label>Contact Phone*</label>
        <input name="deliveryAddress.contactPhone" value={formData.deliveryAddress.contactPhone} onChange={handleChange} required pattern="01[0-9]{9}" inputMode="numeric" maxLength={11} autoComplete="tel" placeholder="01xxxxxxxxx" />
        <label>Street Address*</label>
        <input name="deliveryAddress.street" placeholder="Street address" value={formData.deliveryAddress.street} onChange={handleChange} required />
        <label>City*</label>
        <input name="deliveryAddress.city" placeholder="City" value={formData.deliveryAddress.city} onChange={handleChange} required />
        <label>State</label>
        <input name="deliveryAddress.state" placeholder="State" value={formData.deliveryAddress.state} onChange={handleChange} />
        <label>Zip Code</label>
        <input name="deliveryAddress.zipCode" placeholder="Zip code" value={formData.deliveryAddress.zipCode} onChange={handleChange} />
        <label>Country*</label>
        <input name="deliveryAddress.country" placeholder="Country" value={formData.deliveryAddress.country} onChange={handleChange} required />
        <hr style={{margin: '1.5rem 0'}} />
        <label>Shop Notes</label>
        <textarea name="notes" value={formData.shopNotes} onChange={handleChange} />
        <label>COD Amount (Cash on Delivery)</label>
        <input name="codAmount" type="number" min="0" step="0.01" value={formData.codAmount} onChange={handleChange} />
        {error && <div className="mobile-shop-create-error">{error}</div>}
        {success && <div className="mobile-shop-create-success">Package created successfully!</div>}
        <button type="submit" className="mobile-shop-create-btn" disabled={isSubmitting}>{isSubmitting ? 'Creating...' : 'Create Package'}</button>
      </form>
    </div>
  );
};

export default MobileShopCreatePackage; 