import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { packageService } from '../services/api';
import './MobilePackageTracking.css';
import { useTranslation } from 'react-i18next';

const MobilePackageTracking = () => {
  const { trackingNumber } = useParams();
  const [searchTracking, setSearchTracking] = useState(trackingNumber || '');
  const [trackingResult, setTrackingResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Auto-track if tracking number is provided in URL
  useEffect(() => {
    if (trackingNumber) {
      setSearchTracking(trackingNumber);
      trackPackage(trackingNumber);
    }
  }, [trackingNumber]);

  const trackPackage = async (tracking) => {
    if (!tracking.trim()) {
      setError(t('tracking.error.enterNumber'));
      return;
    }

    setLoading(true);
    setError('');
    setTrackingResult(null);

    try {
      const response = await packageService.trackPackage(tracking);
      const packageData = response.data;
      
      // Transform the API response to match our UI structure
      const transformedData = {
        trackingNumber: packageData.trackingNumber,
        status: packageData.status,
        estimatedDelivery: packageData.estimatedDeliveryTime,
        currentLocation: getCurrentLocation(packageData.status),
        recipient: packageData.deliveryContactName,
        sender: packageData.shop?.name || packageData.pickupContactName,
        packageDetails: {
          weight: packageData.weight ? `${packageData.weight} kg` : 'N/A',
          dimensions: packageData.dimensions || 'N/A',
          type: packageData.packageDescription || 'Package'
        },
        timeline: generateTimeline(packageData),
        // Additional data from API
        deliveryAddress: packageData.deliveryAddress,
        pickupAddress: packageData.pickupAddress,
        driver: packageData.driver,
        priority: packageData.priority,
        createdAt: packageData.createdAt,
        notes: packageData.notes
      };

      setTrackingResult(transformedData);
      saveToTrackingHistory(transformedData);
    } catch (err) {
      console.error('Tracking error:', err);
      if (err.response?.status === 404) {
        setError(t('tracking.error.notFound'));
      } else {
        setError(t('tracking.error.failed'));
      }
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocation = (status) => {
    switch (status) {
      case 'delivered':
        return t('tracking.location.delivered');
      case 'in-transit':
      case 'pickedup':
        return t('tracking.location.inTransit');
      case 'assigned':
        return t('tracking.location.assigned');
      case 'scheduled_for_pickup':
        return t('tracking.location.scheduled');
      case 'awaiting_schedule':
      case 'awaiting_pickup':
        return t('tracking.location.awaiting');
      case 'pending':
        return t('tracking.location.processing');
      default:
        return t('tracking.location.processing');
    }
  };

  const generateTimeline = (packageData) => {
    const timeline = [];
    
    // Add creation event
    if (packageData.createdAt) {
      timeline.push({
        date: new Date(packageData.createdAt).toLocaleString(),
        status: t('tracking.timeline.created'),
        location: packageData.shop?.name || t('tracking.timeline.shop'),
        description: t('tracking.timeline.createdDescription')
      });
    }

    // Add status history events
    if (packageData.statusHistory && Array.isArray(packageData.statusHistory)) {
      packageData.statusHistory.forEach((event, index) => {
        timeline.push({
          date: event.timestamp ? new Date(event.timestamp).toLocaleString() : new Date().toLocaleString(),
          status: event.status,
          location: event.location || getCurrentLocation(event.status),
          description: event.description || getStatusDescription(event.status)
        });
      });
    }

    // Add current status if not in history
    if (!timeline.some(event => event.status === packageData.status)) {
      timeline.push({
        date: new Date().toLocaleString(),
        status: packageData.status,
        location: getCurrentLocation(packageData.status),
        description: getStatusDescription(packageData.status)
      });
    }

    // Sort by date (newest first)
    return timeline.sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  const getStatusDescription = (status) => {
    switch (status) {
      case 'delivered':
        return t('tracking.statusDescription.delivered');
      case 'in-transit':
        return t('tracking.statusDescription.inTransit');
      case 'pickedup':
        return t('tracking.statusDescription.pickedup');
      case 'assigned':
        return t('tracking.statusDescription.assigned');
      case 'scheduled_for_pickup':
        return t('tracking.statusDescription.scheduled');
      case 'awaiting_schedule':
        return t('tracking.statusDescription.awaitingSchedule');
      case 'awaiting_pickup':
        return t('tracking.statusDescription.awaitingPickup');
      case 'pending':
        return t('tracking.statusDescription.pending');
      default:
        return t('tracking.statusDescription.updated');
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
            description: packageData.packageDetails.type,
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

  const handleSearch = async (e) => {
    e.preventDefault();
    if (searchTracking.trim()) {
      navigate(`/track/${searchTracking}`);
      trackPackage(searchTracking);
    }
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return '#28a745';
      case 'in-transit':
      case 'pickedup':
        return '#f36325';
      case 'assigned':
        return '#004b6f';
      case 'scheduled_for_pickup':
        return '#ffc107';
      case 'awaiting_schedule':
      case 'awaiting_pickup':
      case 'pending':
        return '#6c757d';
      case 'cancelled':
      case 'cancelled-awaiting-return':
      case 'cancelled-returned':
        return '#dc3545';
      default:
        return '#6c757d';
    }
  };

  const getStatusIcon = (status) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return '✅';
      case 'in-transit':
      case 'pickedup':
        return '🚚';
      case 'assigned':
        return '👤';
      case 'scheduled_for_pickup':
        return '📅';
      case 'awaiting_schedule':
      case 'awaiting_pickup':
        return '⏳';
      case 'pending':
        return '📋';
      case 'cancelled':
      case 'cancelled-awaiting-return':
      case 'cancelled-returned':
        return '❌';
      default:
        return '📦';
    }
  };

  return (
    <div className="mobile-package-tracking">
      <div className="mobile-package-tracking-container">
        <div className="mobile-package-tracking-header">
          <div className="mobile-package-tracking-icon">📦</div>
          <h1 className="mobile-package-tracking-title">{t('tracking.title')}</h1>
          <p className="mobile-package-tracking-subtitle">
            {t('tracking.enterNumber')}
          </p>
        </div>

        <form onSubmit={handleSearch} className="mobile-package-tracking-form">
          <div className="form-group">
            <label htmlFor="trackingNumber" className="form-label">{t('tracking.trackingNumber')}</label>
            <div className="mobile-tracking-input-group">
              <input
                type="text"
                id="trackingNumber"
                value={searchTracking}
                onChange={(e) => setSearchTracking(e.target.value)}
                className="form-control"
                placeholder={t('tracking.input.placeholder')}
                autoComplete="off"
              />
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? '🔍' : t('tracking.search')}
              </button>
            </div>
          </div>
        </form>

        {error && (
          <div className="alert alert-danger">
            {error}
          </div>
        )}

        {trackingResult && (
          <div className="mobile-tracking-result">
            <div className="mobile-tracking-summary">
              <div className="mobile-tracking-status">
                <div 
                  className="mobile-tracking-status-icon"
                  style={{ backgroundColor: getStatusColor(trackingResult.status) }}
                >
                  {getStatusIcon(trackingResult.status)}
                </div>
                <div className="mobile-tracking-status-info">
                  <h3 className="mobile-tracking-status-text">{t(`tracking.status.${trackingResult.status}`)}</h3>
                  <p className="mobile-tracking-location">{trackingResult.currentLocation}</p>
                </div>
              </div>
              
              <div className="mobile-tracking-details">
                <div className="mobile-tracking-detail">
                  <span className="mobile-tracking-detail-label">{t('tracking.trackingNumber')}:</span>
                  <span className="mobile-tracking-detail-value">{trackingResult.trackingNumber}</span>
                </div>
                {trackingResult.estimatedDelivery && (
                  <div className="mobile-tracking-detail">
                    <span className="mobile-tracking-detail-label">{t('tracking.estimatedDelivery')}:</span>
                    <span className="mobile-tracking-detail-value">{trackingResult.estimatedDelivery}</span>
                  </div>
                )}
                <div className="mobile-tracking-detail">
                  <span className="mobile-tracking-detail-label">{t('tracking.contactName')}:</span>
                  <span className="mobile-tracking-detail-value">{trackingResult.recipient}</span>
                </div>
                <div className="mobile-tracking-detail">
                  <span className="mobile-tracking-detail-label">{t('tracking.sender')}:</span>
                  <span className="mobile-tracking-detail-value">{trackingResult.sender}</span>
                </div>
                {trackingResult.priority && (
                  <div className="mobile-tracking-detail">
                    <span className="mobile-tracking-detail-label">{t('tracking.priority')}:</span>
                    <span className="mobile-tracking-detail-value">{trackingResult.priority}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="mobile-tracking-timeline">
              <h3 className="mobile-tracking-timeline-title">{t('tracking.timeline.title')}</h3>
              <div className="mobile-tracking-timeline-list">
                {trackingResult.timeline.map((event, index) => (
                  <div key={index} className="mobile-tracking-timeline-item">
                    <div className="mobile-tracking-timeline-dot"></div>
                    <div className="mobile-tracking-timeline-content">
                      <div className="mobile-tracking-timeline-header">
                        <h4 className="mobile-tracking-timeline-status">{t(`tracking.status.${event.status}`)}</h4>
                        <span className="mobile-tracking-timeline-date">{event.date}</span>
                      </div>
                      <p className="mobile-tracking-timeline-location">{event.location}</p>
                      <p className="mobile-tracking-timeline-description">{event.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Notes Log Section */}
            <div className="mobile-tracking-notes-log" style={{background:'#fff', border:'1px solid #e0e0e0', borderRadius:'8px', padding:'1.25rem', marginTop:'1.5rem', marginBottom:'1.5rem'}}>
              <span style={{fontWeight:'bold', fontSize:'1.08em', marginBottom:'0.5rem', display:'block'}}>{t('tracking.notesLog')}</span>
              <div style={{display:'flex', flexDirection:'column', gap:'0.75rem'}}>
                {(() => {
                  let notesArr = [];
                  if (Array.isArray(trackingResult?.notes)) {
                    notesArr = trackingResult.notes;
                  } else if (typeof trackingResult?.notes === 'string') {
                    try {
                      notesArr = JSON.parse(trackingResult.notes);
                    } catch {
                      notesArr = [];
                    }
                  }
                  notesArr = notesArr
                    .filter(n => n && typeof n.text === 'string' && n.text.trim())
                    .sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
                  return (notesArr.length > 0) ? (
                    notesArr.map((n, idx) => (
                      <div key={idx} style={{background:'#f8f9fa', borderRadius:'6px', padding:'0.75rem 1rem', boxShadow:'0 1px 2px rgba(0,0,0,0.03)', border:'1px solid #ececec'}}>
                        <div style={{marginBottom:'0.25rem'}}>
                          <span style={{fontSize:'0.92em', color:'#888'}}>
                            {n.createdAt ? new Date(n.createdAt).toLocaleString() : t('tracking.unknownDate')}
                          </span>
                        </div>
                        <div style={{whiteSpace:'pre-line', fontSize:'1.05em', color:'#222'}}>{n.text}</div>
                      </div>
                    ))
                  ) : (
                    <div style={{color:'#888', fontStyle:'italic'}}>{t('tracking.noNotes')}</div>
                  );
                })()}
              </div>
            </div>

            <div className="mobile-tracking-package-info">
              <h3 className="mobile-tracking-package-title">{t('tracking.packageInfo')}</h3>
              <div className="mobile-tracking-package-details">
                <div className="mobile-tracking-package-detail">
                  <span className="mobile-tracking-package-label">{t('tracking.description')}:</span>
                  <span className="mobile-tracking-package-value">{trackingResult.packageDetails.type}</span>
                </div>
                <div className="mobile-tracking-package-detail">
                  <span className="mobile-tracking-package-label">{t('tracking.weight')}:</span>
                  <span className="mobile-tracking-package-value">{trackingResult.packageDetails.weight}</span>
                </div>
                <div className="mobile-tracking-package-detail">
                  <span className="mobile-tracking-package-label">{t('tracking.dimensions')}:</span>
                  <span className="mobile-tracking-package-value">{trackingResult.packageDetails.dimensions}</span>
                </div>
                {trackingResult.deliveryAddress && (
                  <div className="mobile-tracking-package-detail">
                    <span className="mobile-tracking-package-label">{t('tracking.address')}:</span>
                    <span className="mobile-tracking-package-value">{trackingResult.deliveryAddress}</span>
                  </div>
                )}
                {trackingResult.driver && (
                  <div className="mobile-tracking-package-detail">
                    <span className="mobile-tracking-package-label">{t('tracking.name')}:</span>
                    <span className="mobile-tracking-package-value">{trackingResult.driver.name}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {!trackingResult && !loading && !error && (
          <div className="mobile-tracking-placeholder">
            <div className="mobile-tracking-placeholder-icon">🔍</div>
            <h3 className="mobile-tracking-placeholder-title">{t('tracking.placeholder.title')}</h3>
            <p className="mobile-tracking-placeholder-text">
              {t('tracking.placeholder.description')}
            </p>
            <div className="mobile-tracking-placeholder-example">
              <strong>{t('tracking.placeholder.example')}:</strong> DP123456789
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MobilePackageTracking; 