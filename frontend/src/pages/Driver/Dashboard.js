import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { packageService } from '../../services/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faBox, 
  faSearch, 
  faSpinner,
  faTruck,
  faMoneyBill,
  faBoxOpen,
  faCheckCircle,
  faMapMarkedAlt,
  faRoute
} from '@fortawesome/free-solid-svg-icons';
import './DriverDashboard.css';

const DriverDashboard = () => {
  const { currentUser, logout } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  // State management
  const [activeTab, setActiveTab] = useState('current');
  const [packages, setPackages] = useState([]);
  const [availablePackages, setAvailablePackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [stats, setStats] = useState({
    packages: {
      assigned: 0,
      inTransit: 0,
      delivered: 0,
      available: 0
    },
    earnings: {
      today: 0,
      total: 0
    }
  });

  // Update URL when tab changes
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    navigate(`/driver/${tab}`);
  };

  // Fetch dashboard data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [assignedResponse, availableResponse] = await Promise.all([
          packageService.getDriverPackages(),
          packageService.getAvailablePackages()
        ]);
        
        const assignedPackages = assignedResponse.data || [];
        const availablePackages = availableResponse.data || [];
        
        setPackages(assignedPackages);
        setAvailablePackages(availablePackages);
        
        // Calculate stats
        setStats({
          packages: {
            assigned: assignedPackages.filter(p => p.status === 'assigned').length,
            inTransit: assignedPackages.filter(p => ['pickedup', 'in-transit'].includes(p.status)).length,
            delivered: assignedPackages.filter(p => p.status === 'delivered').length,
            available: availablePackages.length
          },
          earnings: {
            today: assignedPackages
              .filter(p => p.status === 'delivered' && isToday(p.deliveredAt))
              .reduce((sum, pkg) => sum + (pkg.deliveryFee || 0), 0),
            total: assignedPackages
              .filter(p => p.status === 'delivered')
              .reduce((sum, pkg) => sum + (pkg.deliveryFee || 0), 0)
          }
        });
        
        setError(null);
      } catch (err) {
        console.error('Error fetching driver data:', err);
        setError(t('driver.errors.fetchData'));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [t]);

  // Helper function to check if a date is today
  const isToday = (date) => {
    if (!date) return false;
    const today = new Date();
    const deliveryDate = new Date(date);
    return (
      deliveryDate.getDate() === today.getDate() &&
      deliveryDate.getMonth() === today.getMonth() &&
      deliveryDate.getFullYear() === today.getFullYear()
    );
  };

  // Filter packages based on search term and active tab
  const getFilteredPackages = () => {
    let filtered = activeTab === 'available' ? availablePackages : packages;

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(pkg => 
        pkg.trackingNumber?.toLowerCase().includes(search) ||
        pkg.description?.toLowerCase().includes(search) ||
        pkg.status?.toLowerCase().includes(search)
      );
    }

    if (activeTab === 'available') {
      return filtered;
    }

    switch (activeTab) {
      case 'current':
        return filtered.filter(pkg => ['assigned', 'pickedup', 'in-transit'].includes(pkg.status));
      case 'delivered':
        return filtered.filter(pkg => pkg.status === 'delivered');
      default:
        return filtered;
    }
  };

  // View package details
  const viewDetails = (pkg) => {
    setSelectedPackage(pkg);
    setShowDetailsModal(true);
  };

  // Handle package status update
  const handleStatusUpdate = async (packageId, newStatus) => {
    try {
      await packageService.updatePackageStatus(packageId, newStatus);
      // Refresh data after status update
      const response = await packageService.getDriverPackages();
      setPackages(response.data || []);
      setShowDetailsModal(false);
    } catch (err) {
      console.error('Error updating package status:', err);
      setError(t('driver.errors.updateStatus', { status: newStatus }));
    }
  };

  // Accept available package
  const handleAcceptPackage = async (packageId) => {
    try {
      await packageService.acceptPackage(packageId);
      // Refresh both assigned and available packages
      const [assignedResponse, availableResponse] = await Promise.all([
        packageService.getDriverPackages(),
        packageService.getAvailablePackages()
      ]);
      setPackages(assignedResponse.data || []);
      setAvailablePackages(availableResponse.data || []);
    } catch (err) {
      console.error('Error accepting package:', err);
      setError(t('driver.errors.acceptPackage'));
    }
  };

  // Render package details modal
  const renderDetailsModal = () => {
    if (!showDetailsModal || !selectedPackage) return null;
    
    return (
      <div className="modal-overlay show" onClick={() => setShowDetailsModal(false)}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h2>
              <FontAwesomeIcon icon={faBox} className="package-icon" />
              {selectedPackage.trackingNumber}
            </h2>
            <button className="close-btn" onClick={() => setShowDetailsModal(false)}>×</button>
          </div>
          <div className="modal-body">
            <div className="package-details">
              <div className="detail-row">
                <label>{t('driver.package.description')}:</label>
                <span>{selectedPackage.description}</span>
              </div>
              <div className="detail-row">
                <label>{t('driver.package.status')}:</label>
                <span className={`status-badge status-${selectedPackage.status}`}>
                  {t(`driver.status.${selectedPackage.status}`)}
                </span>
              </div>
              <div className="detail-row">
                <label>{t('driver.package.pickupAddress')}:</label>
                <span>{selectedPackage.pickupAddress}</span>
              </div>
              <div className="detail-row">
                <label>{t('driver.package.deliveryAddress')}:</label>
                <span>{selectedPackage.deliveryAddress}</span>
              </div>
              <div className="detail-row">
                <label>{t('driver.package.deliveryFee')}:</label>
                <span className="financial-cell">${selectedPackage.deliveryFee}</span>
              </div>
              {selectedPackage.codAmount > 0 && (
                <div className="detail-row">
                  <label>{t('driver.package.codAmount')}:</label>
                  <span className="financial-cell">${selectedPackage.codAmount}</span>
                </div>
              )}
            </div>
          </div>
          {selectedPackage.status !== 'delivered' && (
            <div className="modal-actions">
              {selectedPackage.status === 'assigned' && (
                <button 
                  className="btn pickup-btn"
                  onClick={() => handleStatusUpdate(selectedPackage.id, 'pickedup')}
                >
                  <FontAwesomeIcon icon={faTruck} /> {t('driver.actions.pickup')}
                </button>
              )}
              {selectedPackage.status === 'pickedup' && (
                <button 
                  className="btn transit-btn"
                  onClick={() => handleStatusUpdate(selectedPackage.id, 'in-transit')}
                >
                  <FontAwesomeIcon icon={faRoute} /> {t('driver.actions.startDelivery')}
                </button>
              )}
              {selectedPackage.status === 'in-transit' && (
                <button 
                  className="btn deliver-btn"
                  onClick={() => handleStatusUpdate(selectedPackage.id, 'delivered')}
                >
                  <FontAwesomeIcon icon={faCheckCircle} /> {t('driver.actions.markDelivered')}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render packages table
  const renderPackagesTable = () => {
    const filteredPackages = getFilteredPackages();

    return (
      <div className="table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>{t('driver.table.trackingNumber')}</th>
              <th>{t('driver.table.description')}</th>
              <th>{t('driver.table.status')}</th>
              <th>{t('driver.table.pickupAddress')}</th>
              <th>{t('driver.table.deliveryAddress')}</th>
              <th>{t('driver.table.deliveryFee')}</th>
              <th className="actions-header">{t('driver.table.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {filteredPackages.length === 0 ? (
              <tr>
                <td colSpan="7" className="no-data">{t('driver.table.noData')}</td>
              </tr>
            ) : (
              filteredPackages.map(pkg => (
                <tr key={pkg.id}>
                  <td>{pkg.trackingNumber}</td>
                  <td>{pkg.description}</td>
                  <td>
                    <span className={`status-badge status-${pkg.status}`}>
                      {t(`driver.status.${pkg.status}`)}
                    </span>
                  </td>
                  <td>{pkg.pickupAddress}</td>
                  <td>{pkg.deliveryAddress}</td>
                  <td className="financial-cell">${pkg.deliveryFee}</td>
                  <td className="actions-cell">
                    <button 
                      className="action-btn view"
                      onClick={() => viewDetails(pkg)}
                      title={t('common.view')}
                    >
                      <FontAwesomeIcon icon={faBox} />
                    </button>
                    {activeTab === 'available' && (
                      <button 
                        className="action-btn accept"
                        onClick={() => handleAcceptPackage(pkg.id)}
                        title={t('driver.actions.accept')}
                      >
                        <FontAwesomeIcon icon={faCheckCircle} />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="driver-dashboard">
      <header className="admin-header">
        <h1>{t('driver.title')}</h1>
      </header>

      <div className="dashboard-stats">
        <div className="stats-section">
          <h2>{t('driver.overview.packages.title')}</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <FontAwesomeIcon icon={faBox} />
              <div className="stat-info">
                <h3>{t('driver.overview.packages.assigned')}</h3>
                <p>{stats.packages.assigned}</p>
              </div>
            </div>
            <div className="stat-card">
              <FontAwesomeIcon icon={faTruck} />
              <div className="stat-info">
                <h3>{t('driver.overview.packages.inTransit')}</h3>
                <p>{stats.packages.inTransit}</p>
              </div>
            </div>
            <div className="stat-card">
              <FontAwesomeIcon icon={faCheckCircle} />
              <div className="stat-info">
                <h3>{t('driver.overview.packages.delivered')}</h3>
                <p>{stats.packages.delivered}</p>
              </div>
            </div>
            <div className="stat-card">
              <FontAwesomeIcon icon={faBoxOpen} />
              <div className="stat-info">
                <h3>{t('driver.overview.packages.available')}</h3>
                <p>{stats.packages.available}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="stats-section">
          <h2>{t('driver.overview.earnings.title')}</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <FontAwesomeIcon icon={faMoneyBill} />
              <div className="stat-info">
                <h3>{t('driver.overview.earnings.today')}</h3>
                <p>${stats.earnings.today}</p>
              </div>
            </div>
            <div className="stat-card">
              <FontAwesomeIcon icon={faMoneyBill} />
              <div className="stat-info">
                <h3>{t('driver.overview.earnings.total')}</h3>
                <p>${stats.earnings.total}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="dashboard-tabs">
        <button 
          className={`tab-button ${activeTab === 'current' ? 'active' : ''}`}
          onClick={() => handleTabChange('current')}
        >
          {t('driver.tabs.current')}
        </button>
        <button 
          className={`tab-button ${activeTab === 'available' ? 'active' : ''}`}
          onClick={() => handleTabChange('available')}
        >
          {t('driver.tabs.available')}
        </button>
        <button 
          className={`tab-button ${activeTab === 'delivered' ? 'active' : ''}`}
          onClick={() => handleTabChange('delivered')}
        >
          {t('driver.tabs.delivered')}
        </button>
      </div>
      
      <div className="dashboard-content">
        <div className="search-section">
          <div className="search-bar">
            <FontAwesomeIcon icon={faSearch} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('common.search')}
            />
          </div>
        </div>
        
        {loading ? (
          <div className="loading-container">
            <div className="loading">
              <FontAwesomeIcon icon={faSpinner} />
              {t('common.loading')}
            </div>
          </div>
        ) : (
          renderPackagesTable()
        )}
      </div>
      
      {showDetailsModal && renderDetailsModal()}
    </div>
  );
};

export default DriverDashboard;
