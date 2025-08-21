import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { packageService } from '../../services/api';
import './MobileShopDashboard.css';

const MobileShopNewPickup = () => {
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
        // Fetch packages that are awaiting schedule
        const packagesResponse = await packageService.getPackages({limit: 10000});
        const pkgs = packagesResponse.data.packages || packagesResponse.data || [];
        const awaitingSchedulePackages = pkgs.filter(pkg => pkg.status === 'awaiting_schedule' || pkg.status === 'exchange-awaiting-schedule');
        setPackages(awaitingSchedulePackages);
        // Fetch shop profile to get address
        const shopResponse = await packageService.getShopProfile();
        if (shopResponse.data && shopResponse.data.address) {
          setShopAddress(shopResponse.data.address);
        }
      } catch (err) {
        setError('Failed to load data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handlePackageSelect = (packageId) => {
    setSelectedPackages(prev =>
      prev.includes(packageId)
        ? prev.filter(id => id !== packageId)
        : [...prev, packageId]
    );
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

  return (
    <div className="mobile-shop-dashboard-section" style={{ marginTop: '5rem' }}>
      <h2 className="mobile-shop-dashboard-section-title">Schedule New Pickup</h2>
      {loading ? (
        <div className="mobile-shop-dashboard-loading">Loading packages...</div>
      ) : error ? (
        <div className="mobile-shop-dashboard-error">{error}</div>
      ) : (
        <>
          <form onSubmit={handleSubmit} className="mobile-shop-create-form">
            <div className="form-group">
              <label>Pickup Address:</label>
              <input
                type="text"
                value={shopAddress}
                onChange={e => setShopAddress(e.target.value)}
                className="form-control"
                style={{ marginBottom: 12 }}
              />
            </div>
            <div className="form-group">
              <label>Pickup Date:</label>
              <input
                type="date"
                value={pickupDate}
                onChange={e => setPickupDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="form-control"
                required
                style={{ marginBottom: 12 }}
              />
            </div>
            <div className="form-group">
              <label>Pickup Time:</label>
              <input
                type="time"
                value={pickupTime}
                onChange={e => setPickupTime(e.target.value)}
                className="form-control"
                required
                style={{ marginBottom: 12 }}
              />
            </div>
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>Select Packages:</span>
                <button
                  type="button"
                  className="mobile-shop-create-btn"
                  onClick={handleSelectAll}
                  style={{ marginBottom: 0, marginLeft: 8, padding: '4px 12px', fontSize: 14, height: 32, lineHeight: '24px', minWidth: 0 }}
                >
                  {selectedPackages.length === packages.length ? 'Deselect All' : 'Select All'}
                </button>
              </label>
              <div style={{ maxHeight: 220, overflowY: 'auto', marginBottom: 12 }}>
                {packages.length === 0 ? (
                  <div className="mobile-shop-dashboard-no-packages">No pending packages available for pickup</div>
                ) : (
                  packages.map(pkg => (
                    <label key={pkg.id} className="package-list-item" style={{ display: 'flex', alignItems: 'center', padding: '4px 0', borderBottom: '1px solid #eee', background: selectedPackages.includes(pkg.id) ? '#fff8e1' : ((pkg.type === 'exchange' || (pkg.status || '').startsWith('exchange-')) ? '#f3e5f5' : 'white'), fontWeight: selectedPackages.includes(pkg.id) ? 'bold' : 'normal', borderLeft: (pkg.type === 'exchange' || (pkg.status || '').startsWith('exchange-')) ? '3px solid #7b1fa2' : '3px solid transparent' }}>
                      <input
                        type="checkbox"
                        checked={selectedPackages.includes(pkg.id)}
                        onChange={() => handlePackageSelect(pkg.id)}
                        style={{ marginRight: 6, marginLeft: 0, width: 16, height: 16 }}
                      />
                      <div style={{ flex: 1 }}>
                        <span style={{ color: '#ff8c00' }}>{pkg.trackingNumber}</span> - {pkg.packageDescription}
                        <div style={{ fontSize: 12, color: '#666' }}>{pkg.deliveryAddress}</div>
                        {(pkg.deliveryContactName || pkg.deliveryContactPhone) && (
                          <div style={{ fontSize: 12, color: '#444' }}>
                            Recipient: {pkg.deliveryContactName || 'N/A'}{pkg.deliveryContactPhone ? ` · ${pkg.deliveryContactPhone}` : ''}
                          </div>
                        )}
                        <div style={{ fontSize: 12, color: '#666' }}>COD: EGP {pkg.codAmount}</div>
                        {pkg.shopNotes && (
                          <div style={{ fontSize: 12, color: '#666' }}><span className="label">Shop Notes: </span><span>{pkg.shopNotes}</span></div>
                        )}
                      </div>
                    </label>
                  ))
                )}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" className="mobile-shop-create-btn" style={{ background: '#6c757d' }} onClick={() => navigate('/shop/packages')}>Cancel</button>
              <button type="submit" className="mobile-shop-create-btn" style={{ background: '#ffc107', color: '#333' }}>Schedule Pickup</button>
            </div>
          </form>
        </>
      )}
    </div>
  );
};

export default MobileShopNewPickup; 