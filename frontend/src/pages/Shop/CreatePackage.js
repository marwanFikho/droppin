import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { packageService } from '../../services/api';
import { ShopDashboardContext } from './Dashboard'; // Import the ShopDashboardContext
import { sanitizeNameInput } from '../../utils/inputValidators';
import { useTranslation } from 'react-i18next';

const CATEGORY_OPTIONS = [
  'shoes',
  'perfumes',
  'clothes',
  'electronics',
  'accessories',
  'books',
  'other'
];

const parseAddress = (addressStr) => {
  if (!addressStr) return { street: '', city: '', state: '', zipCode: '', country: '' };
  const [street, city, state, zipCode, country] = addressStr.split(',').map(s => s.trim());
  return { street: street || '', city: city || '', state: state || '', zipCode: zipCode || '', country: country || '' };
};

const CreatePackage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [shopShippingFees, setShopShippingFees] = useState(0);
  
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
    deliveryCost: '',
    paymentMethod: '',
    paymentNotes: '',
    shownDeliveryCost: ''
  });

  // New state for items
  const [items, setItems] = useState([]);

  // Fetch shop address on mount
  useEffect(() => {
    const fetchShopProfile = async () => {
      try {
        const res = await packageService.getShopProfile();
        const shop = res.data;
        const pickupAddress = parseAddress(shop.address);
        const parsedShippingFees = parseFloat(shop.shippingFees);
        setShopShippingFees(Number.isFinite(parsedShippingFees) && parsedShippingFees >= 0 ? parsedShippingFees : 0);
        setFormData(prev => ({
          ...prev,
          pickupAddress: { ...pickupAddress, instructions: '' }
        }));
      } catch (err) {
        setError(t('shop.createPackage.errors.loadShopAddress'));
      }
    };
    fetchShopProfile();
  }, [t]);

  // Update items when itemsNo changes
  useEffect(() => {
    const itemsNo = parseInt(formData.itemsNo) || 0;
    if (itemsNo > 0) {
      setItems((prevItems) => Array.from({ length: itemsNo }, (_, index) => ({
        id: index,
        description: prevItems[index]?.description || '',
        quantity: prevItems[index]?.quantity || 1,
        codPerUnit: prevItems[index]?.codPerUnit || ''
      })));
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
        [parent]: {
          ...formData[parent],
          [child]: newValue
        }
      });
    } else {
      setFormData({ ...formData, [name]: newValue });
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
      // Validate required fields
      if (!formData.packageDescription || !formData.weight || !formData.category) {
        throw new Error(t('shop.createPackage.errors.requiredFields'));
      }
      
      if (!formData.deliveryAddress.contactName || !formData.deliveryAddress.contactPhone ||
          !formData.deliveryAddress.street || !formData.deliveryAddress.city ||
          !formData.deliveryAddress.country) {
        throw new Error(t('shop.createPackage.errors.deliveryAddressRequired'));
      }
      
      // Validate phone number format (01xxxxxxxxx)
      if (!/^01\d{9}$/.test(formData.deliveryAddress.contactPhone)) {
        throw new Error(t('shop.createPackage.errors.phoneFormat'));
      }

      // Validate items
      if (!formData.itemsNo || parseInt(formData.itemsNo) <= 0) {
        throw new Error(t('shop.createPackage.errors.itemsCountRequired'));
      }

      if (items.length !== parseInt(formData.itemsNo)) {
        throw new Error(t('shop.createPackage.errors.itemsDetailsRequired'));
      }

      // Validate each item
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (!item.description || item.description.trim() === '') {
          throw new Error(t('shop.createPackage.errors.itemDescriptionRequired', { number: i + 1 }));
        }
        if (!item.quantity || item.quantity <= 0) {
          throw new Error(t('shop.createPackage.errors.itemQuantityInvalid', { number: i + 1 }));
        }
        if (item.codPerUnit < 0) {
          throw new Error(t('shop.createPackage.errors.itemCodNegative', { number: i + 1 }));
        }
      }

      if (formData.shownDeliveryCost !== '' && formData.shownDeliveryCost !== null && formData.shownDeliveryCost !== undefined) {
        const shownDeliveryCostValue = parseFloat(formData.shownDeliveryCost);
        if (!Number.isFinite(shownDeliveryCostValue) || shownDeliveryCostValue < 0) {
          throw new Error(t('shop.createPackage.errors.shownShippingFeesInvalid'));
        }
        if (shownDeliveryCostValue > shopShippingFees) {
          throw new Error(t('shop.createPackage.errors.shownShippingFeesExceeded', { max: shopShippingFees.toFixed(2) }));
        }
      }
      
      // Format data for API
      const packageData = {
        ...formData,
        weight: parseFloat(formData.weight),
        itemsNo: parseInt(formData.itemsNo, 10),
        dimensions: {
          length: formData.dimensions.length ? parseFloat(formData.dimensions.length) : 0,
          width: formData.dimensions.width ? parseFloat(formData.dimensions.width) : 0,
          height: formData.dimensions.height ? parseFloat(formData.dimensions.height) : 0
        },
        type: formData.type || 'new',
        // Calculate COD amount from items
        codAmount: calculateTotalCOD(),
        deliveryCost: formData.deliveryCost ? parseFloat(formData.deliveryCost) : 0,
        shownDeliveryCost: (formData.shownDeliveryCost === '' || formData.shownDeliveryCost === null || formData.shownDeliveryCost === undefined) ? null : (parseFloat(formData.shownDeliveryCost) || 0),
        paymentMethod: formData.paymentMethod || null,
        paymentNotes: formData.paymentNotes || null,
        shopNotes: formData.shopNotes,
        // Include items in the request
        items: items.map(item => ({
          description: item.description.trim(),
          quantity: parseInt(item.quantity),
          codPerUnit: item.codPerUnit === '' || item.codPerUnit === null || item.codPerUnit === undefined ? 0 : parseFloat(item.codPerUnit) || 0
        }))
      };
      
      // Submit to API
      await packageService.createPackage(packageData);
      
      // Show success modal instead of text alert
      setShowSuccessModal(true);
      
      // Refresh the dashboard
      if (refreshDashboard) {
        refreshDashboard();
      }
      
      // Reset form
      setFormData({
        packageDescription: '',
        type: 'new',
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
        deliveryCost: '',
        paymentMethod: '',
        paymentNotes: '',
        shownDeliveryCost: ''
      });
      setItems([]);
      
      // Redirect after modal is shown
      setTimeout(() => {
        navigate('/shop/packages', { replace: true });
      }, 2000);
      
    } catch (err) {
      setError(err.message || t('shop.createPackage.errors.createFailed'));
      console.error('Error creating package:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container-fluid px-3 px-md-4 py-4" style={{ maxWidth: '1200px' }}>
      <div className="rounded-4 shadow-sm p-4 p-md-5 mb-4 text-white" style={{ background: 'linear-gradient(135deg, #ff7a3d 0%, #fa8831 28%, #cd7955 52%, #9d8f8d 74%, #4e97ef 100%)' }}>
        <h1 className="h4 fw-bold mb-1">{t('shop.createPackage.title')}</h1>
        <p className="mb-0" style={{ color: '#f8fafc' }}>{t('shop.createPackage.subtitle')}</p>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {showSuccessModal && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 1200 }}>
          <div className="bg-white rounded-4 shadow p-4 text-center" style={{ maxWidth: '420px', width: '90%' }}>
            <div className="fs-1 text-success mb-2">✓</div>
            <h2 className="h5 fw-bold mb-2">{t('shop.createPackage.success.title')}</h2>
            <p className="text-muted mb-2">{t('shop.createPackage.success.subtitle')}</p>
            <small className="text-secondary">{t('shop.createPackage.success.redirecting')}</small>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="d-flex flex-column gap-3">
        <section className="rounded-4 shadow-sm p-3 p-md-4" style={{ background: '#fffaf5' }}>
          <h2 className="h5 fw-bold mb-3" style={{ color: '#ff8c00' }}>{t('shop.createPackage.sections.packageInfo')}</h2>

          <div className="row g-3">
            <div className="col-md-6">
              <label htmlFor="packageDescription" className="form-label fw-semibold">{t('shop.createPackage.fields.description')}</label>
              <input
                type="text"
                id="packageDescription"
                name="packageDescription"
                value={formData.packageDescription}
                onChange={handleChange}
                placeholder={t('shop.createPackage.placeholders.description')}
                required
                className="form-control"
              />
            </div>
            <div className="col-md-6">
              <label htmlFor="category" className="form-label fw-semibold">{t('shop.createPackage.fields.category')}</label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                className="form-select"
              >
                <option value="">{t('shop.createPackage.placeholders.selectCategory')}</option>
                {CATEGORY_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>{t(`shop.createPackage.categories.${opt}`)}</option>
                ))}
              </select>
            </div>

            <div className="col-6 col-md-3">
              <label htmlFor="weight" className="form-label fw-semibold">{t('shop.createPackage.fields.weight')}</label>
              <input
                type="number"
                id="weight"
                name="weight"
                value={formData.weight}
                onChange={handleChange}
                placeholder={t('shop.createPackage.placeholders.weight')}
                step="0.01"
                min="0.01"
                required
                className="form-control"
              />
            </div>
            <div className="col-6 col-md-3">
              <label htmlFor="dimensions.length" className="form-label">{t('shop.createPackage.fields.length')}</label>
              <input
                type="number"
                id="dimensions.length"
                name="dimensions.length"
                value={formData.dimensions.length}
                onChange={handleChange}
                placeholder={t('shop.createPackage.placeholders.length')}
                min="0"
                step="0.1"
                className="form-control"
              />
            </div>
            <div className="col-6 col-md-3">
              <label htmlFor="dimensions.width" className="form-label">{t('shop.createPackage.fields.width')}</label>
              <input
                type="number"
                id="dimensions.width"
                name="dimensions.width"
                value={formData.dimensions.width}
                onChange={handleChange}
                placeholder={t('shop.createPackage.placeholders.width')}
                min="0"
                step="0.1"
                className="form-control"
              />
            </div>
            <div className="col-6 col-md-3">
              <label htmlFor="dimensions.height" className="form-label">{t('shop.createPackage.fields.height')}</label>
              <input
                type="number"
                id="dimensions.height"
                name="dimensions.height"
                value={formData.dimensions.height}
                onChange={handleChange}
                placeholder={t('shop.createPackage.placeholders.height')}
                min="0"
                step="0.1"
                className="form-control"
              />
            </div>

            <div className="col-md-4">
              <label htmlFor="itemsNo" className="form-label fw-semibold">{t('shop.createPackage.fields.itemsNo')}</label>
              <input
                type="number"
                id="itemsNo"
                name="itemsNo"
                value={formData.itemsNo}
                onChange={handleChange}
                placeholder={t('shop.createPackage.placeholders.itemsNo')}
                min="1"
                required
                className="form-control"
              />
            </div>
          </div>
        </section>

        {items.length > 0 && (
          <section className="rounded-4 shadow-sm p-3 p-md-4" style={{ background: '#fffaf5' }}>
            <h2 className="h5 fw-bold mb-3" style={{ color: '#ff8c00' }}>{t('shop.createPackage.items.title', { count: items.length })}</h2>

            <div className="d-flex flex-column gap-3">
              {items.map((item, index) => (
                <div key={item.id} className="card border-0 shadow-sm rounded-4">
                  <div className="card-body">
                    <h3 className="h6 fw-bold mb-3">{t('shop.createPackage.items.itemNumber', { number: index + 1 })}</h3>
                    <div className="row g-3">
                      <div className="col-md-5">
                        <label htmlFor={`item-description-${index}`} className="form-label">{t('shop.createPackage.fields.description')}</label>
                        <input
                          type="text"
                          id={`item-description-${index}`}
                          value={item.description}
                          onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                          placeholder={t('shop.createPackage.placeholders.itemDescription')}
                          required
                          className="form-control"
                        />
                      </div>
                      <div className="col-6 col-md-2">
                        <label htmlFor={`item-quantity-${index}`} className="form-label">{t('shop.createPackage.fields.quantity')}</label>
                        <input
                          type="number"
                          id={`item-quantity-${index}`}
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                          min="1"
                          required
                          className="form-control"
                        />
                      </div>
                      <div className="col-6 col-md-2">
                        <label htmlFor={`item-cod-${index}`} className="form-label">{t('shop.createPackage.fields.codPerUnit')}</label>
                        <input
                          type="number"
                          id={`item-cod-${index}`}
                          value={item.codPerUnit === 0 ? '' : item.codPerUnit}
                          onChange={(e) => handleItemChange(index, 'codPerUnit', e.target.value)}
                          placeholder="0.00"
                          min="0"
                          step="0.01"
                          className="form-control"
                        />
                      </div>
                      <div className="col-md-3">
                        <label className="form-label">{t('shop.createPackage.fields.totalCod')}</label>
                        <div className="form-control fw-semibold" style={{ background: '#fff3e8', color: '#ff8c00' }}>
                          EGP {((parseFloat(item.codPerUnit) || 0) * (parseInt(item.quantity) || 1)).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <div className="rounded-4 border p-3 text-center" style={{ borderColor: '#ff8c00', background: '#fff3e8' }}>
                <div className="fw-semibold" style={{ color: '#ff8c00' }}>{t('shop.createPackage.items.totalCodAmount')}</div>
                <div className="h4 fw-bold mb-0" style={{ color: '#ff8c00' }}>EGP {calculateTotalCOD().toFixed(2)}</div>
              </div>

              <div className="col-md-4 px-0">
                <label htmlFor="shownDeliveryCost" className="form-label">{t('shop.createPackage.fields.shownShippingFees')}</label>
                <input
                  type="number"
                  id="shownDeliveryCost"
                  name="shownDeliveryCost"
                  value={formData.shownDeliveryCost}
                  onChange={handleChange}
                  placeholder={t('shop.createPackage.placeholders.shownShippingFees')}
                  min="0"
                  max={shopShippingFees}
                  step="0.01"
                  className="form-control"
                />
                <small className="text-muted">
                  {t('shop.createPackage.hints.maxShownShippingFees', { max: shopShippingFees.toFixed(2) })}
                </small>
              </div>
            </div>
          </section>
        )}

        <section className="rounded-4 shadow-sm p-3 p-md-4" style={{ background: '#fffaf5' }}>
          <h2 className="h5 fw-bold mb-3" style={{ color: '#ff8c00' }}>{t('shop.createPackage.sections.deliveryInfo')}</h2>
          <div className="row g-3">
            <div className="col-md-6">
              <label htmlFor="deliveryAddress.contactName" className="form-label fw-semibold">{t('shop.createPackage.fields.contactName')}</label>
              <input
                type="text"
                id="deliveryAddress.contactName"
                name="deliveryAddress.contactName"
                value={formData.deliveryAddress.contactName}
                onChange={handleChange}
                placeholder={t('shop.createPackage.placeholders.contactName')}
                required
                inputMode="text"
                autoComplete="off"
                className="form-control"
              />
            </div>
            <div className="col-md-6">
              <label htmlFor="deliveryAddress.contactPhone" className="form-label fw-semibold">{t('shop.createPackage.fields.contactPhone')}</label>
              <input
                type="tel"
                id="deliveryAddress.contactPhone"
                name="deliveryAddress.contactPhone"
                value={formData.deliveryAddress.contactPhone}
                onChange={handleChange}
                placeholder="01xxxxxxxxx"
                required
                pattern="01[0-9]{9}"
                inputMode="numeric"
                maxLength={11}
                autoComplete="tel"
                className="form-control"
              />
            </div>

            <div className="col-md-6">
              <label htmlFor="deliveryAddress.street" className="form-label fw-semibold">{t('shop.createPackage.fields.streetAddress')}</label>
              <input
                type="text"
                id="deliveryAddress.street"
                name="deliveryAddress.street"
                value={formData.deliveryAddress.street}
                onChange={handleChange}
                placeholder={t('shop.createPackage.placeholders.streetAddress')}
                required
                className="form-control"
              />
            </div>
            <div className="col-md-6">
              <label htmlFor="deliveryAddress.city" className="form-label fw-semibold">{t('shop.createPackage.fields.city')}</label>
              <input
                type="text"
                id="deliveryAddress.city"
                name="deliveryAddress.city"
                value={formData.deliveryAddress.city}
                onChange={handleChange}
                placeholder={t('shop.createPackage.placeholders.city')}
                required
                className="form-control"
              />
            </div>

            <div className="col-md-4">
              <label htmlFor="deliveryAddress.state" className="form-label">{t('shop.createPackage.fields.state')}</label>
              <input
                type="text"
                id="deliveryAddress.state"
                name="deliveryAddress.state"
                value={formData.deliveryAddress.state}
                onChange={handleChange}
                placeholder={t('shop.createPackage.placeholders.state')}
                className="form-control"
              />
            </div>
            <div className="col-md-4">
              <label htmlFor="deliveryAddress.zipCode" className="form-label">{t('shop.createPackage.fields.zipCode')}</label>
              <input
                type="text"
                id="deliveryAddress.zipCode"
                name="deliveryAddress.zipCode"
                value={formData.deliveryAddress.zipCode}
                onChange={handleChange}
                placeholder={t('shop.createPackage.placeholders.zipCode')}
                className="form-control"
              />
            </div>
            <div className="col-md-4">
              <label htmlFor="deliveryAddress.country" className="form-label fw-semibold">{t('shop.createPackage.fields.country')}</label>
              <input
                type="text"
                id="deliveryAddress.country"
                name="deliveryAddress.country"
                value={formData.deliveryAddress.country}
                onChange={handleChange}
                placeholder={t('shop.createPackage.placeholders.country')}
                required
                className="form-control"
              />
            </div>
          </div>
        </section>

        <section className="rounded-4 shadow-sm p-3 p-md-4" style={{ background: '#fffaf5' }}>
          <h2 className="h5 fw-bold mb-3" style={{ color: '#ff8c00' }}>{t('shop.createPackage.sections.additionalInfo')}</h2>
          <label htmlFor="shopNotes" className="form-label">{t('shop.createPackage.fields.shopNotes')}</label>
          <textarea
            id="shopNotes"
            name="shopNotes"
            value={formData.shopNotes}
            onChange={handleChange}
            placeholder={t('shop.createPackage.placeholders.shopNotes')}
            rows="3"
            className="form-control"
          ></textarea>
        </section>

        <div className="d-grid">
          <button
            type="submit"
            className="btn btn-lg text-white fw-semibold"
            disabled={isSubmitting}
            style={{ background: '#ff8c00', opacity: isSubmitting ? 0.7 : 1 }}
          >
            {isSubmitting ? t('shop.createPackage.actions.creating') : t('shop.createPackage.actions.createPackage')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreatePackage;