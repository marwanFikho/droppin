/**
 * File Purpose:
 * - Entry container for the Admin dashboard feature.
 * - Owns global Admin state (tabs, filters, selected entities, modal visibility, and status feedback).
 * - Composes hooks + action factories, then wires data/actions into tab components and modal cluster components.
 */

import React, { useState, useEffect, useRef } from 'react';
import api, { adminService, packageService } from '../../services/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faStore, faTruck, faChartBar } from '@fortawesome/free-solid-svg-icons';
import './AdminDashboard.css';
import SwipeMenuHint from '../../components/SwipeMenuHint.jsx';
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
import { PACKAGE_SUB_TABS } from './dashboard/constants/packageTabs';
import { buildAwbPageHtml, getAwbDocumentHtml, openAndPrintAwbDocument } from './dashboard/utils/awb';
import { createPackageTabActions } from './dashboard/utils/packageTabActions';
import { createPickupActions } from './dashboard/utils/pickupActions';
import { createDetailsActions } from './dashboard/utils/detailsActions';
import { createPackageQueryActions } from './dashboard/utils/packageQueries';
import { createApprovalActions } from './dashboard/utils/approvalActions';
import { createEntityDetailsHandlers } from './dashboard/utils/entityDetailsHandlers';
import { createUserActions } from './dashboard/utils/userActions';
import { createAdminDataLoaders } from './dashboard/utils/adminDataLoaders';
import { createPackageEditorActions } from './dashboard/utils/packageEditorActions';
import { createPackageStatusActions } from './dashboard/utils/packageStatusActions';
import { createPackageDialogActions } from './dashboard/utils/packageDialogActions';
import { createFinanceActions } from './dashboard/utils/financeActions';
import { createOperationsActions } from './dashboard/utils/operationsActions';
import { createDriverAssignmentActions } from './dashboard/utils/driverAssignmentActions';
import { buildAdminTabProps } from './dashboard/utils/tabPropsBuilder';
import { useAdminDashboardEffects } from './dashboard/hooks/useAdminDashboardEffects';
import { useDetailsModalInteractions } from './dashboard/hooks/useDetailsModalInteractions';
import AdminMainContent from './dashboard/tabs/AdminMainContent';
import DashboardFeedbackOverlays from './dashboard/modals/DashboardFeedbackOverlays';
import DashboardModalCluster from './dashboard/modals/DashboardModalCluster';

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

