import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { packageService } from '../services/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBox, faTruck, faStore, faMapMarkerAlt, faPhone, faWeight, faRuler } from '@fortawesome/free-solid-svg-icons';
import './PackageTracking.css';
import { useTranslation } from 'react-i18next';

const PackageTracking = () => {
  const [trackingNumber, setTrackingNumber] = useState('');
  const [packageData, setPackageData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const { trackingNumber: trackingParam } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  useEffect(() => {
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
      setPackageData(response.data);
      saveToTrackingHistory(response.data);
    } catch (err) {
      setError(t('tracking.error.notFound'));
      setPackageData(null);
    } finally {
      setLoading(false);
    }
  };
  
  const saveToTrackingHistory = (packageData) => {
    try {
      const history = JSON.parse(localStorage.getItem('trackingHistory')) || [];
      const exists = history.some(item => item.trackingNumber === packageData.trackingNumber);
      
      if (!exists) {
        const updatedHistory = [
          {
            trackingNumber: packageData.trackingNumber,
            description: packageData.packageDescription || 'Package',
            status: packageData.status,
            date: new Date().toISOString()
          },
          ...history
        ].slice(0, 10);
        
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
      case 'pickedup':
        return 'status-transit';
      case 'pending':
      case 'assigned':
        return 'status-pending';
      case 'cancelled':
      case 'cancelled-awaiting-return':
      case 'cancelled-returned':
        return 'status-cancelled';
      default:
        return '';
    }
  };
  
  return (
    <div className="tracking-page-container">
      <div className="tracking-header">
        <h1><FontAwesomeIcon icon={faBox} /> {t('tracking.title')}</h1>
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
        <div className="tracking-result tracking-centered">
          <div className="tracking-info">
            <h2>{t('tracking.packageInfo')}</h2>
            <div className="tracking-details">
              <div className="tracking-detail-item">
                <span className="detail-label">{t('tracking.trackingNumber')}:</span>
                <span className="detail-value">{packageData.trackingNumber}</span>
              </div>
              <div className="tracking-detail-item">
                <span className="detail-label">{t('common.status')}:</span>
                <span className={`detail-value status ${getStatusClass(packageData.status)}`}>
                  {t(`tracking.status.${packageData.status}`)}
                </span>
              </div>
              <div className="tracking-detail-item">
                <span className="detail-label">{t('tracking.description')}:</span>
                <span className="detail-value">{packageData.packageDescription || t('tracking.noDescription')}</span>
              </div>
              <div className="tracking-detail-item">
                <span className="detail-label">{t('tracking.priority')}:</span>
                <span className="detail-value priority-badge">{packageData.priority}</span>
              </div>
              <div className="tracking-detail-item">
                <span className="detail-label"><FontAwesomeIcon icon={faWeight} /> {t('tracking.weight')}:</span>
                <span className="detail-value">{packageData.weight ? `${packageData.weight} kg` : t('common.notAvailable')}</span>
              </div>
              <div className="tracking-detail-item">
                <span className="detail-label"><FontAwesomeIcon icon={faRuler} /> {t('tracking.dimensions')}:</span>
                <span className="detail-value">{packageData.dimensions || t('common.notAvailable')}</span>
              </div>
            </div>

            {/* Shop Information */}
            {packageData.shop && (
              <div className="tracking-section">
                <h3><FontAwesomeIcon icon={faStore} /> {t('tracking.shopInfo')}</h3>
                <div className="tracking-details">
                  <div className="tracking-detail-item">
                    <span className="detail-label">{t('tracking.businessName')}:</span>
                    <span className="detail-value">{packageData.shop.name}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Driver Information */}
            {packageData.driver && (
              <div className="tracking-section">
                <h3><FontAwesomeIcon icon={faTruck} /> {t('tracking.driverInfo')}</h3>
                <div className="tracking-details">
                  <div className="tracking-detail-item">
                    <span className="detail-label">{t('tracking.name')}:</span>
                    <span className="detail-value">{packageData.driver.name}</span>
                  </div>
                  <div className="tracking-detail-item">
                    <span className="detail-label"><FontAwesomeIcon icon={faPhone} /> {t('tracking.phone')}:</span>
                    <span className="detail-value">{packageData.driver.phone}</span>
                  </div>
                  <div className="tracking-detail-item">
                    <span className="detail-label">{t('tracking.vehicleType')}:</span>
                    <span className="detail-value">{packageData.driver.vehicleType}</span>
                  </div>
                  <div className="tracking-detail-item">
                    <span className="detail-label">{t('tracking.workingArea')}:</span>
                    <span className="detail-value">{packageData.driver.workingArea}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Delivery Information */}
            <div className="tracking-section">
              <h3><FontAwesomeIcon icon={faMapMarkerAlt} /> {t('tracking.deliveryInfo')}</h3>
              <div className="tracking-details">
                <div className="tracking-detail-item">
                  <span className="detail-label">{t('tracking.contactName')}:</span>
                  <span className="detail-value">{packageData.deliveryContactName}</span>
                </div>
                <div className="tracking-detail-item">
                  <span className="detail-label">{t('tracking.address')}:</span>
                  <span className="detail-value">{packageData.deliveryAddress}</span>
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

            {/* Notes Log Section */}
            <div className="mobile-tracking-notes-log" style={{background:'#fff', border:'1px solid #e0e0e0', borderRadius:'8px', padding:'1.25rem', marginTop:'1.5rem', marginBottom:'1.5rem'}}>
              <span style={{fontWeight:'bold', fontSize:'1.08em', marginBottom:'0.5rem', display:'block'}}>{t('tracking.notesLog')}</span>
              <div className="notes-log-list">
                {(() => {
                  let notesArr = [];
                  if (Array.isArray(packageData?.notes)) {
                    notesArr = packageData.notes;
                  } else if (typeof packageData?.notes === 'string') {
                    try {
                      notesArr = JSON.parse(packageData.notes);
                    } catch {
                      notesArr = [];
                    }
                  }
                  notesArr = notesArr
                    .filter(n => n && typeof n.text === 'string' && n.text.trim())
                    .sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
                  return (notesArr.length > 0) ? (
                    notesArr.map((n, idx) => (
                      <div key={idx} className="notes-log-entry">
                        <div className="notes-log-meta">
                          <span className="notes-log-date">
                            {n.createdAt ? new Date(n.createdAt).toLocaleString() : t('tracking.unknownDate')}
                          </span>
                        </div>
                        <div className="notes-log-text">{n.text}</div>
                      </div>
                    ))
                  ) : (
                    <div className="notes-log-empty">{t('tracking.noNotes')}</div>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PackageTracking;
