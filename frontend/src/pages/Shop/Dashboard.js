import React, { useState, useEffect, useRef } from 'react';
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
    totalCollected: 0,
    settelled: 0,
    rawSettelled: '0'
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
  
  // Function to refresh dashboard data - can be called from any child component
  const refreshDashboard = () => {
    console.log('Dashboard refresh requested');
    setRefreshData(Date.now());
  };

  // Add fetchPackages function
  const fetchPackages = async () => {
    try {
      const response = await packageService.getPackages({ page: 1, limit: 25 });
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

  useEffect(() => {
    console.log('Dashboard data refresh triggered:', refreshData);
    // Fetch packages and shop details when component mounts or refreshData changes
    const fetchData = async () => {
      try {
        setLoading(true);

        // Get packages
        const packagesResponse = await packageService.getPackages({ page: 1, limit: 25 });
        const packages = packagesResponse.data?.packages || packagesResponse.data || [];
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
          const settelled = shop.rawSettelled ? parseInt(shop.rawSettelled, 10) : (shop.settelled ? parseInt(shop.settelled, 10) : 0);
          
          console.log('Parsed values:', { toCollect, totalCollected });
          
          // Store both the parsed values and the raw string values
          setFinancialStats({
            totalToCollect: toCollect,
            totalCollected: totalCollected,
            settelled: settelled,
            rawToCollect: shop.rawToCollect || shop.ToCollect || '0',
            rawTotalCollected: shop.rawTotalCollected || shop.TotalCollected || '0',
            rawSettelled: shop.rawSettelled || shop.settelled || '0'
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
        setError('Failed to load data. Please try again later.');
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
              <option value="Revenue">Revenue</option>
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
                Amount (EGP) {renderSortIcon('amount')}
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
              EGP {parseFloat(tx.amount).toFixed(2)}
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
      await packageService.cancelPackage(packageToCancel.id);
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
            <td data-label="Tracking #">{pkg.trackingNumber}</td>
            <td data-label="Description">
              <div>{pkg.packageDescription}</div>
              <div style={{ color: '#666', marginTop: 4 }}>{pkg.deliveryAddress}</div>
              {(pkg.deliveryContactName || pkg.deliveryContactPhone) && (
                <div style={{ fontSize: 12, color: '#555', marginTop: 2 }}>
                  {pkg.deliveryContactName || 'N/A'}{pkg.deliveryContactPhone ? ` · ${pkg.deliveryContactPhone}` : ''}
                </div>
              )}
            </td>
            <td data-label="Recipient">{pkg.deliveryContactName}</td>
            <td data-label="Status">{getStatusBadge(pkg.status)}</td>
            <td data-label="COD Amount">EGP {parseFloat(pkg.codAmount || 0).toFixed(2)}</td>
            <td data-label="Actions" className="actions-cell">
              <button
                className="action-button view-btn"
                onClick={() => openDetailsModal(pkg)}
              >
                View
              </button>
              {pkg.status === 'pending' && (
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
                  Mark Returned
                </button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    );
  };

  // State for mobile menu
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  // Ref for swipe detection
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const touchEligibleForOpen = useRef(false);
  const dashboardContainerRef = useRef(null);
  const EDGE_SWIPE_THRESHOLD = 300;
  const MIN_OPEN_DISTANCE = 160;
  const MIN_CLOSE_DISTANCE = 140;

  // Handle touch start for swipe detection
  const handleTouchStart = (e) => {
    const startX = e.targetTouches[0].clientX;
    touchStartX.current = startX;
    touchEndX.current = startX;

    const modalOpen = Boolean(document.querySelector('.modal-overlay, .confirmation-overlay'));
    const target = e.target;
    const blockedSelectors = [
      '.packages-table',
      '.package-list',
      '.package-list-item',
      '.money-table',
      '.pickup-card',
      '.create-package-form',
      '.modal-content',
      '.confirmation-dialog'
    ];
    const startedInBlockedArea = blockedSelectors.some((selector) => target.closest(selector));

    touchEligibleForOpen.current = !isMenuOpen && !modalOpen && !startedInBlockedArea && startX <= EDGE_SWIPE_THRESHOLD;
  };

  // Handle touch move and end for swipe detection
  const handleTouchMove = (e) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current === 0 && touchEndX.current === 0) return;

    const diffX = touchStartX.current - touchEndX.current;
    const openedByEdgeSwipe = touchEligibleForOpen.current && diffX < -MIN_OPEN_DISTANCE;
    const closedBySwipe = diffX > MIN_CLOSE_DISTANCE;

    // Detect swipe right to show menu (need to swipe more than minSwipeDistance)
    if (!isMenuOpen && openedByEdgeSwipe) {
      setIsMenuOpen(true);
    }
    // Detect swipe left to hide menu (need to swipe more than minSwipeDistance)
    else if (isMenuOpen && closedBySwipe) {
      setIsMenuOpen(false);
    }

    touchStartX.current = 0;
    touchEndX.current = 0;
    touchEligibleForOpen.current = false;
  };

  // Close menu when clicking outside sidebar
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dashboardContainerRef.current && !dashboardContainerRef.current.contains(event.target) && 
          !event.target.closest('.menu-toggle-btn') && isMenuOpen) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  return (
    <ShopDashboardContext.Provider value={{ refreshDashboard }}>
      <div 
        className={`dashboard-container ${isMenuOpen ? 'menu-open' : 'menu-closed'}`}
        ref={dashboardContainerRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="dashboard-sidebar">
          <div className="sidebar-header">
            <h2>Droppin</h2>
            <p>Shop Portal</p>
          </div>
        
          <div className="sidebar-menu">
            <Link to="/shop" className={`menu-item${location.pathname === '/shop' ? ' active' : ''}`} onClick={() => setIsMenuOpen(false)}> 
              <i className="menu-icon">📊</i>
              Dashboard
            </Link>
            <Link to="/shop/packages" className={`menu-item${location.pathname.startsWith('/shop/packages') ? ' active' : ''}`} onClick={() => setIsMenuOpen(false)}> 
              <i className="menu-icon">📦</i>
              Packages
            </Link>
            <Link to="/shop/create-package" className={`menu-item${location.pathname === '/shop/create-package' ? ' active' : ''}`} onClick={() => setIsMenuOpen(false)}> 
              <i className="menu-icon">➕</i>
              New Package
            </Link>
            <Link to="/shop/new-pickup" className={`menu-item${location.pathname === '/shop/new-pickup' ? ' active' : ''}`} onClick={() => setIsMenuOpen(false)}> 
              <i className="menu-icon">🚚</i>
              New Pickup
            </Link>
            <Link to="/shop/wallet" className={`menu-item${location.pathname === '/shop/wallet' ? ' active' : ''}`} onClick={() => setIsMenuOpen(false)}> 
              <i className="menu-icon">💰</i>
              Wallet
            </Link>
            <Link to="/shop/profile" className={`menu-item${location.pathname === '/shop/profile' ? ' active' : ''}`} onClick={() => setIsMenuOpen(false)}> 
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
            <div className="dashboard-content-shop">
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
                </div>

                {/* Financial Stats Row */}
                <div className="dashboard-stats financial-stats">
                  <div className="stat-card">
                                    <div className="stat-value">
                  EGP {(parseFloat(financialStats.rawToCollect || 0)).toFixed(2)}
                </div>
                    <div className="stat-label">To Collect</div>
                  </div>
                  <div className="stat-card">
                                    <div className="stat-value">
                  EGP {(parseFloat(financialStats.rawTotalCollected || 0)).toFixed(2)}
                </div>
                    <div className="stat-label">Collected (Waiting Withdraw)</div>
                  </div>
                  <div className="stat-card">
                                    <div className="stat-value">
                  EGP {(parseFloat(financialStats.rawSettelled || 0)).toFixed(2)}
                </div>
                    <div className="stat-label">Settled</div>
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
                                <td className="tracking-number" data-label="Tracking #">{pkg.trackingNumber || 'N/A'}</td>
                                <td className="package-description" data-label="Package">
                                  <div>{pkg.packageDescription || 'No description provided'}</div>
                                  <div className="package-address">{pkg.deliveryAddress || 'No address available'}</div>
                                  {(pkg.deliveryContactName || pkg.deliveryContactPhone) && (
                                    <div className="package-contact">
                                      {pkg.deliveryContactName || 'N/A'}{pkg.deliveryContactPhone ? ` · ${pkg.deliveryContactPhone}` : ''}
                                    </div>
                                  )}
                                </td>
                                <td className="recipient-name" data-label="Recipient">{pkg.deliveryContactName || 'N/A'}</td>
                                <td data-label="Status">{getStatusBadge(pkg.status)}</td>
                                <td className="package-cod" data-label="COD">
                                  <span className="cod-amount">EGP {parseFloat(pkg.codAmount || 0).toFixed(2)}</span>
                                  {getCodBadge(pkg.isPaid)}
                                </td>
                                <td data-label="Created On">{new Date(pkg.createdAt).toLocaleDateString()}</td>
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
      {/* Package Details Modal */}
      {showPackageDetailsModal && selectedPackage && (
        <div className="modal-overlay" onClick={() => setShowPackageDetailsModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Package Details</h2>
              <button className="btn close-btn" onClick={() => setShowPackageDetailsModal(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="details-grid">
                <div className="detail-item">
                  <span className="label">Tracking #</span>
                  <span>{selectedPackage.trackingNumber}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Status</span>
                  <span>{getStatusBadge(selectedPackage.status)}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Created</span>
                  <span>{new Date(selectedPackage.createdAt).toLocaleString()}</span>
                </div>
                <div className="detail-item full-width">
                  <span className="label">Description</span>
                  <span>{selectedPackage.packageDescription || 'No description'}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Recipient</span>
                  <span>{selectedPackage.deliveryContactName || 'N/A'}</span>
                </div>
                {selectedPackage.deliveryContactPhone && (
                  <div className="detail-item">
                    <span className="label">Recipient Phone</span>
                    <span>{selectedPackage.deliveryContactPhone}</span>
                  </div>
                )}
                {selectedPackage.deliveryAddress && (
                  <div className="detail-item full-width">
                    <span className="label">Delivery Address</span>
                    <span>{selectedPackage.deliveryAddress}</span>
                  </div>
                )}
                <div className="detail-item">
                  <span className="label">COD</span>
                  <span>EGP {parseFloat(selectedPackage.codAmount || 0).toFixed(2)} {getCodBadge(selectedPackage.isPaid)}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Delivery Cost</span>
                  <span>EGP {parseFloat(selectedPackage.deliveryCost || 0).toFixed(2)}</span>
                </div>
                {selectedPackage.rejectionShippingPaidAmount !== undefined && selectedPackage.rejectionShippingPaidAmount !== null && (
                  <div className="detail-item">
                    <span className="label">Rejection Shipping Fees Paid</span>
                    <span>EGP {parseFloat(selectedPackage.rejectionShippingPaidAmount || 0).toFixed(2)}</span>
                  </div>
                )}
                {selectedPackage.weight && (
                  <div className="detail-item">
                    <span className="label">Weight</span>
                    <span>{selectedPackage.weight} kg</span>
                  </div>
                )}
                {selectedPackage.dimensions && (
                  <div className="detail-item">
                    <span className="label">Dimensions</span>
                    <span>{selectedPackage.dimensions}</span>
                  </div>
                )}
                {selectedPackage.notes && (
                  <div className="detail-item full-width">
                    <span className="label">Notes</span>
                    <span>{selectedPackage.notes}</span>
                  </div>
                )}
                {selectedPackage.shopNotes && (
                  <div className="detail-item full-width">
                    <span className="label">Shop Notes</span>
                    <span>{selectedPackage.shopNotes}</span>
                  </div>
                )}
              </div>
              <div className="modal-actions">
                <button className="btn close-btn" onClick={() => setShowPackageDetailsModal(false)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </ShopDashboardContext.Provider>
  );
};

export default ShopDashboard;
