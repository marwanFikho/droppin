import React, { useEffect, useState } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { packageService } from '../../services/api';
import './MobileShopDashboard.css';
import { useTranslation } from 'react-i18next';

const MobileShopDashboard = () => {
  const { currentUser } = useAuth();
  const [dashboardStats, setDashboardStats] = useState({
    totalPackages: 0,
    pendingPickup: 0,
    inTransit: 0,
    delivered: 0,
    todayRevenue: 0
  });
  const [toCollect, setToCollect] = useState(0);
  const [collectedCOD, setCollectedCOD] = useState(0);
  const [recentPackages, setRecentPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch all packages for this shop
        const packagesRes = await packageService.getPackages({ limit: 10000 });
        const pkgs = packagesRes.data?.packages || packagesRes.data || [];
        // Calculate stats
        const totalPackages = pkgs.length;
        const pendingPickup = pkgs.filter(pkg => pkg.status === 'pending' || pkg.status === 'awaiting_schedule' || pkg.status === 'scheduled_for_pickup').length;
        const inTransit = pkgs.filter(pkg => ['assigned', 'pickedup', 'in-transit'].includes(pkg.status)).length;
        const delivered = pkgs.filter(pkg => pkg.status === 'delivered').length;
        const today = new Date().toISOString().slice(0, 10);
        const todayRevenue = pkgs
          .filter(pkg => pkg.status === 'delivered' && pkg.actualDeliveryTime && pkg.actualDeliveryTime.slice(0, 10) === today)
          .reduce((sum, pkg) => sum + (parseFloat(pkg.codAmount) || 0), 0);
        setDashboardStats({ totalPackages, pendingPickup, inTransit, delivered, todayRevenue });
        // Fetch shop profile for ToCollect and Collected COD
        const shopProfileRes = await packageService.getShopProfile();
        const shop = shopProfileRes.data;
        setToCollect(parseFloat(shop.ToCollect || shop.rawToCollect || 0));
        setCollectedCOD(parseFloat(shop.TotalCollected || shop.rawTotalCollected || 0));
        // Sort by createdAt descending and take the most recent 5
        const sortedPkgs = [...pkgs].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setRecentPackages(sortedPkgs.slice(0, 5));
      } catch (err) {
        setError(t('shop.dashboard.error.loadData'));
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const quickActions = [
    {
      title: t('shop.dashboard.quickActions.createPackage'),
      description: t('shop.dashboard.quickActions.createPackageDesc'),
      icon: '📦',
      link: '/shop/create-package',
      color: '#007bff'
    },
    {
      title: t('shop.dashboard.quickActions.viewPackages'),
      description: t('shop.dashboard.quickActions.viewPackagesDesc'),
      icon: '📋',
      link: '/shop/packages',
      color: '#28a745'
    },
    {
      title: t('shop.dashboard.quickActions.newPickup'),
      description: t('shop.dashboard.quickActions.newPickupDesc'),
      icon: '🚚',
      link: '/shop/new-pickup',
      color: '#ffc107'
    }
  ];

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'delivered':
        return '#28a745';
      case 'in-transit':
      case 'assigned':
      case 'pickedup':
        return '#007bff';
      case 'pending':
      case 'awaiting_schedule':
      case 'scheduled_for_pickup':
        return '#ffc107';
      default:
        return '#6c757d';
    }
  };

  return (
    <div className="mobile-shop-dashboard" style={{marginTop: '2rem'}}>
      <div className="mobile-shop-dashboard-container">
        {/* Dashboard Header */}
        <div className="mobile-shop-dashboard-header">
          <div className="mobile-shop-dashboard-welcome">
            <h1 className="mobile-shop-dashboard-title">{t('shop.dashboard.title')}</h1>
            <p className="mobile-shop-dashboard-subtitle">
              {t('shop.dashboard.welcome', { name: currentUser?.shopInfo?.shopName || t('shop.dashboard.defaultShopOwner') })}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="mobile-shop-dashboard-icon">🏪</div>
            <button
              className="mobile-shop-profile-btn"
              style={{ background: 'none', border: 'none', fontSize: 28, cursor: 'pointer', marginLeft: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}
              onClick={() => navigate('/shop/profile')}
              aria-label="Profile"
            >
              <span>👤</span>
              <span style={{ fontSize: 12, color: '#007bff', marginTop: 2, fontWeight: 500 }}>{t('shop.dashboard.showProfile')}</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="mobile-shop-dashboard-loading">{t('shop.dashboard.loading')}</div>
        ) : error ? (
          <div className="mobile-shop-dashboard-error">{error}</div>
        ) : (
          <>
            {/* Stats Overview */}
            <div className="mobile-shop-dashboard-stats">
              <div className="mobile-shop-dashboard-stat">
                <div className="mobile-shop-dashboard-stat-icon" style={{ backgroundColor: '#007bff' }}>
                  📦
                </div>
                <div className="mobile-shop-dashboard-stat-content">
                  <div className="mobile-shop-dashboard-stat-number">{dashboardStats.totalPackages}</div>
                  <div className="mobile-shop-dashboard-stat-label">{t('shop.dashboard.stats.totalPackages')}</div>
                </div>
              </div>
              <div className="mobile-shop-dashboard-stat">
                <div className="mobile-shop-dashboard-stat-icon" style={{ backgroundColor: '#ffc107' }}>
                  ⏳
                </div>
                <div className="mobile-shop-dashboard-stat-content">
                  <div className="mobile-shop-dashboard-stat-number">{dashboardStats.pendingPickup}</div>
                  <div className="mobile-shop-dashboard-stat-label">{t('shop.dashboard.stats.pendingPickup')}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12, width: '100%' }}>
                <div className="mobile-shop-dashboard-stat" style={{ flex: 1 }}>
                  <div className="mobile-shop-dashboard-stat-icon" style={{ backgroundColor: '#ff9800' }}>
                    💵
                  </div>
                  <div className="mobile-shop-dashboard-stat-content">
                    <div className="mobile-shop-dashboard-stat-number">${toCollect}</div>
                    <div className="mobile-shop-dashboard-stat-label">{t('shop.dashboard.stats.toCollect')}</div>
                  </div>
                </div>
                <div className="mobile-shop-dashboard-stat" style={{ flex: 1 }}>
                  <div className="mobile-shop-dashboard-stat-icon" style={{ backgroundColor: '#4caf50' }}>
                    🪙
                  </div>
                  <div className="mobile-shop-dashboard-stat-content">
                    <div className="mobile-shop-dashboard-stat-number">${collectedCOD}</div>
                    <div className="mobile-shop-dashboard-stat-label">{t('shop.dashboard.stats.collectedCOD')}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mobile-shop-dashboard-section">
              <h2 className="mobile-shop-dashboard-section-title">{t('shop.dashboard.quickActions.title')}</h2>
              <div className="mobile-shop-dashboard-actions">
                {quickActions.map((action, index) => (
                  <Link
                    key={index}
                    to={action.link}
                    className="mobile-shop-dashboard-action"
                  >
                    <div 
                      className="mobile-shop-dashboard-action-icon"
                      style={{ backgroundColor: action.color }}
                    >
                      {action.icon}
                    </div>
                    <div className="mobile-shop-dashboard-action-content">
                      <h3 className="mobile-shop-dashboard-action-title">{action.title}</h3>
                      <p className="mobile-shop-dashboard-action-description">{action.description}</p>
                    </div>
                    <div className="mobile-shop-dashboard-action-arrow">→</div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Recent Packages */}
            <div className="mobile-shop-dashboard-section">
              <div className="mobile-shop-dashboard-section-header">
                <h2 className="mobile-shop-dashboard-section-title">{t('shop.dashboard.recentPackages')}</h2>
                <Link to="/shop/packages" className="mobile-shop-dashboard-section-link">
                  {t('shop.dashboard.viewAll')}
                </Link>
              </div>
              <div className="mobile-shop-dashboard-packages">
                {recentPackages.length === 0 ? (
                  <div className="mobile-shop-dashboard-no-packages">{t('shop.dashboard.noRecentPackages')}</div>
                ) : (
                  recentPackages.map((pkg, index) => (
                    <div key={index} className="mobile-shop-dashboard-package">
                      <div className="mobile-shop-dashboard-package-header">
                        <div className="mobile-shop-dashboard-package-id">{pkg.trackingNumber}</div>
                        <div 
                          className="mobile-shop-dashboard-package-status"
                          style={{ color: getStatusColor(pkg.status) }}
                        >
                          {t(`shop.dashboard.status.${pkg.status}`, pkg.status)}
                        </div>
                      </div>
                      <div className="mobile-shop-dashboard-package-details">
                        <div className="mobile-shop-dashboard-package-tracking">
                          <strong>{t('shop.dashboard.description')}:</strong> {pkg.packageDescription}
                        </div>
                        <div className="mobile-shop-dashboard-package-tracking">
                          <strong>{t('shop.dashboard.recipient')}:</strong> {pkg.deliveryContactName || pkg.deliveryAddress?.contactName || '-'}
                        </div>
                        <div className="mobile-shop-dashboard-package-date">
                          <strong>{t('shop.dashboard.date')}:</strong> {pkg.createdAt ? new Date(pkg.createdAt).toLocaleDateString() : '-'}
                        </div>
                      </div>
                      <button
                        onClick={() => navigate(`/track/${pkg.trackingNumber}`)}
                        className="mobile-shop-dashboard-package-track-btn"
                      >
                        {t('shop.dashboard.trackPackage')}
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
        {/* Dashboard Content */}
        <Outlet />
      </div>
    </div>
  );
};

export default MobileShopDashboard; 