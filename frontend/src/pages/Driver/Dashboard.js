import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
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

// Add placeholder components if not defined
const MyPackages = () => <div>MyPackages component placeholder</div>;
const PackageDetailsModal = () => <div>PackageDetailsModal component placeholder</div>;

const DriverDashboard = () => {
  const { currentUser, logout } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  // State management
  const [activeTab, setActiveTab] = useState('current');
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [driverStats, setDriverStats] = useState(null);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState(null);
  const [activeView, setActiveView] = useState('dashboard'); // 'dashboard' or 'profile'
  const [profileData, setProfileData] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState(null);
  const [showAvailabilityDialog, setShowAvailabilityDialog] = useState(false);
  const [pendingAvailability, setPendingAvailability] = useState(null);

  // Define package categories
  const packageCategories = {
    current: ['assigned', 'pickedup', 'in-transit'],
    past: ['delivered', 'cancelled', 'returned'],
    delivered: ['delivered'],
    cancelled: ['cancelled'],
    all: ['assigned', 'pickedup', 'in-transit', 'delivered', 'cancelled', 'returned']
  };

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        setLoading(true);
        const response = await packageService.getPackages();
        const packagesList = Array.isArray(response.data) ? response.data : (response.data.packages || []);
        setPackages(packagesList);
        setError(null);
      } catch (err) {
        setError('Failed to load packages. Please try again later.');
        console.error('Error fetching packages:', err);
      } finally {
        setLoading(false);
      }
    };
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

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery || '');
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Filtered packages
  const getFilteredPackages = useCallback(() => {
    let filtered = packages;
    if (activeTab !== 'all') {
      filtered = filtered.filter(pkg => packageCategories[activeTab].includes(pkg.status));
    }
    if (statusFilter !== 'all') {
      filtered = filtered.filter(pkg => pkg.status === statusFilter);
    }
    if (debouncedSearchQuery.trim()) {
      const query = debouncedSearchQuery.toLowerCase().trim();
      filtered = filtered.filter(pkg => 
        pkg.trackingNumber?.toLowerCase().includes(query) ||
        pkg.packageDescription?.toLowerCase().includes(query) ||
        pkg.deliveryAddress?.toLowerCase().includes(query) ||
        pkg.status?.toLowerCase().includes(query)
      );
    }
    return filtered;
  }, [packages, activeTab, statusFilter, debouncedSearchQuery]);

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
      setError(t('driver.dashboard.errors.acceptPackage'));
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
      setError(t('driver.dashboard.errors.updatePackage', { status }));
      console.error('Error updating package:', err);
    }
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
      alert(t('driver.dashboard.success.markDelivered'));
    } catch (err) {
      setError(t('driver.dashboard.errors.markDelivered'));
      console.error('Error updating package with payment:', err);
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
          <div className="loading">{t('driver.profile.loading')}</div>
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
          <div className="error">{t('driver.profile.noData')}</div>
        </div>
      );
    }

    return (
      <div className="profile-section">
        <h2>
          <FontAwesomeIcon icon={faUser} /> {t('driver.profile.title')}
        </h2>
        
        <div className="profile-grid">
          {/* Personal Information */}
          <div className="profile-card">
            <h3>
              <FontAwesomeIcon icon={faIdCard} /> {t('driver.profile.personalInfo')}
            </h3>
            <div className="profile-details">
              <div className="detail-row">
                <span className="label">{t('driver.profile.name')}:</span>
                <span className="value">{driverData.User?.name || t('common.notAvailable')}</span>
              </div>
              <div className="detail-row">
                <span className="label">{t('driver.profile.email')}:</span>
                <span className="value">{driverData.User?.email || t('common.notAvailable')}</span>
              </div>
              <div className="detail-row">
                <span className="label">{t('driver.profile.phone')}:</span>
                <span className="value">{driverData.User?.phone || t('common.notAvailable')}</span>
              </div>
              <div className="detail-row">
                <span className="label">{t('driver.profile.accountStatus')}:</span>
                <span className={`value status ${driverData.User?.isApproved ? 'approved' : 'pending'}`}>{driverData.User?.isApproved ? t('driver.profile.approved') : t('driver.profile.pending')}</span>
              </div>
              <div className="detail-row">
                <span className="label">{t('driver.profile.memberSince')}:</span>
                <span className="value">{driverData.User?.createdAt ? new Date(driverData.User.createdAt).toLocaleDateString() : t('common.notAvailable')}</span>
              </div>
            </div>
          </div>

          {/* Vehicle Information */}
          <div className="profile-card">
            <h3>
              <FontAwesomeIcon icon={getVehicleIcon(driverData.vehicleType)} /> {t('driver.profile.vehicleInfo')}
            </h3>
            <div className="profile-details">
              <div className="detail-row">
                <span className="label">{t('driver.profile.vehicleType')}:</span>
                <span className="value">{getVehicleTypeLabel(driverData.vehicleType)}</span>
              </div>
              <div className="detail-row">
                <span className="label">{t('driver.profile.licensePlate')}:</span>
                <span className="value">{driverData.licensePlate || t('common.notAvailable')}</span>
              </div>
              <div className="detail-row">
                <span className="label">{t('driver.profile.model')}:</span>
                <span className="value">{driverData.model || t('common.notAvailable')}</span>
              </div>
              <div className="detail-row">
                <span className="label">{t('driver.profile.color')}:</span>
                <span className="value">{driverData.color || t('common.notAvailable')}</span>
              </div>
              <div className="detail-row">
                <span className="label">{t('driver.profile.driverLicense')}:</span>
                <span className="value">{driverData.driverLicense || t('common.notAvailable')}</span>
              </div>
            </div>
          </div>

          {/* Working Area */}
          <div className="profile-card">
            <h3>
              <FontAwesomeIcon icon={faMapPin} /> {t('driver.profile.workingArea')}
            </h3>
            <div className="profile-details">
              <div className="detail-row">
                <span className="label">{t('driver.profile.assignedArea')}:</span>
                <span className="value">{driverData.workingArea || t('driver.profile.notAssigned')}</span>
              </div>
              <div className="detail-row">
                <span className="label">{t('driver.profile.availabilityStatus')}:</span>
                <span className={`value status ${driverData.isAvailable ? 'available' : 'unavailable'}`}>{driverData.isAvailable ? t('driver.profile.available') : t('driver.profile.unavailable')}</span>
              </div>
              <button
                className={`availability-toggle-btn ${driverData.isAvailable ? 'go-unavailable' : 'go-available'}`}
                onClick={handleToggleAvailability}
                disabled={isToggling}
              >
                {isToggling
                  ? t('common.saving')
                  : driverData.isAvailable
                  ? t('driver.profile.goUnavailable')
                  : t('driver.profile.goAvailable')}
              </button>
            </div>
          </div>

          {/* Performance Statistics */}
          <div className="profile-card">
            <h3>
              <FontAwesomeIcon icon={faStar} /> {t('driver.profile.performanceStats')}
            </h3>
            <div className="profile-details">
              <div className="detail-row">
                <span className="label">{t('driver.profile.rating')}:</span>
                <span className="value">{driverData.rating ? `${driverData.rating.toFixed(1)}/5.0` : t('driver.profile.noRating')}</span>
              </div>
              <div className="detail-row">
                <span className="label">{t('driver.profile.totalDeliveries')}:</span>
                <span className="value">{driverData.totalDeliveries || 0}</span>
              </div>
              <div className="detail-row">
                <span className="label">{t('driver.profile.totalAssigned')}:</span>
                <span className="value">{driverData.totalAssigned || 0}</span>
              </div>
              <div className="detail-row">
                <span className="label">{t('driver.profile.totalCancelled')}:</span>
                <span className="value">{driverData.totalCancelled || 0}</span>
              </div>
              <div className="detail-row">
                <span className="label">{t('driver.profile.assignedToday')}:</span>
                <span className="value">{driverData.assignedToday || 0}</span>
              </div>
              <div className="detail-row">
                <span className="label">{t('driver.profile.activeAssign')}:</span>
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
      setProfileError(t('driver.profile.errors.loadProfile'));
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
      alert(t('driver.profile.errors.updateAvailability'));
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
            <FontAwesomeIcon icon={faTruck} /> {t('driver.dashboard.title')}
          </h1>
          <p>{t('driver.dashboard.welcome', { name: currentUser?.name || t('driver.dashboard.defaultName') })}</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="dashboard-nav">
        <button 
          className={`nav-tab ${activeView === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveView('dashboard')}
        >
          <FontAwesomeIcon icon={faBox} /> {t('driver.dashboard.tabs.dashboard')}
        </button>
        <button 
          className={`nav-tab ${activeView === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveView('profile')}
        >
          <FontAwesomeIcon icon={faUser} /> {t('driver.dashboard.tabs.profile')}
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
                <p>{t('driver.dashboard.stats.assignedToday')}</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">
                <FontAwesomeIcon icon={faBox} />
              </div>
              <div className="stat-info">
                <h3>{driverStats?.totalAssigned || 0}</h3>
                <p>{t('driver.dashboard.stats.totalAssigned')}</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">
                <FontAwesomeIcon icon={faCheck} />
              </div>
              <div className="stat-info">
                <h3>{driverStats?.totalDeliveries || 0}</h3>
                <p>{t('driver.dashboard.stats.totalDeliveries')}</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">
                <FontAwesomeIcon icon={faClock} />
              </div>
              <div className="stat-info">
                <h3>{driverStats?.activeAssign || 0}</h3>
                <p>{t('driver.dashboard.stats.activeAssign')}</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">
                <FontAwesomeIcon icon={faTimes} />
              </div>
              <div className="stat-info">
                <h3>{driverStats?.totalCancelled || 0}</h3>
                <p>{t('driver.dashboard.stats.cancelled')}</p>
              </div>
            </div>
          </div>

          {/* Charts and Packages */}
          <div className="dashboard-main">
            <div className="charts-section">
              <div className="chart-card">
                <h3>{t('driver.dashboard.deliveryStats')}</h3>
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
                getFilteredPackages={getFilteredPackages}
                openPackageDetailsModal={openPackageDetailsModal}
                updatePackageStatus={updatePackageStatus}
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

      {/* Custom confirmation dialog for availability */}
      {showAvailabilityDialog && (
        <div className="modal-overlay show" style={{zIndex: 2000}}>
          <div className="modal-content" style={{maxWidth: 400, textAlign: 'center'}}>
            <div className="modal-header">
              <h3>{t('driver.profile.confirmUnavailabilityTitle')}</h3>
            </div>
            <div className="modal-body">
              <p>{t('driver.profile.confirmUnavailabilityText')}</p>
            </div>
            <div className="modal-actions" style={{display: 'flex', justifyContent: 'center', gap: 16}}>
              <button className="gradient-confirm-btn" style={{width: '100%'}} onClick={() => handleConfirmToggleAvailability(true)}>{t('driver.profile.goUnavailableConfirm')}</button>
              <button className="btn-secondary" onClick={() => { setShowAvailabilityDialog(false); setPendingAvailability(null); }}>{t('common.cancel')}</button>
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
