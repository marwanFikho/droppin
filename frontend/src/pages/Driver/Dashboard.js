import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { packageService, driverService } from '../../services/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faBox,
  faTruck, 
  faMapMarkedAlt, 
  faEye,
  faUser,
  faSignOutAlt,
  faSearch,
  faCheck,
  faTimes,
  faClock,
  faMapMarkerAlt,
  faPhone,
  faEnvelope,
  faWeightHanging,
  faRulerCombined,
  faMoneyBillWave,
  faCalendarAlt,
  faInfoCircle,
  faIdCard,
  faCar,
  faMotorcycle,
  faBicycle,
  faVanShuttle,
  faTruck as faTruckIcon,
  faStar,
  faMapPin,
  faEdit
} from '@fortawesome/free-solid-svg-icons';
import './DriverDashboard.css';
import { Pie, Doughnut } from 'react-chartjs-2';
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

// Add this helper function near the top of the file or above MyPackages
const getStatusColorHex = (status) => {
  switch (status) {
    case 'assigned':
      return '#ff8c00'; // orange
    case 'pickedup':
      return '#ffd600'; // yellow
    case 'in-transit':
      return '#ff9800'; // orange
    case 'delivered':
      return '#43a047'; // green
    case 'cancelled':
      return '#dc3545'; // red
    default:
      return '#bdbdbd'; // gray
  }
};

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
      // Exclude pending return packages from driver view
      if (pkg.status === 'return-pending') return false;
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
                  <td data-label="Tracking #">{pkg.trackingNumber}</td>
                  <td data-label="Description">{pkg.packageDescription}</td>
                  <td data-label="Status">{getStatusBadge(pkg.status)}</td>
                  <td data-label="Delivery Address">
                    <div>{pkg.deliveryAddress}</div>
                    {(pkg.deliveryContactName || pkg.deliveryContactPhone) && (
                      <div style={{ fontSize: 12, color: '#555', marginTop: 4 }}>
                        {pkg.deliveryContactName || 'N/A'}{pkg.deliveryContactPhone ? ` · ${pkg.deliveryContactPhone}` : ''}
                      </div>
                    )}
                  </td>
                  <td data-label="COD Amount">EGP {parseFloat(pkg.codAmount || 0).toFixed(2)}</td>
                  <td data-label="Actions">
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [driverStats, setDriverStats] = useState(null);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('current');
  const [currentSearch, setCurrentSearch] = useState('');
  const [debouncedCurrentSearch, setDebouncedCurrentSearch] = useState('');
  const [activeView, setActiveView] = useState('dashboard'); // 'dashboard' or 'profile'
  const [profileData, setProfileData] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState(null);
  const [showAvailabilityDialog, setShowAvailabilityDialog] = useState(false);
  const [pendingAvailability, setPendingAvailability] = useState(null);
  const [editingNotes, setEditingNotes] = useState('');
  const [notesSaving, setNotesSaving] = useState(false);
  const [notesError, setNotesError] = useState(null);
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
    } catch (err) {
      setError('Failed to accept package. Please try again.');
      console.error('Error accepting package:', err);
    }
  };

  const updatePackageStatus = async (packageId, status, additionalData = {}) => {
    try {
      let data = { status, ...additionalData };
      // Remove timestamp sending - backend will handle Cairo timezone automatically
      await packageService.updatePackageStatus(packageId, data);
      // Refresh data
      const assignedResponse = await packageService.getPackages();
      const packagesData = assignedResponse.data.packages || assignedResponse.data || [];
      setPackages(packagesData);
      // If we had a selected package and it was updated, close the modal
      if (selectedPackage && selectedPackage.id === packageId) {
        setIsModalOpen(false);
      }
    } catch (err) {
      setError(`Failed to update package to ${status}. Please try again.`);
      console.error('Error updating package:', err);
    }
  };

  // Partial/Complete delivery modal state
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [deliveryModalPackage, setDeliveryModalPackage] = useState(null);
  const [deliveredQuantities, setDeliveredQuantities] = useState({});
  const [isPartial, setIsPartial] = useState(false);
  const [showDriverRejectModal, setShowDriverRejectModal] = useState(false);
  const [driverRejectAmount, setDriverRejectAmount] = useState('');
  const [driverRejectPaymentMethod, setDriverRejectPaymentMethod] = useState('CASH');

  const handleMarkDelivered = async (pkg) => {
    // open modal, load latest items (selectedPackage already fetches details, but ensure items are present)
    setDeliveryModalPackage(pkg);
    setIsPartial(false);
    setDeliveredQuantities({});
    setShowDeliveryModal(true);
  };

  const handleConfirmDelivery = async () => {
    if (!deliveryModalPackage) return;
    const packageId = deliveryModalPackage.id;
    if (!isPartial) {
      await updatePackageStatus(packageId, 'delivered');
      setShowDeliveryModal(false);
      return;
    }
    // Build deliveredItems from quantities > 0
    const items = Array.isArray(deliveryModalPackage.Items) ? deliveryModalPackage.Items : [];
    const deliveredItems = items
      .map(it => {
        const qty = parseInt(deliveredQuantities[it.id], 10) || 0;
        return qty > 0 ? { itemId: it.id, deliveredQuantity: Math.min(qty, parseInt(it.quantity, 10) || 0) } : null;
      })
      .filter(Boolean);
    await updatePackageStatus(packageId, 'delivered-awaiting-return', { deliveredItems });
    setShowDeliveryModal(false);
  };
  
  // Mark package as delivered and handle payment collection
  const markAsDeliveredWithPayment = async (packageId) => {
    try {
      // Update package status to delivered with payment collected
      await updatePackageStatus(packageId, 'delivered', { 
        isPaid: true,
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

  const openDriverRejectModal = (pkg) => {
    setSelectedPackage(pkg);
    setDriverRejectAmount('');
    setDriverRejectPaymentMethod('CASH');
    setShowDriverRejectModal(true);
  };

  const confirmDriverReject = async () => {
    if (!selectedPackage) return;
    const deliveryCost = parseFloat(selectedPackage.deliveryCost || 0) || 0;
    const raw = driverRejectAmount !== '' ? parseFloat(driverRejectAmount) : 0;
    const amount = Math.max(0, Math.min(raw, deliveryCost));
    await updatePackageStatus(selectedPackage.id, 'rejected-awaiting-return', {
      rejectionShippingPaidAmount: amount,
      paymentMethod: driverRejectPaymentMethod
    });
    setShowDriverRejectModal(false);
    setSelectedPackage(null);
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
  const getNextStatus = (status, type) => {
    if (type === 'return' || (status && status.startsWith('return-'))) {
      switch (status) {
        case 'assigned':
        case 'return-requested':
          return { next: 'return-in-transit', label: 'Mark Return Picked Up' };
        case 'return-in-transit':
          return { next: 'return-pending', label: 'Mark Return Picked Up' };
        default:
          return null;
      }
    }
    if (type === 'exchange' || (status && status.startsWith('exchange-'))) {
      switch (status) {
        case 'exchange-awaiting-pickup':
          return { next: 'exchange-in-transit', label: 'Mark Exchange Picked Up' };
        case 'exchange-in-transit':
          return { next: 'exchange-awaiting-return', label: 'Mark Exchange Awaiting Return' };
        case 'exchange-awaiting-return':
          return { next: 'exchange-returned', label: 'Mark Exchange Completed' };
        default:
          return null;
      }
    }
    switch (status) {
      case 'assigned': return { next: 'pickedup', label: 'Mark as Picked Up' };
      case 'pickedup': return { next: 'in-transit', label: 'Mark In Transit' };
      case 'in-transit': return { next: 'delivered', label: 'Mark as Delivered' };
      default: return null;
    }
  };

  // 1. Create a new MyPackages component for the full package list
  const MyPackages = React.memo(({ packages, loading, error, getStatusBadge, searchQuery, handleSearchChange, activeTab, setActiveTab, getFilteredPackages, updatePackageStatus }) => (
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status Actions</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {getFilteredPackages().map((pkg) => {
              const nextStatus = getNextStatus(pkg.status, pkg.type);
              const currentColor = getStatusColorHex(pkg.status);
              const nextColor = nextStatus ? getStatusColorHex(nextStatus.next) : '#bdbdbd';
              const gradient = `linear-gradient(90deg, ${currentColor} 0%, ${nextColor} 100%)`;
              return (
              <tr key={pkg.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{pkg.trackingNumber}{pkg.type === 'return' && (<span style={{ marginLeft: 6, padding: '2px 6px', fontSize: 11, borderRadius: 10, background: '#ffe8cc', color: '#b45309' }}>Return</span>)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{pkg.packageDescription}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{getStatusBadge(pkg.status)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div>{pkg.deliveryAddress}</div>
                  {(pkg.deliveryContactName || pkg.deliveryContactPhone) && (
                    <div style={{ fontSize: 12, color: '#555', marginTop: 4 }}>
                      {pkg.deliveryContactName || 'N/A'}{pkg.deliveryContactPhone ? ` · ${pkg.deliveryContactPhone}` : ''}
                    </div>
                  )}
                  {pkg.status === 'return-in-transit' && Array.isArray(pkg.returnDetails) && pkg.returnDetails.length > 0 && (
                    <div style={{ marginTop: 6 }}>
                      <div style={{ fontSize: 12, color: '#555' }}>Returned Items ({pkg.returnDetails.length})</div>
                      <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
                        {pkg.returnDetails.map((it, idx) => (
                          <li key={idx} style={{ fontSize: 12, color: '#555' }}>
                            {(it.description || '-') + ' x ' + (parseInt(it.quantity) || 0)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">EGP {parseFloat(pkg.codAmount || 0).toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {nextStatus ? (
                      <button
                        className={`btn-primary`}
                        style={{ background: gradient, color: pkg.status === 'pickedup' ? '#333' : '#fff', border: 'none' }}
                        onClick={() => {
                          if (nextStatus.next === 'delivered') {
                            handleMarkDelivered(pkg);
                          } else {
                            updatePackageStatus(pkg.id, nextStatus.next);
                          }
                        }}
                        title={nextStatus.label}
                      >
                        {nextStatus ? nextStatus.label : 'No actions available'}
                      </button>
                    ) : (
                      <span className="text-gray-400">No actions available</span>
                    )}
                  </td>
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
              );
            })}
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
                    <span>{selectedPackage.createdAt}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Pickedup Time</span>
                    <span>{selectedPackage.actualPickupTime ? selectedPackage.actualPickupTime : 'Not pickedup yet'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Payment Status</span>
                    <span className={`payment-status ${selectedPackage.isPaid ? 'paid' : 'unpaid'}`}>
                      {selectedPackage.isPaid ? 'Paid' : 'Unpaid'}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Delivery Cost</span>
                    <span>EGP {parseFloat(selectedPackage.deliveryCost || 0).toFixed(2)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Number of Items</span>
                    <span>{selectedPackage.itemsNo ?? '-'}</span>
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
                    <div className="detail-item">
                      <span className="label">Delivery Time</span>
                      <span>{selectedPackage.actualDeliveryTime ? selectedPackage.actualDeliveryTime : 'Not delivered yet'}</span>
                    </div>
                  </div>
                </div>

                {/* Financial Information */}
                <div className="detail-item full-width">
                  <span className="label">Financial Information</span>
                  <div className="details-grid">
                    <div className="detail-item">
                      <span className="label">COD Amount</span>
                      <span>EGP {parseFloat(selectedPackage.codAmount || 0).toFixed(2)}</span>
                    </div>
                    {selectedPackage.rejectionShippingPaidAmount !== undefined && selectedPackage.rejectionShippingPaidAmount !== null && (
                      <div className="detail-item">
                        <span className="label">Rejection Shipping Fees Paid</span>
                        <span>EGP {parseFloat(selectedPackage.rejectionShippingPaidAmount || 0).toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Exchange Details */}
                {(selectedPackage.type === 'exchange' || (selectedPackage.status || '').startsWith('exchange-')) && selectedPackage.exchangeDetails && (
                  <div className="detail-item full-width">
                    <span className="label">Exchange Details</span>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                      <div>
                        <div style={{ fontWeight: 600, marginBottom: 6 }}>Items to take from customer</div>
                        {Array.isArray(selectedPackage.exchangeDetails.takeItems) && selectedPackage.exchangeDetails.takeItems.length > 0 ? (
                          <ul style={{ margin: 0, paddingLeft: 18 }}>
                            {selectedPackage.exchangeDetails.takeItems.map((it, idx) => (
                              <li key={`xtake-${idx}`}>{(it.description || '-')} x {(parseInt(it.quantity) || 0)}</li>
                            ))}
                          </ul>
                        ) : (
                          <div style={{ color: '#666', fontSize: 12 }}>No items</div>
                        )}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, marginBottom: 6 }}>Items to give to customer</div>
                        {Array.isArray(selectedPackage.exchangeDetails.giveItems) && selectedPackage.exchangeDetails.giveItems.length > 0 ? (
                          <ul style={{ margin: 0, paddingLeft: 18 }}>
                            {selectedPackage.exchangeDetails.giveItems.map((it, idx) => (
                              <li key={`xgive-${idx}`}>{(it.description || '-')} x {(parseInt(it.quantity) || 0)}</li>
                            ))}
                          </ul>
                        ) : (
                          <div style={{ color: '#666', fontSize: 12 }}>No items</div>
                        )}
                      </div>
                    </div>
                    {selectedPackage.exchangeDetails.cashDelta && (
                      <div style={{ marginTop: 8 }}>
                        <span style={{ fontWeight: 600 }}>Money: </span>
                        <span>
                          {(selectedPackage.exchangeDetails.cashDelta.type === 'take' ? 'Take from customer' : 'Give to customer')} · EGP {parseFloat(selectedPackage.exchangeDetails.cashDelta.amount || 0).toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                )}

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

                {/* Notes Log Section */}
                <div className="package-notes-log-section">
                  <h4>Notes Log</h4>
                  <div className="notes-log-list">
                    {(() => {
                      let notesArr = [];
                      if (Array.isArray(selectedPackage?.notes)) {
                        notesArr = selectedPackage.notes;
                      } else if (typeof selectedPackage?.notes === 'string') {
                        try {
                          notesArr = JSON.parse(selectedPackage.notes);
                        } catch {
                          notesArr = [];
                        }
                      }
                      return (notesArr.length > 0) ? (
                        notesArr.map((n, idx) => (
                          <div key={idx} className="notes-log-entry">
                            <div className="notes-log-meta">
                              <span className="notes-log-date">{new Date(n.createdAt).toLocaleString()}</span>
                            </div>
                            <div className="notes-log-text">{n.text}</div>
                          </div>
                        ))
                      ) : (
                        <div className="notes-log-empty">No notes yet.</div>
                      );
                    })()}
                  </div>
                  <textarea
                    value={editingNotes}
                    onChange={e => setEditingNotes(e.target.value)}
                    placeholder="Add a note for this package..."
                    rows={2}
                    style={{ width: '100%', marginTop: 4 }}
                  />
                  <button
                    className="add-note-btn"
                    onClick={async () => {
                      if (!editingNotes.trim()) return;
                      setNotesSaving(true);
                      setNotesError(null);
                      try {
                        const res = await packageService.updatePackageNotes(selectedPackage.id, { note: editingNotes });
                        setSelectedPackage(prev => ({ ...prev, notes: res.data.notes }));
                        setEditingNotes('');
                      } catch (err) {
                        setNotesError('Failed to save note.');
                      } finally {
                        setNotesSaving(false);
                      }
                    }}
                    disabled={notesSaving || !editingNotes.trim()}
                    style={{ marginTop: 8 }}
                  >
                    {notesSaving ? 'Saving...' : 'Add Note'}
                  </button>
                  {notesError && <div className="error-message">{notesError}</div>}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const DriverRejectModal = () => {
    if (!showDriverRejectModal || !selectedPackage) return null;
    const invalid = (driverRejectAmount === '' || isNaN(parseFloat(driverRejectAmount)) || parseFloat(driverRejectAmount) < 0);
    const max = parseFloat(selectedPackage.deliveryCost || 0) || 0;
    return (
      <div className="confirmation-overlay">
        <div className="confirmation-dialog warning-dialog">
          <h3>Reject Package</h3>
          <p>Enter the shipping fees paid by the customer and payment method.</p>
          <div style={{ margin: '12px 0' }}>
            <input
              type="number"
              step="0.01"
              min="0"
              value={driverRejectAmount}
              onChange={(e) => setDriverRejectAmount(e.target.value)}
              placeholder="Amount paid by customer (EGP)"
              style={{ width: '100%', padding: '8px', borderRadius: 6, border: '1px solid #ccc' }}
            />
            <div style={{ color: '#555', fontSize: 12, marginTop: 6 }}>Max allowed: EGP {max.toFixed(2)}</div>
            {invalid && (
              <div style={{ color: '#c62828', fontSize: 12, marginTop: 6 }}>
                Please enter a valid non-negative amount (0 allowed if none was paid).
              </div>
            )}
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', marginBottom: 6 }}>Payment Method</label>
            <select
              value={driverRejectPaymentMethod}
              onChange={(e) => setDriverRejectPaymentMethod(e.target.value)}
              style={{ width: '100%', padding: '8px', borderRadius: 6, border: '1px solid #ccc' }}
            >
              <option value="CASH">CASH</option>
              <option value="VISA">VISA</option>
            </select>
          </div>
          <div className="confirmation-buttons">
            <button className="btn-secondary" onClick={() => { setShowDriverRejectModal(false); setDriverRejectAmount(''); setDriverRejectPaymentMethod('CASH'); }}>Cancel</button>
            <button className="btn-primary danger" onClick={confirmDriverReject} disabled={invalid}>Confirm Reject</button>
          </div>
        </div>
      </div>
    );
  };

  // Driver Profile Component
  const DriverProfile = React.memo(({ driverData, loading, error, onAvailabilityChange, onRequestToggleAvailability }) => {
    const [isToggling, setIsToggling] = React.useState(false);

    const handleToggleAvailability = async () => {
      if (!driverData) return;
      if (onRequestToggleAvailability) {
        onRequestToggleAvailability(driverData.isAvailable);
      }
    };

    const getVehicleIcon = (vehicleType) => {
      switch (vehicleType) {
        case 'car': return faCar;
        case 'motorcycle': return faMotorcycle;
        case 'bicycle': return faBicycle;
        case 'van': return faVanShuttle;
        case 'truck': return faTruckIcon;
        default: return faTruck;
      }
    };

    const getVehicleTypeLabel = (vehicleType) => {
      switch (vehicleType) {
        case 'car': return 'Car';
        case 'motorcycle': return 'Motorcycle';
        case 'bicycle': return 'Bicycle';
        case 'van': return 'Van';
        case 'truck': return 'Truck';
        default: return vehicleType;
      }
    };

    if (loading) {
  return (
        <div className="profile-section">
          <div className="loading">Loading profile...</div>
          </div>
      );
    }

    if (error) {
      return (
        <div className="profile-section">
          <div className="error">{error}</div>
          </div>
      );
    }

    if (!driverData) {
      return (
        <div className="profile-section">
          <div className="error">No profile data available</div>
        </div>
      );
    }

    return (
      <div className="profile-section">
        <h2>
          <FontAwesomeIcon icon={faUser} /> Driver Profile
        </h2>
        
        <div className="profile-grid">
          {/* Personal Information */}
          <div className="profile-card">
            <h3>
              <FontAwesomeIcon icon={faIdCard} /> Personal Information
            </h3>
            <div className="profile-details">
              <div className="detail-row">
                <span className="label">Name:</span>
                <span className="value">{driverData.User?.name || 'Not available'}</span>
              </div>
              <div className="detail-row">
                <span className="label">Email:</span>
                <span className="value">{driverData.User?.email || 'Not available'}</span>
              </div>
              <div className="detail-row">
                <span className="label">Phone:</span>
                <span className="value">{driverData.User?.phone || 'Not available'}</span>
              </div>
              <div className="detail-row">
                <span className="label">Account Status:</span>
                <span className={`value status ${driverData.User?.isApproved ? 'approved' : 'pending'}`}>
                  {driverData.User?.isApproved ? 'Approved' : 'Pending Approval'}
                </span>
              </div>
              <div className="detail-row">
                <span className="label">Member Since:</span>
                <span className="value">
                  {driverData.User?.createdAt ? new Date(driverData.User.createdAt).toLocaleDateString() : 'Not available'}
                </span>
              </div>
            </div>
          </div>

          {/* Vehicle Information */}
          <div className="profile-card">
            <h3>
              <FontAwesomeIcon icon={getVehicleIcon(driverData.vehicleType)} /> Vehicle Information
            </h3>
            <div className="profile-details">
              <div className="detail-row">
                <span className="label">Vehicle Type:</span>
                <span className="value">{getVehicleTypeLabel(driverData.vehicleType)}</span>
              </div>
              <div className="detail-row">
                <span className="label">License Plate:</span>
                <span className="value">{driverData.licensePlate || 'Not available'}</span>
              </div>
              <div className="detail-row">
                <span className="label">Model:</span>
                <span className="value">{driverData.model || 'Not available'}</span>
              </div>
              <div className="detail-row">
                <span className="label">Color:</span>
                <span className="value">{driverData.color || 'Not available'}</span>
              </div>
              <div className="detail-row">
                <span className="label">Driver License:</span>
                <span className="value">{driverData.driverLicense || 'Not available'}</span>
              </div>
            </div>
          </div>

          {/* Working Area */}
          <div className="profile-card">
            <h3>
              <FontAwesomeIcon icon={faMapPin} /> Working Area
            </h3>
            <div className="profile-details">
              <div className="detail-row">
                <span className="label">Assigned Area:</span>
                <span className="value">
                  {driverData.workingArea || 'Not assigned by admin'}
                </span>
              </div>
              <div className="detail-row">
                <span className="label">Availability Status:</span>
                <span className={`value status ${driverData.isAvailable ? 'available' : 'unavailable'}`}>
                  {driverData.isAvailable ? 'Available' : 'Unavailable'}
                </span>
              </div>
              <button
                className={`availability-toggle-btn ${driverData.isAvailable ? 'go-unavailable' : 'go-available'}`}
                onClick={handleToggleAvailability}
                disabled={isToggling}
              >
                {isToggling
                  ? 'Saving...'
                  : driverData.isAvailable
                  ? 'Go Unavailable'
                  : 'Go Available'}
              </button>
            </div>
          </div>

          {/* Performance Statistics */}
          <div className="profile-card">
            <h3>
              <FontAwesomeIcon icon={faStar} /> Performance Statistics
            </h3>
            <div className="profile-details">
              <div className="detail-row">
                <span className="label">Rating:</span>
                <span className="value">
                  {driverData.rating ? `${driverData.rating.toFixed(1)}/5.0` : 'No rating yet'}
                </span>
              </div>
              <div className="detail-row">
                <span className="label">Total Deliveries:</span>
                <span className="value">{driverData.totalDeliveries || 0}</span>
              </div>
              <div className="detail-row">
                <span className="label">Total Assigned:</span>
                <span className="value">{driverData.totalAssigned || 0}</span>
              </div>
              <div className="detail-row">
                <span className="label">Total Cancelled:</span>
                <span className="value">{driverData.totalCancelled || 0}</span>
              </div>
              <div className="detail-row">
                <span className="label">Assigned Today:</span>
                <span className="value">{driverData.assignedToday || 0}</span>
              </div>
              <div className="detail-row">
                <span className="label">Active Assignments:</span>
                <span className="value">{driverData.activeAssign || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  });

  // Fetch driver profile data
  const fetchDriverProfile = async () => {
    try {
      setProfileLoading(true);
      setProfileError(null);
      const response = await driverService.getDriverProfile();
      setProfileData(response.data);
    } catch (err) {
      setProfileError('Failed to load profile data. Please try again later.');
      console.error('Error fetching driver profile:', err);
    } finally {
      setProfileLoading(false);
    }
  };

  useEffect(() => {
    if (activeView === 'profile') {
      fetchDriverProfile();
    }
  }, [activeView]);

  // Handler for availability change from DriverProfile
  const handleAvailabilityChange = (newVal) => {
    setProfileData((prev) => ({ ...prev, isAvailable: newVal }));
    setShowAvailabilityDialog(false);
    setPendingAvailability(null);
  };

  // Handler to request toggle
  const handleRequestToggleAvailability = (currentAvailable) => {
    if (currentAvailable) {
      setShowAvailabilityDialog(true);
      setPendingAvailability(false);
    } else {
      // Directly toggle to available
      handleConfirmToggleAvailability(false);
    }
  };

  // Handler to confirm toggle
  const handleConfirmToggleAvailability = async (currentAvailable) => {
    if (!profileData) return;
    try {
      await driverService.updateAvailability(!currentAvailable);
      handleAvailabilityChange(!currentAvailable);
    } catch (err) {
      alert('Failed to update availability. Please try again.');
      setShowAvailabilityDialog(false);
      setPendingAvailability(null);
    }
  };

  return (
    <div className="driver-dashboard">
      {/* Header */}
                <div className="dashboard-header">
        <div className="header-left">
          <h1 style={{color: 'white'}}>
            <FontAwesomeIcon icon={faTruck} /> Driver Dashboard
          </h1>
          <p>Welcome back, {currentUser?.name || 'Driver'}!</p>
                  </div>
                  </div>

      {/* Navigation Tabs */}
      <div className="dashboard-nav">
        <button 
          className={`nav-tab ${activeView === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveView('dashboard')}
        >
          <FontAwesomeIcon icon={faBox} /> Dashboard
        </button>
        <button 
          className={`nav-tab ${activeView === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveView('profile')}
        >
          <FontAwesomeIcon icon={faUser} /> Profile
        </button>
                </div>

      {/* Main Content */}
      {activeView === 'dashboard' ? (
        <div className="dashboard-content">
          {/* Stats Cards */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">
                <FontAwesomeIcon icon={faTruck} />
                    </div>
              <div className="stat-info">
                <h3>{driverStats?.assignedToday || 0}</h3>
                <p>Assigned Today</p>
                    </div>
                  </div>
            <div className="stat-card">
              <div className="stat-icon">
                <FontAwesomeIcon icon={faBox} />
                </div>
              <div className="stat-info">
                <h3>{driverStats?.totalAssigned || 0}</h3>
                <p>Total Assigned</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">
                <FontAwesomeIcon icon={faCheck} />
              </div>
              <div className="stat-info">
                <h3>{driverStats?.totalDeliveries || 0}</h3>
                <p>Total Deliveries</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">
                <FontAwesomeIcon icon={faClock} />
              </div>
              <div className="stat-info">
                <h3>{driverStats?.activeAssign || 0}</h3>
                <p>Active Assignments</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">
                <FontAwesomeIcon icon={faTimes} />
              </div>
              <div className="stat-info">
                <h3>{driverStats?.totalCancelled || 0}</h3>
                <p>Cancelled</p>
              </div>
            </div>
          </div>

          {/* Charts and Packages */}
                <div className="dashboard-main">
            <div className="charts-section">
              <div className="chart-card">
                <h3>Delivery Statistics</h3>
                <div className="chart-container">
                  <Doughnut data={chartData} options={chartOptions} />
                </div>
              </div>
            </div>

                  <div className="packages-section">
              <MyPackages 
                packages={packages}
                loading={loading}
                error={error}
                getStatusBadge={getStatusBadge}
                searchQuery={searchQuery}
                handleSearchChange={handleSearchChange}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                getFilteredPackages={getFilteredPackages}
                updatePackageStatus={updatePackageStatus}
                openPackageDetailsModal={openPackageDetailsModal}
                      />
                    </div>
          </div>
        </div>
      ) : (
        <div className="profile-content">
          <DriverProfile 
            driverData={profileData} 
            loading={profileLoading} 
            error={profileError} 
            onAvailabilityChange={handleAvailabilityChange}
            onRequestToggleAvailability={handleRequestToggleAvailability}
          />
        </div>
      )}

      <PackageDetailsModal />
      <DriverRejectModal />

      {/* Delivery Modal */}
      {showDeliveryModal && deliveryModalPackage && (
        <div className="modal-overlay show" onClick={() => setShowDeliveryModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Mark as Delivered</h3>
              <button className="close-btn" onClick={() => setShowDeliveryModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="checkbox" checked={isPartial} onChange={(e) => setIsPartial(e.target.checked)} />
                  Partial delivery
                </label>
              </div>
              {isPartial ? (
                <div>
                  <div style={{ fontWeight: 600, marginBottom: 8 }}>Select delivered quantities:</div>
                  {Array.isArray(deliveryModalPackage.Items) && deliveryModalPackage.Items.length > 0 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: 8 }}>
                      {deliveryModalPackage.Items.map((it) => {
                        const maxQty = parseInt(it.quantity, 10) || 0;
                        return (
                          <React.Fragment key={it.id}>
                            <div style={{ alignSelf: 'center' }}>{it.description} (max {maxQty})</div>
                            <input
                              type="number"
                              min="0"
                              max={maxQty}
                              value={deliveredQuantities[it.id] ?? ''}
                              onChange={(e) => setDeliveredQuantities((prev) => ({ ...prev, [it.id]: e.target.value }))}
                              placeholder="0"
                              style={{ width: '100%', padding: 6 }}
                            />
                          </React.Fragment>
                        );
                      })}
                    </div>
                  ) : (
                    <div style={{ color: '#666' }}>No items available for partial selection. Uncheck partial to deliver completely.</div>
                  )}
                </div>
              ) : (
                <div style={{ color: '#444' }}>Deliver package completely to the customer.</div>
              )}
            </div>
            <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button className="btn-secondary" onClick={() => setShowDeliveryModal(false)}>Cancel</button>
              <button className="gradient-confirm-btn" onClick={handleConfirmDelivery}>
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom confirmation dialog for availability */}
      {showAvailabilityDialog && (
        <div className="modal-overlay show" style={{zIndex: 2000}}>
          <div className="modal-content" style={{maxWidth: 400, textAlign: 'center'}}>
            <div className="modal-header">
              <h3>Confirm Unavailability</h3>
                    </div>
            <div className="modal-body">
              <p>Are you sure you want to switch to unavailable mode? You will not receive new assignments.</p>
                  </div>
            <div className="modal-actions" style={{display: 'flex', justifyContent: 'center', gap: 16}}>
              <button className="gradient-confirm-btn" style={{width: '100%'}} onClick={() => handleConfirmToggleAvailability(true)}>Yes, Go Unavailable</button>
              <button className="btn-secondary" onClick={() => { setShowAvailabilityDialog(false); setPendingAvailability(null); }}>Cancel</button>
                </div>
        </div>
      </div>
      )}
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
