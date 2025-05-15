import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { packageService } from '../../services/api';
import CreatePackage from './CreatePackage';
import './ShopDashboard.css';

// Create a context to share the refresh function with child components
export const ShopDashboardContext = React.createContext();

const ShopDashboard = () => {
  const { currentUser, logout } = useAuth();
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshData, setRefreshData] = useState(Date.now()); // Add timestamp for triggering refreshes
  const [financialStats, setFinancialStats] = useState({
    totalToCollect: 0,
    totalCollected: 0
  });
  const navigate = useNavigate();
  
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
              <div className="stat-card">
                <div className="stat-value">{packages.filter(p => p.status === 'pending').length}</div>
                <div className="stat-label">Pending</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{packages.filter(p => ['assigned', 'pickedup', 'in-transit'].includes(p.status)).length}</div>
                <div className="stat-label">In Transit</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{packages.filter(p => p.status === 'delivered').length}</div>
                <div className="stat-label">Delivered</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{packages.length}</div>
                <div className="stat-label">Total</div>
              </div>
            </div>
            
            <div className="dashboard-stats financial-stats">
              <div className="stat-card">
                {/* Use raw database value directly for ToCollect */}
                <div className="stat-value">
                  ${(parseInt(financialStats.rawToCollect || 0)).toFixed(2)}
                </div>
                <div className="stat-label">To Collect (Pending COD Collection)</div>
              </div>
              <div className="stat-card">
                {/* Use raw database value directly for TotalCollected */}
                <div className="stat-value">
                  ${(parseInt(financialStats.rawTotalCollected || 0)).toFixed(2)}
                </div>
                <div className="stat-label">Collected (Awaiting Settlement)</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">
                  {(financialStats.totalToCollect + financialStats.totalCollected) > 0 ? 
                    `${((financialStats.totalCollected / (financialStats.totalToCollect + financialStats.totalCollected)) * 100).toFixed(1)}%` : 
                    '0%'}
                </div>
                <div className="stat-label">Collection Rate</div>
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
                    {packages.slice(0, 5).map((pkg) => (
                      <div key={pkg.id} className="package-item">
                        <div className="package-info">
                          <div className="tracking-number">{pkg.trackingNumber}</div>
                          <div className="package-description">{pkg.packageDescription}</div>
                        </div>
                        <div className="package-details">
                          <div className="package-row">
                            <div className={`package-status status-${pkg.status}`}>
                              {pkg.status.charAt(0).toUpperCase() + pkg.status.slice(1)}
                            </div>
                            <div className="package-date">
                              {new Date(pkg.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="package-row financial-row">
                            <div className="package-cod">
                              COD: ${parseFloat(pkg.codAmount || 0).toFixed(2)}
                              {pkg.codAmount > 0 && (
                                <span className={`payment-status ${pkg.isPaid ? 'paid' : 'unpaid'}`}>
                                  {pkg.isPaid ? ' (Paid)' : ' (Unpaid)'}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="quick-actions">
                <h2>Quick Actions</h2>
                <div className="action-buttons">
                  <Link to="/shop/create-package" className="action-button">
                    <i className="action-icon">➕</i>
                    Create New Package
                  </Link>
                  <Link to="/track" className="action-button">
                    <i className="action-icon">🔍</i>
                    Track Package
                  </Link>
                  <Link to="/shop/profile" className="action-button">
                    <i className="action-icon">⚙️</i>
                    Update Profile
                  </Link>
                </div>
              </div>
            </div>
          </div>
        } />
      </Routes>
      </div>
    </ShopDashboardContext.Provider>
  );
};

export default ShopDashboard;
