import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { packageService } from '../services/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBox, faTruck, faStore, faMapMarkerAlt, faPhone, faWeight, faRuler } from '@fortawesome/free-solid-svg-icons';
import PublicFooter from '../components/PublicFooter';

const PackageTracking = () => {
  const { t, i18n } = useTranslation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [trackingNumber, setTrackingNumber] = useState('');
  const [packageData, setPackageData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const { trackingNumber: trackingParam } = useParams();
  const navigate = useNavigate();
  
  const saveToTrackingHistory = useCallback((packageData) => {
    try {
      const history = JSON.parse(localStorage.getItem('trackingHistory')) || [];
      const exists = history.some(item => item.trackingNumber === packageData.trackingNumber);
      
      if (!exists) {
        const updatedHistory = [
          {
            trackingNumber: packageData.trackingNumber,
            description: packageData.packageDescription || t('tracking.packageTracking.packageFallback'),
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
  }, [t]);

  const trackPackage = useCallback(async (tracking) => {
    try {
      setLoading(true);
      setError(null);
      const response = await packageService.trackPackage(tracking);
      setPackageData(response.data);
      saveToTrackingHistory(response.data);
    } catch (err) {
      setError(t('tracking.packageTracking.errors.notFound'));
      setPackageData(null);
    } finally {
      setLoading(false);
    }
  }, [saveToTrackingHistory, t]);

  useEffect(() => {
    if (trackingParam) {
      setTrackingNumber(trackingParam);
      trackPackage(trackingParam);
    }
  }, [trackingParam, trackPackage]);
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (trackingNumber.trim()) {
      navigate(`/track/${trackingNumber}`);
      trackPackage(trackingNumber);
    }
  };
  
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'delivered':
        return 'bg-success-subtle text-success-emphasis';
      case 'in-transit':
      case 'pickedup':
        return 'bg-info-subtle text-info-emphasis';
      case 'pending':
      case 'assigned':
        return 'bg-warning-subtle text-warning-emphasis';
      case 'cancelled':
      case 'cancelled-awaiting-return':
      case 'cancelled-returned':
        return 'bg-danger-subtle text-danger-emphasis';
      default:
        return 'bg-secondary-subtle text-secondary-emphasis';
    }
  };
  
  return (
    <div className="pt-5" style={{ background: 'linear-gradient(180deg, #fff3e7 0%, #ffe6d2 100%)', minHeight: '100vh' }}>
      <div className="container py-4" style={{ maxWidth: '980px' }}>
        <div className="text-center rounded-4 p-4 p-md-5 mb-4 shadow-sm" style={{ background: 'linear-gradient(135deg, #ff7a3d 0%, #fa8831 28%, #cd7955 52%, #9d8f8d 74%, #4e97ef 100%)' }}>
          <h1 className="display-6 fw-700 text-white mb-2"><FontAwesomeIcon icon={faBox} className="me-2" />{t('tracking.packageTracking.title')}</h1>
          <p className="mb-0" style={{ color: '#f8fafc' }}>{t('tracking.packageTracking.subtitle')}</p>
        </div>

        <div className="card border-0 shadow-sm mb-4" style={{ backgroundColor: '#fffaf5', border: '1px solid rgba(255, 107, 0, 0.22)' }}>
          <div className="card-body">
            <form onSubmit={handleSubmit} className="row g-2 align-items-center">
              <div className="col-md">
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder={t('tracking.packageTracking.form.placeholder')}
                  className="form-control"
                  required
                />
              </div>
              <div className="col-md-auto">
                <button type="submit" className="btn btn-primary fw-600 px-4" disabled={loading}>
                  {loading ? t('tracking.packageTracking.form.submitting') : t('tracking.packageTracking.form.submit')}
                </button>
              </div>
            </form>
          </div>
        </div>

        {error && (
          <div className="alert alert-danger text-center" role="alert">
            {error}
          </div>
        )}

        {loading && (
          <div className="text-center py-4" style={{ color: '#4b5563' }}>
            <div className="spinner-border text-primary mb-2" role="status"><span className="visually-hidden">{t('status.loading')}</span></div>
            <div>{t('tracking.packageTracking.loadingInfo')}</div>
          </div>
        )}

        {packageData && (
          <div className="card border-0 shadow-sm rounded-4 mb-4" style={{ backgroundColor: '#fffaf5', border: '1px solid rgba(255, 107, 0, 0.22)' }}>
            <div className="card-body p-4 p-md-5">
              <h2 className="h4 fw-700 text-center mb-4" style={{ color: '#1f2937' }}>{t('tracking.packageTracking.sections.packageInfo')}</h2>

              <div className="row g-3 mb-3">
                <div className="col-md-6"><small className="d-block text-muted">{t('tracking.packageTracking.labels.trackingNumber')}</small><span className="fw-600">{packageData.trackingNumber}</span></div>
                <div className="col-md-6">
                  <small className="d-block text-muted">{t('tracking.packageTracking.labels.status')}</small>
                  <span className={`badge rounded-pill px-3 py-2 ${getStatusBadgeClass(packageData.status)}`}>
                    {packageData.status.charAt(0).toUpperCase() + packageData.status.slice(1)}
                  </span>
                </div>
                <div className="col-md-6"><small className="d-block text-muted">{t('tracking.packageTracking.labels.description')}</small><span className="fw-600">{packageData.packageDescription || t('tracking.packageTracking.notAvailable')}</span></div>
                <div className="col-md-6"><small className="d-block text-muted">{t('tracking.packageTracking.labels.priority')}</small><span className="badge bg-success-subtle text-success-emphasis text-capitalize">{packageData.priority}</span></div>
                <div className="col-md-6"><small className="d-block text-muted"><FontAwesomeIcon icon={faWeight} className="me-1" />{t('tracking.packageTracking.labels.weight')}</small><span className="fw-600">{packageData.weight ? `${packageData.weight} ${t('tracking.packageTracking.units.kg')}` : t('tracking.packageTracking.notAvailable')}</span></div>
                <div className="col-md-6"><small className="d-block text-muted"><FontAwesomeIcon icon={faRuler} className="me-1" />{t('tracking.packageTracking.labels.dimensions')}</small><span className="fw-600">{packageData.dimensions || t('tracking.packageTracking.notAvailable')}</span></div>
              </div>

              {packageData.shop && (
                <div className="pt-3 mt-3 border-top">
                  <h3 className="h5 fw-700 mb-3" style={{ color: '#235789' }}><FontAwesomeIcon icon={faStore} className="me-2" />{t('tracking.packageTracking.sections.shopInfo')}</h3>
                  <div><small className="d-block text-muted">{t('tracking.packageTracking.labels.businessName')}</small><span className="fw-600">{packageData.shop.name}</span></div>
                </div>
              )}

              {packageData.driver && (
                <div className="pt-3 mt-3 border-top">
                  <h3 className="h5 fw-700 mb-3" style={{ color: '#235789' }}><FontAwesomeIcon icon={faTruck} className="me-2" />{t('tracking.packageTracking.sections.driverInfo')}</h3>
                  <div className="row g-3">
                    <div className="col-md-6"><small className="d-block text-muted">{t('tracking.packageTracking.labels.name')}</small><span className="fw-600">{packageData.driver.name}</span></div>
                    <div className="col-md-6"><small className="d-block text-muted"><FontAwesomeIcon icon={faPhone} className="me-1" />{t('tracking.packageTracking.labels.phone')}</small><span className="fw-600">{packageData.driver.phone}</span></div>
                    <div className="col-md-6"><small className="d-block text-muted">{t('tracking.packageTracking.labels.vehicleType')}</small><span className="fw-600">{packageData.driver.vehicleType}</span></div>
                    <div className="col-md-6"><small className="d-block text-muted">{t('tracking.packageTracking.labels.workingArea')}</small><span className="fw-600">{packageData.driver.workingArea}</span></div>
                  </div>
                </div>
              )}

              <div className="pt-3 mt-3 border-top">
                <h3 className="h5 fw-700 mb-3" style={{ color: '#235789' }}><FontAwesomeIcon icon={faMapMarkerAlt} className="me-2" />{t('tracking.packageTracking.sections.deliveryInfo')}</h3>
                <div className="row g-3">
                  <div className="col-md-6"><small className="d-block text-muted">{t('tracking.packageTracking.labels.contactName')}</small><span className="fw-600">{packageData.deliveryContactName}</span></div>
                  <div className="col-md-6"><small className="d-block text-muted">{t('tracking.packageTracking.labels.address')}</small><span className="fw-600">{packageData.deliveryAddress}</span></div>
                  {packageData.estimatedDeliveryTime && (
                    <div className="col-md-6"><small className="d-block text-muted">{t('tracking.packageTracking.labels.estimatedDelivery')}</small><span className="fw-600">{new Date(packageData.estimatedDeliveryTime).toLocaleDateString(i18n.language)}</span></div>
                  )}
                  {packageData.actualDeliveryTime && (
                    <div className="col-md-6"><small className="d-block text-muted">{t('tracking.packageTracking.labels.deliveredOn')}</small><span className="fw-600">{new Date(packageData.actualDeliveryTime).toLocaleDateString(i18n.language)} - {new Date(packageData.actualDeliveryTime).toLocaleTimeString(i18n.language)}</span></div>
                  )}
                </div>
              </div>

              <div className="mt-4 p-3 rounded-3 border" style={{ background: '#fff8f1', borderColor: 'rgba(255, 107, 0, 0.22)' }}>
                <span className="fw-700 d-block mb-2" style={{ fontSize: '1.05rem' }}>{t('tracking.packageTracking.sections.notesLog')}</span>
                <div className="d-flex flex-column gap-2">
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
                        <div key={idx} className="p-3 rounded-2 border" style={{ background: '#f8f9fa', borderColor: '#ececec' }}>
                          <div className="small text-muted mb-1">
                            {n.createdAt ? new Date(n.createdAt).toLocaleString(i18n.language) : t('tracking.packageTracking.unknownDate')}
                          </div>
                          <div style={{ whiteSpace: 'pre-line' }}>{n.text}</div>
                        </div>
                      ))
                    ) : (
                      <div className="text-muted fst-italic">{t('tracking.packageTracking.noNotes')}</div>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <PublicFooter />
    </div>
  );
};

export default PackageTracking;
