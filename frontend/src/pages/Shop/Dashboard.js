import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { packageService } from '../../services/api';
import CreatePackage from './CreatePackage';
import ShopPackages, { getStatusBadge, getCodBadge } from './ShopPackages';
import ShopProfile from './ShopProfile';
import NewPickup from './NewPickup';
import Wallet from './Wallet';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import './ShopDashboard.css';
import { useTranslation } from 'react-i18next';

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
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshData, setRefreshData] = useState(Date.now()); // Add timestamp for triggering refreshes
  const [financialStats, setFinancialStats] = useState({
    totalToCollect: 0,
    totalCollected: 0
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
  const [showPackageDetailsModal, setShowPackageDetailsModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const { t, i18n } = useTranslation();
  
  // Function to refresh dashboard data - can be called from any child component
  const refreshDashboard = () => {
    console.log('Dashboard refresh requested');
    setRefreshData(Date.now());
  };

  // Add fetchPackages function
  const fetchPackages = async () => {
    try {
      const response = await packageService.getPackages({ limit: 10000 });
      const pkgs = response.data?.packages || response.data || [];
      setPackages(Array.isArray(pkgs) ? pkgs : []);
    } catch (error) {
      console.error('Error fetching packages:', error);
      alert(t('shop.dashboard.errors.fetchPackagesFailed'));
      setPackages([]);
    }
  };

  // Add useEffect to fetch packages on component mount
  useEffect(() => {
    fetchPackages();
  }, []);

  useEffect(() => {
    console.log('Dashboard data refresh triggered:', refreshData);
    // Fetch packages and shop details when component mounts or refreshData changes
    const fetchData = async () => {
      try {
        setLoading(true);

        // Get packages
        const packagesResponse = await packageService.getPackages({ limit: 10000 });
        const packages = packagesResponse.data.packages || packagesResponse.data || [];
        setPackages(packages);
        
        // Get shop profile with financial data
        const shopResponse = await packageService.getShopProfile();
        
        if (shopResponse && shopResponse.data) {
          // Use the database fields for financial stats if available
          const shop = shopResponse.data;
          console.log('Shop data received:', shop);
          
          // Log the raw database values
          console.log('Raw database values:', {
            ToCollect: shop.ToCollect,
            TotalCollected: shop.TotalCollected,
            rawToCollect: shop.rawToCollect,
            rawTotalCollected: shop.rawTotalCollected
          });
          
          // Convert the values from strings to integers using parseInt with radix 10
          // This ensures proper handling of large numbers
          const toCollect = shop.rawToCollect ? parseInt(shop.rawToCollect, 10) : (shop.ToCollect ? parseInt(shop.ToCollect, 10) : 0);
          const totalCollected = shop.rawTotalCollected ? parseInt(shop.rawTotalCollected, 10) : (shop.TotalCollected ? parseInt(shop.TotalCollected, 10) : 0);
          
          console.log('Parsed values:', { toCollect, totalCollected });
          
          // Store both the parsed values and the raw string values
          setFinancialStats({
            totalToCollect: toCollect,
            totalCollected: totalCollected,
            // Keep the raw values for debugging and direct display
            rawToCollect: shop.rawToCollect || shop.ToCollect || '0',
            rawTotalCollected: shop.rawTotalCollected || shop.TotalCollected || '0'
          });
        } else {
          // Fallback to calculating from packages if shop data not available
          const totalToCollect = packages.reduce((sum, pkg) => sum + (parseFloat(pkg.codAmount) || 0), 0);
          const totalCollected = packages.reduce((sum, pkg) => {
            return sum + (pkg.isPaid ? (parseFloat(pkg.codAmount) || 0) : 0);
          }, 0);
          
          setFinancialStats({
            totalToCollect: totalToCollect,
            totalCollected: totalCollected,
            rawToCollect: String(totalToCollect),
            rawTotalCollected: String(totalCollected)
          });
        }

        // Fetch money transactions
        const moneyResponse = await packageService.getMoneyTransactions(moneyFilters);
        setMoneyTransactions(moneyResponse.data.transactions || []);
      } catch (err) {
        setError(t('shop.dashboard.errors.loadDataFailed'));
        console.error('Error fetching data:', err);
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
      labels: [t('shop.dashboard.chart.pending'), t('shop.dashboard.chart.inTransit'), t('shop.dashboard.chart.delivered')],
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
      return <p style={{textAlign:'center'}}>{t('shop.dashboard.moneyTransactions.noTransactions')}</p>;
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
              placeholder={t('shop.dashboard.moneyTransactions.startDate')}
            />
            <input
              type="date"
              className="filter-input"
              value={moneyFilters.endDate}
              onChange={e => handleMoneyFilterChange('endDate', e.target.value)}
              placeholder={t('shop.dashboard.moneyTransactions.endDate')}
            />
          </div>
          <div className="filter-group">
            <select
              className="filter-select"
              value={moneyFilters.attribute}
              onChange={e => handleMoneyFilterChange('attribute', e.target.value)}
            >
              <option value="">{t('shop.dashboard.moneyTransactions.allAttributes')}</option>
              <option value="ToCollect">{t('shop.dashboard.moneyTransactions.toCollect')}</option>
              <option value="TotalCollected">{t('shop.dashboard.moneyTransactions.totalCollected')}</option>
            </select>
            <select
              className="filter-select"
              value={moneyFilters.changeType}
              onChange={e => handleMoneyFilterChange('changeType', e.target.value)}
            >
              <option value="">{t('shop.dashboard.moneyTransactions.allTypes')}</option>
              <option value="increase">{t('shop.dashboard.moneyTransactions.increase')}</option>
              <option value="decrease">{t('shop.dashboard.moneyTransactions.decrease')}</option>
            </select>
          </div>
          <div className="filter-group">
            <input
              type="text"
              className="filter-input"
              value={moneyFilters.search}
              onChange={e => handleMoneyFilterChange('search', e.target.value)}
              placeholder={t('shop.dashboard.moneyTransactions.searchPlaceholder')}
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
                {t('shop.dashboard.moneyTransactions.date')} {renderSortIcon('createdAt')}
              </th>
              <th 
                onClick={() => handleMoneyFilterChange('sortBy', 'attribute')} 
                className="sortable-header"
              >
                {t('shop.dashboard.moneyTransactions.attribute')} {renderSortIcon('attribute')}
              </th>
              <th 
                onClick={() => handleMoneyFilterChange('sortBy', 'changeType')} 
                className="sortable-header"
              >
                {t('shop.dashboard.moneyTransactions.type')} {renderSortIcon('changeType')}
              </th>
              <th 
                onClick={() => handleMoneyFilterChange('sortBy', 'amount')} 
                className="sortable-header"
              >
                {t('shop.dashboard.moneyTransactions.amount')} {renderSortIcon('amount')}
              </th>
              <th>{t('shop.dashboard.moneyTransactions.description')}</th>
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
      setCancelError(err.response?.data?.message || t('shop.dashboard.errors.cancelPackageFailed'));
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
      alert(t('shop.dashboard.errors.markReturnedFailed'));
    }
  };

  // We'll show this in the modal for now
  const openDetailsModal = (pkg) => {
    // Implementation of openDetailsModal function
    console.log('Opening details modal for package:', pkg);
  };

  // Create a new function to render the table body to avoid cluttering the main return
  const renderTableBody = () => {
    return (
      <tbody>
        {filterPackages().map(pkg => (
          <tr key={pkg.id}>
            <td data-label={t('shop.dashboard.table.trackingNumber')}>{pkg.trackingNumber}</td>
            <td data-label={t('shop.dashboard.table.description')}>{pkg.packageDescription}</td>
            <td data-label={t('shop.dashboard.table.recipient')}>{pkg.deliveryContactName}</td>
            <td data-label={t('shop.dashboard.table.status')}>{getStatusBadge(pkg.status, t)}</td>
            <td data-label={t('shop.dashboard.table.codAmount')}>${parseFloat(pkg.codAmount || 0).toFixed(2)} {getCodBadge(pkg.isPaid, t)}</td>
            <td data-label={t('shop.dashboard.table.actions')} className="actions-cell">
              <button
                className="action-button view-btn"
                onClick={() => openDetailsModal(pkg)}
              >
                {t('common.view')}
              </button>
              {pkg.status === 'pending' && (
                <button
                  className="action-button cancel-btn"
                  onClick={() => {
                    setPackageToCancel(pkg);
                    setShowCancelModal(true);
                  }}
                >
                  {t('common.cancel')}
                </button>
              )}
              {pkg.status === 'cancelled-awaiting-return' && (
                <button
                  className="action-button return-btn"
                  onClick={() => handleMarkAsReturned(pkg)}
                >
                  {t('shop.dashboard.table.markReturned')}
                </button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    );
  };

  return (
    <ShopDashboardContext.Provider value={{ refreshDashboard }}>
      <div className="dashboard-container">
        <div className="dashboard-sidebar" style={{ left: 0, right: 'auto' }}>
          <div className="sidebar-header">
            <h2>{t('shop.dashboard.sidebar.brand')}</h2>
            <p>{t('shop.dashboard.sidebar.portal')}</p>
          </div>
        
          <div className="sidebar-menu" style={{ direction: i18n.language === 'ar' ? 'rtl' : 'ltr' }}>
            <Link to="/shop" className={`menu-item${location.pathname === '/shop' ? ' active' : ''}`}> 
              <i className="menu-icon">📊</i>
              {t('shop.dashboard.sidebar.dashboard')}
            </Link>
            <Link to="/shop/packages" className={`menu-item${location.pathname.startsWith('/shop/packages') ? ' active' : ''}`}> 
              <i className="menu-icon">📦</i>
              {t('shop.dashboard.sidebar.packages')}
            </Link>
            <Link to="/shop/create-package" className={`menu-item${location.pathname === '/shop/create-package' ? ' active' : ''}`}> 
              <i className="menu-icon">➕</i>
              {t('shop.dashboard.sidebar.newPackage')}
            </Link>
            <Link to="/shop/new-pickup" className={`menu-item${location.pathname === '/shop/new-pickup' ? ' active' : ''}`}> 
              <i className="menu-icon">🚚</i>
              {t('shop.dashboard.sidebar.newPickup')}
            </Link>
            <Link to="/shop/wallet" className={`menu-item${location.pathname === '/shop/wallet' ? ' active' : ''}`}> 
              <i className="menu-icon">💰</i>
              {t('shop.dashboard.sidebar.wallet')}
            </Link>
            <Link to="/shop/profile" className={`menu-item${location.pathname === '/shop/profile' ? ' active' : ''}`}> 
              <i className="menu-icon">👤</i>
              {t('shop.dashboard.sidebar.profile')}
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
            <div className="dashboard-content" style={{ marginLeft: 250, marginRight: 0 }}>
              <div className="dashboard-header">
                <div className="welcome-message">
                  <h1 style={{color:'white'}}>{t('shop.dashboard.header.welcome', { name: currentUser?.name || t('shop.dashboard.header.shopOwner') })}</h1>
                  <p style={{color:'white'}}>{t('shop.dashboard.header.manageDeliveries')}</p>
                </div>
                <div className="user-info">
                  <span className="business-name">{currentUser?.businessName}</span>
                  <span>{t('shop.dashboard.header.account')}</span>
                </div>
              </div>
              
              <div className="dashboard-stats-container">
                {/* Package Stats and Chart Row */}
                <div className="stats-and-chart-row">
                  {/* Package Stats */}
                  <div className="dashboard-stats package-stats">
                    <div className="stat-card" style={{cursor:'pointer'}} onClick={() => handleStatClick('pending')}>
                      <div className="stat-value">{packages.filter(p => p.status === 'pending').length}</div>
                      <div className="stat-label">{t('shop.dashboard.stats.pending')}</div>
                    </div>
                    <div className="stat-card" style={{cursor:'pointer'}} onClick={() => handleStatClick('in-transit')}>
                      <div className="stat-value">{packages.filter(p => ['assigned', 'pickedup', 'in-transit'].includes(p.status)).length}</div>
                      <div className="stat-label">{t('shop.dashboard.stats.inTransit')}</div>
                    </div>
                    <div className="stat-card" style={{cursor:'pointer'}} onClick={() => handleStatClick('delivered')}>
                      <div className="stat-value">{packages.filter(p => p.status === 'delivered').length}</div>
                      <div className="stat-label">{t('shop.dashboard.stats.delivered')}</div>
                    </div>
                    <div className="stat-card" style={{cursor:'pointer'}} onClick={() => handleStatClick('all')}>
                      <div className="stat-value">{packages.length}</div>
                      <div className="stat-label">{t('shop.dashboard.stats.total')}</div>
                    </div>
                  </div>

                  {/* Package Distribution Chart */}
                  <div className="chart-container">
                    <h3>{t('shop.dashboard.chart.packageDistribution')}</h3>
                    <div>
                      <Pie data={getChartData()} options={chartOptions} />
                    </div>
                  </div>
                </div>

                {/* Financial Stats Row */}
                <div className="dashboard-stats financial-stats">
                  <div className="stat-card">
                    <div className="stat-value">
                      ${(parseFloat(financialStats.rawToCollect || 0)).toFixed(2)}
                    </div>
                    <div className="stat-label">{t('shop.dashboard.stats.toCollect')}</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value">
                      ${(parseFloat(financialStats.rawTotalCollected || 0)).toFixed(2)}
                    </div>
                    <div className="stat-label">{t('shop.dashboard.stats.collectedWaitingWithdraw')}</div>
                  </div>
                </div>
              </div>
              
              <div className="dashboard-main">
                <div className="recent-packages">
                  <div className="section-header">
                    <h2>{t('shop.dashboard.recentPackages.title')}</h2>
                    <Link to="/shop/packages" className="view-all">{t('shop.dashboard.recentPackages.viewAll')}</Link>
                  </div>
                  {loading ? (
                    <div className="loading-message">{t('shop.dashboard.recentPackages.loading')}</div>
                  ) : error ? (
                    <div className="error-message">{error}</div>
                  ) : packages.length === 0 ? (
                    <div className="empty-state">
                      <p>{t('shop.dashboard.recentPackages.empty.message')}</p>
                      <Link to="/shop/create-package" className="action-button">{t('shop.dashboard.recentPackages.empty.action')}</Link>
                    </div>
                  ) : (
                    <div className="package-list">
                      <table className="packages-table recent-packages-table">
                        <tbody>
                          {packages
                            .slice()
                            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                            .slice(0, 5)
                            .map(pkg => (
                              <tr key={pkg.id} className="package-list-item" style={{cursor:'pointer'}}
                                onClick={e => {
                                  // Prevent opening modal when clicking a button
                                  if (e.target.closest('button')) return;
                                  setSelectedPackage(pkg);
                                  setShowPackageDetailsModal(true);
                                }}
                              >
                                <td className="tracking-number">{pkg.trackingNumber}</td>
                                <td className="package-description">{pkg.packageDescription}</td>
                                <td className="recipient-name">{pkg.deliveryContactName}</td>
                                <td>{getStatusBadge(pkg.status, t)}</td>
                                <td className="package-cod">${parseFloat(pkg.codAmount || 0).toFixed(2)} {getCodBadge(pkg.isPaid, t)}</td>
                                <td>{new Date(pkg.createdAt).toLocaleDateString()}</td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          } />
        </Routes>
      </div>
      {showCancelModal && (
        <div className="confirmation-overlay" onClick={() => { setShowCancelModal(false); setCancelError(null); }}>
          <div className="confirmation-dialog warning-dialog" onClick={e => e.stopPropagation()}>
            <h3>{t('shop.dashboard.modals.cancelPackage.title')}</h3>
            <p>{t('shop.dashboard.modals.cancelPackage.message')}</p>
            {cancelError && <div style={{color:'#dc3545',marginBottom:'0.5rem'}}>{cancelError}</div>}
            <div className="confirmation-buttons">
              <button className="btn-secondary" onClick={() => { setShowCancelModal(false); setCancelError(null); }}>{t('common.cancel')}</button>
              <button className="btn-danger" onClick={handleCancel}>{t('shop.dashboard.modals.cancelPackage.confirm')}</button>
            </div>
          </div>
        </div>
      )}
      {/* Package Details Modal */}
      {showPackageDetailsModal && selectedPackage && (
        <div className="confirmation-overlay" onClick={() => setShowPackageDetailsModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{t('shop.dashboard.modals.packageDetails.title')}</h2>
              <button className="btn close-btn" onClick={() => setShowPackageDetailsModal(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="details-grid">
                <div className="detail-item">
                  <span className="label">{t('shop.dashboard.modals.packageDetails.trackingNumber')}</span>
                  <span>{selectedPackage.trackingNumber}</span>
                </div>
                <div className="detail-item">
                  <span className="label">{t('shop.dashboard.modals.packageDetails.status')}</span>
                  <span>{getStatusBadge(selectedPackage.status, t)}</span>
                </div>
                <div className="detail-item">
                  <span className="label">{t('shop.dashboard.modals.packageDetails.created')}</span>
                  <span>{new Date(selectedPackage.createdAt).toLocaleString()}</span>
                </div>
                <div className="detail-item full-width">
                  <span className="label">{t('shop.dashboard.modals.packageDetails.description')}</span>
                  <span>{selectedPackage.packageDescription || t('shop.dashboard.modals.packageDetails.noDescription')}</span>
                </div>
                <div className="detail-item">
                  <span className="label">{t('shop.dashboard.modals.packageDetails.recipient')}</span>
                  <span>{selectedPackage.deliveryContactName || t('common.notAvailable')}</span>
                </div>
                {selectedPackage.deliveryContactPhone && (
                  <div className="detail-item">
                    <span className="label">{t('shop.dashboard.modals.packageDetails.recipientPhone')}</span>
                    <span>{selectedPackage.deliveryContactPhone}</span>
                  </div>
                )}
                {selectedPackage.deliveryAddress && (
                  <div className="detail-item full-width">
                    <span className="label">{t('shop.dashboard.modals.packageDetails.deliveryAddress')}</span>
                    <span>{selectedPackage.deliveryAddress}</span>
                  </div>
                )}
                <div className="detail-item">
                  <span className="label">{t('shop.dashboard.modals.packageDetails.cod')}</span>
                  <span>${parseFloat(selectedPackage.codAmount || 0).toFixed(2)} {getCodBadge(selectedPackage.isPaid, t)}</span>
                </div>
                {selectedPackage.weight && (
                  <div className="detail-item">
                    <span className="label">{t('shop.dashboard.modals.packageDetails.weight')}</span>
                    <span>{selectedPackage.weight} kg</span>
                  </div>
                )}
                {selectedPackage.dimensions && (
                  <div className="detail-item">
                    <span className="label">{t('shop.dashboard.modals.packageDetails.dimensions')}</span>
                    <span>{selectedPackage.dimensions}</span>
                  </div>
                )}
                {selectedPackage.notes && (
                  <div className="detail-item full-width">
                    <span className="label">{t('shop.dashboard.modals.packageDetails.notes')}</span>
                    <span>{selectedPackage.notes}</span>
                  </div>
                )}
                {selectedPackage.shopNotes && (
                  <div className="detail-item full-width">
                    <span className="label">{t('shop.dashboard.modals.packageDetails.shopNotes')}</span>
                    <span>{selectedPackage.shopNotes}</span>
                  </div>
                )}
              </div>
              <div className="modal-actions">
                <button className="btn close-btn" onClick={() => setShowPackageDetailsModal(false)}>{t('common.close')}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </ShopDashboardContext.Provider>
  );
};

export default ShopDashboard;
