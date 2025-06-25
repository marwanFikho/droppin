import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { packageService } from '../../services/api';
import './ShopDashboard.css';
import { useTranslation } from 'react-i18next';

const NewPickup = () => {
  const navigate = useNavigate();
  const [packages, setPackages] = useState([]);
  const [selectedPackages, setSelectedPackages] = useState([]);
  const [pickupDate, setPickupDate] = useState('');
  const [pickupTime, setPickupTime] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [shopAddress, setShopAddress] = useState('');
  const { t } = useTranslation();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch packages that are awaiting schedule
        const packagesResponse = await packageService.getPackages();
        const packages = packagesResponse.data.packages || packagesResponse.data || [];
        const awaitingSchedulePackages = packages.filter(pkg => pkg.status === 'awaiting_schedule');
        setPackages(awaitingSchedulePackages);

        // Fetch shop profile to get address
        const shopResponse = await packageService.getShopProfile();
        if (shopResponse.data && shopResponse.data.address) {
          setShopAddress(shopResponse.data.address);
        }
      } catch (err) {
        setError(t('shop.newPickup.errors.loadData'));
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [t]);

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
      setError(t('shop.newPickup.errors.selectAtLeastOne'));
      return;
    }
    if (!pickupDate || !pickupTime) {
      setError(t('shop.newPickup.errors.selectDateTime'));
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
      setError(err.response?.data?.message || t('shop.newPickup.errors.scheduleFailed'));
    }
  };

  if (loading) {
    return <div className="loading-message">{t('shop.newPickup.loading')}</div>;
  }

  return (
    <div className="shop-packages-page" style={{ minHeight: '100vh', background: '#f7f9fb', padding: '32px 0', marginLeft:'auto', marginRight:'auto'}}>
      <div className="page-header" style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1>{t('shop.newPickup.title')}</h1>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', gap: '2.5rem', width: '100%' }}>
        {/* Select Packages Card (Left) */}
        <div className="packages-section" style={{
          width: '450px',
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
          padding: '2rem 1.5rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start'
        }}>
          <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>{t('shop.newPickup.selectPackages')}</h3>
          {error && <div className="error-message">{error}</div>}
          <button type="button" className="btn btn-select-all" onClick={handleSelectAll} style={{ marginBottom: '1rem', width: 'fit-content' }}>
            {selectedPackages.length === packages.length ? t('shop.newPickup.deselectAll') : t('shop.newPickup.selectAll')}
          </button>
          <div style={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            height: 'auto',
            overflow: 'visible',
          }}>
            {packages.length === 0 ? (
              <p>{t('shop.newPickup.noPendingPackages')}</p>
            ) : (
              packages.map(pkg => (
                <label key={pkg.id} className={`package-list-item${selectedPackages.includes(pkg.id) ? ' selected' : ''}`}
                  style={{
                    padding: '1rem',
                    border: '1px solid #e0e0e0',
                    borderRadius: '4px',
                    display: 'flex',
                    gap: '1rem',
                    alignItems: 'center',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s',
                    background: selectedPackages.includes(pkg.id) ? '#fff8e1' : 'white',
                    fontWeight: selectedPackages.includes(pkg.id) ? 'bold' : 'normal',
                    height: 'auto',
                    overflow: 'visible',
                  }}>
                  <input
                    type="checkbox"
                    checked={selectedPackages.includes(pkg.id)}
                    onChange={() => handlePackageSelect(pkg.id)}
                    style={{ width: '20px', height: '20px' }}
                  />
                  <div style={{ display: 'flex', flexDirection: 'column', overflow: 'visible', width: '100%' }}>
                    <span style={{ fontWeight: 'bold', color: '#ff8c00' }}>{pkg.trackingNumber}</span>
                    <span>{pkg.packageDescription}</span>
                    <span className="package-cod">{pkg.deliveryAddress}</span>
                    <span className="package-cod" style={{ color: '#666' }}>{t('shop.newPickup.cod')}: ${pkg.codAmount}</span>
                  </div>
                </label>
              ))
            )}
          </div>
        </div>
        {/* Pickup Details Card (Right) */}
        <div className="pickup-details-section" style={{
          width: '370px',
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
          padding: '2rem 1.5rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
        }}>
          <form onSubmit={handleSubmit} className="pickup-form" style={{ width: '100%' }}>
            <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>{t('shop.newPickup.pickupDetails')}</h3>
            <div className="form-group">
              <label>{t('shop.newPickup.pickupAddress')}</label>
              <input
                type="text"
                value={shopAddress}
                onChange={e => setShopAddress(e.target.value)}
                className="form-control"
              />
            </div>
            <div className="form-group">
              <label>{t('shop.newPickup.pickupDate')}</label>
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
              <label>{t('shop.newPickup.pickupTime')}</label>
              <input
                type="time"
                value={pickupTime}
                onChange={(e) => setPickupTime(e.target.value)}
                className="form-control"
                required
              />
            </div>
            <div className="form-actions" style={{ display: 'flex', gap: '1rem' }}>
              <button type="submit" className="btn btn-primary">{t('shop.newPickup.schedulePickup')}</button>
              <button type="button" className="btn btn-secondary" onClick={() => navigate('/shop/packages')}>{t('common.cancel')}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default NewPickup; 