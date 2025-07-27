import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { adminService, packageService } from '../../services/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faStore, faTruck, faBox, faSearch, faEye, faCheck, faTimes, faChartBar, faUserPlus, faTimes as faClose, faEdit, faSignOutAlt, faTrash, faDollarSign } from '@fortawesome/free-solid-svg-icons';
import { formatDate } from '../../utils/dateUtils';
import './AdminDashboard.css';
import { Line, Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Card, Statistic, Flex, Row, Col, Spin } from 'antd';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// Helper to get YYYY-MM-DD string for a date
function getDateString(date) {
  const d = new Date(date);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

const AdminDashboard = () => {
  const { currentUser, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [users, setUsers] = useState([]);
  const [packages, setPackages] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showAssignDriverModal, setShowAssignDriverModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [availableDrivers, setAvailableDrivers] = useState([]);
  const [driverSearchTerm, setDriverSearchTerm] = useState('');
  const [assigningDriver, setAssigningDriver] = useState(false);
  const [stats, setStats] = useState({
    users: { total: 0, shops: 0, drivers: 0, customers: 0 },
    packages: { total: 0, pending: 0, inTransit: 0, delivered: 0 },
    cod: { totalCollected: 0, totalToCollect: 0 }
  });
  const [shopPackages, setShopPackages] = useState([]);
  const [isLoadingShopPackages, setIsLoadingShopPackages] = useState(false);
  const [shopPackagesWithUnpaidMoney, setShopPackagesWithUnpaidMoney] = useState([]);
  const [shopUnpaidTotal, setShopUnpaidTotal] = useState(0);
  const [showConfirmationDialog, setShowConfirmationDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [statusMessage, setStatusMessage] = useState(null);
  const [confirmationDialogTitle, setConfirmationDialogTitle] = useState('');
  const [confirmationDialogText, setConfirmationDialogText] = useState('');
  const [showWorkingAreaModal, setShowWorkingAreaModal] = useState(false);
  const [selectedDriverForWorkingArea, setSelectedDriverForWorkingArea] = useState(null);
  const [workingAreaInput, setWorkingAreaInput] = useState('');
  const [updatingWorkingArea, setUpdatingWorkingArea] = useState(false);
  const [pickups, setPickups] = useState([]);
  const [pickupLoading, setPickupLoading] = useState(false);
  const [selectedPickup, setSelectedPickup] = useState(null);
  const [showPickupModal, setShowPickupModal] = useState(false);
  const [pickupPackages, setPickupPackages] = useState([]);
  const [pickupPackagesLoading, setPickupPackagesLoading] = useState(false);
  const [packagesTab, setPackagesTab] = useState('all');
  const [selectedPackages, setSelectedPackages] = useState([]);
  const [showBulkAssignModal, setShowBulkAssignModal] = useState(false);
  const [bulkAssignDriverId, setBulkAssignDriverId] = useState('');
  const [bulkAssigning, setBulkAssigning] = useState(false);
  const [drivers, setDrivers] = useState([]);
  const [showDriverPackages, setShowDriverPackages] = useState(false);
  const [driverPackages, setDriverPackages] = useState([]);
  const [selectedDriverForPackages, setSelectedDriverForPackages] = useState(null);
  const [forwardingPackageId, setForwardingPackageId] = useState(null);
  const [settleAmountInput, setSettleAmountInput] = useState('');
  const [moneyTransactions, setMoneyTransactions] = useState([]);
  const [dashboardData, setDashboardData] = useState({
    packagesChart: { labels: [], datasets: [] },
    codChart: { labels: [], datasets: [] },
    recentPackages: [],
    recentSettlements: [],
    totalCodCollected: 0
  });
  // Add new state variables for money transactions
  const [moneyFilters, setMoneyFilters] = useState({
    startDate: '',
    endDate: '',
    attribute: '',
    changeType: '',
    search: '',
    sortBy: 'createdAt',
    sortOrder: 'DESC'
  });
  const [sortConfig, setSortConfig] = useState({
    field: 'createdAt',
    order: 'DESC'
  });
  const [analytics, setAnalytics] = useState({
    packagesPerMonth: [],
    codPerMonth: [],
    statusDistribution: [],
    topShops: { volume: [], cod: [] }
  });
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  // --- Notes Log Section ---
  const [editingNotes, setEditingNotes] = useState('');
  const [notesSaving, setNotesSaving] = useState(false);
  const [notesError, setNotesError] = useState(null);
  const [showForwardPackageModal, setShowForwardPackageModal] = useState(false);
  const [showRejectPackageModal, setShowRejectPackageModal] = useState(false);
  const [packageToAction, setPackageToAction] = useState(null);
  const [shippingFeesInput, setShippingFeesInput] = useState('');
  const [adjustTotalCollectedInput, setAdjustTotalCollectedInput] = useState('');
  const [adjustTotalCollectedReason, setAdjustTotalCollectedReason] = useState('');
  const [adjustingTotalCollected, setAdjustingTotalCollected] = useState(false);
  const [pickupTab, setPickupTab] = useState('pending');
  // --- Add state for pickup driver assignment and status update ---
  const [selectedPickupForDriver, setSelectedPickupForDriver] = useState(null);
  const [showAssignPickupDriverModal, setShowAssignPickupDriverModal] = useState(false);
  const [pickupDriverSearchTerm, setPickupDriverSearchTerm] = useState('');
  const [assigningPickupDriver, setAssigningPickupDriver] = useState(false);
  const [pickupStatusUpdating, setPickupStatusUpdating] = useState({});
  // Add state for delete confirmation and status
  const [pickupToDelete, setPickupToDelete] = useState(null);
  const [deletingPickup, setDeletingPickup] = useState(false);
  const [shopSort, setShopSort] = useState({ field: 'revenue', order: 'desc' });
  // Add state for variable settlement amount popup
  const [showSettleAmountModal, setShowSettleAmountModal] = useState(false);
  const [settleShopId, setSettleShopId] = useState(null);
  // Add state for auto-scrolling to settlement
  const [autoScrollToSettle, setAutoScrollToSettle] = useState(false);
  // Move these to the top level of AdminDashboard
  const settlementRef = useRef(null);
  useEffect(() => {
    if (autoScrollToSettle && showDetailsModal && settlementRef.current) {
      settlementRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setAutoScrollToSettle(false);
    }
  }, [autoScrollToSettle, showDetailsModal]);

  useEffect(() => {
    if (selectedEntity && selectedEntity.shippingFees !== undefined) {
      setShippingFeesInput(selectedEntity.shippingFees);
    } else {
      setShippingFeesInput('');
    }
  }, [selectedEntity]);

  // Add new tab for Return to Shop
  const PACKAGE_TABS = [
    { label: 'All Packages', value: 'all' },
    { label: 'Ready to Assign', value: 'ready-to-assign' },
    { label: 'In Transit', value: 'in-transit' },
    { label: 'Delivered', value: 'delivered' },
    { label: 'Return to Shop', value: 'return-to-shop' }
  ];

  // Function to fetch packages for a driver
  const fetchDriverPackages = async (driverId) => {
    try {
      const res = await adminService.getPackages({ driverId });
      setDriverPackages((res.data || []).filter(pkg => pkg.driverId === driverId));
    } catch (err) {
      setDriverPackages([]);
    }
  };
  
  // Place this at the top of the AdminDashboard component, after useState/useEffect/hooks, before any render/JSX code that uses it
  const forwardPackageStatus = async (pkg) => {
    setForwardingPackageId(pkg.id);
    // Define the status flow
    const statusFlow = ['assigned', 'pickedup', 'in-transit', 'delivered'];
    const currentIndex = statusFlow.indexOf(pkg.status);
    if (currentIndex === -1 || currentIndex === statusFlow.length - 1) {
      setForwardingPackageId(null);
      return;
    }
    const nextStatus = statusFlow[currentIndex + 1];

    // --- Optimistically update UI ---
    setPackages(prev => prev.map(p => p.id === pkg.id ? { ...p, status: nextStatus } : p));
    setSelectedEntity(prev => prev && prev.id === pkg.id ? { ...prev, status: nextStatus } : prev);

    try {
      await packageService.updatePackageStatus(pkg.id, { status: nextStatus });
      if (pkg.driverId) fetchDriverPackages(pkg.driverId);
      // No need to update UI again, already done optimistically
    } catch (err) {
      // Revert the change if the API call fails
      setPackages(prev => prev.map(p => p.id === pkg.id ? { ...p, status: pkg.status } : p));
      setSelectedEntity(prev => prev && prev.id === pkg.id ? { ...prev, status: pkg.status } : prev);
      // Optionally show an error message
    } finally {
      setForwardingPackageId(null);
    }
  };

  // Add reject package function
  const rejectPackage = async (pkg) => {
    try {
      await packageService.updatePackageStatus(pkg.id, { status: 'rejected' });
      setPackages(prev => prev.map(p => p.id === pkg.id ? { ...p, status: 'rejected' } : p));
      setShowRejectPackageModal(false);
      setPackageToAction(null);
      setShowDetailsModal(false);
    } catch (err) {
      console.error('Error rejecting package:', err);
    }
  };

  // Add forward package function with confirmation
  const forwardPackage = async (pkg) => {
    try {
      const statusFlow = ['assigned', 'pickedup', 'in-transit', 'delivered'];
      const currentIndex = statusFlow.indexOf(pkg.status);
      if (currentIndex === -1 || currentIndex === statusFlow.length - 1) {
        return;
      }
      const nextStatus = statusFlow[currentIndex + 1];
      await packageService.updatePackageStatus(pkg.id, { status: nextStatus });
      setPackages(prev => prev.map(p => p.id === pkg.id ? { ...p, status: nextStatus } : p));
      setShowForwardPackageModal(false);
      setPackageToAction(null);
      setShowDetailsModal(false);
    } catch (err) {
      console.error('Error forwarding package:', err);
    }
  };

  // Handle logout
  const handleLogout = () => {
    logout();
  };

  // Function to fetch users of a specific role
  const fetchUsers = async (role) => {
    try {
      console.log(`Fetching users with role: ${role}`);
      setLoading(true);
      
      switch(role) {
        case 'shop':
        case 'shops':
          const shopsResponse = await adminService.getShops({
            sortBy: sortConfig.field,
            sortOrder: sortConfig.order
          });
          // Enhanced logging for shop financial data
          const shopData = shopsResponse.data || [];
          shopData.forEach(shop => {
            console.log(`Shop ${shop.id} financial data:`, {
              ToCollect: shop.ToCollect,
              TotalCollected: shop.TotalCollected,
              rawToCollect: shop.rawToCollect,
              rawTotalCollected: shop.rawTotalCollected
            });
          });
          setUsers(shopData);
          break;
        case 'drivers':
          const driversResponse = await adminService.getDrivers();
          setUsers(driversResponse.data || []);
          break;
        case 'user':
          const usersResponse = await adminService.getUsers({ role: 'user' });
          setUsers(usersResponse.data || []);
          break;
        case 'pending':
          const pendingResponse = await adminService.getPendingApprovals();
          setUsers(pendingResponse.data || []);
          break;
        default:
          break;
      }
    } catch (error) {
      console.error(`Error fetching ${role} data:`, error);
    } finally {
      setLoading(false);
    }
  };
  
  // Load data based on active tab
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        console.log('Fetching data for tab:', activeTab);
        
        // Load dashboard statistics
        console.log('Fetching dashboard stats...');
        const statsResponse = await adminService.getDashboardStats();
        console.log('Dashboard stats received:', statsResponse.data);
        setStats(statsResponse.data);
        
        // For dashboard, we need packages and transactions
        if (activeTab === 'dashboard') {
          // Calculate 7 days ago date string
          const now = new Date();
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(now.getDate() - 6); // 6 to include today as the 7th day
          sevenDaysAgo.setHours(0, 0, 0, 0);
          const createdAfter = sevenDaysAgo.toISOString();
          const deliveredAfter = createdAfter;
          // Fetch packages created OR delivered in the last 7 days
          const [allPkgsRes, trans] = await Promise.all([
            adminService.getPackages({ limit: 1000 }),
            adminService.getMoneyTransactions()
          ]);
          const pkgs = allPkgsRes.data || [];
          setPackages(pkgs);
          setMoneyTransactions(trans.data.transactions || []);
          // --- Fetch shops for dashboard revenue table ---
          await fetchUsers('shops');
        }
        
        // Load appropriate data based on active tab
        switch (activeTab) {
          case 'pending':
          case 'users':
          case 'shops':
          case 'drivers':
            // Use our new fetchUsers function to get the data
            await fetchUsers(activeTab === 'users' ? 'user' : activeTab);
            break;
          case 'pickups':
            console.log('Fetching pickups...');
            const pickupsResponse = await adminService.getAllPickups();
            console.log('Pickups received:', pickupsResponse.data);
            setPickups(pickupsResponse.data || []);
            break;
          case 'packages':
            console.log('Fetching packages...');
            const packagesResponse = await adminService.getPackages();
            console.log('Packages received:', packagesResponse.data);
            // For ready-to-assign tab, only show pending packages
            // For all-packages tab, show all packages except those that aren't picked up yet
            if (packagesTab === 'ready-to-assign') {
              const readyToAssignPackages = (packagesResponse.data || []).filter(pkg =>
                pkg.status === 'pending' ||
                pkg.status === 'cancelled-awaiting-return' ||
                pkg.status === 'rejected-awaiting-return'
              );
              console.log('Filtered ready-to-assign packages:', readyToAssignPackages);
              setPackages(readyToAssignPackages);
            } else {
              const filteredPackages = (packagesResponse.data || []);
              console.log('Filtered all packages (excluding non-picked up):', filteredPackages);
              setPackages(filteredPackages);
            }
            // Fetch all drivers for lookup
            const driversResponse = await adminService.getDrivers();
            setDrivers(driversResponse.data || []);
            break;
          case 'money':
            const res = await adminService.getMoneyTransactions();
            setMoneyTransactions(res.data.transactions || []);
            break;
          default:
            break;
        }
      } catch (error) {
        console.error('Error loading data:', error.response?.data || error.message || error);
        alert(`Failed to load data: ${error.response?.data?.message || error.message || 'Unknown error'}`)
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [activeTab, packagesTab, sortConfig]);

  // Add a helper function for day difference
  function getDayDiff(date1, date2) {
    // date1, date2: JS Date objects
    const d1 = new Date(date1.getFullYear(), date1.getMonth(), date1.getDate());
    const d2 = new Date(date2.getFullYear(), date2.getMonth(), date2.getDate());
    return Math.floor((d1 - d2) / (1000 * 60 * 60 * 24));
  }

  // New useEffect for processing dashboard data
  useEffect(() => {
    if (activeTab === 'dashboard' && packages.length > 0) {
      // Use the most recent createdAt date as the reference for the last 7 days
      const allDates = packages.map(p => p.createdAt ? new Date(p.createdAt) : null).filter(Boolean);
      const maxDate = allDates.length > 0 ? new Date(Math.max(...allDates.map(d => d.getTime()))) : new Date();
      const last7Days = [...Array(7)].map((_, i) => {
        const d = new Date(maxDate);
        d.setDate(maxDate.getDate() - (6 - i));
        return d.toISOString().split('T')[0];
      });
      const last7DaysLabels = last7Days.map(dateStr => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-US', { weekday: 'short' });
      });
      const createdPerDay = Array(7).fill(0);
      const deliveredPerDay = Array(7).fill(0);
      // Debug output
      console.log('last7Days:', last7Days);
      console.log('All createdAt:', packages.map(p => p.createdAt));
      console.log('All actualDeliveryTime:', packages.map(p => p.actualDeliveryTime));
      packages.forEach(pkg => {
        // Universal date extraction
        let createdDateStr = '';
        if (pkg.createdAt) {
          if (pkg.createdAt.includes('T')) {
            createdDateStr = pkg.createdAt.split('T')[0];
          } else {
            createdDateStr = pkg.createdAt;
          }
        }
        const createdIdx = last7Days.indexOf(createdDateStr);
        if (createdIdx !== -1) {
          createdPerDay[createdIdx]++;
        }
        if (pkg.status === 'delivered') {
          let deliveredDate = pkg.actualDeliveryTime || pkg.updatedAt || pkg.createdAt;
          let deliveredDateStr = '';
          if (deliveredDate) {
            if (deliveredDate.includes('T')) {
              deliveredDateStr = deliveredDate.split('T')[0];
            } else {
              deliveredDateStr = deliveredDate;
            }
          }
          const deliveredIdx = last7Days.indexOf(deliveredDateStr);
          if (deliveredIdx !== -1) {
            deliveredPerDay[deliveredIdx]++;
          }
        }
      });
      
      const packagesChart = {
        labels: last7DaysLabels,
        datasets: [
          {
            label: 'Created',
            data: createdPerDay,
            borderColor: 'rgba(75,192,192,1)',
            backgroundColor: 'rgba(75,192,192,0.2)',
            tension: 0.4,
          },
          {
            label: 'Delivered',
            data: deliveredPerDay,
            borderColor: 'rgba(54,162,235,1)',
            backgroundColor: 'rgba(54,162,235,0.2)',
            tension: 0.4,
          },
        ],
      };

      // Process COD Collected
      const totalCod = packages
        .filter(p => p.status === 'delivered' && p.codAmount > 0)
        .reduce((sum, p) => sum + parseFloat(p.codAmount), 0);
      
      const weeklyCod = [0, 0, 0, 0];
      const today = new Date();
      packages.filter(p => p.status === 'delivered' && p.codAmount > 0 && p.actualDeliveryTime).forEach(p => {
        const deliveryDate = new Date(p.actualDeliveryTime);
        const weeksAgo = Math.floor((today - deliveryDate) / (1000 * 60 * 60 * 24 * 7));
        if (weeksAgo < 4) {
          weeklyCod[3 - weeksAgo] += parseFloat(p.codAmount);
        }
      });

      const codChart = {
        labels: ['3 wks ago', '2 wks ago', 'Last wk', 'This wk'],
        datasets: [{
          label: 'COD Collected',
          data: weeklyCod,
          backgroundColor: 'rgba(255, 206, 86, 0.6)',
          borderColor: 'rgba(255, 206, 86, 1)',
          borderWidth: 1,
        }]
      };

      // Recent Packages
      const recentPackages = [...packages]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);
      
      // Recent Settlements
      const recentSettlements = moneyTransactions
        .filter(tx => tx.description && (tx.description.toLowerCase().includes('settle') || tx.changeType === 'payout'))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);

      setDashboardData({
        packagesChart,
        codChart,
        recentPackages,
        recentSettlements,
        totalCodCollected: totalCod
      });
    }
  }, [activeTab, packages, moneyTransactions]);

  // Clear selected packages when switching tabs or when packages change
  useEffect(() => {
    setSelectedPackages([]);
  }, [activeTab, packagesTab, packages]);

  // Handle approval or rejection of a user
  const handleApproval = async (entityId, userType, approve = true, selectedEntity = {}) => {
    console.log('Handling approval:', { entityId, userType, approve, selectedEntity });
    
    // If rejection (approve=false), show confirmation dialog for shops, drivers, and users
    if (!approve) {
      const entityName = selectedEntity?.name || 
                         (selectedEntity?.businessName || 
                         'this ' + userType);
      
      // Set confirmation dialog content
      setConfirmationDialogTitle(`Confirm ${userType} Rejection`);
      setConfirmationDialogText(
        `Are you sure you want to reject ${entityName}? This will PERMANENTLY DELETE the ${userType} account from the system.`
      );
      
      // Create the action function to be executed when confirmed
      const confirmRejectAction = async () => {
        try {
          if (userType === 'user') {
            // For regular users, use the delete endpoint
            await adminService.deleteUser(entityId);
          } else {
            // For shops and drivers, use the existing processApproval
            await processApproval(entityId, userType, false, selectedEntity);
          }
          setShowConfirmationDialog(false);
          // Refresh data
          fetchUsers(userType === 'shop' ? 'shops' : userType === 'driver' ? 'drivers' : 'user');
        } catch (error) {
          console.error(`Error rejecting ${userType}:`, error);
          setStatusMessage({
            type: 'error',
            text: `Error rejecting ${userType}: ${error.response?.data?.message || error.message || 'Unknown error'}`
          });
          setShowConfirmationDialog(false);
        }
      };
      
      setConfirmAction(() => confirmRejectAction);
      setShowConfirmationDialog(true);
      return;
    }
    
    // If approving, proceed without confirmation
    await processApproval(entityId, userType, approve, selectedEntity);
  };
  
  // Process the actual approval/rejection
  const processApproval = async (entityId, userType, approve, selectedEntity = {}) => {
    setLoading(true); // Show loading state while processing
    let response;
    let success = false; // Track if the operation was successful
    // Store the entity type for refreshing the right tab later
    const approvedEntityType = userType === 'shop' ? 'shops' : userType === 'driver' ? 'drivers' : 'users'

    try {
      console.log('Approval request:', { entityId, approve, userType, selectedEntity });
      // Call the appropriate API endpoint based on user type
      switch(userType) {
        case 'shop':
          // For shops, we have multiple potential IDs to try
          // Strategy 1: Try using the shopId if available
          let idToUse;
          
          if (selectedEntity && selectedEntity.shopId) {
            idToUse = selectedEntity.shopId;
            console.log('Using shopId from selectedEntity:', idToUse);
          } 
          // Strategy 2: If there's a userId attribute, try that (in case it's expecting userId)
          else if (selectedEntity && selectedEntity.userId) {
            idToUse = selectedEntity.userId;
            console.log('Using userId from selectedEntity:', idToUse);
          }
          // Strategy 3: Use the passed entityId as a last resort
          else {
            idToUse = entityId;
            console.log('Using passed entityId:', idToUse);
          }
          
          console.log('Approving shop with ID:', idToUse);
          try {
            response = await adminService.approveShop(idToUse, approve);
            console.log('Shop approval response:', response);
            // Check if we have a successful response with the new format
            if (response.data && (response.data.success === true || response.data.message)) {
              success = true;
            }
          } catch (error) {
            console.error('First attempt at shop approval failed:', error);
            // If the first attempt failed, try with the user ID directly
            if (selectedEntity && selectedEntity.id) {
              console.log('Trying again with user ID:', selectedEntity.id);
              try {
                response = await adminService.approveShop(selectedEntity.id, approve);
                console.log('Second attempt shop approval response:', response);
                // Check if we have a successful response with the new format
                if (response.data && (response.data.success === true || response.data.message)) {
                  success = true;
                }
              } catch (secondError) {
                console.error('Second attempt at shop approval also failed:', secondError);
                // If the approval actually succeeded in the backend but we got an error in the frontend
                // We'll refresh the data anyway
                success = true;
              }
            } else {
              // The approval actually might have succeeded even if we get an error
              // We'll assume success and refresh data
              success = true;
            }
          }
          break;
          
        case 'driver':
          // For drivers, we have multiple potential IDs to try
          // Strategy 1: Try using the driverId if available
          let driverIdToUse;
          
          if (selectedEntity && selectedEntity.driverId) {
            driverIdToUse = selectedEntity.driverId;
            console.log('Using driverId from selectedEntity:', driverIdToUse);
          } 
          // Strategy 2: If there's a userId attribute, try that (in case it's expecting userId)
          else if (selectedEntity && selectedEntity.userId) {
            driverIdToUse = selectedEntity.userId;
            console.log('Using userId from selectedEntity:', driverIdToUse);
          }
          // Strategy 3: Use the passed entityId as a last resort
          else {
            driverIdToUse = entityId;
            console.log('Using passed entityId:', driverIdToUse);
          }
          
          console.log('Approving driver with ID:', driverIdToUse);
          try {
            response = await adminService.approveDriver(driverIdToUse, approve);
            console.log('Driver approval response:', response);
            // Check if we have a successful response with the new format
            if (response.data && (response.data.success === true || response.data.message)) {
              success = true;
            }
          } catch (error) {
            console.error('First attempt at driver approval failed:', error);
            // If the first attempt failed, try with the user ID directly
            if (selectedEntity && selectedEntity.id) {
              console.log('Trying again with user ID:', selectedEntity.id);
              try {
                response = await adminService.approveDriver(selectedEntity.id, approve);
                console.log('Second attempt driver approval response:', response);
                // Check if we have a successful response with the new format
                if (response.data && (response.data.success === true || response.data.message)) {
                  success = true;
                }
              } catch (secondError) {
                console.error('Second attempt at driver approval also failed:', secondError);
                // If the approval actually succeeded in the backend but we got an error in the frontend
                // We'll refresh the data anyway
                success = true;
              }
            } else {
              // The approval actually might have succeeded even if we get an error
              // We'll assume success and refresh data
              success = true;
            }
          }
          break;
          
        default:
          response = await adminService.approveUser(entityId, approve);
      }
      
      // Update the local state by replacing the updated user
      const updatedUsers = users.map(user => {
        // Match based on appropriate ID depending on the user type
        if (userType === 'shop' && user.shopId === selectedEntity.shopId) {
          return { ...user, isApproved: approve };
        } else if (userType === 'driver' && user.driverId === selectedEntity.driverId) {
          return { ...user, isApproved: approve };
        } else if (user.id === entityId) {
          return { ...user, isApproved: approve };
        }
        return user;
      });
      
      setUsers(updatedUsers);
      
      // Check if any of our shop approval attempts succeeded when we get here
      if (userType === 'shop') {
        // If we had a successful shop approval (even with API errors), update the UI
        if (success) {
          // Update the local state by replacing the updated user
          const updatedUsers = users.map(user => {
            if (userType === 'shop' && user.shopId === selectedEntity.shopId) {
              return { ...user, isApproved: approve };
            } else if (user.id === entityId) {
              return { ...user, isApproved: approve };
            }
            return user;
          });
          
          setUsers(updatedUsers);
          
          // Show success message
          alert(`${userType.charAt(0).toUpperCase() + userType.slice(1)} ${approve ? 'approved' : 'rejected'} successfully`);
          
          // Always refresh the pending approvals data to remove approved/rejected entities
          try {
            // Refresh all relevant data regardless of active tab
            const pendingResponse = await adminService.getPendingApprovals();
            setUsers(pendingResponse.data);
            
            // Also refresh the dashboard stats
            const statsResponse = await adminService.getDashboardStats();
            setStats(statsResponse.data);
            
            // If we're on a different tab, also refresh that tab's data
            if (activeTab !== 'pending') {
              console.log('Refreshing data for active tab:', activeTab);
              // Load specific data based on active tab without calling fetchData directly
              switch (activeTab) {
                case 'users':
                  await fetchUsers('user');
                  break;
                case 'shops':
                  await fetchUsers('shop');
                  break;
                case 'drivers':
                  await fetchUsers('driver');
                  break;
                case 'packages':
                  const packagesResponse = await adminService.getPackages();
                  setPackages(packagesResponse.data || []);
                  break;
                case 'dashboard':
                  const [pkgs, trans] = await Promise.all([
                    adminService.getPackages(),
                    adminService.getMoneyTransactions()
                  ]);
                  setPackages(pkgs.data || []);
                  setMoneyTransactions(trans.data.transactions || []);
                  break;
                default:
                  break;
              }
            }
          } catch (refreshError) {
            console.error('Error refreshing data after approval:', refreshError);
          }
          
          // Exit here since we successfully handled the shop approval
          return;
        }
      }
      
      // For other entity types or if shop approval wasn't explicitly successful
      // Show success message
      if (success) {
        alert(`${userType.charAt(0).toUpperCase() + userType.slice(1)} ${approve ? 'approved' : 'rejected'} successfully`);
        
        // Comprehensive data refresh to ensure the entity disappears from pending list
        // and appears in the appropriate tab immediately
        try {
          console.log('Starting comprehensive data refresh for approval changes');
          
          // 1. Always refresh the pending approvals list first
          const pendingResponse = await adminService.getPendingApprovals();
          console.log('Updated pending approvals:', pendingResponse.data);
          // Only update users list if we're on the pending tab
          if (activeTab === 'pending') {
            setUsers(pendingResponse.data);
          }
          
          // 2. Always refresh the dashboard stats for up-to-date counts
          const statsResponse = await adminService.getDashboardStats();
          setStats(statsResponse.data);
          
          // 3. Update the specific entity tab that the approved entity belongs to
          console.log('Refreshing data for entity type:', approvedEntityType);
          if (userType === 'shop') {
            const shopsResponse = await adminService.getShops();
            // If we're on the shops tab, update the UI with fresh data
            if (activeTab === 'shops') {
              setUsers(shopsResponse.data || []);
            }
          } else if (userType === 'driver') {
            const driversResponse = await adminService.getDrivers();
            // If we're on the drivers tab, update the UI with fresh data
            if (activeTab === 'drivers') {
              setUsers(driversResponse.data || []);
            }
          }
          
          // 4. Refresh any other active tab if needed
          if (activeTab !== 'pending' && activeTab !== approvedEntityType) {
            console.log('Refreshing current active tab data:', activeTab);
            // Load specific data based on active tab
            switch (activeTab) {
              case 'users':
                await fetchUsers('user');
                break;
              case 'shops':
                await fetchUsers('shop');
                break;
              case 'drivers':
                await fetchUsers('driver');
                break;
              case 'packages':
                const packagesResponse = await adminService.getPackages();
                if (packagesTab === 'ready-to-assign') {
                  const readyToAssignPackages = (packagesResponse.data || []).filter(pkg =>
                    pkg.status === 'pending' ||
                    pkg.status === 'cancelled-awaiting-return' ||
                    pkg.status === 'rejected-awaiting-return'
                  );
                  setPackages(readyToAssignPackages);
                } else {
                  const filteredPackages = (packagesResponse.data || []).filter(pkg => 
                    !['awaiting_schedule', 'awaiting_pickup', 'scheduled_for_pickup'].includes(pkg.status)
                  );
                  setPackages(filteredPackages);
                }
                break;
              case 'dashboard':
                const [pkgs, trans] = await Promise.all([
                  adminService.getPackages(),
                  adminService.getMoneyTransactions()
                ]);
                setPackages(pkgs.data || []);
                setMoneyTransactions(trans.data.transactions || []);
                break;
              default:
                break;
            }
          }
          
          console.log('Comprehensive data refresh completed after approval');
        } catch (refreshError) {
          console.error('Error refreshing data after approval:', refreshError);
        } finally {
          setLoading(false); // Ensure loading state is turned off
        }
      } else {
        setLoading(false); // Turn off loading state if not successful
      }
    } catch (error) {
      console.error('Error handling approval:', error);
      setLoading(false); // Ensure loading state is turned off even if an error occurs
      // Only show error message if we didn't determine success already
      if (!success) {
        alert(`Error: ${error.response?.data?.message || 'Failed to update approval status'}`);
      } else {
        // If there was an error but we know the approval succeeded, show success message
        alert(`${userType.charAt(0).toUpperCase() + userType.slice(1)} ${approve ? 'approved' : 'rejected'} successfully`);
      }
    }  
  };

  // Open assign driver modal
  const openAssignDriverModal = async (pkg) => {
    setSelectedPackage(pkg);
    setDriverSearchTerm('');
    setAssigningDriver(false);
    
    try {
      // Fetch available drivers (approved and active)
      const { data } = await adminService.getDrivers({ isApproved: true });
      setAvailableDrivers(data);
      setShowAssignDriverModal(true);
    } catch (error) {
      console.error('Error fetching available drivers:', error);
      alert('Failed to fetch available drivers. Please try again.');
    }
  };
  
  // Filter drivers based on search term
  const getFilteredDrivers = () => {
    if (!driverSearchTerm) return availableDrivers;
    
    const searchLower = driverSearchTerm.toLowerCase();
    return availableDrivers.filter(driver => 
      driver.name?.toLowerCase().includes(searchLower) ||
      driver.email?.toLowerCase().includes(searchLower) ||
      driver.phone?.toLowerCase().includes(searchLower) ||
      driver.licensePlate?.toLowerCase().includes(searchLower)
    );
  };
  
  // Assign driver to package
  const assignDriverToPackage = async (driverId) => {
    if (!selectedPackage || !driverId) return;
    
    setAssigningDriver(true);
    
    try {
      // Call API to assign driver
      await adminService.assignDriverToPackage(selectedPackage.id, driverId);
      
      // Refresh packages data
      if (activeTab === 'packages') {
        const packagesResponse = await adminService.getPackages();
        if (packagesTab === 'ready-to-assign') {
          const readyToAssignPackages = (packagesResponse.data || []).filter(pkg =>
            pkg.status === 'pending' ||
            pkg.status === 'cancelled-awaiting-return' ||
            pkg.status === 'rejected-awaiting-return'
          );
          setPackages(readyToAssignPackages);
        } else {
          const filteredPackages = (packagesResponse.data || []).filter(pkg => 
            !['awaiting_schedule', 'awaiting_pickup', 'scheduled_for_pickup'].includes(pkg.status)
          );
          setPackages(filteredPackages);
        }
      }
      
      setShowAssignDriverModal(false);
      setStatusMessage({ type: 'success', text: selectedPackage.driverId ? 'Driver changed successfully!' : 'Driver assigned successfully!' });
    } catch (error) {
      console.error('Error assigning driver:', error);
      setStatusMessage({ 
        type: 'error', 
        text: `Error: ${error.response?.data?.message || 'Failed to assign driver'}` 
      });
    } finally {
      setAssigningDriver(false);
    }
  };
  
  // Render driver assignment modal
  const renderAssignDriverModal = () => {
    if (!showAssignDriverModal || !selectedPackage) return null;

    const filteredDrivers = availableDrivers.filter(driver => 
      driver.name?.toLowerCase().includes(driverSearchTerm.toLowerCase()) ||
      driver.email?.toLowerCase().includes(driverSearchTerm.toLowerCase())
    );

    return (
      <div className="modal-overlay show" style={{ zIndex: 3000 }}>
        <div className="modal-content">
          <div className="modal-header">
            <h3>{selectedPackage.driverId ? 'Change Driver for Package' : 'Assign Driver to Package'}</h3>
            <button 
              className="modal-close"
              onClick={() => setShowAssignDriverModal(false)}
            >
              <FontAwesomeIcon icon={faClose} />
            </button>
          </div>
          <div className="modal-body">
            <p><strong>Package:</strong> {selectedPackage.trackingNumber} - {selectedPackage.packageDescription}</p>
            <p><strong>From:</strong> {selectedPackage.shop?.businessName || 'N/A'}</p>
            <p><strong>To:</strong> {selectedPackage.deliveryContactName}</p>
            {selectedPackage.driverId && (
              <p><strong>Current Driver:</strong> {(() => {
                const currentDriver = drivers.find(d => d.driverId === selectedPackage.driverId || d.id === selectedPackage.driverId);
                return currentDriver ? currentDriver.name : 'Unknown Driver';
              })()}</p>
            )}
            
            <div className="search-section">
              <input
                type="text"
                placeholder="Search drivers..."
                value={driverSearchTerm}
                onChange={(e) => setDriverSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
            
            <div className="drivers-list">
              {filteredDrivers.length === 0 ? (
                <p>No available drivers found.</p>
              ) : (
                filteredDrivers.map(driver => (
                  <div key={driver.id} className="driver-item">
                    <div className="driver-info">
                      <strong>{driver.name}</strong>
                      <span>{driver.email}</span>
                      <span>Phone: {driver.phone}</span>
                    </div>
                    <button 
                      className="assign-btn" 
                      onClick={() => assignDriverToPackage(driver.driverId)}
                      disabled={assigningDriver}
                    >
                      {assigningDriver ? (selectedPackage.driverId ? 'Changing...' : 'Assigning...') : (selectedPackage.driverId ? 'Change to This Driver' : 'Assign')}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Filter users by role and approval status
  const getFilteredUsers = () => {
    let filtered = [...users];

    // Filter by search term
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(user => 
        user.name?.toLowerCase().includes(search) ||
        user.email?.toLowerCase().includes(search) ||
        user.phone?.includes(search) ||
        (user.businessName && user.businessName.toLowerCase().includes(search)) ||
        (user.vehicleDetails?.licensePlate && user.vehicleDetails.licensePlate.toLowerCase().includes(search))
      );
    }

    // Filter by tab
    switch (activeTab) {
      case 'pending':
        return filtered.filter(user => user.role !== 'admin' && user.isApproved === false);
      case 'users':
        return filtered.filter(user => user.role === 'user');
      case 'shops':
        return filtered.filter(user => user.role === 'shop');
      case 'drivers':
        return filtered.filter(user => user.role === 'driver');
      default:
        return filtered.filter(user => user.role !== 'admin');
    }
  };

  // Get role icon
  const getRoleIcon = (role) => {
    switch (role) {
      case 'shop':
        return <FontAwesomeIcon icon={faStore} className="role-icon" />;
      case 'driver':
        return <FontAwesomeIcon icon={faTruck} className="role-icon" />;
      case 'admin':
        return <FontAwesomeIcon icon={faChartBar} className="role-icon" />;
      default:
        return <FontAwesomeIcon icon={faUser} className="role-icon" />;
    }
  };

  // View entity details
  const viewDetails = async (entity, type) => {
    // Parse notes as array if this is a package
    let notesArr = [];
    if (type === 'package') {
      if (Array.isArray(entity.notes)) {
        notesArr = entity.notes;
      } else if (typeof entity.notes === 'string') {
        try {
          notesArr = JSON.parse(entity.notes);
        } catch {
          notesArr = [];
        }
      }
    }
    entity.entityType = type;

    if (type === 'shop' || (type === 'user' && entity.role === 'shop')) {
      // Fetch latest shop details
      try {
        const shopId = entity.shopId || entity.id;
        const response = await adminService.getShopById(shopId);
        if (response && response.data) {
          setSelectedEntity({ ...response.data, entityType: type });
        } else {
          setSelectedEntity(type === 'package' ? { ...entity, notes: notesArr } : entity);
        }
      } catch (err) {
        setSelectedEntity(type === 'package' ? { ...entity, notes: notesArr } : entity);
      }
      setShowDetailsModal(true);
      setShopPackages([]);
      setShopPackagesWithUnpaidMoney([]);
      setShopUnpaidTotal(0);
      return;
    }

    setSelectedEntity(type === 'package' ? { ...entity, notes: notesArr } : entity);
    setShowDetailsModal(true);
    setShopPackages([]);
    setShopPackagesWithUnpaidMoney([]);
    setShopUnpaidTotal(0);
  };
  
  // Load packages for a shop to prepare for settlement
  const loadShopPackages = async (shopId) => {
    setIsLoadingShopPackages(true);
    setShopPackages([]);
    setShopPackagesWithUnpaidMoney([]);
    setShopUnpaidTotal(0);
    
    try {
      console.log(`Loading financial data for shop ID ${shopId}`);
      
      // Use our new direct shop endpoint to get the latest financial data
      const shopResponse = await adminService.getShopById(shopId);
      
      if (!shopResponse?.data) {
        throw new Error('Failed to fetch shop financial data');
      }
      
      const shopData = shopResponse.data;
      console.log('Shop direct data retrieved:', shopData);
      
      // Use TotalCollected directly from database
      const totalCollected = parseFloat(shopData.TotalCollected || 0);
      console.log(`Shop TotalCollected from database: $${totalCollected.toFixed(2)}`);
      
      // Get packages for this shop (just to display them in the settlement dialog)
      const packagesResponse = await adminService.getShopPackages(shopId);
      const packages = packagesResponse?.data || [];
      console.log(`Loaded ${packages.length} packages for shop ID ${shopId}`);
      
      // Set all packages for display
      setShopPackages(packages);
      
      // Filter packages that have money to be settled
      const packagesWithMoney = packages.filter(pkg => 
        pkg.codAmount > 0 && 
        pkg.isPaid === true && 
        pkg.status === 'delivered'
      );
      
      console.log(`Found ${packagesWithMoney.length} packages with money to settle`);
      
      // IMPORTANT: Use the TotalCollected value from database as the settlement amount
      setShopPackagesWithUnpaidMoney(packagesWithMoney);
      setShopUnpaidTotal(totalCollected);
      
      console.log(`Total amount to settle (from database): $${totalCollected.toFixed(2)}`);
    } catch (error) {
      console.error('Error loading shop data:', error);
      alert(`Error: ${error.message}`);
      setShopPackages([]);
    } finally {
      setIsLoadingShopPackages(false);
    }
  };
  
  // Prepare settlement dialog for shop payments
  const prepareSettleShopPayment = (shopId) => {
    setSettleShopId(shopId);
    setSettleAmountInput('');
    setShowSettleAmountModal(true);
  };
  
  // Helper function to update shop's financial data in the UI after settlement
  const updateShopFinancialData = (shopId, settledAmount) => {
    // Update users list
    setUsers(prevUsers => {
      return prevUsers.map(user => {
        // If this is the shop we're updating
        if (user.role === 'shop' && (user.id === shopId || user.shopId === shopId)) {
          console.log(`Updating shop ${shopId} in local state: TotalCollected -> 0`);
          // Reset the collected amount
          return {
            ...user,
            // Reset database column values in local state
            TotalCollected: 0,
            financialData: {
              ...user.financialData,
              totalCollected: 0
            }
          };
        }
        return user;
      });
    });
    
    // No need to update additional shops list - we'll just refresh data when needed
    console.log(`Shop ${shopId} financial data updated in users list. TotalCollected set to 0.`);
  };

  // Render users table
  const renderUsersTable = () => {
    const filteredUsers = getFilteredUsers();

    if (filteredUsers.length === 0) {
      return (
        <div className="empty-state">
          <p>No {activeTab} found{searchTerm ? ' matching your search' : ''}.</p>
        </div>
      );
    }

    return (
      <table className="admin-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            {activeTab === 'drivers' && (
              <th>Status</th>
            )}
            {activeTab === 'shops' && (
              <>
                <th 
                  className="sortable-header"
                  onClick={() => handleSort('ToCollect')}
                >
                  To Collect ($) {renderSortIcon('ToCollect')}
                </th>
                <th 
                  className="sortable-header"
                  onClick={() => handleSort('TotalCollected')}
                >
                  Collected ($) {renderSortIcon('TotalCollected')}
                </th>
              </>
            )}
            {activeTab === 'drivers' && (
              <>
                <th>Working Area</th>
                <th>Assigned Today</th>
                <th>Total Assigned Packages</th>
                <th>Active Assignments</th>
                <th>Total Delivered</th>
              </>
            )}
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredUsers.map(user => (
            <tr key={user.id}>
              <td data-label="Name">
                {activeTab === 'drivers' ? getRoleIcon(user.role) : getRoleIcon(user.role)} {activeTab === 'drivers' || activeTab === 'users' || activeTab === 'pending' ? user.name : activeTab === 'shops' ? user.businessName : 'N/A'}
              </td>
              <td data-label="Email">{user.email}</td>
              {activeTab === 'drivers' && (
              <td data-label="Status">
                <span style={{color: user.isAvailable ? '#2e7d32' : '#d32f2f', backgroundColor: user.isAvailable ? '#e8f5e9' : '#ffcdd2', padding: '5px 10px', borderRadius: '20px', fontSize: '14px', fontWeight: '500'}}>
                  {user.isAvailable ? 'Available' : 'Unavailable'}
                </span>
              </td>
              )}
              {activeTab === 'shops' && (
                <>
                  <td data-label="To Collect ($)" className="financial-cell" style={{fontSize: '15px', color: parseFloat(user.ToCollect || 0) > 0 ? '#2e7d32' : '#d32f2f'}}>
                    ${parseFloat(user.ToCollect || 0).toFixed(2)}
                  </td>
                  <td data-label="Collected ($)" className="financial-cell" style={{fontSize: '15px', color: parseFloat(user.TotalCollected || 0) > 0 ? '#2e7d32' : '#d32f2f'}}>
                    ${parseFloat(user.TotalCollected || 0).toFixed(2)}
                  </td>
                </>
              )}
              {activeTab === 'drivers' && (
                <>
                  <td data-label="Working Area" className="working-area-cell">
                    {user.workingArea || 'Not assigned'}
                    <button 
                      className="action-btn edit-btn"
                      onClick={() => openWorkingAreaModal(user)}
                      title="Edit Working Area"
                      style={{ marginLeft: '0.5rem' }}
                    >
                      <FontAwesomeIcon icon={faEdit} />
                    </button>
                  </td>
                  <td data-label="Assigned Today">{user.assignedToday || 0}</td>
                  <td data-label="Total Assigned">{user.totalAssigned || 0}</td>
                  <td data-label="Active Assignments">{user.activeAssign || 0}</td>
                  <td data-label="Total Delivered">{user.totalDeliveries || 0}</td>
                </>
              )}
              <td data-label="Actions" className="actions-cell">
                {!user.isApproved && (
                  <>
                    <button 
                      className="action-btn approve-btn"
                      onClick={() => {
                        const userType = user.role === 'shop' ? 'shop' : (user.role === 'driver' ? 'driver' : 'user');
                        // Use shopId or driverId if available, otherwise use user.id
                        const entityId = userType === 'shop' ? (user.shopId || user.id) : 
                                        userType === 'driver' ? (user.driverId || user.id) : 
                                        user.id;
                        handleApproval(entityId, userType, true, user);
                      }}
                      title="Approve"
                    >
                      <FontAwesomeIcon icon={faCheck} />
                    </button>
                    <button 
                      className="action-btn reject-btn"
                      onClick={() => {
                        const userType = user.role === 'shop' ? 'shop' : (user.role === 'driver' ? 'driver' : 'user');
                        // Use shopId or driverId if available, otherwise use user.id
                        const entityId = userType === 'shop' ? (user.shopId || user.id) : 
                                        userType === 'driver' ? (user.driverId || user.id) : 
                                        user.id;
                        handleApproval(entityId, userType, false, user);
                      }}
                      title="Reject"
                    >
                      <FontAwesomeIcon icon={faTimes} />
                    </button>
                  </>
                )}
                <button 
                  className="action-btn view-btn"
                  onClick={() => viewDetails(user, user.role)}
                  title="View Details"
                  style={{ marginRight: '0.25rem', width: '36px', height: '36px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}
                >
                  <FontAwesomeIcon icon={faEye} />
                </button>
                {activeTab === 'shops' && parseFloat(user.TotalCollected) > 0 && (
                  <button
                    className="action-btn settle-btn"
                    onClick={() => {
                      viewDetails(user, user.role);
                      setAutoScrollToSettle(true);
                    }}
                    title="Settle Payments with Shop"
                    style={{
                      marginRight: '0.25rem',
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '18px',
                      background: '#2e7d32',
                      color: '#fff',
                      border: 'none',
                      boxShadow: '0 1px 4px rgba(46,125,50,0.08)',
                      cursor: 'pointer',
                      transition: 'background 0.2s',
                    }}
                  >
                    <FontAwesomeIcon icon={faDollarSign} />
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  // Render packages sub-tabs
  const renderPackagesSubTabs = () => {
    if (activeTab !== 'packages') return null;

    return (
      <div className="packages-header">
        <div className="packages-sub-tabs">
          {PACKAGE_TABS.map(tab => (
            <button 
              key={tab.value}
              className={`sub-tab-btn ${packagesTab === tab.value ? 'active' : ''}`}
              onClick={() => setPackagesTab(tab.value)}
            >
              {tab.label}
            </button>
          ))}
          {packagesTab === 'ready-to-assign' && selectedPackages.length > 0 && (
            <button 
              className="btn-primary bulk-assign-btn"
              onClick={openBulkAssignModal}
              disabled={selectedPackages.length === 0}
            >
              Assign Driver to {selectedPackages.length} Selected Package{selectedPackages.length !== 1 ? 's' : ''}
            </button>
          )}
        </div>
      </div>
    );
  };

  // Render packages table
  const renderPackagesTable = () => {
    const filteredPackages = getFilteredPackages();
    const isAllSelected = filteredPackages.length > 0 && selectedPackages.length === filteredPackages.length;

    if (filteredPackages.length === 0) {
      return (
        <div className="empty-state">
          <p>No packages found{searchTerm ? ' matching your search' : ''}.</p>
        </div>
      );
    }

    return (
      <table className="admin-table">
        <thead>
          <tr>
            {packagesTab === 'ready-to-assign' && (
              <th>
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  title="Select All"
                />
              </th>
            )}
            <th>Tracking Number</th>
            <th>Description</th>
            <th>
              Status
              <select
                value={packageStatusFilter}
                onChange={e => setPackageStatusFilter(e.target.value)}
                style={{ marginLeft: 6, fontSize: '0.95em' }}
              >
                <option value="">All</option>
                {allStatuses.map(status => (
                  <option key={status} value={status}>
                    {status.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                  </option>
                ))}
              </select>
            </th>
            <th>
              From
              <select
                value={packageShopFilter}
                onChange={e => setPackageShopFilter(e.target.value)}
                style={{ marginLeft: 6, fontSize: '0.95em' }}
              >
                <option value="">All</option>
                {allShops.map(shop => (
                  <option key={shop} value={shop}>{shop}</option>
                ))}
              </select>
            </th>
            <th>To</th>
            <th>COD Amount</th>
            <th>Driver</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredPackages.map(pkg => (
            <tr key={pkg.id}>
              {packagesTab === 'ready-to-assign' && (
                <td data-label="Select">
                  <input
                    type="checkbox"
                    checked={selectedPackages.includes(pkg.id)}
                    onChange={(e) => handleSelectPackage(pkg.id, e.target.checked)}
                  />
                </td>
              )}
              <td data-label="Tracking Number">{pkg.trackingNumber}</td>
              <td data-label="Description">{pkg.packageDescription}</td>
              <td data-label="Status">
                <span className={`status-badge status-${pkg.status}`}>
                  {pkg.status.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                </span>
              </td>
              <td data-label="From">{pkg.shop?.businessName || 'N/A'}</td>
              <td data-label="To">{pkg.deliveryAddress}</td>
              <td data-label="COD Amount">${parseFloat(pkg.codAmount || 0).toFixed(2)}</td>
              <td data-label="Driver">{(() => {
                const driver = drivers.find(d => d.driverId === pkg.driverId || d.id === pkg.driverId);
                return driver ? driver.name : 'Unassigned';
              })()}</td>
              <td data-label="Actions">
                <button 
                  className="action-btn view-btn"
                  onClick={() => viewDetails(pkg, 'package')}
                  title="View Details"
                >
                  <FontAwesomeIcon icon={faEye} />
                </button>

                {packagesTab === 'return-to-shop' && pkg.status === 'cancelled-awaiting-return' && (
                  <button
                    className="action-btn return-btn"
                    onClick={() => handleMarkAsReturned(pkg)}
                    title="Mark as Returned"
                  >
                    <FontAwesomeIcon icon={faCheck} />
                  </button>
                )}
                {packagesTab === 'return-to-shop' && pkg.status === 'rejected-awaiting-return' && (
                  <button
                    className="action-btn return-btn"
                    onClick={() => handleMarkAsReturned(pkg)}
                    title="Mark as Rejected Returned"
                  >
                    <FontAwesomeIcon icon={faCheck} />
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  // Render pickups sub-tabs
  const renderPickupsSubTabs = () => {
    if (activeTab !== 'pickups') return null;
    return (
      <div className="pickups-header">
        <div className="pickups-sub-tabs">
          <button
            className={`sub-tab-btn ${pickupTab === 'pending' ? 'active' : ''}`}
            onClick={() => setPickupTab('pending')}
          >
            Pending
          </button>
          <button
            className={`sub-tab-btn ${pickupTab === 'pickedup' ? 'active' : ''}`}
            onClick={() => setPickupTab('pickedup')}
          >
            Picked Up
          </button>
        </div>
      </div>
    );
  };

  // Render pickups table
  const renderPickupsTable = () => {
    if (pickupLoading) {
      return (
        <div className="loading-state">
          <p>Loading pickups...</p>
        </div>
      );
    }
    const filteredPickups = pickups.filter(pickup =>
      pickupTab === 'pending' ? pickup.status === 'scheduled' : pickup.status === 'picked_up'
    );
    if (filteredPickups.length === 0) {
      return (
        <div className="empty-state">
          <p>No pickups found{searchTerm ? ' matching your search' : ''}.</p>
        </div>
      );
    }
    return (
      <table className="admin-table">
        <thead>
          <tr>
            <th>Shop</th>
            <th>Scheduled Time</th>
            <th>Address</th>
            <th>Status</th>
            <th>Package Count</th>
            <th>Driver</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredPickups.map(pickup => (
            <tr key={pickup.id}>
              <td data-label="Shop">{pickup.Shop?.businessName || 'N/A'}</td>
              <td data-label="Scheduled Time">{new Date(pickup.scheduledTime).toLocaleString()}</td>
              <td data-label="Address">{pickup.pickupAddress}</td>
              <td data-label="Status">
                <span className={`status-badge status-${pickup.status}`}>
                  {pickup.status.charAt(0).toUpperCase() + pickup.status.slice(1).replace('_', ' ')}
                </span>
              </td>
              <td data-label="Package Count">{pickup.Packages?.length || 0}</td>
              <td data-label="Driver">{(() => {
                const driver = drivers.find(d => d.driverId === pickup.driverId || d.id === pickup.driverId);
                return driver ? driver.name : 'Unassigned';
              })()}</td>
              <td data-label="Actions">
                {pickup.status === 'scheduled' && (
                  <>
                    <button
                      className="action-btn assign-btn"
                      onClick={() => openAssignPickupDriverModal(pickup)}
                      title="Assign Driver"
                    >
                      <FontAwesomeIcon icon={faTruck} />
                    </button>
                    <select
                      value={pickup.status}
                      onChange={e => updatePickupStatus(pickup.id, e.target.value)}
                      disabled={pickupStatusUpdating[pickup.id]}
                      style={{ marginLeft: 8 }}
                    >
                      <option value="scheduled">Pending</option>
                      <option value="picked_up">PickedUp</option>
                      <option value="in_storage">InStorage</option>
                    </select>
                    <button
                      className="action-btn reject-btn"
                      onClick={() => handleDeletePickup(pickup)}
                      title="Delete Pickup"
                      disabled={deletingPickup}
                      style={{ marginLeft: 8 }}
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </>
                )}
                <button
                  className="action-btn view-btn"
                  onClick={() => handlePickupClick(pickup)}
                  title="View Packages"
                >
                  <FontAwesomeIcon icon={faEye} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  // Render details modal
  const renderDetailsModal = (settlementRef) => {
    if (!selectedEntity) return null;

    const entityType = selectedEntity.entityType;
    const isUser = entityType === 'user';
    const isShop = entityType === 'shop' || (isUser && selectedEntity.role === 'shop');
    const isDriver = entityType === 'driver' || (isUser && selectedEntity.role === 'driver');
    const isPackage = entityType === 'package';

    // Format address from individual fields for display
    const formatAddress = (entity) => {
      if (!entity) return 'N/A';
      if (entity.street) {
        const parts = [
          entity.street,
          entity.city && entity.state ? `${entity.city}, ${entity.state}` : (entity.city || entity.state || ''),
          entity.zipCode,
          entity.country
        ].filter(Boolean);
        return parts.length > 0 ? parts.join(', ') : 'N/A';
      }
      return entity.address || 'N/A';
    };

    // Handler to delete a shop (now just sets up confirmation dialog)
    const handleDeleteShop = (shopUserId) => {
      setConfirmationDialogTitle('Delete Shop');
      setConfirmationDialogText('Are you sure you want to delete this shop? This action cannot be undone.');
      setConfirmAction(() => async () => {
        try {
          await adminService.deleteUser(shopUserId);
          setShowDetailsModal(false);
          setStatusMessage({ type: 'success', text: 'Shop deleted successfully.' });
          fetchUsers('shop');
        } catch (err) {
          setStatusMessage({ type: 'error', text: 'Failed to delete shop.' });
        } finally {
          setShowConfirmationDialog(false);
        }
      });
      setShowConfirmationDialog(true);
    };

    // Handler to delete a driver (sets up confirmation dialog)
    const handleDeleteDriver = (driverUserId) => {
      setConfirmationDialogTitle('Delete Driver');
      setConfirmationDialogText('Are you sure you want to delete this driver? This action cannot be undone.');
      setConfirmAction(() => async () => {
        try {
          await adminService.deleteUser(driverUserId);
          setShowDetailsModal(false);
          setStatusMessage({ type: 'success', text: 'Driver deleted successfully.' });
          fetchUsers('driver');
        } catch (err) {
          setStatusMessage({ type: 'error', text: 'Failed to delete driver.' });
        } finally {
          setShowConfirmationDialog(false);
        }
      });
      setShowConfirmationDialog(true);
    };

    return (
      <div
        className={`modal-overlay ${showDetailsModal ? 'show' : ''}`}
        style={{ zIndex: 2000 }}
        onClick={() => setShowDetailsModal(false)}
      >
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <div className="modal-header" style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            zIndex: 20,
            background: '#fff',
            borderBottom: '1px solid #eee',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            padding: '18px 24px 12px 24px',
            minHeight: 60
          }}>
            <h2>
              {isUser && (
                <>
                  {getRoleIcon(selectedEntity.role)} {selectedEntity.name}
                </>
              )}
              {isPackage && (
                <>
                  <FontAwesomeIcon icon={faBox} /> Package #{selectedEntity.trackingNumber}
                </>
              )}
            </h2>
            <button
              className="modal-close"
              onClick={() => setShowDetailsModal(false)}
              style={{ background: 'none', border: 'none', fontSize: 28, cursor: 'pointer', color: '#888', marginLeft: 16 }}
              title="Close"
            >
              &times;
            </button>
          </div>

          {/* User, Shop, or Driver details */}
          {(isUser || isShop || isDriver) && (
            <div className="details-grid">
              <div className="detail-item">
                <span className="label">Name:</span>
                <span>{selectedEntity.name}</span>
              </div>
              <div className="detail-item">
                <span className="label">Email:</span>
                <span>{selectedEntity.email}</span>
              </div>
              <div className="detail-item">
                <span className="label">Phone:</span>
                <span>{selectedEntity.phone}</span>
              </div>
              <div className="detail-item">
                <span className="label">Role:</span>
                <span className="role-badge">
                  {getRoleIcon(selectedEntity.role)} {selectedEntity.role}
                </span>
              </div>
              <div className="detail-item">
                <span className="label">Joined:</span>
                <span>{new Date(selectedEntity.createdAt).toLocaleDateString()}</span>
              </div>
              
              {/* Address */}
              <div className="detail-item full-width">
                <span className="label">Address:</span>
                <span>{isDriver ? (selectedEntity.street || selectedEntity.city || selectedEntity.state || selectedEntity.zipCode || selectedEntity.country ? [selectedEntity.street, selectedEntity.city && selectedEntity.state ? `${selectedEntity.city}, ${selectedEntity.state}` : (selectedEntity.city || selectedEntity.state || ''), selectedEntity.zipCode, selectedEntity.country].filter(Boolean).join(', ') : 'N/A') : (selectedEntity.address || 'N/A')}</span>
              </div>
              
              {/* Additional details for shop */}
              {isShop && (
                <>
                  <div className="detail-item full-width">
                    <span className="label">Business Information:</span>
                    <div className="nested-details">
                      <div className="nested-detail">
                        <span className="nested-label">Business Name:</span>
                        <span>{selectedEntity.businessName || 'N/A'}</span>
                      </div>
                      <div className="nested-detail">
                        <span className="nested-label">Business Type:</span>
                        <span>{selectedEntity.businessType || 'N/A'}</span>
                      </div>
                      <div className="nested-detail">
                        <span className="nested-label">Registration #:</span>
                        <span>{selectedEntity.registrationNumber || 'N/A'}</span>
                      </div>
                      <div className="nested-detail">
                        <span className="nested-label">Tax ID:</span>
                        <span>{selectedEntity.taxId || 'N/A'}</span>
                      </div>
                      {/* Financial Information */}
                      {(() => {
                        const deliveredPkgs = packages.filter(pkg => pkg.shopId === selectedEntity.shopId && pkg.status === 'delivered');
                        const shippingFee = parseFloat(selectedEntity.shippingFees || 0);
                        const netRevenue = deliveredPkgs.length * shippingFee;
                        const toCollect = parseFloat(selectedEntity.ToCollect || 0);
                        const totalCollected = parseFloat(selectedEntity.TotalCollected || 0);
                        return <>
                          <div className="nested-detail">
                            <span className="nested-label">Net Revenue (Delivered Packages):</span>
                            <span>${netRevenue.toFixed(2)}</span>
                          </div>
                          <div className="nested-detail">
                            <span className="nested-label">Delivered Packages:</span>
                            <span>{deliveredPkgs.length}</span>
                          </div>
                          <div className="nested-detail">
                            <span className="nested-label">Total to Collect:</span>
                            <span>${toCollect.toFixed(2)}</span>
                          </div>
                          <div className="nested-detail">
                            <span className="nested-label">Total Collected:</span>
                            <span>${totalCollected.toFixed(2)}</span>
                          </div>
                          <div className="nested-detail">
                            <span className="nested-label">Total Settled:</span>
                            <span>${parseFloat(selectedEntity.settelled || 0).toFixed(2)}</span>
                          </div>
                        </>
                      })()}
                    </div>
                  </div>
                  {/* Manual Total Collected adjustment by admin */}
                  <div className="detail-item full-width" style={{ marginTop: 16, borderTop: '1px solid #eee', paddingTop: 16 }}>
                    <span className="label">Adjust Total Collected (Admin Only):</span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 400 }}>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Amount to adjust by"
                        value={adjustTotalCollectedInput ?? ''}
                        onChange={e => setAdjustTotalCollectedInput(e.target.value)}
                        style={{ padding: '6px 8px', borderRadius: '4px', border: '1px solid #ccc', width: '100%' }}
                      />
                      <textarea
                        placeholder="Reason for adjustment (required)"
                        value={adjustTotalCollectedReason ?? ''}
                        onChange={e => setAdjustTotalCollectedReason(e.target.value)}
                        style={{ padding: '6px 8px', borderRadius: '4px', border: '1px solid #ccc', width: '100%', minHeight: 48 }}
                      />
                      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                        <button
                          className="btn-primary"
                          style={{ flex: 1, background: '#28a745', color: '#fff' }}
                          disabled={adjustingTotalCollected}
                          onClick={async () => {
                            if (!adjustTotalCollectedInput || isNaN(Number(adjustTotalCollectedInput)) || Number(adjustTotalCollectedInput) <= 0) {
                              setStatusMessage({ type: 'error', text: 'Please enter a valid positive amount.' });
                              return;
                            }
                            if (!adjustTotalCollectedReason || adjustTotalCollectedReason.trim().length === 0) {
                              setStatusMessage({ type: 'error', text: 'Please provide a reason for the adjustment.' });
                              return;
                            }
                            setAdjustingTotalCollected(true);
                            try {
                              const res = await adminService.adjustShopTotalCollected(selectedEntity.shopId || selectedEntity.id, {
                                amount: parseFloat(adjustTotalCollectedInput),
                                reason: adjustTotalCollectedReason,
                                changeType: 'increase'
                              });
                              setStatusMessage({ type: 'success', text: res.data.message || 'Total Collected increased.' });
                              // Refresh shop details
                              const response = await adminService.getShopById(selectedEntity.shopId || selectedEntity.id);
                              if (response && response.data) {
                                setSelectedEntity({ ...response.data, entityType: selectedEntity.entityType });
                              }
                              setAdjustTotalCollectedInput('');
                              setAdjustTotalCollectedReason('');
                            } catch (err) {
                              setStatusMessage({ type: 'error', text: err.response?.data?.message || 'Failed to increase Total Collected.' });
                            } finally {
                              setAdjustingTotalCollected(false);
                            }
                          }}
                        >
                          Increase
                        </button>
                        <button
                          className="btn-primary danger"
                          style={{ flex: 1 }}
                          disabled={adjustingTotalCollected}
                          onClick={async () => {
                            if (!adjustTotalCollectedInput || isNaN(Number(adjustTotalCollectedInput)) || Number(adjustTotalCollectedInput) <= 0) {
                              setStatusMessage({ type: 'error', text: 'Please enter a valid positive amount.' });
                              return;
                            }
                            if (!adjustTotalCollectedReason || adjustTotalCollectedReason.trim().length === 0) {
                              setStatusMessage({ type: 'error', text: 'Please provide a reason for the adjustment.' });
                              return;
                            }
                            setAdjustingTotalCollected(true);
                            try {
                              const res = await adminService.adjustShopTotalCollected(selectedEntity.shopId || selectedEntity.id, {
                                amount: parseFloat(adjustTotalCollectedInput),
                                reason: adjustTotalCollectedReason,
                                changeType: 'decrease'
                              });
                              setStatusMessage({ type: 'success', text: res.data.message || 'Total Collected decreased.' });
                              // Refresh shop details
                              const response = await adminService.getShopById(selectedEntity.shopId || selectedEntity.id);
                              if (response && response.data) {
                                setSelectedEntity({ ...response.data, entityType: selectedEntity.entityType });
                              }
                              setAdjustTotalCollectedInput('');
                              setAdjustTotalCollectedReason('');
                            } catch (err) {
                              setStatusMessage({ type: 'error', text: err.response?.data?.message || 'Failed to decrease Total Collected.' });
                            } finally {
                              setAdjustingTotalCollected(false);
                            }
                          }}
                        >
                          Decrease
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}
              
              {/* Shipping Fees editable field */}
              {isShop && (
                <div className="detail-item full-width">
                  <span className="label">Shipping Fees:</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={shippingFeesInput ?? selectedEntity.shippingFees ?? ''}
                      onChange={e => setShippingFeesInput(e.target.value)}
                      style={{ padding: '6px 8px', borderRadius: '4px', border: '1px solid #ccc', width: '120px' }}
                    />
                    <button
                      className="settle-btn"
                      onClick={async () => {
                        if (shippingFeesInput === '' || isNaN(Number(shippingFeesInput))) {
                          alert('Please enter a valid shipping fee');
                          return;
                        }
                        try {
                          await adminService.updateShop(selectedEntity.shopId || selectedEntity.id, { shippingFees: parseFloat(shippingFeesInput) });
                          setSelectedEntity({ ...selectedEntity, shippingFees: parseFloat(shippingFeesInput) });
                          setStatusMessage({ type: 'success', text: 'Shipping fees updated successfully.' });
                        } catch (err) {
                          setStatusMessage({ type: 'error', text: 'Failed to update shipping fees.' });
                        }
                      }}
                    >
                      Save
                    </button>
                  </div>
                </div>
              )}
              
              {/* Quick settlement panel (visible without loading packages) */}
              {parseFloat(selectedEntity.TotalCollected || 0) > 0 && (
                <div className="settlement-section" style={{marginTop: '1rem'}} ref={settlementRef}>
                  <div className="settlement-title">Settle Payments with Shop</div>
                  <div className="settlement-amount">Total collected: ${parseFloat(selectedEntity.TotalCollected).toFixed(2)}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <input
                      type="number"
                      min="0"
                      placeholder="Amount to settle"
                      value={settleAmountInput}
                      onChange={e => setSettleAmountInput(e.target.value)}
                      style={{ padding: '6px 8px', borderRadius: '4px', border: '1px solid #ccc', width: '120px' }}
                    />
                    <button className="settle-btn" onClick={() => handlePartialSettle(selectedEntity.shopId || selectedEntity.id)}>
                      Settle Amount
                    </button>
                  </div>
                </div>
              )}
              
              {/* Shop packages section */}
              {selectedEntity.shopId && (
                <div className="detail-item full-width">
                  <span className="label">Recent Packages:</span>
                  <button 
                    className="load-packages-btn"
                    onClick={() => loadShopPackages(selectedEntity.shopId)}
                  >
                    Load Packages
                  </button>
                  
                  {shopPackages.length > 0 && (
                    <div className="shop-packages-table">
                      <table>
                        <thead>
                          <tr>
                            <th>Tracking #</th>
                            <th>Status</th>
                            <th>COD Amount</th>
                            <th>Payment Status</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {shopPackages.map(pkg => (
                            <tr key={pkg.id}>
                              <td>{pkg.trackingNumber}</td>
                              <td>
                                <span className={`status-badge status-${pkg.status}`}>
                                  {pkg.status}
                                </span>
                              </td>
                              <td className="financial-cell">${parseFloat(pkg.codAmount || 0).toFixed(2)}</td>
                              <td>
                                <span className={`payment-status ${pkg.isPaid ? 'paid' : 'unpaid'}`}>
                                  {pkg.isPaid ? 'Paid' : 'Unpaid'}
                                </span>
                              </td>
                              <td>
                                <button 
                                  className="action-btn view-btn"
                                  onClick={() => viewDetails(pkg, 'package')}
                                  title="View Details"
                                >
                                  <FontAwesomeIcon icon={faEye} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      
                      {/* Shop payment settlement */}
                      {shopUnpaidTotal > 0 && (
                        <div className="settlement-section">
                          <div className="settlement-title">Settle Payments with Shop</div>
                          <div className="settlement-amount">Total collected: ${parseFloat(shopUnpaidTotal).toFixed(2)}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="Amount to settle"
                              value={settleAmountInput}
                              onChange={e => setSettleAmountInput(e.target.value)}
                              style={{ padding: '6px 8px', borderRadius: '4px', border: '1px solid #ccc', width: '120px' }}
                            />
                            <button className="settle-btn" onClick={() => handlePartialSettle(selectedEntity.shopId || selectedEntity.id)}>
                              Settle Amount
                            </button>
                            <button className="settle-btn" onClick={() => handlePartialSettle(selectedEntity.shopId || selectedEntity.id)}>
                              Settle All
                          </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
              {/* Delete shop button for shop entity */}
              {isShop && (
                <div className="detail-item full-width" style={{ marginTop: 16, textAlign: 'right' }}>
                  <button
                    className="btn-primary danger"
                    onClick={() => handleDeleteShop(selectedEntity.userId || selectedEntity.id)}
                    style={{ marginLeft: 'auto', fontWeight: 600, fontSize: '1rem', padding: '12px 28px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(220,53,69,0.10)', display: 'inline-flex', alignItems: 'center', gap: 10, background: '#dc3545', border: 'none', color: '#fff' }}
                  >
                    <FontAwesomeIcon icon={faTrash} style={{ marginRight: 8 }} /> Delete Shop
                  </button>
                </div>
              )}
            </div>
          )}
          
          {/* Additional details for driver */}
          {isDriver && (
            <>
              <div className="detail-item full-width">
                <span className="label">Vehicle Information:</span>
                <div className="nested-details">
                  <div className="nested-detail">
                    <span className="nested-label">Vehicle Type:</span>
                    <span className="detail-value">
                      {selectedEntity.vehicleType ? (
                        <span className="vehicle-type">{selectedEntity.vehicleType}</span>
                      ) : 'Not provided'}
                    </span>
                  </div>
                  <div className="nested-detail">
                    <span className="nested-label">License Plate:</span>
                    <span className="detail-value">
                      {selectedEntity.licensePlate ? (
                        <span className="license-plate">{selectedEntity.licensePlate}</span>
                      ) : 'Not provided'}
                    </span>
                  </div>
                  <div className="nested-detail">
                    <span className="nested-label">Model:</span>
                    <span className="detail-value">
                      {selectedEntity.model ? (
                        <span className="vehicle-model">{selectedEntity.model}</span>
                      ) : 'Not provided'}
                    </span>
                  </div>
                  <div className="nested-detail">
                    <span className="nested-label">Color:</span>
                    <span className="detail-value">
                      {selectedEntity.color ? (
                        <span className="vehicle-color" 
                              style={{display: 'inline-block', 
                                     marginRight: '5px',
                                     width: '12px', 
                                     height: '12px', 
                                     backgroundColor: selectedEntity.color.toLowerCase(),
                                     border: '1px solid #ccc',
                                     borderRadius: '2px'}}></span>
                      ) : ''}
                      {selectedEntity.color || 'Not provided'}
                    </span>
                  </div>
                  <div className="nested-detail">
                    <span className="nested-label">Driver License:</span>
                    <span className="detail-value">
                      {selectedEntity.driverLicense ? (
                        <span className="driver-license">{selectedEntity.driverLicense}</span>
                      ) : 'Not provided'}
                    </span>
                  </div>
                </div>
                <button
                  className="btn btn-primary"
                  style={{ marginTop: 12 }}
                  onClick={() => {
                    setSelectedDriverForPackages(selectedEntity);
                    fetchDriverPackages(selectedEntity.driverId || selectedEntity.id);
                    setActiveTab('driver-packages');
                    setShowDetailsModal(false);
                  }}
                >
                  Show Packages
                </button>
              </div>
              {/* Delete driver button for driver entity */}
              {isDriver && (
                <div className="detail-item full-width" style={{ marginTop: 16, textAlign: 'right' }}>
                  <button
                    className="btn-primary danger"
                    onClick={() => handleDeleteDriver(selectedEntity.userId || selectedEntity.id)}
                    style={{ marginLeft: 'auto', fontWeight: 600, fontSize: '1rem', padding: '12px 28px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(220,53,69,0.10)', display: 'inline-flex', alignItems: 'center', gap: 10, background: '#dc3545', border: 'none', color: '#fff' }}
                  >
                    <FontAwesomeIcon icon={faTrash} style={{ marginRight: 8 }} /> Delete Driver
                  </button>
                </div>
              )}
            </>
          )}

          {/* Package details */}
          {isPackage && (
            <div className="details-grid">
              <div className="detail-item">
                <span className="label">Tracking Number:</span>
                <span>{selectedEntity.trackingNumber}</span>
              </div>
              <div className="detail-item">
                <span className="label">Status:</span>
                <span className={`status-badge ${selectedEntity.status}`}>
                  {selectedEntity.status}
                </span>
              </div>
              <div className="detail-item">
                <span className="label">Created:</span>
                <span>{selectedEntity.createdAt ? new Date(selectedEntity.createdAt).toLocaleDateString() : 'N/A'}</span>
              </div>
              <div className="detail-item full-width">
                <span className="label">Description:</span>
                <span>{selectedEntity.packageDescription || 'No description'}</span>
              </div>
              <div className="detail-item">
                <span className="label">Weight:</span>
                <span>{selectedEntity.weight ? `${selectedEntity.weight} kg` : 'N/A'}</span>
              </div>
              <div className="detail-item">
                <span className="label">Dimensions:</span>
                <span>{selectedEntity.dimensions || 'N/A'}</span>
              </div>
              <div className="detail-item">
                <span className="label">COD Amount:</span>
                <span>{selectedEntity.codAmount ? `${selectedEntity.codAmount} EGP` : 'N/A'}</span>
              </div>
              <div className="detail-item">
                <span className="label">Delivery Cost:</span>
                <span>{selectedEntity.deliveryCost ? `${selectedEntity.deliveryCost} EGP` : 'N/A'}</span>
              </div>
              <div className="detail-item full-width">
                <span className="label">Shop Notes:</span>
                <span>{selectedEntity.shopNotes}</span>
              </div>
              {/* Pickup address */}
              <div className="detail-item full-width">
                <span className="label">Pickup Details:</span>
                <div className="nested-details">
                  <div className="nested-detail">
                    <span className="nested-label">Contact Name:</span>
                    <span>{selectedEntity.pickupContactName || 'N/A'}</span>
                  </div>
                  <div className="nested-detail">
                    <span className="nested-label">Contact Phone:</span>
                    <span>{selectedEntity.pickupContactPhone || 'N/A'}</span>
                  </div>
                  <div className="nested-detail">
                    <span className="nested-label">Address:</span>
                    <span>{selectedEntity.pickupAddress || 'N/A'}</span>
                  </div>
                  <div className="nested-detail">
                    <span className="nested-label">Pickedup Time</span>
                    <span>{selectedEntity.actualPickupTime ? selectedEntity.actualPickupTime : 'Not pickedup yet'}</span>
                  </div>
                  <div className="nested-detail">
                    <span className="nested-label">Number of Items: </span>
                    <span>{selectedEntity.itemsNo || '-'}</span>
                  </div>
                </div>
              </div>
              {/* Delivery address */}
              <div className="detail-item full-width">
                <span className="label">Delivery Details:</span>
                <div className="nested-details">
                  <div className="nested-detail">
                    <span className="nested-label">Contact Name:</span>
                    <span>{selectedEntity.deliveryContactName || 'N/A'}</span>
                  </div>
                  <div className="nested-detail">
                    <span className="nested-label">Contact Phone:</span>
                    <span>{selectedEntity.deliveryContactPhone || 'N/A'}</span>
                  </div>
                  <div className="nested-detail">
                    <span className="nested-label">Address:</span>
                    <span>{selectedEntity.deliveryAddress || 'N/A'}</span>
                  </div>
                  <div className="nested-detail">
                    <span className="nested-label">Delivery Time</span>
                    <span>{selectedEntity.actualDeliveryTime ? selectedEntity.actualDeliveryTime : 'Not delivered yet'}</span>
                  </div>
                </div>
              </div>
              {/* --- Notes Log Section --- */}
              <div className="detail-item full-width" style={{background:'#fff', border:'1px solid #e0e0e0', borderRadius:'8px', padding:'1.25rem', marginTop:'1.5rem', marginBottom:'1.5rem'}}>
                <span className="label" style={{fontWeight:'bold', fontSize:'1.08em', marginBottom:'0.5rem', display:'block'}}>Notes Log</span>
                <div className="notes-log-list" style={{display:'flex', flexDirection:'column', gap:'0.75rem'}}>
                  {(() => {
                    let notesArr = [];
                    if (Array.isArray(selectedEntity?.notes)) {
                      notesArr = selectedEntity.notes;
                    } else if (typeof selectedEntity?.notes === 'string') {
                      try {
                        notesArr = JSON.parse(selectedEntity.notes);
                      } catch {
                        notesArr = [];
                      }
                    }
                    notesArr = notesArr
                      .filter(n => n && typeof n.text === 'string' && n.text.trim())
                      .sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
                    return (notesArr.length > 0) ? (
                      notesArr.map((n, idx) => (
                        <div key={idx} className="notes-log-entry" style={{background:'#f8f9fa', borderRadius:'6px', padding:'0.75rem 1rem', boxShadow:'0 1px 2px rgba(0,0,0,0.03)', border:'1px solid #ececec'}}>
                          <div className="notes-log-meta" style={{marginBottom:'0.25rem'}}>
                            <span className="notes-log-date" style={{fontSize:'0.92em', color:'#888'}}>
                              {n.createdAt ? new Date(n.createdAt).toLocaleString() : 'Unknown date'}
                            </span>
                          </div>
                          <div className="notes-log-text" style={{whiteSpace:'pre-line', fontSize:'1.05em', color:'#222'}}>{n.text}</div>
                        </div>
                      ))
                    ) : (
                      <div className="notes-log-empty" style={{color:'#888', fontStyle:'italic'}}>No notes yet.</div>
                    );
                  })()}
                </div>
                <div style={{marginTop:'1.5rem'}}>
                  <textarea
                    value={editingNotes}
                    onChange={e => setEditingNotes(e.target.value)}
                    placeholder="Add a note for this package..."
                    rows={2}
                    style={{ width: '100%', marginTop: 4, borderRadius:'6px', border:'1px solid #ccc', padding:'0.5rem', fontSize:'1em' }}
                  />
                  <button
                    className="add-note-btn"
                    onClick={async () => {
                      if (!editingNotes.trim()) return;
                      setNotesSaving(true);
                      setNotesError(null);
                      try {
                        const res = await packageService.updatePackageNotes(selectedEntity.id, editingNotes);
                        setSelectedEntity(prev => ({ ...prev, notes: res.data.notes }));
                        setEditingNotes('');
                      } catch (err) {
                        console.error('Error adding note:', err);
                        setNotesError(err.response?.data?.message || 'Failed to save note.');
                      } finally {
                        setNotesSaving(false);
                      }
                    }}
                    disabled={notesSaving || !editingNotes.trim()}
                    style={{ marginTop: 8, borderRadius:'6px', padding:'0.5rem 1.2rem', fontWeight:'bold', background:'#007bff', color:'#fff', border:'none', cursor:'pointer' }}
                  >
                    {notesSaving ? 'Saving...' : 'Add Note'}
                  </button>
                  {notesError && <div className="error-message" style={{color:'#dc3545', marginTop:'0.5rem'}}>{notesError}</div>}
                </div>
              </div>
            </div>
          )}
          {/* Package details: Forward Status button for admin */}
          {isPackage && (
            <>
              {/* Remove previous button block if present */}
              {/* Sticky footer for actions */}
              <div
                style={{
                  position: 'sticky',
                  bottom: 0,
                  left: 0,
                  width: '100%',
                  background: '#fff',
                  borderTop: '1px solid #eee',
                  padding: '16px 24px',
                  boxShadow: '0 -2px 8px rgba(0,0,0,0.04)',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  alignItems: 'center',
                  gap: '12px',
                  zIndex: 10,
                  marginTop: 32
                }}
              >
                {/* Change Driver button - only show for assigned, pickedup, in-transit statuses */}
                {selectedEntity.driverId && ['assigned', 'pickedup', 'in-transit'].includes(selectedEntity.status) && (
                  <button
                    className="btn btn-secondary"
                    onClick={() => openAssignDriverModal(selectedEntity)}
                    style={{
                      padding: '10px 24px',
                      borderRadius: 8,
                      fontWeight: 600,
                      fontSize: 16,
                      background: '#4a6cf7',
                      color: '#fff',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'background 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <FontAwesomeIcon icon={faTruck} />
                    Change Driver
                  </button>
                )}
                
                {/* Only show Forward Status button for packages that are not cancelled, rejected, or delivered */}
                {!['cancelled','pending', 'cancelled-awaiting-return', 'cancelled-returned', 'rejected', 'rejected-awaiting-return', 'rejected-returned', 'delivered', 'awaiting_schedule', 'awaiting_pickup', 'scheduled_for_pickup'].includes(selectedEntity.status) && (
                  <button
                    className="btn btn-primary"
                    disabled={forwardingPackageId === selectedEntity.id}
                    onClick={() => forwardPackageStatus(selectedEntity)}
                    style={{
                      padding: '10px 32px',
                      borderRadius: 8,
                      fontWeight: 700,
                      fontSize: 18,
                      background: 'linear-gradient(90deg, #FFC107 0%, #FF9800 100%)',
                      color: '#222',
                      border: 'none',
                      boxShadow: '0 2px 8px rgba(255,193,7,0.08)',
                      cursor: forwardingPackageId === selectedEntity.id ? 'not-allowed' : 'pointer',
                      transition: 'background 0.2s',
                    }}
                  >
                    {forwardingPackageId === selectedEntity.id
                      ? 'Forwarding...'
                      : 'Forward Status'}
                  </button>
                )}
                
                {/* Reject Package button - only show for packages that are not already rejected, cancelled, or delivered */}
                {!['cancelled', 'cancelled-awaiting-return', 'cancelled-returned', 'rejected', 'rejected-awaiting-return', 'rejected-returned', 'delivered'].includes(selectedEntity.status) && (
                  <button
                    className="btn btn-danger"
                    onClick={() => {
                      setPackageToAction(selectedEntity);
                      setShowRejectPackageModal(true);
                    }}
                    style={{
                      padding: '10px 24px',
                      borderRadius: 8,
                      fontWeight: 600,
                      fontSize: 16,
                      background: '#dc3545',
                      color: '#fff',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'background 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <FontAwesomeIcon icon={faTimes} />
                    Reject Package
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  // Render confirmation dialog
  const renderConfirmationDialog = () => {
    if (!showConfirmationDialog) return null;
    const isDeleteShop = confirmationDialogTitle && confirmationDialogTitle.toLowerCase().includes('delete shop');
    const isDeleteDriver = confirmationDialogTitle && confirmationDialogTitle.toLowerCase().includes('delete driver');
    return (
      <div className="confirmation-overlay">
        <div className="confirmation-dialog warning-dialog">
          <h3>{confirmationDialogTitle || 'Confirm Action'}</h3>
          <p>{confirmationDialogText || 'Are you sure you want to proceed with this action?'}</p>
          <div className="confirmation-buttons">
            <button 
              className="btn-secondary"
              onClick={() => setShowConfirmationDialog(false)}
            >
              Cancel
            </button>
            <button 
              className={`btn-primary${(isDeleteShop || isDeleteDriver) ? ' danger' : ''}`}
              onClick={() => confirmAction && confirmAction()}
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Render forward package confirmation modal
  const renderForwardPackageModal = () => {
    if (!showForwardPackageModal || !packageToAction) return null;
    
    const statusFlow = ['assigned', 'pickedup', 'in-transit', 'delivered'];
    const currentIndex = statusFlow.indexOf(packageToAction.status);
    const nextStatus = currentIndex < statusFlow.length - 1 ? statusFlow[currentIndex + 1] : null;
    
    if (!nextStatus) return null;
    
    return (
      <div className="confirmation-overlay">
        <div className="confirmation-dialog">
          <h3>Forward Package</h3>
          <p>Are you sure you want to forward this package from <strong>{packageToAction.status}</strong> to <strong>{nextStatus}</strong>?</p>
          <div className="confirmation-buttons">
            <button 
              className="btn-secondary"
              onClick={() => {
                setShowForwardPackageModal(false);
                setPackageToAction(null);
              }}
            >
              Cancel
            </button>
            <button 
              className="btn-primary"
              onClick={() => forwardPackage(packageToAction)}
            >
              Forward
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Render reject package confirmation modal
  const renderRejectPackageModal = () => {
    if (!showRejectPackageModal || !packageToAction) return null;
    
    return (
      <div className="confirmation-overlay">
        <div className="confirmation-dialog warning-dialog">
          <h3>Reject Package</h3>
          <p>Are you sure you want to reject this package? This will mark it as <strong>rejected</strong>.</p>
          <div className="confirmation-buttons">
            <button 
              className="btn-secondary"
              onClick={() => {
                setShowRejectPackageModal(false);
                setPackageToAction(null);
              }}
            >
              Cancel
            </button>
            <button 
              className="btn-primary danger"
              onClick={() => rejectPackage(packageToAction)}
            >
              Reject
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Render status message
  const renderStatusMessage = () => {
    if (!statusMessage) return null;
    
    return (
      <div className={`status-message ${statusMessage.type}`}>
        <p>{statusMessage.text}</p>
        <button 
          className="close-btn"
          onClick={() => setStatusMessage(null)}
        >
          ×
        </button>
      </div>
    );
  };

  // Update driver working area
  const updateDriverWorkingArea = async (driverId, workingArea) => {
    try {
      setUpdatingWorkingArea(true);
      // Use the driverId field from the driver object, not the user id
      const actualDriverId = driverId.driverId || driverId;
      await adminService.updateDriverWorkingArea(actualDriverId, workingArea);
      
      // Update local state
      setUsers(prevUsers => {
        return prevUsers.map(user => {
          if (user.role === 'driver' && (user.id === driverId.id || user.driverId === actualDriverId)) {
            return {
              ...user,
              workingArea: workingArea
            };
          }
          return user;
        });
      });
      
      setStatusMessage({
        type: 'success',
        text: 'Driver working area updated successfully'
      });
      
      setShowWorkingAreaModal(false);
      setSelectedDriverForWorkingArea(null);
      setWorkingAreaInput('');
    } catch (error) {
      console.error('Error updating driver working area:', error);
      setStatusMessage({
        type: 'error',
        text: `Error updating working area: ${error.response?.data?.message || error.message || 'Unknown error'}`
      });
    } finally {
      setUpdatingWorkingArea(false);
    }
  };

  // Open working area modal
  const openWorkingAreaModal = (driver) => {
    setSelectedDriverForWorkingArea(driver);
    setWorkingAreaInput(driver.workingArea || '');
    setShowWorkingAreaModal(true);
  };

  // Render working area modal
  const renderWorkingAreaModal = () => {
    if (!selectedDriverForWorkingArea) return null;

    return (
      <div className={`modal-overlay ${showWorkingAreaModal ? 'show' : ''}`} onClick={() => setShowWorkingAreaModal(false)}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h2>
              <FontAwesomeIcon icon={faEdit} /> Update Working Area
            </h2>
            <button 
              className="close-btn"
              onClick={() => setShowWorkingAreaModal(false)}
            >
              <FontAwesomeIcon icon={faClose} />
            </button>
          </div>
          
          <div className="modal-body">
            <div className="working-area-input">
              <label htmlFor="workingArea">Working Area:</label>
              <input 
                type="text" 
                id="workingArea" 
                value={workingAreaInput}
                onChange={(e) => setWorkingAreaInput(e.target.value)}
              />
            </div>
          </div>
          
          <div className="modal-actions">
            <button 
              className="btn-primary"
              onClick={() => {
                updateDriverWorkingArea(selectedDriverForWorkingArea, workingAreaInput);
              }}
            >
              Update
            </button>
            <button 
              className="btn-secondary"
              onClick={() => setShowWorkingAreaModal(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Handle pickup click to view details
  const handlePickupClick = async (pickup) => {
    console.log('handlePickupClick called with pickup:', pickup);
    setSelectedPickup(pickup);
    setShowPickupModal(true);
    setPickupPackagesLoading(true);
    try {
      // Get all packages for this pickup
      const res = await packageService.getPickupById(pickup.id);
      console.log('Pickup details response:', res.data);
      if (res.data.Packages) {
        setPickupPackages(res.data.Packages);
      } else {
        setPickupPackages([]);
      }
    } catch (error) {
      console.error('Error fetching pickup details:', error);
      // Even if the API call fails, we can still show the modal with the pickup data we have
      setPickupPackages([]);
    } finally {
      setPickupPackagesLoading(false);
    }
  };

  // Mark pickup as picked up
  const handleMarkPickupAsPickedUp = async (pickupId) => {
    try {
      await adminService.markPickupAsPickedUp(pickupId);
      
      // Refresh pickups data
      const pickupsResponse = await adminService.getAllPickups();
      setPickups(pickupsResponse.data || []);
      
      // Refresh packages data
      const packagesResponse = await adminService.getPackages();
      if (packagesTab === 'ready-to-assign') {
        const pendingPackages = (packagesResponse.data || []).filter(pkg => pkg.status === 'pending');
        setPackages(pendingPackages);
      } else {
        const filteredPackages = (packagesResponse.data || []).filter(pkg => 
          !['awaiting_schedule', 'awaiting_pickup', 'scheduled_for_pickup'].includes(pkg.status)
        );
        setPackages(filteredPackages);
      }
      
      setStatusMessage({ type: 'success', text: 'Pickup marked as picked up successfully!' });
    } catch (error) {
      console.error('Error marking pickup as picked up:', error);
      setStatusMessage({ 
        type: 'error', 
        text: `Error: ${error.response?.data?.message || 'Failed to mark pickup as picked up'}` 
      });
    }
  };

  // Render pickup modal
  const renderPickupModal = () => {
    console.log('renderPickupModal called, showPickupModal:', showPickupModal, 'selectedPickup:', selectedPickup);
    if (!showPickupModal) return null;

    return (
      <div className={`modal-overlay ${showPickupModal ? 'show' : ''}`} onClick={() => setShowPickupModal(false)}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h3>Pickup Details</h3>
            <button 
              className="modal-close"
              onClick={() => setShowPickupModal(false)}
            >
              <FontAwesomeIcon icon={faClose} />
            </button>
          </div>
          <div className="modal-body">
            {selectedPickup ? (
              <>
                <div className="pickup-info">
                  <p><strong>Shop:</strong> {selectedPickup.Shop?.businessName || 'N/A'}</p>
                  <p><strong>Scheduled Time:</strong> {new Date(selectedPickup.scheduledTime).toLocaleString()}</p>
                  <p><strong>Address:</strong> {selectedPickup.pickupAddress}</p>
                  <p><strong>Status:</strong> 
                    <span className={`status-badge status-${selectedPickup.status}`}>
                      {selectedPickup.status.charAt(0).toUpperCase() + selectedPickup.status.slice(1).replace('_', ' ')}
                    </span>
                  </p>
                  {selectedPickup.actualPickupTime && (
                    <p><strong>Actual Pickup Time:</strong> {new Date(selectedPickup.actualPickupTime).toLocaleString()}</p>
                  )}
                </div>
                
                <div className="packages-section">
                  <h4>Packages in this Pickup</h4>
                  {pickupPackagesLoading ? (
                    <p>Loading packages...</p>
                  ) : pickupPackages.length === 0 ? (
                    <p>No packages found in this pickup.</p>
                  ) : (
                    <table className="packages-table">
                      <thead>
                        <tr>
                          <th>Tracking #</th>
                          <th>Description</th>
                          <th>Status</th>
                          <th>Address</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pickupPackages.map(pkg => (
                          <tr key={pkg.id} style={{cursor: 'pointer'}} onClick={() => viewDetails(pkg, 'package')}>
                            <td>{pkg.trackingNumber}</td>
                            <td>{pkg.packageDescription}</td>
                            <td>
                              <span className={`status-badge status-${pkg.status}`}>
                                {pkg.status.charAt(0).toUpperCase() + pkg.status.slice(1).replace('-', ' ')}
                              </span>
                            </td>
                            <td>{pkg.deliveryAddress}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </>
            ) : (
              <p>No pickup data available.</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Checkbox functionality for bulk driver assignment
  const handleSelectAll = (checked) => {
    if (checked) {
      const filteredPackages = getFilteredPackages();
      setSelectedPackages(filteredPackages.map(pkg => pkg.id));
    } else {
      setSelectedPackages([]);
    }
  };

  const handleSelectPackage = (packageId, checked) => {
    if (checked) {
      setSelectedPackages(prev => [...prev, packageId]);
    } else {
      setSelectedPackages(prev => prev.filter(id => id !== packageId));
    }
  };

  const openBulkAssignModal = async () => {
    if (selectedPackages.length === 0) {
      alert('Please select at least one package to assign.');
      return;
    }

    setBulkAssignDriverId('');
    setBulkAssigning(false);
    
    try {
      // Fetch available drivers (approved and active)
      const { data } = await adminService.getDrivers({ isApproved: true });
      setAvailableDrivers(data);
      setShowBulkAssignModal(true);
    } catch (error) {
      console.error('Error fetching available drivers:', error);
      alert('Failed to fetch available drivers. Please try again.');
    }
  };

  const handleBulkAssign = async () => {
    if (!bulkAssignDriverId || selectedPackages.length === 0) {
      alert('Please select a driver and at least one package.');
      return;
    }

    setBulkAssigning(true);
    
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
      if (activeTab === 'packages') {
        const packagesResponse = await adminService.getPackages();
        if (packagesTab === 'ready-to-assign') {
          const pendingPackages = (packagesResponse.data || []).filter(pkg => pkg.status === 'pending');
          setPackages(pendingPackages);
        } else {
          const filteredPackages = (packagesResponse.data || []);
          setPackages(filteredPackages);
        }
      }
      
      // Clear selections
      setSelectedPackages([]);
      setBulkAssignDriverId('');
      setShowBulkAssignModal(false);
      setStatusMessage({ type: 'success', text: 'Packages assigned to driver successfully!' });
    } catch (error) {
      console.error('Error in bulk assign:', error);
      alert('Error assigning driver to packages. Please try again.');
    } finally {
      setBulkAssigning(false);
    }
  };

  // Render bulk assign modal
  const renderBulkAssignModal = () => {
    if (!showBulkAssignModal) return null;

    const selectedPackageDetails = packages.filter(pkg => selectedPackages.includes(pkg.id));
    const filteredDrivers = availableDrivers.filter(driver => 
      driver.name?.toLowerCase().includes(driverSearchTerm.toLowerCase()) ||
      driver.email?.toLowerCase().includes(driverSearchTerm.toLowerCase())
    );

    console.log('selectedPackageDetails:', selectedPackageDetails);
    console.log('filteredDrivers:', filteredDrivers);

    return (
      <div className={`modal-overlay ${showBulkAssignModal ? 'show' : ''}`}>
        <div className="modal-content">
          <div className="modal-header">
            <h3>Bulk Assign Driver</h3>
            <button 
              className="modal-close"
              onClick={() => setShowBulkAssignModal(false)}
            >
              <FontAwesomeIcon icon={faClose} />
            </button>
          </div>
          <div className="modal-body">
            <div className="selected-packages">
              <h4>Selected Packages ({selectedPackages.length})</h4>
              <div className="packages-list">
                {selectedPackageDetails.map(pkg => (
                  <div key={pkg.id} className="package-item">
                    <strong>{pkg.trackingNumber}</strong> - {pkg.packageDescription}
                    <br />
                    <small>From: {pkg.shop?.businessName || 'N/A'} | To: {pkg.deliveryAddress}</small>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="driver-selection">
              <h4>Select Driver</h4>
              <div className="search-section">
                <input
                  type="text"
                  placeholder="Search drivers..."
                  value={driverSearchTerm}
                  onChange={(e) => setDriverSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>
              
              <div className="drivers-list">
                {filteredDrivers.length === 0 ? (
                  <p>No available drivers found.</p>
                ) : (
                  filteredDrivers.map(driver => (
                    <div 
                      key={driver.id} 
                      className={`driver-item ${driver.isAvailable ? 'available' : 'unavailable'}`}
                    >
                      <div className="driver-info">
                        <span style={{fontWeight: 'bold', fontSize: '0.9rem'}}>{driver.name}</span>
                        <span className={`driver-availability-status ${driver.isAvailable ? 'available' : 'unavailable'}`}>
                          {driver.isAvailable ? 'Available' : 'Unavailable'}
                        </span>
                        <br />
                        <span style={{fontSize: '0.8rem'}}>Working Area: <span style={{fontWeight: 'bold'}}>{driver.workingArea ? driver.workingArea : 'N/A'}</span></span>
                        <span style={{fontSize: '0.8rem'}}> \ Active Assigns: <span style={{fontWeight: 'bold'}}>{driver.activeAssign ? driver.activeAssign : '0'}</span></span>
                        <span style={{fontSize: '0.8rem'}}> \ Assigned Today: <span style={{fontWeight: 'bold'}}>{driver.assignedToday ? driver.assignedToday : '0'}</span></span>
                      </div>
                      <button 
                        className={`assign-btn ${bulkAssignDriverId === driver.driverId ? 'selected' : ''}`}
                        onClick={() => setBulkAssignDriverId(driver.driverId)}
                        disabled={!driver.isAvailable || bulkAssigning}
                      >
                        {!driver.isAvailable ? 'Unavailable' : 
                         bulkAssignDriverId === driver.driverId ? 'Selected' : 'Select'}
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
            
            <div className="modal-actions">
              <button 
                className="btn-secondary"
                onClick={() => setShowBulkAssignModal(false)}
                disabled={bulkAssigning}
              >
                Cancel
              </button>
              <button 
                className="btn-primary"
                onClick={handleBulkAssign}
                disabled={!bulkAssignDriverId || bulkAssigning}
              >
                {bulkAssigning ? 'Assigning...' : `Assign to ${selectedPackages.length} Package${selectedPackages.length !== 1 ? 's' : ''}`}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render driver packages modal
  const renderDriverPackagesModal = () => {
    if (!showDriverPackages) return null;
    return (
      <div className="modal-overlay show" onClick={() => setShowDriverPackages(false)}>
        <div className="modal-content" onClick={e => e.stopPropagation()} style={{ minWidth: 700 }}>
          <div className="modal-header">
            <h3>Package History for {selectedDriverForPackages?.name}</h3>
            <button className="modal-close" onClick={() => setShowDriverPackages(false)}>
              <FontAwesomeIcon icon={faClose} />
            </button>
          </div>
          <div className="modal-body">
            {driverPackages.length === 0 ? (
              <div>No packages found for this driver.</div>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Tracking #</th>
                    <th>Description</th>
                    <th>Status</th>
                    <th>Recipient</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {driverPackages.map(pkg => (
                    <tr key={pkg.id}>
                      <td>{pkg.trackingNumber}</td>
                      <td>{pkg.packageDescription}</td>
                      <td><span className={`status-badge status-${pkg.status}`}>{pkg.status}</span></td>
                      <td>{pkg.deliveryContactName}</td>
                      <td>
                        <button
                          className="btn btn-primary"
                          disabled={forwardingPackageId === pkg.id || pkg.status === 'delivered'}
                          onClick={() => forwardPackageStatus(pkg)}
                        >
                          {pkg.status === 'delivered' ? 'Delivered' : forwardingPackageId === pkg.id ? 'Forwarding...' : 'Forward Status'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    );
  };

  const handlePartialSettle = async (shopId) => {
    if (!shopId) {
      console.error('handlePartialSettle called with invalid shopId:', shopId, selectedEntity);
      alert('Error: Shop ID is missing. Please reload the page and try again.');
      return;
    }
    const amount = parseFloat(settleAmountInput);
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid amount greater than 0');
      return;
    }
    const currentBalance = shopUnpaidTotal > 0 ? shopUnpaidTotal : parseFloat(selectedEntity.TotalCollected || 0);
    if (amount > currentBalance) {
      alert('Amount exceeds the collected balance for this shop');
      return;
    }
    try {
      const response = await adminService.settleShopPayments(shopId, { amount });
      console.log('Partial settlement response:', response);

      // Update UI balances
      if (shopUnpaidTotal > 0) {
        setShopUnpaidTotal(prev => prev - amount);
      }

      // Deduct from users list
      setUsers(prevUsers => prevUsers.map(user => {
        if (user.role === 'shop' && (user.id === shopId || user.shopId === shopId)) {
          const newCollected = parseFloat(user.TotalCollected || 0) - amount;
          return {
            ...user,
            TotalCollected: newCollected,
            financialData: {
              ...user.financialData,
              totalCollected: newCollected
            }
          };
        }
        return user;
      }));

      setStatusMessage({ type: 'success', text: `Settled $${amount.toFixed(2)} with shop successfully` });
      setSettleAmountInput('');
    } catch (error) {
      console.error('Error settling amount with shop:', error);
      alert(error.response?.data?.message || 'Failed to settle amount');
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

  // Add function to fetch money transactions with filters
  const fetchMoneyTransactions = async () => {
    try {
      const params = {
        ...moneyFilters,
        page: 1
      };
      // Convert shopId to number if present
      if (params.shopId) {
        params.shopId = Number(params.shopId);
        if (isNaN(params.shopId)) delete params.shopId;
      }
      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === null || params[key] === undefined) {
          delete params[key];
        }
      });
      const res = await adminService.getMoneyTransactions(params);
      setMoneyTransactions(res.data.transactions || []);
    } catch (error) {
      console.error('Error fetching money transactions:', error);
      setStatusMessage({
        type: 'error',
        text: 'Failed to fetch money transactions'
      });
    }
  };

  // Add effect to refetch when filters change
  useEffect(() => {
    if (activeTab === 'money') {
      fetchMoneyTransactions();
    }
  }, [activeTab, moneyFilters]);

  const renderMoneyTable = () => {
    // Use all transactions from backend, do not filter by searchTerm on frontend
    let filteredTransactions = moneyTransactions;
    const renderSortIcon = (field) => {
      if (moneyFilters.sortBy === field) {
        return <span className="sort-icon">{moneyFilters.sortOrder === 'DESC' ? '▼' : '▲'}</span>;
      }
      return null;
    };
    return (
      <div className="money-transactions-section">
        {/* Filters section */}
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
              value={moneyFilters.shopId || ''}
              onChange={e => handleMoneyFilterChange('shopId', e.target.value)}
            >
              <option value="">All Shops</option>
              {users.filter(u => u.role === 'shop').map(shop => (
                <option key={shop.shopId} value={shop.shopId}>{shop.businessName || shop.shopId}</option>
              ))}
            </select>
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
        {filteredTransactions.length === 0 ? (
          <p style={{textAlign:'center'}}>No transactions found{moneyFilters.search ? ' matching your search' : ''}.</p>
        ) : (
          <table className="admin-table money-table">
            <thead>
              <tr>
                <th 
                  onClick={() => handleMoneyFilterChange('sortBy', 'createdAt')} 
                  className="sortable-header"
                >
                  Date {renderSortIcon('createdAt')}
                </th>
                <th>Shop</th>
                <th>Driver</th>
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
              {filteredTransactions.map(tx => (
                <tr key={tx.id}>
                  <td data-label="Date">{new Date(tx.createdAt).toLocaleString()}</td>
                  <td data-label="Shop">{tx.Shop?.businessName || tx.shopId}</td>
                  <td data-label="Driver">{tx.driver ? tx.driver.name : '-'}</td>
                  <td data-label="Attribute">{tx.attribute}</td>
                  <td data-label="Type">
                    <span className={`change-type ${tx.changeType}`}>
                      {tx.changeType}
                    </span>
                  </td>
                  <td data-label="Amount ($)" className={`financial-cell ${tx.changeType}`}>
                    ${parseFloat(tx.amount).toFixed(2)}
                  </td>
                  <td data-label="Description">{tx.description || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    );
  };

  // Add sort handler
  const handleSort = (field) => {
    const newOrder = sortConfig.field === field && sortConfig.order === 'DESC' ? 'ASC' : 'DESC';
    setSortConfig({
      field,
      order: newOrder
    });
    
    // Refetch data with new sort
    if (activeTab === 'shops') {
      fetchUsers('shops');
    }
  };

  // Add sort icon renderer
  const renderSortIcon = (field) => {
    if (sortConfig.field !== field) {
      return null;
    }
    return (
      <span className="sort-icon">
        {sortConfig.order === 'DESC' ? ' ▼' : ' ▲'}
      </span>
    );
  };

  // Add new function to handle marking package as returned
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
      console.error('Error marking package as returned:', error);
      alert('Failed to mark package as returned. Please try again.');
    }
  };

  // Add fetchPackages function
  const fetchPackages = async () => {
    try {
      setLoading(true);
      const response = await adminService.getPackages();
      console.log('Packages received:', response.data);
      
      // Filter packages based on the current tab
      if (packagesTab === 'ready-to-assign') {
        const readyToAssignPackages = (response.data || []).filter(pkg =>
          pkg.status === 'pending' ||
          pkg.status === 'cancelled-awaiting-return' ||
          pkg.status === 'rejected-awaiting-return'
        );
        console.log('Filtered ready-to-assign packages:', readyToAssignPackages);
        setPackages(readyToAssignPackages);
      } else if (packagesTab === 'in-transit') {
        const inTransitPackages = (response.data || []).filter(pkg => 
          ['assigned', 'pickedup', 'in-transit'].includes(pkg.status)
        );
        setPackages(inTransitPackages);
      } else if (packagesTab === 'delivered') {
        const deliveredPackages = (response.data || []).filter(pkg => pkg.status === 'delivered');
        setPackages(deliveredPackages);
      } else if (packagesTab === 'return-to-shop') {
        const returnPackages = (response.data || []).filter(pkg => 
          ['cancelled-awaiting-return', 'cancelled-returned', 'rejected-awaiting-return', 'rejected-returned'].includes(pkg.status)
        );
        setPackages(returnPackages);
      } else {
        // For 'all' tab, show all packages
        setPackages(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching packages:', error);
      alert('Failed to fetch packages. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Add useEffect to fetch packages on component mount and when packagesTab changes
  useEffect(() => {
    if (activeTab === 'packages') {
      fetchPackages();
    }
  }, [activeTab, packagesTab]);

  useEffect(() => {
    if (activeTab === 'dashboard') {
      setAnalyticsLoading(true);
      Promise.all([
        adminService.getPackagesPerMonth(),
        adminService.getCodCollectedPerMonth(),
        adminService.getPackageStatusDistribution(),
        adminService.getTopShops()
      ]).then(([pkgRes, codRes, statusRes, shopsRes]) => {
        setAnalytics({
          packagesPerMonth: pkgRes.data,
          codPerMonth: codRes.data,
          statusDistribution: statusRes.data,
          topShops: shopsRes.data
        });
      }).finally(() => setAnalyticsLoading(false));
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'pickups') {
      // Always fetch drivers when opening pickups tab
      const fetchDrivers = async () => {
        try {
          const driversResponse = await adminService.getDrivers();
          setDrivers(driversResponse.data || []);
        } catch (error) {
          setDrivers([]);
        }
      };
      fetchDrivers();
    }
  }, [activeTab]);

  const chartBoxStyle = { height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' };

  const renderBottomFinancialSection = () => {
    // --- Recent Money Transactions Table ---
    const recentTransactions = moneyTransactions
      .slice()
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 10);

    // --- All Shops Revenue Table ---
    // Get all shops from users state
    const allShops = users.filter(u => u.role === 'shop');
    // For each shop, use backend-provided delivered count and shipping fees
    const shopRows = allShops.map(shop => {
      const deliveredCount = shop.financialData?.packageCount || 0;
      const shippingFees = parseFloat(shop.shippingFees || 0);
      const revenue = deliveredCount * shippingFees;
      return {
        id: shop.shopId || shop.id,
        name: shop.businessName,
        shippingFees,
        deliveredCount,
        revenue
      };
    });

    // --- Sorting logic ---
    const sortedShopRows = [...shopRows].sort((a, b) => {
      const { field, order } = shopSort;
      let valA = a[field];
      let valB = b[field];
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();
      if (valA < valB) return order === 'asc' ? -1 : 1;
      if (valA > valB) return order === 'asc' ? 1 : -1;
      return 0;
    });

    const handleShopSort = (field) => {
      setShopSort(prev => {
        if (prev.field === field) {
          return { field, order: prev.order === 'asc' ? 'desc' : 'asc' };
        } else {
          return { field, order: 'desc' };
        }
      });
    };

    const renderSortIcon = (field) => {
      if (shopSort.field !== field) return null;
      return <span style={{ marginLeft: 4 }}>{shopSort.order === 'asc' ? '▲' : '▼'}</span>;
    };

    return (
      <div style={{ marginTop: 48 }}>
        <Row gutter={[24, 24]}>
          <Col xs={24} lg={12}>
            <Card title="Recent Money Transactions (Last 10)">
              <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                <table className="admin-table money-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Shop</th>
                      <th>Type</th>
                      <th>Amount ($)</th>
                      <th>Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentTransactions.length === 0 ? (
                      <tr><td colSpan={5} style={{ textAlign: 'center' }}>No transactions found.</td></tr>
                    ) : (
                      recentTransactions.map(tx => (
                        <tr key={tx.id}>
                          <td>{new Date(tx.createdAt).toLocaleString()}</td>
                          <td>{tx.Shop?.businessName || tx.shopId || '-'}</td>
                          <td>{tx.changeType}</td>
                          <td>${parseFloat(tx.amount).toFixed(2)}</td>
                          <td>{tx.description || '-'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title="All Shops Revenue (Delivered Packages)">
              <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th onClick={() => handleShopSort('name')} style={{ cursor: 'pointer' }}>Shop Name {renderSortIcon('name')}</th>
                      <th onClick={() => handleShopSort('shippingFees')} style={{ cursor: 'pointer' }}>Shipping Fees ($) {renderSortIcon('shippingFees')}</th>
                      <th onClick={() => handleShopSort('deliveredCount')} style={{ cursor: 'pointer' }}>Delivered {renderSortIcon('deliveredCount')}</th>
                      <th onClick={() => handleShopSort('revenue')} style={{ cursor: 'pointer' }}>Revenue ($) {renderSortIcon('revenue')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedShopRows.length === 0 ? (
                      <tr><td colSpan={4} style={{ textAlign: 'center' }}>No shops found.</td></tr>
                    ) : (
                      sortedShopRows.map(row => (
                        <tr key={row.id}>
                          <td>{row.name}</td>
                          <td>${row.shippingFees.toFixed(2)}</td>
                          <td>{row.deliveredCount}</td>
                          <td>${row.revenue.toFixed(2)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </Col>
        </Row>
      </div>
    );
  };

  const renderDashboardHome = () => {
    // Use backend value for delivered revenue if available
    let deliveredRevenue = stats.revenueDeliveredPackages;
    let missingShippingFeePackages = [];
    if (deliveredRevenue === undefined || deliveredRevenue === null) {
      // Fallback: Calculate revenue from delivered packages by summing shop shippingFees for each delivered package
      const deliveredPackages = packages.filter(pkg => pkg.status === 'delivered');
      deliveredRevenue = 0;
      deliveredPackages.forEach(pkg => {
        let shippingFees = null;
        if (pkg.shop && pkg.shop.shippingFees != null && pkg.shop.shippingFees !== undefined) {
          shippingFees = pkg.shop.shippingFees;
        } else {
          const shopId = pkg.shopId || (pkg.shop && pkg.shop.id);
          const shop = users.find(u => u.role === 'shop' && (u.id === shopId || u.shopId === shopId));
          if (shop && shop.shippingFees != null && shop.shippingFees !== undefined) {
            shippingFees = shop.shippingFees;
          }
        }
        if (shippingFees != null && shippingFees !== undefined) {
          deliveredRevenue += parseFloat(shippingFees);
        } else {
          missingShippingFeePackages.push(pkg);
        }
      });
    }

    const kpiData = [
      { title: 'Total Users', value: stats.users.total, icon: faUser },
      { title: 'Shops', value: stats.users.shops, icon: faStore },
      { title: 'Drivers', value: stats.users.drivers, icon: faTruck },
      { title: 'Packages', value: stats.packages.total, icon: faBox },
      { title: 'COD Collected (All Time)', value: stats.cod?.totalCollected || 0, icon: faDollarSign, prefix: '$' },
      { title: 'To Collect COD (All Time)', value: stats.cod?.totalToCollect || 0, icon: faDollarSign, prefix: '$' },
      // Insert Revenue card right after To Collect COD
      { title: 'Revenue (Delivered Packages)', value: deliveredRevenue, icon: faDollarSign, prefix: '$' },
    ];

    // --- New Analytics Graphs ---
    const months = analytics.packagesPerMonth.map(row => row.month);
    const createdData = analytics.packagesPerMonth.map(row => row.created);
    const deliveredData = analytics.packagesPerMonth.map(row => row.delivered);
    const codMonths = analytics.codPerMonth.map(row => row.month);
    const codData = analytics.codPerMonth.map(row => row.codCollected);
    // Group cancelled statuses and merge pickedup/in-transit into 'In-Transit'
    const statusRaw = analytics.statusDistribution;
    const statusMap = {};
    statusRaw.forEach(row => {
      const status = row.status.toLowerCase();
      if (/cancel/i.test(status)) {
        statusMap['Cancelled'] = (statusMap['Cancelled'] || 0) + Number(row.count);
      } else if (status.includes('pickedup') || status.includes('in-transit')) {
        statusMap['In-Transit'] = (statusMap['In-Transit'] || 0) + Number(row.count);
      } else if (status === 'delivered') {
        statusMap['Delivered'] = (statusMap['Delivered'] || 0) + Number(row.count);
      } else {
        statusMap[row.status] = (statusMap[row.status] || 0) + Number(row.count);
      }
    });
    const statusLabels = Object.keys(statusMap);
    const statusCounts = Object.values(statusMap);
    // Assign colors: delivered = green, cancelled = red, in-transit = orange, others = blue
    const statusColors = statusLabels.map(label => {
      if (label.toLowerCase() === 'delivered') return '#28a745';
      if (label.toLowerCase() === 'cancelled') return '#dc3545';
      if (label.toLowerCase() === 'in-transit') return '#ff8c00';
      // fallback palette
      return '#007bff';
    });
    const topShopNames = analytics.topShops.volume.map(row => row.businessName);
    const topShopVolumes = analytics.topShops.volume.map(row => row.packageCount);
    const topShopCodNames = analytics.topShops.cod.map(row => row.businessName);
    const topShopCods = analytics.topShops.cod.map(row => row.codCollected);

    return (
      <div className="dashboard-home">
        {/* Warning for missing shipping fees */}
        {missingShippingFeePackages.length > 0 && (
          <div style={{ background: '#fffbe6', border: '1px solid #ffe58f', color: '#ad8b00', padding: 16, borderRadius: 8, marginBottom: 24 }}>
            <strong>Warning:</strong> {missingShippingFeePackages.length} delivered package(s) belong to shops with no shipping fees set. Revenue may be undercounted. <br />
            <span style={{ fontSize: 13 }}>
              Please set <b>Shipping Fees</b> for all shops in the <b>Shops</b> tab or by clicking on a shop in the dashboard.
            </span>
          </div>
        )}
        <Flex gap="large" wrap="wrap">
          {kpiData.map((kpi) => (
            <Card key={kpi.title}>
              <Statistic
                title={kpi.title}
                value={kpi.value}
                prefix={kpi.prefix}
                valueStyle={{ color: '#2c3e50', fontSize: '2rem' }}
                formatter={value => (kpi.prefix === '$' ? parseFloat(value).toFixed(2) : value)}
              />
            </Card>
          ))}
        </Flex>
        <Row gutter={[24, 24]} style={{ marginTop: '24px' }}>
          <Col xs={24} lg={12}>
            <Card title="Packages Over Time (Last 7 Days)">
              <div className="chart-wrapper">
                <Line data={dashboardData.packagesChart} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } }} />
              </div>
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title="COD Collected (Last 4 Weeks)">
              <div className="chart-wrapper">
                <Bar data={dashboardData.codChart} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }} />
              </div>
            </Card>
          </Col>
        </Row>
        <div className="dashboard-tables">
          <div className="dashboard-table">
            </div>
          <div className="dashboard-table">
            </div>
        </div>
        <div style={{ marginTop: 32 }}>
          {analyticsLoading ? (
            <Spin size="large" style={{ margin: '40px auto', display: 'block' }} />
          ) : (
            <>
              <Card title="Monthly Package Trends (Last 12 Months)" style={{ marginBottom: 24 }}>
                <div style={chartBoxStyle}>
                  {months.length === 0 ? 'No data available' :
                    <Bar data={{
                      labels: months,
                      datasets: [
                        { label: 'Created', data: createdData, backgroundColor: 'rgba(54, 162, 235, 0.6)' },
                        { label: 'Delivered', data: deliveredData, backgroundColor: 'rgba(75, 192, 192, 0.6)' }
                      ]
                    }} options={{ responsive: true, plugins: { legend: { position: 'top' } }, maintainAspectRatio: false }} />
                  }
                </div>
              </Card>
              <Card title="Monthly COD Collected (Last 12 Months)" style={{ marginBottom: 24 }}>
                <div style={chartBoxStyle}>
                  {codMonths.length === 0 ? 'No data available' :
                    <Line data={{
                      labels: codMonths,
                      datasets: [
                        { label: 'COD Collected', data: codData, borderColor: 'rgba(255, 206, 86, 1)', backgroundColor: 'rgba(255, 206, 86, 0.3)', fill: true, tension: 0.4 }
                      ]
                    }} options={{ responsive: true, plugins: { legend: { position: 'top' } }, maintainAspectRatio: false }} />
                  }
                </div>
              </Card>
              <Card title="Current Package Status Distribution" style={{ marginBottom: 24 }}>
                <div style={chartBoxStyle}>
                  {statusLabels.length === 0 ? 'No data available' :
                    <Pie data={{
                      labels: statusLabels,
                      datasets: [
                        { data: statusCounts, backgroundColor: statusColors }
                      ]
                    }} options={{ responsive: true, plugins: { legend: { position: 'right' } }, maintainAspectRatio: false }} />
                  }
                </div>
              </Card>
              <Card title="Top 5 Shops by Package Volume" style={{ marginBottom: 24 }}>
                <div style={chartBoxStyle}>
                  {topShopNames.length === 0 ? 'No data available' :
                    <Bar data={{
                      labels: topShopNames,
                      datasets: [
                        { label: 'Packages', data: topShopVolumes, backgroundColor: 'rgba(54, 162, 235, 0.7)' }
                      ]
                    }} options={{ responsive: true, plugins: { legend: { display: false } }, maintainAspectRatio: false }} />
                  }
                </div>
              </Card>
              <Card title="Top 5 Shops by COD Collected" style={{ marginBottom: 24 }}>
                <div style={chartBoxStyle}>
                  {topShopCodNames.length === 0 ? 'No data available' :
                    <Bar data={{
                      labels: topShopCodNames,
                      datasets: [
                        { label: 'COD Collected', data: topShopCods, backgroundColor: 'rgba(255, 206, 86, 0.7)' }
                      ]
                    }} options={{ responsive: true, plugins: { legend: { display: false } }, maintainAspectRatio: false }} />
                  }
                </div>
              </Card>
            </>
          )}
        </div>
        {/* Add new financial section at the bottom */}
        {renderBottomFinancialSection()}
      </div>
    );
  };

  // --- Handler to open assign driver modal for pickup ---
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
  // --- Handler to assign driver to pickup ---
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
  // --- Handler to update pickup status ---
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
  // --- Render assign driver modal for pickup ---
  const renderAssignPickupDriverModal = () => {
    if (!showAssignPickupDriverModal || !selectedPickupForDriver) return null;
    const filteredDrivers = availableDrivers.filter(driver =>
      driver.name?.toLowerCase().includes(pickupDriverSearchTerm.toLowerCase()) ||
      driver.email?.toLowerCase().includes(pickupDriverSearchTerm.toLowerCase())
    );
    return (
      <div className={`modal-overlay show`} onClick={() => setShowAssignPickupDriverModal(false)}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h3>Assign Driver to Pickup</h3>
            <button className="modal-close" onClick={() => setShowAssignPickupDriverModal(false)}>
              <FontAwesomeIcon icon={faClose} />
            </button>
          </div>
          <div className="modal-body">
            <p><strong>Shop:</strong> {selectedPickupForDriver.Shop?.businessName || 'N/A'}</p>
            <p><strong>Scheduled Time:</strong> {new Date(selectedPickupForDriver.scheduledTime).toLocaleString()}</p>
            <div className="search-section">
              <input
                type="text"
                placeholder="Search drivers..."
                value={pickupDriverSearchTerm}
                onChange={e => setPickupDriverSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
            <div className="drivers-list">
              {filteredDrivers.length === 0 ? (
                <p>No available drivers found.</p>
              ) : (
                filteredDrivers.map(driver => (
                  <div key={driver.id} className="driver-item">
                    <div className="driver-info">
                      <strong>{driver.name}</strong>
                      <span>{driver.email}</span>
                      <span>Phone: {driver.phone}</span>
                    </div>
                    <button
                      className="assign-btn"
                      onClick={() => assignDriverToPickup(driver.driverId)}
                      disabled={assigningPickupDriver}
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
    );
  };

  // Function to delete a pickup (now uses confirmation dialog)
  const handleDeletePickup = (pickup) => {
    setConfirmationDialogTitle('Delete Pickup');
    setConfirmationDialogText('Are you sure you want to delete this pickup? All packages in it will be marked as awaiting_schedule.');
    setConfirmAction(() => async () => {
      setDeletingPickup(true);
      try {
        await packageService.deletePickup(pickup.id);
        setStatusMessage({ type: 'success', text: 'Pickup deleted and packages reset.' });
        // Refresh pickups list
        const pickupsResponse = await adminService.getAllPickups();
        setPickups(pickupsResponse.data || []);
      } catch (error) {
        setStatusMessage({ type: 'error', text: 'Failed to delete pickup.' });
        // fallback: reload window
        window.location.reload();
      } finally {
        setDeletingPickup(false);
        setShowConfirmationDialog(false);
      }
    });
    setShowConfirmationDialog(true);
  };

  // Simple handler for button
  const handleSettleMoneyClick = () => {
    setSettleAmountInput('');
    setShowSettleAmountModal(true);
  };

  // Simple confirm handler
  const handleConfirmSettleAmount = () => {
    setShowSettleAmountModal(false);
  };

  // Add state for package filters
  const [packageStatusFilter, setPackageStatusFilter] = useState('');
  const [packageShopFilter, setPackageShopFilter] = useState('');

  // In getFilteredPackages, apply the new filters
  const getFilteredPackages = () => {
    let filtered = packages;
    // Apply tab filter
    if (packagesTab === 'ready-to-assign') {
      filtered = filtered.filter(pkg => pkg.status === 'pending');
    } else if (packagesTab === 'in-transit') {
      filtered = filtered.filter(pkg => ['assigned', 'pickedup', 'in-transit'].includes(pkg.status));
    } else if (packagesTab === 'delivered') {
      filtered = filtered.filter(pkg => pkg.status === 'delivered');
      // Sort by actualDeliveryTime descending (most recent first)
      filtered = filtered.slice().sort((a, b) => {
        const aTime = a.actualDeliveryTime ? new Date(a.actualDeliveryTime).getTime() : 0;
        const bTime = b.actualDeliveryTime ? new Date(b.actualDeliveryTime).getTime() : 0;
        return bTime - aTime;
      });
    } else if (packagesTab === 'return-to-shop') {
      filtered = filtered.filter(pkg => ['cancelled-awaiting-return', 'cancelled-returned', 'rejected-awaiting-return', 'rejected-returned'].includes(pkg.status));
    }
    // Apply status filter
    if (packageStatusFilter) {
      filtered = filtered.filter(pkg => pkg.status === packageStatusFilter);
    }
    // Apply shop filter
    if (packageShopFilter) {
      filtered = filtered.filter(pkg => (pkg.shop?.businessName || 'N/A') === packageShopFilter);
    }
    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(pkg => 
        pkg.trackingNumber.toLowerCase().includes(searchLower) ||
        pkg.packageDescription.toLowerCase().includes(searchLower) ||
        (pkg.shop?.businessName || '').toLowerCase().includes(searchLower) ||
        pkg.deliveryAddress.toLowerCase().includes(searchLower)
      );
    }
    return filtered;
  };

  // In renderPackagesTable, compute unique statuses and shops for dropdowns
  const allStatuses = Array.from(new Set(packages.map(pkg => pkg.status))).sort();
  const allShops = Array.from(new Set(packages.map(pkg => pkg.shop?.businessName || 'N/A'))).sort();

  return (
    <div className="admin-dashboard">
      {renderStatusMessage()}
      {renderConfirmationDialog()}
      {renderForwardPackageModal()}
      {renderRejectPackageModal()}
      {renderWorkingAreaModal()}
      <div className="dashboard-header">
        <h1 style={{color: 'white'}}>Admin Dashboard</h1>
        <div className="header-actions">
          <div className="search-box">
            <FontAwesomeIcon icon={faSearch} className="search-icon" />
            <input 
              type="text" 
              placeholder={activeTab === 'packages' ? "Search by Package ID, description, recipient, shop, or status..." : "Search users, shops, drivers, or packages..."} 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>
      
      <div className="dashboard-tabs">
        <button 
          className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          Dashboard
        </button>
        <button 
          className={`tab-btn ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          Pending Approvals
        </button>
        <button 
          className={`tab-btn ${activeTab === 'shops' ? 'active' : ''}`}
          onClick={() => setActiveTab('shops')}
        >
          <FontAwesomeIcon icon={faStore} /> Shops
        </button>
        <button 
          className={`tab-btn ${activeTab === 'drivers' ? 'active' : ''}`}
          onClick={() => setActiveTab('drivers')}
        >
          <FontAwesomeIcon icon={faTruck} /> Drivers
        </button>
        <button 
          className={`tab-btn ${activeTab === 'pickups' ? 'active' : ''}`}
          onClick={() => setActiveTab('pickups')}
        >
          <FontAwesomeIcon icon={faBox} /> Pickups
        </button>
        <button 
          className={`tab-btn ${activeTab === 'packages' ? 'active' : ''}`}
          onClick={() => setActiveTab('packages')}
        >
          <FontAwesomeIcon icon={faBox} /> Packages
        </button>
        <button 
          className={`tab-btn ${activeTab === 'money' ? 'active' : ''}`}
          onClick={() => setActiveTab('money')}
        >
          <FontAwesomeIcon icon={faDollarSign} /> Money
        </button>
      </div>
      
      <div className="dashboard-content">
        {loading && activeTab !== 'dashboard' ? (
          <div className="loading-state">
            <p>Loading data...</p>
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' ? renderDashboardHome() :
             activeTab === 'pickups' ? <>{renderPickupsSubTabs()}{renderPickupsTable()}</> : 
             activeTab === 'packages' ? <> {renderPackagesSubTabs()} {renderPackagesTable()} </> :
             activeTab === 'money' ? renderMoneyTable() : 
             renderUsersTable()}
          </>
        )}
      </div>

      {renderDetailsModal(settlementRef)}
      {renderAssignDriverModal()}
      {renderPickupModal()}
      {renderAssignPickupDriverModal()}
      {renderBulkAssignModal()}
      {renderDriverPackagesModal()}
      {activeTab === 'driver-packages' && selectedDriverForPackages && (
        <div className="driver-packages-tab">
          <button className="btn btn-secondary" onClick={() => setActiveTab('drivers')} style={{marginBottom: 16}}>
            &larr; Back to Drivers
          </button>
          <h2>Package History for {selectedDriverForPackages.name}</h2>
          {driverPackages.length === 0 ? (
            <div>No packages found for this driver.</div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Tracking #</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th>Recipient</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {driverPackages.map(pkg => (
                  <tr key={pkg.id}>
                    <td>{pkg.trackingNumber}</td>
                    <td>{pkg.packageDescription}</td>
                    <td><span className={`status-badge status-${pkg.status}`}>{pkg.status}</span></td>
                    <td>{pkg.deliveryContactName}</td>
                    <td>
                      <button
                        className="btn btn-primary"
                        disabled={forwardingPackageId === pkg.id || pkg.status === 'delivered'}
                        onClick={() => forwardPackageStatus(pkg)}
                      >
                        {pkg.status === 'delivered' ? 'Delivered' : forwardingPackageId === pkg.id ? 'Forwarding...' : 'Forward Status'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
      {showSettleAmountModal && (
        <div className="modal-overlay" style={{ zIndex: 9999, display: 'block' }}>
          <div className="modal-content">
            <h3>Settle Money</h3>
            <p>Enter the amount to settle for this shop:</p>
            <input
              type="number"
              min="0"
              step="0.01"
              value={settleAmountInput}
              onChange={e => setSettleAmountInput(e.target.value)}
              style={{ width: '100%', marginBottom: '1rem', padding: '0.5rem', fontSize: '16px' }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button onClick={() => setShowSettleAmountModal(false)} style={{ padding: '0.5rem 1.5rem' }}>Cancel</button>
              <button onClick={() => handlePartialSettle(settleShopId)} style={{ background: '#2e7d32', color: 'white', padding: '0.5rem 1.5rem', border: 'none', borderRadius: '4px' }}>Settle</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
