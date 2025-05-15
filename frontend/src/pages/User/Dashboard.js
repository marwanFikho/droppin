import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { packageService } from '../../services/api';

const UserDashboard = () => {
  const { currentUser, logout } = useAuth();
  const [trackingNumber, setTrackingNumber] = useState('');
  const [packageHistory, setPackageHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

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
          <h2>Droppin</h2>
          <p>User Portal</p>
        </div>
        
        <div className="sidebar-menu">
          <Link to="/user" className="menu-item active">
            <i className="menu-icon">🏠</i>
            Dashboard
          </Link>
          <Link to="/track" className="menu-item">
            <i className="menu-icon">🔍</i>
            Track Package
          </Link>
          <Link to="/user/profile" className="menu-item">
            <i className="menu-icon">👤</i>
            Profile
          </Link>
          <button onClick={handleLogout} className="menu-item logout">
            <i className="menu-icon">🚪</i>
            Logout
          </button>
        </div>
      </div>
      
      <div className="dashboard-content">
        <div className="dashboard-header">
          <div className="welcome-message">
            <h1>Welcome, {currentUser?.name || 'User'}</h1>
            <p>Track your packages and view delivery status</p>
          </div>
          <div className="user-info">
            <span className="user-email">{currentUser?.email}</span>
            <span className="user-role">User Account</span>
          </div>
        </div>
        
        <div className="dashboard-main">
          <div className="tracking-section">
            <h2>Track Your Package</h2>
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
          
          <div className="tracking-history">
            <div className="section-header">
              <h2>Recent Tracking History</h2>
              {packageHistory.length > 0 && (
                <button onClick={clearHistory} className="clear-history">
                  Clear History
                </button>
              )}
            </div>
            
            {packageHistory.length === 0 ? (
              <div className="empty-state">
                <p>No tracking history found. Track a package to see it here.</p>
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
                        {pkg.status.charAt(0).toUpperCase() + pkg.status.slice(1)}
                      </div>
                      <Link to={`/track/${pkg.trackingNumber}`} className="track-again">
                        Track Again
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="delivery-info">
            <h2>Delivery Information</h2>
            <div className="info-grid">
              <div className="info-card">
                <div className="info-icon">📱</div>
                <h3>Package Updates</h3>
                <p>Receive real-time updates on your package status.</p>
              </div>
              <div className="info-card">
                <div className="info-icon">🔒</div>
                <h3>Secure Delivery</h3>
                <p>Your packages are handled with care and security.</p>
              </div>
              <div className="info-card">
                <div className="info-icon">⏱️</div>
                <h3>On-Time Delivery</h3>
                <p>Our drivers aim to deliver packages on schedule.</p>
              </div>
              <div className="info-card">
                <div className="info-icon">💬</div>
                <h3>Customer Support</h3>
                <p>Need help? Contact our customer support team.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
