import React, { useState, useEffect, useCallback } from 'react';
import { Link, Route, Routes, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { adminService, packageService } from '../../services/api';
import './MobileAdminDashboard.css';
import { useTranslation } from 'react-i18next';

const MobileAdminDashboard = () => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashboardStats, setDashboardStats] = useState({
    users: { total: 0, shops: 0, drivers: 0 },
    packages: { total: 0, pending: 0, inTransit: 0, delivered: 0 },
    revenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [users, setUsers] = useState([]);
  const [userSubTab, setUserSubTab] = useState('all');
  const [packages, setPackages] = useState([]);
  const [packageSubTab, setPackageSubTab] = useState('all');
  const [pickups, setPickups] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedPackages, setSelectedPackages] = useState([]);
  const [showBulkAssignModal, setShowBulkAssignModal] = useState(false);
  const [drivers, setDrivers] = useState([]);
  const [bulkAssignDriverId, setBulkAssignDriverId] = useState('');
  const [driverSearchTerm, setDriverSearchTerm] = useState('');
  const [isBulkAssigning, setIsBulkAssigning] = useState(false);
  const [selectedPickup, setSelectedPickup] = useState(null);
  const [showPickupDetailsModal, setShowPickupDetailsModal] = useState(false);
  const [pickupPackages, setPickupPackages] = useState([]);
  const [pickupPackagesLoading, setPickupPackagesLoading] = useState(false);
  const [recentActivities, setRecentActivities] = useState([]);
  const [settleShop, setSettleShop] = useState(null);
  const [moneyTransactions, setMoneyTransactions] = useState([]);
  const [moneyFilters, setMoneyFilters] = useState({ startDate: '', endDate: '', search: '' });
  const [selectedUser, setSelectedUser] = useState(null);
  const [shopPackages, setShopPackages] = useState([]);
  const [loadingShopPackages, setLoadingShopPackages] = useState(false);
  const [selectedAdminPackage, setSelectedAdminPackage] = useState(null);
  const [showAssignDriverModal, setShowAssignDriverModal] = useState(false);
  const [assignDriverLoading, setAssignDriverLoading] = useState(false);
  const [assignDriverSearch, setAssignDriverSearch] = useState('');
  const [assignDriverId, setAssignDriverId] = useState('');
  const [editingNotes, setEditingNotes] = useState('');
  const [notesSaving, setNotesSaving] = useState(false);
  const [notesError, setNotesError] = useState(null);
  const [showRejectConfirmation, setShowRejectConfirmation] = useState(false);
  const [packageToReject, setPackageToReject] = useState(null);
  const [driverPackages, setDriverPackages] = useState([]);
  const [loadingDriverPackages, setLoadingDriverPackages] = useState(false);
  const { t, i18n } = useTranslation();
  const [lang, setLang] = React.useState(i18n.language || 'en');
  const [adjustTotalCollectedInput, setAdjustTotalCollectedInput] = useState('');
  const [adjustTotalCollectedReason, setAdjustTotalCollectedReason] = useState('');
  const [adjustingTotalCollected, setAdjustingTotalCollected] = useState(false);
  const [adjustTotalCollectedStatus, setAdjustTotalCollectedStatus] = useState(null);

  const navigate = useNavigate();

  const handleLanguageChange = () => {
    const newLang = lang === 'en' ? 'ar' : 'en';
    i18n.changeLanguage(newLang);
    setLang(newLang);
  };

  const fetchPickups = useCallback(async () => {
    if (activeTab !== 'pickups') return;

    try {
      setLoading(true);
      const response = await adminService.getAllPickups();
      setPickups(response.data || []);
    } catch (err) {
      setError('Failed to fetch pickups.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  const fetchPackages = useCallback(async () => {
    if (activeTab !== 'packages') return;

    try {
      setLoading(true);
      const [packagesResponse, driversResponse] = await Promise.all([
        adminService.getPackages(),
        adminService.getDrivers()
      ]);
      
      setDrivers(driversResponse.data || []);
      let filteredPackages = packagesResponse.data || [];
      if (packageSubTab !== 'all') {
        if (packageSubTab === 'ready-to-assign') {
          filteredPackages = filteredPackages.filter(pkg => pkg.status === 'pending');
        } else if (packageSubTab === 'assigned') {
          filteredPackages = filteredPackages.filter(pkg => pkg.status === 'assigned');
        } else if (packageSubTab === 'return-to-shop') {
          const returnToShopStatuses = ['cancelled-awaiting-return', 'cancelled-returned', 'rejected-awaiting-return', 'rejected-returned'];
          filteredPackages = filteredPackages.filter(pkg => returnToShopStatuses.includes(pkg.status));
        } else if (packageSubTab === 'in-transit') {
          const inTransitStatuses = ['pickedup', 'in-transit'];
          filteredPackages = filteredPackages.filter(pkg => inTransitStatuses.includes(pkg.status));
        } else {
          filteredPackages = filteredPackages.filter(pkg => pkg.status === packageSubTab);
        }
      }
      setPackages(filteredPackages);
    } catch (err) {
      setError('Failed to fetch packages.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [activeTab, packageSubTab]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const statsResponse = await adminService.getDashboardStats();
        if (statsResponse.data) {
          setDashboardStats(statsResponse.data);
        }
        // Fetch real recent activities
        const activitiesRes = await adminService.getRecentActivities();
        setRecentActivities(activitiesRes.data || []);
      } catch (err) {
        setError('Failed to fetch dashboard data.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  useEffect(() => {
    const fetchUsers = async () => {
      if (activeTab !== 'users') return;

      try {
        setLoading(true);
        let response;
        switch (userSubTab) {
          case 'pending':
            response = await adminService.getPendingApprovals();
            break;
          case 'shops':
            response = await adminService.getShops();
            break;
          case 'drivers':
            response = await adminService.getDrivers();
            break;
          default:
            // Fetch all users (you might need to implement this endpoint in your backend)
            const shops = await adminService.getShops();
            const drivers = await adminService.getDrivers();
            const pending = await adminService.getPendingApprovals();
            response = { data: [...(shops.data || []), ...(drivers.data || []), ...(pending.data || [])] };
            break;
        }
        setUsers(response.data || []);
      } catch (err) {
        setError('Failed to fetch users.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [activeTab, userSubTab]);

  useEffect(() => {
    fetchPackages();
  }, [fetchPackages]);

  useEffect(() => {
    fetchPickups();
  }, [fetchPickups]);

  useEffect(() => {
    if (activeTab !== 'money') return;
    const fetchMoney = async () => {
      try {
        setLoading(true);
        const res = await adminService.getMoneyTransactions({
          startDate: moneyFilters.startDate,
          endDate: moneyFilters.endDate,
          search: moneyFilters.search
        });
        setMoneyTransactions(res.data.transactions || []);
      } catch (err) {
        setError('Failed to fetch money transactions.');
      } finally {
        setLoading(false);
      }
    };
    fetchMoney();
  }, [activeTab, moneyFilters]);

  useEffect(() => {
    if (selectedUser && selectedUser.role === 'driver') {
      setLoadingDriverPackages(true);
      adminService.getPackages({ driverId: selectedUser.driverId })
        .then(res => setDriverPackages(res.data || []))
        .catch(() => setDriverPackages([]))
        .finally(() => setLoadingDriverPackages(false));
    } else {
      setDriverPackages([]);
    }
  }, [selectedUser]);

  const handleApproval = async (entityId, userType, approve) => {
    try {
      let response;
      if (userType === 'shop') {
        response = await adminService.approveShop(entityId, approve);
      } else if (userType === 'driver') {
        response = await adminService.approveDriver(entityId, approve);
      }

      if (response.success) {
        // Refresh the user list
        const updatedUsers = users.filter(user => user.id !== entityId);
        setUsers(updatedUsers);
      } else {
        setError('Failed to update user status.');
      }
    } catch (err) {
      setError('Failed to update user status.');
      console.error(err);
    }
  };

  const openDetailsModal = (pkg) => {
    let notesArr = [];
    if (Array.isArray(pkg.notes)) {
      notesArr = pkg.notes;
    } else if (typeof pkg.notes === 'string') {
      try {
        notesArr = JSON.parse(pkg.notes);
      } catch {
        notesArr = [];
      }
    }
    setSelectedAdminPackage({ ...pkg, notes: notesArr });
    setShowDetailsModal(true);
  };

  const closeDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedPackage(null);
  };

  const handleSelectPackage = (packageId, checked) => {
    if (checked) {
      setSelectedPackages([...selectedPackages, packageId]);
    } else {
      setSelectedPackages(selectedPackages.filter(id => id !== packageId));
    }
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      const allPackageIds = packages.map(pkg => pkg.id);
      setSelectedPackages(allPackageIds);
    } else {
      setSelectedPackages([]);
    }
  };

  const openBulkAssignModal = async () => {
    try {
      const response = await adminService.getDrivers({ isApproved: true });
      setDrivers(response.data || []);
      setShowBulkAssignModal(true);
    } catch (error) {
      setError('Failed to fetch drivers.');
    }
  };

  const handleBulkAssign = async () => {
    if (!bulkAssignDriverId || selectedPackages.length === 0) {
      setError('Please select a driver and at least one package.');
      return;
    }

    setIsBulkAssigning(true);
    setError(null);

    try {
      console.log('Bulk assigning driver ID:', bulkAssignDriverId, 'to packages:', selectedPackages);

      // Process packages sequentially to avoid database locks
      for (const packageId of selectedPackages) {
        console.log(`Assigning driver ${bulkAssignDriverId} to package ${packageId}`);
        await adminService.assignDriverToPackage(packageId, bulkAssignDriverId);
        // Add a delay between requests to prevent database locks
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      // Refresh the packages list
      if (packageSubTab === 'ready-to-assign') {
        const packagesResponse = await adminService.getPackages();
        const pendingPackages = (packagesResponse.data || []).filter(pkg => pkg.status === 'pending');
        setPackages(pendingPackages);
      }

      // Clear selections and close modal
      setSelectedPackages([]);
      setBulkAssignDriverId('');
      setShowBulkAssignModal(false);

    } catch (error) {
      console.error('Error in bulk assign:', error);
      setError('Error assigning driver to packages. Please try again.');
    } finally {
      setIsBulkAssigning(false);
    }
  };

  const handleMarkAsReturned = async (pkg) => {
    try {
      // Determine the appropriate status based on current status
      let newStatus = 'cancelled-returned';
      if (pkg.status === 'rejected-awaiting-return') {
        newStatus = 'rejected-returned';
      }
      await packageService.updatePackageStatus(pkg.id, { status: newStatus });
      // Refresh packages list
      fetchPackages();
    } catch (error) {
      setError('Failed to update package status.');
      console.error('Failed to mark as returned:', error);
    }
  };

  const openPickupDetailsModal = async (pickup) => {
    setSelectedPickup(pickup);
    setShowPickupDetailsModal(true);
    setPickupPackagesLoading(true);
    try {
      // Get all packages for this pickup
      const res = await packageService.getPickupById(pickup.id);
      if (res.data.Packages) {
        setPickupPackages(res.data.Packages);
      } else {
        setPickupPackages([]);
      }
    } catch (error) {
      console.error('Error fetching pickup details:', error);
      setPickupPackages([]);
    } finally {
      setPickupPackagesLoading(false);
    }
  };

  const getDriverName = (driverId) => {
    if (!drivers || drivers.length === 0) return 'N/A';
    const driver = drivers.find(d => d.driverId === driverId);
    return driver ? driver.name : 'Unassigned';
  };

  const handleMarkPickupAsPickedUp = async (pickupId) => {
    try {
      await adminService.markPickupAsPickedUp(pickupId);
      
      // Refresh pickups data
      await fetchPickups();
      
      // Refresh packages data if we're on the packages tab
      if (activeTab === 'packages') {
        await fetchPackages();
      }
      
      setError(null);
    } catch (error) {
      console.error('Error marking pickup as picked up:', error);
      setError(`Error: ${error.response?.data?.message || 'Failed to mark pickup as picked up'}`);
    }
  };

  const quickActions = [
    {
      title: 'Manage Users',
      description: 'View and manage all users',
      icon: '👥',
      link: '/admin/users',
      color: '#007bff'
    },
    {
      title: 'System Analytics',
      description: 'View system performance metrics',
      icon: '📊',
      link: '/admin/analytics',
      color: '#28a745',
      onClick: () => navigate('/admin/analytics')
    },
    {
      title: 'Package Management',
      description: 'Monitor all packages and deliveries',
      icon: '📦',
      link: '/admin/packages',
      color: '#ffc107'
    },
    {
      title: 'System Settings',
      description: 'Configure system parameters',
      icon: '⚙️',
      link: '/admin/settings',
      color: '#6c757d'
    }
  ];

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return '#28a745';
      case 'pending review':
        return '#ffc107';
      case 'failed':
        return '#dc3545';
      default:
        return '#6c757d';
    }
  };

  if (loading) {
    return <div className="loading-container">Loading...</div>;
  }

  if (error) {
    return <div className="error-container">{error}</div>;
  }

  return (
    <div className="mobile-admin-dashboard">
      <div className="mobile-admin-dashboard-container">
        {/* Dashboard Header */}
        <div className="mobile-admin-dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="mobile-admin-dashboard-welcome">
            <h1 className="mobile-admin-dashboard-title">Admin Dashboard</h1>
            <p className="mobile-admin-dashboard-subtitle">
              {t('profile.subtitle')}
            </p>
          </div>
          <div className="mobile-admin-dashboard-icon">👨‍💼</div>
        </div>

        <div className="mobile-admin-dashboard-tabs">
          <button
            className={`mobile-admin-dashboard-tab ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            Dashboard
          </button>
          <button
            className={`mobile-admin-dashboard-tab ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            Users
          </button>
          <button
            className={`mobile-admin-dashboard-tab ${activeTab === 'packages' ? 'active' : ''}`}
            onClick={() => setActiveTab('packages')}
          >
            Packages
          </button>
          <button
            className={`mobile-admin-dashboard-tab ${activeTab === 'pickups' ? 'active' : ''}`}
            onClick={() => setActiveTab('pickups')}
          >
            Pickups
          </button>
          <button
            className={`mobile-admin-dashboard-tab ${activeTab === 'money' ? 'active' : ''}`}
            onClick={() => setActiveTab('money')}
          >
            Money
          </button>
        </div>

        {activeTab === 'dashboard' && (
          <>
        {/* Stats Overview */}
        <div className="mobile-admin-dashboard-stats">
          <div className="mobile-admin-dashboard-stat">
            <div className="mobile-admin-dashboard-stat-icon" style={{ backgroundColor: '#007bff' }}>
              👥
            </div>
            <div className="mobile-admin-dashboard-stat-content">
                  <div className="mobile-admin-dashboard-stat-number">{dashboardStats.users.total}</div>
              <div className="mobile-admin-dashboard-stat-label">Total Users</div>
            </div>
          </div>
          
          <div className="mobile-admin-dashboard-stat">
            <div className="mobile-admin-dashboard-stat-icon" style={{ backgroundColor: '#28a745' }}>
              🏪
            </div>
            <div className="mobile-admin-dashboard-stat-content">
                  <div className="mobile-admin-dashboard-stat-number">{dashboardStats.users.shops}</div>
              <div className="mobile-admin-dashboard-stat-label">Active Shops</div>
            </div>
          </div>
          
          <div className="mobile-admin-dashboard-stat">
            <div className="mobile-admin-dashboard-stat-icon" style={{ backgroundColor: '#ffc107' }}>
              🚚
            </div>
            <div className="mobile-admin-dashboard-stat-content">
                  <div className="mobile-admin-dashboard-stat-number">{dashboardStats.users.drivers}</div>
              <div className="mobile-admin-dashboard-stat-label">Active Drivers</div>
            </div>
          </div>
          
          <div className="mobile-admin-dashboard-stat">
            <div className="mobile-admin-dashboard-stat-icon" style={{ backgroundColor: '#6c757d' }}>
              💰
            </div>
            <div className="mobile-admin-dashboard-stat-content">
                  <div className="mobile-admin-dashboard-stat-number">${dashboardStats.revenue}</div>
              <div className="mobile-admin-dashboard-stat-label">System Revenue</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mobile-admin-dashboard-section">
          <h2 className="mobile-admin-dashboard-section-title">Quick Actions</h2>
          <div className="mobile-admin-dashboard-actions">
            {quickActions.map((action, index) => (
              <div
                key={index}
                className="mobile-admin-dashboard-action"
                style={{ cursor: 'pointer' }}
                onClick={action.onClick ? action.onClick : undefined}
                as={action.onClick ? 'div' : undefined}
              >
                <div 
                  className="mobile-admin-dashboard-action-icon"
                  style={{ backgroundColor: action.color }}
                >
                  {action.icon}
                </div>
                <div className="mobile-admin-dashboard-action-content">
                  <h3 className="mobile-admin-dashboard-action-title">{action.title}</h3>
                  <p className="mobile-admin-dashboard-action-description">{action.description}</p>
                </div>
                <div className="mobile-admin-dashboard-action-arrow">→</div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activities */}
        <div className="mobile-admin-dashboard-section">
          <div className="mobile-admin-dashboard-section-header">
            <h2 className="mobile-admin-dashboard-section-title">Recent Activities</h2>
            <Link to="/admin/activities" className="mobile-admin-dashboard-section-link">
              View All
            </Link>
          </div>
          <div className="mobile-admin-dashboard-activities">
            {recentActivities.length === 0 ? (
              <div className="mobile-admin-dashboard-activity">No recent activities.</div>
            ) : (
              recentActivities.map((activity, index) => (
                <div key={index} className="mobile-admin-dashboard-activity">
                  <div className="mobile-admin-dashboard-activity-header">
                    <div className="mobile-admin-dashboard-activity-id">{activity.id}</div>
                    <div 
                      className="mobile-admin-dashboard-activity-status"
                      style={{ color: getStatusColor(activity.status) }}
                    >
                      {activity.status}
                    </div>
                  </div>
                  <div className="mobile-admin-dashboard-activity-details">
                    <div className="mobile-admin-dashboard-activity-type">
                      <strong>Type:</strong> {activity.type}
                    </div>
                    <div className="mobile-admin-dashboard-activity-description">
                      {activity.description}
                    </div>
                    <div className="mobile-admin-dashboard-activity-timestamp">
                      <strong>Time:</strong> {activity.timestamp ? new Date(activity.timestamp).toLocaleString() : ''}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
          </>
        )}

        {activeTab === 'users' && (
          <div className="mobile-admin-dashboard-section">
            <div className="mobile-admin-dashboard-sub-tabs">
              <button
                className={`mobile-admin-dashboard-sub-tab ${userSubTab === 'all' ? 'active' : ''}`}
                onClick={() => setUserSubTab('all')}
              >
                All
              </button>
              <button
                className={`mobile-admin-dashboard-sub-tab ${userSubTab === 'pending' ? 'active' : ''}`}
                onClick={() => setUserSubTab('pending')}
              >
                Pending
              </button>
              <button
                className={`mobile-admin-dashboard-sub-tab ${userSubTab === 'shops' ? 'active' : ''}`}
                onClick={() => setUserSubTab('shops')}
              >
                Shops
              </button>
              <button
                className={`mobile-admin-dashboard-sub-tab ${userSubTab === 'drivers' ? 'active' : ''}`}
                onClick={() => setUserSubTab('drivers')}
              >
                Drivers
              </button>
            </div>
            <div className="mobile-admin-dashboard-user-list">
              {users.map((user) => (
                <div key={user.id} className="mobile-admin-dashboard-user-card" onClick={() => setSelectedUser(user)} style={{ cursor: 'pointer' }}>
                  <div className="mobile-admin-dashboard-user-info">
                    <p><strong>Name:</strong> {user?.name || 'N/A'}</p>
                    <p><strong>Email:</strong> {user.email}</p>
                    <p><strong>Role:</strong> {user.role}</p>
                    {user.status && <p><strong>Status:</strong> {user.status}</p>}
                    {userSubTab === 'shops' && user.role === 'shop' && (
                      <div className="mobile-admin-dashboard-shop-financials">
                        <p><strong>To Collect:</strong> ${parseFloat(user.ToCollect || 0).toFixed(2)}</p>
                        <p><strong>Total Collected:</strong> ${parseFloat(user.TotalCollected || 0).toFixed(2)}</p>
                        <p><strong>Delivered Packages:</strong> {user.financialData?.packageCount || 0}</p>
                        {parseFloat(user.TotalCollected || 0) > 0 && (
                          <button
                            className="mobile-admin-dashboard-settle-btn"
                            onClick={() => setSettleShop({ shop: user, amount: '', loading: false, error: null })}
                          >
                            Settle Payments
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  {user.status === 'pending' && (
                    <div className="mobile-admin-dashboard-user-actions">
                      <button onClick={() => handleApproval(user.id, user.role, true)}>Approve</button>
                      <button onClick={() => handleApproval(user.id, user.role, false)}>Reject</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'packages' && (
          <div className="mobile-admin-dashboard-section">
            <div className="mobile-admin-dashboard-sub-tabs">
              <button
                className={`mobile-admin-dashboard-sub-tab ${packageSubTab === 'all' ? 'active' : ''}`}
                onClick={() => setPackageSubTab('all')}
              >
                All
              </button>
              <button
                className={`mobile-admin-dashboard-sub-tab ${packageSubTab === 'ready-to-assign' ? 'active' : ''}`}
                onClick={() => setPackageSubTab('ready-to-assign')}
              >
                Ready to Assign
              </button>
              <button
                className={`mobile-admin-dashboard-sub-tab ${packageSubTab === 'assigned' ? 'active' : ''}`}
                onClick={() => setPackageSubTab('assigned')}
              >
                Assigned
              </button>
              <button
                className={`mobile-admin-dashboard-sub-tab ${packageSubTab === 'in-transit' ? 'active' : ''}`}
                onClick={() => setPackageSubTab('in-transit')}
              >
                In Transit
              </button>
              <button
                className={`mobile-admin-dashboard-sub-tab ${packageSubTab === 'delivered' ? 'active' : ''}`}
                onClick={() => setPackageSubTab('delivered')}
              >
                Delivered
              </button>
              <button
                className={`mobile-admin-dashboard-sub-tab ${packageSubTab === 'return-to-shop' ? 'active' : ''}`}
                onClick={() => setPackageSubTab('return-to-shop')}
              >
                Return to Shop
              </button>
            </div>

            {packageSubTab === 'ready-to-assign' && (
              <div className="mobile-admin-dashboard-select-all-container">
                <input
                  type="checkbox"
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  checked={selectedPackages.length === packages.length && packages.length > 0}
                />
                <label>Select All</label>
              </div>
            )}

            <div className="mobile-admin-dashboard-package-list">
              {packages.map((pkg) => (
                <div key={pkg.id} className="mobile-admin-dashboard-package-card" onClick={() => setSelectedAdminPackage(pkg)} style={{ cursor: 'pointer' }}>
                  <div className="mobile-admin-dashboard-package-header">
                    {packageSubTab === 'ready-to-assign' && (
                      <input
                        type="checkbox"
                        checked={selectedPackages.includes(pkg.id)}
                        onChange={(e) => handleSelectPackage(pkg.id, e.target.checked)}
                        onClick={e => e.stopPropagation()}
                      />
                    )}
                    <span className="mobile-admin-dashboard-package-tracking">{pkg.trackingNumber}</span>
                    <span className={`mobile-admin-dashboard-package-status-badge status-${pkg.status?.toLowerCase()}`}>{pkg.status}</span>
                  </div>
                  <div className="mobile-admin-dashboard-package-info">
                    <p><strong>Sender:</strong> {pkg.shop?.businessName || 'N/A'}</p>
                    <p><strong>Recipient:</strong> {pkg.deliveryContactName || 'N/A'}</p>
                    <p><strong>Date:</strong> {pkg.createdAt ? new Date(pkg.createdAt).toLocaleDateString() : '-'}</p>
                    <p><strong>Address:</strong> {(pkg.deliveryAddress?.address || pkg.deliveryAddress) || 'N/A'}</p>
                    <p><strong>Driver:</strong> {getDriverName(pkg.driverId)}</p>
                  </div>
                  <div className="mobile-admin-dashboard-package-actions">
                    {(() => {
                      const statusFlow = ['assigned', 'pickedup', 'in-transit', 'delivered'];
                      const currentIndex = statusFlow.indexOf(pkg.status);
                      const canForward = currentIndex !== -1 && currentIndex < statusFlow.length - 1;
                      if (!canForward) return null;
                      const nextStatus = statusFlow[currentIndex + 1];
                      const nextLabel = {
                        'pickedup': 'Mark as Picked Up',
                        'in-transit': 'Mark In Transit',
                        'delivered': 'Mark as Delivered'
                      }[nextStatus] || 'Forward Status';
                      return (
                        <button
                          className="mobile-admin-dashboard-forward-btn"
                          style={{ background: '#007bff', color: '#fff', border: 'none', borderRadius: '6px', padding: '0.5rem 1.2rem', fontWeight: 'bold', marginRight: '0.5rem', marginBottom: '0.5rem', fontSize: '1em', boxShadow: '0 1px 2px rgba(0,0,0,0.04)', cursor: 'pointer' }}
                          onClick={async (e) => {
                            e.stopPropagation();
                            await packageService.updatePackageStatus(pkg.id, { status: nextStatus });
                            fetchPackages();
                          }}
                        >
                          {nextLabel}
                        </button>
                      );
                    })()}
                    {(() => {
                      // Only show reject button for packages between assigned and delivered
                      if (['assigned', 'pickedup', 'in-transit'].includes(pkg.status)) {
                        return (
                          <button
                            className="mobile-admin-dashboard-cancel-btn"
                            onClick={async (e) => {
                              e.stopPropagation();
                              setPackageToReject(pkg);
                              setShowRejectConfirmation(true);
                            }}
                            style={{ background: '#dc3545', color: '#fff', border: 'none', borderRadius: '6px', padding: '0.5rem 1.2rem', fontWeight: 'bold', fontSize: '1em', boxShadow: '0 1px 2px rgba(0,0,0,0.04)', cursor: 'pointer' }}
                          >
                            Reject
                          </button>
                        );
                      }
                      return null;
                    })()}
                  </div>
                </div>
              ))}
            </div>
            {selectedPackages.length > 0 && packageSubTab === 'ready-to-assign' && (
              <button onClick={openBulkAssignModal} className="mobile-admin-dashboard-bulk-assign-btn">
                Assign to Driver
              </button>
            )}
          </div>
        )}

        {activeTab === 'pickups' && (
          <div className="mobile-admin-dashboard-section">
            <h2 className="mobile-admin-dashboard-section-title">Pickups</h2>
            <div className="mobile-admin-dashboard-pickup-list">
              {pickups.map((pickup) => (
                <div key={pickup.id} className="mobile-admin-dashboard-pickup-card">
                  <p><strong>Pickup ID:</strong> {pickup.id}</p>
                  <p><strong>Status:</strong> {pickup.status}</p>
                  <p><strong>Shop:</strong> {pickup.Shop?.businessName || 'N/A'}</p>
                  <p><strong>Packages:</strong> {pickup.Packages?.length || 0}</p>
                  <div className="mobile-admin-dashboard-pickup-actions">
                    <button 
                      onClick={() => openPickupDetailsModal(pickup)} 
                      className="mobile-admin-dashboard-pickup-details-btn"
                    >
                      View Details
                    </button>
                    {pickup.status === 'scheduled' && (
                      <button
                        onClick={() => handleMarkPickupAsPickedUp(pickup.id)}
                        className="mobile-admin-dashboard-mark-pickedup-btn"
                      >
                        Mark as Picked Up
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'money' && (
          <div className="mobile-admin-dashboard-section">
            <h2 className="mobile-admin-dashboard-section-title">Money Transactions</h2>
            <div className="mobile-admin-dashboard-money-filters">
              <input
                type="date"
                value={moneyFilters.startDate}
                onChange={e => setMoneyFilters(f => ({ ...f, startDate: e.target.value }))}
                placeholder="Start Date"
              />
              <input
                type="date"
                value={moneyFilters.endDate}
                onChange={e => setMoneyFilters(f => ({ ...f, endDate: e.target.value }))}
                placeholder="End Date"
              />
              <input
                type="text"
                value={moneyFilters.search}
                onChange={e => setMoneyFilters(f => ({ ...f, search: e.target.value }))}
                placeholder="Search"
              />
            </div>
            <div className="mobile-admin-dashboard-money-table-wrapper">
              {moneyTransactions.length === 0 ? (
                <div className="mobile-admin-dashboard-money-empty">No transactions found.</div>
              ) : (
                <table className="mobile-admin-dashboard-money-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Shop</th>
                      <th>Attribute</th>
                      <th>Type</th>
                      <th>Amount</th>
                      <th>Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {moneyTransactions.map(tx => (
                      <tr key={tx.id}>
                        <td>{tx.createdAt ? new Date(tx.createdAt).toLocaleString() : ''}</td>
                        <td>{tx.Shop?.businessName || tx.shopId}</td>
                        <td>{tx.attribute}</td>
                        <td>{tx.changeType}</td>
                        <td style={{ color: tx.changeType === 'increase' ? '#28a745' : '#d32f2f', fontWeight: 600 }}>
                          ${parseFloat(tx.amount).toFixed(2)}
                        </td>
                        <td>{tx.description || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>

      {showDetailsModal && selectedPackage && (
        <div className="mobile-modal-overlay" onClick={closeDetailsModal}>
          <div className="mobile-modal-content" onClick={e => e.stopPropagation()}>
            <div className="mobile-modal-header">
              <h3>Package Details</h3>
              <button className="mobile-modal-close" onClick={closeDetailsModal}>&times;</button>
            </div>
            <div className="mobile-modal-body">
              <div className="mobile-modal-details-grid">
                <div className="mobile-modal-detail-item"><span className="label">Tracking #</span><span>{selectedPackage.trackingNumber}</span></div>
                <div className="mobile-modal-detail-item"><span className="label">Status</span><span>{selectedPackage.status}</span></div>
                <div className="mobile-modal-detail-item"><span className="label">Created</span><span>{new Date(selectedPackage.createdAt).toLocaleString()}</span></div>
                <div className="mobile-modal-detail-item full-width"><span className="label">Description</span><span>{selectedPackage.packageDescription || 'No description'}</span></div>
                <div className="mobile-modal-detail-item"><span className="label">Sender</span><span>{selectedPackage.sender?.name || 'N/A'}</span></div>
                <div className="mobile-modal-detail-item"><span className="label">Recipient</span><span>{selectedPackage.recipient?.name || 'N/A'}</span></div>
                {selectedPackage.recipient?.phone && (
                  <div className="mobile-modal-detail-item"><span className="label">Recipient Phone</span><span>{selectedPackage.recipient.phone}</span></div>
                )}
                {selectedPackage.recipient?.address && (
                  <div className="mobile-modal-detail-item full-width"><span className="label">Delivery Address</span><span>{selectedPackage.recipient.address}</span></div>
                )}
                <div className="mobile-modal-detail-item"><span className="label">COD</span><span>${parseFloat(selectedPackage.codAmount || 0).toFixed(2)} {selectedPackage.isPaid ? 'Paid' : 'Unpaid'}</span></div>
                <div className="mobile-modal-detail-item"><span className="label">Delivery Cost</span><span>${parseFloat(selectedPackage.deliveryCost || 0).toFixed(2)}</span></div>
                {selectedPackage.weight && (
                  <div className="mobile-modal-detail-item"><span className="label">Weight</span><span>{selectedPackage.weight} kg</span></div>
                )}
                {selectedPackage.dimensions && (
                  <div className="mobile-modal-detail-item"><span className="label">Dimensions</span><span>{selectedPackage.dimensions}</span></div>
                )}
                {selectedPackage.notes && (
                  <div className="mobile-modal-detail-item full-width"><span className="label">Notes</span><span>{selectedPackage.notes}</span></div>
                )}
                {selectedPackage.shopNotes && (
                  <div className="mobile-modal-detail-item full-width"><span className="label">Shop Notes</span><span>{selectedPackage.shopNotes}</span></div>
                )}
                <div className="mobile-modal-detail-item"><span className="label">Number of Items</span><span>{selectedAdminPackage?.itemsNo ?? '-'}</span></div>
              </div>
              <div className="mobile-modal-actions">
                <button className="mobile-modal-close-btn" onClick={closeDetailsModal}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showBulkAssignModal && (
        <div className="mobile-modal-overlay" onClick={() => setShowBulkAssignModal(false)}>
          <div className="mobile-modal-content" onClick={e => e.stopPropagation()}>
            <div className="mobile-modal-header">
              <h3>Assign Driver</h3>
              <button className="mobile-modal-close" onClick={() => setShowBulkAssignModal(false)}>&times;</button>
            </div>
            <div className="mobile-modal-body">
              <input
                type="text"
                placeholder="Search drivers..."
                className="mobile-admin-dashboard-driver-search"
                value={driverSearchTerm}
                onChange={(e) => setDriverSearchTerm(e.target.value)}
              />
              <div className="mobile-admin-dashboard-driver-list">
                {drivers
                  .filter(driver => driver.name.toLowerCase().includes(driverSearchTerm.toLowerCase()))
                  .map(driver => (
                    <div
                      key={driver.id}
                      className={`mobile-admin-dashboard-driver-card ${bulkAssignDriverId === driver.driverId ? 'selected' : ''}`}
                      onClick={() => setBulkAssignDriverId(driver.driverId)}
                    >
                      <div className="mobile-admin-dashboard-driver-info">
                        <p className="mobile-admin-dashboard-driver-name">{driver.name}</p>
                        <p className="mobile-admin-dashboard-driver-phone">{driver.phone}</p>
                        <p className="mobile-admin-dashboard-driver-phone">{driver.workingArea}</p>
                      </div>
                      <div className="mobile-admin-dashboard-driver-load">
                        <p>Assigned Today: {driver.assignedToday || 0}</p>
                      </div>
                    </div>
                  ))}
              </div>
              <div className="mobile-modal-actions">
                <button
                  className="mobile-modal-close-btn"
                  onClick={handleBulkAssign}
                  disabled={!bulkAssignDriverId || isBulkAssigning}
                >
                  {isBulkAssigning ? 'Assigning...' : 'Assign'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showPickupDetailsModal && selectedPickup && (
        <div className="mobile-modal-overlay" onClick={() => setShowPickupDetailsModal(false)}>
          <div className="mobile-modal-content" onClick={e => e.stopPropagation()}>
            <div className="mobile-modal-header">
              <h3>Pickup Details</h3>
              <button className="mobile-modal-close" onClick={() => setShowPickupDetailsModal(false)}>&times;</button>
            </div>
            <div className="mobile-modal-body">
              <div className="mobile-modal-details-grid">
                <div className="mobile-modal-detail-item"><span className="label">Pickup ID</span><span>{selectedPickup.id}</span></div>
                <div className="mobile-modal-detail-item"><span className="label">Status</span><span>{selectedPickup.status}</span></div>
                <div className="mobile-modal-detail-item"><span className="label">Shop</span><span>{selectedPickup.Shop?.businessName || 'N/A'}</span></div>
                {selectedPickup.scheduledTime && (
                  <div className="mobile-modal-detail-item"><span className="label">Scheduled Time</span><span>{new Date(selectedPickup.scheduledTime).toLocaleString()}</span></div>
                )}
                {selectedPickup.actualPickupTime && (
                  <div className="mobile-modal-detail-item"><span className="label">Actual Pickup Time</span><span>{new Date(selectedPickup.actualPickupTime).toLocaleString()}</span></div>
                )}
                <div className="mobile-modal-detail-item full-width"><span className="label">Pickup Address</span><span>{selectedPickup.pickupAddress || 'N/A'}</span></div>
              </div>
              
              <div className="mobile-modal-packages-section">
                <h4>Packages in this Pickup</h4>
                {pickupPackagesLoading ? (
                  <p>Loading packages...</p>
                ) : pickupPackages.length === 0 ? (
                  <p>No packages found in this pickup.</p>
                ) : (
                  <div className="mobile-modal-packages-list">
                    {pickupPackages.map(pkg => (
                      <div key={pkg.id} className="mobile-modal-package-item">
                        <div className="mobile-modal-package-header">
                          <strong>{pkg.trackingNumber}</strong>
                          <span className={`mobile-modal-package-status status-${pkg.status?.toLowerCase()}`}>
                            {pkg.status}
                          </span>
                        </div>
                        <div className="mobile-modal-package-details">
                          <p><strong>Description:</strong> {pkg.packageDescription || 'No description'}</p>
                          <p><strong>Recipient:</strong> {pkg.deliveryContactName || 'N/A'}</p>
                          <p><strong>Address:</strong> {pkg.deliveryAddress || 'N/A'}</p>
                          <p><strong>COD Amount:</strong> ${parseFloat(pkg.codAmount || 0).toFixed(2)}</p>
                          {pkg.deliveryCost && <p><strong>Delivery Cost:</strong> ${parseFloat(pkg.deliveryCost || 0).toFixed(2)}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="mobile-modal-actions">
                <button className="mobile-modal-close-btn" onClick={() => setShowPickupDetailsModal(false)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settle Payments Modal */}
      {settleShop && (
        <div className="mobile-modal-overlay" onClick={() => setSettleShop(null)}>
          <div className="mobile-modal-content" onClick={e => e.stopPropagation()}>
            <div className="mobile-modal-header">
              <h3>Settle Payments for {settleShop.shop.businessName || settleShop.shop.name}</h3>
              <button className="mobile-modal-close" onClick={() => setSettleShop(null)}>&times;</button>
            </div>
            <div className="mobile-modal-body">
              <p>Total Collected: <strong>${parseFloat(settleShop.shop.TotalCollected || 0).toFixed(2)}</strong></p>
              <input
                type="number"
                min="0"
                max={parseFloat(settleShop.shop.TotalCollected || 0)}
                placeholder="Amount to settle (leave blank for full)"
                value={settleShop.amount}
                onChange={e => setSettleShop({ ...settleShop, amount: e.target.value })}
                style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc', width: '100%', marginBottom: '1rem' }}
              />
              {settleShop.error && <div className="error-container">{settleShop.error}</div>}
              <div className="mobile-modal-actions">
                <button
                  className="mobile-modal-close-btn"
                  onClick={async () => {
                    setSettleShop(s => ({ ...s, loading: true, error: null }));
                    try {
                      const amount = settleShop.amount ? parseFloat(settleShop.amount) : undefined;
                      if (amount !== undefined && (isNaN(amount) || amount <= 0)) {
                        setSettleShop(s => ({ ...s, loading: false, error: 'Enter a valid amount.' }));
                        return;
                      }
                      await adminService.settleShopPayments(settleShop.shop.shopId || settleShop.shop.id, amount !== undefined ? { amount } : { packageIds: undefined });
                      // Update the shop in users list
                      setUsers(users => users.map(u => (u.id === settleShop.shop.id ? { ...u, TotalCollected: 0 } : u)));
                      setSettleShop(null);
                    } catch (err) {
                      setSettleShop(s => ({ ...s, loading: false, error: err.response?.data?.message || 'Failed to settle payments.' }));
                    }
                  }}
                  disabled={settleShop.loading}
                >
                  {settleShop.loading ? 'Settling...' : 'Settle'}
                </button>
                <button className="mobile-modal-close-btn" onClick={() => setSettleShop(null)} disabled={settleShop.loading}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedUser && (
        <div className="mobile-modal-overlay" onClick={() => setSelectedUser(null)}>
          <div className="mobile-modal-content" onClick={e => e.stopPropagation()}>
            <div className="mobile-modal-header">
              <h3>{selectedUser.role === 'shop' ? selectedUser.businessName : selectedUser.name}</h3>
              <button className="mobile-modal-close" onClick={() => setSelectedUser(null)}>&times;</button>
            </div>
            <div className="mobile-modal-body">
              <div className="mobile-modal-details-grid">
                <div className="mobile-modal-detail-item"><span className="label">Name</span><span>{selectedUser.name || selectedUser.businessName}</span></div>
                <div className="mobile-modal-detail-item"><span className="label">Email</span><span>{selectedUser.email}</span></div>
                <div className="mobile-modal-detail-item"><span className="label">Phone</span><span>{selectedUser.phone}</span></div>
                <div className="mobile-modal-detail-item"><span className="label">Role</span><span>{selectedUser.role}</span></div>
                <div className="mobile-modal-detail-item"><span className="label">Joined</span><span>{selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString() : ''}</span></div>
                {selectedUser.address && <div className="mobile-modal-detail-item full-width"><span className="label">Address</span><span>{selectedUser.address}</span></div>}
                {selectedUser.role === 'shop' && (
                  <>
                    <div className="mobile-modal-detail-item full-width"><span className="label">Business Type</span><span>{selectedUser.businessType || 'N/A'}</span></div>
                    <div className="mobile-modal-detail-item full-width"><span className="label">To Collect</span><span>${parseFloat(selectedUser.ToCollect || 0).toFixed(2)}</span></div>
                    <div className="mobile-modal-detail-item full-width"><span className="label">Total Collected</span><span>${parseFloat(selectedUser.TotalCollected || 0).toFixed(2)}</span></div>
                    <div className="mobile-modal-detail-item full-width"><span className="label">Delivered Packages</span><span>{selectedUser.financialData?.packageCount || 0}</span></div>
                    {/* Manual Total Collected adjustment by admin */}
                    <div className="mobile-modal-detail-item full-width" style={{ borderTop: '1px solid #eee', paddingTop: 12, marginTop: 12 }}>
                      <span className="label">Adjust Total Collected (Admin Only):</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Amount to adjust by"
                        value={adjustTotalCollectedInput || ''}
                        onChange={e => setAdjustTotalCollectedInput(e.target.value)}
                        style={{ padding: '6px 8px', borderRadius: '4px', border: '1px solid #ccc', width: '100%', marginBottom: 6 }}
                      />
                      <textarea
                        placeholder="Reason for adjustment (required)"
                        value={adjustTotalCollectedReason || ''}
                        onChange={e => setAdjustTotalCollectedReason(e.target.value)}
                        style={{ padding: '6px 8px', borderRadius: '4px', border: '1px solid #ccc', width: '100%', minHeight: 40, marginBottom: 6 }}
                      />
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          className="mobile-admin-dashboard-settle-btn"
                          style={{ flex: 1, background: '#28a745', color: '#fff' }}
                          disabled={adjustingTotalCollected}
                          onClick={async () => {
                            if (!adjustTotalCollectedInput || isNaN(Number(adjustTotalCollectedInput)) || Number(adjustTotalCollectedInput) <= 0) {
                              setAdjustTotalCollectedStatus({ type: 'error', text: 'Please enter a valid positive amount.' });
                              return;
                            }
                            if (!adjustTotalCollectedReason || adjustTotalCollectedReason.trim().length === 0) {
                              setAdjustTotalCollectedStatus({ type: 'error', text: 'Please provide a reason for the adjustment.' });
                              return;
                            }
                            setAdjustingTotalCollected(true);
                            try {
                              const res = await adminService.adjustShopTotalCollected(selectedUser.shopId || selectedUser.id, {
                                amount: parseFloat(adjustTotalCollectedInput),
                                reason: adjustTotalCollectedReason,
                                changeType: 'increase'
                              });
                              setAdjustTotalCollectedStatus({ type: 'success', text: res.data.message || 'Total Collected increased.' });
                              // Refresh user details
                              const response = await adminService.getShopById(selectedUser.shopId || selectedUser.id);
                              if (response && response.data) {
                                setSelectedUser({ ...response.data, entityType: selectedUser.entityType });
                              }
                              setAdjustTotalCollectedInput('');
                              setAdjustTotalCollectedReason('');
                            } catch (err) {
                              setAdjustTotalCollectedStatus({ type: 'error', text: err.response?.data?.message || 'Failed to increase Total Collected.' });
                            } finally {
                              setAdjustingTotalCollected(false);
                            }
                          }}
                        >
                          Increase
                        </button>
                        <button
                          className="mobile-admin-dashboard-settle-btn"
                          style={{ flex: 1, background: '#d32f2f', color: '#fff' }}
                          disabled={adjustingTotalCollected}
                          onClick={async () => {
                            if (!adjustTotalCollectedInput || isNaN(Number(adjustTotalCollectedInput)) || Number(adjustTotalCollectedInput) <= 0) {
                              setAdjustTotalCollectedStatus({ type: 'error', text: 'Please enter a valid positive amount.' });
                              return;
                            }
                            if (!adjustTotalCollectedReason || adjustTotalCollectedReason.trim().length === 0) {
                              setAdjustTotalCollectedStatus({ type: 'error', text: 'Please provide a reason for the adjustment.' });
                              return;
                            }
                            setAdjustingTotalCollected(true);
                            try {
                              const res = await adminService.adjustShopTotalCollected(selectedUser.shopId || selectedUser.id, {
                                amount: parseFloat(adjustTotalCollectedInput),
                                reason: adjustTotalCollectedReason,
                                changeType: 'decrease'
                              });
                              setAdjustTotalCollectedStatus({ type: 'success', text: res.data.message || 'Total Collected decreased.' });
                              // Refresh user details
                              const response = await adminService.getShopById(selectedUser.shopId || selectedUser.id);
                              if (response && response.data) {
                                setSelectedUser({ ...response.data, entityType: selectedUser.entityType });
                              }
                              setAdjustTotalCollectedInput('');
                              setAdjustTotalCollectedReason('');
                            } catch (err) {
                              setAdjustTotalCollectedStatus({ type: 'error', text: err.response?.data?.message || 'Failed to decrease Total Collected.' });
                            } finally {
                              setAdjustingTotalCollected(false);
                            }
                          }}
                        >
                          Decrease
                        </button>
                      </div>
                      {adjustTotalCollectedStatus && (
                        <div style={{ marginTop: 6, color: adjustTotalCollectedStatus.type === 'error' ? '#d32f2f' : '#28a745', fontWeight: 500 }}>
                          {adjustTotalCollectedStatus.text}
                        </div>
                      )}
                    </div>
                    <div className="mobile-modal-detail-item full-width">
                      <button
                        className="mobile-admin-dashboard-settle-btn"
                        onClick={() => {
                          setSettleShop({ shop: selectedUser, amount: '', loading: false, error: null });
                          setSelectedUser(null);
                        }}
                        disabled={parseFloat(selectedUser.TotalCollected || 0) <= 0}
                      >
                        Settle Payments
                      </button>
                    </div>
                    <div className="mobile-modal-detail-item full-width">
                      <button
                        className="mobile-admin-dashboard-settle-btn"
                        onClick={async () => {
                          setLoadingShopPackages(true);
                          try {
                            const res = await adminService.getShopPackages(selectedUser.shopId || selectedUser.id);
                            setShopPackages(res.data || []);
                          } catch {
                            setShopPackages([]);
                          } finally {
                            setLoadingShopPackages(false);
                          }
                        }}
                      >
                        {loadingShopPackages ? 'Loading...' : 'Load Recent Packages'}
                      </button>
                      {shopPackages.length > 0 && (
                        <div style={{ marginTop: '1rem' }}>
                          <strong>Recent Packages:</strong>
                          <ul style={{ maxHeight: '120px', overflowY: 'auto', margin: 0, padding: 0 }}>
                            {shopPackages.slice(0, 5).map(pkg => (
                              <li key={pkg.id} style={{ fontSize: '14px', marginBottom: '4px', listStyle: 'none' }}>
                                #{pkg.trackingNumber} - {pkg.status} - ${parseFloat(pkg.codAmount || 0).toFixed(2)}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
              {/* Show assigned packages for drivers */}
              {selectedUser.role === 'driver' && (
                <div className="mobile-modal-packages-section">
                  <h4>Assigned Packages</h4>
                  {loadingDriverPackages ? (
                    <div>Loading packages...</div>
                  ) : driverPackages.filter(pkg => ['assigned', 'pickedup', 'in-transit'].includes(pkg.status)).length === 0 ? (
                    <div>No assigned packages.</div>
                  ) : (
                    <ul className="mobile-modal-packages-list">
                      {driverPackages.filter(pkg => ['assigned', 'pickedup', 'in-transit'].includes(pkg.status)).map(pkg => (
                        <li key={pkg.id} style={{ fontSize: '14px', marginBottom: '4px', listStyle: 'none' }}>
                          #{pkg.trackingNumber} - {pkg.status} - {pkg.deliveryAddress || 'N/A'}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
              <div className="mobile-modal-actions">
                {!selectedUser.isApproved && (
                  <>
                    <button
                      className="mobile-modal-close-btn"
                      onClick={async () => {
                        await handleApproval(selectedUser.id, selectedUser.role, true);
                        setSelectedUser(null);
                      }}
                    >
                      Approve
                    </button>
                    <button
                      className="mobile-modal-close-btn"
                      onClick={async () => {
                        await handleApproval(selectedUser.id, selectedUser.role, false);
                        setSelectedUser(null);
                      }}
                    >
                      Reject
                    </button>
                  </>
                )}
                <button className="mobile-modal-close-btn" onClick={() => setSelectedUser(null)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedAdminPackage && (
        <div className="mobile-modal-overlay" onClick={() => setSelectedAdminPackage(null)}>
          <div className="mobile-modal-content" onClick={e => e.stopPropagation()}>
            <div className="mobile-modal-header">
              <h3>Package #{selectedAdminPackage.trackingNumber}</h3>
              <button className="mobile-modal-close" onClick={() => setSelectedAdminPackage(null)}>&times;</button>
            </div>
            <div className="mobile-modal-body">
              <div className="mobile-modal-details-grid">
                <div className="mobile-modal-detail-item"><span className="label">Tracking #</span><span>{selectedAdminPackage.trackingNumber}</span></div>
                <div className="mobile-modal-detail-item"><span className="label">Status</span><span>{selectedAdminPackage.status}</span></div>
                <div className="mobile-modal-detail-item"><span className="label">Created</span><span>{selectedAdminPackage.createdAt ? new Date(selectedAdminPackage.createdAt).toLocaleString() : ''}</span></div>
                <div className="mobile-modal-detail-item full-width"><span className="label">Description</span><span>{selectedAdminPackage.packageDescription || 'No description'}</span></div>
                <div className="mobile-modal-detail-item"><span className="label">Sender</span><span>{selectedAdminPackage.shop?.businessName || 'N/A'}</span></div>
                <div className="mobile-modal-detail-item"><span className="label">Recipient</span><span>{selectedAdminPackage.deliveryContactName || 'N/A'}</span></div>
                <div className="mobile-modal-detail-item"><span className="label">Recipient Phone</span><span>{selectedAdminPackage.deliveryContactPhone || 'N/A'}</span></div>
                <div className="mobile-modal-detail-item full-width"><span className="label">Delivery Address</span><span>{selectedAdminPackage.deliveryAddress || 'N/A'}</span></div>
                <div className="mobile-modal-detail-item"><span className="label">COD</span><span>${parseFloat(selectedAdminPackage.codAmount || 0).toFixed(2)} {selectedAdminPackage.isPaid ? 'Paid' : 'Unpaid'}</span></div>
                <div className="mobile-modal-detail-item"><span className="label">Delivery Cost</span><span>${parseFloat(selectedAdminPackage.deliveryCost || 0).toFixed(2)}</span></div>
                <div className="mobile-modal-detail-item"><span className="label">Number of Items</span><span>{selectedAdminPackage?.itemsNo ?? '-'}</span></div>
                {selectedAdminPackage.weight && (
                  <div className="mobile-modal-detail-item"><span className="label">Weight</span><span>{selectedAdminPackage.weight} kg</span></div>
                )}
                {selectedAdminPackage.dimensions && (
                  <div className="mobile-modal-detail-item"><span className="label">Dimensions</span><span>{selectedAdminPackage.dimensions}</span></div>
                )}
                {/* Shop Notes Section */}
                {selectedAdminPackage.shopNotes && (
                  <div className="mobile-modal-detail-item full-width">
                    <span className="label">Shop Notes</span>
                    <span>{selectedAdminPackage.shopNotes}</span>
                  </div>
                )}
                {/* Notes Log Section */}
                <div className="mobile-modal-detail-item full-width">
                  <span className="label">Notes Log</span>
                  <div className="notes-log-list">
                    {(() => {
                      let notesArr = [];
                      if (Array.isArray(selectedAdminPackage?.notes)) {
                        notesArr = selectedAdminPackage.notes;
                      } else if (typeof selectedAdminPackage?.notes === 'string') {
                        try {
                          notesArr = JSON.parse(selectedAdminPackage.notes);
                        } catch {
                          notesArr = [];
                        }
                      }
                      return (notesArr.length > 0) ? (
                        notesArr.map((n, idx) => (
                          <div key={idx} className="notes-log-entry">
                            <div className="notes-log-meta">
                              <span className="notes-log-date">{new Date(n.createdAt).toLocaleString()}</span>
                            </div>
                            <div className="notes-log-text">{n.text}</div>
                          </div>
                        ))
                      ) : (
                        <div className="notes-log-empty">No notes yet.</div>
                      );
                    })()}
                  </div>
                  <textarea
                    value={editingNotes}
                    onChange={e => setEditingNotes(e.target.value)}
                    placeholder="Add a note for this package..."
                    rows={2}
                    style={{ width: '100%', marginTop: 4 }}
                  />
                  <button
                    className="mobile-modal-save-notes-btn"
                    onClick={async () => {
                      if (!editingNotes.trim()) return;
                      setNotesSaving(true);
                      setNotesError(null);
                      try {
                        const res = await packageService.updatePackageNotes(selectedAdminPackage.id, editingNotes);
                        setSelectedAdminPackage(prev => ({ ...prev, notes: res.data.notes }));
                        setEditingNotes('');
                      } catch (err) {
                        setNotesError('Failed to save note.');
                      } finally {
                        setNotesSaving(false);
                      }
                    }}
                    disabled={notesSaving || !editingNotes.trim()}
                    style={{ marginTop: 8 }}
                  >
                    {notesSaving ? 'Saving...' : 'Add Note'}
                  </button>
                  {notesError && <div className="mobile-error-message">{notesError}</div>}
                </div>
              </div>
              <div className="mobile-modal-actions">
                {/* Assign/Change Driver action */}
                {selectedAdminPackage.driverId && ['assigned', 'pickedup', 'in-transit'].includes(selectedAdminPackage.status) && (
                  <button
                    className="mobile-admin-dashboard-settle-btn"
                    onClick={async () => {
                      setShowAssignDriverModal(true);
                    }}
                  >
                    Change Driver
                  </button>
                )}
                {/* Mark as Returned action */}
                {selectedAdminPackage.status === 'cancelled-awaiting-return' && (
                  <button
                    className="mobile-admin-dashboard-settle-btn"
                    onClick={async () => {
                      await handleMarkAsReturned(selectedAdminPackage);
                      setSelectedAdminPackage(null);
                    }}
                  >
                    Mark as Returned
                  </button>
                )}
                <button className="mobile-modal-close-btn" onClick={() => setSelectedAdminPackage(null)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assign Driver Modal */}
      {showAssignDriverModal && (
        <div className="mobile-modal-overlay" onClick={() => setShowAssignDriverModal(false)}>
          <div className="mobile-modal-content" onClick={e => e.stopPropagation()}>
            <div className="mobile-modal-header">
              <h3>{selectedAdminPackage?.driverId ? 'Change Driver' : 'Assign Driver'}</h3>
              <button className="mobile-modal-close" onClick={() => setShowAssignDriverModal(false)}>&times;</button>
            </div>
            <div className="mobile-modal-body">
              <input
                type="text"
                placeholder="Search drivers..."
                value={assignDriverSearch}
                onChange={e => setAssignDriverSearch(e.target.value)}
                className="mobile-admin-dashboard-driver-search"
              />
              <div className="mobile-admin-dashboard-driver-list">
                {drivers
                  .filter(driver => driver.name.toLowerCase().includes(assignDriverSearch.toLowerCase()))
                  .map(driver => (
                    <div
                      key={driver.id}
                      className={`mobile-admin-dashboard-driver-card ${assignDriverId === driver.driverId ? 'selected' : ''}`}
                      onClick={() => setAssignDriverId(driver.driverId)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="mobile-admin-dashboard-driver-info">
                        <p className="mobile-admin-dashboard-driver-name">{driver.name}</p>
                        <p className="mobile-admin-dashboard-driver-phone">{driver.phone}</p>
                        <p className="mobile-admin-dashboard-driver-phone">{driver.workingArea}</p>
                      </div>
                      <div className="mobile-admin-dashboard-driver-load">
                        <p>Assigned Today: {driver.assignedToday || 0}</p>
                      </div>
                    </div>
                  ))}
              </div>
              <div className="mobile-modal-actions">
                <button
                  className="mobile-modal-close-btn"
                  onClick={async () => {
                    if (!assignDriverId) return;
                    setAssignDriverLoading(true);
                    try {
                      await adminService.assignDriverToPackage(selectedAdminPackage.id, assignDriverId);
                      setShowAssignDriverModal(false);
                      setSelectedAdminPackage(null);
                      // Refresh packages
                      const packagesResponse = await adminService.getPackages();
                      setPackages(packagesResponse.data || []);
                    } catch (err) {
                      // Optionally show error
                    } finally {
                      setAssignDriverLoading(false);
                      setAssignDriverId('');
                      setAssignDriverSearch('');
                    }
                  }}
                  disabled={!assignDriverId || assignDriverLoading}
                >
                  {assignDriverLoading ? (selectedAdminPackage?.driverId ? 'Changing...' : 'Assigning...') : (selectedAdminPackage?.driverId ? 'Change Driver' : 'Assign')}
                </button>
                <button className="mobile-modal-close-btn" onClick={() => setShowAssignDriverModal(false)} disabled={assignDriverLoading}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Confirmation Modal */}
      {showRejectConfirmation && packageToReject && (
        <div className="mobile-modal-overlay" onClick={() => setShowRejectConfirmation(false)}>
          <div className="mobile-modal-content" onClick={e => e.stopPropagation()}>
            <div className="mobile-modal-header">
              <h3>Confirm Rejection</h3>
              <button className="mobile-modal-close" onClick={() => setShowRejectConfirmation(false)}>&times;</button>
            </div>
            <div className="mobile-modal-body">
              <p>Are you sure you want to reject this package?</p>
              <div className="mobile-modal-actions">
                <button
                  className="mobile-modal-close-btn"
                  onClick={async () => {
                    try {
                      // The backend will automatically handle the status transition based on current status
                      await packageService.updatePackageStatus(packageToReject.id, { status: 'rejected' });
                      fetchPackages();
                      setShowRejectConfirmation(false);
                      setPackageToReject(null);
                    } catch (error) {
                      console.error('Error rejecting package:', error);
                    }
                  }}
                >
                  Confirm
                </button>
                <button className="mobile-modal-close-btn" onClick={() => setShowRejectConfirmation(false)}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileAdminDashboard;