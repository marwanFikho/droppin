import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { packageService } from '../services/api';

const PackageTracking = () => {
  const [trackingNumber, setTrackingNumber] = useState('');
  const [packageData, setPackageData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const { trackingNumber: trackingParam } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  
  // Debug translations
  useEffect(() => {
    console.log('Current language:', i18n.language);
    console.log('Translation test:', {
      title: t('tracking.title'),
      enterNumber: t('tracking.enterNumber'),
      placeholder: t('tracking.placeholder'),
      search: t('tracking.search')
    });
    
    // Force reload translations
    i18n.reloadResources().then(() => {
      console.log('Translations reloaded');
    });
  }, [i18n.language]);
  
  useEffect(() => {
    // If tracking number is provided in URL, use it
    if (trackingParam) {
      setTrackingNumber(trackingParam);
      trackPackage(trackingParam);
    }
  }, [trackingParam]);
  
  const trackPackage = async (tracking) => {
    try {
      setLoading(true);
      setError(null);
      const response = await packageService.trackPackage(tracking);
      console.log('Package Data:', response.data);
      console.log('Package Status:', response.data.status);
      console.log('Translation Key:', `tracking.status.${response.data.status}`);
      console.log('Translated Value:', t(`tracking.status.${response.data.status}`));
      setPackageData(response.data);
      
      // Save to tracking history in localStorage
      saveToTrackingHistory(response.data);
    } catch (err) {
      console.error('Tracking Error:', err);
      setError(t('tracking.error.notFound'));
      setPackageData(null);
    } finally {
      setLoading(false);
    }
  };
  
  // Save package tracking to history
  const saveToTrackingHistory = (packageData) => {
    try {
      const history = JSON.parse(localStorage.getItem('trackingHistory')) || [];
      
      // Check if this tracking number already exists in history
      const exists = history.some(item => item.trackingNumber === packageData.trackingNumber);
      
      if (!exists) {
        // Add to beginning of array (most recent first)
        const updatedHistory = [
          {
            trackingNumber: packageData.trackingNumber,
            description: packageData.packageDescription || t('tracking.noDescription'),
            status: packageData.status,
            date: new Date().toISOString()
          },
          ...history
        ].slice(0, 10); // Keep only the 10 most recent
        
        localStorage.setItem('trackingHistory', JSON.stringify(updatedHistory));
      }
    } catch (err) {
      console.error('Error saving tracking history:', err);
    }
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (trackingNumber.trim()) {
      navigate(`/track/${trackingNumber}`);
      trackPackage(trackingNumber);
    }
  };
  
  const getStatusClass = (status) => {
    switch (status) {
      case 'delivered':
        return 'status-delivered';
      case 'in-transit':
        return 'status-transit';
      case 'pickedup':
        return 'status-transit';
      case 'pending':
        return 'status-pending';
      case 'assigned':
        return 'status-pending';
      case 'cancelled':
        return 'status-cancelled';
      case 'returned':
        return 'status-cancelled';
      default:
        return '';
    }
  };
  
  return (
    <div className="tracking-page-container">
      <div className="tracking-header">
        <h1>{t('tracking.title')}</h1>
        <p>{t('tracking.enterNumber')}</p>
      </div>
      
      <div className="tracking-search-container">
        <form onSubmit={handleSubmit} className="tracking-form">
          <input
            type="text"
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            placeholder={t('tracking.input.placeholder')}
            className="tracking-input"
            required
          />
          <button type="submit" className="tracking-button" disabled={loading}>
            {loading ? t('common.loading') : t('tracking.search')}
          </button>
        </form>
      </div>
      
      {error && (
        <div className="tracking-error">
          {error}
        </div>
      )}
      
      {loading && (
        <div className="tracking-loading">
          {t('common.loading')}
        </div>
      )}
      
      {packageData && (
        <div className="tracking-result">
          <div className="tracking-info">
            <h2>{t('tracking.packageInfo')}</h2>
            <div className="tracking-details">
              <div className="tracking-detail-item">
                <span className="detail-label">{t('tracking.trackingNumber')}:</span>
                <span className="detail-value">{packageData.trackingNumber}</span>
              </div>
              <div className="tracking-detail-item">
                <span className="detail-label">{t('tracking.status')}:</span>
                <span className={`detail-value status ${getStatusClass(packageData.status)}`}>
                  {t(`tracking.status.${packageData.status}`)}
                </span>
              </div>
              <div className="tracking-detail-item">
                <span className="detail-label">{t('tracking.description')}:</span>
                <span className="detail-value">{packageData.packageDescription || t('tracking.noDescription')}</span>
              </div>
              <div className="tracking-detail-item">
                <span className="detail-label">{t('tracking.created')}:</span>
                <span className="detail-value">
                  {new Date(packageData.createdAt).toLocaleDateString()} 
                  {' - '}
                  {new Date(packageData.createdAt).toLocaleTimeString()}
                </span>
              </div>
              {packageData.estimatedDeliveryTime && (
                <div className="tracking-detail-item">
                  <span className="detail-label">{t('tracking.estimatedDelivery')}:</span>
                  <span className="detail-value">
                    {new Date(packageData.estimatedDeliveryTime).toLocaleDateString()}
                  </span>
                </div>
              )}
              {packageData.actualDeliveryTime && (
                <div className="tracking-detail-item">
                  <span className="detail-label">{t('tracking.deliveredOn')}:</span>
                  <span className="detail-value">
                    {new Date(packageData.actualDeliveryTime).toLocaleDateString()} 
                    {' - '}
                    {new Date(packageData.actualDeliveryTime).toLocaleTimeString()}
                  </span>
                </div>
              )}
            </div>
          </div>
          
          <div className="tracking-timeline">
            <h3>{t('tracking.history')}</h3>
            {packageData.statusHistory && packageData.statusHistory.length > 0 ? (
              <div className="timeline">
                {packageData.statusHistory.map((item, index) => (
                  <div key={index} className="timeline-item">
                    <div className={`timeline-status ${getStatusClass(item.status)}`}>
                      <div className="timeline-dot"></div>
                      <div className="timeline-line"></div>
                    </div>
                    <div className="timeline-content">
                      <h4>{t(`tracking.status.${item.status}`)}</h4>
                      <p className="timeline-date">
                        {new Date(item.timestamp).toLocaleDateString()} 
                        {' - '}
                        {new Date(item.timestamp).toLocaleTimeString()}
                      </p>
                      {item.note && <p className="timeline-note">{item.note}</p>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p>{t('tracking.noHistory')}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PackageTracking;
