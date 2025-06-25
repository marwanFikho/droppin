import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { packageService } from '../../services/api';
import CreatePackage from './CreatePackage';
import ShopPackages, { getStatusBadge } from './ShopPackages';
import ShopProfile from './ShopProfile';
import NewPickup from './NewPickup';
import Wallet from './Wallet';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
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

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend);

// Create a context to share the refresh function with child components
export const ShopDashboardContext = React.createContext();

const TABS = [
  { label: 'All', value: 'all' },
  { label: 'Awaiting Schedule', value: 'awaiting_schedule' },
  { label: 'Scheduled for Pickup', value: 'scheduled_for_pickup' },
  { label: 'Pending', value: 'pending' },
  { label: 'In Transit', value: 'in-transit' },
  { label: 'Delivered', value: 'delivered' },
  { label: 'Return to Shop', value: 'return-to-shop' },
  { label: 'Cancelled', value: 'cancelled' },
  { label: 'Pickups', value: 'pickups' },
];

const inTransitStatuses = ['assigned', 'pickedup', 'in-transit'];
const returnToShopStatuses = ['cancelled-awaiting-return', 'cancelled-returned'];

const ShopDashboard = () => {
  const { currentUser } = useAuth();
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
  const location = useLocation();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [packageToCancel, setPackageToCancel] = useState(null);
  const [cancelError, setCancelError] = useState(null);
  // Add search state
  const [search, setSearch] = useState('');
  // Add money transactions state
  const [moneyTransactions, setMoneyTransactions] = useState([]);
  const [moneyFilters, setMoneyFilters] = useState({
    startDate: '',
    endDate: '',
    attribute: '',
    changeType: '',
    search: '',
    sortBy: 'createdAt',
    sortOrder: 'DESC'
  });
  const [activeTab, setActiveTab] = useState('all');
  const [shopCodToCollect, setShopCodToCollect] = useState(0);
  const [sortConfig, setSortConfig] = useState({
    field: 'createdAt',
    order: 'DESC'
  });
  
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

  // Add fetchPackages function
  const fetchPackages = async () => {
    try {
      const response = await packageService.getPackages();
      const pkgs = response.data?.packages || response.data || [];
      setPackages(Array.isArray(pkgs) ? pkgs : []);
    } catch (error) {
      console.error('Error fetching packages:', error);
      alert('Failed to fetch packages. Please try again.');
      setPackages([]);
    }
  };

  // Add useEffect to fetch packages on component mount
  useEffect(() => {
    fetchPackages();
  }, []);

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

        // Fetch money transactions
        const moneyResponse = await packageService.getMoneyTransactions(moneyFilters);
        setMoneyTransactions(moneyResponse.data.transactions || []);
      } catch (err) {
        console.error('Error fetching shop data:', err);
        setError(t('shop.errors.fetchData'));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [refreshData, moneyFilters]); // Add moneyFilters to dependencies

  // Prepare chart data
  const getChartData = () => {
    const pending = packages.filter(p => p.status === 'pending').length;
    const inTransit = packages.filter(p => ['assigned', 'pickedup', 'in-transit'].includes(p.status)).length;
    const delivered = packages.filter(p => p.status === 'delivered').length;

    return {
      labels: ['Pending', 'In Transit', 'Delivered'],
      datasets: [
        {
          data: [pending, inTransit, delivered],
          backgroundColor: ['#ffd700', '#1e90ff', '#32cd32'],
          borderColor: ['#ffd700', '#1e90ff', '#32cd32'],
          borderWidth: 1,
        },
      ],
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          boxWidth: 15,
          padding: 10,
          font: {
            size: 14
          }
        }
      }
    }
  };

  // Add function to handle money transaction filters
  const handleMoneyFilterChange = (field, value) => {
    if (field === 'sortBy') {
      // Toggle sort order if clicking the same column
      if (moneyFilters.sortBy === value) {
        setMoneyFilters(prev => ({
          ...prev,
          sortOrder: prev.sortOrder === 'DESC' ? 'ASC' : 'DESC'
        }));
      } else {
        // New column selected, set it with default DESC order
        setMoneyFilters(prev => ({
          ...prev,
          sortBy: value,
          sortOrder: 'DESC'
        }));
      }
    } else {
      setMoneyFilters(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  // Add function to render money transactions table
  const renderMoneyTable = () => {
    if (moneyTransactions.length === 0) {
      return <p style={{textAlign:'center'}}>No transactions found.</p>;
    }

    const renderSortIcon = (field) => {
      if (moneyFilters.sortBy === field) {
        return <span className="sort-icon">{moneyFilters.sortOrder === 'DESC' ? '▼' : '▲'}</span>;
      }
      return null;
    };

    return (
      <div className="money-transactions-section">
        <div className="filters-section">
          <div className="filter-group">
            <input
              type="date"
              className="filter-input"
              value={moneyFilters.startDate}
              onChange={e => handleMoneyFilterChange('startDate', e.target.value)}
              placeholder="Start Date"
            />
            <input
              type="date"
              className="filter-input"
              value={moneyFilters.endDate}
              onChange={e => handleMoneyFilterChange('endDate', e.target.value)}
              placeholder="End Date"
            />
          </div>
          <div className="filter-group">
            <select
              className="filter-select"
              value={moneyFilters.attribute}
              onChange={e => handleMoneyFilterChange('attribute', e.target.value)}
            >
              <option value="">All Attributes</option>
              <option value="ToCollect">To Collect</option>
              <option value="TotalCollected">Total Collected</option>
            </select>
            <select
              className="filter-select"
              value={moneyFilters.changeType}
              onChange={e => handleMoneyFilterChange('changeType', e.target.value)}
            >
              <option value="">All Types</option>
              <option value="increase">Increase</option>
              <option value="decrease">Decrease</option>
            </select>
          </div>
          <div className="filter-group">
            <input
              type="text"
              className="filter-input"
              value={moneyFilters.search}
              onChange={e => handleMoneyFilterChange('search', e.target.value)}
              placeholder="Search transactions..."
            />
          </div>
        </div>

        <table className="admin-table money-table">
          <thead>
            <tr>
              <th 
                onClick={() => handleMoneyFilterChange('sortBy', 'createdAt')} 
                className="sortable-header"
              >
                Date {renderSortIcon('createdAt')}
              </th>
              <th 
                onClick={() => handleMoneyFilterChange('sortBy', 'attribute')} 
                className="sortable-header"
              >
                Attribute {renderSortIcon('attribute')}
              </th>
              <th 
                onClick={() => handleMoneyFilterChange('sortBy', 'changeType')} 
                className="sortable-header"
              >
                Type {renderSortIcon('changeType')}
              </th>
              <th 
                onClick={() => handleMoneyFilterChange('sortBy', 'amount')} 
                className="sortable-header"
              >
                Amount ($) {renderSortIcon('amount')}
              </th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {moneyTransactions.map(tx => (
              <tr key={tx.id}>
                <td>{new Date(tx.createdAt).toLocaleString()}</td>
                <td>{tx.attribute}</td>
                <td>
                  <span className={`change-type ${tx.changeType}`}>
                    {tx.changeType}
                  </span>
                </td>
                <td className={`financial-cell ${tx.changeType}`}>
                  ${parseFloat(tx.amount).toFixed(2)}
                </td>
                <td>{tx.description || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const handleCancel = async () => {
    if (!packageToCancel) return;
    try {
      await packageService.updatePackageStatus(packageToCancel.id, { status: 'cancelled' });
      setRefreshData(Date.now());
      setShowCancelModal(false);
      setPackageToCancel(null);
      setCancelError(null);
    } catch (err) {
      setCancelError(err.response?.data?.message || 'Failed to cancel package.');
    }
  };

  const filterPackages = () => {
    let filtered = [...packages];

    // Filter by search term
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(pkg => 
        pkg.trackingNumber?.toLowerCase().includes(searchLower) ||
        pkg.packageDescription?.toLowerCase().includes(searchLower) ||
        pkg.deliveryContactName?.toLowerCase().includes(searchLower) ||
        pkg.status?.toLowerCase().includes(searchLower)
      );
    }

    // Filter by active tab
    if (activeTab === 'all') {
      return filtered;
    } else if (activeTab === 'in-transit') {
      return filtered.filter(pkg => inTransitStatuses.includes(pkg.status));
    } else if (activeTab === 'return-to-shop') {
      return filtered.filter(pkg => returnToShopStatuses.includes(pkg.status));
    } else if (activeTab === 'pickups') {
      return filtered; // This will be handled by the pickups tab
    } else {
      return filtered.filter(pkg => pkg.status === activeTab);
    }
  };

  const handleStatClick = (tab) => {
    navigate(`/shop/packages?tab=${tab}`);
  };

  // Add the handleMarkAsReturned function
  const handleMarkAsReturned = async (pkg) => {
    try {
      await packageService.updatePackageStatus(pkg.id, { status: 'cancelled-returned' });
      // Refresh packages list
      fetchPackages();
    } catch (error) {
      console.error('Error marking package as returned:', error);
      alert('Failed to mark package as returned. Please try again.');
    }
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
            <Link to="/shop" className={`menu-item${location.pathname === '/shop' ? ' active' : ''}`}> 
              <i className="menu-icon">📊</i>
              Dashboard
            </Link>
            <Link to="/shop/packages" className={`menu-item${location.pathname.startsWith('/shop/packages') ? ' active' : ''}`}> 
              <i className="menu-icon">📦</i>
              Packages
            </Link>
            <Link to="/shop/create-package" className={`menu-item${location.pathname === '/shop/create-package' ? ' active' : ''}`}> 
              <i className="menu-icon">➕</i>
              New Package
            </Link>
            <Link to="/shop/new-pickup" className={`menu-item${location.pathname === '/shop/new-pickup' ? ' active' : ''}`}> 
              <i className="menu-icon">🚚</i>
              New Pickup
            </Link>
            <Link to="/shop/wallet" className={`menu-item${location.pathname === '/shop/wallet' ? ' active' : ''}`}> 
              <i className="menu-icon">💰</i>
              Wallet
            </Link>
            <Link to="/shop/profile" className={`menu-item${location.pathname === '/shop/profile' ? ' active' : ''}`}> 
              <i className="menu-icon">👤</i>
              Profile
            </Link>
          </div>
        </div>
        
        <Routes>
          <Route path="create-package" element={<CreatePackage />} />
          <Route path="packages" element={<ShopPackages />} />
          <Route path="profile" element={<ShopProfile />} />
          <Route path="new-pickup" element={<NewPickup />} />
          <Route path="wallet" element={<Wallet />} />
          <Route path="*" element={
            <div className="dashboard-content">
              <div className="dashboard-header">
                <div className="welcome-message">
                  <h1 style={{color:'white'}}>Welcome, {currentUser?.name || 'Shop Owner'}</h1>
                  <p style={{color:'white'}}>Manage your deliveries with ease</p>
                </div>
                <div className="user-info">
                  <span className="business-name">{currentUser?.businessName}</span>
                  <span>Shop Account</span>
                </div>
              </div>
              
              <div className="dashboard-stats-container">
                {/* Package Stats and Chart Row */}
                <div className="stats-and-chart-row">
                  {/* Package Stats */}
                  <div className="dashboard-stats package-stats">
                    <div className="stat-card" style={{cursor:'pointer'}} onClick={() => handleStatClick('pending')}>
                      <div className="stat-value">{packages.filter(p => p.status === 'pending').length}</div>
                      <div className="stat-label">Pending</div>
                    </div>
                    <div className="stat-card" style={{cursor:'pointer'}} onClick={() => handleStatClick('in-transit')}>
                      <div className="stat-value">{packages.filter(p => ['assigned', 'pickedup', 'in-transit'].includes(p.status)).length}</div>
                      <div className="stat-label">In Transit</div>
                    </div>
                    <div className="stat-card" style={{cursor:'pointer'}} onClick={() => handleStatClick('delivered')}>
                      <div className="stat-value">{packages.filter(p => p.status === 'delivered').length}</div>
                      <div className="stat-label">Delivered</div>
                    </div>
                    <div className="stat-card" style={{cursor:'pointer'}} onClick={() => handleStatClick('all')}>
                      <div className="stat-value">{packages.length}</div>
                      <div className="stat-label">Total</div>
                    </div>
                  </div>

                  {/* Package Distribution Chart */}
                  <div className="chart-container">
                    <h3>Package Distribution</h3>
                    <div>
                      <Pie data={getChartData()} options={chartOptions} />
                    </div>
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

                {/* Financial Stats Row */}
                <div className="dashboard-stats financial-stats">
                  <div className="stat-card">
                    <div className="stat-value">
                      ${(parseFloat(financialStats.rawToCollect || 0)).toFixed(2)}
                    </div>
                    <div className="stat-label">To Collect</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value">
                      ${(parseFloat(financialStats.rawTotalCollected || 0)).toFixed(2)}
                    </div>
                    <div className="stat-label">Collected (Waiting Withdraw)</div>
                  </div>
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
                      {filterPackages().slice(0, 4).map((pkg) => (
                        <div key={pkg.id} className="package-item">
                          <div className="package-main-row">
                            <div className="package-info">
                              <div style={{display:'flex',flexDirection:'column'}}>
                                <div className="tracking-number">{pkg.trackingNumber}</div>
                                <div className="recipient-name">{pkg.deliveryContactName || 'No recipient'}</div>
                              </div>
                              <div className="package-description">{pkg.packageDescription}</div>
                              {getStatusBadge(pkg.status)}
                            </div>
                            <div className="package-details-right">
                              <div className="package-date">{new Date(pkg.createdAt).toLocaleDateString()}</div>
                              <div className="package-cod">
                                COD: ${parseFloat(pkg.codAmount || 0).toFixed(2)}
                                {pkg.codAmount > 0 && (
                                  <span className={`payment-status ${pkg.isPaid ? 'paid' : 'unpaid'}`}>{pkg.isPaid ? ' (Paid)' : ' (Unpaid)'}</span>
                                )}
                              </div>
                              <td>
                                {pkg.status !== 'delivered' && pkg.status !== 'cancelled' && pkg.status !== 'cancelled-returned' && (
                                  <button
                                    className="action-button cancel-btn"
                                    onClick={() => {
                                      setPackageToCancel(pkg);
                                      setShowCancelModal(true);
                                    }}
                                  >
                                    Cancel
                                  </button>
                                )}
                                {pkg.status === 'cancelled-awaiting-return' && (
                                  <button
                                    className="action-button return-btn"
                                    onClick={() => handleMarkAsReturned(pkg)}
                                  >
                                    Mark as Returned
                                  </button>
                                )}
                              </td>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          } />
        </Routes>
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
      {showCancelModal && (
        <div className="confirmation-overlay" onClick={() => { setShowCancelModal(false); setCancelError(null); }}>
          <div className="confirmation-dialog warning-dialog" onClick={e => e.stopPropagation()}>
            <h3>Cancel Package</h3>
            <p>Are you sure you want to cancel this package?</p>
            {cancelError && <div style={{color:'#dc3545',marginBottom:'0.5rem'}}>{cancelError}</div>}
            <div className="confirmation-buttons">
              <button className="btn-secondary" onClick={() => { setShowCancelModal(false); setCancelError(null); }}>No</button>
              <button className="btn-danger" onClick={handleCancel}>Yes, Cancel</button>
            </div>
          </div>
        </div>
      )}
      
      {showDetailsModal && renderDetailsModal()}
    </ShopDashboardContext.Provider>
  );
};

export default ShopDashboard;
