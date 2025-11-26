import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import api, { adminService, packageService } from '../../services/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faStore, faTruck, faBox, faSearch, faEye, faCheck, faTimes, faChartBar, faUserPlus, faTimes as faClose, faEdit, faSignOutAlt, faTrash, faDollarSign, faPlus } from '@fortawesome/free-solid-svg-icons';
import { formatDate } from '../../utils/dateUtils';
import './AdminDashboard.css';
import SwipeMenuHint from '../../components/SwipeMenuHint.jsx';
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
import QRCode from 'qrcode';
import { toArabicName } from '../../utils/arabicTransliteration';

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
  // Removed dedicated driver filter; use global search to match driver name
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
  const [packagesSubTab, setPackagesSubTab] = useState('all'); // New state for sub-sub-tabs
  const [selectedPackages, setSelectedPackages] = useState([]);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [showBulkAssignModal, setShowBulkAssignModal] = useState(false);
  const [bulkAssignDriverId, setBulkAssignDriverId] = useState('');
  const [bulkAssigning, setBulkAssigning] = useState(false);
  const [drivers, setDrivers] = useState([]);
  const [showDriverPackages, setShowDriverPackages] = useState(false);
  const [driverPackages, setDriverPackages] = useState([]);
  const [driverPackagesFilter, setDriverPackagesFilter] = useState({ preset: 'today', start: '', end: '' });
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
  // Recently updated packages widget (dashboard)
  const [recentUpdatedPackages, setRecentUpdatedPackages] = useState([]);
  const [recentUpdatedLoading, setRecentUpdatedLoading] = useState(false);
  // Add new state variables for money transactions
  const [moneyFilters, setMoneyFilters] = useState({
    startDate: '',
    endDate: '',
    attribute: '',
    changeType: '',
    search: '',
    sortBy: 'createdAt',
    sortOrder: 'DESC',
    shopId: ''
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
  // Per-shop operational stats
  const [shopStats, setShopStats] = useState(null);
  const [loadingShopStats, setLoadingShopStats] = useState(false);

  // Load per-shop stats when a shop entity is selected
  useEffect(() => {
    if (selectedEntity && (selectedEntity.shopId || selectedEntity.id) && selectedEntity.role === 'shop') {
      const idToUse = selectedEntity.shopId || selectedEntity.id;
      setLoadingShopStats(true);
      adminService.getShopStats(idToUse)
        .then(r => setShopStats(r.data))
        .catch(e => { console.error('Failed to fetch shop stats', e); setShopStats(null); })
        .finally(() => setLoadingShopStats(false));
    } else {
      setShopStats(null);
    }
  }, [selectedEntity]);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  // --- Notes Log Section ---
  const [editingNotes, setEditingNotes] = useState('');
  const [notesSaving, setNotesSaving] = useState(false);
  const [notesError, setNotesError] = useState(null);
  const [showForwardPackageModal, setShowForwardPackageModal] = useState(false);
  const [showRejectPackageModal, setShowRejectPackageModal] = useState(false);
  const [packageToAction, setPackageToAction] = useState(null);
  const [rejectShippingPaidAmount, setRejectShippingPaidAmount] = useState('');
  const [adminRejectionPaymentMethod, setAdminRejectionPaymentMethod] = useState('CASH');
  const [adminRejectionDeductShipping, setAdminRejectionDeductShipping] = useState(true);
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
  
  // Add state for give money to driver functionality
  const [giveMoneyAmount, setGiveMoneyAmount] = useState('');
  const [giveMoneyReason, setGiveMoneyReason] = useState('');
  const [givingMoney, setGivingMoney] = useState(false);
  // Add state for variable settlement amount popup
  const [showSettleAmountModal, setShowSettleAmountModal] = useState(false);
  const [settleShopId, setSettleShopId] = useState(null);
  // Add state for auto-scrolling to settlement
  const [autoScrollToSettle, setAutoScrollToSettle] = useState(false);
  
  // Add state for comprehensive package editing
  const [isEditingPackage, setIsEditingPackage] = useState(false);
  const [editingPackageData, setEditingPackageData] = useState({});
  const [savingPackage, setSavingPackage] = useState(false);
  
  // Move these to the top level of AdminDashboard
  const settlementRef = useRef(null);
  useEffect(() => {
    if (autoScrollToSettle && showDetailsModal && settlementRef.current) {
      settlementRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setAutoScrollToSettle(false);
    }
  }, [autoScrollToSettle, showDetailsModal]);

  // --- Mobile detection ---
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const updateIsMobile = () => setIsMobile(typeof window !== 'undefined' && window.innerWidth <= 768);
    updateIsMobile();
    window.addEventListener('resize', updateIsMobile);
    return () => window.removeEventListener('resize', updateIsMobile);
  }, []);

  // Prevent background scroll when details modal is open on mobile for better UX
  useEffect(() => {
    if (isMobile && showDetailsModal) {
      document.body.classList.add('no-scroll');
    } else {
      document.body.classList.remove('no-scroll');
    }
    return () => document.body.classList.remove('no-scroll');
  }, [isMobile, showDetailsModal]);

  // Swipe-down-to-close (mobile): refs and handlers for details modal
  const detailsModalContentRef = useRef(null);
  const detailsTouchStartY = useRef(0);
  const detailsTouchMoveY = useRef(0);
  const detailsScrollAtTop = useRef(false);
  const onDetailsTouchStart = (e) => {
    if (!isMobile) return;
    const y = e.touches?.[0]?.clientY ?? 0;
    detailsTouchStartY.current = y;
    detailsTouchMoveY.current = y;
    const scTop = detailsModalContentRef.current ? detailsModalContentRef.current.scrollTop : 0;
    detailsScrollAtTop.current = scTop <= 0;
  };
  const onDetailsTouchMove = (e) => {
    if (!isMobile) return;
    const y = e.touches?.[0]?.clientY ?? 0;
    detailsTouchMoveY.current = y;
  };

  // Mobile: support Android back button (history back) to close details modal
  const detailsHistoryPushed = useRef(false);
  useEffect(() => {
    if (!isMobile) return;
    if (showDetailsModal) {
      try {
        window.history.pushState({ detailsModal: true }, '');
        detailsHistoryPushed.current = true;
      } catch {}
      const onPop = () => {
        if (showDetailsModal) {
          // Close without pushing another history event
          setShowDetailsModal(false);
          setSelectedEntity(null);
          setIsEditingPackage(false);
          detailsHistoryPushed.current = false;
        }
      };
      window.addEventListener('popstate', onPop);
      return () => window.removeEventListener('popstate', onPop);
    }
  }, [isMobile, showDetailsModal]);

  

  // --- Mobile sidebar state (button toggled only) ---
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const adminContainerRef = useRef(null);

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        adminContainerRef.current &&
        !adminContainerRef.current.contains(event.target) &&
        !event.target.closest?.('.menu-toggle-btn') &&
        isMenuOpen
      ) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen]);

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
    { label: 'Cancelled', value: 'cancelled' },
    { label: 'Return to Shop', value: 'return-to-shop' }
  ];

  // Define sub-sub-tabs for each main tab
  const PACKAGE_SUB_TABS = {
    'all': [
      { label: 'All', value: 'all' }
    ],
    'ready-to-assign': [
      { label: 'All Ready', value: 'all' },
      { label: 'Awaiting Schedule', value: 'awaiting_schedule' },
      { label: 'Scheduled for Pickup', value: 'scheduled_for_pickup' },
      { label: 'Exchange Awaiting Schedule', value: 'exchange-awaiting-schedule' },
      { label: 'Return Requested', value: 'return-requested' }
    ],
    'in-transit': [
      { label: 'All In Transit', value: 'all' },
      { label: 'Assigned', value: 'assigned' },
      { label: 'Picked Up', value: 'pickedup' },
      { label: 'In Transit', value: 'in-transit' }
    ],
    'delivered': [
      { label: 'All Delivered', value: 'all' },
      { label: 'Delivered', value: 'delivered' },
      { label: 'Delivered & Returned', value: 'delivered-returned' }
    ],
    'cancelled': [
      { label: 'All Cancelled', value: 'all' },
      { label: 'Cancelled & Cancelled Returned', value: 'cancelled-group' },
      { label: 'Rejected & Rejected Returned', value: 'rejected-group' }
    ],
    'return-to-shop': [
      { label: 'All Returns', value: 'all' },
      { label: 'Return Requested', value: 'return-requested' },
      { label: 'Return In Transit', value: 'return-in-transit' },
      { label: 'Return Pending', value: 'return-pending' },
      { label: 'Return Completed', value: 'return-completed' },
      { label: 'Exchange Requested', value: 'exchange-requests' },
      { label: 'Cancelled Awaiting Return', value: 'cancelled-awaiting-return' },
      { label: 'Rejected Awaiting Return', value: 'rejected-awaiting-return' },
      { label: 'Delivered Awaiting Return', value: 'delivered-awaiting-return' },
      { label: 'Exchange Completed', value: 'exchange-completed' }
    ]
  };

  // Function to fetch packages for a driver
  const fetchDriverPackages = async (driverId, opts = {}) => {
    try {
      const params = { driverId };
      if (opts.createdAfter) params.createdAfter = opts.createdAfter;
      if (opts.createdBefore) params.createdBefore = opts.createdBefore;
      const res = await adminService.getPackages({ ...params, page: 1, limit: 25 });
      const list = res.data?.packages || res.data || [];
      setDriverPackages(list.filter(pkg => pkg.driverId === driverId));
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
 
     // If next status is delivered, open admin pre-delivery confirmation modal instead of immediate update
     if (nextStatus === 'delivered') {
       try {
         // Ensure we have the latest package details including Items
         let pkgForModal = pkg;
         try {
           const res = await packageService.getPackageById(pkg.id);
           if (res && res.data) pkgForModal = res.data;
         } catch {}
         // Normalize Items key for modal
         const itemsArr = Array.isArray(pkgForModal.Items) ? pkgForModal.Items : (Array.isArray(pkgForModal.items) ? pkgForModal.items : []);
         setAdminDeliveryModalPackage({ ...pkgForModal, Items: itemsArr });
         setAdminIsPartialDelivery(false);
         setAdminDeliveredQuantities({});
         setAdminPaymentMethodChoice('CASH');
         setShowAdminDeliveryModal(true);
       } finally {
         setForwardingPackageId(null);
       }
       return;
     }

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
      const rawAmount = rejectShippingPaidAmount !== '' ? parseFloat(rejectShippingPaidAmount) : undefined;
      const deliveryCost = parseFloat(pkg.deliveryCost || 0) || 0;
      const amount = rawAmount !== undefined ? Math.max(0, Math.min(rawAmount, deliveryCost)) : undefined;
      const payload = { status: 'rejected-awaiting-return' };
      if (amount !== undefined) payload.rejectionShippingPaidAmount = amount;
      if (adminRejectionPaymentMethod && (adminRejectionPaymentMethod === 'CASH' || adminRejectionPaymentMethod === 'VISA')) {
        payload.paymentMethod = adminRejectionPaymentMethod;
      }
      if (typeof adminRejectionDeductShipping === 'boolean') {
        payload.rejectionDeductShipping = adminRejectionDeductShipping;
      }
      await packageService.updatePackageStatus(pkg.id, payload);
      // Refresh the packages list to get the correct status from backend
      fetchPackages(packagePage, searchTerm);
      setShowRejectPackageModal(false);
      setRejectShippingPaidAmount('');
      setAdminRejectionPaymentMethod('CASH');
      setAdminRejectionDeductShipping(true);
      setPackageToAction(null);
      setShowDetailsModal(false);
      setStatusMessage({
        type: 'success',
        text: `Package ${pkg.trackingNumber} has been rejected and is awaiting return.`
      });
    } catch (err) {
      console.error('Error rejecting package:', err);
      setStatusMessage({
        type: 'error',
        text: `Error rejecting package: ${err.response?.data?.message || err.message || 'Unknown error'}`
      });
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

  // Start editing package
  const startEditingPackage = (pkg) => {
    setEditingPackageData({
      packageDescription: pkg.packageDescription || '',
      weight: pkg.weight || '',
      dimensions: pkg.dimensions || '',
      pickupAddress: pkg.pickupAddress || '',
      deliveryAddress: pkg.deliveryAddress || '',
      pickupContactName: pkg.pickupContactName || '',
      pickupContactPhone: pkg.pickupContactPhone || '',
      deliveryContactName: pkg.deliveryContactName || '',
      deliveryContactPhone: pkg.deliveryContactPhone || '',
      codAmount: pkg.codAmount || 0,
      deliveryCost: pkg.deliveryCost || 0,
      shownDeliveryCost: pkg.shownDeliveryCost || 0,
      shopNotes: pkg.shopNotes || '',
      type: pkg.type || 'new',
      status: pkg.status || 'pending',
      paymentMethod: pkg.paymentMethod || '',
      isPaid: pkg.isPaid || false,
      paymentNotes: pkg.paymentNotes || '',
      items: pkg.Items ? pkg.Items.map(item => ({
        id: item.id,
        description: item.description || '',
        quantity: item.quantity || 1,
        codPerUnit: item.codAmount && item.quantity ? (item.codAmount / item.quantity) : 0
      })) : []
    });
    setIsEditingPackage(true);
  };

  // Save package edits
  const savePackageEdits = async () => {
    if (!selectedEntity) return;
    
    setSavingPackage(true);
    try {
      const updateData = { ...editingPackageData };
      
      // Convert items back to the format expected by the backend
      if (updateData.items && Array.isArray(updateData.items)) {
        updateData.items = updateData.items.map(item => ({
          description: item.description,
          quantity: parseInt(item.quantity) || 1,
          codPerUnit: parseFloat(item.codPerUnit) || 0
        }));
      }
      
      await adminService.updatePackage(selectedEntity.id, updateData);
      
      // Refresh the package data
      const response = await packageService.getPackageById(selectedEntity.id);
      if (response && response.data) {
        setSelectedEntity({ ...response.data, entityType: 'package' });
      }
      
      setIsEditingPackage(false);
      setEditingPackageData({});
      setStatusMessage({ type: 'success', text: 'Package updated successfully.' });
    } catch (err) {
      console.error('Error saving package:', err);
      setStatusMessage({ 
        type: 'error', 
        text: `Failed to update package: ${err.response?.data?.message || err.message}` 
      });
    } finally {
      setSavingPackage(false);
    }
  };

  // Cancel package editing
  const cancelPackageEditing = () => {
    setIsEditingPackage(false);
    setEditingPackageData({});
  };

  // Delete package
  const deletePackage = async (pkg) => {
    setConfirmationDialogTitle('Delete Package');
    setConfirmationDialogText(`Are you sure you want to delete package #${pkg.trackingNumber}? This action cannot be undone.`);
    setConfirmAction(() => async () => {
      try {
        await adminService.deletePackage(pkg.id);
        setShowDetailsModal(false);
        setStatusMessage({ type: 'success', text: 'Package deleted successfully.' });
        // Refresh packages list
        fetchPackages(packagePage, searchTerm);
      } catch (err) {
        setStatusMessage({ 
          type: 'error', 
          text: `Failed to delete package: ${err.response?.data?.message || err.message}` 
        });
      } finally {
        setShowConfirmationDialog(false);
      }
    });
    setShowConfirmationDialog(true);
  };

  // Add new item to package
  const addItemToPackage = () => {
    setEditingPackageData(prev => ({
      ...prev,
      items: [...(prev.items || []), {
        id: Date.now(), // Temporary ID
        description: '',
        quantity: 1,
        codPerUnit: 0
      }]
    }));
  };

  // Remove item from package
  const removeItemFromPackage = (index) => {
    setEditingPackageData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  // Update item in package
  const updateItemInPackage = (index, field, value) => {
    setEditingPackageData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
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
        
        // Check if we need to switch to a specific tab and reopen modal after refresh
        const reopenTab = localStorage.getItem('reopenAdminTab');
        const reopenEntityId = localStorage.getItem('reopenAdminModal');
        const reopenPackagesTab = localStorage.getItem('reopenAdminPackagesTab');
        if (reopenTab && reopenEntityId) {
          setActiveTab(reopenTab);
          if (reopenPackagesTab) {
            setPackagesTab(reopenPackagesTab);
          }
          localStorage.removeItem('reopenAdminTab');
          localStorage.removeItem('reopenAdminModal');
          localStorage.removeItem('reopenAdminPackagesTab');
        }
        
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
            adminService.getPackages({ page: 1, limit: 25 }),
            adminService.getMoneyTransactions()
          ]);
          const pkgs = allPkgsRes.data?.packages || allPkgsRes.data || [];
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
            // Don't fetch packages here - let the packages-specific useEffect handle it
            // Fetch all drivers for lookup
            const driversResponse = await adminService.getDrivers();
            setDrivers(driversResponse.data || []);
            // Check if we need to reopen a package modal after refresh
            if (reopenEntityId) {
              const entityToReopen = (packages || []).find(pkg => pkg.id == reopenEntityId);
              if (entityToReopen) {
                setSelectedEntity(entityToReopen);
                setShowDetailsModal(true);
              }
            }
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



  // Clear selected packages only when switching tabs (preserve selection on data refresh)
  useEffect(() => {
    setSelectedPackages([]);
  }, [activeTab, packagesTab]);

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
    
    // If approving a shop, ask for shipping fees first
    if (approve && userType === 'shop') {
      const idToUse = selectedEntity?.shopId || selectedEntity?.userId || entityId;
      setPendingShopApproval({ id: idToUse, selectedEntity });
      setShippingFeesInput('');
      setShowShippingFeesModal(true);
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
            // Pass shippingFees if coming from the modal input
            const shippingFees = (typeof shippingFeesInput === 'string' && shippingFeesInput.trim() !== '') ? parseFloat(shippingFeesInput) : undefined;
            response = await adminService.approveShop(idToUse, approve, shippingFees);
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
                const shippingFees = (typeof shippingFeesInput === 'string' && shippingFeesInput.trim() !== '') ? parseFloat(shippingFeesInput) : undefined;
                response = await adminService.approveShop(selectedEntity.id, approve, shippingFees);
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
                  const packagesResponse = await adminService.getPackages({ page: 1, limit: 25 });
                  setPackages(packagesResponse.data?.packages || packagesResponse.data || []);
                  break;
                case 'dashboard':
                  const [pkgs, trans] = await Promise.all([
                    adminService.getPackages({ page: 1, limit: 25 }),
                    adminService.getMoneyTransactions()
                  ]);
                  setPackages(pkgs.data?.packages || pkgs.data || []);
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
                await fetchPackages(1, searchTerm);
                break;
              case 'dashboard':
                const [pkgs, trans] = await Promise.all([
                  adminService.getPackages({ page: 1, limit: 25 }),
                  adminService.getMoneyTransactions()
                ]);
                setPackages(pkgs.data?.packages || pkgs.data || []);
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
        await fetchPackages(1, searchTerm);
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
      <div className="modal-overlay show" onClick={() => setShowAssignDriverModal(false)}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
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

    // For packages, fetch complete package data including Items
    if (type === 'package') {
      try {
        const response = await packageService.getPackageById(entity.id);
        if (response && response.data) {
          // Parse notes from the fetched data
          let fetchedNotesArr = [];
          if (Array.isArray(response.data.notes)) {
            fetchedNotesArr = response.data.notes;
          } else if (typeof response.data.notes === 'string') {
            try {
              fetchedNotesArr = JSON.parse(response.data.notes);
            } catch {
              fetchedNotesArr = [];
            }
          }
          // Normalize deliveredItems (may come as string/alt key from DB)
          let normalizedDelivered = response.data.deliveredItems ?? response.data.delivereditems ?? null;
          if (typeof normalizedDelivered === 'string') {
            try { normalizedDelivered = JSON.parse(normalizedDelivered); } catch { normalizedDelivered = null; }
          }
          if (!Array.isArray(normalizedDelivered)) normalizedDelivered = [];

          // Normalize Items (ensure always present as Items)
          let normalizedItems = response.data.Items ?? response.data.items ?? [];
          if (!Array.isArray(normalizedItems)) normalizedItems = [];

          setSelectedEntity({ ...response.data, deliveredItems: normalizedDelivered, Items: normalizedItems, notes: fetchedNotesArr, entityType: type });
        } else {
          // Also normalize deliveredItems from the entity if present
          let normalizedDelivered = entity.deliveredItems ?? entity.delivereditems ?? null;
          if (typeof normalizedDelivered === 'string') {
            try { normalizedDelivered = JSON.parse(normalizedDelivered); } catch { normalizedDelivered = null; }
          }
          if (!Array.isArray(normalizedDelivered)) normalizedDelivered = [];
          setSelectedEntity({ ...entity, deliveredItems: normalizedDelivered, notes: notesArr });
        }
      } catch (err) {
        console.error('Error fetching package details:', err);
        let normalizedDelivered = entity.deliveredItems ?? entity.delivereditems ?? null;
        if (typeof normalizedDelivered === 'string') {
          try { normalizedDelivered = JSON.parse(normalizedDelivered); } catch { normalizedDelivered = null; }
        }
        if (!Array.isArray(normalizedDelivered)) normalizedDelivered = [];
        setSelectedEntity({ ...entity, deliveredItems: normalizedDelivered, notes: notesArr });
      }
    } else {
      setSelectedEntity(entity);
    }
    
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
      // Fetch shop financial snapshot
      const shopResponse = await adminService.getShopById(shopId);
      const shopData = shopResponse?.data || {};
      const totalCollected = parseFloat(shopData.TotalCollected || 0);

      // Fetch packages for this shop
      const packagesResponse = await adminService.getShopPackages(shopId);
      // Normalize the response robustly: try common shapes and fall back to []
      let pkgs = [];
      const candidates = [
        packagesResponse?.data,
        packagesResponse?.data?.packages,
        packagesResponse?.packages,
        packagesResponse?.data?.rows,
        packagesResponse?.data?.data,
        packagesResponse?.rows,
        packagesResponse?.data?.results,
      ];
      for (const c of candidates) {
        if (Array.isArray(c)) { pkgs = c; break; }
      }
      if (!Array.isArray(pkgs)) pkgs = [];

      // Sort newest first (assume createdAt) and take latest 10 only for display section
      const latestTen = pkgs
        .slice()
        .sort((a,b) => new Date(b.createdAt || b.updatedAt || 0) - new Date(a.createdAt || a.updatedAt || 0))
        .slice(0,10);
  setShopPackages(latestTen);

      // Determine packages that still have money to settle from full set (not just top 10)
      const packagesWithMoney = (Array.isArray(pkgs) ? pkgs : []).filter(pkg => 
        parseFloat(pkg.codAmount) > 0 && pkg.isPaid === true && pkg.status === 'delivered'
      );
      setShopPackagesWithUnpaidMoney(packagesWithMoney);
      setShopUnpaidTotal(totalCollected);
    } catch (error) {
      console.error('Error loading shop packages:', error);
      alert(`Error: ${error?.response?.data?.message || error.message || 'Failed to load packages'}`);
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
                  To Collect (EGP) {renderSortIcon('ToCollect')}
                </th>
                <th 
                  className="sortable-header"
                  onClick={() => handleSort('TotalCollected')}
                >
                  Collected (EGP) {renderSortIcon('TotalCollected')}
                </th>
              </>
            )}
            {activeTab === 'drivers' && (
              <>
                <th>Working Area</th>
                <th>Cash On Hand (EGP)</th>
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
                  <td data-label="To Collect (EGP)" className="financial-cell" style={{fontSize: '15px', color: parseFloat(user.ToCollect || 0) > 0 ? '#2e7d32' : '#d32f2f'}}>
                    EGP {parseFloat(user.ToCollect || 0).toFixed(2)}
                  </td>
                  <td data-label="Collected (EGP)" className="financial-cell" style={{fontSize: '15px', color: parseFloat(user.TotalCollected || 0) > 0 ? '#2e7d32' : '#d32f2f'}}>
                    EGP {parseFloat(user.TotalCollected || 0).toFixed(2)}
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
                  <td data-label="Cash On Hand (EGP)" className="financial-cell" style={{fontSize: '15px', color: parseFloat(user.cashOnHand || 0) > 0 ? '#2e7d32' : '#d32f2f'}}>
                    EGP {parseFloat(user.cashOnHand || 0).toFixed(2)}
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

    const currentSubTabs = PACKAGE_SUB_TABS[packagesTab] || [];

    return (
      <div className="packages-header">
        <div className="packages-sub-tabs">
          {PACKAGE_TABS.map(tab => (
            <button 
              key={tab.value}
              className={`sub-tab-btn ${packagesTab === tab.value ? 'active' : ''}`}
              onClick={() => handleMainTabChange(tab.value)}
            >
              {tab.label}
            </button>
          ))}
          {packagesTab === 'ready-to-assign' && packagesSubTab === 'all' && selectedPackages.length > 0 && (
            <button 
              className="btn-primary bulk-assign-btn"
              onClick={openBulkAssignModal}
              disabled={selectedPackages.length === 0}
            >
              Assign Driver to {selectedPackages.length} Selected Package{selectedPackages.length !== 1 ? 's' : ''}
            </button>
          )}
          {/* Export Selected Packages to PDF (admin only, any packages tab 'all') */}
          {packagesSubTab === 'all' && selectedPackages.length > 0 && (
            <button
              className="btn-secondary bulk-assign-btn"
              onClick={handleExportSelectedPackages}
              disabled={selectedPackages.length === 0}
              title="Export selected packages as PDF"
              style={{ background: '#444', marginLeft: '0.5rem' }}
            >
              Export {selectedPackages.length} to PDF
            </button>
          )}
          {packagesTab === 'in-transit' && packagesSubTab === 'all' && selectedPackages.length > 0 && (
            (() => {
              const statusFlow = ['assigned', 'pickedup', 'in-transit', 'delivered'];
              const eligibleCount = packages
                .filter(pkg => selectedPackages.includes(pkg.id))
                .filter(pkg => {
                  const idx = statusFlow.indexOf(pkg.status);
                  return idx !== -1 && idx < statusFlow.length - 1 && statusFlow[idx + 1] !== 'delivered';
                }).length;
              return (
                <button
                  className="btn-primary bulk-assign-btn"
                  onClick={handleBulkForward}
                  disabled={eligibleCount === 0}
                  title={eligibleCount === 0 ? 'Only packages moving to Delivered are selected; complete individually.' : 'Forward status for selected packages'}
                >
                  Forward {eligibleCount} Selected
                </button>
              );
            })()
          )}
        </div>
        
        {/* Sub-sub-tabs */}
        {currentSubTabs.length > 1 && (
          <div className="packages-sub-sub-tabs">
            {currentSubTabs.map(subTab => (
              <button 
                key={subTab.value}
                className={`sub-sub-tab-btn ${packagesSubTab === subTab.value ? 'active' : ''}`}
                onClick={() => handleSubTabChange(subTab.value)}
              >
                {subTab.label}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Render packages table
  const renderPackagesTable = () => {
    const filteredPackages = getFilteredPackages();
    const isAllSelected = filteredPackages.length > 0 && selectedPackages.length === filteredPackages.length;
    const selectionEnabled = packagesSubTab === 'all' && ['ready-to-assign', 'in-transit', 'all'].includes(packagesTab);
    const baseColCount = 8 + (packagesTab === 'delivered' ? 1 : 0);
    const totalColSpan = baseColCount + (selectionEnabled ? 1 : 0);

    return (
      <table className="admin-table">
        <thead>
          <tr>
            {selectionEnabled && (
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
            <th>Status</th>
            {packagesTab === 'delivered' && <th>Delivery Date</th>}
            <th>
              From
              <select
                value={packageShopFilter}
                onChange={e => handleShopFilterChange(e.target.value)}
                style={{ marginLeft: 6, fontSize: '0.95em' }}
              >
                <option value="">All</option>
                {availableShops.map(shop => (
                  <option key={shop.id} value={shop.businessName}>{shop.businessName}</option>
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
          {filteredPackages.length === 0 ? (
            <tr>
              <td colSpan={totalColSpan} style={{ textAlign: 'center', padding: '40px 20px' }}>
                <div className="empty-state">
                  <p>No packages found{searchTerm ? ' matching your search' : ''}.</p>
                </div>
              </td>
            </tr>
          ) : (
            filteredPackages.map(pkg => (
            <tr key={pkg.id}>
              {selectionEnabled && (
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
              {packagesTab === 'delivered' && (
                <td data-label="Delivery Date">
                  {pkg.actualDeliveryTime ? new Date(pkg.actualDeliveryTime).toLocaleDateString() : 'N/A'}
                </td>
              )}
              <td data-label="From">{pkg.shop?.businessName || 'N/A'}</td>
              <td data-label="To">
                <div>{pkg.deliveryAddress}</div>
                {(pkg.deliveryContactName || pkg.deliveryContactPhone) && (
                  <div style={{ fontSize: 12, color: '#555', marginTop: 4 }}>
                    {pkg.deliveryContactName || 'N/A'}{pkg.deliveryContactPhone ? ` · ${pkg.deliveryContactPhone}` : ''}
                  </div>
                )}
              </td>
                              <td data-label="COD Amount">EGP {parseFloat(pkg.codAmount || 0).toFixed(2)}</td>
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
                {packagesTab === 'return-to-shop' && pkg.status === 'delivered-awaiting-return' && (
                  <button
                    className="action-btn return-btn"
                    onClick={() => {
                      setConfirmationDialogTitle('Mark as Delivered Returned');
                      setConfirmationDialogText('Are you sure you want to mark this package as Delivered Returned? This will update the status and perform any required money transactions.');
                      setConfirmAction(() => async () => {
                        await handleMarkAsReturned(pkg);
                        setShowConfirmationDialog(false);
                      });
                      setShowConfirmationDialog(true);
                    }}
                    title="Mark as Delivered Returned"
                  >
                    <FontAwesomeIcon icon={faCheck} />
                  </button>
                )}
                {packagesTab === 'return-to-shop' && pkg.status === 'return-pending' && (
                  <button
                    className="action-btn return-btn"
                    onClick={() => {
                      setReturnCompletePkg(pkg);
                      setReturnDeductShipping(true);
                      setShowReturnCompleteDialog(true);
                    }}
                    title="Mark Return Completed"
                  >
                    <FontAwesomeIcon icon={faCheck} />
                  </button>
                )}
                {packagesTab === 'return-to-shop' && pkg.status === 'exchange-awaiting-return' && (
                  <button
                    className="action-btn return-btn"
                    onClick={() => {
                      setExchangeCompletePkg(pkg);
                      setExchangeDeductShipping(true);
                      setShowExchangeCompleteDialog(true);
                    }}
                    title="Mark Exchange Completed"
                  >
                    <FontAwesomeIcon icon={faCheck} />
                  </button>
                )}
                {packagesTab === 'return-to-shop' && pkg.status === 'exchange-in-transit' && (
                  <button
                    className="action-btn return-btn"
                    onClick={async () => {
                      try {
                        await packageService.updatePackageStatus(pkg.id, { status: 'exchange-awaiting-return' });
                        await fetchPackagesWithMainTab(packagesTab, packagesSubTab, packagePage);
                      } catch (err) {
                        console.error('Failed to move exchange to awaiting return:', err);
                      }
                    }}
                    title="Move to Exchange Awaiting Return"
                  >
                    <FontAwesomeIcon icon={faCheck} />
                  </button>
                )}
                {packagesTab === 'return-to-shop' && pkg.status === 'return-in-transit' && (
                  <button
                    className="action-btn return-btn"
                    onClick={async () => {
                      try {
                        await packageService.updatePackageStatus(pkg.id, { status: 'return-pending' });
                        await fetchPackagesWithMainTab(packagesTab, packagesSubTab, packagePage);
                      } catch (err) {
                        console.error('Failed to forward return status:', err);
                      }
                    }}
                    title="Forward Return (to Pending)"
                  >
                    <FontAwesomeIcon icon={faCheck} />
                  </button>
                )}
              </td>
            </tr>
          ))
        )}
        </tbody>
      </table>
    );
  };

  // Export selected packages to PDF
  const handleExportSelectedPackages = async () => {
    if (selectedPackages.length === 0 || exportingPdf) return;
    try {
      setExportingPdf(true);
      // Fetch only IDs we want
      const response = await api.post('/packages/export', { packageIds: selectedPackages }, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const stamp = new Date().toISOString().slice(0,19).replace(/[:T]/g,'-');
      a.download = `packages_export_${stamp}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export PDF:', err);
      alert('Failed to export PDF. Please try again.');
    } finally {
      setExportingPdf(false);
    }
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
              <td data-label="Actions" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {pickup.status === 'scheduled' && (
                  <>
                    <button
                      className="action-btn assign-btn"
                      onClick={() => openAssignPickupDriverModal(pickup)}
                      title="Assign Driver"
                      style={{ backgroundColor: '#fd7e14', color: 'white' }}
                    >
                      <FontAwesomeIcon icon={faTruck} />
                    </button>
                    <button
                      className="action-btn pickup-btn"
                      onClick={() => handleMarkPickupAsPickedUp(pickup.id)}
                      title="Mark as Picked Up"
                      disabled={pickupStatusUpdating[pickup.id]}
                      style={{ backgroundColor: '#28a745', color: 'white' }}
                    >
                      <FontAwesomeIcon icon={faCheck} />
                    </button>
                    <button
                      className="action-btn reject-btn"
                      onClick={() => handleDeletePickup(pickup)}
                      title="Delete Pickup"
                      disabled={deletingPickup}
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                    <button
                      className="action-btn view-btn"
                      onClick={() => handlePickupClick(pickup)}
                      title="View Packages"
                    >
                      <FontAwesomeIcon icon={faEye} />
                    </button>
                  </>
                )}
                {pickup.status !== 'scheduled' && (
                <button
                  className="action-btn view-btn"
                  onClick={() => handlePickupClick(pickup)}
                  title="View Packages"
                >
                  <FontAwesomeIcon icon={faEye} />
                </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  // Render details modal
  const renderDetailsModal = (settlementRef) => {
    if (!showDetailsModal || !selectedEntity) return null;

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
          // Optimistically remove driver from list
          setUsers(prev => (Array.isArray(prev) ? prev.filter(u => u.userId !== driverUserId && u.id !== driverUserId) : prev));
          fetchUsers('drivers');
        } catch (err) {
          setStatusMessage({ type: 'error', text: 'Failed to delete driver.' });
        } finally {
          setShowConfirmationDialog(false);
        }
      });
      setShowConfirmationDialog(true);
    };

    const closeDetails = () => {
      if (isMobile && detailsHistoryPushed.current) {
        // Pop our injected history state first so back behaves naturally
        detailsHistoryPushed.current = false;
        try { window.history.back(); } catch {}
      }
      setShowDetailsModal(false);
      setSelectedEntity(null);
      setIsEditingPackage(false);
    };

    // Helpers for mobile UX enhancements
    const toTel = (s) => {
      if (!s) return '';
      const cleaned = String(s).replace(/[^+\d]/g, '');
      return `tel:${cleaned}`;
    };
    const copyToClipboard = async (text) => {
      try {
        await navigator.clipboard?.writeText?.(String(text));
        setStatusMessage({ type: 'success', text: 'Copied to clipboard' });
      } catch (e) {
        setStatusMessage({ type: 'error', text: 'Copy failed' });
      }
    };
    const shareTracking = async (pkg) => {
      const title = `Package ${pkg?.trackingNumber || ''}`.trim();
      const text = `${title}${pkg?.packageDescription ? ` – ${pkg.packageDescription}` : ''}`;
      const url = typeof window !== 'undefined' ? window.location.href : undefined;
      if (navigator.share) {
        try { await navigator.share({ title, text, url }); return; } catch {}
      }
      copyToClipboard(title);
    };

    return (
      <div
        className={`modal-overlay ${showDetailsModal ? 'show' : ''}`}
        onClick={closeDetails}
      >
        {/* Mobile floating close button for details modal */}
        {isMobile && (
          <button
            className="modal-close-fab"
            aria-label="Close"
            onClick={(e) => { e.stopPropagation(); closeDetails(); }}
          >
            ×
          </button>
        )}
        <div
          className="modal-content details-modal"
          role="dialog"
          aria-modal="true"
          ref={detailsModalContentRef}
          onClick={e => e.stopPropagation()}
          onTouchStart={onDetailsTouchStart}
          onTouchMove={onDetailsTouchMove}
          onTouchEnd={() => {
            if (!isMobile) return;
            const dy = detailsTouchMoveY.current - detailsTouchStartY.current;
            if (detailsScrollAtTop.current && dy > 90) {
              closeDetails();
            }
            detailsTouchStartY.current = 0;
            detailsTouchMoveY.current = 0;
            detailsScrollAtTop.current = false;
          }}
          onTouchCancel={() => {
            detailsTouchStartY.current = 0;
            detailsTouchMoveY.current = 0;
            detailsScrollAtTop.current = false;
          }}
        >
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {isPackage && (
                <button
                  className="btn"
                  onClick={(e) => { e.stopPropagation(); handlePrintAWB(selectedEntity); }}
                  style={{ background: '#6c757d', color: '#fff' }}
                  title="Print AWB"
                >
                  Print AWB
                </button>
              )}
              <button
                className="modal-close"
                onClick={(e) => { e.stopPropagation(); closeDetails(); }}
                style={{ background: 'none', border: 'none', fontSize: 28, cursor: 'pointer', color: '#888', marginLeft: 16 }}
                title="Close"
              >
                &times;
              </button>
            </div>
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
                            <span>EGP {netRevenue.toFixed(2)}</span>
                          </div>
                          <div className="nested-detail">
                            <span className="nested-label">Total Settled:</span>
                            <span>EGP {parseFloat(selectedEntity.settelled || 0).toFixed(2)}</span>
                          </div>
                        </>
                      })()}
                    </div>
                  </div>
                  {/* Operational Insights moved beneath Business Information for better readability */}
                  <div className="detail-item full-width" style={{ marginTop: 12 }}>
                    <span className="label">Operational Insights:</span>
                    <div className="operational-insights" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(170px,1fr))', gap: 6 }}>
                      {loadingShopStats && <span>Loading stats...</span>}
                      {!loadingShopStats && shopStats && (
                        <>
                          <div className="mini-stat"><strong>Total Packages:</strong> {shopStats.totalPackages}</div>
                          <div className="mini-stat"><strong>Delivered:</strong> {shopStats.deliveredCount}</div>
                          <div className="mini-stat"><strong>Cancelled:</strong> {shopStats.cancelledCount}</div>
                          <div className="mini-stat"><strong>Rejected:</strong> {shopStats.rejectedCount}</div>
                          <div className="mini-stat"><strong>Return Req:</strong> {shopStats.returnRequestedCount}</div>
                          <div className="mini-stat"><strong>Return Done:</strong> {shopStats.returnCompletedCount}</div>
                          <div className="mini-stat"><strong>Exchange In-Process:</strong> {shopStats.exchangeProcessCount}</div>
                          <div className="mini-stat"><strong>Exchange Done:</strong> {shopStats.exchangeCompletedCount}</div>
                          <div className="mini-stat"><strong>Exchange Cancelled:</strong> {shopStats.exchangeCancelledCount}</div>
                          <div className="mini-stat"><strong>Delivery Success %:</strong> {(shopStats.deliverySuccessRate * 100).toFixed(1)}%</div>
                          <div className="mini-stat"><strong>Cancellation %:</strong> {(shopStats.cancellationRate * 100).toFixed(1)}%</div>
                          <div className="mini-stat"><strong>Rejection %:</strong> {(shopStats.rejectionRate * 100).toFixed(1)}%</div>
                          <div className="mini-stat"><strong>COD Expected:</strong> EGP {shopStats.codExpected.toFixed(2)}</div>
                          <div className="mini-stat"><strong>COD Collected:</strong> EGP {shopStats.codCollected.toFixed(2)}</div>
                          <div className="mini-stat"><strong>COD Collection %:</strong> {(shopStats.codCollectionRate * 100).toFixed(1)}%</div>
                        </>
                      )}
                      {!loadingShopStats && !shopStats && <span style={{ fontStyle: 'italic' }}>No stats available.</span>}
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
                <>
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

                {/* Returning Items (derived from Items - deliveredItems) */}
                {selectedEntity && Array.isArray(selectedEntity.Items) && selectedEntity.Items.length > 0 && Array.isArray(selectedEntity.deliveredItems) && selectedEntity.deliveredItems.length > 0 && (
                  (() => {
                    const deliveredMap = new Map(selectedEntity.deliveredItems.map(di => [di.itemId, parseInt(di.deliveredQuantity, 10) || 0]));
                    const remaining = selectedEntity.Items
                      .map(it => {
                        const totalQty = parseInt(it.quantity, 10) || 0;
                        const deliveredQty = deliveredMap.get(it.id) || 0;
                        const remain = Math.max(0, totalQty - deliveredQty);
                        return { id: it.id, description: it.description, quantity: remain };
                      })
                      .filter(r => r.quantity > 0);
                    return remaining.length > 0 ? (
                      <div className="detail-item full-width">
                        <span className="label">Returning Items</span>
                        <ul style={{ margin: '6px 0 0 18px', padding: 0 }}>
                          {remaining.map((r, idx) => (
                            <li key={`ret-${idx}`}>{r.description || `Item ${r.id}`} — Qty: {r.quantity}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null;
                  })()
                )}
                </>
              )}
              
              {/* Quick settlement panel (visible without loading packages) */}
              {parseFloat(selectedEntity.TotalCollected || 0) > 0 && (
                <div className="settlement-section" style={{marginTop: '1rem'}} ref={settlementRef}>
                  <div className="settlement-title">Settle Payments with Shop</div>
                  <div className="settlement-amount">Total collected: EGP {parseFloat(selectedEntity.TotalCollected).toFixed(2)}</div>
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
                    disabled={isLoadingShopPackages}
                  >
                    {isLoadingShopPackages ? 'Loading…' : 'Load Packages'}
                  </button>
                  
                  {isLoadingShopPackages && shopPackages.length === 0 && (
                    <div style={{ marginTop: '8px', color: '#666' }}>Fetching latest packages…</div>
                  )}
                  {!isLoadingShopPackages && shopPackages.length === 0 && (
                    <div style={{ marginTop: '8px', color: '#666' }}>No recent packages found.</div>
                  )}
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
                          {(Array.isArray(shopPackages) ? shopPackages : []).map(pkg => (
                            <tr key={pkg.id}>
                              <td>{pkg.trackingNumber}</td>
                              <td>
                                <span className={`status-badge status-${pkg.status}`}>
                                  {pkg.status}
                                </span>
                              </td>
                              <td className="financial-cell">EGP {parseFloat(pkg.codAmount || 0).toFixed(2)}</td>
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
                          <div className="settlement-amount">Total collected: EGP {parseFloat(shopUnpaidTotal).toFixed(2)}</div>
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
              {/* Driver cashOnHand overview and actions */}
              {isDriver && (
                <div className="detail-item full-width" style={{ marginTop: 16 }}>
                  <span className="label">Cash On Hand:</span>
                  <span style={{ fontWeight: 700 }}>EGP {parseFloat(selectedEntity.cashOnHand || 0).toFixed(2)}</span>
                  <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                    <button
                      className="btn-primary danger"
                      onClick={() => {
                        setConfirmationDialogTitle('Reset Driver Cash On Hand');
                        setConfirmationDialogText('This will reset the driver\'s cash on hand to 0. Do you want to continue?');
                        setConfirmAction(() => async () => {
                          try {
                            await adminService.resetDriverCash(selectedEntity.driverId || selectedEntity.id, { note: 'Admin reset cash on hand' });
                            const driversResponse = await adminService.getDrivers();
                            setDrivers(driversResponse.data || []);
                            setSelectedEntity(prev => ({ ...prev, cashOnHand: 0 }));
                            setStatusMessage({ type: 'success', text: 'Driver cash on hand reset.' });
                          } catch (err) {
                            setStatusMessage({ type: 'error', text: 'Failed to reset driver cash on hand.' });
                          } finally {
                            setShowConfirmationDialog(false);
                          }
                        });
                        setShowConfirmationDialog(true);
                      }}
                      style={{ marginLeft: 12 }}
                    >
                      Reset Cash On Hand
                    </button>
                  </div>
                </div>
              )}

              {/* Give Money to Driver Section */}
              {isDriver && (
                <div className="detail-item full-width" style={{ marginTop: 24, padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #e9ecef' }}>
                  <h4 style={{ marginBottom: 16, color: '#495057', fontSize: '1.1rem', fontWeight: 600 }}>
                    <FontAwesomeIcon icon={faDollarSign} style={{ marginRight: 8, color: '#28a745' }} />
                    Give Money to Driver
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: 4, fontWeight: 500, color: '#495057' }}>
                        Amount (EGP):
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
                      <label style={{ display: 'block', marginBottom: 4, fontWeight: 500, color: '#495057' }}>
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
                        padding: '10px 20px',
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
                          <div className="loading-spinner" style={{ width: '16px', height: '16px', border: '2px solid #ffffff', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                          Processing...
                        </>
                      ) : (
                        <>
                          <FontAwesomeIcon icon={faDollarSign} />
                          Give Money
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

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
          {isPackage && !isMobile && (
            <div className="details-grid">
              {/* Edit/View Mode Toggle */}
              <div className="detail-item full-width" style={{ marginBottom: 20, padding: '16px', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #e9ecef' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ margin: 0, color: '#495057' }}>
                    <FontAwesomeIcon icon={faBox} style={{ marginRight: 8 }} />
                    Package Details
                  </h3>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {!isEditingPackage ? (
                      <>
                        <button
                          className="btn btn-primary"
                          onClick={() => startEditingPackage(selectedEntity)}
                          style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                        >
                          <FontAwesomeIcon icon={faEdit} />
                          Edit Package
                        </button>
                        <button
                          className="btn btn-danger"
                          onClick={() => deletePackage(selectedEntity)}
                          style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                        >
                          <FontAwesomeIcon icon={faTrash} />
                          Delete Package
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          className="btn btn-success"
                          onClick={savePackageEdits}
                          disabled={savingPackage}
                          style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                        >
                          {savingPackage ? 'Saving...' : (
                            <>
                              <FontAwesomeIcon icon={faCheck} />
                              Save Changes
                            </>
                          )}
                        </button>
                        <button
                          className="btn btn-secondary"
                          onClick={cancelPackageEditing}
                          disabled={savingPackage}
                        >
                          Cancel
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Read-only fields */}
              <div className="detail-item">
                <span className="label">Tracking Number:</span>
                <span style={{ fontWeight: 'bold', color: '#007bff' }}>{selectedEntity.trackingNumber}</span>
              </div>
              {selectedEntity.shopifyOrderId && (
                <div className="detail-item">
                  <span className="label">Shopify Order:</span>
                  <span>{selectedEntity.shopifyOrderName || selectedEntity.shopifyOrderId}</span>
                </div>
              )}
              <div className="detail-item">
                <span className="label">Created:</span>
                <span>{selectedEntity.createdAt ? new Date(selectedEntity.createdAt).toLocaleDateString() : 'N/A'}</span>
              </div>

              {/* Editable fields */}
              <div className="detail-item">
                <span className="label">Status:</span>
                {isEditingPackage ? (
                  <select
                    value={editingPackageData.status || selectedEntity.status}
                    onChange={(e) => setEditingPackageData(prev => ({ ...prev, status: e.target.value }))}
                    style={{ padding: '6px 10px', borderRadius: 4, border: '1px solid #ccc', fontSize: '1em' }}
                  >
                    <option value="awaiting_schedule">Awaiting Schedule</option>
                    <option value="scheduled_for_pickup">Scheduled for Pickup</option>
                    <option value="pending">Pending</option>
                    <option value="assigned">Assigned</option>
                    <option value="pickedup">Picked Up</option>
                    <option value="in-transit">In Transit</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="rejected">Rejected</option>
                  </select>
                ) : (
                  <span className={`status-badge ${selectedEntity.status}`}>
                    {selectedEntity.status}
                  </span>
                )}
              </div>

              <div className="detail-item">
                <span className="label">Type:</span>
                {isEditingPackage ? (
                  <select
                    value={editingPackageData.type || selectedEntity.type}
                    onChange={(e) => setEditingPackageData(prev => ({ ...prev, type: e.target.value }))}
                    style={{ padding: '6px 10px', borderRadius: 4, border: '1px solid #ccc', fontSize: '1em' }}
                  >
                    <option value="new">New</option>
                    <option value="return">Return</option>
                    <option value="exchange">Exchange</option>
                  </select>
                ) : (
                  <span>{selectedEntity.type || 'new'}</span>
                )}
              </div>

              <div className="detail-item full-width">
                <span className="label">Description:</span>
                {isEditingPackage ? (
                  <textarea
                    value={editingPackageData.packageDescription || selectedEntity.packageDescription || ''}
                    onChange={(e) => setEditingPackageData(prev => ({ ...prev, packageDescription: e.target.value }))}
                    style={{ width: '100%', padding: '8px', borderRadius: 4, border: '1px solid #ccc', fontSize: '1em', minHeight: '60px' }}
                    placeholder="Package description"
                  />
                ) : (
                  <span>{selectedEntity.packageDescription || 'No description'}</span>
                )}
              </div>

              <div className="detail-item">
                <span className="label">Weight (kg):</span>
                {isEditingPackage ? (
                  <input
                    type="number"
                    step="0.1"
                    value={editingPackageData.weight || selectedEntity.weight || ''}
                    onChange={(e) => setEditingPackageData(prev => ({ ...prev, weight: e.target.value }))}
                    style={{ padding: '6px 10px', borderRadius: 4, border: '1px solid #ccc', fontSize: '1em', width: '100px' }}
                  />
                ) : (
                  <span>{selectedEntity.weight ? `${selectedEntity.weight} kg` : 'N/A'}</span>
                )}
              </div>

              <div className="detail-item">
                <span className="label">Dimensions:</span>
                {isEditingPackage ? (
                  <input
                    type="text"
                    value={editingPackageData.dimensions || selectedEntity.dimensions || ''}
                    onChange={(e) => setEditingPackageData(prev => ({ ...prev, dimensions: e.target.value }))}
                    style={{ padding: '6px 10px', borderRadius: 4, border: '1px solid #ccc', fontSize: '1em', width: '150px' }}
                    placeholder="LxWxH"
                  />
                ) : (
                  <span>{selectedEntity.dimensions || 'N/A'}</span>
                )}
              </div>

              <div className="detail-item">
                <span className="label">COD Amount (EGP):</span>
                {isEditingPackage ? (
                  <input
                    type="number"
                    step="0.01"
                    value={editingPackageData.codAmount || selectedEntity.codAmount || ''}
                    onChange={(e) => setEditingPackageData(prev => ({ ...prev, codAmount: e.target.value }))}
                    style={{ padding: '6px 10px', borderRadius: 4, border: '1px solid #ccc', fontSize: '1em', width: '120px' }}
                  />
                ) : (
                  <span>{selectedEntity.codAmount ? `${selectedEntity.codAmount} EGP` : 'N/A'}</span>
                )}
              </div>

              <div className="detail-item">
                <span className="label">Delivery Cost (EGP):</span>
                {isEditingPackage ? (
                  <input
                    type="number"
                    step="0.01"
                    value={editingPackageData.deliveryCost || selectedEntity.deliveryCost || ''}
                    onChange={(e) => setEditingPackageData(prev => ({ ...prev, deliveryCost: e.target.value }))}
                    style={{ padding: '6px 10px', borderRadius: 4, border: '1px solid #ccc', fontSize: '1em', width: '120px' }}
                  />
                ) : (
                  <span>{selectedEntity.deliveryCost ? `${selectedEntity.deliveryCost} EGP` : 'N/A'}</span>
                )}
              </div>

              <div className="detail-item">
                <span className="label">Shown Delivery Cost (EGP):</span>
                {isEditingPackage ? (
                  <input
                    type="number"
                    step="0.01"
                    value={editingPackageData.shownDeliveryCost || selectedEntity.shownDeliveryCost || ''}
                    onChange={(e) => setEditingPackageData(prev => ({ ...prev, shownDeliveryCost: e.target.value }))}
                    style={{ padding: '6px 10px', borderRadius: 4, border: '1px solid #ccc', fontSize: '1em', width: '120px' }}
                  />
                ) : (
                  <span>{selectedEntity.shownDeliveryCost ? `${selectedEntity.shownDeliveryCost} EGP` : 'N/A'}</span>
                )}
              </div>

              <div className="detail-item">
                <span className="label">Payment Method:</span>
                {isEditingPackage ? (
                  <select
                    value={editingPackageData.paymentMethod || selectedEntity.paymentMethod || ''}
                    onChange={(e) => setEditingPackageData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                    style={{ padding: '6px 10px', borderRadius: 4, border: '1px solid #ccc', fontSize: '1em' }}
                  >
                    <option value="">Select payment method</option>
                    <option value="CASH">Cash</option>
                    <option value="VISA">Visa</option>
                  </select>
                ) : (
                  <span>{selectedEntity.paymentMethod ? String(selectedEntity.paymentMethod).toUpperCase() : 'N/A'}</span>
                )}
              </div>

              <div className="detail-item">
                <span className="label">Payment Status:</span>
                {isEditingPackage ? (
                  <select
                    value={editingPackageData.isPaid ? 'true' : 'false'}
                    onChange={(e) => setEditingPackageData(prev => ({ ...prev, isPaid: e.target.value === 'true' }))}
                    style={{ padding: '6px 10px', borderRadius: 4, border: '1px solid #ccc', fontSize: '1em' }}
                  >
                    <option value="false">Unpaid</option>
                    <option value="true">Paid</option>
                  </select>
                ) : (
                  <span className={`payment-status ${selectedEntity.isPaid ? 'paid' : 'unpaid'}`}>
                    {selectedEntity.isPaid ? 'Paid' : 'Unpaid'}
                  </span>
                )}
              </div>
              <div className="detail-item">
                <span className="label">Amount Paid (EGP):</span>
                <span>{selectedEntity.paidAmount ? `${selectedEntity.paidAmount} EGP` : 'N/A'}</span>
              </div>

              {selectedEntity.paymentNotes !== null && selectedEntity.paymentNotes !== undefined && selectedEntity.paymentNotes !== '' && (
              <div className="detail-item full-width">
                <span className="label">Payment Notes:</span>
                {isEditingPackage ? (
                  <textarea
                    value={editingPackageData.paymentNotes || selectedEntity.paymentNotes || ''}
                    onChange={(e) => setEditingPackageData(prev => ({ ...prev, paymentNotes: e.target.value }))}
                    style={{ width: '100%', padding: '8px', borderRadius: 4, border: '1px solid #ccc', fontSize: '1em', minHeight: '60px' }}
                    placeholder="Payment notes"
                  />
                ) : (
                  <span>{selectedEntity.paymentNotes || 'N/A'}</span>
                )}
              </div>
              )}

              {selectedEntity.rejectionShippingPaidAmount !== undefined && selectedEntity.rejectionShippingPaidAmount !== null && selectedEntity.rejectionShippingPaidAmount > 0 && (
                <div className="detail-item">
                  <span className="label">Rejection Shipping Fees Paid:</span>
                  <span>{parseFloat(selectedEntity.rejectionShippingPaidAmount || 0).toFixed(2)} EGP</span>
                </div>
              )}
              {selectedEntity.shopNotes !== null && selectedEntity.shopNotes !== undefined && selectedEntity.shopNotes !== '' && (
                <div className="detail-item full-width">
                  <span className="label">Shop Notes:</span>
                  <span>{selectedEntity.shopNotes}</span>
                </div>
              )}
              {/* Pickup address */}
              <div className="detail-item full-width">
                <span className="label">Pickup Details:</span>
                <div className="nested-details">
                  <div className="nested-detail">
                    <span className="nested-label">Contact Name:</span>
                    {isEditingPackage ? (
                      <input
                        type="text"
                        value={editingPackageData.pickupContactName || selectedEntity.pickupContactName || ''}
                        onChange={(e) => setEditingPackageData(prev => ({ ...prev, pickupContactName: e.target.value }))}
                        style={{ padding: '6px 10px', borderRadius: 4, border: '1px solid #ccc', fontSize: '1em', width: '200px' }}
                        placeholder="Contact name"
                      />
                    ) : (
                      <span>{selectedEntity.pickupContactName || 'N/A'}</span>
                    )}
                  </div>
                  <div className="nested-detail">
                    <span className="nested-label">Contact Phone:</span>
                    {isEditingPackage ? (
                      <input
                        type="text"
                        value={editingPackageData.pickupContactPhone || selectedEntity.pickupContactPhone || ''}
                        onChange={(e) => setEditingPackageData(prev => ({ ...prev, pickupContactPhone: e.target.value }))}
                        style={{ padding: '6px 10px', borderRadius: 4, border: '1px solid #ccc', fontSize: '1em', width: '200px' }}
                        placeholder="Contact phone"
                      />
                    ) : (
                      <span>{selectedEntity.pickupContactPhone || 'N/A'}</span>
                    )}
                  </div>
                  <div className="nested-detail">
                    <span className="nested-label">Address:</span>
                    {isEditingPackage ? (
                      <textarea
                        value={editingPackageData.pickupAddress || selectedEntity.pickupAddress || ''}
                        onChange={(e) => setEditingPackageData(prev => ({ ...prev, pickupAddress: e.target.value }))}
                        style={{ padding: '6px 10px', borderRadius: 4, border: '1px solid #ccc', fontSize: '1em', width: '100%', minHeight: '60px' }}
                        placeholder="Pickup address"
                      />
                    ) : (
                      <span>{selectedEntity.pickupAddress || 'N/A'}</span>
                    )}
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
              {/* Items Section */}
              <div className="detail-item full-width" style={{ marginTop: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <span className="label">Items</span>
                  {isEditingPackage && (
                    <button
                      className="btn btn-primary"
                      onClick={addItemToPackage}
                      style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.9em', padding: '6px 12px' }}
                    >
                      <FontAwesomeIcon icon={faPlus} />
                      Add Item
                    </button>
                  )}
                </div>
                
                {isEditingPackage ? (
                  <div style={{ backgroundColor: '#f9f9fa', padding: '1rem', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
                    {(editingPackageData.items || []).map((item, index) => (
                      <div key={item.id || index} style={{ border: '1px solid #ddd', padding: '1rem', marginBottom: '0.5rem', borderRadius: '4px', backgroundColor: 'white' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: '1rem', alignItems: 'center' }}>
                          <div>
                            <label style={{ fontSize: '0.9em', color: '#666', display: 'block', marginBottom: '4px' }}>Description:</label>
                            <input
                              type="text"
                              value={item.description}
                              onChange={(e) => updateItemInPackage(index, 'description', e.target.value)}
                              style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid #ccc', fontSize: '0.9em' }}
                              placeholder="Item description"
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: '0.9em', color: '#666', display: 'block', marginBottom: '4px' }}>Quantity:</label>
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateItemInPackage(index, 'quantity', parseInt(e.target.value) || 1)}
                              style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid #ccc', fontSize: '0.9em' }}
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: '0.9em', color: '#666', display: 'block', marginBottom: '4px' }}>COD Per Unit (EGP):</label>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={item.codPerUnit}
                              onChange={(e) => updateItemInPackage(index, 'codPerUnit', parseFloat(e.target.value) || 0)}
                              style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid #ccc', fontSize: '0.9em' }}
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: '0.9em', color: '#666', display: 'block', marginBottom: '4px' }}>Total COD:</label>
                            <span style={{ fontWeight: 'bold', color: '#007bff' }}>
                              EGP {((item.quantity || 1) * (item.codPerUnit || 0)).toFixed(2)}
                            </span>
                          </div>
                          <div>
                            <button
                              className="btn btn-danger"
                              onClick={() => removeItemFromPackage(index)}
                              style={{ padding: '6px 8px', fontSize: '0.8em' }}
                              title="Remove item"
                            >
                              <FontAwesomeIcon icon={faTrash} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    {(editingPackageData.items || []).length === 0 && (
                      <div style={{ textAlign: 'center', padding: '2rem', color: '#666', fontStyle: 'italic' }}>
                        No items added. Click "Add Item" to add items to this package.
                      </div>
                    )}
                  </div>
                ) : (
                  selectedEntity.Items && selectedEntity.Items.length > 0 ? (
                    <div style={{ backgroundColor: '#f9f9fa', padding: '1rem', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
                      {selectedEntity.Items.map((item, index) => (
                        <div key={item.id} style={{ border: '1px solid #ddd', padding: '0.75rem', marginBottom: '0.5rem', borderRadius: '4px', backgroundColor: 'white' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '1rem', alignItems: 'center' }}>
                            <div><strong>Description:</strong> {item.description}</div>
                            <div><strong>Quantity:</strong> {item.quantity}</div>
                            <div><strong>COD Per Unit:</strong> EGP {item.codAmount && item.quantity ? (item.codAmount / item.quantity).toFixed(2) : '0.00'}</div>
                            <div><strong>Total COD:</strong> EGP {parseFloat(item.codAmount || 0).toFixed(2)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '2rem', color: '#666', fontStyle: 'italic' }}>
                      No items in this package.
                    </div>
                  )
                )}
              </div>
              {selectedEntity && Array.isArray(selectedEntity.deliveredItems) && selectedEntity.deliveredItems.length > 0 && (
                <div className="detail-item full-width" style={{ marginTop: 8 }}>
                  <span className="label">Delivered Items</span>
                  <ul style={{ margin: '6px 0 0 18px', padding: 0 }}>
                    {selectedEntity.deliveredItems.map((di, idx) => {
                      const match = (selectedEntity.Items || []).find(it => String(it.id) === String(di.itemId));
                      const label = match?.description || `Item ${di.itemId}`;
                      return (
                        <li key={`delivered-under-items-${idx}`}>
                          {label}: delivered qty {di.deliveredQuantity}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {Array.isArray(selectedEntity.Items) && selectedEntity.Items.length > 0 && Array.isArray(selectedEntity.deliveredItems) && selectedEntity.deliveredItems.length > 0 && (
                (() => {
                  const dmap = new Map(selectedEntity.deliveredItems.map(di => [di.itemId, parseInt(di.deliveredQuantity, 10) || 0]));
                  const remaining = selectedEntity.Items
                    .map(it => {
                      const total = parseInt(it.quantity, 10) || 0;
                      const delivered = dmap.get(it.id) || 0;
                      const remain = Math.max(0, total - delivered);
                      return { id: it.id, description: it.description, quantity: remain };
                    })
                    .filter(r => r.quantity > 0);
                  return remaining.length > 0 ? (
                    <div className="detail-item full-width">
                      <span className="label">Returning Items</span>
                      <div style={{ 
                        backgroundColor: '#f8f9fa', 
                        padding: '1rem',
                        border: '1px solid #e0e0e0',
                        marginTop: '0.5rem'
                      }}>
                        {remaining.map((r, idx) => (
                          <div key={`ret-${idx}`} style={{ 
                            border: '1px solid #ddd', 
                            padding: '0.75rem', 
                            marginBottom: '0.5rem', 
                            backgroundColor: 'white'
                          }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '0.5fr 1fr', alignItems: 'center' }}>
                              <div>
                                <strong>Description:</strong> {r.description || `Item ${r.id}`}
                              </div>
                              <div>
                                <strong>Returning Quantity:</strong> {r.quantity}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null;
                })()
              )}

              {/* Delivery address */}
              <div className="detail-item full-width">
                <span className="label">Delivery Details:</span>
                <div className="nested-details">
                  <div className="nested-detail">
                    <span className="nested-label">Contact Name:</span>
                    {isEditingPackage ? (
                      <input
                        type="text"
                        value={editingPackageData.deliveryContactName || selectedEntity.deliveryContactName || ''}
                        onChange={(e) => setEditingPackageData(prev => ({ ...prev, deliveryContactName: e.target.value }))}
                        style={{ padding: '6px 10px', borderRadius: 4, border: '1px solid #ccc', fontSize: '1em', width: '200px' }}
                        placeholder="Contact name"
                      />
                    ) : (
                      <span>{selectedEntity.deliveryContactName || 'N/A'}</span>
                    )}
                  </div>
                  <div className="nested-detail">
                    <span className="nested-label">Contact Phone:</span>
                    {isEditingPackage ? (
                      <input
                        type="text"
                        value={editingPackageData.deliveryContactPhone || selectedEntity.deliveryContactPhone || ''}
                        onChange={(e) => setEditingPackageData(prev => ({ ...prev, deliveryContactPhone: e.target.value }))}
                        style={{ padding: '6px 10px', borderRadius: 4, border: '1px solid #ccc', fontSize: '1em', width: '200px' }}
                        placeholder="Contact phone"
                      />
                    ) : (
                      <span>{selectedEntity.deliveryContactPhone || 'N/A'}</span>
                    )}
                  </div>
                  <div className="nested-detail">
                    <span className="nested-label">Address:</span>
                    {isEditingPackage ? (
                      <textarea
                        value={editingPackageData.deliveryAddress || selectedEntity.deliveryAddress || ''}
                        onChange={(e) => setEditingPackageData(prev => ({ ...prev, deliveryAddress: e.target.value }))}
                        style={{ padding: '6px 10px', borderRadius: 4, border: '1px solid #ccc', fontSize: '1em', width: '100%', minHeight: '60px' }}
                        placeholder="Delivery address"
                      />
                    ) : (
                      <span>{selectedEntity.deliveryAddress || 'N/A'}</span>
                    )}
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
              
              {(selectedEntity.returnRefundAmount !== null && selectedEntity.returnRefundAmount !== undefined && selectedEntity.returnRefundAmount > 0) && (
                <div className="detail-item">
                  <span className="label">Return Refund:</span>
                  <span>EGP {parseFloat(selectedEntity.returnRefundAmount || 0).toFixed(2)}</span>
                </div>
              )}
              {/* Exchange Details */}
              {(selectedEntity?.type === 'exchange' || (selectedEntity?.status || '').startsWith('exchange-')) && selectedEntity?.exchangeDetails && (
                <div className="detail-item full-width">
                  <span className="label">Exchange Details:</span>
                  <div className="nested-details">
                    <div className="nested-detail">
                      <span className="nested-label">Take from customer:</span>
                      {Array.isArray(selectedEntity.exchangeDetails.takeItems) && selectedEntity.exchangeDetails.takeItems.length > 0 ? (
                        <ul style={{ margin: 0, paddingLeft: 18 }}>
                          {selectedEntity.exchangeDetails.takeItems.map((it, idx) => (
                            <li key={`adm-xtake-${idx}`}>{(it.description || '-')} x {(parseInt(it.quantity) || 0)}</li>
                          ))}
                        </ul>
                      ) : (
                        <span style={{ color: '#666', marginLeft: 6 }}>None</span>
                      )}
                    </div>
                    <div className="nested-detail">
                      <span className="nested-label">Give to customer:</span>
                      {Array.isArray(selectedEntity.exchangeDetails.giveItems) && selectedEntity.exchangeDetails.giveItems.length > 0 ? (
                        <ul style={{ margin: 0, paddingLeft: 18 }}>
                          {selectedEntity.exchangeDetails.giveItems.map((it, idx) => (
                            <li key={`adm-xgive-${idx}`}>{(it.description || '-')} x {(parseInt(it.quantity) || 0)}</li>
                          ))}
                        </ul>
                      ) : (
                        <span style={{ color: '#666', marginLeft: 6 }}>None</span>
                      )}
                    </div>
                  </div>
                  {selectedEntity.exchangeDetails.cashDelta && (
                    <div className="nested-detail">
                      <span className="nested-label">Money:</span>
                      <span style={{ marginLeft: 6 }}>
                        {(selectedEntity.exchangeDetails.cashDelta.type === 'take' ? 'Take from customer' : 'Give to customer')} · EGP {parseFloat(selectedEntity.exchangeDetails.cashDelta.amount || 0).toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          {isPackage && isMobile && (
            <div className="package-details-mobile">
              <div className="summary-card">
                <div className="summary-title">
                  <div className="tracking">#{selectedEntity.trackingNumber}</div>
                  <div className={`chip status ${selectedEntity.status}`}>{selectedEntity.status?.split('-').join(' ')}</div>
                </div>
                <div className="summary-grid">
                  <div className="pair"><span className="k">Shop</span><span className="v">{selectedEntity.shop?.businessName || 'N/A'}</span></div>
                  <div className="pair"><span className="k">COD</span><span className="v">EGP {parseFloat(selectedEntity.codAmount || 0).toFixed(2)}</span></div>
                  <div className="pair"><span className="k">Payment</span><span className={`v chip payment ${selectedEntity.isPaid ? 'paid' : 'unpaid'}`}>{selectedEntity.isPaid ? 'Paid' : 'Unpaid'}</span></div>
                  <div className="pair"><span className="k">Driver</span><span className="v">{(() => { const d = drivers.find(dr => dr.driverId === selectedEntity.driverId || dr.id === selectedEntity.driverId); return d ? d.name : 'Unassigned'; })()}</span></div>
                  <div className="pair"><span className="k">Type</span><span className="v">{selectedEntity.type || 'new'}</span></div>
                  <div className="pair"><span className="k">Created</span><span className="v">{selectedEntity.createdAt ? new Date(selectedEntity.createdAt).toLocaleDateString() : 'N/A'}</span></div>
                </div>
                <div className="summary-quick">
                  <button className="btn btn-secondary" onClick={() => copyToClipboard(selectedEntity.trackingNumber)}>Copy ID</button>
                  <button className="btn btn-secondary" onClick={() => shareTracking(selectedEntity)}>Share</button>
                </div>
                <div className="summary-actions">
                  {!isEditingPackage ? (
                    <>
                      <button className="btn btn-primary" onClick={() => startEditingPackage(selectedEntity)}>Edit</button>
                      <button className="btn btn-danger" onClick={() => deletePackage(selectedEntity)}>Delete</button>
                    </>
                  ) : (
                    <>
                      <button className="btn btn-success" onClick={savePackageEdits} disabled={savingPackage}>{savingPackage ? 'Saving...' : 'Save'}</button>
                      <button className="btn btn-secondary" onClick={cancelPackageEditing} disabled={savingPackage}>Cancel</button>
                    </>
                  )}
                </div>
              </div>

              <details className="m-section" open>
                <summary>Delivery Details</summary>
                <div className="section-body">
                  <div className="pair"><span className="k">Contact</span><span className="v">{selectedEntity.deliveryContactName || 'N/A'}</span></div>
                  <div className="pair"><span className="k">Phone</span><span className="v">{selectedEntity.deliveryContactPhone ? (<a className="link" href={toTel(selectedEntity.deliveryContactPhone)}>{selectedEntity.deliveryContactPhone}</a>) : 'N/A'}</span></div>
                  <div className="pair multiline"><span className="k">Address</span><span className="v">{selectedEntity.deliveryAddress || 'N/A'}</span></div>
                  <div className="actions-inline">
                    <button className="btn btn-secondary" onClick={() => copyToClipboard(selectedEntity.deliveryAddress || '')}>Copy Address</button>
                  </div>
                  <div className="pair"><span className="k">Delivery Time</span><span className="v">{selectedEntity.actualDeliveryTime ? selectedEntity.actualDeliveryTime : 'Not delivered yet'}</span></div>
                </div>
              </details>

              <details className="m-section">
                <summary>Pickup Details</summary>
                <div className="section-body">
                  <div className="pair"><span className="k">Contact</span><span className="v">{selectedEntity.pickupContactName || 'N/A'}</span></div>
                  <div className="pair"><span className="k">Phone</span><span className="v">{selectedEntity.pickupContactPhone ? (<a className="link" href={toTel(selectedEntity.pickupContactPhone)}>{selectedEntity.pickupContactPhone}</a>) : 'N/A'}</span></div>
                  <div className="pair multiline"><span className="k">Address</span><span className="v">{selectedEntity.pickupAddress || 'N/A'}</span></div>
                  <div className="actions-inline">
                    <button className="btn btn-secondary" onClick={() => copyToClipboard(selectedEntity.pickupAddress || '')}>Copy Address</button>
                  </div>
                  <div className="pair"><span className="k">Picked up</span><span className="v">{selectedEntity.actualPickupTime ? selectedEntity.actualPickupTime : 'Not picked up yet'}</span></div>
                </div>
              </details>

              <details className="m-section" open>
                <summary>Items {Array.isArray(selectedEntity.Items) ? `(${selectedEntity.Items.length})` : ''}</summary>
                <div className="section-body">
                  {Array.isArray(selectedEntity.Items) && selectedEntity.Items.length > 0 ? (
                    <div className="item-list">
                      {selectedEntity.Items.map((item) => (
                        <div key={item.id} className="item-card">
                          <div className="line"><span className="k">Description</span><span className="v">{item.description || '-'}</span></div>
                          <div className="line"><span className="k">Qty</span><span className="v">{item.quantity || 0}</span></div>
                          <div className="line"><span className="k">COD/unit</span><span className="v">EGP {item.codAmount && item.quantity ? (item.codAmount / item.quantity).toFixed(2) : '0.00'}</span></div>
                          <div className="line"><span className="k">Total COD</span><span className="v">EGP {parseFloat(item.codAmount || 0).toFixed(2)}</span></div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="empty">No items in this package.</div>
                  )}
                  {Array.isArray(selectedEntity.deliveredItems) && selectedEntity.deliveredItems.length > 0 && (
                    <div className="sub-section">
                      <div className="sub-title">Delivered Items</div>
                      <ul>
                        {selectedEntity.deliveredItems.map((di, idx) => {
                          const match = (selectedEntity.Items || []).find(it => String(it.id) === String(di.itemId));
                          const label = match?.description || `Item ${di.itemId}`;
                          return (
                            <li key={`delivered-mobile-${idx}`}>{label}: {di.deliveredQuantity}</li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                </div>
              </details>

              <details className="m-section">
                <summary>Payment & Costs</summary>
                <div className="section-body">
                  <div className="pair"><span className="k">Payment</span><span className={`v chip payment ${selectedEntity.isPaid ? 'paid' : 'unpaid'}`}>{selectedEntity.isPaid ? 'Paid' : 'Unpaid'}</span></div>
                  <div className="pair"><span className="k">Method</span><span className="v">{selectedEntity.paymentMethod ? String(selectedEntity.paymentMethod).toUpperCase() : 'N/A'}</span></div>
                  <div className="pair"><span className="k">COD</span><span className="v">EGP {parseFloat(selectedEntity.codAmount || 0).toFixed(2)}</span></div>
                  <div className="pair"><span className="k">Delivery Cost</span><span className="v">EGP {parseFloat(selectedEntity.deliveryCost || 0).toFixed(2)}</span></div>
                  {selectedEntity.shownDeliveryCost !== undefined && (
                    <div className="pair"><span className="k">Shown Cost</span><span className="v">EGP {parseFloat(selectedEntity.shownDeliveryCost || 0).toFixed(2)}</span></div>
                  )}
                  {selectedEntity.paidAmount !== undefined && (
                    <div className="pair"><span className="k">Amount Paid</span><span className="v">EGP {parseFloat(selectedEntity.paidAmount || 0).toFixed(2)}</span></div>
                  )}
                  {selectedEntity.rejectionShippingPaidAmount > 0 && (
                    <div className="pair"><span className="k">Rejection Shipping Paid</span><span className="v">EGP {parseFloat(selectedEntity.rejectionShippingPaidAmount || 0).toFixed(2)}</span></div>
                  )}
                  {selectedEntity.paymentNotes && (
                    <div className="pair multiline"><span className="k">Payment Notes</span><span className="v">{selectedEntity.paymentNotes}</span></div>
                  )}
                </div>
              </details>

              {selectedEntity && (Array.isArray(selectedEntity.notes) || typeof selectedEntity.notes === 'string') && (
                <details className="m-section">
                  <summary>Notes</summary>
                  <div className="section-body">
                    <div className="notes-log-list">
                      {(() => {
                        let notesArr = [];
                        if (Array.isArray(selectedEntity?.notes)) notesArr = selectedEntity.notes;
                        else if (typeof selectedEntity?.notes === 'string') { try { notesArr = JSON.parse(selectedEntity.notes); } catch { notesArr = []; } }
                        notesArr = notesArr.filter(n => n && typeof n.text === 'string' && n.text.trim()).sort((a,b)=>new Date(a.createdAt||0)-new Date(b.createdAt||0));
                        return notesArr.length > 0 ? (
                          notesArr.map((n, idx) => (
                            <div key={`mnote-${idx}`} className="notes-log-entry">
                              <div className="meta">{n.createdAt ? new Date(n.createdAt).toLocaleString() : 'Unknown date'}</div>
                              <div className="text">{n.text}</div>
                            </div>
                          ))
                        ) : (
                          <div className="empty">No notes yet.</div>
                        );
                      })()}
                    </div>
                    <div className="add-note">
                      <textarea rows={2} value={editingNotes} onChange={e=>setEditingNotes(e.target.value)} placeholder="Add a note for this package..."></textarea>
                      <button className="btn btn-primary" disabled={notesSaving || !editingNotes.trim()} onClick={async ()=>{
                        if (!editingNotes.trim()) return; setNotesSaving(true); setNotesError(null);
                        try { const res = await packageService.updatePackageNotes(selectedEntity.id, editingNotes); setSelectedEntity(prev=>({...prev, notes: res.data.notes})); setEditingNotes(''); }
                        catch(err){ setNotesError(err.response?.data?.message || 'Failed to save note.'); }
                        finally{ setNotesSaving(false); }
                      }}>{notesSaving ? 'Saving...' : 'Add Note'}</button>
                      {notesError && <div className="error">{notesError}</div>}
                    </div>
                  </div>
                </details>
              )}

              {(selectedEntity?.type === 'exchange' || (selectedEntity?.status || '').startsWith('exchange-')) && selectedEntity?.exchangeDetails && (
                <details className="m-section">
                  <summary>Exchange Details</summary>
                  <div className="section-body">
                    <div className="sub-section">
                      <div className="sub-title">Take from customer</div>
                      {Array.isArray(selectedEntity.exchangeDetails.takeItems) && selectedEntity.exchangeDetails.takeItems.length > 0 ? (
                        <ul>{selectedEntity.exchangeDetails.takeItems.map((it,idx)=>(<li key={`xtake-m-${idx}`}>{(it.description||'-')} x {(parseInt(it.quantity)||0)}</li>))}</ul>
                      ) : (<div className="empty">None</div>)}
                    </div>
                    <div className="sub-section">
                      <div className="sub-title">Give to customer</div>
                      {Array.isArray(selectedEntity.exchangeDetails.giveItems) && selectedEntity.exchangeDetails.giveItems.length > 0 ? (
                        <ul>{selectedEntity.exchangeDetails.giveItems.map((it,idx)=>(<li key={`xgive-m-${idx}`}>{(it.description||'-')} x {(parseInt(it.quantity)||0)}</li>))}</ul>
                      ) : (<div className="empty">None</div>)}
                    </div>
                    {selectedEntity.exchangeDetails.cashDelta && (
                      <div className="pair"><span className="k">Money</span><span className="v">{(selectedEntity.exchangeDetails.cashDelta.type === 'take' ? 'Take from customer' : 'Give to customer')} · EGP {parseFloat(selectedEntity.exchangeDetails.cashDelta.amount || 0).toFixed(2)}</span></div>
                    )}
                  </div>
                </details>
              )}
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
                  paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))',
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
                {!['cancelled','cancelled-awaiting-return', 'cancelled-returned', 'rejected', 'rejected-returned', 'delivered', 'awaiting_schedule', 'awaiting_pickup', 'scheduled_for_pickup'].includes(selectedEntity.status) && (
                  <button
                    className="btn btn-primary"
                    disabled={forwardingPackageId === selectedEntity.id}
                    onClick={() => {
                      // ensure latest package details and open flow
                      handleForwardFromDetails(selectedEntity);
                    }}
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
                {!['cancelled', 'cancelled-awaiting-return', 'cancelled-returned', 'rejected', 'rejected-returned', 'delivered', 'awaiting_schedule', 'awaiting_pickup', 'scheduled_for_pickup', 'rejected-awaiting-return'].includes(selectedEntity.status) && (
                  <button
                    className="btn btn-danger"
                    onClick={() => {
                      setPackageToAction(selectedEntity);
                      setRejectShippingPaidAmount('');
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
    const invalid = (rejectShippingPaidAmount === '' || isNaN(parseFloat(rejectShippingPaidAmount)) || parseFloat(rejectShippingPaidAmount) < 0);
    return (
      <div className="confirmation-overlay">
        <div className="confirmation-dialog warning-dialog">
          <h3>Reject Package</h3>
          <p>Enter the shipping fees paid by the customer (if any). This will be saved with the rejection.</p>
          <div style={{ margin: '12px 0' }}>
            <input
              type="number"
              step="0.01"
              min="0"
              value={rejectShippingPaidAmount}
              onChange={(e) => setRejectShippingPaidAmount(e.target.value)}
              placeholder="Amount paid by customer (EGP)"
              style={{ width: '100%', padding: '8px', borderRadius: 6, border: '1px solid #ccc' }}
            />
            <div style={{ color: '#555', fontSize: 12, marginTop: 6 }}>
              Max allowed: EGP {(parseFloat(packageToAction.deliveryCost || 0) || 0).toFixed(2)}
            </div>
            {invalid && (
              <div style={{ color: '#c62828', fontSize: 12, marginTop: 6 }}>
                Please enter a valid non-negative amount (0 allowed if none was paid).
              </div>
            )}
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', marginBottom: 6 }}>Payment Method</label>
            <select
              value={adminRejectionPaymentMethod}
              onChange={(e) => setAdminRejectionPaymentMethod(e.target.value)}
              style={{ width: '100%', padding: '8px', borderRadius: 6, border: '1px solid #ccc' }}
            >
              <option value="CASH">CASH</option>
              <option value="VISA">VISA</option>
            </select>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', marginBottom: 6 }}>Reduce shipping fees for this rejection?</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" className={`btn ${adminRejectionDeductShipping ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setAdminRejectionDeductShipping(true)}>Yes</button>
              <button type="button" className={`btn ${!adminRejectionDeductShipping ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setAdminRejectionDeductShipping(false)}>No</button>
            </div>
          </div>
          <div className="confirmation-buttons">
            <button 
              className="btn-secondary"
              onClick={() => {
                setShowRejectPackageModal(false);
                setPackageToAction(null);
                setRejectShippingPaidAmount('');
                setAdminRejectionPaymentMethod('CASH');
                setAdminRejectionDeductShipping(true);
              }}
            >
              Cancel
            </button>
            <button 
              className="btn-primary danger"
              onClick={() => rejectPackage(packageToAction)}
              disabled={invalid}
            >
              Confirm Reject
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
    setPickupStatusUpdating(prev => ({ ...prev, [pickupId]: true }));
    try {
      await adminService.markPickupAsPickedUp(pickupId);
      
      // Refresh pickups data
      const pickupsResponse = await adminService.getAllPickups();
      setPickups(pickupsResponse.data || []);
      
      // Refresh packages data
      await fetchPackages(1, searchTerm);
      
      setStatusMessage({ type: 'success', text: 'Pickup marked as picked up successfully!' });
    } catch (error) {
      console.error('Error marking pickup as picked up:', error);
      setStatusMessage({ 
        type: 'error', 
        text: `Error: ${error.response?.data?.message || 'Failed to mark pickup as picked up'}` 
      });
    }
    finally {
      setPickupStatusUpdating(prev => ({ ...prev, [pickupId]: false }));
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
        const packagesResponse = await adminService.getPackages({ page: 1, limit: 25 });
        if (packagesTab === 'ready-to-assign') {
          // Match the Ready to Assign 'All' filter: Pending, Return Requested, Exchange Requested (exchange-awaiting-schedule)
          const readyToAssignPackages = (packagesResponse.data?.packages || packagesResponse.data || []).filter(pkg =>
            pkg.status === 'pending' ||
            pkg.status === 'return-requested' ||
            pkg.status === 'exchange-in-process'
          );
          setPackages(readyToAssignPackages);
        } else {
          const filteredPackages = (packagesResponse.data?.packages || packagesResponse.data || []);
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

  // Bulk forward statuses for selected packages (skip those that would require delivery modal)
  const handleBulkForward = async () => {
    if (selectedPackages.length === 0) return;
    const statusFlow = ['assigned', 'pickedup', 'in-transit', 'delivered'];
    const selected = packages.filter(p => selectedPackages.includes(p.id));
    const toForward = selected.filter(p => {
      const idx = statusFlow.indexOf(p.status);
      return idx !== -1 && idx < statusFlow.length - 1 && statusFlow[idx + 1] !== 'delivered';
    }).map(p => ({ id: p.id, next: statusFlow[statusFlow.indexOf(p.status) + 1] }));

    if (toForward.length === 0) {
      setStatusMessage({ type: 'info', text: 'Selected packages require delivery completion. Please forward them individually.' });
      return;
    }

    try {
      // Optimistic UI update
      setPackages(prev => prev.map(p => {
        const f = toForward.find(tp => tp.id === p.id);
        return f ? { ...p, status: f.next } : p;
      }));

      for (const fwd of toForward) {
        try {
          await packageService.updatePackageStatus(fwd.id, { status: fwd.next });
          // small delay to avoid DB lock contention
          await new Promise(r => setTimeout(r, 200));
        } catch (e) {
          console.error('Failed to forward package', fwd.id, e);
        }
      }
      // Refresh list
      await fetchPackagesWithFilters(1, searchTerm, packageStatusFilter, packageShopFilter);
      setStatusMessage({ type: 'success', text: `Forwarded ${toForward.length} package(s).` });
    } catch (e) {
      console.error('Bulk forward failed', e);
      setStatusMessage({ type: 'error', text: 'Failed to bulk forward some packages. Please try again.' });
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
      <div className={`modal-overlay ${showBulkAssignModal ? 'show' : ''}`} onClick={() => setShowBulkAssignModal(false)}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
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

              setStatusMessage({ type: 'success', text: `Settled EGP ${amount.toFixed(2)} with shop successfully` });
              
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
    // Reset to first page when filters change
    setMoneyPage(1);
  };

  // Add function to fetch money transactions with filters
  const fetchMoneyTransactions = async (page = moneyPage) => {
    try {
      const params = {
        ...moneyFilters,
        page,
        limit: 25,
        search: searchTerm
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
      setMoneyPage(res.data.currentPage || page);
      setMoneyTotalPages(res.data.totalPages || 1);
      setMoneyTotal(res.data.total || (res.data.transactions || []).length);
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
      fetchMoneyTransactions(1);
    }
  }, [activeTab, moneyFilters, searchTerm]);

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
              <option value="payout">Payout</option>
            </select>
          </div>
          </div>

        {/* Transactions table */}
        <div className="money-table-wrapper">
          <table className="admin-table money-table">
            <thead>
              <tr>
                <th onClick={() => handleMoneyFilterChange('sortBy', 'createdAt')}>Date {renderSortIcon('createdAt')}</th>
                <th>Shop</th>
                <th>Description</th>
                <th onClick={() => handleMoneyFilterChange('sortBy', 'attribute')}>Attribute {renderSortIcon('attribute')}</th>
                <th onClick={() => handleMoneyFilterChange('sortBy', 'changeType')}>Type {renderSortIcon('changeType')}</th>
                <th onClick={() => handleMoneyFilterChange('sortBy', 'amount')}>Amount {renderSortIcon('amount')}</th>
                <th>Current Amount</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.length === 0 ? (
                <tr><td colSpan="6" style={{ textAlign: 'center' }}>No transactions found.</td></tr>
              ) : (
                filteredTransactions.map(tx => (
                <tr key={tx.id}>
                  <td data-label="Date">{new Date(tx.createdAt).toLocaleString()}</td>
                    <td data-label="Shop">{tx.Shop?.businessName || 'N/A'}</td>
                    <td data-label="Description">{tx.description}</td>
                  <td data-label="Attribute">{tx.attribute}</td>
                  <td data-label="Type">
                    <span className={`change-type ${tx.changeType}`}>
                      {tx.changeType}
                    </span>
                  </td>
                    <td data-label="Amount" className={`financial-cell ${tx.changeType}`}>
                      EGP {Number(tx.amount || 0).toFixed(2)}
                    </td>
                    <td data-label="Current Amount">
                      {tx.attribute === 'ToCollect' || tx.attribute === 'TotalCollected' ? (
                        tx.currentAmount != null ? `EGP ${Number(tx.currentAmount).toFixed(2)}` : '-'
                      ) : (
                        '-'
                      )}
                    </td>
                </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        <div className="money-pagination" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 16, padding: 8 }}>
          <button
            className="btn-secondary"
            onClick={() => { if (moneyPage > 1) fetchMoneyTransactions(moneyPage - 1); }}
            disabled={moneyPage <= 1 || loading}
            title="Previous page"
          >
            ◀ Prev
          </button>
          <span style={{ whiteSpace: 'nowrap' }}>Page {moneyPage} of {moneyTotalPages}</span>
          <button
            className="btn-secondary"
            onClick={() => { if (moneyPage < moneyTotalPages) fetchMoneyTransactions(moneyPage + 1); }}
            disabled={moneyPage >= moneyTotalPages || loading}
            title="Next page"
          >
            Next ▶
          </button>
          <span style={{ marginLeft: 8, color: '#666' }}>Total: {moneyTotal}</span>
        </div>
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
      let newStatus = '';
      let moneyTransactionNeeded = false;
      // Determine the new status based on current status
      switch (pkg.status) {
        case 'cancelled-awaiting-return':
          newStatus = 'cancelled-returned';
          moneyTransactionNeeded = true;
          break;
        case 'rejected-awaiting-return':
          newStatus = 'rejected-returned';
          moneyTransactionNeeded = true;
          break;
        case 'delivered-awaiting-return':
          newStatus = 'delivered-returned';
          moneyTransactionNeeded = true;
          break;
        default:
          console.error('Unknown status for return:', pkg.status);
          return;
      }
      await packageService.updatePackageStatus(pkg.id, { status: newStatus });
      setPackages(prev => prev.map(p => p.id === pkg.id ? { ...p, status: newStatus } : p));
      setStatusMessage({
        type: 'success',
        text: `Package ${pkg.trackingNumber} has been marked as returned.`
      });
      fetchPackagesWithMainTab(packagesTab, packagesSubTab, packagePage);
      // Optionally, fetch and show money transaction details if needed
      if (moneyTransactionNeeded) {
        // You can add logic here to fetch and display money transaction details or confirmation
        // For now, just show a message
        setStatusMessage({
          type: 'success',
          text: `Money transactions for package ${pkg.trackingNumber} have been processed.`
        });
      }
    } catch (error) {
      console.error('Error marking package as returned:', error);
      setStatusMessage({
        type: 'error',
        text: `Error marking package as returned: ${error.response?.data?.message || error.message || 'Unknown error'}`
      });
    }
  };

  // Add fetchPackages function with server-side filtering
  const fetchPackages = async (page = packagePage, search = undefined) => {
    return fetchPackagesWithFilters(page, search, packageStatusFilter, packageShopFilter);
  };

  // Add fetchPackagesWithFilters function that accepts filter parameters directly
  const fetchPackagesWithFilters = async (page = packagePage, search = undefined, statusFilter = undefined, shopFilter = packageShopFilter) => {
    try {
      setLoading(true);
      const params = { page, limit: 25 };
      
      // Add search parameter
      if (typeof search === 'string' && search.trim() !== '') params.search = search.trim();
      
      // Add shop filter
      if (shopFilter && shopFilter !== 'All') {
        params.shopName = shopFilter;
      }
      // Driver name is now searched via the global search term on backend
      
      // Handle status filtering based on the new system
      // If no explicit statusFilter is provided, derive it from current main/sub tab to avoid fetching ALL packages
      let effectiveStatusFilter = statusFilter;
      if (!effectiveStatusFilter || effectiveStatusFilter === '') {
        // Compute from current tab + subtab
        effectiveStatusFilter = (() => {
          switch (packagesTab) {
            case 'ready-to-assign':
              return (packagesSubTab === 'all')
                ? 'pending,return-requested,exchange-in-process'
                : packagesSubTab;
            case 'in-transit':
              return (packagesSubTab === 'all')
                ? 'assigned,pickedup,in-transit'
                : packagesSubTab;
            case 'delivered':
              return (packagesSubTab === 'all')
                ? 'delivered,delivered-returned'
                : packagesSubTab;
            case 'cancelled':
              if (packagesSubTab === 'all') return 'cancelled,cancelled-returned,rejected,rejected-returned';
              if (packagesSubTab === 'cancelled-group') return 'cancelled,cancelled-returned';
              if (packagesSubTab === 'rejected-group') return 'rejected,rejected-returned';
              return packagesSubTab;
            case 'return-to-shop':
              if (packagesSubTab === 'all') return 'return-requested,return-in-transit,return-pending,return-completed,exchange-requests,cancelled-awaiting-return,rejected-awaiting-return,exchange-completed';
              if (packagesSubTab === 'exchange-requests') return 'exchange-awaiting-schedule,exchange-awaiting-pickup,exchange-in-process,exchange-in-transit,exchange-awaiting-return';
              if (packagesSubTab === 'exchange-completed') return 'exchange-returned';
              return packagesSubTab;
            default:
              return '';
          }
        })();
      }

      // Only apply status filter if it's now provided and not empty
      if (effectiveStatusFilter && effectiveStatusFilter !== '') {
        // If statusFilter contains multiple statuses (comma-separated), use statusIn
        if (effectiveStatusFilter.includes(',')) {
          params.statusIn = effectiveStatusFilter;
        } else {
          // Single status, use status
          params.status = effectiveStatusFilter;
        }
      }
      // If no statusFilter is provided, don't add any status filtering (show all packages)
      

      
      // Set default sorting based on tab
      if (packagesTab === 'delivered') {
        // Delivered ordered by actual delivery time (newest first)
        params.sortBy = 'actualDeliveryTime';
        params.sortOrder = 'DESC';
      } else if (packagesTab === 'in-transit') {
        // In-Transit ordered by actual pickup time (newest pickups first)
        params.sortBy = 'actualPickupTime';
        params.sortOrder = 'DESC';
      } else if (packagesTab === 'cancelled') {
        // Cancelled ordered by most recently changed
        params.sortBy = 'updatedAt';
        params.sortOrder = 'DESC';
      } else if (packagesTab === 'ready-to-assign' || packagesTab === 'return-to-shop') {
        // For assignment and returns views, show most recently updated at the top
        params.sortBy = 'updatedAt';
        params.sortOrder = 'DESC';
      }

      const response = await adminService.getPackages(params);
      const list = response.data?.packages || response.data || [];
      const totalPages = response.data?.totalPages || 1;
      const total = response.data?.total || list.length;
      const current = response.data?.currentPage || page;

      setPackages(list);

      // Update pagination state
      setPackagePage(current);
      setPackageTotalPages(totalPages);
      setPackageTotal(total);

      // Reopen details if needed
      const reopenEntityId = localStorage.getItem('reopenAdminModal');
      if (reopenEntityId) {
        const entityToReopen = list.find(pkg => pkg.id == reopenEntityId);
        if (entityToReopen) {
          setSelectedEntity(entityToReopen);
          setShowDetailsModal(true);
        }
        localStorage.removeItem('reopenAdminModal');
      }
    } catch (error) {
      console.error('Error fetching packages:', error);
      alert('Failed to fetch packages. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Clear filters when changing tabs
  useEffect(() => {
    if (activeTab !== 'packages') {
      setPackageStatusFilter('');
      setPackageShopFilter('');
    }
  }, [activeTab]);

  // Initialize sub-tab and fetch packages when component mounts or when main tab changes
  useEffect(() => {
    if (activeTab === 'packages') {
      // If packagesTab is 'all' (initial state), set it to the first available tab
      let currentMainTab = packagesTab;
      if (packagesTab === 'all') {
        currentMainTab = 'all'; // Use 'all' as the default main tab
        setPackagesTab('all');
      }
      
      // Get the first sub-sub-tab for the current main tab
      const currentSubTabs = PACKAGE_SUB_TABS[currentMainTab] || [];
      const firstSubTab = currentSubTabs.length > 0 ? currentSubTabs[0].value : 'all';
      
      // Set the sub-tab and immediately fetch with the correct filtering
      setPackagesSubTab(firstSubTab);
      // Fetch immediately with the correct parameters
      fetchPackagesWithMainTab(currentMainTab, firstSubTab, 1);
      fetchAvailableShops(); // Fetch shops for filtering
    }
  }, [activeTab, packagesTab]);

  // Fetch packages when sub-tab changes (separate from main tab changes)
  useEffect(() => {
    if (activeTab === 'packages' && packagesSubTab && packages.length > 0) {
      // Only fetch when user manually changes sub-tab (not during initial load)
      fetchPackagesWithMainTab(packagesTab, packagesSubTab, 1);
    }
  }, [packagesSubTab]);

  useEffect(() => {
    if (activeTab === 'dashboard') {
      setAnalyticsLoading(true);
      Promise.all([
        adminService.getPackagesPerMonth(),
        adminService.getCodCollectedPerMonth(),
        adminService.getPackageStatusDistribution(),
        adminService.getTopShops(),
        adminService.getRecentPackagesData(),
        adminService.getRecentCodData(),
        // Fetch the latest updated packages for quick actions widget
        adminService.getPackages({ page: 1, limit: 15, sortBy: 'updatedAt', sortOrder: 'DESC' })
      ]).then(([pkgRes, codRes, statusRes, shopsRes, recentPkgRes, recentCodRes, recentUpdatedRes]) => {
        setAnalytics({
          packagesPerMonth: pkgRes.data,
          codPerMonth: codRes.data,
          statusDistribution: statusRes.data,
          topShops: shopsRes.data
        });

        // Generate dashboard charts from backend data
        const recentPackagesData = recentPkgRes.data;
        const recentCodData = recentCodRes.data;

        // Debug: Log the data to verify it's correct
        console.log('Recent packages data:', recentPackagesData);
        console.log('Recent COD data:', recentCodData);

        // Create last 7 days labels
        console.log('Processing dashboard charts...');
        const last7DaysLabels = [];
        const now = new Date();
        for (let i = 6; i >= 0; i--) {
          const date = new Date(now);
          date.setDate(date.getDate() - i);
          last7DaysLabels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
        }

        // Process packages data
        const createdPerDay = new Array(7).fill(0);
        const deliveredPerDay = new Array(7).fill(0);

        recentPackagesData.forEach(item => {
          // item.date comes as 'YYYY-MM-DD' string
          const itemDateStr = item.date;
          const itemDate = new Date(itemDateStr + 'T00:00:00'); // Ensure consistent timezone
          const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          const itemDateOnly = new Date(itemDate.getFullYear(), itemDate.getMonth(), itemDate.getDate());

          const daysAgo = Math.floor((nowDate - itemDateOnly) / (1000 * 60 * 60 * 24));

          if (daysAgo >= 0 && daysAgo < 7) {
            createdPerDay[6 - daysAgo] = Number(item.created) || 0;
            deliveredPerDay[6 - daysAgo] = Number(item.delivered) || 0;
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

        console.log('Packages chart data:', { labels: last7DaysLabels, createdPerDay, deliveredPerDay });

        // Process COD data (last 4 weeks)
        const weeklyCod = new Array(4).fill(0);
        recentCodData.forEach(item => {
          // Backend now returns weekOffset directly (0 = this week, 1 = 1 week ago, etc.)
          const weekOffset = item.weekOffset;
          if (weekOffset >= 0 && weekOffset < 4) {
            weeklyCod[3 - weekOffset] = Number(item.codCollected) || 0;
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

        console.log('COD chart data:', { weeklyCod });

        setDashboardData({
          packagesChart,
          codChart,
          recentPackages: [],
          recentSettlements: [],
          totalCodCollected: 0
        });

        // Store recent updated packages list
        const recentList = recentUpdatedRes?.data?.packages || recentUpdatedRes?.data || [];
        setRecentUpdatedPackages(Array.isArray(recentList) ? recentList : []);
      }).finally(() => setAnalyticsLoading(false));
    }
  }, [activeTab]);

  // Dedicated fetcher to refresh the recent updated packages widget
  const fetchRecentUpdatedPackages = async () => {
    try {
      setRecentUpdatedLoading(true);
      const res = await adminService.getPackages({ page: 1, limit: 15, sortBy: 'updatedAt', sortOrder: 'DESC' });
      const list = res?.data?.packages || res?.data || [];
      setRecentUpdatedPackages(Array.isArray(list) ? list : []);
    } catch (e) {
      console.error('Failed to fetch recent updated packages', e);
      setRecentUpdatedPackages([]);
    } finally {
      setRecentUpdatedLoading(false);
    }
  };

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
                      <th>Amount (EGP)</th>
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
                          <td>EGP {parseFloat(tx.amount).toFixed(2)}</td>
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
                      <th onClick={() => handleShopSort('shippingFees')} style={{ cursor: 'pointer' }}>Shipping Fees (EGP) {renderSortIcon('shippingFees')}</th>
                      <th onClick={() => handleShopSort('deliveredCount')} style={{ cursor: 'pointer' }}>Delivered {renderSortIcon('deliveredCount')}</th>
                                              <th onClick={() => handleShopSort('revenue')} style={{ cursor: 'pointer' }}>Revenue (EGP) {renderSortIcon('revenue')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedShopRows.length === 0 ? (
                      <tr><td colSpan={4} style={{ textAlign: 'center' }}>No shops found.</td></tr>
                    ) : (
                      sortedShopRows.map(row => (
                        <tr key={row.id}>
                          <td>{row.name}</td>
                          <td>EGP {row.shippingFees.toFixed(2)}</td>
                          <td>{row.deliveredCount}</td>
                          <td>EGP {row.revenue.toFixed(2)}</td>
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
      { title: 'COD Collected (All Time)', value: stats.cod?.totalCollected || 0, icon: faDollarSign, prefix: 'EGP ' },
      { title: 'To Collect COD (All Time)', value: stats.cod?.totalToCollect || 0, icon: faDollarSign, prefix: 'EGP ' },
      // Insert Revenue card right after To Collect COD
      { title: 'Revenue (Delivered Packages)', value: deliveredRevenue, icon: faDollarSign, prefix: 'EGP ' },
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
                formatter={value => (kpi.prefix === 'EGP ' ? parseFloat(value).toFixed(2) : value)}
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
        {/* Recently Updated Packages widget */}
        <Row gutter={[24, 24]} style={{ marginTop: '24px' }}>
          <Col xs={24}>
            <Card
              title="Recently Updated Packages"
              extra={
                <button className="action-btn" onClick={fetchRecentUpdatedPackages} disabled={recentUpdatedLoading}>
                  {recentUpdatedLoading ? 'Refreshing…' : 'Refresh'}
                </button>
              }
            >
              <div style={{ maxHeight: 360, overflowY: 'auto' }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Updated</th>
                      <th>Tracking #</th>
                      <th>Status</th>
                      <th>Shop</th>
                      <th>Driver</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentUpdatedPackages.length === 0 ? (
                      <tr><td colSpan={6} style={{ textAlign: 'center' }}>No recent updates.</td></tr>
                    ) : (
                      recentUpdatedPackages.map(pkg => {
                        const isNew = pkg.createdAt && pkg.updatedAt && (new Date(pkg.createdAt).getTime() === new Date(pkg.updatedAt).getTime());
                        return (
                          <tr key={pkg.id}>
                            <td>
                              {new Date(pkg.updatedAt).toLocaleString()}
                              {isNew && <span className="status-badge status-pending" style={{ marginLeft: 8 }}>New</span>}
                            </td>
                            <td>{pkg.trackingNumber}</td>
                            <td>
                              <span className={`status-badge status-${pkg.status}`}>
                                {pkg.status}
                              </span>
                            </td>
                            <td>{pkg.shop?.businessName || pkg.Shop?.businessName || '-'}</td>
                            <td>{pkg.driver?.contact?.name || pkg.Driver?.User?.name || '-'}</td>
                            <td>
                              <div style={{ display: 'flex', gap: 8 }}>
                                <button
                                  className="action-btn view-btn"
                                  title="View details"
                                  onClick={() => viewDetails(pkg, 'package')}
                                >
                                  <FontAwesomeIcon icon={faEye} />
                                </button>
                                {/* Quick forward if not at final step; delivered handled via modal elsewhere */}
                                {['assigned', 'pickedup', 'in-transit'].includes(pkg.status) && (
                                  <button
                                    className="action-btn"
                                    title="Forward status"
                                    onClick={async () => {
                                      await forwardPackageStatus(pkg);
                                      // Refresh the recent list to reflect new status
                                      fetchRecentUpdatedPackages();
                                    }}
                                    disabled={forwardingPackageId === pkg.id}
                                  >
                                    {forwardingPackageId === pkg.id ? 'Forwarding…' : 'Forward'}
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
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

  // Function to handle giving money to driver
  const handleGiveMoneyToDriver = async () => {
    if (!giveMoneyAmount || isNaN(parseFloat(giveMoneyAmount)) || parseFloat(giveMoneyAmount) <= 0) {
      setStatusMessage({ type: 'error', text: 'Please enter a valid positive amount.' });
      return;
    }

    try {
      setGivingMoney(true);
      const response = await adminService.giveMoneyToDriver(selectedEntity.driverId || selectedEntity.id, {
        amount: parseFloat(giveMoneyAmount),
        reason: giveMoneyReason.trim() || undefined
      });

      setStatusMessage({ 
        type: 'success', 
        text: `Successfully gave EGP ${parseFloat(giveMoneyAmount).toFixed(2)} to ${response.data.driverName}. New profit: EGP ${response.data.newProfit.toFixed(2)}.` 
      });

      // Reset form
      setGiveMoneyAmount('');
      setGiveMoneyReason('');
      
      // Refresh dashboard stats to show updated profit
      const statsResponse = await adminService.getDashboardStats();
      setStats(statsResponse.data);

    } catch (error) {
      console.error('Error giving money to driver:', error);
      setStatusMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to give money to driver.' 
      });
    } finally {
      setGivingMoney(false);
    }
  };

  // Add state for server-side package filters
  const [packageStatusFilter, setPackageStatusFilter] = useState('');
  const [packageShopFilter, setPackageShopFilter] = useState('');
  const [availableShops, setAvailableShops] = useState([]);
  const searchTimeoutRef = useRef(null);

  // Function to get filtered packages (now just returns packages since filtering is server-side)
  const getFilteredPackages = () => {
    return packages;
  };

  // Function to fetch available shops for filtering
  const fetchAvailableShops = async () => {
    try {
      const response = await adminService.getShops();
      setAvailableShops(response.data || []);
    } catch (error) {
      console.error('Error fetching shops:', error);
    }
  };

  // Function to handle status filter change (kept for backward compatibility)
  const handleStatusFilterChange = (newStatus) => {
    setPackageStatusFilter(newStatus);
    setPackagePage(1); // Reset to first page
    // Call fetchPackages with the new status immediately
    fetchPackagesWithFilters(1, searchTerm, newStatus, packageShopFilter);
  };

  // Function to handle shop filter change
  const handleShopFilterChange = (newShop) => {
    setPackageShopFilter(newShop);
    setPackagePage(1); // Reset to first page
    // Call fetchPackages with the new shop immediately
    fetchPackagesWithFilters(1, searchTerm, packageStatusFilter, newShop);
  };

  // Removed driver-specific filter; driver search goes through global search

  // Function to handle main tab change
  const handleMainTabChange = (newTab) => {
    setPackagesTab(newTab);
    
    // Get the first sub-sub-tab for the new main tab
    const currentSubTabs = PACKAGE_SUB_TABS[newTab] || [];
    const firstSubTab = currentSubTabs.length > 0 ? currentSubTabs[0].value : 'all';
    
    setPackagesSubTab(firstSubTab); // Set to first sub-sub-tab instead of 'all'
    setPackagePage(1);
    // Fetch packages based on the new main tab and first sub-sub-tab
    fetchPackagesWithMainTab(newTab, firstSubTab, 1);
  };

  // Function to handle sub-tab change
  const handleSubTabChange = (newSubTab) => {
    setPackagesSubTab(newSubTab);
    setPackagePage(1);
    // Fetch packages based on the current main tab and new sub-tab
    fetchPackagesWithMainTab(packagesTab, newSubTab, 1);
  };

  // Function to fetch packages with main tab and sub-tab filtering
  const fetchPackagesWithMainTab = (mainTab, subTab, page = 1) => {
    let statusFilter = '';
    
    // Determine status filter based on main tab and sub tab
    switch (mainTab) {
      case 'ready-to-assign':
        if (subTab === 'all') {
          // Show only Pending, Return Requested, and Exchange Requested under 'All Ready'
          // Exchange requested maps to the initial exchange-request state: exchange-awaiting-schedule
          statusFilter = 'pending,return-requested,exchange-in-process';
        } else {
          statusFilter = subTab;
        }
        break;
      case 'in-transit':
        if (subTab === 'all') {
          statusFilter = 'assigned,pickedup,in-transit';
        } else {
          statusFilter = subTab;
        }
        break;
      case 'delivered':
        if (subTab === 'all') {
          statusFilter = 'delivered,delivered-returned';
        } else {
          statusFilter = subTab;
        }
        break;
      case 'cancelled':
        if (subTab === 'all') {
          statusFilter = 'cancelled,cancelled-returned,rejected,rejected-returned';
        } else if (subTab === 'cancelled-group') {
          statusFilter = 'cancelled,cancelled-returned';
        } else if (subTab === 'rejected-group') {
          statusFilter = 'rejected,rejected-returned';
        } else {
          statusFilter = subTab;
        }
        break;
      case 'return-to-shop':
        if (subTab === 'all') {
          statusFilter = 'return-requested,return-in-transit,return-pending,return-completed,exchange-requests,cancelled-awaiting-return,rejected-awaiting-return,exchange-completed';
        } else if (subTab === 'exchange-requests') {
          statusFilter = 'exchange-awaiting-schedule,exchange-awaiting-pickup,exchange-in-process,exchange-in-transit,exchange-awaiting-return';
        } else if (subTab === 'exchange-completed') {
          statusFilter = 'exchange-returned';
        } else {
          statusFilter = subTab;
        }
        break;
      default:
        statusFilter = '';
    }
    
          fetchPackagesWithFilters(page, searchTerm, statusFilter, packageShopFilter);
  };

  // Function to handle search with debouncing
  const handleSearchChange = (e) => {
    const newSearchTerm = e.target.value;
    setSearchTerm(newSearchTerm);
    
    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Set new timeout for debounced search
    searchTimeoutRef.current = setTimeout(() => {
      setPackagePage(1); // Reset to first page
      fetchPackagesWithFilters(1, newSearchTerm, packageStatusFilter, packageShopFilter);
    }, 500); // 500ms delay
  };

  // Get unique statuses from current packages for dropdown
  const allStatuses = Array.from(new Set(packages.map(pkg => pkg.status))).sort();

  // Add new state variables for delivery cost editing


  // Print AWB (admin)
  const handlePrintAWB = async (pkg) => {
    try {
      // Ensure we have Items for AWB
      let packageForAwb = pkg;
      if (!pkg?.Items || !Array.isArray(pkg.Items)) {
        try {
          const resp = await packageService.getPackageById(pkg.id);
          if (resp && resp.data) packageForAwb = resp.data;
        } catch (err) {
          // ignore and fallback
        }
      }

      const qrDataUrl = await QRCode.toDataURL((packageForAwb.trackingNumber || pkg.trackingNumber || ''));
      const logoUrl = window.location.origin + '/assets/images/logo.jpg';
      const awbPkg = packageForAwb;
      const cod = parseFloat((awbPkg.codAmount != null ? awbPkg.codAmount : pkg.codAmount) || 0);
      const isShopify = (awbPkg.shopifyOrderId !== undefined && awbPkg.shopifyOrderId !== null && awbPkg.shopifyOrderId !== '');
      const itemsSum = (Array.isArray(awbPkg.Items) && awbPkg.Items.length > 0)
        ? awbPkg.Items.reduce((sum, it) => sum + (parseFloat(it.codAmount || 0) || 0), 0)
        : cod;
      const shippingValue = Number(awbPkg.shownDeliveryCost ?? awbPkg.deliveryCost ?? pkg.shownDeliveryCost ?? pkg.deliveryCost ?? 0) || 0;
      
          // For Shopify packages: Sub Total = COD - shownShippingFees, Delivery fees = shownShippingFees, Total = COD
    // For manually created packages: Sub Total = itemsSum, Delivery fees = shippingValue, Total = subTotal + shipping
    const subTotal = isShopify ? Math.max(0, cod - shippingValue) : itemsSum;
    const deliveryFees = isShopify ? shippingValue : shippingValue;
    const total = isShopify ? cod : (subTotal + shippingValue);
    
    const totalsRows = isShopify
      ? `<tr><td>Sub Total:</td><td>${subTotal.toFixed(2)} EGP</td></tr>`
        + `<tr><td>Delivery fees & Taxes:</td><td>${deliveryFees.toFixed(2)} EGP</td></tr>`
        + `<tr><td><b>Total:</b></td><td><b>${total.toFixed(2)} EGP</b></td></tr>`
      : `<tr><td>Sub Total:</td><td>${subTotal.toFixed(2)} EGP</td></tr>`
        + `<tr><td>Shipping:</td><td>${deliveryFees.toFixed(2)} EGP</td></tr>`
        + `<tr><td><b>Total:</b></td><td><b>${total.toFixed(2)} EGP</b></td></tr>`;
      const shopName = awbPkg.Shop?.businessName || awbPkg.shop?.businessName;
      const shopNameAr = toArabicName(shopName || '-');
      const recipientNameAr = toArabicName(awbPkg.deliveryContactName || '-');
      const addressAr = toArabicName(awbPkg.deliveryAddress || '-');
      const isExchange = (awbPkg.type === 'exchange');
      const exch = awbPkg.exchangeDetails || {};
      const takeItems = Array.isArray(exch.takeItems) ? exch.takeItems : [];
      const giveItems = Array.isArray(exch.giveItems) ? exch.giveItems : [];
      const cd = exch.cashDelta || {};
      const moneyAmount = Number.parseFloat(cd.amount || 0) || 0;
      const moneyType = cd.type || null;
      const moneyLabel = moneyType === 'give' ? 'Give to customer' : (moneyType === 'take' ? 'Take from customer' : 'Money');
      const shippingDisplay = Number(awbPkg.shownDeliveryCost ?? awbPkg.deliveryCost ?? shippingValue) || 0;

      const itemsSectionDefault = `
              <table class=\"awb-table\">\n                <thead>\n                  <tr><th>Item</th><th>Qty</th><th>COD Per Unit</th><th>Total COD</th></tr>\n                </thead>\n                <tbody>\n                  ${
                    awbPkg.Items && awbPkg.Items.length > 0
                      ? awbPkg.Items.map(item => `\n                        <tr>\n                          <td>${item.description || '-'}</td>\n                          <td>${item.quantity}</td>\n                          <td>${item.codAmount && item.quantity ? (item.codAmount / item.quantity).toFixed(2) : '0.00'} EGP</td>\n                          <td>${parseFloat(item.codAmount || 0).toFixed(2)} EGP</td>\n                        </tr>\n                      `).join('')
                      : `\n                        <tr>\n                          <td>${awbPkg.packageDescription || '-'}</td>\n                          <td>${awbPkg.itemsNo ?? 1}</td>\n                          <td>${cod.toFixed(2)} EGP</td>\n                          <td>${cod.toFixed(2)} EGP</td>\n                        </tr>`
                  }\n                </tbody>\n              </table>\n              <div class=\"awb-section\">\n                <b>Payment Method:</b> COD\n              </div>\n              <div class=\"awb-section\" style=\"display:flex;justify-content:flex-end;\">\n                <table class=\"awb-info-table\" style=\"width:300px;\">\n                  ${totalsRows}\n                </table>\n              </div>`;

      const itemsSectionExchange = `
              <div class=\"awb-section\">\n                <table class=\"awb-table\">\n                  <thead>\n                    <tr><th colspan=\"2\">Items to take from customer</th></tr>\n                  </thead>\n                  <tbody>\n                    ${
                      takeItems.length > 0
                        ? takeItems.map(it => `\n                            <tr>\n                              <td>${(it.description || '-')}</td>\n                              <td>Qty: ${(parseInt(it.quantity) || 0)}</td>\n                            </tr>\n                          `).join('')
                        : `<tr><td colspan=\"2\">None</td></tr>`
                    }\n                  </tbody>\n                </table>\n                <table class=\"awb-table\" style=\"margin-top:12px;\">\n                  <thead>\n                    <tr><th colspan=\"2\">Items to give to customer</th></tr>\n                  </thead>\n                  <tbody>\n                    ${
                      giveItems.length > 0
                        ? giveItems.map(it => `\n                            <tr>\n                              <td>${(it.description || '-')}</td>\n                              <td>Qty: ${(parseInt(it.quantity) || 0)}</td>\n                            </tr>\n                          `).join('')
                        : `<tr><td colspan=\"2\">None</td></tr>`
                    }\n                  </tbody>\n                </table>\n              </div>\n              <div class=\"awb-section\" style=\"display:flex;justify-content:flex-end;\">\n                <table class=\"awb-info-table\" style=\"width:360px;\">\n                  <tr><td>${moneyLabel}:</td><td>EGP ${moneyAmount.toFixed(2)}</td></tr>\n                  <tr><td>Shipping Fees:</td><td>EGP ${shippingDisplay.toFixed(2)}</td></tr>\n                </table>\n              </div>`;

      const awbHtml = `
        <html>
          <head>
            <title>Droppin Air Waybill</title>
            <style>
              body { font-family: Arial, sans-serif; background: #fff; color: #111; margin: 0; padding: 0; }
              .awb-container { width: 800px; margin: 0 auto; padding: 32px; background: #fff; }
              .awb-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #111; padding-bottom: 16px; }
              .awb-logo { height: 80px; width: auto; }
              .awb-shop-name { font-size: 1.2rem; font-weight: bold; color: #004b6f; margin-top: 4px; }
              .awb-section { margin-top: 24px; }
              .awb-table { width: 100%; border-collapse: collapse; margin-top: 16px; }
              .awb-table th, .awb-table td { border: 1px solid #111; padding: 8px; text-align: left; }
              .awb-table th { background: #f5f5f5; }
              .awb-info-table { width: 100%; margin-top: 16px; }
              .awb-info-table td { padding: 4px 8px; }
              .awb-footer { margin-top: 32px; text-align: center; font-size: 1.1rem; font-weight: bold; }
              .awb-tracking { font-size: 22px; font-weight: bold; }
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
                    <td>
                      <div class="awb-tracking">Tracking #: ${awbPkg.trackingNumber || '-'}</div>
                      <div class="awb-shop-name">Shop Name: ${shopName || '-'} | ${shopNameAr}</div>
                    </td>
                    <td><b>Date:</b> ${awbPkg.createdAt ? new Date(awbPkg.createdAt).toLocaleDateString() : '-'}</td>
                  </tr>
                  <tr>
                    <td colspan="2">
                      <div><b>Recipient:</b> ${awbPkg.deliveryContactName || '-'} | ${recipientNameAr}</div>
                      <div><b>Email:</b> ${awbPkg.deliveryContactEmail || '-'}</div>
                      <div><b>Phone:</b> ${awbPkg.deliveryContactPhone || '-'}</div>
                      <div><b>Address:</b> ${awbPkg.deliveryAddress || '-'} | ${addressAr}</div>
                      ${isShopify ? `<div><b>Shopify Order:</b> ${awbPkg.shopifyOrderName || awbPkg.shopifyOrderId}</div>` : ''}
                    </td>
                  </tr>
                </table>
              </div>
              <div class="awb-section">
                <b>Description:</b> ${awbPkg.packageDescription || '-'}
              </div>
              ${isExchange ? itemsSectionExchange : itemsSectionDefault}
              <div class="awb-footer">Thank you for your order!</div>
            </div>
          </body>
        </html>
      `;
      const printWindow = window.open('', '_blank');
      printWindow.document.open();
      printWindow.document.write(awbHtml);
      printWindow.document.close();
    } catch (e) {
      console.error('AWB print error:', e);
      alert('Failed to generate AWB.');
    }
  };

  const [showShippingFeesModal, setShowShippingFeesModal] = useState(false);
  const [pendingShopApproval, setPendingShopApproval] = useState({ id: null, selectedEntity: null });
  const [shippingFeesInput, setShippingFeesInput] = useState('');

  const renderShippingFeesModal = () => {
    if (!showShippingFeesModal) return null;
    return (
      <div className="confirmation-overlay">
        <div className="confirmation-dialog">
          <h3>Set Shipping Fees</h3>
          <p>Please enter the shipping fees for this shop. This will be saved and the shop will be approved.</p>
          <input
            type="number"
            step="0.01"
            value={shippingFeesInput}
            onChange={(e) => setShippingFeesInput(e.target.value)}
            style={{ width: '100%', padding: '10px', marginTop: '10px', marginBottom: '10px' }}
          />
          <div className="confirmation-buttons">
            <button className="btn-secondary" onClick={() => { setShowShippingFeesModal(false); setPendingShopApproval({ id: null, selectedEntity: null }); }}>
              Cancel
            </button>
            <button
              className="btn-primary"
              onClick={async () => {
                // Basic validation
                const value = parseFloat(shippingFeesInput);
                if (!Number.isFinite(value) || value < 0) {
                  alert('Please enter a valid non-negative number for shipping fees.');
                  return;
                }
                setShowShippingFeesModal(false);
                const { id, selectedEntity } = pendingShopApproval;
                await processApproval(id, 'shop', true, selectedEntity || {});
                setPendingShopApproval({ id: null, selectedEntity: null });
              }}
            >
              Save & Approve
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Pagination for packages tab
  const [packagePage, setPackagePage] = useState(1);
  const [packageTotalPages, setPackageTotalPages] = useState(1);
  const [packageTotal, setPackageTotal] = useState(0);



  // Pagination for money tab
  const [moneyPage, setMoneyPage] = useState(1);
  const [moneyTotalPages, setMoneyTotalPages] = useState(1);
  const [moneyTotal, setMoneyTotal] = useState(0);

  // Admin delivery confirmation modal (mirror of driver mobile pre-delivery)
  const [showAdminDeliveryModal, setShowAdminDeliveryModal] = useState(false);
  const [adminDeliveryModalPackage, setAdminDeliveryModalPackage] = useState(null);
  const [adminIsPartialDelivery, setAdminIsPartialDelivery] = useState(false);
  const [adminDeliveredQuantities, setAdminDeliveredQuantities] = useState({});
  const [adminPaymentMethodChoice, setAdminPaymentMethodChoice] = useState('CASH');
  // Return Completed confirmation modal state
  const [showReturnCompleteDialog, setShowReturnCompleteDialog] = useState(false);
  const [returnCompletePkg, setReturnCompletePkg] = useState(null);
  const [returnDeductShipping, setReturnDeductShipping] = useState(true);
  // Exchange Completed confirmation modal state
  const [showExchangeCompleteDialog, setShowExchangeCompleteDialog] = useState(false);
  const [exchangeCompletePkg, setExchangeCompletePkg] = useState(null);
  const [exchangeDeductShipping, setExchangeDeductShipping] = useState(true);

  // Global ESC-to-close for admin: close the top-most modal/dialog (must be after all related state declarations)
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key !== 'Escape') return;
      // Highest priority overlays first
      if (showReturnCompleteDialog) { setShowReturnCompleteDialog(false); setReturnCompletePkg(null); return; }
      if (showExchangeCompleteDialog) { setShowExchangeCompleteDialog(false); setExchangeCompletePkg(null); return; }
      if (showConfirmationDialog) { setShowConfirmationDialog(false); return; }
      if (showAdminDeliveryModal) { setShowAdminDeliveryModal(false); return; }
      if (showRejectPackageModal) { setShowRejectPackageModal(false); return; }
      if (showForwardPackageModal) { setShowForwardPackageModal(false); return; }
      if (showAssignPickupDriverModal) { setShowAssignPickupDriverModal(false); return; }
      if (showAssignDriverModal) { setShowAssignDriverModal(false); return; }
      if (showBulkAssignModal) { setShowBulkAssignModal(false); return; }
      if (showSettleAmountModal) { setShowSettleAmountModal(false); return; }
      if (showPickupModal) { setShowPickupModal(false); return; }
      if (showWorkingAreaModal) { setShowWorkingAreaModal(false); return; }
      if (showShippingFeesModal) { setShowShippingFeesModal(false); return; }
      if (showDetailsModal) { setShowDetailsModal(false); setSelectedEntity(null); return; }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showReturnCompleteDialog, showExchangeCompleteDialog, showConfirmationDialog, showAdminDeliveryModal, showRejectPackageModal, showForwardPackageModal, showAssignPickupDriverModal, showAssignDriverModal, showBulkAssignModal, showSettleAmountModal, showPickupModal, showWorkingAreaModal, showShippingFeesModal, showDetailsModal]);

  // Render admin delivery confirmation modal (mirror of mobile driver)
  const renderAdminDeliveryModal = () => {
    if (!showAdminDeliveryModal || !adminDeliveryModalPackage) return null;
    const items = Array.isArray(adminDeliveryModalPackage.Items) ? adminDeliveryModalPackage.Items : [];
    return (
      <div className={`modal-overlay show admin-delivery-overlay`} onClick={() => setShowAdminDeliveryModal(false)}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
          <div className="modal-header">
            <h3>Mark as Delivered</h3>
            <button className="modal-close" onClick={() => setShowAdminDeliveryModal(false)}>
              <FontAwesomeIcon icon={faClose} />
            </button>
          </div>
          <div className="modal-body">
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <input type="checkbox" checked={adminIsPartialDelivery} onChange={(e) => setAdminIsPartialDelivery(e.target.checked)} />
              Partial delivery
            </label>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>Payment Method</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" onClick={() => setAdminPaymentMethodChoice('CASH')} className={`btn ${adminPaymentMethodChoice === 'CASH' ? 'btn-primary' : 'btn-secondary'}`}>
                  CASH
                </button>
                <button type="button" onClick={() => setAdminPaymentMethodChoice('VISA')} className={`btn ${adminPaymentMethodChoice === 'VISA' ? 'btn-primary' : 'btn-secondary'}`}>
                  VISA
                </button>
              </div>
            </div>
            {adminIsPartialDelivery ? (
              items.length > 0 ? (
                <div>
                  {items.map((it) => {
                    const maxQty = parseInt(it.quantity, 10) || 0;
                    return (
                      <div key={it.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <div style={{ flex: 1, marginRight: 8 }}>{it.description} (max {maxQty})</div>
                        <input
                          type="number"
                          min="0"
                          max={maxQty}
                          value={adminDeliveredQuantities[it.id] ?? ''}
                          onChange={(e) => setAdminDeliveredQuantities(prev => ({ ...prev, [it.id]: e.target.value }))}
                          placeholder="0"
                          style={{ width: 100, padding: 6 }}
                        />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ color: '#666' }}>No items available for partial selection.</div>
              )
            ) : (
              <div style={{ color: '#444' }}>Deliver package completely to the customer.</div>
            )}
          </div>
          <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button className="btn-secondary" onClick={() => setShowAdminDeliveryModal(false)}>Cancel</button>
            <button
              className="btn-primary"
              onClick={async () => {
                try {
                  if (!adminDeliveryModalPackage) return;
                  if (!adminIsPartialDelivery) {
                    await packageService.updatePackageStatus(adminDeliveryModalPackage.id, { status: 'delivered', paymentMethod: adminPaymentMethodChoice });
                  } else {
                    const itemsForCalc = Array.isArray(adminDeliveryModalPackage.Items) ? adminDeliveryModalPackage.Items : [];
                    const deliveredItems = itemsForCalc
                      .map(it => {
                        const maxQty = parseInt(it.quantity, 10) || 0;
                        const qty = parseInt(adminDeliveredQuantities[it.id], 10) || 0;
                        const clamped = Math.min(Math.max(0, qty), maxQty);
                        return clamped > 0 ? { itemId: it.id, deliveredQuantity: clamped } : null;
                      })
                      .filter(Boolean);
                    await packageService.updatePackageStatus(adminDeliveryModalPackage.id, { status: 'delivered-awaiting-return', deliveredItems, paymentMethod: adminPaymentMethodChoice });
                  }
                  setShowAdminDeliveryModal(false);
                  setAdminDeliveryModalPackage(null);
                  // Refresh data
                  await fetchPackagesWithMainTab(packagesTab, packagesSubTab, packagePage);
                } catch (e) {
                  setStatusMessage({ type: 'error', text: e?.response?.data?.message || 'Failed to update package status.' });
                }
              }}
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Render Return Completed confirmation modal
  const renderReturnCompleteDialog = () => {
    if (!showReturnCompleteDialog || !returnCompletePkg) return null;
    const dc = parseFloat(returnCompletePkg.deliveryCost || 0) || 0;
    const refund = parseFloat(returnCompletePkg.returnRefundAmount || 0) || 0;
    return (
      <div className="confirmation-overlay">
        <div className="confirmation-dialog warning-dialog">
          <h3>Complete Return</h3>
          <p>
            You are about to mark package <strong>#{returnCompletePkg.trackingNumber}</strong> as <strong>Return Completed</strong>.
          </p>
          <div style={{ marginTop: 8, marginBottom: 8, fontSize: 14, color: '#333' }}>
            <div>Shipping Fees: <strong>EGP {dc.toFixed(2)}</strong></div>
          </div>
          <div style={{ marginTop: 12, marginBottom: 12 }}>
            <label style={{ display: 'block', marginBottom: 6 }}>Reduce shipping fees from the shop?</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" className={`btn ${returnDeductShipping ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setReturnDeductShipping(true)}>Yes</button>
              <button type="button" className={`btn ${!returnDeductShipping ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setReturnDeductShipping(false)}>No</button>
            </div>
          </div>
          <div className="confirmation-buttons">
            <button className="btn-secondary" onClick={() => { setShowReturnCompleteDialog(false); setReturnCompletePkg(null); }}>Cancel</button>
            <button
              className="btn-primary"
              onClick={async () => {
                try {
                  await packageService.updatePackageStatus(returnCompletePkg.id, { status: 'return-completed', deductShippingFees: returnDeductShipping });
                  setShowReturnCompleteDialog(false);
                  setReturnCompletePkg(null);
                  await fetchPackagesWithMainTab(packagesTab, packagesSubTab, packagePage);
                } catch (err) {
                  console.error('Failed to mark return completed:', err);
                  setStatusMessage({ type: 'error', text: err.response?.data?.message || 'Failed to complete return' });
                }
              }}
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Render Exchange Completed confirmation modal
  const renderExchangeCompleteDialog = () => {
    if (!showExchangeCompleteDialog || !exchangeCompletePkg) return null;
    const dc = parseFloat(exchangeCompletePkg.deliveryCost || 0) || 0;
    return (
      <div className="confirmation-overlay">
        <div className="confirmation-dialog warning-dialog">
          <h3>Complete Exchange</h3>
          <p>
            You are about to mark package <strong>#{exchangeCompletePkg.trackingNumber}</strong> as <strong>Exchange Completed</strong>.
          </p>
          <div style={{ marginTop: 8, marginBottom: 8, fontSize: 14, color: '#333' }}>
            <div>Shipping Fees (delivery cost): <strong>EGP {dc.toFixed(2)}</strong></div>
          </div>
          <div style={{ marginTop: 12, marginBottom: 12 }}>
            <label style={{ display: 'block', marginBottom: 6 }}>Reduce shipping fees from the shop?</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" className={`btn ${exchangeDeductShipping ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setExchangeDeductShipping(true)}>Yes</button>
              <button type="button" className={`btn ${!exchangeDeductShipping ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setExchangeDeductShipping(false)}>No</button>
            </div>
          </div>
          <div className="confirmation-buttons">
            <button className="btn-secondary" onClick={() => { setShowExchangeCompleteDialog(false); setExchangeCompletePkg(null); }}>Cancel</button>
            <button
              className="btn-primary"
              onClick={async () => {
                try {
                  await packageService.updatePackageStatus(exchangeCompletePkg.id, { status: 'exchange-returned', deductShippingFees: exchangeDeductShipping });
                  setShowExchangeCompleteDialog(false);
                  setExchangeCompletePkg(null);
                  await fetchPackagesWithMainTab(packagesTab, packagesSubTab, packagePage);
                } catch (err) {
                  console.error('Failed to mark exchange completed:', err);
                  setStatusMessage({ type: 'error', text: err.response?.data?.message || 'Failed to complete exchange' });
                }
              }}
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Wrapper used from within details modal button to ensure consistent behavior
  const handleForwardFromDetails = async (pkg) => {
    try {
      await forwardPackageStatus(pkg);
    } catch (e) {
      setStatusMessage({ type: 'error', text: e?.response?.data?.message || 'Failed to forward status.' });
    }
  };

  // Render main dashboard + one-time swipe hint for mobile users
  return (
  <div
      className={`admin-dashboard admin-dashboard-container ${isMenuOpen ? 'menu-open' : 'menu-closed'}`}
      ref={adminContainerRef}
    >
    {/* Floating bottom-left menu toggle button */}
    <button
      className="menu-fab"
      aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
      onClick={() => setIsMenuOpen(o => !o)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setIsMenuOpen(o => !o); } }}
    >
      <span className={`icon icon-arrow ${isMenuOpen ? 'hide' : 'show'}`} aria-hidden="true">→</span>
      <span className={`icon icon-hamburger ${isMenuOpen ? 'show' : 'hide'}`} aria-hidden="true">☰</span>
    </button>
  {renderStatusMessage()}
  <SwipeMenuHint isMenuOpen={isMenuOpen} />
  {renderAdminDeliveryModal()}
  {renderReturnCompleteDialog()}
  {renderExchangeCompleteDialog()}
      {renderConfirmationDialog()}
      {renderForwardPackageModal()}
      {renderRejectPackageModal()}
      {renderShippingFeesModal()}
      {/* Mobile sidebar (shown only on small screens via CSS) */}
      <div className="admin-sidebar">
        <div className="sidebar-header">
          <h2>Droppin</h2>
          <p>Admin Portal</p>
        </div>
        <div className="sidebar-menu">
          <button className={`menu-item${activeTab === 'dashboard' ? ' active' : ''}`} onClick={() => { setActiveTab('dashboard'); setIsMenuOpen(false); }}>Dashboard</button>
          <button className={`menu-item${activeTab === 'pending' ? ' active' : ''}`} onClick={() => { setActiveTab('pending'); setIsMenuOpen(false); }}>Pending Approvals</button>
          <button className={`menu-item${activeTab === 'shops' ? ' active' : ''}`} onClick={() => { setActiveTab('shops'); setIsMenuOpen(false); }}>Shops</button>
          <button className={`menu-item${activeTab === 'drivers' ? ' active' : ''}`} onClick={() => { setActiveTab('drivers'); setIsMenuOpen(false); }}>Drivers</button>
          <button className={`menu-item${activeTab === 'pickups' ? ' active' : ''}`} onClick={() => { setActiveTab('pickups'); setIsMenuOpen(false); }}>Pickups</button>
          <button className={`menu-item${activeTab === 'packages' ? ' active' : ''}`} onClick={() => { setActiveTab('packages'); setIsMenuOpen(false); }}>Packages</button>
          <button className={`menu-item${activeTab === 'money' ? ' active' : ''}`} onClick={() => { setActiveTab('money'); setIsMenuOpen(false); }}>Money</button>
        </div>
      </div>

      <div className="admin-main">
      <div className="dashboard-header">
        <h1 style={{color: 'white'}}>Admin Dashboard</h1>
        <div className="header-actions">
          <div className="search-box">
            <FontAwesomeIcon icon={faSearch} className="search-icon" />
            <input 
              type="text" 
              placeholder={activeTab === 'packages' ? "Search by Package ID, description, recipient, shop, or status..." : "Search users, shops, drivers, or packages..."} 
              value={searchTerm}
              onChange={activeTab === 'packages' ? handleSearchChange : (e) => setSearchTerm(e.target.value)}
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
             activeTab === 'packages' ? <> 
               {renderPackagesSubTabs()} 
               {renderPackagesTable()} 
               {activeTab === 'packages' && (
                 <div className="packages-pagination" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 16, padding: 8 }}>
                   <button
                     className="btn-secondary"
                     onClick={() => { 
                       if (packagePage > 1) {
                         const newPage = packagePage - 1;
                         setPackagePage(newPage);
                         fetchPackagesWithMainTab(packagesTab, packagesSubTab, newPage);
                       }
                     }}
                     disabled={packagePage <= 1 || loading}
                     title="Previous page"
                   >
                     ◀ Prev
                   </button>
                   <span style={{ whiteSpace: 'nowrap' }}>Page {packagePage} of {packageTotalPages}</span>
                   <button
                     className="btn-secondary"
                     onClick={() => { 
                       if (packagePage < packageTotalPages) {
                         const newPage = packagePage + 1;
                         setPackagePage(newPage);
                         fetchPackagesWithMainTab(packagesTab, packagesSubTab, newPage);
                       }
                     }}
                     disabled={packagePage >= packageTotalPages || loading}
                     title="Next page"
                   >
                     Next ▶
                   </button>
                   <span style={{ marginLeft: 8, color: '#666' }}>Total: {packageTotal}</span>
                 </div>
               )}
             </> :
             activeTab === 'money' ? renderMoneyTable() :
             activeTab === 'driver-packages' ? null :
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
          <h2 style={{ marginBottom: 12 }}>Packages for {selectedDriverForPackages.name}</h2>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
            <div>
              <label style={{ display:'block', fontSize: 12, color: '#666', marginBottom: 4 }}>Quick Filter</label>
              <select
                value={driverPackagesFilter.preset}
                onChange={(e) => {
                  const preset = e.target.value;
                  const today = new Date();
                  const startOfDay = (d) => { const x = new Date(d); x.setHours(0,0,0,0); return x; };
                  const endOfDay = (d) => { const x = new Date(d); x.setHours(23,59,59,999); return x; };
                  let start = '', end = '';
                  if (preset === 'today') {
                    start = startOfDay(today).toISOString();
                    end = endOfDay(today).toISOString();
                  } else if (preset === 'yesterday') {
                    const y = new Date(today); y.setDate(today.getDate() - 1);
                    start = startOfDay(y).toISOString();
                    end = endOfDay(y).toISOString();
                  } else if (preset === 'last7') {
                    const s = new Date(today); s.setDate(today.getDate() - 6);
                    start = startOfDay(s).toISOString();
                    end = endOfDay(today).toISOString();
                  }
                  setDriverPackagesFilter({ preset, start, end });
                  fetchDriverPackages(selectedDriverForPackages.driverId || selectedDriverForPackages.id, { createdAfter: start, createdBefore: end });
                }}
              >
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="last7">Last 7 days</option>
                <option value="custom">Custom range</option>
              </select>
            </div>
            <div>
              <label style={{ display:'block', fontSize: 12, color: '#666', marginBottom: 4 }}>From</label>
              <input
                type="date"
                value={driverPackagesFilter.start ? driverPackagesFilter.start.slice(0,10) : ''}
                onChange={(e) => {
                  const start = e.target.value ? new Date(e.target.value + 'T00:00:00').toISOString() : '';
                  const end = driverPackagesFilter.end;
                  setDriverPackagesFilter(prev => ({ ...prev, preset: 'custom', start }));
                }}
              />
            </div>
            <div>
              <label style={{ display:'block', fontSize: 12, color: '#666', marginBottom: 4 }}>To</label>
              <input
                type="date"
                value={driverPackagesFilter.end ? driverPackagesFilter.end.slice(0,10) : ''}
                onChange={(e) => {
                  const end = e.target.value ? new Date(e.target.value + 'T23:59:59').toISOString() : '';
                  setDriverPackagesFilter(prev => ({ ...prev, preset: 'custom', end }));
                }}
              />
            </div>
            <button
              className="btn btn-primary"
              onClick={() => fetchDriverPackages(selectedDriverForPackages.driverId || selectedDriverForPackages.id, { createdAfter: driverPackagesFilter.start, createdBefore: driverPackagesFilter.end })}
              disabled={!driverPackagesFilter.start && !driverPackagesFilter.end}
            >
              Apply
            </button>
          </div>
          {driverPackages.length === 0 ? (
            <div>No packages found for this driver.</div>
          ) : (
            <table className="admin-table" style={{ borderRadius: 8, overflow: 'hidden' }}>
              <thead>
                <tr>
                  <th>Tracking #</th>
                  <th>Description</th>
                  <th>Date</th>
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
                    <td>{pkg.createdAt ? new Date(pkg.createdAt).toLocaleDateString() : '-'}</td>
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
        <div className="modal-overlay show" onClick={() => setShowSettleAmountModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
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
      </div>{/* /.admin-main */}
    </div>
  );
};

export default AdminDashboard;
