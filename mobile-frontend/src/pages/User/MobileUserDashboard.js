import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './MobileUserDashboard.css';
import { useTranslation } from 'react-i18next';

const MobileUserDashboard = () => {
  const { currentUser } = useAuth();
  const { t } = useTranslation();

  // Mock data - replace with actual API calls
  const dashboardStats = {
    totalOrders: 12,
    activeOrders: 3,
    completedOrders: 9,
    totalSpent: 850.00
  };

  const recentOrders = [
    {
      id: 'ORD001',
      trackingNumber: 'TRK123456789',
      shop: 'ABC Electronics',
      status: 'In Transit',
      date: '2024-01-12',
      amount: 125.00
    },
    {
      id: 'ORD002',
      trackingNumber: 'TRK123456790',
      shop: 'XYZ Clothing',
      status: 'Delivered',
      date: '2024-01-10',
      amount: 89.99
    },
    {
      id: 'ORD003',
      trackingNumber: 'TRK123456791',
      shop: 'Home Goods Store',
      status: 'Pending Pickup',
      date: '2024-01-11',
      amount: 45.50
    }
  ];

  const quickActions = [
    {
      title: t('user.dashboard.quickActions.trackOrders'),
      description: t('user.dashboard.quickActions.trackOrdersDesc'),
      icon: '📦',
      link: '/user/orders',
      color: '#007bff'
    },
    {
      title: t('user.dashboard.quickActions.orderHistory'),
      description: t('user.dashboard.quickActions.orderHistoryDesc'),
      icon: '📋',
      link: '/user/history',
      color: '#28a745'
    },
    {
      title: t('user.dashboard.quickActions.trackPackage'),
      description: t('user.dashboard.quickActions.trackPackageDesc'),
      icon: '🔍',
      link: '/track',
      color: '#ffc107'
    },
    {
      title: t('user.dashboard.quickActions.profile'),
      description: t('user.dashboard.quickActions.profileDesc'),
      icon: '👤',
      link: '/user/profile',
      color: '#6c757d'
    }
  ];

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case t('user.dashboard.status.delivered').toLowerCase():
        return '#28a745';
      case t('user.dashboard.status.inTransit').toLowerCase():
        return '#007bff';
      case t('user.dashboard.status.pendingPickup').toLowerCase():
        return '#ffc107';
      default:
        return '#6c757d';
    }
  };

  return (
    <div className="mobile-user-dashboard">
      <div className="mobile-user-dashboard-container">
        {/* Dashboard Header */}
        <div className="mobile-user-dashboard-header">
          <div className="mobile-user-dashboard-welcome">
            <h1 className="mobile-user-dashboard-title">{t('user.dashboard.title')}</h1>
            <p className="mobile-user-dashboard-subtitle">
              {t('user.dashboard.welcome', { name: currentUser?.name || t('user.dashboard.defaultUser') })}
            </p>
          </div>
          <div className="mobile-user-dashboard-icon">👤</div>
        </div>

        {/* Stats Overview */}
        <div className="mobile-user-dashboard-stats">
          <div className="mobile-user-dashboard-stat">
            <div className="mobile-user-dashboard-stat-icon" style={{ backgroundColor: '#007bff' }}>
              📦
            </div>
            <div className="mobile-user-dashboard-stat-content">
              <div className="mobile-user-dashboard-stat-number">{dashboardStats.totalOrders}</div>
              <div className="mobile-user-dashboard-stat-label">{t('user.dashboard.stats.totalOrders')}</div>
            </div>
          </div>
          
          <div className="mobile-user-dashboard-stat">
            <div className="mobile-user-dashboard-stat-icon" style={{ backgroundColor: '#ffc107' }}>
              ⏳
            </div>
            <div className="mobile-user-dashboard-stat-content">
              <div className="mobile-user-dashboard-stat-number">{dashboardStats.activeOrders}</div>
              <div className="mobile-user-dashboard-stat-label">{t('user.dashboard.stats.activeOrders')}</div>
            </div>
          </div>
          
          <div className="mobile-user-dashboard-stat">
            <div className="mobile-user-dashboard-stat-icon" style={{ backgroundColor: '#28a745' }}>
              💰
            </div>
            <div className="mobile-user-dashboard-stat-content">
              <div className="mobile-user-dashboard-stat-number">${dashboardStats.totalSpent}</div>
              <div className="mobile-user-dashboard-stat-label">{t('user.dashboard.stats.totalSpent')}</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mobile-user-dashboard-section">
          <h2 className="mobile-user-dashboard-section-title">{t('user.dashboard.quickActions.title')}</h2>
          <div className="mobile-user-dashboard-actions">
            {quickActions.map((action, index) => (
              <Link
                key={index}
                to={action.link}
                className="mobile-user-dashboard-action"
              >
                <div 
                  className="mobile-user-dashboard-action-icon"
                  style={{ backgroundColor: action.color }}
                >
                  {action.icon}
                </div>
                <div className="mobile-user-dashboard-action-content">
                  <h3 className="mobile-user-dashboard-action-title">{action.title}</h3>
                  <p className="mobile-user-dashboard-action-description">{action.description}</p>
                </div>
                <div className="mobile-user-dashboard-action-arrow">→</div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="mobile-user-dashboard-section">
          <div className="mobile-user-dashboard-section-header">
            <h2 className="mobile-user-dashboard-section-title">{t('user.dashboard.recentOrders')}</h2>
            <Link to="/user/orders" className="mobile-user-dashboard-section-link">
              {t('user.dashboard.viewAll')}
            </Link>
          </div>
          
          <div className="mobile-user-dashboard-orders">
            {recentOrders.map((order, index) => (
              <div key={index} className="mobile-user-dashboard-order">
                <div className="mobile-user-dashboard-order-header">
                  <div className="mobile-user-dashboard-order-id">{order.id}</div>
                  <div 
                    className="mobile-user-dashboard-order-status"
                    style={{ color: getStatusColor(order.status) }}
                  >
                    {t(`user.dashboard.status.${order.status.replace(/\s+/g, '').toLowerCase()}`, order.status)}
                  </div>
                </div>
                
                <div className="mobile-user-dashboard-order-details">
                  <div className="mobile-user-dashboard-order-shop">
                    <strong>{t('user.dashboard.shop')}:</strong> {order.shop}
                  </div>
                  <div className="mobile-user-dashboard-order-tracking">
                    <strong>{t('user.dashboard.tracking')}:</strong> {order.trackingNumber}
                  </div>
                  <div className="mobile-user-dashboard-order-date">
                    <strong>{t('user.dashboard.date')}:</strong> {order.date}
                  </div>
                  <div className="mobile-user-dashboard-order-amount">
                    <strong>{t('user.dashboard.amount')}:</strong> ${order.amount}
                  </div>
                </div>
                
                <div className="mobile-user-dashboard-order-actions">
                  <Link 
                    to={`/track/${order.trackingNumber}`}
                    className="mobile-user-dashboard-order-track-btn"
                  >
                    {t('user.dashboard.trackOrder')}
                  </Link>
                  <Link 
                    to={`/user/orders/${order.id}`}
                    className="mobile-user-dashboard-order-details-btn"
                  >
                    {t('user.dashboard.viewDetails')}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileUserDashboard; 