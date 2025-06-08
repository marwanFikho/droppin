import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { packageService } from '../services/api';

const PackageTracking = () => {
  const [trackingNumber, setTrackingNumber] = useState('');
  const [packageData, setPackageData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const { trackingNumber: trackingParam } = useParams();
  const navigate = useNavigate();
  
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
      setPackageData(response.data);
      
      // Save to tracking history in localStorage
      saveToTrackingHistory(response.data);
    } catch (err) {
      setError('Package not found. Please check the tracking number and try again.');
      setPackageData(null);
      setLoading(false); // Ensure loading is set to false on error
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
            description: packageData.packageDescription || 'Package',
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
      case 'pickedup':
        return 'status-transit';
      case 'pending':
      case 'assigned':
        return 'status-pending';
      case 'cancelled':
      case 'returned':
        return 'status-cancelled';
      default:
        return '';
    }
  };
  
  return (
    <div className="tracking-page-container">
      <div className="tracking-header">
        <h1>Track Your Package</h1>
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
        <div className="tracking-result">
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
                <span className="detail-label">Package Description:</span>
                <span className="detail-value">{packageData.packageDescription || 'N/A'}</span>
              </div>
              <div className="tracking-detail-item">
                <span className="detail-label">Created:</span>
                <span className="detail-value">
                  {new Date(packageData.createdAt).toLocaleDateString()} 
                  {' - '}
                  {new Date(packageData.createdAt).toLocaleTimeString()}
                </span>
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
          
          <div className="tracking-timeline">
            <h3>Tracking History</h3>
            {packageData.statusHistory && packageData.statusHistory.length > 0 ? (
              <div className="timeline">
                {packageData.statusHistory.map((item, index) => (
                  <div key={index} className="timeline-item">
                    <div className={`timeline-status ${getStatusClass(item.status)}`}>
                      <div className="timeline-dot"></div>
                      <div className="timeline-line"></div>
                    </div>
                    <div className="timeline-content">
                      <h4>{item.status.charAt(0).toUpperCase() + item.status.slice(1)}</h4>
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
              <p>No tracking history available.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PackageTracking;
