import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { packageService } from '../services/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBox, faTruck, faStore, faMapMarkerAlt, faPhone, faWeight, faRuler } from '@fortawesome/free-solid-svg-icons';
import './PackageTracking.css';

const PackageTracking = () => {
  const [trackingNumber, setTrackingNumber] = useState('');
  const [packageData, setPackageData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const { trackingNumber: trackingParam } = useParams();
  const navigate = useNavigate();
  
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
      setError('Package not found. Please check the tracking number and try again.');
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
        <h1><FontAwesomeIcon icon={faBox} /> Track Your Package</h1>
        <p>Enter your tracking number to get real-time updates</p>
      </div>
      
      <div className="tracking-search-container">
        <form onSubmit={handleSubmit} className="tracking-form">
          <input
            type="text"
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            placeholder="Enter tracking number (e.g., DP123456789)"
            className="tracking-input"
            required
          />
          <button type="submit" className="tracking-button" disabled={loading}>
            {loading ? 'Tracking...' : 'Track'}
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
          Loading package information...
        </div>
      )}
      
      {packageData && (
        <div className="tracking-result tracking-centered">
          <div className="tracking-info">
            <h2>Package Information</h2>
            <div className="tracking-details">
              <div className="tracking-detail-item">
                <span className="detail-label">Tracking Number:</span>
                <span className="detail-value">{packageData.trackingNumber}</span>
              </div>
              <div className="tracking-detail-item">
                <span className="detail-label">Status:</span>
                <span className={`detail-value status ${getStatusClass(packageData.status)}`}>
                  {packageData.status.charAt(0).toUpperCase() + packageData.status.slice(1)}
                </span>
              </div>
              <div className="tracking-detail-item">
                <span className="detail-label">Description:</span>
                <span className="detail-value">{packageData.packageDescription || 'N/A'}</span>
              </div>
              <div className="tracking-detail-item">
                <span className="detail-label">Priority:</span>
                <span className="detail-value priority-badge">{packageData.priority}</span>
              </div>
              <div className="tracking-detail-item">
                <span className="detail-label"><FontAwesomeIcon icon={faWeight} /> Weight:</span>
                <span className="detail-value">{packageData.weight ? `${packageData.weight} kg` : 'N/A'}</span>
              </div>
              <div className="tracking-detail-item">
                <span className="detail-label"><FontAwesomeIcon icon={faRuler} /> Dimensions:</span>
                <span className="detail-value">{packageData.dimensions || 'N/A'}</span>
              </div>
            </div>

            {/* Shop Information */}
            {packageData.shop && (
              <div className="tracking-section">
                <h3><FontAwesomeIcon icon={faStore} /> Shop Information</h3>
                <div className="tracking-details">
                  <div className="tracking-detail-item">
                    <span className="detail-label">Business Name:</span>
                    <span className="detail-value">{packageData.shop.name}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Driver Information */}
            {packageData.driver && (
              <div className="tracking-section">
                <h3><FontAwesomeIcon icon={faTruck} /> Driver Information</h3>
                <div className="tracking-details">
                  <div className="tracking-detail-item">
                    <span className="detail-label">Name:</span>
                    <span className="detail-value">{packageData.driver.name}</span>
                  </div>
                  <div className="tracking-detail-item">
                    <span className="detail-label"><FontAwesomeIcon icon={faPhone} /> Phone:</span>
                    <span className="detail-value">{packageData.driver.phone}</span>
                  </div>
                  <div className="tracking-detail-item">
                    <span className="detail-label">Vehicle Type:</span>
                    <span className="detail-value">{packageData.driver.vehicleType}</span>
                  </div>
                  <div className="tracking-detail-item">
                    <span className="detail-label">Working Area:</span>
                    <span className="detail-value">{packageData.driver.workingArea}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Delivery Information */}
            <div className="tracking-section">
              <h3><FontAwesomeIcon icon={faMapMarkerAlt} /> Delivery Information</h3>
              <div className="tracking-details">
                <div className="tracking-detail-item">
                  <span className="detail-label">Contact Name:</span>
                  <span className="detail-value">{packageData.deliveryContactName}</span>
                </div>
                <div className="tracking-detail-item">
                  <span className="detail-label">Address:</span>
                  <span className="detail-value">{packageData.deliveryAddress}</span>
                </div>
                {packageData.estimatedDeliveryTime && (
                  <div className="tracking-detail-item">
                    <span className="detail-label">Estimated Delivery:</span>
                    <span className="detail-value">
                      {new Date(packageData.estimatedDeliveryTime).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {packageData.actualDeliveryTime && (
                  <div className="tracking-detail-item">
                    <span className="detail-label">Delivered On:</span>
                    <span className="detail-value">
                      {new Date(packageData.actualDeliveryTime).toLocaleDateString()} 
                      {' - '}
                      {new Date(packageData.actualDeliveryTime).toLocaleTimeString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PackageTracking;