const AdminDashboard = () => {
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
  const [, setShopPackagesWithUnpaidMoney] = useState([]);
  const [shopUnpaidTotal, setShopUnpaidTotal] = useState(0);
  const [showConfirmationDialog, setShowConfirmationDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [statusMessage, setStatusMessage] = useState(null);
  const [confirmationDialogTitle, setConfirmationDialogTitle] = useState('');
  const [confirmationDialogText, setConfirmationDialogText] = useState('');
  const [showWorkingAreaModal, setShowWorkingAreaModal] = useState(false);
  const [selectedDriverForWorkingArea, setSelectedDriverForWorkingArea] = useState(null);
  const [workingAreaInput, setWorkingAreaInput] = useState('');
  const [, setUpdatingWorkingArea] = useState(false);
  const [pickups, setPickups] = useState([]);
  const [pickupLoading] = useState(false);
  const [selectedPickup, setSelectedPickup] = useState(null);
  const [showPickupModal, setShowPickupModal] = useState(false);
  const [pickupPackages, setPickupPackages] = useState([]);
  const [pickupPackagesLoading, setPickupPackagesLoading] = useState(false);
  const [packagesTab, setPackagesTab] = useState('all');
  const [packagesSubTab, setPackagesSubTab] = useState('all'); // New state for sub-sub-tabs
  const [selectedPackages, setSelectedPackages] = useState([]);
  const [showSchedulePickupModal, setShowSchedulePickupModal] = useState(false);
  const [pickupScheduleDate, setPickupScheduleDate] = useState('');
  const [pickupScheduleTime, setPickupScheduleTime] = useState('');
  const [pickupScheduleAddress, setPickupScheduleAddress] = useState('');
  const [schedulingPickup, setSchedulingPickup] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [printingBulkAwb, setPrintingBulkAwb] = useState(false);
  const [showBulkAssignModal, setShowBulkAssignModal] = useState(false);
  const [bulkAssignDriverId, setBulkAssignDriverId] = useState('');
  const [bulkAssigning, setBulkAssigning] = useState(false);
  const [drivers, setDrivers] = useState([]);
  const [showDriverPackages, setShowDriverPackages] = useState(false);
  const [driverPackages, setDriverPackages] = useState([]);
  const [driverPackagesFilter, setDriverPackagesFilter] = useState({ preset: 'today', start: '', end: '' });
  const [selectedDriverForPackages, setSelectedDriverForPackages] = useState(null);
  const [shopsViewTab, setShopsViewTab] = useState('active'); // active | hidden
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
  const [deletingPickup, setDeletingPickup] = useState(false);
  const [shopSort, setShopSort] = useState({ field: 'revenue', order: 'desc' });
  
  // Add state for give money to driver functionality
  const [giveMoneyAmount, setGiveMoneyAmount] = useState('');
  const [giveMoneyReason, setGiveMoneyReason] = useState('');
  const [givingMoney, setGivingMoney] = useState(false);
  // Add state for variable settlement amount popup
  const [showSettleAmountModal, setShowSettleAmountModal] = useState(false);
  const [settleShopId] = useState(null);
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
  
  const {
    fetchUsers,
    fetchDataForActiveTab,
    loadDashboardAnalytics,
    fetchRecentUpdatedPackages,
    fetchDriversForPickups
  } = createAdminDataLoaders({
    adminService,
    sortConfig,
    activeTab,
    packages,
    setLoading,
    setActiveTab,
    setPackagesTab,
    setStats,
    setPackages,
    setMoneyTransactions,
    setPickups,
    setDrivers,
    setUsers,
    setSelectedEntity,
    setShowDetailsModal,
    setAnalytics,
    setDashboardData,
    setRecentUpdatedPackages,
    setRecentUpdatedLoading,
    setAnalyticsLoading
  });

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

  const {
    viewDetails,
    loadShopPackages
  } = createEntityDetailsHandlers({
    adminService,
    packageService,
    setSelectedEntity,
    setShowDetailsModal,
    setShopPackages,
    setShopPackagesWithUnpaidMoney,
    setShopUnpaidTotal,
    setIsLoadingShopPackages
  });

  const detailsHistoryPushed = useRef(false);

  const {
    isMobile,
    detailsModalContentRef,
    onDetailsTouchStart,
    onDetailsTouchMove,
    onDetailsTouchEnd,
    onDetailsTouchCancel
  } = useDetailsModalInteractions({
    showDetailsModal,
    setShowDetailsModal,
    setSelectedEntity,
    setIsEditingPackage,
    detailsHistoryPushedRef: detailsHistoryPushed
  });
  

  const {
    handleDeleteShop,
    handleDeleteDriver,
    closeDetails,
    toTel,
    copyToClipboard,
    shareTracking
  } = createDetailsActions({
    adminService,
    setConfirmationDialogTitle,
    setConfirmationDialogText,
    setConfirmAction,
    setShowDetailsModal,
    setStatusMessage,
    fetchUsers,
    setShowConfirmationDialog,
    setUsers,
    isMobile,
    detailsHistoryPushed,
    setSelectedEntity,
    setIsEditingPackage
  });


  // Add state for server-side package filters
  const [packageStatusFilter, setPackageStatusFilter] = useState('');
  const [packageShopFilter, setPackageShopFilter] = useState('');
  const [availableShops, setAvailableShops] = useState([]);
  const [packagePage, setPackagePage] = useState(1);
  const [packageTotalPages, setPackageTotalPages] = useState(1);
  const [packageTotal, setPackageTotal] = useState(0);
  const searchTimeoutRef = useRef(null);

  // Function to get filtered packages (now just returns packages since filtering is server-side)
  const getFilteredPackages = () => {
    return packages;
  };

  const {
    handleToggleShopVisibility,
    updateDriverWorkingArea,
    openWorkingAreaModal,
    handleSelectAll,
    handleSelectPackage,
    getFilteredUsers
  } = createUserActions({
    adminService,
    users,
    searchTerm,
    activeTab,
    shopsViewTab,
    setUsers,
    setStatusMessage,
    setUpdatingWorkingArea,
    setShowWorkingAreaModal,
    setSelectedDriverForWorkingArea,
    setWorkingAreaInput,
    getFilteredPackages,
    setSelectedPackages
  });

  const {
    fetchPackages,
    fetchPackagesWithFilters,
    fetchAvailableShops,
    handleShopFilterChange,
    handleMainTabChange,
    handleSubTabChange,
    fetchPackagesWithMainTab
  } = createPackageQueryActions({
    adminService,
    packagePage,
    packageStatusFilter,
    packageShopFilter,
    searchTerm,
    packagesTab,
    packagesSubTab,
    setLoading,
    setPackages,
    setPackagePage,
    setPackageTotalPages,
    setPackageTotal,
    setSelectedEntity,
    setShowDetailsModal,
    setPackageShopFilter,
    setPackagesTab,
    setPackagesSubTab,
    PACKAGE_SUB_TABS,
    setAvailableShops
  });

  const {
    openAssignDriverModal,
    assignDriverToPackage
  } = createDriverAssignmentActions({
    adminService,
    selectedPackage,
    setSelectedPackage,
    setDriverSearchTerm,
    setAssigningDriver,
    setAvailableDrivers,
    setShowAssignDriverModal,
    activeTab,
    fetchPackages,
    searchTerm,
    setStatusMessage
  });

  const {
    startEditingPackage,
    savePackageEdits,
    cancelPackageEditing,
    deletePackage,
    addItemToPackage,
    removeItemFromPackage,
    updateItemInPackage
  } = createPackageEditorActions({
    adminService,
    packageService,
    selectedEntity,
    editingPackageData,
    setEditingPackageData,
    setIsEditingPackage,
    setSavingPackage,
    setSelectedEntity,
    setStatusMessage,
    setConfirmationDialogTitle,
    setConfirmationDialogText,
    setConfirmAction,
    setShowConfirmationDialog,
    setShowDetailsModal,
    fetchPackages,
    packagePage,
    searchTerm
  });

  // Function to fetch available shops for filtering

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
      setPackagePage(1);
      fetchPackagesWithFilters(1, newSearchTerm, packageStatusFilter, packageShopFilter);
    }, 500);
  };

  // Print AWB (admin)
  const handlePrintAWB = async (pkg) => {
    try {
      const pageHtml = await buildAwbPageHtml(pkg);
      const docHtml = getAwbDocumentHtml([pageHtml]);
      openAndPrintAwbDocument(docHtml);
    } catch (e) {
      console.error('AWB print error:', e);
      alert('Failed to generate AWB.');
    }
  };

  const [showShippingFeesModal, setShowShippingFeesModal] = useState(false);
  const [pendingShopApproval, setPendingShopApproval] = useState({ id: null, selectedEntity: null });
  const [shippingFeesInput, setShippingFeesInput] = useState('');

  const {
    handleApproval,
    processApproval
  } = createApprovalActions({
    adminService,
    setLoading,
    users,
    setUsers,
    shippingFeesInput,
    activeTab,
    fetchUsers,
    fetchPackages,
    searchTerm,
    setPackages,
    setMoneyTransactions,
    setStats,
    setStatusMessage,
    setShowConfirmationDialog,
    setConfirmationDialogTitle,
    setConfirmationDialogText,
    setConfirmAction,
    setPendingShopApproval,
    setShippingFeesInput,
    setShowShippingFeesModal
  });



  // Pagination for money tab
  const [moneyPage, setMoneyPage] = useState(1);
  const [moneyTotalPages, setMoneyTotalPages] = useState(1);
  const [moneyTotal, setMoneyTotal] = useState(0);

  const {
    handleMoneyFilterChange,
    fetchMoneyTransactions,
    handleSort,
    renderSortIcon,
    handleGiveMoneyToDriver
  } = createFinanceActions({
    adminService,
    moneyFilters,
    setMoneyFilters,
    moneyPage,
    setMoneyPage,
    setMoneyTransactions,
    setMoneyTotalPages,
    setMoneyTotal,
    searchTerm,
    setStatusMessage,
    sortConfig,
    setSortConfig,
    activeTab,
    fetchUsers,
    giveMoneyAmount,
    giveMoneyReason,
    selectedEntity,
    setGivingMoney,
    setGiveMoneyAmount,
    setGiveMoneyReason,
    setStats
  });

  useAdminDashboardEffects({
    activeTab,
    packagesTab,
    packagesSubTab,
    packages,
    sortConfig,
    moneyFilters,
    searchTerm,
    fetchDataForActiveTab,
    setSelectedPackages,
    searchTimeoutRef,
    setPackageStatusFilter,
    setPackageShopFilter,
    setPackagesTab,
    setPackagesSubTab,
    fetchPackagesWithMainTab,
    fetchAvailableShops,
    loadDashboardAnalytics,
    fetchDriversForPickups,
    fetchMoneyTransactions
  });

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

  const {
    forwardPackageStatus,
    rejectPackage,
    forwardPackage
  } = createPackageStatusActions({
    packageService,
    setForwardingPackageId,
    setPackages,
    setSelectedEntity,
    fetchDriverPackages,
    setAdminDeliveryModalPackage,
    setAdminIsPartialDelivery,
    setAdminDeliveredQuantities,
    setAdminPaymentMethodChoice,
    setShowAdminDeliveryModal,
    rejectShippingPaidAmount,
    adminRejectionPaymentMethod,
    adminRejectionDeductShipping,
    fetchPackages,
    packagePage,
    searchTerm,
    setShowRejectPackageModal,
    setRejectShippingPaidAmount,
    setAdminRejectionPaymentMethod,
    setAdminRejectionDeductShipping,
    setPackageToAction,
    setShowDetailsModal,
    setStatusMessage,
    setShowForwardPackageModal
  });

  const {
    handlePartialSettle,
    handleMarkAsReturned
  } = createOperationsActions({
    adminService,
    packageService,
    selectedEntity,
    settleAmountInput,
    shopUnpaidTotal,
    setShopUnpaidTotal,
    setUsers,
    setStatusMessage,
    setSettleAmountInput,
    setPackages,
    fetchPackagesWithMainTab,
    packagesTab,
    packagesSubTab,
    packagePage
  });

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
      if (showSchedulePickupModal) { setShowSchedulePickupModal(false); return; }
      if (showSettleAmountModal) { setShowSettleAmountModal(false); return; }
      if (showPickupModal) { setShowPickupModal(false); return; }
      if (showWorkingAreaModal) { setShowWorkingAreaModal(false); return; }
      if (showShippingFeesModal) { setShowShippingFeesModal(false); return; }
      if (showDetailsModal) { setShowDetailsModal(false); setSelectedEntity(null); return; }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showReturnCompleteDialog, showExchangeCompleteDialog, showConfirmationDialog, showAdminDeliveryModal, showRejectPackageModal, showForwardPackageModal, showAssignPickupDriverModal, showAssignDriverModal, showBulkAssignModal, showSchedulePickupModal, showSettleAmountModal, showPickupModal, showWorkingAreaModal, showShippingFeesModal, showDetailsModal]);

  const {
    handleConfirmDeliveredReturned,
    handleOpenReturnCompleteDialog,
    handleOpenExchangeCompleteDialog,
    handleMoveExchangeToAwaitingReturn,
    handleForwardReturnToPending,
    handleCloseForwardModal,
    handleCloseRejectModal,
    handleConfirmAdminDelivery,
    handleConfirmReturnComplete,
    handleConfirmExchangeComplete,
    handleForwardFromDetails
  } = createPackageDialogActions({
    packageService,
    handleMarkAsReturned,
    setConfirmationDialogTitle,
    setConfirmationDialogText,
    setConfirmAction,
    setShowConfirmationDialog,
    setReturnCompletePkg,
    setReturnDeductShipping,
    setShowReturnCompleteDialog,
    setExchangeCompletePkg,
    setExchangeDeductShipping,
    setShowExchangeCompleteDialog,
    fetchPackagesWithMainTab,
    packagesTab,
    packagesSubTab,
    packagePage,
    setShowForwardPackageModal,
    setPackageToAction,
    setShowRejectPackageModal,
    setRejectShippingPaidAmount,
    setAdminRejectionPaymentMethod,
    setAdminRejectionDeductShipping,
    adminDeliveryModalPackage,
    adminIsPartialDelivery,
    adminDeliveredQuantities,
    adminPaymentMethodChoice,
    setShowAdminDeliveryModal,
    setAdminDeliveryModalPackage,
    returnCompletePkg,
    returnDeductShipping,
    exchangeCompletePkg,
    exchangeDeductShipping,
    setStatusMessage,
    forwardPackageStatus
  });

  const {
    handlePickupClick,
    handleMarkPickupAsPickedUp,
    openAssignPickupDriverModal,
    assignDriverToPickup,
    handleDeletePickup
  } = createPickupActions({
    adminService,
    packageService,
    setSelectedPickup,
    setShowPickupModal,
    setPickupPackagesLoading,
    setPickupPackages,
    setPickupStatusUpdating,
    setPickups,
    fetchPackages,
    searchTerm,
    setStatusMessage,
    setSelectedPickupForDriver,
    setPickupDriverSearchTerm,
    setAssigningPickupDriver,
    setAvailableDrivers,
    setShowAssignPickupDriverModal,
    selectedPickupForDriver,
    setConfirmationDialogTitle,
    setConfirmationDialogText,
    setConfirmAction,
    setDeletingPickup,
    setShowConfirmationDialog
  });

  const {
    handleExportSelectedPackages,
    handlePrintSelectedAwbs,
    openSchedulePickupModal,
    handleScheduleSelectedPickup,
    openBulkAssignModal,
    handleBulkAssign,
    handleBulkForward
  } = createPackageTabActions({
    selectedPackages,
    exportingPdf,
    setExportingPdf,
    api,
    packages,
    printingBulkAwb,
    setPrintingBulkAwb,
    buildAwbPageHtml,
    getAwbDocumentHtml,
    openAndPrintAwbDocument,
    setPickupScheduleAddress,
    setPickupScheduleDate,
    setPickupScheduleTime,
    setShowSchedulePickupModal,
    pickupScheduleDate,
    pickupScheduleTime,
    adminService,
    pickupScheduleAddress,
    setSchedulingPickup,
    setStatusMessage,
    setSelectedPackages,
    fetchPackagesWithMainTab,
    packagesTab,
    packagesSubTab,
    packagePage,
    setPickups,
    setBulkAssignDriverId,
    setBulkAssigning,
    setAvailableDrivers,
    setShowBulkAssignModal,
    bulkAssignDriverId,
    activeTab,
    setPackages,
    packageService,
    fetchPackagesWithFilters,
    searchTerm,
    packageStatusFilter,
    packageShopFilter
  });

  const {
    dashboardHomeProps,
    pickupsProps,
    packagesProps,
    moneyProps,
    usersProps
  } = buildAdminTabProps({
    stats,
    packages,
    users,
    dashboardData,
    analytics,
    analyticsLoading,
    moneyTransactions,
    shopSort,
    setShopSort,
    fetchRecentUpdatedPackages,
    recentUpdatedLoading,
    recentUpdatedPackages,
    viewDetails,
    forwardPackageStatus,
    forwardingPackageId,
    pickupTab,
    setPickupTab,
    pickupLoading,
    pickups,
    searchTerm,
    drivers,
    openAssignPickupDriverModal,
    handleMarkPickupAsPickedUp,
    pickupStatusUpdating,
    handleDeletePickup,
    deletingPickup,
    handlePickupClick,
    packagesTab,
    packagesSubTab,
    selectedPackages,
    schedulingPickup,
    printingBulkAwb,
    handleMainTabChange,
    handleSubTabChange,
    openBulkAssignModal,
    openSchedulePickupModal,
    handleExportSelectedPackages,
    handlePrintSelectedAwbs,
    handleBulkForward,
    filteredPackages: getFilteredPackages(),
    packageShopFilter,
    handleShopFilterChange,
    availableShops,
    handleSelectAll,
    handleSelectPackage,
    handleMarkAsReturned,
    handleConfirmDeliveredReturned,
    handleOpenReturnCompleteDialog,
    handleOpenExchangeCompleteDialog,
    handleMoveExchangeToAwaitingReturn,
    handleForwardReturnToPending,
    packagePage,
    packageTotalPages,
    packageTotal,
    setPackagePage,
    fetchPackagesWithMainTab,
    moneyFilters,
    handleMoneyFilterChange,
    moneyPage,
    moneyTotalPages,
    moneyTotal,
    fetchMoneyTransactions,
    filteredUsers: getFilteredUsers(),
    shopsViewTab,
    setShopsViewTab,
    handleSort,
    renderSortIcon,
    getRoleIcon,
    openWorkingAreaModal,
    handleApproval,
    setAutoScrollToSettle,
    handleToggleShopVisibility
  });

  // Render main dashboard + one-time swipe hint for mobile users
  return (
  <div
      className={`admin-dashboard admin-dashboard-container ${isMenuOpen ? 'menu-open' : 'menu-closed'}`}
      ref={adminContainerRef}
      style={{ paddingTop: 0 }}
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
  <DashboardFeedbackOverlays
    showConfirmationDialog={showConfirmationDialog}
    confirmationDialogTitle={confirmationDialogTitle}
    confirmationDialogText={confirmationDialogText}
    onCloseConfirmation={() => setShowConfirmationDialog(false)}
    onConfirm={() => confirmAction && confirmAction()}
    showForwardPackageModal={showForwardPackageModal}
    showRejectPackageModal={showRejectPackageModal}
    packageToAction={packageToAction}
    onCloseForward={handleCloseForwardModal}
    onForward={() => forwardPackage(packageToAction)}
    rejectShippingPaidAmount={rejectShippingPaidAmount}
    onRejectShippingPaidAmountChange={setRejectShippingPaidAmount}
    adminRejectionPaymentMethod={adminRejectionPaymentMethod}
    onAdminRejectionPaymentMethodChange={setAdminRejectionPaymentMethod}
    adminRejectionDeductShipping={adminRejectionDeductShipping}
    onAdminRejectionDeductShippingChange={setAdminRejectionDeductShipping}
    onCloseReject={handleCloseRejectModal}
    onReject={() => rejectPackage(packageToAction)}
    statusMessage={statusMessage}
    onCloseStatus={() => setStatusMessage(null)}
  />
  <SwipeMenuHint isMenuOpen={isMenuOpen} />
  <DashboardModalCluster
    showAdminDeliveryModal={showAdminDeliveryModal}
    adminDeliveryModalPackage={adminDeliveryModalPackage}
    adminIsPartialDelivery={adminIsPartialDelivery}
    setAdminIsPartialDelivery={setAdminIsPartialDelivery}
    adminPaymentMethodChoice={adminPaymentMethodChoice}
    setAdminPaymentMethodChoice={setAdminPaymentMethodChoice}
    adminDeliveredQuantities={adminDeliveredQuantities}
    setAdminDeliveredQuantities={setAdminDeliveredQuantities}
    setShowAdminDeliveryModal={setShowAdminDeliveryModal}
    handleConfirmAdminDelivery={handleConfirmAdminDelivery}
    showReturnCompleteDialog={showReturnCompleteDialog}
    returnCompletePkg={returnCompletePkg}
    returnDeductShipping={returnDeductShipping}
    setReturnDeductShipping={setReturnDeductShipping}
    setShowReturnCompleteDialog={setShowReturnCompleteDialog}
    setReturnCompletePkg={setReturnCompletePkg}
    handleConfirmReturnComplete={handleConfirmReturnComplete}
    showExchangeCompleteDialog={showExchangeCompleteDialog}
    exchangeCompletePkg={exchangeCompletePkg}
    exchangeDeductShipping={exchangeDeductShipping}
    setExchangeDeductShipping={setExchangeDeductShipping}
    setShowExchangeCompleteDialog={setShowExchangeCompleteDialog}
    setExchangeCompletePkg={setExchangeCompletePkg}
    handleConfirmExchangeComplete={handleConfirmExchangeComplete}
    showSchedulePickupModal={showSchedulePickupModal}
    packages={packages}
    selectedPackages={selectedPackages}
    pickupScheduleAddress={pickupScheduleAddress}
    setPickupScheduleAddress={setPickupScheduleAddress}
    pickupScheduleDate={pickupScheduleDate}
    setPickupScheduleDate={setPickupScheduleDate}
    pickupScheduleTime={pickupScheduleTime}
    setPickupScheduleTime={setPickupScheduleTime}
    schedulingPickup={schedulingPickup}
    handleScheduleSelectedPickup={handleScheduleSelectedPickup}
    setShowSchedulePickupModal={setShowSchedulePickupModal}
    showShippingFeesModal={showShippingFeesModal}
    shippingFeesInput={shippingFeesInput}
    setShippingFeesInput={setShippingFeesInput}
    pendingShopApproval={pendingShopApproval}
    setPendingShopApproval={setPendingShopApproval}
    processApproval={processApproval}
    setShowShippingFeesModal={setShowShippingFeesModal}
    showDetailsModal={showDetailsModal}
    selectedEntity={selectedEntity}
    isMobile={isMobile}
    detailsModalContentRef={detailsModalContentRef}
    onDetailsTouchStart={onDetailsTouchStart}
    onDetailsTouchMove={onDetailsTouchMove}
    onDetailsTouchEnd={onDetailsTouchEnd}
    onDetailsTouchCancel={onDetailsTouchCancel}
    closeDetails={closeDetails}
    getRoleIcon={getRoleIcon}
    handlePrintAWB={handlePrintAWB}
    loadingShopStats={loadingShopStats}
    shopStats={shopStats}
    adjustTotalCollectedInput={adjustTotalCollectedInput}
    setAdjustTotalCollectedInput={setAdjustTotalCollectedInput}
    adjustTotalCollectedReason={adjustTotalCollectedReason}
    setAdjustTotalCollectedReason={setAdjustTotalCollectedReason}
    adjustingTotalCollected={adjustingTotalCollected}
    setAdjustingTotalCollected={setAdjustingTotalCollected}
    setStatusMessage={setStatusMessage}
    setSelectedEntity={setSelectedEntity}
    settlementRef={settlementRef}
    settleAmountInput={settleAmountInput}
    setSettleAmountInput={setSettleAmountInput}
    handlePartialSettle={handlePartialSettle}
    loadShopPackages={loadShopPackages}
    isLoadingShopPackages={isLoadingShopPackages}
    shopPackages={shopPackages}
    shopUnpaidTotal={shopUnpaidTotal}
    viewDetails={viewDetails}
    handleDeleteShop={handleDeleteShop}
    setSelectedDriverForPackages={setSelectedDriverForPackages}
    fetchDriverPackages={fetchDriverPackages}
    setActiveTab={setActiveTab}
    setShowDetailsModal={setShowDetailsModal}
    setConfirmationDialogTitle={setConfirmationDialogTitle}
    setConfirmationDialogText={setConfirmationDialogText}
    setConfirmAction={setConfirmAction}
    setDrivers={setDrivers}
    setShowConfirmationDialog={setShowConfirmationDialog}
    giveMoneyAmount={giveMoneyAmount}
    setGiveMoneyAmount={setGiveMoneyAmount}
    giveMoneyReason={giveMoneyReason}
    setGiveMoneyReason={setGiveMoneyReason}
    handleGiveMoneyToDriver={handleGiveMoneyToDriver}
    givingMoney={givingMoney}
    handleDeleteDriver={handleDeleteDriver}
    isEditingPackage={isEditingPackage}
    startEditingPackage={startEditingPackage}
    deletePackage={deletePackage}
    savePackageEdits={savePackageEdits}
    savingPackage={savingPackage}
    cancelPackageEditing={cancelPackageEditing}
    editingPackageData={editingPackageData}
    setEditingPackageData={setEditingPackageData}
    addItemToPackage={addItemToPackage}
    updateItemInPackage={updateItemInPackage}
    removeItemFromPackage={removeItemFromPackage}
    editingNotes={editingNotes}
    setEditingNotes={setEditingNotes}
    notesSaving={notesSaving}
    setNotesSaving={setNotesSaving}
    setNotesError={setNotesError}
    notesError={notesError}
    drivers={drivers}
    copyToClipboard={copyToClipboard}
    shareTracking={shareTracking}
    toTel={toTel}
    openAssignDriverModal={openAssignDriverModal}
    forwardingPackageId={forwardingPackageId}
    handleForwardFromDetails={handleForwardFromDetails}
    setPackageToAction={setPackageToAction}
    setRejectShippingPaidAmount={setRejectShippingPaidAmount}
    setShowRejectPackageModal={setShowRejectPackageModal}
    showAssignDriverModal={showAssignDriverModal}
    setShowAssignDriverModal={setShowAssignDriverModal}
    selectedPackage={selectedPackage}
    availableDrivers={availableDrivers}
    driverSearchTerm={driverSearchTerm}
    setDriverSearchTerm={setDriverSearchTerm}
    assigningDriver={assigningDriver}
    assignDriverToPackage={assignDriverToPackage}
    showPickupModal={showPickupModal}
    selectedPickup={selectedPickup}
    pickupPackagesLoading={pickupPackagesLoading}
    pickupPackages={pickupPackages}
    setShowPickupModal={setShowPickupModal}
    showAssignPickupDriverModal={showAssignPickupDriverModal}
    selectedPickupForDriver={selectedPickupForDriver}
    pickupDriverSearchTerm={pickupDriverSearchTerm}
    setPickupDriverSearchTerm={setPickupDriverSearchTerm}
    assignDriverToPickup={assignDriverToPickup}
    assigningPickupDriver={assigningPickupDriver}
    setShowAssignPickupDriverModal={setShowAssignPickupDriverModal}
    showBulkAssignModal={showBulkAssignModal}
    bulkAssignDriverId={bulkAssignDriverId}
    setBulkAssignDriverId={setBulkAssignDriverId}
    bulkAssigning={bulkAssigning}
    handleBulkAssign={handleBulkAssign}
    setShowBulkAssignModal={setShowBulkAssignModal}
    showDriverPackages={showDriverPackages}
    selectedDriverForPackages={selectedDriverForPackages}
    driverPackages={driverPackages}
    forwardPackageStatus={forwardPackageStatus}
    setShowDriverPackages={setShowDriverPackages}
    activeTab={activeTab}
    driverPackagesFilter={driverPackagesFilter}
    setDriverPackagesFilter={setDriverPackagesFilter}
    showSettleAmountModal={showSettleAmountModal}
    settleShopId={settleShopId}
    setShowSettleAmountModal={setShowSettleAmountModal}
    showWorkingAreaModal={showWorkingAreaModal}
    selectedDriverForWorkingArea={selectedDriverForWorkingArea}
    workingAreaInput={workingAreaInput}
    setWorkingAreaInput={setWorkingAreaInput}
    updateDriverWorkingArea={updateDriverWorkingArea}
    setShowWorkingAreaModal={setShowWorkingAreaModal}
  />
  <AdminMainContent
    activeTab={activeTab}
    setActiveTab={setActiveTab}
    setIsMenuOpen={setIsMenuOpen}
    searchTerm={searchTerm}
    handleSearchChange={handleSearchChange}
    setSearchTerm={setSearchTerm}
    loading={loading}
    dashboardHomeProps={dashboardHomeProps}
    pickupsProps={pickupsProps}
    packagesProps={packagesProps}
    moneyProps={moneyProps}
    usersProps={usersProps}
  />
    </div>
  );
};

export default AdminDashboard;
