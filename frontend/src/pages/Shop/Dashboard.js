import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { packageService } from '../../services/api';
import CreatePackage from './CreatePackage';
import ShopPackages, { getStatusBadge } from './ShopPackages';
import ShopProfile from './ShopProfile';
import NewPickup from './NewPickup';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import './ShopDashboard.css';

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend);

// Create a context to share the refresh function with child components
export const ShopDashboardContext = React.createContext();

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
  
  // Function to refresh dashboard data - can be called from any child component
  const refreshDashboard = () => {
    console.log('Dashboard refresh requested');
    setRefreshData(Date.now());
  };

  useEffect(() => {
    console.log('Dashboard data refresh triggered:', refreshData);
    // Fetch packages and shop details when component mounts or refreshData changes
    const fetchData = async () => {
      try {
        setLoading(true);

        // Get packages
        const packagesResponse = await packageService.getPackages();
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
      } catch (err) {
        setError('Failed to load data. Please try again later.');
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [refreshData]); // Add refreshData to dependencies to trigger refresh when it changes

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

  // Filter packages for dashboard display
  const filterDashboardPackages = () => {
    let filtered = packages;
    if (search.trim()) {
      const s = search.trim().toLowerCase();
      filtered = filtered.filter(pkg =>
        (pkg.trackingNumber && pkg.trackingNumber.toLowerCase().includes(s)) ||
        (pkg.packageDescription && pkg.packageDescription.toLowerCase().includes(s)) ||
        (pkg.deliveryContactName && pkg.deliveryContactName.toLowerCase().includes(s))
      );
    }
    return filtered;
  };

  const handleStatClick = (tab) => {
    navigate(`/shop/packages?tab=${tab}`);
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
                      {filterDashboardPackages().slice(0, 4).map((pkg) => (
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
                              {pkg.status !== 'delivered' && pkg.status !== 'cancelled' && (
                                <button
                                  className="action-button"
                                  style={{background:'#e53935',color:'#fff',padding:'0.2rem 0.6rem',fontSize:'0.8rem',marginTop:'0.3rem'}}
                                  onClick={() => {
                                    setPackageToCancel(pkg);
                                    setShowCancelModal(true);
                                  }}
                                >
                                  Cancel
                                </button>
                              )}
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
    </ShopDashboardContext.Provider>
  );
};

export default ShopDashboard;
