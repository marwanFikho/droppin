import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, Route, Routes, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { adminService, packageService, notificationService } from '../../services/api';
import './MobileAdminDashboard.css';
import { useTranslation } from 'react-i18next';
import { FaTrashAlt } from 'react-icons/fa';
import QRCode from 'qrcode';

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
  
  // Add state for give money to driver functionality
  const [giveMoneyAmount, setGiveMoneyAmount] = useState('');
  const [giveMoneyReason, setGiveMoneyReason] = useState('');
  const [givingMoney, setGivingMoney] = useState(false);
  
  // Add state for driver details and packages
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [showDriverDetailsModal, setShowDriverDetailsModal] = useState(false);
  
  // Add state for working area management
  const [showWorkingAreaModal, setShowWorkingAreaModal] = useState(false);
  const [selectedDriverForWorkingArea, setSelectedDriverForWorkingArea] = useState(null);
  const [workingAreaInput, setWorkingAreaInput] = useState('');
  const [updatingWorkingArea, setUpdatingWorkingArea] = useState(false);

  // Add status message state
  const [statusMessage, setStatusMessage] = useState(null);

  // Add pickup driver assignment state
  const [selectedPickupForDriver, setSelectedPickupForDriver] = useState(null);
  const [showAssignPickupDriverModal, setShowAssignPickupDriverModal] = useState(false);
  const [pickupDriverSearchTerm, setPickupDriverSearchTerm] = useState('');
  const [assigningPickupDriver, setAssigningPickupDriver] = useState(false);
  const [availableDrivers, setAvailableDrivers] = useState([]);
  const [pickupStatusUpdating, setPickupStatusUpdating] = useState({});

  const [searchTerm, setSearchTerm] = useState('');

  const navigate = useNavigate();

  // Add notification state and refs at the top of the component:
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const notificationDropdownRef = useRef(null);

  // Add state for editing delivery cost in package details modal
  const [editingDeliveryCost, setEditingDeliveryCost] = useState(false);
  const [newDeliveryCost, setNewDeliveryCost] = useState('');
  const [savingDeliveryCost, setSavingDeliveryCost] = useState(false);

  // Add state for editing shipping fees in shop details modal
  const [editingShippingFees, setEditingShippingFees] = useState(false);
  const [newShippingFees, setNewShippingFees] = useState('');
  const [savingShippingFees, setSavingShippingFees] = useState(false);
  const [shippingFeesError, setShippingFeesError] = useState('');

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
        } else if (packageSubTab === 'delivered') {
          filteredPackages = filteredPackages.filter(pkg => pkg.status === 'delivered');
          // Sort by actualDeliveryTime descending (most recent first)
          filteredPackages = filteredPackages.slice().sort((a, b) => {
            const aTime = a.actualDeliveryTime ? new Date(a.actualDeliveryTime).getTime() : 0;
            const bTime = b.actualDeliveryTime ? new Date(b.actualDeliveryTime).getTime() : 0;
            return bTime - aTime;
          });
        } else if (packageSubTab === 'cancelled') {
          // Show cancelled and rejected only
          filteredPackages = filteredPackages.filter(pkg => ['cancelled', 'rejected'].includes(pkg.status));
          // Sort by last update time (fallback to createdAt)
          filteredPackages = filteredPackages.slice().sort((a, b) => {
            const aTime = a.updatedAt ? new Date(a.updatedAt).getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
            const bTime = b.updatedAt ? new Date(b.updatedAt).getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
            return bTime - aTime;
          });
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

  // Add these at the top of the component, after useState declarations
  const fetchDashboardData = useCallback(async () => {
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
  }, []);

  const fetchUsers = useCallback(async () => {
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
  }, [activeTab, userSubTab]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

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

  const openDetailsModal = async (pkg) => {
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
    try {
      // Fetch complete package details including items
      const response = await packageService.getPackageById(pkg.id);
      const completePackage = response.data;
      console.log('Admin - Fetched package details:', completePackage);
      console.log('Admin - Items data:', completePackage.Items);
      if (completePackage.Items && completePackage.Items.length > 0) {
        console.log('Admin - First item details:', completePackage.Items[0]);
      }
      // Preserve the notes array we already processed
      setSelectedAdminPackage({ ...completePackage, notes: notesArr });
    } catch (err) {
      console.error('Failed to fetch complete package details:', err);
      // Keep the original package data if fetch fails
    }
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
      const response = await adminService.getAllPickups();
      setPickups(response.data || []);
    } catch (error) {
      console.error('Error marking pickup as picked up:', error);
    }
  };

  // Function to handle giving money to driver
  const handleGiveMoneyToDriver = async () => {
    if (!giveMoneyAmount || isNaN(parseFloat(giveMoneyAmount)) || parseFloat(giveMoneyAmount) <= 0) {
      setStatusMessage({ type: 'error', text: 'Please enter a valid positive amount.' });
      return;
    }

    try {
      setGivingMoney(true);
      const response = await adminService.giveMoneyToDriver(selectedDriver.driverId || selectedDriver.id, {
        amount: parseFloat(giveMoneyAmount),
        reason: giveMoneyReason.trim() || undefined
      });

      // Show success message
      setStatusMessage({ type: 'success', text: `Successfully gave $${parseFloat(giveMoneyAmount).toFixed(2)} to ${selectedDriver.name}` });
      // Reset form
      setGiveMoneyAmount('');
      setGiveMoneyReason('');
      
      // Refresh dashboard stats
      const statsResponse = await adminService.getDashboardStats();
      setDashboardStats(statsResponse.data);

    } catch (error) {
      console.error('Error giving money to driver:', error);
      setStatusMessage({ type: 'error', text: error.response?.data?.message || 'Failed to give money to driver.' });
    } finally {
      setGivingMoney(false);
    }
  };

  // Function to fetch driver packages
  const fetchDriverPackages = async (driverId) => {
    try {
      setLoadingDriverPackages(true);
      // Fetch all packages and filter for the specific driver
      const response = await adminService.getPackages();
      const allPackages = response.data || [];
      
      // Filter packages that are assigned or were assigned to this driver
      const driverPackages = allPackages.filter(pkg => {
        // Current assignment
        if (pkg.driverId === driverId) return true;
        // Previous assignments in statusHistory
        if (pkg.statusHistory) {
          let historyArr = [];
          if (typeof pkg.statusHistory === 'string') {
            try {
              historyArr = JSON.parse(pkg.statusHistory);
            } catch {
              historyArr = [];
            }
          } else if (Array.isArray(pkg.statusHistory)) {
            historyArr = pkg.statusHistory;
          }
          return historyArr.some(h => h.note && h.note.includes(`ID: ${driverId}`));
        }
        return false;
      });
      
      setDriverPackages(driverPackages);
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Failed to fetch driver packages.' });
    } finally {
      setLoadingDriverPackages(false);
    }
  };

  // Function to open driver details modal
  const openDriverDetailsModal = async (driver) => {
    setSelectedDriver(driver);
    setShowDriverDetailsModal(true);
    await fetchDriverPackages(driver.driverId || driver.id);
  };

  // Function to update driver working area
  const updateDriverWorkingArea = async (driverId, workingArea) => {
    try {
      setUpdatingWorkingArea(true);
      await adminService.updateDriverWorkingArea(driverId, workingArea);
      setShowWorkingAreaModal(false);
      setSelectedDriverForWorkingArea(null);
      setWorkingAreaInput('');
      setStatusMessage({ type: 'success', text: 'Working area updated successfully.' });
      // Refresh drivers list
      const driversResponse = await adminService.getDrivers();
      setDrivers(driversResponse.data || []);
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Failed to update working area.' });
    } finally {
      setUpdatingWorkingArea(false);
    }
  };

  // Function to open working area modal
  const openWorkingAreaModal = (driver) => {
    setSelectedDriverForWorkingArea(driver);
    setWorkingAreaInput(driver.workingArea || '');
    setShowWorkingAreaModal(true);
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

  // Add these just before the return statement of the component:
  const filteredPackages = packages.filter(pkg => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      pkg.trackingNumber?.toLowerCase().includes(search) ||
      pkg.packageDescription?.toLowerCase().includes(search) ||
      pkg.status?.toLowerCase().includes(search) ||
      (pkg.shop?.businessName && pkg.shop.businessName.toLowerCase().includes(search)) ||
      (pkg.deliveryContactName && pkg.deliveryContactName.toLowerCase().includes(search)) ||
      (pkg.deliveryAddress && pkg.deliveryAddress.toLowerCase().includes(search))
    );
  });
  const filteredUsers = users.filter(user => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      user.name?.toLowerCase().includes(search) ||
      user.email?.toLowerCase().includes(search) ||
      user.phone?.includes(search) ||
      (user.businessName && user.businessName.toLowerCase().includes(search))
    );
  });

  // Fetch notifications when dropdown is opened
  useEffect(() => {
    if (showNotifications && currentUser && (currentUser.role === 'admin' || currentUser.role === 'shop')) {
      setLoadingNotifications(true);
      notificationService.getNotifications(currentUser.id, currentUser.role)
        .then(res => {
          setNotifications(res.data);
          setLoadingNotifications(false);
          // Mark all as read
          if (res.data.some(n => !n.isRead)) {
            notificationService.markAllRead(currentUser.id, currentUser.role).then(() => {
              setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
              setUnreadCount(0);
            });
          }
        })
        .catch(() => setLoadingNotifications(false));
    }
  }, [showNotifications, currentUser]);

  // Fetch unread count on mount or when currentUser changes
  useEffect(() => {
    if (currentUser && (currentUser.role === 'admin' || currentUser.role === 'shop')) {
      notificationService.getNotifications(currentUser.id, currentUser.role)
        .then(res => setUnreadCount(res.data.filter(n => !n.isRead).length))
        .catch(() => setUnreadCount(0));
    }
  }, [currentUser]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (notificationDropdownRef.current && !notificationDropdownRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    }
    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications]);

  // Add pickup driver assignment functions
  const openAssignPickupDriverModal = async (pickup) => {
    setSelectedPickupForDriver(pickup);
    setPickupDriverSearchTerm('');
    setAssigningPickupDriver(false);
    try {
      const { data } = await adminService.getDrivers({ isApproved: true });
      setAvailableDrivers(data);
      setShowAssignPickupDriverModal(true);
    } catch (error) {
      setStatusMessage({ type: 'error', text: 'Failed to fetch available drivers.' });
    }
  };

  const assignDriverToPickup = async (driverId) => {
    if (!selectedPickupForDriver || !driverId) return;
    setAssigningPickupDriver(true);
    try {
      await adminService.assignDriverToPickup(selectedPickupForDriver.id, driverId);
      // Refresh pickups data
      const pickupsResponse = await adminService.getAllPickups();
      setPickups(pickupsResponse.data || []);
      setShowAssignPickupDriverModal(false);
      setStatusMessage({ type: 'success', text: 'Driver assigned to pickup successfully!' });
    } catch (error) {
      setStatusMessage({ type: 'error', text: error.response?.data?.message || 'Failed to assign driver.' });
    } finally {
      setAssigningPickupDriver(false);
    }
  };

  const updatePickupStatus = async (pickupId, status) => {
    setPickupStatusUpdating(prev => ({ ...prev, [pickupId]: true }));
    try {
      await adminService.updatePickupStatus(pickupId, status);
      const pickupsResponse = await adminService.getAllPickups();
      setPickups(pickupsResponse.data || []);
      setStatusMessage({ type: 'success', text: 'Pickup status updated.' });
    } catch (error) {
      setStatusMessage({ type: 'error', text: error.response?.data?.message || 'Failed to update status.' });
    } finally {
      setPickupStatusUpdating(prev => ({ ...prev, [pickupId]: false }));
    }
  };

  // Clear status message after 3 seconds
  useEffect(() => {
    if (statusMessage) {
      const timer = setTimeout(() => {
        setStatusMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [statusMessage]);

  // Print AWB (admin mobile)
  const handlePrintAWB = async (pkg) => {
    try {
      // Ensure we have Items for AWB
      let packageForAwb = pkg;
      if (!pkg?.Items || !Array.isArray(pkg.Items)) {
        try {
          const resp = await packageService.getPackageById(pkg.id);
          if (resp && resp.data) packageForAwb = resp.data;
        } catch (e) {}
      }

      const qrDataUrl = await QRCode.toDataURL(packageForAwb.trackingNumber || '');
      const logoUrl = window.location.origin + '/logo.jpg';
      const cod = parseFloat((packageForAwb.codAmount != null ? packageForAwb.codAmount : pkg.codAmount) || 0);
      const isShopify = (packageForAwb.shopifyOrderId !== undefined && packageForAwb.shopifyOrderId !== null && packageForAwb.shopifyOrderId !== '');
      const itemsSum = (Array.isArray(packageForAwb.Items) && packageForAwb.Items.length > 0)
        ? packageForAwb.Items.reduce((sum, it) => sum + (parseFloat(it.codAmount || 0) || 0), 0)
        : cod;
      const shippingValue = Number(packageForAwb.shownDeliveryCost ?? packageForAwb.deliveryCost ?? pkg.shownDeliveryCost ?? pkg.deliveryCost ?? 0) || 0;
      const subTotal = isShopify ? itemsSum : cod;
      const shippingTaxes = isShopify ? Math.max(0, cod - itemsSum) : shippingValue;
      const total = isShopify ? cod : (cod + shippingValue);
      const shopName = packageForAwb.Shop?.businessName || packageForAwb.shop?.businessName || '-';
      const awbPkg = packageForAwb;
      const totalsRows = isShopify
        ? `<tr><td>Sub Total:</td><td>${subTotal.toFixed(2)} EGP</td></tr>`
          + `<tr><td>Shipping & Taxes:</td><td>${shippingTaxes.toFixed(2)} EGP</td></tr>`
          + `<tr><td><b>Total:</b></td><td><b>${total.toFixed(2)} EGP</b></td></tr>`
        : `<tr><td>Sub Total:</td><td>${subTotal.toFixed(2)} EGP</td></tr>`
          + `<tr><td>Shipping:</td><td>${shippingValue.toFixed(2)} EGP</td></tr>`
          + `<tr><td><b>Total:</b></td><td><b>${total.toFixed(2)} EGP</b></td></tr>`;
      const awbHtml = `
        <html>
          <head>
            <title>Droppin Air Waybill</title>
            <style>
              body { font-family: Arial, sans-serif; background: #fff; color: #111; margin: 0; padding: 0; }
              .awb-container { width: 800px; margin: 0 auto; padding: 32px; background: #fff; }
              .awb-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #111; padding-bottom: 16px; }
              .awb-logo { height: 80px; width: auto; }
              .awb-title { font-size: 2rem; font-weight: bold; }
              .awb-shop-name { font-size: 1.2rem; font-weight: bold; color: #004b6f; margin-top: 4px; }
              .awb-section { margin-top: 24px; }
              .awb-table { width: 100%; border-collapse: collapse; margin-top: 16px; }
              .awb-table th, .awb-table td { border: 1px solid #111; padding: 8px; text-align: left; }
              .awb-table th { background: #f5f5f5; }
              .awb-info-table { width: 100%; margin-top: 16px; }
              .awb-info-table td { padding: 4px 8px; }
              .awb-footer { margin-top: 32px; text-align: center; font-size: 1.1rem; font-weight: bold; }
              .awb-tracking { font-size: 22px; font-weight: bold; }
              .awb-recipient { font-size: 18px; font-weight: bold; }
              .awb-phone { font-size: 18px; font-weight: bold; }
              .awb-address { font-size: 18px; font-weight: bold; }
              .awb-data { margin-left: 0; }
              .awb-row { display: block; }
            </style>
          </head>
          <body onload="window.print()">
            <div class="awb-container">
              <div class="awb-header">
                <img src="${logoUrl}" class="awb-logo" alt="Droppin Logo" />
                <div>
                  <img src="${qrDataUrl}" alt="QR Code" style="height:140px;width:140px;" />
                </div>
              </div>
              <div class="awb-section">
                <table class="awb-info-table">
                  <tr>
                    <td><span class="awb-row"><b class="awb-tracking">Tracking #:</b><span class="awb-tracking awb-data">${awbPkg.trackingNumber || '-'}</span></span>
                    <div class="awb-shop-name">Shop Name: ${shopName}</div>
                    </td>
                    <td><b>Date:</b> ${awbPkg.createdAt ? new Date(awbPkg.createdAt).toLocaleDateString() : '-'}</td>
                  </tr>
                  <tr>
                    <td colspan="2">
                      <span class="awb-row"><b class="awb-recipient">Recipient:</b><span class="awb-recipient awb-data">${awbPkg.deliveryContactName || '-'}</span></span><br/>
                      <span class="awb-row"><b class="awb-phone">Phone:</b><span class="awb-phone awb-data">${awbPkg.deliveryContactPhone || '-'}</span></span><br/>
                      <span class="awb-row"><b class="awb-address">Address:</b><span class="awb-address awb-data">${awbPkg.deliveryAddress || '-'}</span></span>
                    </td>
                  </tr>
                </table>
              </div>
              <div class="awb-section">
                <b>Description:</b> ${awbPkg.packageDescription || '-'}
              </div>
              <table class="awb-table">
                <thead>
                  <tr><th>Item</th><th>Qty</th><th>COD Per Unit</th><th>Total COD</th></tr>
                </thead>
                <tbody>
                  ${
                    awbPkg.Items && awbPkg.Items.length > 0
                      ? awbPkg.Items.map(item => `
                        <tr>
                          <td>${item.description || '-'}</td>
                          <td>${item.quantity}</td>
                          <td>${item.codAmount && item.quantity ? (item.codAmount / item.quantity).toFixed(2) : '0.00'} EGP</td>
                          <td>${parseFloat(item.codAmount || 0).toFixed(2)} EGP</td>
                        </tr>
                      `).join('')
                      : `<tr>
                          <td>${awbPkg.packageDescription || '-'}</td>
                          <td>${awbPkg.itemsNo ?? 1}</td>
                          <td>${cod.toFixed(2)} EGP</td>
                          <td>${cod.toFixed(2)} EGP</td>
                        </tr>`
                  }
                </tbody>
              </table>
              <div class="awb-section" style="display:flex;justify-content:flex-end;">
                <table class="awb-info-table" style="width:300px;">
                  ${totalsRows}
                </table>
              </div>
              <div class="awb-footer">Thank you for your order!</div>
            </div>
          </body>
        </html>
      `;
      const w = window.open('', '_blank');
      w.document.open();
      w.document.write(awbHtml);
      w.document.close();
    } catch (e) {
      alert('Failed to generate AWB');
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="mobile-admin-dashboard-icon" style={{ fontSize: 36 }}>👨‍💼</div>
            <div className="mobile-notification-bell-wrapper" style={{ position: 'relative' }}>
              <button
                className="mobile-notification-bell"
                onClick={() => setShowNotifications(v => !v)}
                aria-label="Notifications"
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 28, padding: 0, margin: 0 }}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
                  <path d="M12 22c1.1 0 2-.9 2-2h-4a2 2 0 0 0 2 2zm6-6V11c0-3.3-2-6-6-6s-6 2.7-6 6v5l-2 2v1h16v-1l-2-2z" />
                </svg>
                {unreadCount > 0 && (
                  <span className="mobile-notification-badge" style={{ position: 'absolute', top: -4, right: -4, background: '#d32f2f', color: '#fff', borderRadius: '50%', fontSize: 12, padding: '2px 6px', minWidth: 18, textAlign: 'center', fontWeight: 700 }}>{unreadCount}</span>
                )}
              </button>
              {showNotifications && (
                <div className="mobile-notification-dropdown" ref={notificationDropdownRef} style={{ position: 'absolute', right: 0, top: 36, background: '#fff', border: '1px solid #eee', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.15)', width: 320, zIndex: 1000 }}>
                  <div style={{ padding: '10px', borderBottom: '1px solid #eee', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#222' }}>
                    <span>Notifications</span>
                    {(currentUser?.role === 'admin' || currentUser?.role === 'shop') && notifications.length > 0 && (
                      <button
                        onClick={() => {
                          notificationService.deleteAll(currentUser.id, currentUser.role).then(() => {
                            setNotifications([]);
                            setUnreadCount(0);
                          });
                        }}
                        style={{ background: 'none', border: 'none', color: '#c00', marginLeft: 8, cursor: 'pointer' }}
                        title="Delete all notifications"
                      >
                        <FaTrashAlt size={16} />
                      </button>
                    )}
                  </div>
                  {loadingNotifications ? (
                    <div style={{ padding: 12 }}>Loading...</div>
                  ) : notifications.length === 0 ? (
                    <div style={{ padding: 24, textAlign: 'center', color: '#888', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', opacity: 0.3 }}>
                        <path d="M12 22c1.1 0 2-.9 2-2h-4a2 2 0 0 0 2 2zm6-6V11c0-3.3-2-6-6-6s-6 2.7-6 6v5l-2 2v1h16v-1l-2-2z" />
                      </svg>
                      <div style={{ fontWeight: 500, fontSize: 16 }}>No notifications</div>
                    </div>
                  ) : (
                    <ul style={{ listStyle: 'none', margin: 0, padding: 0, maxHeight: 320, overflowY: 'auto' }}>
                      {notifications.slice(0, 10).map(notif => (
                        <li key={notif.id} style={{ padding: 10, borderBottom: '1px solid #f0f0f0', background: notif.isRead ? '#fff' : '#f5faff' }}>
                          <div style={{ fontWeight: notif.isRead ? 'normal' : 'bold', color: '#222' }}>{notif.title}</div>
                          <div style={{ fontSize: 13, color: '#555' }}>{notif.message}</div>
                          <div style={{ fontSize: 11, color: '#aaa', marginTop: 2 }}>{new Date(notif.createdAt).toLocaleString()}</div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Status Message Display */}
        {statusMessage && (
          <div 
            className="mobile-admin-dashboard-status-message"
            style={{
              padding: '12px 16px',
              marginBottom: '16px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              backgroundColor: statusMessage.type === 'success' ? '#d4edda' : '#f8d7da',
              color: statusMessage.type === 'success' ? '#155724' : '#721c24',
              border: `1px solid ${statusMessage.type === 'success' ? '#c3e6cb' : '#f5c6cb'}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <span>{statusMessage.text}</span>
            <button
              onClick={() => setStatusMessage(null)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '18px',
                cursor: 'pointer',
                color: 'inherit',
                padding: '0',
                marginLeft: '8px'
              }}
            >
              ×
            </button>
          </div>
        )}

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

        <div className="mobile-admin-dashboard-search-bar" style={{ padding: '12px', background: '#fff', borderBottom: '1px solid #eee' }}>
          <input
            type="text"
            placeholder="Search packages, drivers, shops..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '16px' }}
          />
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
                  <div className="mobile-admin-dashboard-stat-number">${dashboardStats.profit ?? 0}</div>
              <div className="mobile-admin-dashboard-stat-label">System Revenue</div>
            </div>
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
              {filteredUsers.map((user) => (
                <div key={user.id} className="mobile-admin-dashboard-user-card" onClick={() => {
                  if (user.role === 'driver') {
                    openDriverDetailsModal(user);
                  } else {
                    setSelectedUser(user);
                  }
                }} style={{ cursor: 'pointer' }}>
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
                className={`mobile-admin-dashboard-sub-tab ${packageSubTab === 'cancelled' ? 'active' : ''}`}
                onClick={() => setPackageSubTab('cancelled')}
              >
                Cancelled
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
              {filteredPackages.map((pkg) => (
                <div key={pkg.id} className="mobile-admin-dashboard-package-card" onClick={() => openDetailsModal(pkg)} style={{ cursor: 'pointer' }}>
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
                      return (
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>

                          {canForward && (
                            <button
                              onClick={async (e) => {
                                e.stopPropagation();
                                try {
                                  const flow = ['assigned', 'pickedup', 'in-transit', 'delivered'];
                                  const idx = flow.indexOf(pkg.status);
                                  const next = idx !== -1 && idx < flow.length - 1 ? flow[idx + 1] : null;
                                  if (!next) return;
                                  await packageService.updatePackageStatus(pkg.id, { status: next });
                                  fetchPackages();
                                } catch (err) {
                                  alert('Failed to forward status');
                                }
                              }}
                              className="mobile-admin-dashboard-pickup-details-btn"
                              style={{ backgroundColor: '#007bff', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '4px' }}
                            >
                              Forward Status
                            </button>
                          )}
                        </div>
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
                  <p><strong>Driver:</strong> {(() => {
                    const driver = drivers.find(d => d.driverId === pickup.driverId || d.id === pickup.driverId);
                    return driver ? driver.name : 'Unassigned';
                  })()}</p>
                  <div className="mobile-admin-dashboard-pickup-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {pickup.status === 'scheduled' && (
                        <>
                          <button
                            onClick={() => openAssignPickupDriverModal(pickup)}
                            className="mobile-admin-dashboard-assign-driver-btn"
                            style={{ backgroundColor: '#007bff', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '4px' }}
                          >
                            Assign Driver
                          </button>
                          <button
                            onClick={() => handleMarkPickupAsPickedUp(pickup.id)}
                            className="mobile-admin-dashboard-mark-pickedup-btn"
                            style={{ backgroundColor: '#28a745', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '4px' }}
                          >
                            Mark as Picked Up
                          </button>
                        </>
                      )}
                    </div>
                    <button 
                      onClick={() => openPickupDetailsModal(pickup)} 
                      className="mobile-admin-dashboard-pickup-details-btn"
                      style={{ backgroundColor: '#007bff', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '4px' }}
                    >
                      View Details
                    </button>
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
              <div style={{ display:'flex', justifyContent:'flex-end', marginBottom: 12 }}>
                <button
                  className="mobile-shop-package-details-btn"
                  onClick={(e) => { e.stopPropagation(); handlePrintAWB(selectedPackage); }}
                  style={{ background: '#6c757d', color: '#fff' }}
                >
                  Print AWB
                </button>
              </div>
              <button className="mobile-modal-close" onClick={closeDetailsModal}>&times;</button>
            </div>
            <div className="mobile-modal-body">
              <div className="mobile-modal-details-grid">
                <div className="mobile-modal-detail-item"><span className="label">Tracking #</span><span>{selectedPackage.trackingNumber}</span></div>
                <div className="mobile-modal-detail-item"><span className="label">Status</span><span>{selectedPackage.status}</span></div>
                <div className="mobile-modal-detail-item"><span className="label">Created</span><span>{new Date(selectedPackage.createdAt).toLocaleString()}</span></div>
                {selectedPackage.actualDeliveryTime && (
                  <div className="mobile-modal-detail-item"><span className="label">Delivery Time</span><span>{new Date(selectedPackage.actualDeliveryTime).toLocaleString()}</span></div>
                )}
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
                <div className="mobile-modal-detail-item"><span className="label">Delivery Cost</span>
                {editingDeliveryCost ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                      type="number"
                      value={newDeliveryCost}
                      onChange={e => setNewDeliveryCost(e.target.value)}
                      style={{ width: 80, padding: '6px 10px', borderRadius: 4, border: '1px solid #ccc', fontSize: '1em' }}
                      min="0"
                    />
                    <button
                      onClick={async () => {
                        setSavingDeliveryCost(true);
                        try {
                          await adminService.updatePackage(selectedPackage.id, { deliveryCost: parseFloat(newDeliveryCost) });
                          // Refetch the updated package from the backend
                          const refreshed = await adminService.getPackages({ id: selectedPackage.id });
                          if (refreshed.data && Array.isArray(refreshed.data) && refreshed.data.length > 0) {
                            setSelectedPackage(refreshed.data[0]);
                          } else if (refreshed.data && refreshed.data.id) {
                            setSelectedPackage(refreshed.data);
                          }
                          setEditingDeliveryCost(false);
                          fetchPackages();
                          fetchDashboardData();
                        } catch (err) {
                          alert('Failed to update delivery cost');
                        } finally {
                          setSavingDeliveryCost(false);
                        }
                      }}
                      disabled={savingDeliveryCost || newDeliveryCost === ''}
                      style={{ background: '#28a745', color: 'white', border: 'none', borderRadius: 4, padding: '6px 16px', fontWeight: 'bold', cursor: savingDeliveryCost ? 'not-allowed' : 'pointer', marginRight: 4 }}
                    >
                      {savingDeliveryCost ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={() => setEditingDeliveryCost(false)}
                      style={{ background: '#f5f5f5', color: '#333', border: '1px solid #ccc', borderRadius: 4, padding: '6px 16px', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                      Cancel
                    </button>
                  </span>
                ) : (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontWeight: 500 }}>${parseFloat(selectedPackage.deliveryCost || 0).toFixed(2)}</span>
                    <button
                      style={{ background: '#fff', border: '1px solid #007bff', color: '#007bff', borderRadius: 4, padding: '4px 12px', marginLeft: 4, cursor: 'pointer', fontWeight: 'bold' }}
                      onClick={() => {
                        setEditingDeliveryCost(true);
                        setNewDeliveryCost(
                          selectedPackage.deliveryCost !== undefined && selectedPackage.deliveryCost !== null
                            ? String(selectedPackage.deliveryCost)
                            : '0'
                        );
                      }}
                    >
                      Edit
                    </button>
                  </span>
                )}
                </div>
                {selectedPackage.shownDeliveryCost !== undefined && selectedPackage.shownDeliveryCost !== null && (
                  <div className="mobile-modal-detail-item"><span className="label">Shown Delivery Cost</span><span>${parseFloat(selectedPackage.shownDeliveryCost).toFixed(2)}</span></div>
                )}
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
                <div className="mobile-modal-detail-item"><span className="label">Number of Items</span><span>{selectedPackage?.itemsNo ?? '-'}</span></div>
                
                {/* Items Section */}
                {selectedPackage.Items && selectedPackage.Items.length > 0 && (
                  <div className="mobile-modal-detail-item full-width">
                    <span className="label">Items Details ({selectedPackage.Items.length} items)</span>
                    <div style={{ 
                      backgroundColor: '#f9f9f9', 
                      padding: '0.5rem', 
                      borderRadius: '4px',
                      border: '1px solid #e0e0e0',
                      marginTop: '0.5rem'
                    }}>
                      {selectedPackage.Items.map((item, index) => (
                        <div key={index} style={{ 
                          border: '1px solid #ddd', 
                          padding: '0.75rem', 
                          marginBottom: '0.5rem', 
                          borderRadius: '4px',
                          backgroundColor: 'white'
                        }}>
                          <div style={{ fontWeight: 'bold', marginBottom: '0.5rem', color: '#333' }}>
                            Item {index + 1}
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.9rem' }}>
                            <div>
                              <strong>Description:</strong> {item.description || 'No description'}
                            </div>
                            <div>
                              <strong>Quantity:</strong> {item.quantity || 1}
                            </div>
                            <div>
                              <strong>COD Per Unit:</strong> ${item.codAmount && item.quantity ? (parseFloat(item.codAmount) / parseInt(item.quantity)).toFixed(2) : '0.00'}
                            </div>
                            <div>
                              <strong>Total COD:</strong> ${parseFloat(item.codAmount || 0).toFixed(2)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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
                    
                    {/* Shipping Fees Section */}
                    <div className="mobile-modal-detail-item full-width" style={{ borderTop: '1px solid #eee', paddingTop: 12, marginTop: 12 }}>
                      <span className="label">Shipping Fees:</span>
                      <div style={{ marginTop: 8 }}>
                        <div style={{ marginBottom: 8 }}>
                          <span style={{ fontWeight: 'bold', display: 'block', marginBottom: 4 }}>Current Shipping Fees:</span>
                          <span>${parseFloat(selectedUser.shippingFees || 0).toFixed(2)}</span>
                        </div>
                        <div style={{ marginBottom: 8 }}>
                          <span style={{ fontWeight: 'bold', display: 'block', marginBottom: 4 }}>Current Shown Shipping Fees:</span>
                          <span>{selectedUser.shownShippingFees !== null && selectedUser.shownShippingFees !== undefined ? `${parseFloat(selectedUser.shownShippingFees).toFixed(2)}` : '-'}</span>
                        </div>
                        {editingShippingFees ? (
                          <div>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="New shipping fees amount"
                              value={newShippingFees}
                              onChange={e => setNewShippingFees(e.target.value)}
                              style={{ padding: '6px 8px', borderRadius: '4px', border: '1px solid #ccc', width: '100%', marginBottom: 6 }}
                            />
                            <div style={{ display: 'flex', gap: 8 }}>
                              <button
                                className="mobile-admin-dashboard-settle-btn"
                                style={{ flex: 1, background: '#28a745', color: '#fff' }}
                                disabled={savingShippingFees || !newShippingFees || isNaN(Number(newShippingFees))}
                                onClick={async () => {
                                  if (!newShippingFees || isNaN(Number(newShippingFees)) || Number(newShippingFees) < 0) {
                                    setShippingFeesError('Please enter a valid amount.');
                                    return;
                                  }
                                  setSavingShippingFees(true);
                                  setShippingFeesError('');
                                  try {
                                    const res = await adminService.updateShop(selectedUser.shopId || selectedUser.id, {
                                      shippingFees: parseFloat(newShippingFees)
                                    });
                                    // Refresh user details
                                    const response = await adminService.getShopById(selectedUser.shopId || selectedUser.id);
                                    if (response && response.data) {
                                      setSelectedUser({ ...response.data, entityType: selectedUser.entityType });
                                    }
                                    setEditingShippingFees(false);
                                    setNewShippingFees('');
                                    // Refetch users and dashboard data
                                    fetchUsers && fetchUsers();
                                    fetchDashboardData && fetchDashboardData();
                                  } catch (err) {
                                    setShippingFeesError(err.response?.data?.message || 'Failed to update shipping fees.');
                                  } finally {
                                    setSavingShippingFees(false);
                                  }
                                }}
                              >
                                {savingShippingFees ? 'Saving...' : 'Save'}
                              </button>
                              <button
                                className="mobile-admin-dashboard-settle-btn"
                                style={{ flex: 1, background: '#6c757d', color: '#fff' }}
                                onClick={() => {
                                  setEditingShippingFees(false);
                                  setNewShippingFees('');
                                  setShippingFeesError('');
                                }}
                              >
                                Cancel
                              </button>
                            </div>
                            {shippingFeesError && (
                              <div style={{ marginTop: 6, color: '#d32f2f', fontWeight: 500 }}>
                                {shippingFeesError}
                              </div>
                            )}
                          </div>
                        ) : (
                          <button
                            className="mobile-admin-dashboard-settle-btn"
                            style={{ background: '#007bff', color: '#fff' }}
                            onClick={() => {
                              setEditingShippingFees(true);
                              setNewShippingFees(selectedUser.shippingFees?.toString() || '');
                            }}
                          >
                            Edit Shipping Fees
                          </button>
                        )}
                      </div>
                    </div>
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
            <div className="mobile-modal-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0 }}>Package #{selectedAdminPackage.trackingNumber}</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  className="mobile-shop-package-details-btn"
                  onClick={(e) => { e.stopPropagation(); handlePrintAWB(selectedAdminPackage); }}
                  style={{ background: '#007bff', color: '#fff' }}
                >
                  Print AWB
                </button>
                <button className="mobile-modal-close" onClick={() => setSelectedAdminPackage(null)}>&times;</button>
              </div>
            </div>
            <div className="mobile-modal-body">
              <div className="mobile-modal-details-grid">
                <div className="mobile-modal-detail-item"><span className="label">Tracking #</span><span>{selectedAdminPackage.trackingNumber}</span></div>
                <div className="mobile-modal-detail-item"><span className="label">Status</span><span>{selectedAdminPackage.status}</span></div>
                <div className="mobile-modal-detail-item"><span className="label">Created</span><span>{selectedAdminPackage.createdAt ? new Date(selectedAdminPackage.createdAt).toLocaleString() : ''}</span></div>
                {selectedAdminPackage.actualDeliveryTime && (
                  <div className="mobile-modal-detail-item"><span className="label">Delivery Time</span><span>{new Date(selectedAdminPackage.actualDeliveryTime).toLocaleString()}</span></div>
                )}
                <div className="mobile-modal-detail-item full-width"><span className="label">Description</span><span>{selectedAdminPackage.packageDescription || 'No description'}</span></div>
                <div className="mobile-modal-detail-item"><span className="label">Sender</span><span>{selectedAdminPackage.shop?.businessName || 'N/A'}</span></div>
                <div className="mobile-modal-detail-item"><span className="label">Recipient</span><span>{selectedAdminPackage.deliveryContactName || 'N/A'}</span></div>
                <div className="mobile-modal-detail-item"><span className="label">Recipient Phone</span><span>{selectedAdminPackage.deliveryContactPhone || 'N/A'}</span></div>
                <div className="mobile-modal-detail-item full-width"><span className="label">Delivery Address</span><span>{selectedAdminPackage.deliveryAddress || 'N/A'}</span></div>
                <div className="mobile-modal-detail-item"><span className="label">COD</span><span>${parseFloat(selectedAdminPackage.codAmount || 0).toFixed(2)} {selectedAdminPackage.isPaid ? 'Paid' : 'Unpaid'}</span></div>
                <div className="mobile-modal-detail-item"><span className="label">Delivery Cost</span>
                {editingDeliveryCost ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                      type="number"
                      value={newDeliveryCost}
                      onChange={e => setNewDeliveryCost(e.target.value)}
                      style={{ width: 80, padding: '6px 10px', borderRadius: 4, border: '1px solid #ccc', fontSize: '1em' }}
                      min="0"
                    />
                    <button
                      onClick={async () => {
                        setSavingDeliveryCost(true);
                        try {
                          await adminService.updatePackage(selectedAdminPackage.id, { deliveryCost: parseFloat(newDeliveryCost) });
                          // Refetch the updated package from the backend
                          const refreshed = await adminService.getPackages({ id: selectedAdminPackage.id });
                          if (refreshed.data && Array.isArray(refreshed.data) && refreshed.data.length > 0) {
                            setSelectedAdminPackage(refreshed.data[0]);
                          } else if (refreshed.data && refreshed.data.id) {
                            setSelectedAdminPackage(refreshed.data);
                          }
                          setEditingDeliveryCost(false);
                          fetchPackages();
                          fetchDashboardData();
                        } catch (err) {
                          alert('Failed to update delivery cost');
                        } finally {
                          setSavingDeliveryCost(false);
                        }
                      }}
                      disabled={savingDeliveryCost || newDeliveryCost === ''}
                      style={{ background: '#28a745', color: 'white', border: 'none', borderRadius: 4, padding: '6px 16px', fontWeight: 'bold', cursor: savingDeliveryCost ? 'not-allowed' : 'pointer', marginRight: 4 }}
                    >
                      {savingDeliveryCost ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={() => setEditingDeliveryCost(false)}
                      style={{ background: '#f5f5f5', color: '#333', border: '1px solid #ccc', borderRadius: 4, padding: '6px 16px', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                      Cancel
                    </button>
                  </span>
                ) : (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontWeight: 500 }}>${parseFloat(selectedAdminPackage.deliveryCost || 0).toFixed(2)}</span>
                    <button
                      style={{ background: '#fff', border: '1px solid #007bff', color: '#007bff', borderRadius: 4, padding: '4px 12px', marginLeft: 4, cursor: 'pointer', fontWeight: 'bold' }}
                      onClick={() => {
                        setEditingDeliveryCost(true);
                        setNewDeliveryCost(
                          selectedAdminPackage.deliveryCost !== undefined && selectedAdminPackage.deliveryCost !== null
                            ? String(selectedAdminPackage.deliveryCost)
                            : '0'
                        );
                      }}
                    >
                      Edit
                    </button>
                  </span>
                )}
                </div>
                {selectedAdminPackage.shownDeliveryCost !== undefined && selectedAdminPackage.shownDeliveryCost !== null && (
                  <div className="mobile-modal-detail-item"><span className="label">Shown Delivery Cost</span><span>${parseFloat(selectedAdminPackage.shownDeliveryCost).toFixed(2)}</span></div>
                )}
                {selectedAdminPackage.weight && (
                  <div className="mobile-modal-detail-item"><span className="label">Weight</span><span>{selectedAdminPackage.weight} kg</span></div>
                )}
                {selectedAdminPackage.dimensions && (
                  <div className="mobile-modal-detail-item"><span className="label">Dimensions</span><span>{selectedAdminPackage.dimensions}</span></div>
                )}
                <div className="mobile-modal-detail-item"><span className="label">Number of Items</span><span>{selectedAdminPackage?.itemsNo ?? '-'}</span></div>
                
                {/* Items Section */}
                {selectedAdminPackage.Items && selectedAdminPackage.Items.length > 0 && (
                  <div className="mobile-modal-detail-item full-width">
                    <span className="label">Items Details ({selectedAdminPackage.Items.length} items)</span>
                    <div style={{ 
                      backgroundColor: '#f9f9f9', 
                      padding: '0.5rem', 
                      borderRadius: '4px',
                      border: '1px solid #e0e0e0',
                      marginTop: '0.5rem'
                    }}>
                      {selectedAdminPackage.Items.map((item, index) => (
                        <div key={index} style={{ 
                          border: '1px solid #ddd', 
                          padding: '0.75rem', 
                          marginBottom: '0.5rem', 
                          borderRadius: '4px',
                          backgroundColor: 'white'
                        }}>
                          <div style={{ fontWeight: 'bold', marginBottom: '0.5rem', color: '#333' }}>
                            Item {index + 1}
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.9rem' }}>
                            <div>
                              <strong>Description:</strong> {item.description || 'No description'}
                            </div>
                            <div>
                              <strong>Quantity:</strong> {item.quantity || 1}
                            </div>
                            <div>
                              <strong>COD Per Unit:</strong> ${item.codAmount && item.quantity ? (parseFloat(item.codAmount) / parseInt(item.quantity)).toFixed(2) : '0.00'}
                            </div>
                            <div>
                              <strong>Total COD:</strong> ${parseFloat(item.codAmount || 0).toFixed(2)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="mobile-modal-actions">
                {/* Forward Status Button */}
                {(() => {
                  const statusFlow = ['assigned', 'pickedup', 'in-transit', 'delivered'];
                  const currentIndex = statusFlow.indexOf(selectedAdminPackage.status);
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
                      className="mobile-admin-dashboard-settle-btn"
                      style={{ background: '#007bff', color: '#fff', border: 'none', borderRadius: '6px', padding: '0.5rem 1.2rem', fontWeight: 'bold', marginRight: '0.5rem', marginBottom: '0.5rem', fontSize: '1em', boxShadow: '0 1px 2px rgba(0,0,0,0.04)', cursor: 'pointer' }}
                      onClick={async () => {
                        await packageService.updatePackageStatus(selectedAdminPackage.id, { status: nextStatus });
                        setSelectedAdminPackage(null);
                        fetchPackages && fetchPackages();
                        fetchDashboardData && fetchDashboardData();
                      }}
                    >
                      {nextLabel}
                    </button>
                  );
                })()}

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

                {/* Reject Button - only show for packages between assigned and delivered */}
                {['assigned', 'pickedup', 'in-transit'].includes(selectedAdminPackage.status) && (
                  <button
                    className="mobile-admin-dashboard-settle-btn"
                    onClick={async () => {
                      setPackageToReject(selectedAdminPackage);
                      setShowRejectConfirmation(true);
                    }}
                    style={{ background: '#dc3545', color: '#fff', border: 'none', borderRadius: '6px', padding: '0.5rem 1.2rem', fontWeight: 'bold', fontSize: '1em', boxShadow: '0 1px 2px rgba(0,0,0,0.04)', cursor: 'pointer' }}
                  >
                    Reject
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

      {/* Driver Details Modal */}
      {showDriverDetailsModal && selectedDriver && (
        <div className="mobile-modal-overlay" onClick={() => setShowDriverDetailsModal(false)}>
          <div className="mobile-modal-content" onClick={e => e.stopPropagation()}>
            <div className="mobile-modal-header">
              <h3>Driver Details - {selectedDriver.name}</h3>
              <button className="mobile-modal-close" onClick={() => setShowDriverDetailsModal(false)}>&times;</button>
            </div>
            <div className="mobile-modal-body">
              <div className="mobile-modal-details-grid">
                <div className="mobile-modal-detail-item"><span className="label">Name</span><span>{selectedDriver.name}</span></div>
                <div className="mobile-modal-detail-item"><span className="label">Email</span><span>{selectedDriver.email}</span></div>
                <div className="mobile-modal-detail-item"><span className="label">Phone</span><span>{selectedDriver.phone}</span></div>
                <div className="mobile-modal-detail-item"><span className="label">Role</span><span>{selectedDriver.role}</span></div>
                <div className="mobile-modal-detail-item"><span className="label">Joined</span><span>{selectedDriver.createdAt ? new Date(selectedDriver.createdAt).toLocaleDateString() : ''}</span></div>
                
                {/* Vehicle Information */}
                <div className="mobile-modal-detail-item full-width">
                  <span className="label">Vehicle Information:</span>
                  <div style={{ marginTop: 8 }}>
                    <div><strong>Vehicle Type:</strong> {selectedDriver.vehicleType || 'Not provided'}</div>
                    <div><strong>License Plate:</strong> {selectedDriver.licensePlate || 'Not provided'}</div>
                    <div><strong>Model:</strong> {selectedDriver.model || 'Not provided'}</div>
                    <div><strong>Color:</strong> {selectedDriver.color || 'Not provided'}</div>
                    <div><strong>Driver License:</strong> {selectedDriver.driverLicense || 'Not provided'}</div>
                  </div>
                </div>

                {/* Working Area */}
                <div className="mobile-modal-detail-item full-width">
                  <span className="label">Working Area:</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                    <span>{selectedDriver.workingArea || 'Not set'}</span>
                    <button
                      className="mobile-modal-edit-btn"
                      onClick={() => openWorkingAreaModal(selectedDriver)}
                      style={{ padding: '4px 8px', fontSize: '12px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px' }}
                    >
                      Edit
                    </button>
                  </div>
                </div>

                {/* Driver Statistics */}
                <div className="mobile-modal-detail-item full-width">
                  <span className="label">Statistics:</span>
                  <div style={{ marginTop: 8 }}>
                    <div><strong>Total Deliveries:</strong> {selectedDriver.totalDeliveries || 0}</div>
                    <div><strong>Total Assigned:</strong> {selectedDriver.totalAssigned || 0}</div>
                    <div><strong>Total Cancelled:</strong> {selectedDriver.totalCancelled || 0}</div>
                    <div><strong>Active Assignments:</strong> {selectedDriver.activeAssign || 0}</div>
                    <div><strong>Assigned Today:</strong> {selectedDriver.assignedToday || 0}</div>
                  </div>
                </div>

                {/* Give Money Section */}
                <div className="mobile-modal-detail-item full-width" style={{ marginTop: 16, padding: '16px', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #e9ecef' }}>
                  <h4 style={{ marginBottom: 12, color: '#495057', fontSize: '1rem', fontWeight: 600 }}>
                    💰 Give Money to Driver
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: 4, fontWeight: 500, color: '#495057', fontSize: '14px' }}>
                        Amount ($):
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={giveMoneyAmount}
                        onChange={(e) => setGiveMoneyAmount(e.target.value)}
                        placeholder="Enter amount"
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          border: '1px solid #ced4da',
                          borderRadius: '4px',
                          fontSize: '14px'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: 4, fontWeight: 500, color: '#495057', fontSize: '14px' }}>
                        Reason (Optional):
                      </label>
                      <input
                        type="text"
                        value={giveMoneyReason}
                        onChange={(e) => setGiveMoneyReason(e.target.value)}
                        placeholder="Enter reason for payment"
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          border: '1px solid #ced4da',
                          borderRadius: '4px',
                          fontSize: '14px'
                        }}
                      />
                    </div>
                    <button
                      onClick={handleGiveMoneyToDriver}
                      disabled={givingMoney || !giveMoneyAmount || isNaN(parseFloat(giveMoneyAmount)) || parseFloat(giveMoneyAmount) <= 0}
                      style={{
                        padding: '10px 16px',
                        backgroundColor: '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '14px',
                        fontWeight: 600,
                        cursor: givingMoney || !giveMoneyAmount || isNaN(parseFloat(giveMoneyAmount)) || parseFloat(giveMoneyAmount) <= 0 ? 'not-allowed' : 'pointer',
                        opacity: givingMoney || !giveMoneyAmount || isNaN(parseFloat(giveMoneyAmount)) || parseFloat(giveMoneyAmount) <= 0 ? 0.6 : 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8
                      }}
                    >
                      {givingMoney ? (
                        <>
                          <div style={{ width: '16px', height: '16px', border: '2px solid #ffffff', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                          Processing...
                        </>
                      ) : (
                        <>
                          💰 Give Money
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Driver Packages */}
                <div className="mobile-modal-detail-item full-width">
                  <span className="label">Driver Packages:</span>
                  <div style={{ marginTop: 8 }}>
                    {loadingDriverPackages ? (
                      <div style={{ textAlign: 'center', padding: '20px' }}>Loading packages...</div>
                    ) : driverPackages.length > 0 ? (
                      <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                        {driverPackages.map(pkg => (
                          <div key={pkg.id} style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px', marginBottom: '8px', fontSize: '12px' }}>
                            <div><strong>#{pkg.trackingNumber}</strong> - {pkg.status}</div>
                            <div>{pkg.packageDescription}</div>
                            <div>To: {pkg.deliveryContactName}</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>No packages assigned</div>
                    )}
                  </div>
                </div>
              </div>
              <div className="mobile-modal-actions">
                <button className="mobile-modal-close-btn" onClick={() => setShowDriverDetailsModal(false)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Working Area Modal */}
      {showWorkingAreaModal && selectedDriverForWorkingArea && (
        <div className="mobile-modal-overlay" onClick={() => setShowWorkingAreaModal(false)}>
          <div className="mobile-modal-content" onClick={e => e.stopPropagation()}>
            <div className="mobile-modal-header">
              <h3>Update Working Area - {selectedDriverForWorkingArea.name}</h3>
              <button className="mobile-modal-close" onClick={() => setShowWorkingAreaModal(false)}>&times;</button>
            </div>
            <div className="mobile-modal-body">
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
                  Working Area:
                </label>
                <input
                  type="text"
                  value={workingAreaInput}
                  onChange={(e) => setWorkingAreaInput(e.target.value)}
                  placeholder="Enter working area"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                    fontSize: '16px'
                  }}
                />
              </div>
              <div className="mobile-modal-actions">
                <button
                  className="mobile-modal-close-btn"
                  onClick={() => updateDriverWorkingArea(selectedDriverForWorkingArea.driverId || selectedDriverForWorkingArea.id, workingAreaInput)}
                  disabled={updatingWorkingArea}
                >
                  {updatingWorkingArea ? 'Updating...' : 'Update'}
                </button>
                <button className="mobile-modal-close-btn" onClick={() => setShowWorkingAreaModal(false)} disabled={updatingWorkingArea}>Cancel</button>
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

      {/* Assign Pickup Driver Modal */}
      {showAssignPickupDriverModal && selectedPickupForDriver && (
        <div className="mobile-modal-overlay" onClick={() => setShowAssignPickupDriverModal(false)}>
          <div className="mobile-modal-content" onClick={e => e.stopPropagation()}>
            <div className="mobile-modal-header">
              <h3>Assign Driver to Pickup</h3>
              <button className="mobile-modal-close" onClick={() => setShowAssignPickupDriverModal(false)}>&times;</button>
            </div>
            <div className="mobile-modal-body">
              <p><strong>Shop:</strong> {selectedPickupForDriver.Shop?.businessName || 'N/A'}</p>
              <p><strong>Scheduled Time:</strong> {new Date(selectedPickupForDriver.scheduledTime).toLocaleString()}</p>
              <input
                type="text"
                placeholder="Search drivers..."
                value={pickupDriverSearchTerm}
                onChange={e => setPickupDriverSearchTerm(e.target.value)}
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', marginBottom: '1rem' }}
              />
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {availableDrivers
                  .filter(driver =>
                    driver.name?.toLowerCase().includes(pickupDriverSearchTerm.toLowerCase()) ||
                    driver.email?.toLowerCase().includes(pickupDriverSearchTerm.toLowerCase())
                  )
                  .length === 0 ? (
                  <p>No available drivers found.</p>
                ) : (
                  availableDrivers
                    .filter(driver =>
                      driver.name?.toLowerCase().includes(pickupDriverSearchTerm.toLowerCase()) ||
                      driver.email?.toLowerCase().includes(pickupDriverSearchTerm.toLowerCase())
                    )
                    .map(driver => (
                      <div key={driver.id} style={{ 
                        padding: '12px', 
                        border: '1px solid #eee', 
                        borderRadius: '4px', 
                        marginBottom: '8px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <div>
                          <strong>{driver.name}</strong>
                          <br />
                          <span style={{ fontSize: '14px', color: '#666' }}>{driver.email}</span>
                          <br />
                          <span style={{ fontSize: '14px', color: '#666' }}>Phone: {driver.phone}</span>
                        </div>
                        <button
                          onClick={() => assignDriverToPickup(driver.driverId)}
                          disabled={assigningPickupDriver}
                          style={{
                            backgroundColor: '#007bff',
                            color: 'white',
                            border: 'none',
                            padding: '8px 12px',
                            borderRadius: '4px',
                            cursor: assigningPickupDriver ? 'not-allowed' : 'pointer'
                          }}
                        >
                          {assigningPickupDriver ? 'Assigning...' : 'Assign'}
                        </button>
                      </div>
                    ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status Message */}
      {statusMessage && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          padding: '12px 16px',
          borderRadius: '4px',
          color: 'white',
          backgroundColor: statusMessage.type === 'success' ? '#28a745' : '#dc3545',
          zIndex: 9999,
          maxWidth: '300px'
        }}>
          {statusMessage.text}
        </div>
      )}
    </div>
  );
};

export default MobileAdminDashboard;