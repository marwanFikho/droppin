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
          <h2>{t('common.appName')}</h2>
          <p>{t('user.portal')}</p>
        </div>
        
        <div className="sidebar-menu">
          <Link to="/user" className="menu-item active">
            <i className="menu-icon">🏠</i>
            {t('navigation.dashboard')}
          </Link>
          <Link to="/track" className="menu-item">
            <i className="menu-icon">🔍</i>
            {t('navigation.trackPackage')}
          </Link>
          <Link to="/user/profile" className="menu-item">
            <i className="menu-icon">👤</i>
            {t('navigation.profile')}
          </Link>
          <button onClick={handleLogout} className="menu-item logout">
            <i className="menu-icon">🚪</i>
            {t('auth.logout')}
          </button>
        </div>
      </div>
      
      <div className="dashboard-content">
        <div className="dashboard-header">
          <div className="welcome-message">
            <h1>{t('user.welcome', { name: currentUser?.name || t('common.user') })}</h1>
            <p>{t('user.trackingDescription')}</p>
          </div>
          <div className="user-info">
            <span className="user-email">{currentUser?.email}</span>
            <span className="user-role">{t('user.accountType')}</span>
          </div>
        </div>
        
        <div className="dashboard-main">
          <div className="tracking-section">
            <h2>{t('tracking.title')}</h2>
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
          
          <div className="tracking-history">
            <div className="section-header">
              <h2>{t('tracking.history.title')}</h2>
              {packageHistory.length > 0 && (
                <button onClick={clearHistory} className="clear-history">
                  {t('tracking.history.clear')}
                </button>
              )}
            </div>
            
            {packageHistory.length === 0 ? (
              <div className="empty-state">
                <p>{t('tracking.history.empty')}</p>
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
                        {t(`tracking.status.${pkg.status}`)}
                      </div>
                      <Link to={`/track/${pkg.trackingNumber}`} className="track-again">
                        {t('tracking.trackAgain')}
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="delivery-info">
            <h2>{t('user.deliveryInfo.title')}</h2>
            <div className="info-grid">
              <div className="info-card">
                <div className="info-icon">📱</div>
                <h3>{t('user.deliveryInfo.updates.title')}</h3>
                <p>{t('user.deliveryInfo.updates.description')}</p>
              </div>
              <div className="info-card">
                <div className="info-icon">🔒</div>
                <h3>{t('user.deliveryInfo.security.title')}</h3>
                <p>{t('user.deliveryInfo.security.description')}</p>
              </div>
              <div className="info-card">
                <div className="info-icon">⏱️</div>
                <h3>{t('user.deliveryInfo.onTime.title')}</h3>
                <p>{t('user.deliveryInfo.onTime.description')}</p>
              </div>
              <div className="info-card">
                <div className="info-icon">💬</div>
                <h3>{t('user.deliveryInfo.support.title')}</h3>
                <p>{t('user.deliveryInfo.support.description')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
