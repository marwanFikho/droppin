import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { packageService } from '../../services/api';
import CreatePackage from './CreatePackage';
import ShopPackages, { getStatusBadge, getCodBadge } from './ShopPackages';
import BulkImportPackages from './BulkImportPackages';
import ShopProfile from './ShopProfile';
import NewPickup from './NewPickup';
import Wallet from './Wallet';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import SwipeMenuHint from '../../components/SwipeMenuHint.jsx';
import { useTranslation } from 'react-i18next';

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend);

// Create a context to share the refresh function with child components
export const ShopDashboardContext = React.createContext();

const DEFAULT_TOP_NAV_OFFSET = 64;
const SIDEBAR_TOP_GAP = 10;

const ShopDashboard = () => {
  const { currentUser } = useAuth();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  // Core state
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [refreshData, setRefreshData] = useState(Date.now());
  const refreshDashboard = () => setRefreshData(Date.now());

  // UI state
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [showPackageDetailsModal, setShowPackageDetailsModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [packageToCancel, setPackageToCancel] = useState(null);
  const [cancelError, setCancelError] = useState(null);
  const [recentPage, setRecentPage] = useState(1);
  const [recentPerPage, setRecentPerPage] = useState(5);

  // Responsive
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth <= 768 : false);
  const [topNavOffset, setTopNavOffset] = useState(DEFAULT_TOP_NAV_OFFSET);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    const readNavOffset = () => {
      const cssValue = getComputedStyle(document.documentElement).getPropertyValue('--app-nav-height').trim();
      const parsed = Number.parseFloat(cssValue);
      setTopNavOffset(Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_TOP_NAV_OFFSET);
    };

    readNavOffset();
    window.addEventListener('resize', readNavOffset);
    return () => window.removeEventListener('resize', readNavOffset);
  }, []);

  // Money/Wallet state
  const [financialStats, setFinancialStats] = useState({
    rawToCollect: 0,
    rawTotalCollected: 0,
    rawSettelled: 0
  });

  // Fetch packages, shop profile, and money transactions
  useEffect(() => {
    // Fetch packages and shop details when component mounts or refreshData changes
    const fetchData = async () => {
      try {
        setLoading(true);

  // Get all packages (remove 25-items cap)
  const packagesResponse = await packageService.getPackages({ page: 1, limit: 10000 });
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
      } catch (err) {
        setError(t('shop.dashboard.errors.loadData'));
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [refreshData, t]);

  // Global ESC-to-close for top-most modal on this page
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key !== 'Escape') return;
      // Priority: confirmation overlays first, then details, then others
      if (showCancelModal) {
        setShowCancelModal(false); setCancelError(null); return;
      }
      if (showPackageDetailsModal) {
        setShowPackageDetailsModal(false); return;
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showCancelModal, showPackageDetailsModal]);

  // Prepare chart data
  const getChartData = () => {
    const pending = packages.filter(p => p.status === 'pending').length;
    const inTransit = packages.filter(p => ['assigned', 'pickedup', 'in-transit'].includes(p.status)).length;
    const delivered = packages.filter(p => p.status === 'delivered').length;

    return {
      labels: [
        t('shop.dashboard.stats.pending'),
        t('shop.dashboard.stats.inTransit'),
        t('shop.dashboard.stats.delivered')
      ],
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
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          boxWidth: 12,
          padding: 8,
          font: {
            size: 12
          }
        }
      }
    }
  };

  const sortedRecentPackages = packages
    .slice()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const totalRecentPages = Math.max(1, Math.ceil(sortedRecentPackages.length / recentPerPage));

  useEffect(() => {
    setRecentPage(prev => Math.min(prev, totalRecentPages));
  }, [totalRecentPages]);


  const handleCancel = async () => {
    if (!packageToCancel) return;
    try {
      await packageService.cancelPackage(packageToCancel.id);
      setRefreshData(Date.now());
      setShowCancelModal(false);
      setPackageToCancel(null);
      setCancelError(null);
    } catch (err) {
      setCancelError(err.response?.data?.message || t('shop.dashboard.errors.cancelPackage'));
    }
  };

  const handleStatClick = (tab) => {
    navigate(`/shop/packages?tab=${tab}`);
  };

  // State for menu (toggled only by button now)
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const dashboardContainerRef = useRef(null);

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

  const isDesktop = !isMobile;
  const isRtl = i18n.dir() === 'rtl';
  const showSidebar = isDesktop || isMenuOpen;
  const renderNavIcon = (iconKey) => {
    const iconProps = { width: 14, height: 14, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };
    switch (iconKey) {
      case 'dashboard':
        return <svg {...iconProps}><rect x="3" y="3" width="8" height="8" /><rect x="13" y="3" width="8" height="5" /><rect x="13" y="10" width="8" height="11" /><rect x="3" y="13" width="8" height="8" /></svg>;
      case 'packages':
        return <svg {...iconProps}><path d="M21 8V21H3V8" /><path d="M1 8L12 2L23 8" /><path d="M10 13H14" /></svg>;
      case 'newPackage':
        return <svg {...iconProps}><path d="M21 14V21H3V14" /><path d="M12 2V14" /><path d="M7 7H17" /></svg>;
      case 'pickup':
        return <svg {...iconProps}><path d="M3 16V6H15V16" /><path d="M15 10H19L21 13V16H15" /><circle cx="7" cy="17" r="2" /><circle cx="18" cy="17" r="2" /></svg>;
      case 'wallet':
        return <svg {...iconProps}><rect x="2" y="6" width="20" height="12" rx="2" /><path d="M16 12H22" /><circle cx="16" cy="12" r="1" /></svg>;
      case 'profile':
        return <svg {...iconProps}><circle cx="12" cy="8" r="4" /><path d="M4 21C4 17 7 15 12 15C17 15 20 17 20 21" /></svg>;
      default:
        return <svg {...iconProps}><circle cx="12" cy="12" r="9" /></svg>;
    }
  };

  const navItems = [
    { to: '/shop', label: t('shop.dashboard.nav.dashboard'), icon: 'dashboard', isActive: location.pathname === '/shop' },
    { to: '/shop/packages', label: t('shop.dashboard.nav.packages'), icon: 'packages', isActive: location.pathname.startsWith('/shop/packages') },
    { to: '/shop/create-package', label: t('shop.dashboard.nav.newPackage'), icon: 'newPackage', isActive: location.pathname === '/shop/create-package' },
    { to: '/shop/new-pickup', label: t('shop.dashboard.nav.newPickup'), icon: 'pickup', isActive: location.pathname === '/shop/new-pickup' },
    { to: '/shop/wallet', label: t('shop.dashboard.nav.wallet'), icon: 'wallet', isActive: location.pathname === '/shop/wallet' },
    { to: '/shop/profile', label: t('shop.dashboard.nav.profile'), icon: 'profile', isActive: location.pathname === '/shop/profile' }
  ];

  // Tutorial hint for first-time mobile users (one-time overlay)
  return (
    <ShopDashboardContext.Provider value={{ refreshDashboard }}>
      <div ref={dashboardContainerRef} className="position-relative" style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #fff4ea 0%, #ffe8d6 100%)' }}>
        {isMobile && isMenuOpen && (
          <div
            role="button"
            tabIndex={0}
            onClick={() => setIsMenuOpen(false)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setIsMenuOpen(false);
              }
            }}
            className="position-fixed start-0 w-100"
            style={{ backgroundColor: 'rgba(0,0,0,0.25)', zIndex: 1030, top: `${topNavOffset}px`, height: `calc(100vh - ${topNavOffset}px)` }}
          />
        )}

        {isMobile && (
          <button
            className="menu-fab position-fixed rounded-circle border-0 shadow"
            style={{
              [isRtl ? 'right' : 'left']: '14px',
              bottom: '18px',
              width: '52px',
              height: '52px',
              background: '#FF6B00',
              color: '#fff',
              zIndex: 1050,
              fontSize: '1.2rem',
              fontWeight: 700
            }}
            aria-label={isMenuOpen ? t('shop.dashboard.menu.close') : t('shop.dashboard.menu.open')}
            onClick={() => setIsMenuOpen(o => !o)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setIsMenuOpen(o => !o);
              }
            }}
          >
            {isMenuOpen ? '✕' : '☰'}
          </button>
        )}

        <aside
          className="position-fixed p-3 border-end"
          style={{
            width: '260px',
            background: 'linear-gradient(180deg, #fffaf5 0%, #fff2e7 100%)',
            borderColor: 'rgba(255, 107, 0, 0.2)',
            zIndex: 1040,
            top: `${topNavOffset + SIDEBAR_TOP_GAP}px`,
            height: `calc(100vh - ${topNavOffset + SIDEBAR_TOP_GAP}px)`,
            overflowY: 'auto',
            transform: showSidebar ? 'translateX(0)' : `translateX(${isRtl ? '100%' : '-100%'})`,
            [isRtl ? 'right' : 'left']: 0,
            transition: 'transform 0.25s ease'
          }}
        >
          <div className="rounded-4 p-3 mb-4 mt-1 shadow-sm" style={{ background: 'linear-gradient(135deg, #ff7a3d 0%, #fa8831 30%, #d37d57 64%, #7095cf 100%)' }}>
            <small className="text-white-50 fw-semibold text-uppercase" style={{ letterSpacing: '0.08em', fontSize: '0.68rem' }}>{t('shop.dashboard.labels.droppin')}</small>
            <h2 className="h5 fw-bold text-white mb-1">{t('shop.dashboard.nav.menuTitle')}</h2>
            <small className="text-white" style={{ opacity: 0.9 }}>{t('shop.dashboard.nav.menuSubtitle')}</small>
          </div>

          <nav className="d-flex flex-column gap-2">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setIsMenuOpen(false)}
                className="text-decoration-none"
                style={{
                  borderRadius: '14px',
                  padding: '0.62rem 0.72rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.62rem',
                  fontWeight: 700,
                  fontSize: '0.92rem',
                  letterSpacing: '0.01em',
                  background: item.isActive ? 'linear-gradient(135deg, #ff7a3d 0%, #fa8831 65%, #f5aa62 100%)' : 'rgba(255,255,255,0.85)',
                  color: item.isActive ? '#ffffff' : '#4b5563',
                  border: item.isActive ? '1px solid rgba(255,122,61,0.55)' : '1px solid rgba(255, 107, 0, 0.16)',
                  boxShadow: item.isActive ? '0 8px 20px rgba(255,122,61,0.25)' : '0 1px 3px rgba(15,23,42,0.06)'
                }}
              >
                <span
                  className="d-inline-flex align-items-center justify-content-center"
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '9px',
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    background: item.isActive ? 'rgba(255,255,255,0.22)' : '#ff6b00',
                    color: '#ffffff'
                  }}
                >
                  {renderNavIcon(item.icon)}
                </span>
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
        </aside>

        <main
          style={{
            marginLeft: isDesktop && !isRtl ? '260px' : '0',
            marginRight: isDesktop && isRtl ? '260px' : '0',
            transition: 'margin 0.25s ease'
          }}
        >
          <Routes>
          <Route path="create-package" element={<CreatePackage />} />
          <Route path="packages" element={<ShopPackages />} />
          <Route path="packages/bulk-import" element={<BulkImportPackages />} />
          <Route path="profile" element={<ShopProfile />} />
          <Route path="new-pickup" element={<NewPickup />} />
          <Route path="wallet" element={<Wallet />} />
          <Route path="*" element={
            <div className="container-fluid px-3 px-md-4 py-4" style={{ maxWidth: '1400px' }}>
              <div className="rounded-4 shadow-sm p-4 p-md-5 mb-4 text-white" style={{ background: 'linear-gradient(135deg, #ff7a3d 0%, #fa8831 28%, #cd7955 52%, #9d8f8d 74%, #4e97ef 100%)' }}>
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-start gap-3">
                  <div>
                    <h1 className="h3 fw-bold mb-1">{t('shop.dashboard.hero.welcome', { name: currentUser?.name || t('shop.dashboard.hero.defaultOwner') })}</h1>
                    <p className="mb-0" style={{ color: '#f8fafc' }}>{t('shop.dashboard.hero.subtitle')}</p>
                  </div>
                  <div className="text-md-end">
                    <div className="fw-semibold">{currentUser?.businessName || t('shop.dashboard.hero.defaultBusiness')}</div>
                    <small style={{ color: '#f8fafc' }}>{t('shop.dashboard.hero.accountType')}</small>
                  </div>
                </div>
              </div>
              
              <div className="row g-4 mb-4">
                <div className="col-lg-7">
                  <div className="row g-3">
                    <div className="col-6 col-md-3">
                      <button type="button" className="w-100 border-0 rounded-4 p-3 shadow-sm text-start" style={{ background: '#fffaf5' }} onClick={() => handleStatClick('pending')}>
                        <div className="h4 fw-bold mb-0" style={{ color: '#FF6B00' }}>{packages.filter(p => p.status === 'pending').length}</div>
                        <small className="text-muted">{t('shop.dashboard.stats.pending')}</small>
                      </button>
                    </div>
                    <div className="col-6 col-md-3">
                      <button type="button" className="w-100 border-0 rounded-4 p-3 shadow-sm text-start" style={{ background: '#fffaf5' }} onClick={() => handleStatClick('in-transit')}>
                        <div className="h4 fw-bold mb-0" style={{ color: '#FF6B00' }}>{packages.filter(p => ['assigned', 'pickedup', 'in-transit'].includes(p.status)).length}</div>
                        <small className="text-muted">{t('shop.dashboard.stats.inTransit')}</small>
                      </button>
                    </div>
                    <div className="col-6 col-md-3">
                      <button type="button" className="w-100 border-0 rounded-4 p-3 shadow-sm text-start" style={{ background: '#fffaf5' }} onClick={() => handleStatClick('delivered')}>
                        <div className="h4 fw-bold mb-0" style={{ color: '#FF6B00' }}>{packages.filter(p => p.status === 'delivered').length}</div>
                        <small className="text-muted">{t('shop.dashboard.stats.delivered')}</small>
                      </button>
                    </div>
                    <div className="col-6 col-md-3">
                      <button type="button" className="w-100 border-0 rounded-4 p-3 shadow-sm text-start" style={{ background: '#fffaf5' }} onClick={() => handleStatClick('all')}>
                        <div className="h4 fw-bold mb-0" style={{ color: '#FF6B00' }}>{packages.length}</div>
                        <small className="text-muted">{t('shop.dashboard.stats.total')}</small>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="col-lg-5">
                  <div className="rounded-4 shadow-sm p-4" style={{ background: '#fffaf5' }}>
                    <h3 className="h6 fw-bold mb-3">{t('shop.dashboard.stats.distribution')}</h3>
                    <div style={{ height: '220px' }}>
                      <Pie data={getChartData()} options={chartOptions} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="row g-3 mb-4">
                <div className="col-md-4">
                  <div className="rounded-4 shadow-sm p-3" style={{ background: '#fffaf5' }}>
                    <div className="h5 fw-bold mb-0" style={{ color: '#235789' }}>EGP {(parseFloat(financialStats.rawToCollect || 0)).toFixed(2)}</div>
                    <small className="text-muted">{t('shop.dashboard.finance.toCollect')}</small>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="rounded-4 shadow-sm p-3" style={{ background: '#fffaf5' }}>
                    <div className="h5 fw-bold mb-0" style={{ color: '#235789' }}>EGP {(parseFloat(financialStats.rawTotalCollected || 0)).toFixed(2)}</div>
                    <small className="text-muted">{t('shop.dashboard.finance.collectedWaitingWithdraw')}</small>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="rounded-4 shadow-sm p-3" style={{ background: '#fffaf5' }}>
                    <div className="h5 fw-bold mb-0" style={{ color: '#235789' }}>EGP {(parseFloat(financialStats.rawSettelled || 0)).toFixed(2)}</div>
                    <small className="text-muted">{t('shop.dashboard.finance.settled')}</small>
                  </div>
                </div>
              </div>

              <div className="rounded-4 shadow-sm p-3 p-md-4" style={{ background: '#fffaf5' }}>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h2 className="h5 fw-bold mb-0">{t('shop.dashboard.recent.title')}</h2>
                  <div className="d-flex align-items-center gap-2 flex-wrap justify-content-end">
                    <div className="d-flex align-items-center gap-2">
                      <small className="text-muted">{t('shop.dashboard.recent.rows')}</small>
                      <select
                        className="form-select form-select-sm"
                        style={{ width: '90px' }}
                        value={recentPerPage}
                        onChange={(e) => {
                          setRecentPerPage(Number(e.target.value));
                          setRecentPage(1);
                        }}
                      >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={15}>15</option>
                      </select>
                    </div>
                    {totalRecentPages > 1 && (
                      <div className="d-flex align-items-center gap-2">
                        <small className="text-muted">{t('shop.dashboard.recent.page')}</small>
                        <select
                          className="form-select form-select-sm"
                          style={{ width: '110px' }}
                          value={recentPage}
                          onChange={(e) => setRecentPage(Number(e.target.value))}
                        >
                          {Array.from({ length: totalRecentPages }, (_, i) => i + 1).map(page => (
                            <option key={page} value={page}>{page} / {totalRecentPages}</option>
                          ))}
                        </select>
                      </div>
                    )}
                    <Link to="/shop/packages" className="btn btn-sm btn-outline-primary">{t('shop.dashboard.recent.viewAll')}</Link>
                  </div>
                </div>
                {loading ? (
                  <div className="text-center py-4">{t('shop.dashboard.recent.loading')}</div>
                ) : error ? (
                  <div className="alert alert-danger py-2 mb-0">{error}</div>
                ) : packages.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="mb-3">{t('shop.dashboard.recent.emptyTitle')}</p>
                    <Link to="/shop/create-package" className="btn btn-primary">{t('shop.dashboard.recent.createPackage')}</Link>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table align-middle mb-0">
                      <tbody>
                        {sortedRecentPackages
                          .slice((recentPage - 1) * recentPerPage, recentPage * recentPerPage)
                          .map(pkg => (
                            <tr key={pkg.id} style={{ cursor: 'pointer' }} onClick={e => {
                              if (e.target.closest('button')) return;
                              setSelectedPackage(pkg);
                              setShowPackageDetailsModal(true);
                            }}>
                              <td style={{ minWidth: '130px' }}><strong>{pkg.trackingNumber || t('shop.dashboard.recent.na')}</strong></td>
                              <td style={{ minWidth: '260px' }}>
                                <div>{pkg.packageDescription || t('shop.dashboard.recent.noDescription')}</div>
                                <div className="small text-muted">{pkg.deliveryAddress || t('shop.dashboard.recent.noAddress')}</div>
                                {(pkg.deliveryContactName || pkg.deliveryContactPhone) && (
                                  <div className="small text-secondary">
                                    {pkg.deliveryContactName || t('shop.dashboard.recent.na')}{pkg.deliveryContactPhone ? ` · ${pkg.deliveryContactPhone}` : ''}
                                  </div>
                                )}
                              </td>
                              <td>{pkg.deliveryContactName || t('shop.dashboard.recent.na')}</td>
                              <td>{getStatusBadge(pkg.status)}</td>
                              <td>
                                <span className="me-2">EGP {parseFloat(pkg.codAmount || 0).toFixed(2)}</span>
                                {getCodBadge(pkg.isPaid)}
                              </td>
                              <td>{new Date(pkg.createdAt).toLocaleDateString()}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          } />
        </Routes>
        </main>
      </div>
      <SwipeMenuHint isMenuOpen={isMenuOpen} />
      {showCancelModal && (
        <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }} onClick={() => { setShowCancelModal(false); setCancelError(null); }}>
          <div className="modal-dialog modal-dialog-centered" onClick={e => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{t('shop.dashboard.modals.cancelPackageTitle')}</h5>
                <button type="button" className="btn-close" onClick={() => { setShowCancelModal(false); setCancelError(null); }}></button>
              </div>
              <div className="modal-body">
                <p>{t('shop.dashboard.modals.cancelPackageConfirm')}</p>
                {cancelError && <div className="alert alert-danger py-2 mb-0">{cancelError}</div>}
              </div>
              <div className="modal-footer">
                <button className="btn btn-outline-secondary" onClick={() => { setShowCancelModal(false); setCancelError(null); }}>{t('shop.dashboard.actions.no')}</button>
                <button className="btn btn-danger" onClick={handleCancel}>{t('shop.dashboard.actions.yesCancel')}</button>
              </div>
            </div>
          </div>
        </div>
      )}
      {showPackageDetailsModal && selectedPackage && (
        <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }} onClick={() => setShowPackageDetailsModal(false)}>
          <div className="modal-dialog modal-dialog-centered modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{t('shop.dashboard.modals.packageDetailsTitle')}</h5>
                <button type="button" className="btn-close" onClick={() => setShowPackageDetailsModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="row g-3">
                  <div className="col-md-6"><small className="text-muted d-block">{t('shop.dashboard.details.trackingNumber')}</small><span>{selectedPackage.trackingNumber}</span></div>
                  <div className="col-md-6"><small className="text-muted d-block">{t('shop.dashboard.details.status')}</small><span>{getStatusBadge(selectedPackage.status)}</span></div>
                  <div className="col-md-6"><small className="text-muted d-block">{t('shop.dashboard.details.created')}</small><span>{new Date(selectedPackage.createdAt).toLocaleString()}</span></div>
                  <div className="col-12"><small className="text-muted d-block">{t('shop.dashboard.details.description')}</small><span>{selectedPackage.packageDescription || t('shop.dashboard.details.noDescription')}</span></div>
                  <div className="col-md-6"><small className="text-muted d-block">{t('shop.dashboard.details.recipient')}</small><span>{selectedPackage.deliveryContactName || t('shop.dashboard.recent.na')}</span></div>
                  {selectedPackage.deliveryContactPhone && (
                    <div className="col-md-6"><small className="text-muted d-block">{t('shop.dashboard.details.recipientPhone')}</small><span>{selectedPackage.deliveryContactPhone}</span></div>
                  )}
                  {selectedPackage.deliveryAddress && (
                    <div className="col-12"><small className="text-muted d-block">{t('shop.dashboard.details.deliveryAddress')}</small><span>{selectedPackage.deliveryAddress}</span></div>
                  )}
                  <div className="col-md-6"><small className="text-muted d-block">{t('shop.dashboard.details.cod')}</small><span>EGP {parseFloat(selectedPackage.codAmount || 0).toFixed(2)} {getCodBadge(selectedPackage.isPaid)}</span></div>
                  <div className="col-md-6"><small className="text-muted d-block">{t('shop.dashboard.details.deliveryCost')}</small><span>EGP {parseFloat(selectedPackage.deliveryCost || 0).toFixed(2)}</span></div>
                  {selectedPackage.rejectionShippingPaidAmount !== undefined && selectedPackage.rejectionShippingPaidAmount !== null && (
                    <div className="col-md-6"><small className="text-muted d-block">{t('shop.dashboard.details.rejectionShippingFeesPaid')}</small><span>EGP {parseFloat(selectedPackage.rejectionShippingPaidAmount || 0).toFixed(2)}</span></div>
                  )}
                  {selectedPackage.weight && (
                    <div className="col-md-6"><small className="text-muted d-block">{t('shop.dashboard.details.weight')}</small><span>{selectedPackage.weight} kg</span></div>
                  )}
                  {selectedPackage.dimensions && (
                    <div className="col-md-6"><small className="text-muted d-block">{t('shop.dashboard.details.dimensions')}</small><span>{selectedPackage.dimensions}</span></div>
                  )}
                  {selectedPackage.notes && (
                    <div className="col-12"><small className="text-muted d-block">{t('shop.dashboard.details.notes')}</small><span>{selectedPackage.notes}</span></div>
                  )}
                  {selectedPackage.shopNotes && (
                    <div className="col-12"><small className="text-muted d-block">{t('shop.dashboard.details.shopNotes')}</small><span>{selectedPackage.shopNotes}</span></div>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-outline-secondary" onClick={() => setShowPackageDetailsModal(false)}>{t('shop.dashboard.actions.close')}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </ShopDashboardContext.Provider>
  );
};

export default ShopDashboard;
