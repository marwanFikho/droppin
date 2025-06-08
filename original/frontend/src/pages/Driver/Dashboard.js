import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { packageService } from '../../services/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDollarSign, faBox, faTruck, faMapMarkedAlt } from '@fortawesome/free-solid-svg-icons';
import './DriverDashboard.css';

const DriverDashboard = () => {
  const { currentUser, logout } = useAuth();
  const [packages, setPackages] = useState([]);
  const [availablePackages, setAvailablePackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [showPackageDetails, setShowPackageDetails] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch packages assigned to this driver and available packages
    const fetchPackages = async () => {
      try {
        setLoading(true);
        // Fetch packages assigned to this driver
        const assignedResponse = await packageService.getPackages();
        console.log('Assigned packages:', assignedResponse.data);
        
        // Get the packages array from the response
        let packagesList = [];
        if (assignedResponse.data && Array.isArray(assignedResponse.data)) {
          packagesList = assignedResponse.data;
        } else if (assignedResponse.data && Array.isArray(assignedResponse.data.packages)) {
          packagesList = assignedResponse.data.packages;
        }
        
        setPackages(packagesList);
        
        // Fetch packages that are available for pickup
        const availableResponse = await packageService.getPackages({ status: 'pending' });
        console.log('Available packages:', availableResponse.data);
        
        // Get the available packages array from the response
        let availablePackagesList = [];
        if (availableResponse.data && Array.isArray(availableResponse.data)) {
          availablePackagesList = availableResponse.data;
        } else if (availableResponse.data && Array.isArray(availableResponse.data.packages)) {
          availablePackagesList = availableResponse.data.packages;
        }
        
        setAvailablePackages(availablePackagesList);
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

  const updatePackageStatus = async (packageId, status, additionalData = {}) => {
    try {
      // Include additional data such as payment information if provided
      await packageService.updatePackageStatus(packageId, { status, ...additionalData });
      
      // Refresh data
      const assignedResponse = await packageService.getPackages();
      const packagesData = assignedResponse.data.packages || assignedResponse.data || [];
      setPackages(packagesData);
      
      // If we had a selected package and it was updated, close the modal
      if (selectedPackage && selectedPackage.id === packageId) {
        setShowPackageDetails(false);
      }
    } catch (err) {
      setError(`Failed to update package to ${status}. Please try again.`);
      console.error('Error updating package:', err);
    }
  };
  
  // Mark package as delivered and handle payment collection
  const markAsDeliveredWithPayment = async (packageId) => {
    try {
      // Update package status to delivered with payment collected
      await updatePackageStatus(packageId, 'delivered', { 
        isPaid: true,
        paymentDate: new Date().toISOString(),
        paymentMethod: 'cash',
        paymentNotes: 'Collected by driver on delivery'
      });
      
      // Show success message
      setError(null); // Clear any existing errors
      alert('Package marked as delivered and payment collected successfully');
    } catch (err) {
      setError('Failed to mark package as delivered with payment. Please try again.');
      console.error('Error updating package with payment:', err);
    }
  };
  
  // View package details
  const viewPackageDetails = async (pkg) => {
    console.log('Viewing package details:', pkg);
    setShowPackageDetails(true);
    setLoading(true);
    setError(null);
    
    try {
      // Get the complete package details from the API
      const response = await packageService.getPackageById(pkg.id);
      console.log('API package details:', response.data);
      
      if (response && response.data) {
        // Ensure we have all the data we need
        const packageData = response.data;
        
        // Check for required nested objects and ensure we're not using mock data
        if (!packageData.pickupAddress) {
          console.warn('Package is missing pickup address data');
          packageData.pickupAddress = {};
        }
        
        if (!packageData.deliveryAddress) {
          console.warn('Package is missing delivery address data');
          packageData.deliveryAddress = {};
        }
        
        // Log the real data we're about to display
        console.log('Using real package data from database:', packageData);
        console.log('Pickup address:', packageData.pickupAddress);
        console.log('Delivery address:', packageData.deliveryAddress);
        
        // Set the data from the database
        setSelectedPackage(packageData);
      } else {
        // Fallback to the package data we already have
        console.warn('API returned no data, using existing package data as fallback');
        setSelectedPackage(pkg);
        setError('Could not fetch complete package details from the server.');
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching package details:', error);
      
      // If API call fails, use the data we already have
      setSelectedPackage(pkg);
      setLoading(false);
      
      // Show error message but don't close the modal
      setError('Could not fetch complete package details. Some information may be missing.');
      
      // Clear error after 5 seconds
      setTimeout(() => {
        setError(null);
      }, 5000);
    }
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };
  
  // Safely get nested properties
  const safeGet = (obj, path, defaultValue = 'Not available') => {
    try {
      const result = path.split('.').reduce((o, key) => (o && o[key] !== undefined && o[key] !== null) ? o[key] : null, obj);
      return result !== null && result !== undefined ? result : defaultValue;
    } catch (error) {
      console.error(`Error accessing path ${path}:`, error);
      return defaultValue;
    }
  };
  
  // Render package details modal
  const renderPackageDetailsModal = () => {
    if (!selectedPackage) return null;
    
    console.log('Rendering package details for:', selectedPackage);
    
    // Get status with fallback
    const status = selectedPackage.status || 'pending';
    
    return (
      <div className={`modal-overlay ${showPackageDetails ? 'show' : ''}`} onClick={() => setShowPackageDetails(false)}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h2>Package #{selectedPackage.trackingNumber || 'Unknown'}</h2>
            <button 
              className="close-btn"
              onClick={() => setShowPackageDetails(false)}
            >
              ×
            </button>
          </div>
          
          {loading ? (
            <div className="modal-body loading-state">
              <div className="loading-spinner"></div>
              <p>Loading package details...</p>
            </div>
          ) : (
            <>
              <div className="modal-body">
                {error && (
                  <div className="error-message">{error}</div>
                )}
                
                <div className={`package-status-banner status-${status}`}>
                  <h3>Status: {status.charAt(0).toUpperCase() + status.slice(1)}</h3>
                </div>
              
                <div className="package-details-section">
                  <h3>Package Information</h3>
                  <div className="details-grid">
                    <div className="detail-item">
                      <span className="label">Description:</span>
                      <span>{selectedPackage.packageDescription || 'No description available'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Weight:</span>
                      <span>{selectedPackage.weight ? `${selectedPackage.weight} kg` : 'Not specified'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Dimensions:</span>
                      <span>
                        {selectedPackage.dimensions ? `${selectedPackage.dimensions} cm` : 'Not specified'}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Priority:</span>
                      <span className={`priority-tag ${selectedPackage.priority || 'normal'}`}>
                        {(selectedPackage.priority || 'normal').charAt(0).toUpperCase() + (selectedPackage.priority || 'normal').slice(1)}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Tracking Number:</span>
                      <span>{selectedPackage.trackingNumber || 'Not available'}</span>
                    </div>
                    {selectedPackage.codAmount > 0 && (
                      <div className="detail-item cod-amount">
                        <span className="label">Cash on Delivery:</span>
                        <span className="money-value">${parseFloat(selectedPackage.codAmount).toFixed(2)}</span>
                        <div className="payment-status-badge">
                          {selectedPackage.isPaid ? (
                            <span className="status-paid">PAID</span>
                          ) : (
                            <span className="status-collect">COLLECT FROM CUSTOMER</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="package-details-section">
                  <h3>Pickup Information</h3>
                  <div className="details-grid">
                    <div className="detail-item">
                      <span className="label">Contact Name:</span>
                      <span>{selectedPackage.pickupContactName || 'Not available'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Contact Phone:</span>
                      <span>{selectedPackage.pickupContactPhone || 'Not available'}</span>
                    </div>
                    <div className="detail-item full-width">
                      <span className="label">Address:</span>
                      <span>{selectedPackage.pickupAddress || 'Address Not Available'}</span>
                    </div>
                    <div className="detail-item full-width">
                      <span className="label">Instructions:</span>
                      <span>{selectedPackage.pickupAddress?.instructions || 'No special instructions'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Scheduled Pickup:</span>
                      <span>{formatDate(selectedPackage.schedulePickupTime)}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Actual Pickup:</span>
                      <span>{formatDate(selectedPackage.actualPickupTime)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="package-details-section">
                  <h3>Delivery Information</h3>
                  <div className="details-grid">
                    <div className="detail-item">
                      <span className="label">Contact Name:</span>
                      <span>{selectedPackage.deliveryContactName || 'Not available'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Contact Phone:</span>
                      <span>{selectedPackage.deliveryContactPhone || 'Not available'}</span>
                    </div>
                    <div className="detail-item full-width">
                      <span className="label">Address:</span>
                      <span> {selectedPackage.deliveryAddress || 'Address Not Available'}</span>
                    </div>
                    <div className="detail-item full-width">
                      <span className="label">Instructions:</span>
                      <span>{selectedPackage.deliveryAddress?.instructions || 'No special instructions'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Estimated Delivery:</span>
                      <span>{formatDate(selectedPackage.estimatedDeliveryTime)}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Actual Delivery:</span>
                      <span>{formatDate(selectedPackage.actualDeliveryTime)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="package-details-section">
                  <h3>Additional Notes</h3>
                  <p className="package-notes">{selectedPackage.notes || 'No additional notes'}</p>
                </div>
              </div>
              
              <div className="modal-footer">
                {selectedPackage.status === 'assigned' && (
                  <button 
                    className="action-button primary" 
                    onClick={() => {
                      updatePackageStatus(selectedPackage.id, 'pickedup');
                      setShowPackageDetails(false);
                    }}
                  >
                    Mark as Picked Up
                  </button>
                )}
                {selectedPackage.status === 'pickedup' && (
                  <button 
                    className="action-button primary" 
                    onClick={() => {
                      updatePackageStatus(selectedPackage.id, 'in-transit');
                      setShowPackageDetails(false);
                    }}
                  >
                    Mark In Transit
                  </button>
                )}
                {selectedPackage.status === 'in-transit' && (
                  <>
                    {selectedPackage.codAmount > 0 && !selectedPackage.isPaid ? (
                      <button 
                        className="action-button primary collect-payment" 
                        onClick={() => {
                          markAsDeliveredWithPayment(selectedPackage.id);
                        }}
                      >
                        <FontAwesomeIcon icon={faDollarSign} /> Deliver & Collect ${parseFloat(selectedPackage.codAmount || 0).toFixed(2)}
                      </button>
                    ) : (
                      <button 
                        className="action-button primary" 
                        onClick={() => {
                          updatePackageStatus(selectedPackage.id, 'delivered');
                          setShowPackageDetails(false);
                        }}
                      >
                        Mark as Delivered
                      </button>
                    )}
                  </>
                )}
                <button 
                  className="action-button secondary" 
                  onClick={() => setShowPackageDetails(false)}
                >
                  Close
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-sidebar">
        <div className="sidebar-header">
          <h2>Droppin</h2>
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
                            <strong>Pickup:</strong> {pkg.pickupAddress}
                          </div>
                          <div className="delivery">
                            <strong>Delivery:</strong> {pkg.deliveryAddress}
                          </div>
                        </div>
                      </div>
                      <div className="package-actions">
                        <div className={`package-status status-${pkg.status}`}>
                          {pkg.status.charAt(0).toUpperCase() + pkg.status.slice(1)}
                        </div>
                        <button 
                          className="action-button view-details" 
                          onClick={() => viewPackageDetails(pkg)}
                        >
                          View Details
                        </button>
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
                        className="action-button view-details" 
                        onClick={() => viewPackageDetails(pkg)}
                      >
                        View Details
                      </button>
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
      {showPackageDetails && renderPackageDetailsModal()}
    </div>
  );
};

export default DriverDashboard;
