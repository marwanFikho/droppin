import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { packageService } from '../../services/api';
import { useTranslation } from 'react-i18next';

const NewPickup = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [packages, setPackages] = useState([]);
  const [selectedPackages, setSelectedPackages] = useState([]);
  const [pickupDate, setPickupDate] = useState('');
  const [pickupTime, setPickupTime] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [shopAddress, setShopAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch packages that are awaiting schedule
        const packagesResponse = await packageService.getPackages({limit: 10000});
        const packages = packagesResponse.data.packages || packagesResponse.data || [];
        const awaitingSchedulePackages = packages.filter(pkg => pkg.status === 'awaiting_schedule' || pkg.status === 'exchange-awaiting-schedule');
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
    if (isSubmitting) return;
    setIsSubmitting(true);
      if (selectedPackages.length === 0) {
      setError(t('shop.newPickup.errors.selectPackage'));
      setIsSubmitting(false);
      return;
    }

    if (!pickupDate || !pickupTime) {
      setError(t('shop.newPickup.errors.selectDateTime'));
      setIsSubmitting(false);
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
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="container py-5 text-center">{t('shop.newPickup.loading')}</div>;
  }

  return (
    <div className="container-fluid px-3 px-md-4 py-4" style={{ maxWidth: '1400px' }}>
      <div className="rounded-4 shadow-sm p-4 mb-4 text-white" style={{ background: 'linear-gradient(135deg, #ff7a3d 0%, #fa8831 28%, #cd7955 52%, #9d8f8d 74%, #4e97ef 100%)' }}>
        <h1 className="h3 fw-bold mb-0">{t('shop.newPickup.title')}</h1>
      </div>

      <div className="row g-4 align-items-start">
        <div className="col-lg-7">
          <div className="rounded-4 shadow-sm p-3 p-md-4" style={{ background: '#fffaf5' }}>
            <h3 className="h5 fw-bold mb-3">{t('shop.newPickup.sections.selectPackages')}</h3>
            {error && <div className="alert alert-danger py-2">{error}</div>}
            <button type="button" className="btn btn-outline-secondary btn-sm mb-3" onClick={handleSelectAll}>
            {selectedPackages.length === packages.length ? t('shop.newPickup.actions.deselectAll') : t('shop.newPickup.actions.selectAll')}
            </button>

            {packages.length === 0 ? (
              <p className="mb-0">{t('shop.newPickup.empty')}</p>
            ) : (
              <div className="d-flex flex-column gap-2">
                {packages.map(pkg => (
                  <label
                    key={pkg.id}
                    className="d-flex gap-3 align-items-start rounded-3 border p-3"
                    style={{
                      cursor: 'pointer',
                      background: selectedPackages.includes(pkg.id) ? '#fff8e1' : ((pkg.type === 'exchange' || (pkg.status || '').startsWith('exchange-')) ? '#f3e5f5' : 'white'),
                      borderLeft: (pkg.type === 'exchange' || (pkg.status || '').startsWith('exchange-')) ? '3px solid #7b1fa2' : '3px solid transparent'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedPackages.includes(pkg.id)}
                      onChange={() => handlePackageSelect(pkg.id)}
                      className="form-check-input mt-1"
                    />
                    <div className="w-100">
                      <div className="fw-bold" style={{ color: '#ff8c00' }}>{pkg.trackingNumber}</div>
                      <div>{pkg.packageDescription}</div>
                      <div className="text-muted small">{pkg.deliveryAddress}</div>
                      {(pkg.deliveryContactName || pkg.deliveryContactPhone) && (
                        <div className="small text-secondary">
                          {pkg.deliveryContactName || t('shop.newPickup.na')}{pkg.deliveryContactPhone ? ` · ${pkg.deliveryContactPhone}` : ''}
                        </div>
                      )}
                      <div className="small">{t('shop.newPickup.cod')}: EGP {pkg.codAmount}</div>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="col-lg-5">
          <div className="rounded-4 shadow-sm p-3 p-md-4" style={{ background: '#fffaf5' }}>
            <form onSubmit={handleSubmit}>
              <h3 className="h5 fw-bold mb-3">{t('shop.newPickup.sections.pickupDetails')}</h3>
              <div className="mb-3">
                <label className="form-label fw-semibold">{t('shop.newPickup.fields.pickupAddress')}</label>
                <input
                  type="text"
                  value={shopAddress}
                  onChange={e => setShopAddress(e.target.value)}
                  className="form-control"
                />
              </div>
              <div className="mb-3">
                <label className="form-label fw-semibold">{t('shop.newPickup.fields.pickupDate')}</label>
                <input
                  type="date"
                  value={pickupDate}
                  onChange={(e) => setPickupDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="form-control"
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label fw-semibold">{t('shop.newPickup.fields.pickupTime')}</label>
                <input
                  type="time"
                  value={pickupTime}
                  onChange={(e) => setPickupTime(e.target.value)}
                  className="form-control"
                  required
                />
              </div>
              <div className="d-flex gap-2">
                <button type="button" onClick={() => navigate('/shop/packages')} className="btn btn-outline-secondary">{t('shop.newPickup.actions.cancel')}</button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? t('shop.newPickup.actions.scheduling') : t('shop.newPickup.actions.schedulePickup')}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewPickup; 