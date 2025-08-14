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
  type: 'new',
  category: '',
  weight: '',
  dimensions: { length: '', width: '', height: '' },
  itemsNo: '',
  pickupAddress: initialAddress, // auto-fetched, not shown
  deliveryAddress: {
    contactName: '', contactPhone: '', street: '', city: '', state: '', zipCode: '', country: '', instructions: ''
  },
  shopNotes: '',
  // Hidden fields, sent as null/empty
  schedulePickupTime: '',
  deliveryCost: '',
  paymentMethod: '',
  paymentNotes: '',
  shownDeliveryCost: ''
};

const MobileShopCreatePackage = () => {
  const [formData, setFormData] = useState(initialForm);
  const [items, setItems] = useState([]);
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

  // Update items when itemsNo changes
  useEffect(() => {
    const itemsNo = parseInt(formData.itemsNo) || 0;
    if (itemsNo > 0) {
      const newItems = Array.from({ length: itemsNo }, (_, index) => ({
        id: index,
        description: items[index]?.description || '',
        quantity: items[index]?.quantity || 1,
        codPerUnit: items[index]?.codPerUnit || ''
      }));
      setItems(newItems);
    } else {
      setItems([]);
    }
  }, [formData.itemsNo]);

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

  // Handle item changes
  const handleItemChange = (index, field, value) => {
    const updatedItems = [...items];
    let newValue;
    
    if (field === 'quantity') {
      newValue = parseInt(value) || 1;
    } else if (field === 'codPerUnit') {
      // Handle empty string for COD per unit
      if (value === '' || value === null || value === undefined) {
        newValue = '';
      } else {
        newValue = parseFloat(value) || 0;
      }
    } else {
      newValue = value;
    }
    
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: newValue
    };
    setItems(updatedItems);
  };

  // Calculate total COD amount from items
  const calculateTotalCOD = () => {
    return items.reduce((total, item) => {
      const codPerUnit = item.codPerUnit;
      const quantity = item.quantity;
      
      if (codPerUnit === '' || codPerUnit === null || codPerUnit === undefined) {
        return total;
      }
      
      const quantityValue = parseInt(quantity) || 1;
      const codPerUnitValue = parseFloat(codPerUnit) || 0;
      
      return total + (codPerUnitValue * quantityValue);
    }, 0);
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

      // Validate items
      if (!formData.itemsNo || parseInt(formData.itemsNo) <= 0) {
        throw new Error('Please specify the number of items');
      }

      if (items.length !== parseInt(formData.itemsNo)) {
        throw new Error('Please fill in all item details');
      }

      // Validate each item
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (!item.description || item.description.trim() === '') {
          throw new Error(`Please enter description for item ${i + 1}`);
        }
        if (!item.quantity || item.quantity <= 0) {
          throw new Error(`Please enter a valid quantity for item ${i + 1}`);
        }
        if (item.codPerUnit < 0) {
          throw new Error(`COD per unit for item ${i + 1} cannot be negative`);
        }
      }

      const packageData = {
        packageDescription: formData.packageDescription,
        type: formData.type || 'new',
        category: formData.category,
        weight: parseFloat(formData.weight),
        dimensions: {
          length: formData.dimensions.length ? parseFloat(formData.dimensions.length) : 0,
          width: formData.dimensions.width ? parseFloat(formData.dimensions.width) : 0,
          height: formData.dimensions.height ? parseFloat(formData.dimensions.height) : 0
        },
        itemsNo: parseInt(formData.itemsNo, 10),
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
        // Calculate COD amount from items
        codAmount: calculateTotalCOD(),
        // Hidden fields sent as null/empty
        schedulePickupTime: '',
        deliveryCost: '',
        shownDeliveryCost: (formData.shownDeliveryCost === '' || formData.shownDeliveryCost === null || formData.shownDeliveryCost === undefined) ? null : (parseFloat(formData.shownDeliveryCost) || 0),
        paymentMethod: '',
        paymentNotes: '',
        // Include items in the request
        items: items.map(item => ({
          description: item.description.trim(),
          quantity: parseInt(item.quantity),
          codPerUnit: item.codPerUnit === '' || item.codPerUnit === null || item.codPerUnit === undefined ? 0 : parseFloat(item.codPerUnit) || 0
        }))
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
        <label>Type</label>
        <select name="type" value={formData.type} onChange={handleChange}>
          <option value="new">New Package</option>
          <option value="return">Return</option>
          <option value="exchange">Exchange</option>
        </select>
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
        <label>Number of Items in Package*</label>
        <input name="itemsNo" type="number" min="1" value={formData.itemsNo} onChange={handleChange} required />

        {/* Items Section */}
        {items.length > 0 && (
          <div style={{ marginTop: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: '#ff8c00' }}>
              Items Details ({items.length} items)
            </h3>
            <div style={{ 
              backgroundColor: '#f9f9f9', 
              padding: '1rem', 
              borderRadius: '8px',
              border: '1px solid #e0e0e0'
            }}>
              {items.map((item, index) => (
                <div key={item.id} style={{ 
                  border: '1px solid #ddd', 
                  padding: '1rem', 
                  marginBottom: '1rem', 
                  borderRadius: '4px',
                  backgroundColor: 'white'
                }}>
                  <h4 style={{ margin: '0 0 1rem 0', color: '#333', fontSize: '1rem' }}>
                    Item {index + 1}
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div>
                      <label htmlFor={`item-description-${index}`}>Description*</label>
                      <input
                        type="text"
                        id={`item-description-${index}`}
                        value={item.description}
                        onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                        placeholder="Item description"
                        required
                        style={{ padding: '0.5rem', width: '100%' }}
                      />
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                      <div>
                        <label htmlFor={`item-quantity-${index}`}>Quantity*</label>
                        <input
                          type="number"
                          id={`item-quantity-${index}`}
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                          placeholder="Qty"
                          min="1"
                          required
                          style={{ padding: '0.5rem' }}
                        />
                      </div>
                      
                      <div>
                        <label htmlFor={`item-cod-${index}`}>COD Per Unit</label>
                        <input
                          type="number"
                          id={`item-cod-${index}`}
                          value={item.codPerUnit === 0 ? '' : item.codPerUnit}
                          onChange={(e) => handleItemChange(index, 'codPerUnit', e.target.value)}
                          placeholder="0.00"
                          min="0"
                          step="0.01"
                          style={{ padding: '0.5rem' }}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label>Total COD</label>
                      <div style={{ 
                        padding: '0.5rem', 
                        backgroundColor: '#f8f9fa', 
                        border: '1px solid #dee2e6', 
                        borderRadius: '4px',
                        minHeight: '38px',
                        display: 'flex',
                        alignItems: 'center'
                      }}>
                        ${((parseFloat(item.codPerUnit) || 0) * (parseInt(item.quantity) || 1)).toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Total COD Display */}
              <div style={{ 
                marginTop: '1rem', 
                padding: '1rem', 
                backgroundColor: '#e8f5e8', 
                borderRadius: '4px',
                border: '1px solid #4CAF50'
              }}>
                <strong>Total COD Amount: ${calculateTotalCOD().toFixed(2)}</strong>
              </div>

              {/* Shown Shipping Fees input under items list */}
              <div style={{ marginTop: '1rem' }}>
                <label>Shown Shipping Fees</label>
                <input name="shownDeliveryCost" type="number" min="0" step="0.01" placeholder="Leave blank for default Shown Shipping fees" value={formData.shownDeliveryCost} onChange={handleChange} />
              </div>
            </div>
          </div>
        )}

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
        {error && <div className="mobile-shop-create-error">{error}</div>}
        {success && <div className="mobile-shop-create-success">Package created successfully!</div>}
        <button type="submit" className="mobile-shop-create-btn" disabled={isSubmitting}>{isSubmitting ? 'Creating...' : 'Create Package'}</button>
      </form>
    </div>
  );
};

export default MobileShopCreatePackage; 