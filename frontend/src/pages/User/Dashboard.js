import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { packageService } from '../../services/api';
import { useTranslation } from 'react-i18next';

const UserDashboard = () => {
  const { currentUser, logout } = useAuth();
  const [trackingNumber, setTrackingNumber] = useState('');
  const [packageHistory, setPackageHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    // Load recent tracking history from local storage
    const loadTrackingHistory = () => {
      const history = localStorage.getItem('trackingHistory');
      if (history) {
        try {
          setPackageHistory(JSON.parse(history));
        } catch (err) {
          console.error('Error loading tracking history:', err);
          localStorage.removeItem('trackingHistory');
        }
      }
    };

    loadTrackingHistory();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (trackingNumber.trim()) {
      navigate(`/track/${trackingNumber}`);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const clearHistory = () => {
    localStorage.removeItem('trackingHistory');
    setPackageHistory([]);
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-sidebar">
        <div className="sidebar-header">
          <h2>{t('user.dashboard.sidebar.brand')}</h2>
          <p>{t('user.dashboard.sidebar.portal')}</p>
        </div>
        
        <div className="sidebar-menu">
          <Link to="/user" className="menu-item active">
            <i className="menu-icon">🏠</i>
            {t('user.dashboard.sidebar.dashboard')}
          </Link>
          <Link to="/track" className="menu-item">
            <i className="menu-icon">🔍</i>
            {t('user.dashboard.sidebar.trackPackage')}
          </Link>
          <Link to="/user/profile" className="menu-item">
            <i className="menu-icon">👤</i>
            {t('user.dashboard.sidebar.profile')}
          </Link>
          <button onClick={handleLogout} className="menu-item logout">
            <i className="menu-icon">🚪</i>
            {t('user.dashboard.sidebar.logout')}
          </button>
        </div>
      </div>
      
      <div className="dashboard-content">
        <div className="dashboard-header">
          <div className="welcome-message">
            <h1>{t('user.dashboard.welcome', { name: currentUser?.name || t('user.dashboard.user') })}</h1>
            <p>{t('user.dashboard.trackAndView')}</p>
          </div>
          <div className="user-info">
            <span className="user-email">{currentUser?.email}</span>
            <span className="user-role">{t('user.dashboard.userAccount')}</span>
          </div>
        </div>
        
        <div className="dashboard-main">
          <div className="tracking-section">
            <h2>{t('user.dashboard.trackYourPackage')}</h2>
            <form onSubmit={handleSubmit} className="tracking-form">
              <input
                type="text"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder={t('user.dashboard.trackingInputPlaceholder')}
                className="tracking-input"
                required
              />
              <button type="submit" className="tracking-button" disabled={loading}>
                {loading ? t('user.dashboard.trackingLoading') : t('user.dashboard.track')}
              </button>
            </form>
          </div>
          
          <div className="tracking-history">
            <div className="section-header">
              <h2>{t('user.dashboard.recentTrackingHistory')}</h2>
              {packageHistory.length > 0 && (
                <button onClick={clearHistory} className="clear-history">
                  {t('user.dashboard.clearHistory')}
                </button>
              )}
            </div>
            
            {packageHistory.length === 0 ? (
              <div className="empty-state">
                <p>{t('user.dashboard.noTrackingHistory')}</p>
              </div>
            ) : (
              <div className="package-list">
                {packageHistory.map((pkg, index) => (
                  <div key={index} className="package-item">
                    <div className="package-info">
                      <div className="tracking-number">{pkg.trackingNumber}</div>
                      <div className="package-description">{pkg.description}</div>
                    </div>
                    <div className="package-details">
                      <div className={`package-status status-${pkg.status}`}>
                        {t(`user.dashboard.status.${pkg.status}`, { defaultValue: pkg.status.charAt(0).toUpperCase() + pkg.status.slice(1) })}
                      </div>
                      <Link to={`/track/${pkg.trackingNumber}`} className="track-again">
                        {t('user.dashboard.trackAgain')}
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="delivery-info">
            <h2>{t('user.dashboard.deliveryInfoTitle')}</h2>
            <div className="info-grid">
              <div className="info-card">
                <div className="info-icon">📱</div>
                <h3>{t('user.dashboard.packageUpdates')}</h3>
                <p>{t('user.dashboard.packageUpdatesDesc')}</p>
              </div>
              <div className="info-card">
                <div className="info-icon">🔒</div>
                <h3>{t('user.dashboard.secureDelivery')}</h3>
                <p>{t('user.dashboard.secureDeliveryDesc')}</p>
              </div>
              <div className="info-card">
                <div className="info-icon">⏱️</div>
                <h3>{t('user.dashboard.onTimeDelivery')}</h3>
                <p>{t('user.dashboard.onTimeDeliveryDesc')}</p>
              </div>
              <div className="info-card">
                <div className="info-icon">💬</div>
                <h3>{t('user.dashboard.customerSupport')}</h3>
                <p>{t('user.dashboard.customerSupportDesc')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
