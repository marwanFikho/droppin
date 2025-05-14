import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { packageService } from '../../services/api';

const DriverDashboard = () => {
  const { currentUser, logout } = useAuth();
  const [packages, setPackages] = useState([]);
  const [availablePackages, setAvailablePackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch packages assigned to this driver and available packages
    const fetchPackages = async () => {
      try {
        setLoading(true);
        // Fetch packages assigned to this driver
        const assignedResponse = await packageService.getPackages();
        setPackages(assignedResponse.data.packages || []);
        
        // Fetch packages that are available for pickup
        const availableResponse = await packageService.getPackages({ status: 'pending' });
        setAvailablePackages(availableResponse.data.packages || []);
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

  const acceptPackage = async (packageId) => {
    try {
      await packageService.updatePackageStatus(packageId, { status: 'assigned' });
      
      // Refresh data
      const assignedResponse = await packageService.getPackages();
      setPackages(assignedResponse.data.packages || []);
      
      const availableResponse = await packageService.getPackages({ status: 'pending' });
      setAvailablePackages(availableResponse.data.packages || []);
    } catch (err) {
      setError('Failed to accept package. Please try again.');
      console.error('Error accepting package:', err);
    }
  };

  const updatePackageStatus = async (packageId, status) => {
    try {
      await packageService.updatePackageStatus(packageId, { status });
      
      // Refresh data
      const assignedResponse = await packageService.getPackages();
      setPackages(assignedResponse.data.packages || []);
    } catch (err) {
      setError(`Failed to update package to ${status}. Please try again.`);
      console.error('Error updating package:', err);
    }
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-sidebar">
        <div className="sidebar-header">
          <h2>Dropin</h2>
          <p>Driver Portal</p>
        </div>
        
        <div className="sidebar-menu">
          <Link to="/driver" className="menu-item active">
            <i className="menu-icon">📊</i>
            Dashboard
          </Link>
          <Link to="/driver/assigned" className="menu-item">
            <i className="menu-icon">📦</i>
            My Packages
          </Link>
          <Link to="/driver/available" className="menu-item">
            <i className="menu-icon">🔎</i>
            Available Packages
          </Link>
          <Link to="/driver/profile" className="menu-item">
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
            <h1>Welcome, {currentUser?.name || 'Driver'}</h1>
            <p>Manage your deliveries with ease</p>
          </div>
          <div className="user-info">
            <span className="driver-status">
              Status: {currentUser?.isAvailable ? 'Available' : 'Busy'}
            </span>
            <span className="user-role">Driver Account</span>
          </div>
        </div>
        
        <div className="dashboard-stats">
          <div className="stat-card">
            <div className="stat-value">{packages.filter(p => p.status === 'assigned').length}</div>
            <div className="stat-label">Assigned</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{packages.filter(p => ['pickedup', 'in-transit'].includes(p.status)).length}</div>
            <div className="stat-label">In Transit</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{packages.filter(p => p.status === 'delivered').length}</div>
            <div className="stat-label">Delivered</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{availablePackages.length}</div>
            <div className="stat-label">Available</div>
          </div>
        </div>
        
        <div className="dashboard-main">
          <div className="current-packages">
            <div className="section-header">
              <h2>Current Packages</h2>
              <Link to="/driver/assigned" className="view-all">View All</Link>
            </div>
            
            {loading ? (
              <div className="loading-message">Loading packages...</div>
            ) : error ? (
              <div className="error-message">{error}</div>
            ) : packages.filter(p => ['assigned', 'pickedup', 'in-transit'].includes(p.status)).length === 0 ? (
              <div className="empty-state">
                <p>No active packages at the moment.</p>
                <Link to="/driver/available" className="action-button">Find Packages</Link>
              </div>
            ) : (
              <div className="package-list">
                {packages
                  .filter(p => ['assigned', 'pickedup', 'in-transit'].includes(p.status))
                  .slice(0, 3)
                  .map((pkg) => (
                    <div key={pkg.id} className="package-item">
                      <div className="package-info">
                        <div className="tracking-number">{pkg.trackingNumber}</div>
                        <div className="package-description">{pkg.packageDescription}</div>
                        <div className="package-addresses">
                          <div className="pickup">
                            <strong>Pickup:</strong> {pkg.pickupAddress.street}, {pkg.pickupAddress.city}
                          </div>
                          <div className="delivery">
                            <strong>Delivery:</strong> {pkg.deliveryAddress.street}, {pkg.deliveryAddress.city}
                          </div>
                        </div>
                      </div>
                      <div className="package-actions">
                        <div className={`package-status status-${pkg.status}`}>
                          {pkg.status.charAt(0).toUpperCase() + pkg.status.slice(1)}
                        </div>
                        {pkg.status === 'assigned' && (
                          <button 
                            className="action-button" 
                            onClick={() => updatePackageStatus(pkg.id, 'pickedup')}
                          >
                            Mark as Picked Up
                          </button>
                        )}
                        {pkg.status === 'pickedup' && (
                          <button 
                            className="action-button" 
                            onClick={() => updatePackageStatus(pkg.id, 'in-transit')}
                          >
                            Mark In Transit
                          </button>
                        )}
                        {pkg.status === 'in-transit' && (
                          <button 
                            className="action-button" 
                            onClick={() => updatePackageStatus(pkg.id, 'delivered')}
                          >
                            Mark as Delivered
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
          
          <div className="available-packages">
            <div className="section-header">
              <h2>Available Packages</h2>
              <Link to="/driver/available" className="view-all">View All</Link>
            </div>
            
            {loading ? (
              <div className="loading-message">Loading available packages...</div>
            ) : error ? (
              <div className="error-message">{error}</div>
            ) : availablePackages.length === 0 ? (
              <div className="empty-state">
                <p>No available packages at the moment.</p>
              </div>
            ) : (
              <div className="package-list">
                {availablePackages.slice(0, 3).map((pkg) => (
                  <div key={pkg.id} className="package-item">
                    <div className="package-info">
                      <div className="tracking-number">{pkg.trackingNumber}</div>
                      <div className="package-description">{pkg.packageDescription}</div>
                      <div className="package-addresses">
                        <div className="pickup">
                          <strong>Pickup:</strong> {pkg.pickupAddress.street}, {pkg.pickupAddress.city}
                        </div>
                        <div className="delivery">
                          <strong>Delivery:</strong> {pkg.deliveryAddress.street}, {pkg.deliveryAddress.city}
                        </div>
                      </div>
                    </div>
                    <div className="package-actions">
                      <button 
                        className="action-button" 
                        onClick={() => acceptPackage(pkg.id)}
                      >
                        Accept Package
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DriverDashboard;
