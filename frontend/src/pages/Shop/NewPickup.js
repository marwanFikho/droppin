import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { packageService } from '../../services/api';
import './ShopDashboard.css';

const NewPickup = () => {
  const navigate = useNavigate();
  const [packages, setPackages] = useState([]);
  const [selectedPackages, setSelectedPackages] = useState([]);
  const [pickupDate, setPickupDate] = useState('');
  const [pickupTime, setPickupTime] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [shopAddress, setShopAddress] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch packages that are pending pickup
        const packagesResponse = await packageService.getPackages();
        const packages = packagesResponse.data.packages || packagesResponse.data || [];
        const pendingPackages = packages.filter(pkg => pkg.status === 'pending');
        setPackages(pendingPackages);

        // Fetch shop profile to get address
        const shopResponse = await packageService.getShopProfile();
        if (shopResponse.data && shopResponse.data.address) {
          setShopAddress(shopResponse.data.address);
        }
      } catch (err) {
        setError('Failed to load data. Please try again later.');
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handlePackageSelect = (packageId) => {
    setSelectedPackages(prev => {
      if (prev.includes(packageId)) {
        return prev.filter(id => id !== packageId);
      } else {
        return [...prev, packageId];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedPackages.length === packages.length) {
      setSelectedPackages([]);
    } else {
      setSelectedPackages(packages.map(pkg => pkg.id));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
      if (selectedPackages.length === 0) {
      setError('Please select at least one package for pickup');
      return;
    }

    if (!pickupDate || !pickupTime) {
      setError('Please select both date and time for pickup');
      return;
    }

    try {
      const scheduledTime = new Date(`${pickupDate}T${pickupTime}`);
      const pickupData = {
        scheduledTime,
        pickupAddress: shopAddress,
        packageIds: selectedPackages
      };

      await packageService.createPickup(pickupData);
      navigate('/shop/packages');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to schedule pickup. Please try again.');
    }
  };

  if (loading) {
    return <div className="loading-message">Loading packages...</div>;
  }

  return (
    <div className="shop-packages-page" style={{marginLeft:'1000px', width:'600px'}}>
      <div className="page-header">
        <h1>Schedule New Pickup</h1>
      </div>

      <div className="pickup-form-container">
        <form onSubmit={handleSubmit} className="pickup-form">
          {error && <div className="error-message">{error}</div>}

          <div className="form-section">
            <h3>Select Packages</h3>
            <button type="button" className="btn btn-select-all" onClick={handleSelectAll} style={{marginBottom: '1rem', width: 'fit-content'}}>
              {selectedPackages.length === packages.length ? 'Deselect All' : 'Select All'}
            </button>
            <div className="packages-list">
              {packages.length === 0 ? (
                <p>No pending packages available for pickup</p>
              ) : (
                packages.map(pkg => (
                  <label key={pkg.id} className={`package-list-item${selectedPackages.includes(pkg.id) ? ' selected' : ''}`}>
                <input
                  type="checkbox"
                      checked={selectedPackages.includes(pkg.id)}
                      onChange={() => handlePackageSelect(pkg.id)}
                />
                    <div className="package-list-info">
                      <span className="tracking-number">{pkg.trackingNumber}</span>
                      <span className="package-description">{pkg.packageDescription}</span>
                      <span className="package-cod">COD: ${pkg.codAmount}</span>
                    </div>
                </label>
                ))
              )}
              </div>
          </div>

          <div className="form-section">
            <h3>Pickup Details</h3>
            <div className="form-group">
              <label>Pickup Address:</label>
              <input 
                type="text" 
                value={shopAddress} 
                onChange={e => setShopAddress(e.target.value)}
                className="form-control"
              />
        </div>

        <div className="form-group">
              <label>Pickup Date:</label>
          <input
                type="date" 
            value={pickupDate}
            onChange={(e) => setPickupDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="form-control"
            required
          />
        </div>

        <div className="form-group">
              <label>Pickup Time:</label>
          <input
                type="time" 
                value={pickupTime}
                onChange={(e) => setPickupTime(e.target.value)}
                className="form-control"
            required
          />
        </div>
          </div>

          <div className="form-actions">
            <button type="button" onClick={() => navigate('/shop/packages')} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Schedule Pickup
        </button>
          </div>
      </form>
      </div>
    </div>
  );
};

export default NewPickup; 