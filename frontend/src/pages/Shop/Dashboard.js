import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { packageService } from '../../services/api';
import CreatePackage from './CreatePackage';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faBox, 
  faSearch, 
  faSpinner,
  faTruck,
  faMoneyBill,
  faBoxOpen,
  faCheckCircle
} from '@fortawesome/free-solid-svg-icons';
import './ShopDashboard.css';

// Create a context to share the refresh function with child components
export const ShopDashboardContext = React.createContext();

const ShopDashboard = () => {
  const { currentUser, logout } = useAuth();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('current');
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [stats, setStats] = useState({
    packages: {
      total: 0,
      pending: 0,
      inTransit: 0,
      delivered: 0
    },
    financial: {
      toCollect: 0,
      collected: 0
    }
  });
  const navigate = useNavigate();
  
  // Function to refresh dashboard data - can be called from any child component
  const refreshDashboard = () => {
    console.log('Dashboard refresh requested');
    setActiveTab('current');
    setSearchTerm('');
    setShowDetailsModal(false);
    setSelectedPackage(null);
  };

  // Update URL when tab changes
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    navigate(`/shop/${tab}`);
  };

  // Fetch dashboard data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const packagesResponse = await packageService.getShopPackages();
        const packages = packagesResponse.data || [];

        setPackages(packages);
        
        // Calculate stats
        setStats({
          packages: {
            total: packages.length,
            pending: packages.filter(p => p.status === 'pending').length,
            inTransit: packages.filter(p => ['assigned', 'pickedup', 'in-transit'].includes(p.status)).length,
            delivered: packages.filter(p => p.status === 'delivered').length
          },
          financial: {
            toCollect: packages.reduce((sum, pkg) => sum + (pkg.codAmount || 0), 0),
            collected: packages.reduce((sum, pkg) => pkg.status === 'delivered' ? sum + (pkg.codAmount || 0) : sum, 0)
          }
        });
        
        setError(null);
      } catch (err) {
        console.error('Error fetching shop data:', err);
        setError(t('shop.errors.fetchData'));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [t]);

  // Filter packages based on search term and active tab
  const getFilteredPackages = () => {
    let filtered = [...packages];

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(pkg => 
        pkg.trackingNumber?.toLowerCase().includes(search) ||
        pkg.description?.toLowerCase().includes(search) ||
        pkg.status?.toLowerCase().includes(search)
      );
    }

    switch (activeTab) {
      case 'current':
        return filtered.filter(pkg => pkg.status !== 'delivered');
      case 'delivered':
        return filtered.filter(pkg => pkg.status === 'delivered');
      case 'pending':
        return filtered.filter(pkg => pkg.status === 'pending');
      default:
        return filtered;
    }
  };

  // View package details
  const viewDetails = (pkg) => {
    setSelectedPackage(pkg);
    setShowDetailsModal(true);
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
                <label>{t('shop.package.description')}:</label>
                <span>{selectedPackage.description}</span>
              </div>
              <div className="detail-row">
                <label>{t('shop.package.status')}:</label>
                <span className={`status-badge status-${selectedPackage.status}`}>
                  {t(`shop.status.${selectedPackage.status}`)}
                </span>
              </div>
              <div className="detail-row">
                <label>{t('shop.package.codAmount')}:</label>
                <span className="financial-cell">${selectedPackage.codAmount}</span>
              </div>
              <div className="detail-row">
                <label>{t('shop.package.pickupAddress')}:</label>
                <span>{selectedPackage.pickupAddress}</span>
              </div>
              <div className="detail-row">
                <label>{t('shop.package.deliveryAddress')}:</label>
                <span>{selectedPackage.deliveryAddress}</span>
              </div>
              {selectedPackage.driver && (
                <>
                  <h3>{t('shop.package.driver')}:</h3>
                  <div className="detail-row">
                    <label>{t('shop.driver.name')}:</label>
                    <span>{selectedPackage.driver.name}</span>
                  </div>
                  <div className="detail-row">
                    <label>{t('shop.driver.phone')}:</label>
                    <span>{selectedPackage.driver.phone}</span>
                  </div>
                </>
              )}
            </div>
          </div>
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
              <th>{t('shop.table.trackingNumber')}</th>
              <th>{t('shop.table.description')}</th>
              <th>{t('shop.table.status')}</th>
              <th>{t('shop.table.codAmount')}</th>
              <th>{t('shop.table.driver')}</th>
              <th className="actions-header">{t('shop.table.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {filteredPackages.length === 0 ? (
              <tr>
                <td colSpan="6" className="no-data">{t('shop.table.noData')}</td>
              </tr>
            ) : (
              filteredPackages.map(pkg => (
                <tr key={pkg.id}>
                  <td>{pkg.trackingNumber}</td>
                  <td>{pkg.description}</td>
                  <td>
                    <span className={`status-badge status-${pkg.status}`}>
                      {t(`shop.status.${pkg.status}`)}
                    </span>
                  </td>
                  <td className="financial-cell">${pkg.codAmount}</td>
                  <td>{pkg.driver ? pkg.driver.name : t('shop.driver.notAssigned')}</td>
                  <td className="actions-cell">
                    <button 
                      className="action-btn view"
                      onClick={() => viewDetails(pkg)}
                      title={t('common.view')}
                    >
                      <FontAwesomeIcon icon={faBox} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    );
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <ShopDashboardContext.Provider value={{ refreshDashboard }}>
      <div className="dashboard-container">
        <div className="dashboard-sidebar">
          <div className="sidebar-header">
            <h2>Droppin</h2>
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
      
      <Routes>
        <Route path="create-package" element={<CreatePackage />} />
        <Route path="*" element={
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
              <div className="stats-section">
                <h2>{t('shop.overview.packages.title')}</h2>
                <div className="stats-grid">
              <div className="stat-card">
                    <FontAwesomeIcon icon={faBox} />
                    <div className="stat-info">
                      <h3>{t('shop.overview.packages.total')}</h3>
                      <p>{stats.packages.total}</p>
                    </div>
              </div>
              <div className="stat-card">
                    <FontAwesomeIcon icon={faBoxOpen} />
                    <div className="stat-info">
                      <h3>{t('shop.overview.packages.pending')}</h3>
                      <p>{stats.packages.pending}</p>
                    </div>
              </div>
              <div className="stat-card">
                    <FontAwesomeIcon icon={faTruck} />
                    <div className="stat-info">
                      <h3>{t('shop.overview.packages.inTransit')}</h3>
                      <p>{stats.packages.inTransit}</p>
                    </div>
              </div>
              <div className="stat-card">
                    <FontAwesomeIcon icon={faCheckCircle} />
                    <div className="stat-info">
                      <h3>{t('shop.overview.packages.delivered')}</h3>
                      <p>{stats.packages.delivered}</p>
              </div>
            </div>
                </div>
              </div>

              <div className="stats-section">
                <h2>{t('shop.overview.financial.title')}</h2>
                <div className="stats-grid">
              <div className="stat-card">
                    <FontAwesomeIcon icon={faMoneyBill} />
                    <div className="stat-info">
                      <h3>{t('shop.overview.financial.toCollect')}</h3>
                      <p>${stats.financial.toCollect}</p>
                </div>
              </div>
              <div className="stat-card">
                    <FontAwesomeIcon icon={faMoneyBill} />
                    <div className="stat-info">
                      <h3>{t('shop.overview.financial.collected')}</h3>
                      <p>${stats.financial.collected}</p>
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
                {t('shop.tabs.current')}
              </button>
              <button 
                className={`tab-button ${activeTab === 'pending' ? 'active' : ''}`}
                onClick={() => handleTabChange('pending')}
              >
                {t('shop.tabs.pending')}
              </button>
              <button 
                className={`tab-button ${activeTab === 'delivered' ? 'active' : ''}`}
                onClick={() => handleTabChange('delivered')}
              >
                {t('shop.tabs.delivered')}
              </button>
                </div>
                
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
        } />
      </Routes>
      </div>
      
      {showDetailsModal && renderDetailsModal()}
    </ShopDashboardContext.Provider>
  );
};

export default ShopDashboard;
