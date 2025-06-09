import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { packageService, driverService } from '../../services/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDollarSign, faBox, faTruck, faMapMarkedAlt, faEye } from '@fortawesome/free-solid-svg-icons';
import './DriverDashboard.css';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
ChartJS.register(ArcElement, Tooltip, Legend);

// Create a memoized search input component
const SearchInput = React.memo(({ value, onChange, placeholder }) => (
  <div className="search-bar">
    <input
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={onChange}
    />
  </div>
));

// Create a separate MyPackagesPage component
const MyPackagesPage = ({ openPackageDetailsModal }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('current');
  const { packages, loading, error, getStatusBadge } = useDriverPackages();

  // Handle search with debounce
  const handleSearchChange = useCallback((e) => {
    setSearchQuery(e.target.value || '');
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery || '');
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Filter packages based on search and active tab
  const getFilteredPackages = useCallback(() => {
    if (!packages) return [];
    
    return packages.filter(pkg => {
      // First check if the package matches the active tab
      if (activeTab === 'current' && !['assigned', 'pickedup', 'in-transit'].includes(pkg.status)) return false;
      if (activeTab === 'past' && !['delivered', 'cancelled', 'returned'].includes(pkg.status)) return false;
      if (activeTab === 'delivered' && pkg.status !== 'delivered') return false;
      if (activeTab === 'cancelled' && pkg.status !== 'cancelled') return false;
      
      // If there's no search query, return all packages for the active tab
      const searchTerm = (debouncedSearchQuery || '').trim().toLowerCase();
      if (!searchTerm) return true;
      
      // Search in all relevant fields including status
      return (
        (pkg.trackingNumber || '').toLowerCase().includes(searchTerm) ||
        (pkg.packageDescription || '').toLowerCase().includes(searchTerm) ||
        (pkg.deliveryAddress || '').toLowerCase().includes(searchTerm) ||
        (pkg.status || '').toLowerCase().includes(searchTerm)
      );
    });
  }, [packages, activeTab, debouncedSearchQuery]);

  return (
    <div className="packages-section">
      <h2>My Packages</h2>
      {/* Package Categories Tabs */}
      <div className="package-tabs">
        <button className={`tab-btn ${activeTab === 'current' ? 'active' : ''}`} onClick={() => setActiveTab('current')}>Current Packages</button>
        <button className={`tab-btn ${activeTab === 'past' ? 'active' : ''}`} onClick={() => setActiveTab('past')}>Past Packages</button>
        <button className={`tab-btn ${activeTab === 'delivered' ? 'active' : ''}`} onClick={() => setActiveTab('delivered')}>Delivered</button>
        <button className={`tab-btn ${activeTab === 'cancelled' ? 'active' : ''}`} onClick={() => setActiveTab('cancelled')}>Cancelled</button>
        <button className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>All Packages</button>
      </div>
      
      {/* Search Bar */}
      <div className="search-bar">
        <input
          type="text"
          placeholder="Search by tracking number, description, address, or status..."
          value={searchQuery}
          onChange={handleSearchChange}
        />
      </div>

      {/* Packages List */}
      <div className="packages-list">
        {loading ? (
          <div className="loading">Loading packages...</div>
        ) : error ? (
          <div className="error">{error}</div>
        ) : getFilteredPackages().length === 0 ? (
          <div className="no-packages">No packages found</div>
        ) : (
          <table className="packages-table">
            <thead>
              <tr>
                <th>Tracking #</th>
                <th>Description</th>
                <th>Status</th>
                <th>Delivery Address</th>
                <th>COD Amount</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {getFilteredPackages().map(pkg => (
                <tr key={pkg.id}>
                  <td>{pkg.trackingNumber}</td>
                  <td>{pkg.packageDescription}</td>
                  <td>{getStatusBadge(pkg.status)}</td>
                  <td>{pkg.deliveryAddress}</td>
                  <td>${parseFloat(pkg.codAmount || 0).toFixed(2)}</td>
                  <td>
                    <button 
                      className="action-btn view-btn"
                      onClick={() => openPackageDetailsModal(pkg)}
                      title="View Details"
                    >
                      <FontAwesomeIcon icon={faEye} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

// Custom hook to manage packages data
const useDriverPackages = () => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        setLoading(true);
        const response = await packageService.getPackages();
        const packagesList = Array.isArray(response.data) ? response.data : 
                           (response.data.packages || []);
        setPackages(packagesList);
      } catch (err) {
        setError('Failed to load packages. Please try again later.');
        console.error('Error fetching packages:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPackages();
  }, []);

  const getStatusBadge = (status) => (
    <span className={`status-badge status-${status}`}>
      {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
    </span>
  );

  return {
    packages,
    loading,
    error,
    getStatusBadge
  };
};

const DriverDashboard = () => {
  const { currentUser, logout } = useAuth();
  const [packages, setPackages] = useState([]);
  const [availablePackages, setAvailablePackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [showPackageDetails, setShowPackageDetails] = useState(false);
  const [driverStats, setDriverStats] = useState(null);
  const [activeTab, setActiveTab] = useState('current');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentSearch, setCurrentSearch] = useState('');
  const [debouncedCurrentSearch, setDebouncedCurrentSearch] = useState('');
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  // Define package categories
  const packageCategories = {
    current: ['assigned', 'pickedup', 'in-transit'],
    past: ['delivered', 'cancelled', 'returned'],
    delivered: ['delivered'],
    cancelled: ['cancelled'],
    all: ['assigned', 'pickedup', 'in-transit', 'delivered', 'cancelled', 'returned']
  };

  useEffect(() => {
    // Fetch packages assigned to this driver
    const fetchPackages = async () => {
      try {
        setLoading(true);
        // Fetch all packages for this driver
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

    // Fetch driver stats
    const fetchDriverStats = async () => {
      try {
        const res = await driverService.getDriverProfile();
        setDriverStats(res.data);
      } catch (err) {
        setDriverStats(null);
      }
    };

    fetchPackages();
    fetchDriverStats();
  }, []);

  // Move search handling to parent component and memoize it
  const handleSearchChange = useCallback((e) => {
    setSearchQuery(e.target.value || '');
  }, []); // Empty dependency array since setSearchQuery is stable

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery || ''); // Ensure it's always a string
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Modify getFilteredPackages to include status filter
  const getFilteredPackages = useCallback(() => {
    let filtered = packages;
    
    // Filter by category
    if (activeTab !== 'all') {
      filtered = filtered.filter(pkg => packageCategories[activeTab].includes(pkg.status));
    }
    
    // Filter by status if not 'all'
    if (statusFilter !== 'all') {
      filtered = filtered.filter(pkg => pkg.status === statusFilter);
    }
    
    // Filter by search query
    if (debouncedSearchQuery.trim()) {
      const query = debouncedSearchQuery.toLowerCase().trim();
      filtered = filtered.filter(pkg => 
        pkg.trackingNumber?.toLowerCase().includes(query) ||
        pkg.packageDescription?.toLowerCase().includes(query) ||
        pkg.deliveryContactName?.toLowerCase().includes(query) ||
        pkg.deliveryAddress?.toLowerCase().includes(query) ||
        pkg.status?.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [packages, activeTab, statusFilter, debouncedSearchQuery]);

  // Add debounced search for current packages
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedCurrentSearch(currentSearch || '');
    }, 300);
    return () => clearTimeout(timer);
  }, [currentSearch]);

  // Update the current packages filtering
  const getCurrentPackages = useCallback(() => {
    if (!packages) return [];
    
    return packages.filter(pkg => {
      // First check if the package is in current status
      if (!packageCategories.current.includes(pkg.status)) return false;
      
      // If there's no search query, return all current packages
      const searchTerm = (debouncedCurrentSearch || '').trim().toLowerCase();
      if (!searchTerm) return true;
      
      // Search in all relevant fields including status
      return (
        (pkg.trackingNumber || '').toLowerCase().includes(searchTerm) ||
        (pkg.packageDescription || '').toLowerCase().includes(searchTerm) ||
        (pkg.deliveryAddress || '').toLowerCase().includes(searchTerm) ||
        (pkg.status || '').toLowerCase().includes(searchTerm)
      );
    });
  }, [packages, debouncedCurrentSearch]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Function to open package details modal with full package information
  const openPackageDetailsModal = async (pkg) => {
    setModalLoading(true);
    setModalError(null);
    setSelectedPackage(pkg);
    setIsModalOpen(true);
    
    try {
      // Fetch complete package details from the server
      const response = await packageService.getPackageById(pkg.id);
      if (response && response.data) {
        setSelectedPackage(response.data);
      } else {
        // If no detailed data is returned, keep the basic package data
        setSelectedPackage(pkg);
      }
    } catch (err) {
      console.error('Error fetching package details:', err);
      setModalError('Could not fetch complete package details. Some information may be missing.');
      // Keep the basic package data even if detailed fetch fails
      setSelectedPackage(pkg);
    } finally {
      setModalLoading(false);
    }
  };

  // Function to close modal and reset state
  const closePackageDetailsModal = () => {
    setIsModalOpen(false);
    setSelectedPackage(null);
    setModalError(null);
    setModalLoading(false);
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
  
  // Stats calculation (from driverStats)
  const assignedToday = driverStats?.assignedToday || 0;
  const totalAssigned = driverStats?.totalAssigned || 0;
  const totalDelivered = driverStats?.totalDeliveries || 0;
  const totalCancelled = driverStats?.totalCancelled || 0;
  const activeAssign = driverStats?.activeAssign || 0;

  // Prepare chart data
  const chartData = {
    labels: ['Active Assigned', 'Delivered', 'Cancelled'],
    datasets: [
      {
        data: [activeAssign, totalDelivered, totalCancelled],
        backgroundColor: ['#ffd700', '#43a047', '#e53935'],
        borderColor: ['#ffd700', '#43a047', '#e53935'],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          boxWidth: 12,
          padding: 8,
          font: {
            size: 11
          }
        }
      }
    }
  };

  // Add this helper function inside the DriverDashboard component, before the return statement
  const getStatusBadge = (status) => (
    <span className={`status-badge status-${status}`}>
      {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
    </span>
  );

  // Helper to get next status for a package
  const getNextStatus = (status) => {
    switch (status) {
      case 'assigned':
        return { next: 'pickedup', label: 'Mark as Picked Up' };
      case 'pickedup':
        return { next: 'in-transit', label: 'Mark In Transit' };
      case 'in-transit':
        return { next: 'delivered', label: 'Mark as Delivered' };
      default:
        return null;
    }
  };

  // 1. Create a new MyPackages component for the full package list
  const MyPackages = React.memo(({ packages, loading, error, getStatusBadge, searchQuery, handleSearchChange, activeTab, setActiveTab, getFilteredPackages }) => (
    <div className="bg-white rounded-lg shadow p-6">
      <h2>My Packages</h2>
      {/* Package Categories Tabs */}
      <div className="package-tabs">
        <button className={`tab-btn ${activeTab === 'current' ? 'active' : ''}`} onClick={() => setActiveTab('current')}>Current Packages</button>
        <button className={`tab-btn ${activeTab === 'past' ? 'active' : ''}`} onClick={() => setActiveTab('past')}>Past Packages</button>
        <button className={`tab-btn ${activeTab === 'delivered' ? 'active' : ''}`} onClick={() => setActiveTab('delivered')}>Delivered</button>
        <button className={`tab-btn ${activeTab === 'cancelled' ? 'active' : ''}`} onClick={() => setActiveTab('cancelled')}>Cancelled</button>
        <button className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>All Packages</button>
      </div>
      
      {/* Search Bar */}
      <SearchInput
        value={searchQuery}
        onChange={handleSearchChange}
        placeholder="Search by tracking number, description, address, or status..."
      />

      {/* Packages List */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tracking #</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Delivery Address</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">COD Amount</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {getFilteredPackages().map((pkg) => (
              <tr key={pkg.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{pkg.trackingNumber}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{pkg.packageDescription}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{getStatusBadge(pkg.status)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{pkg.deliveryAddress}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">${parseFloat(pkg.codAmount || 0).toFixed(2)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button 
                    className="action-btn view-btn"
                    onClick={() => {
                      openPackageDetailsModal(pkg);
                    }}
                    title="View Details"
                  >
                    <FontAwesomeIcon icon={faEye} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  ));

  const PackageDetailsModal = () => {
    if (!isModalOpen || !selectedPackage) return null;

    return (
      <div className={`modal-overlay ${isModalOpen ? 'show' : ''}`} onClick={closePackageDetailsModal}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h2>
              <FontAwesomeIcon icon={faBox} /> Package #{selectedPackage.trackingNumber}
            </h2>
            <button
              onClick={closePackageDetailsModal}
              className="close-btn"
            >
              ×
            </button>
          </div>

          <div className="modal-body">
            {modalLoading ? (
              <div className="loading-state">
                <div className="loading-spinner"></div>
                <p>Loading package details...</p>
              </div>
            ) : modalError ? (
              <div className="error-message">{modalError}</div>
            ) : (
              <div className="package-details-section">
                {/* Status Badge */}
                <div className={`package-status-banner status-${selectedPackage.status}`}>
                  <h3>Status: {selectedPackage.status?.charAt(0).toUpperCase() + selectedPackage.status?.slice(1)}</h3>
                </div>

                {/* Basic Package Information */}
                <div className="details-grid">
                  <div className="detail-item">
                    <span className="label">Tracking Number</span>
                    <span>{selectedPackage.trackingNumber}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Created Date</span>
                    <span>{formatDate(selectedPackage.createdAt)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Payment Status</span>
                    <span className={`payment-status ${selectedPackage.isPaid ? 'paid' : 'unpaid'}`}>
                      {selectedPackage.isPaid ? 'Paid' : 'Unpaid'}
                    </span>
                  </div>
                </div>

                {/* Package Description */}
                <div className="detail-item full-width">
                  <span className="label">Description</span>
                  <span>{selectedPackage.packageDescription || 'No description'}</span>
                </div>

                {/* Package Dimensions and Weight */}
                <div className="details-grid">
                  <div className="detail-item">
                    <span className="label">Weight</span>
                    <span>{selectedPackage.weight ? `${selectedPackage.weight} kg` : 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Dimensions</span>
                    <span>{selectedPackage.dimensions || 'N/A'}</span>
                  </div>
                </div>

                {/* Delivery Details */}
                <div className="detail-item full-width">
                  <span className="label">Delivery Details</span>
                  <div className="details-grid">
                    <div className="detail-item">
                      <span className="label">Contact Name</span>
                      <span>{selectedPackage.deliveryContactName || 'N/A'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Contact Phone</span>
                      <span>{selectedPackage.deliveryContactPhone || 'N/A'}</span>
                    </div>
                    <div className="detail-item full-width">
                      <span className="label">Delivery Address</span>
                      <span>{selectedPackage.deliveryAddress || 'N/A'}</span>
                    </div>
                    {selectedPackage.estimatedDeliveryTime && (
                      <div className="detail-item">
                        <span className="label">Estimated Delivery Time</span>
                        <span>{formatDate(selectedPackage.estimatedDeliveryTime)}</span>
                      </div>
                    )}
                    {selectedPackage.actualDeliveryTime && (
                      <div className="detail-item">
                        <span className="label">Actual Delivery Time</span>
                        <span>{formatDate(selectedPackage.actualDeliveryTime)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Financial Information */}
                <div className="detail-item full-width">
                  <span className="label">Financial Information</span>
                  <div className="details-grid">
                    <div className="detail-item">
                      <span className="label">COD Amount</span>
                      <span>${parseFloat(selectedPackage.codAmount || 0).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Shop Information */}
                {selectedPackage.shop && (
                  <div className="detail-item full-width">
                    <span className="label">Shop Information</span>
                    <div className="details-grid">
                      <div className="detail-item">
                        <span className="label">Shop Name</span>
                        <span>{selectedPackage.shop.name || 'N/A'}</span>
                      </div>
                      <div className="detail-item">
                        <span className="label">Shop Phone</span>
                        <span>{selectedPackage.shop.phone || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="dashboard-container">
        <div className="dashboard-sidebar">
          <div className="sidebar-header">
            <h2>Droppin</h2>
            <p>Driver Portal</p>
          </div>
          <div className="sidebar-menu">
            <Link to="/driver" className={`menu-item${window.location.pathname === '/driver' ? ' active' : ''}`}> <i className="menu-icon">📊</i> Dashboard </Link>
            <Link to="/driver/assigned" className={`menu-item${window.location.pathname.startsWith('/driver/assigned') ? ' active' : ''}`}> <i className="menu-icon">📦</i> My Packages </Link>
            <Link to="/driver/profile" className={`menu-item${window.location.pathname === '/driver/profile' ? ' active' : ''}`}> <i className="menu-icon">👤</i> Profile </Link>
          </div>
        </div>
        <div className="dashboard-content">
          <Routes>
            {/* Dashboard Home: stats and current packages only */}
            <Route path="/" element={
              <>
                <div className="dashboard-header">
                  <div className="welcome-message">
                    <h1>Welcome, {currentUser?.name || 'Driver'}</h1>
                    <p>Here are your delivery stats</p>
                  </div>
                  <div className="user-info">
                    <span className="driver-status">Status: {currentUser?.isAvailable ? 'Available' : 'Busy'}</span>
                    <span className="user-role">Driver Account</span>
                  </div>
                </div>
                <div className="dashboard-stats-container">
                  <div className="stats-and-chart-row">
                    <div className="dashboard-stats package-stats">
                      <div className="stat-card"><div className="stat-value">{assignedToday}</div><div className="stat-label">Assigned Today</div></div>
                      <div className="stat-card"><div className="stat-value">{totalAssigned}</div><div className="stat-label">Total Assigned</div></div>
                      <div className="stat-card"><div className="stat-value">{totalDelivered}</div><div className="stat-label">Total Delivered</div></div>
                      <div className="stat-card"><div className="stat-value">{totalCancelled}</div><div className="stat-label">Total Cancelled</div></div>
                    </div>
                    <div className="chart-container">
                      <h3>Package Distribution</h3>
                      <div className="chart-wrapper"><Pie data={chartData} options={chartOptions} /></div>
                    </div>
                  </div>
                </div>
                {/* Current Packages List (assigned, pickedup, in-transit) */}
                <div className="dashboard-main">
                  <div className="packages-section">
                    <h2>Current Packages</h2>
                    {/* Search Bar for current packages */}
                    <div className="search-bar">
                      <input
                        type="text"
                        placeholder="Search by tracking number, description, address, or status..."
                        value={currentSearch}
                        onChange={e => setCurrentSearch(e.target.value)}
                      />
                    </div>
                    <div className="packages-list">
                      {loading ? (
                        <div className="loading">Loading packages...</div>
                      ) : error ? (
                        <div className="error">{error}</div>
                      ) : getCurrentPackages().length === 0 ? (
                        <div className="no-packages">No current packages</div>
                      ) : (
                        <table className="packages-table">
                          <thead>
                            <tr>
                              <th>Tracking #</th>
                              <th>Description</th>
                              <th>Status</th>
                              <th>Delivery Address</th>
                              <th>COD Amount</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {getCurrentPackages().map(pkg => {
                              const nextStep = getNextStatus(pkg.status);
                              return (
                                <tr key={pkg.id}>
                                  <td>{pkg.trackingNumber}</td>
                                  <td>{pkg.packageDescription}</td>
                                  <td>{getStatusBadge(pkg.status)}</td>
                                  <td>{pkg.deliveryAddress}</td>
                                  <td>${parseFloat(pkg.codAmount || 0).toFixed(2)}</td>
                                  <td style={{ display: 'flex', gap: '0.5rem' }}>
                                    {nextStep && (
                                      <button 
                                        className="action-button primary"
                                        style={{ padding: '0.4rem 0.5rem', minWidth: 0 }}
                                        title={nextStep.label}
                                        onClick={() => updatePackageStatus(pkg.id, nextStep.next)}
                                      >
                                        {nextStep.label}
                                      </button>
                                    )}
                                    <button 
                                      className="action-btn view-btn"
                                      onClick={() => {
                                        openPackageDetailsModal(pkg);
                                      }}
                                      title="View Details"
                                    >
                                      <FontAwesomeIcon icon={faEye} />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                </div>
              </>
            } />
            {/* My Packages: full categorized/searchable list */}
            <Route path="/assigned" element={<MyPackagesPage openPackageDetailsModal={openPackageDetailsModal} />} />
          </Routes>
        </div>
      </div>
      <PackageDetailsModal />
    </div>
  );
};

// Helper function for status colors
const getStatusColor = (status) => {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'assigned':
      return 'bg-blue-100 text-blue-800';
    case 'picked_up':
      return 'bg-purple-100 text-purple-800';
    case 'in_transit':
      return 'bg-indigo-100 text-indigo-800';
    case 'delivered':
      return 'bg-green-100 text-green-800';
    case 'cancelled':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export default DriverDashboard;
