import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { packageService } from '../../services/api';

const ShopDashboard = () => {
  const { currentUser, logout } = useAuth();
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch packages for this shop when component mounts
    const fetchPackages = async () => {
      try {
        setLoading(true);
        const response = await packageService.getPackages();
        setPackages(response.data.packages || []);
      } catch (err) {
        setError('Failed to load packages. Please try again later.');
        console.error('Error fetching packages:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPackages();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-sidebar">
        <div className="sidebar-header">
          <h2>Dropin</h2>
          <p>Shop Portal</p>
        </div>
        
        <div className="sidebar-menu">
          <Link to="/shop" className="menu-item active">
            <i className="menu-icon">📊</i>
            Dashboard
          </Link>
          <Link to="/shop/packages" className="menu-item">
            <i className="menu-icon">📦</i>
            Packages
          </Link>
          <Link to="/shop/create-package" className="menu-item">
            <i className="menu-icon">➕</i>
            New Package
          </Link>
          <Link to="/shop/profile" className="menu-item">
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
            <h1>Welcome, {currentUser?.name || 'Shop Owner'}</h1>
            <p>Manage your deliveries with ease</p>
          </div>
          <div className="user-info">
            <span className="business-name">{currentUser?.businessName}</span>
            <span className="user-role">Shop Account</span>
          </div>
        </div>
        
        <div className="dashboard-stats">
          <div className="stat-card">
            <div className="stat-value">{packages.filter(p => p.status === 'pending').length}</div>
            <div className="stat-label">Pending</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{packages.filter(p => ['assigned', 'pickedup', 'in-transit'].includes(p.status)).length}</div>
            <div className="stat-label">In Transit</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{packages.filter(p => p.status === 'delivered').length}</div>
            <div className="stat-label">Delivered</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{packages.length}</div>
            <div className="stat-label">Total</div>
          </div>
        </div>
        
        <div className="dashboard-main">
          <div className="recent-packages">
            <div className="section-header">
              <h2>Recent Packages</h2>
              <Link to="/shop/packages" className="view-all">View All</Link>
            </div>
            
            {loading ? (
              <div className="loading-message">Loading recent packages...</div>
            ) : error ? (
              <div className="error-message">{error}</div>
            ) : packages.length === 0 ? (
              <div className="empty-state">
                <p>No packages found. Create your first delivery package now!</p>
                <Link to="/shop/create-package" className="action-button">Create Package</Link>
              </div>
            ) : (
              <div className="package-list">
                {packages.slice(0, 5).map((pkg) => (
                  <div key={pkg.id} className="package-item">
                    <div className="package-info">
                      <div className="tracking-number">{pkg.trackingNumber}</div>
                      <div className="package-description">{pkg.packageDescription}</div>
                    </div>
                    <div className="package-details">
                      <div className={`package-status status-${pkg.status}`}>
                        {pkg.status.charAt(0).toUpperCase() + pkg.status.slice(1)}
                      </div>
                      <div className="package-date">
                        {new Date(pkg.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="quick-actions">
            <h2>Quick Actions</h2>
            <div className="action-buttons">
              <Link to="/shop/create-package" className="action-button">
                <i className="action-icon">➕</i>
                Create New Package
              </Link>
              <Link to="/track" className="action-button">
                <i className="action-icon">🔍</i>
                Track Package
              </Link>
              <Link to="/shop/profile" className="action-button">
                <i className="action-icon">⚙️</i>
                Update Profile
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShopDashboard;
