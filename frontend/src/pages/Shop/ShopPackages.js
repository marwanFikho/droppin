import React, { useState, useEffect } from 'react';
import { packageService } from '../../services/api';
import { useLocation } from 'react-router-dom';
import QRCode from 'qrcode';
import { notification } from 'antd';
import { formatEnglishWithArabic } from '../../utils/arabicTransliteration';
import ReactDOM from 'react-dom'; // Add import for createPortal
import { useTranslation } from 'react-i18next';

const TABS = [
  { value: 'all' },
  { value: 'awaiting_schedule' },
  { value: 'scheduled_for_pickup' },
  { value: 'pending' },
  { value: 'in-transit' },
  { value: 'delivered' },
  { value: 'return-to-shop' },
  { value: 'return-requests' },
  { value: 'exchange-requests' },
  { value: 'pickups' },
];

const inTransitStatuses = ['assigned', 'pickedup', 'in-transit'];
const returnToShopStatuses = [
  'cancelled-awaiting-return',
  'cancelled-returned',
  'rejected-awaiting-return',
  'rejected-returned',
  'return-requested',
	'return-in-transit',
	'return-pending',
	'return-completed'
];

const exchangeRequestStatuses = [
  'exchange-awaiting-schedule',
  'exchange-awaiting-pickup',
  'exchange-in-process',
  'exchange-in-transit',
  'exchange-awaiting-return',
  'exchange-returned',
  'exchange-cancelled'
];

export function getStatusBadge(status) {
  let className = 'badge rounded-pill';
  if (['awaiting_schedule', 'scheduled_for_pickup', 'awaiting_pickup'].includes(status)) className += ' bg-primary-subtle text-primary-emphasis';
  else if (['pending'].includes(status)) className += ' bg-warning-subtle text-warning-emphasis';
  else if (['assigned', 'pickedup', 'in-transit'].includes(status)) className += ' bg-info-subtle text-info-emphasis';
  else if (['delivered', 'delivered-returned'].includes(status)) className += ' bg-success-subtle text-success-emphasis';
  else if (['cancelled', 'cancelled-awaiting-return', 'cancelled-returned'].includes(status)) className += ' bg-danger-subtle text-danger-emphasis';
  else className += ' bg-secondary-subtle text-secondary-emphasis';
  return <span className={className}>{status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ').replace('-', ' ')}</span>;
}

export function getCodBadge(isPaid) {
  return isPaid
    ? <span className="badge bg-success-subtle text-success-emphasis">Paid</span>
    : <span className="badge bg-danger-subtle text-danger-emphasis">Unpaid</span>;
}

function getPickupStatusBadge(status) {
  let colorClass = 'badge rounded-pill';
  if (status === 'pending' || status === 'scheduled') colorClass += ' bg-warning-subtle text-warning-emphasis';
  else if (status === 'completed' || status === 'pickedup') colorClass += ' bg-success-subtle text-success-emphasis';
  else colorClass += ' bg-secondary-subtle text-secondary-emphasis';
  return <span className={colorClass}>{status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}</span>;
}

const ShopPackages = () => {
  const { t } = useTranslation();
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth <= 768 : false);
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [packageToCancel, setPackageToCancel] = useState(null);
  const [cancelError, setCancelError] = useState(null);
  const [pickups, setPickups] = useState([]);
  const [pickupLoading, setPickupLoading] = useState(false);
  const [showPickupModal, setShowPickupModal] = useState(false);
  const [, setSelectedPickup] = useState(null);
  const [pickupPackages, setPickupPackages] = useState([]);
  const [pickupPackagesLoading, setPickupPackagesLoading] = useState(false);
  const [showPickupCancelModal, setShowPickupCancelModal] = useState(false);
  const [pickupToCancel, setPickupToCancel] = useState(null);
  const [pickupCancelError, setPickupCancelError] = useState(null);
  const [showPackageDetailsModal, setShowPackageDetailsModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [selectedPackages, setSelectedPackages] = useState([]);
  const [shopFees, setShopFees] = useState({ shownShippingFees: null, shippingFees: null });
  const [editingShownDeliveryCost, setEditingShownDeliveryCost] = useState(false);
  const [newShownDeliveryCost, setNewShownDeliveryCost] = useState('');
  const [savingShownDeliveryCost, setSavingShownDeliveryCost] = useState(false);
  const [shownDeliveryCostError, setShownDeliveryCostError] = useState('');
  const location = useLocation();

  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnItems, setReturnItems] = useState({});
  const [returnRefund, setReturnRefund] = useState('');
  const [returnError, setReturnError] = useState('');
  const [requestingReturn, setRequestingReturn] = useState(false);

  const [showExchangeModal, setShowExchangeModal] = useState(false);
  const [takeItems, setTakeItems] = useState([{ description: '', quantity: 1 }]);
  const [giveItems, setGiveItems] = useState([{ description: '', quantity: 1 }]);
  const [moneyType, setMoneyType] = useState('give'); // 'give' | 'take'
  const [moneyAmount, setMoneyAmount] = useState('');
  const [exchangeError, setExchangeError] = useState('');
  const [requestingExchange, setRequestingExchange] = useState(false);

  // Editing package details (pre-pending only)
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [editDescription, setEditDescription] = useState('');
  const [editRecipientName, setEditRecipientName] = useState('');
  const [editRecipientPhone, setEditRecipientPhone] = useState('');
  const [editStreet, setEditStreet] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editState, setEditState] = useState('');
  const [editZip, setEditZip] = useState('');
  const [editCountry, setEditCountry] = useState('');
  const [editWeight, setEditWeight] = useState('');
  const [editLen, setEditLen] = useState('');
  const [editWid, setEditWid] = useState('');
  const [editHei, setEditHei] = useState('');
  const [editPriority, setEditPriority] = useState('normal');
  const [editType, setEditType] = useState('new');
  const [editSchedulePickupTime, setEditSchedulePickupTime] = useState('');
  const [saveDetailsError, setSaveDetailsError] = useState('');
  const [savingDetails, setSavingDetails] = useState(false);
  const [editItems, setEditItems] = useState([]);
  const [editShopNotes, setEditShopNotes] = useState('');

  const prePendingStatuses = ['awaiting_schedule', 'scheduled_for_pickup'];
  const canEditThisPackage = (pkg) => prePendingStatuses.includes((pkg?.status || '').toLowerCase());

  function parseAddressToFields(addr) {
    if (!addr || typeof addr !== 'string') {
      return { street: '', city: '', state: '', zipCode: '', country: '' };
    }
    // Expected format: "street, city, state zipCode, country" (best-effort)
    const parts = addr.split(',').map(s => s.trim());
    const street = parts[0] || '';
    const cityAndState = parts[1] || '';
    let city = cityAndState;
    let state = '';
    let zipCode = '';
    if (parts.length >= 3) {
      // If format actually was street, city, state zip, country
      city = parts[1] || '';
      const stateZipStr = parts[2] || '';
      const sz = stateZipStr.split(' ').filter(Boolean);
      state = sz[0] || '';
      zipCode = sz[1] || '';
    }
    const country = parts[3] || parts[2] || '';
    return { street, city, state, zipCode, country };
  }

  function openEditDetails(pkg) {
    setSaveDetailsError('');
    setIsEditingDetails(true);
    setEditDescription(pkg.packageDescription || '');
    setEditRecipientName(pkg.deliveryContactName || '');
    setEditRecipientPhone(pkg.deliveryContactPhone || '');
    const a = parseAddressToFields(pkg.deliveryAddress);
    setEditStreet(a.street);
    setEditCity(a.city);
    setEditState(a.state);
    setEditZip(a.zipCode);
    setEditCountry(a.country);
    setEditWeight(pkg.weight != null ? String(pkg.weight) : '');
    setEditPriority(pkg.priority || 'normal');
    setEditType(pkg.type || 'new');
    setEditLen(''); setEditWid(''); setEditHei('');
    setEditSchedulePickupTime('');
    setEditItems(Array.isArray(pkg.Items) ? pkg.Items.map(it => ({ description: it.description || '', quantity: it.quantity || 1, codPerUnit: it.codAmount && it.quantity ? (parseFloat(it.codAmount)/parseInt(it.quantity)).toFixed(2) : '0' })) : []);
    setEditShopNotes(pkg.shopNotes || '');
  }

  async function saveEditedDetails() {
    if (!selectedPackage) return;
    setSavingDetails(true);
    setSaveDetailsError('');
    try {
      const payload = {};
      if (editDescription !== '') payload.packageDescription = editDescription;
      if (editWeight !== '') payload.weight = parseFloat(editWeight);
      if (editLen && editWid && editHei) {
        payload.dimensions = { length: editLen, width: editWid, height: editHei };
      }
      // Delivery address and contacts
      payload.deliveryAddress = {
        street: editStreet,
        city: editCity,
        state: editState,
        zipCode: editZip,
        country: editCountry,
        contactName: editRecipientName,
        contactPhone: editRecipientPhone
      };
      if (editPriority) payload.priority = editPriority;
      if (editType) payload.type = editType;
      if (editSchedulePickupTime) payload.schedulePickupTime = editSchedulePickupTime;
      // Items
      if (Array.isArray(editItems)) {
        payload.items = editItems.map(it => ({
          description: it.description,
          quantity: parseInt(it.quantity) || 1,
          codPerUnit: parseFloat(it.codPerUnit) || 0
        }));
      }
      // Shop notes
      if (editShopNotes !== '') payload.shopNotes = editShopNotes;

      await packageService.updatePackage(selectedPackage.id, payload);
      // Refresh to reflect changes simply
      localStorage.setItem('reopenPackageModal', selectedPackage.id);
      window.location.reload();
    } catch (e) {
      setSaveDetailsError(e.response?.data?.message || e.message || 'Failed to save changes.');
    } finally {
      setSavingDetails(false);
    }
  }

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    const fetchPackages = async () => {
      setLoading(true);
      try {
        // Fetch all packages (remove 25-items cap)
        const res = await packageService.getPackages({ page: 1, limit: 10000 });
        setPackages(res.data?.packages || res.data || []);
        
        // Check if we need to reopen a package modal after refresh
        const reopenPackageId = localStorage.getItem('reopenPackageModal');
        if (reopenPackageId) {
          const packageToReopen = (res.data?.packages || res.data || []).find(pkg => String(pkg.id) === String(reopenPackageId));
          if (packageToReopen) {
            const _normalized = (() => {
              let d = packageToReopen.deliveredItems ?? packageToReopen.delivereditems ?? null;
              if (typeof d === 'string') { try { d = JSON.parse(d); } catch { d = null; } }
              if (!Array.isArray(d)) d = [];
              return { ...packageToReopen, deliveredItems: d };
            })();
            setSelectedPackage(_normalized);
            setShowPackageDetailsModal(true);
          }
          localStorage.removeItem('reopenPackageModal');
        }
      } catch (err) {
        setError('Failed to load packages.');
      } finally {
        setLoading(false);
      }
    };
    fetchPackages();
  }, []);

  useEffect(() => {
    // Set tab from query param if present
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab && TABS.some(t => t.value === tab)) {
      setActiveTab(tab);
    }
  }, [location.search]);

  useEffect(() => {
    async function fetchShopFees() {
      try {
        const profileRes = await packageService.getShopProfile();
        setShopFees({
          shownShippingFees: profileRes.data?.shownShippingFees,
          shippingFees: profileRes.data?.shippingFees,
          businessName: profileRes.data?.businessName || profileRes.data?.shop?.businessName || '-'
        });
      } catch (err) {
        setShopFees({ shownShippingFees: null, shippingFees: null });
      }
    }
    fetchShopFees();
  }, []);

  useEffect(() => {
    if (activeTab === 'pickups') {
      setPickupLoading(true);
      packageService.getShopPickups()
        .then(res => {
          setPickups(res.data);
        })
        .catch(() => setError('Failed to load pickups.'))
        .finally(() => setPickupLoading(false));
    }
  }, [activeTab]);

  // Add/remove modal-open class to body when any modal is open to prevent scrolling
  useEffect(() => {
    const isAnyModalOpen = showCancelModal || showPickupModal || showPickupCancelModal || 
                           showPackageDetailsModal || showReturnModal || showExchangeModal;
    
    if (isAnyModalOpen) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    
    // Cleanup function to remove class when component unmounts
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [showCancelModal, showPickupModal, showPickupCancelModal, showPackageDetailsModal, showReturnModal, showExchangeModal]);

  // ESC-to-close: close the top-most open modal on this page
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key !== 'Escape') return;
      if (showPickupCancelModal) { setShowPickupCancelModal(false); return; }
      if (showPickupModal) { setShowPickupModal(false); return; }
      if (showExchangeModal) { setShowExchangeModal(false); return; }
      if (showReturnModal) { setShowReturnModal(false); return; }
      if (showCancelModal) { setShowCancelModal(false); setCancelError(null); return; }
      if (showPackageDetailsModal) { setShowPackageDetailsModal(false); return; }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showPickupCancelModal, showPickupModal, showExchangeModal, showReturnModal, showCancelModal, showPackageDetailsModal]);

  const handleCancel = async () => {
    if (!packageToCancel) return;
    try {
      const response = await packageService.cancelPackage(packageToCancel.id);
      // Update the package status based on the response from the backend
      // The backend will set it to 'cancelled-awaiting-return' for packages that need to be returned
      const updatedStatus = response.data?.package?.status || 'cancelled';
      setPackages(prev => prev.map(p => p.id === packageToCancel.id ? { ...p, status: updatedStatus } : p));
      setShowCancelModal(false);
      setPackageToCancel(null);
      setCancelError(null);
    } catch (err) {
      setCancelError(err.response?.data?.message || 'Failed to cancel package.'); 
    }
  };

  const handlePickupClick = async (pickup) => {
    setSelectedPickup(pickup);
    setShowPickupModal(true);
    setPickupPackagesLoading(true);
    try {
      // Get all packages for this pickup
      const res = await packageService.getPickupById(pickup.id);
      if (res.data.Packages) {
        setPickupPackages(res.data.Packages);
      } else {
        setPickupPackages([]);
      }
    } catch {
      setPickupPackages([]);
    } finally {
      setPickupPackagesLoading(false);
    }
  };

  const handleCancelPickup = async () => {
    if (!pickupToCancel) return;
    try {
      await packageService.cancelPickup(pickupToCancel.id);
      setPickups(prev => prev.map(p => p.id === pickupToCancel.id ? { ...p, status: 'cancelled' } : p));
      setShowPickupCancelModal(false);
      setPickupToCancel(null);
      setPickupCancelError(null);
    } catch (err) {
      setPickupCancelError(err.response?.data?.message || 'Failed to cancel pickup.');
    }
  };

  const filterPackages = () => {
    let filtered = [...packages];

    // Filter by search term
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(pkg => 
        pkg.trackingNumber?.toLowerCase().includes(searchLower) ||
        pkg.packageDescription?.toLowerCase().includes(searchLower) ||
        pkg.deliveryContactName?.toLowerCase().includes(searchLower) ||
        pkg.status?.toLowerCase().includes(searchLower) ||
        pkg.User?.name?.toLowerCase().includes(searchLower) ||
        pkg.Shop?.businessName?.toLowerCase().includes(searchLower)
      );
    }

    // Filter by active tab
    if (activeTab === 'all') {
      return filtered;
    } else if (activeTab === 'in-transit') {
      return filtered.filter(pkg => inTransitStatuses.includes(pkg.status));
    } else if (activeTab === 'return-to-shop') {
      return filtered.filter(pkg => returnToShopStatuses.includes(pkg.status));
    } else if (activeTab === 'cancelled') {
      // Show all cancelled-related statuses in the Cancelled tab
      return filtered.filter(pkg => ['cancelled', 'cancelled-awaiting-return', 'cancelled-returned'].includes(pkg.status));
    } else if (activeTab === 'rejected') {
      return filtered.filter(pkg => ['rejected', 'rejected-awaiting-return', 'rejected-returned'].includes(pkg.status));
    } else if (activeTab === 'pickups') {
      return filtered; // This will be handled by the pickups tab
    } else if (activeTab === 'delivered') {
      return filtered.filter(pkg => pkg.status === 'delivered' || pkg.status === 'delivered-returned')
        .slice()
        .sort((a, b) => {
          const aTime = a.actualDeliveryTime ? new Date(a.actualDeliveryTime).getTime() : 0;
          const bTime = b.actualDeliveryTime ? new Date(b.actualDeliveryTime).getTime() : 0;
          return bTime - aTime;
        });
    } else if (activeTab === 'return-requests') {
      // Show delivered packages that have return requests
      return filtered.filter(pkg => 
        pkg.status === 'delivered' && 
        Array.isArray(pkg.returnDetails) && 
        pkg.returnDetails.length > 0
      );
    } else if (activeTab === 'exchange-requests') {
      // Show only exchange-request workflow packages (exclude delivered tab packages)
      return filtered.filter(pkg => 
        exchangeRequestStatuses.includes(pkg.status)
      );
    } else {
      return filtered.filter(pkg => pkg.status === activeTab);
    }
  };

  const normalizeDelivered = (pkg) => {
    if (!pkg) return pkg;
    let delivered = pkg.deliveredItems ?? pkg.delivereditems ?? null;
    if (typeof delivered === 'string') {
      try { delivered = JSON.parse(delivered); } catch { delivered = null; }
    }
    if (!Array.isArray(delivered)) delivered = [];
    return { ...pkg, deliveredItems: delivered };
  };

  const openDetailsModal = (pkg) => {
    setSelectedPackage(normalizeDelivered(pkg));
    setShowPackageDetailsModal(true);
  };

  const handlePrintAWB = async (pkg) => {
    // Fetch full package with Items if not present
    let packageForAwb = pkg;
    try {
      if (!pkg?.Items || !Array.isArray(pkg.Items)) {
        const resp = await packageService.getPackageById(pkg.id);
        if (resp && resp.data) {
          packageForAwb = resp.data;
        }
      }
    } catch (e) {
      // If fetch fails, fall back to passed pkg
    }

    // Generate QR code as data URL
    const qrDataUrl = await QRCode.toDataURL((packageForAwb.trackingNumber || pkg.trackingNumber) || '');
    // Logo path (now in public directory)
    const logoUrl = window.location.origin + '/assets/images/logo.jpg';
    console.log('DEBUG: logoUrl', logoUrl);
    const awbPkg = packageForAwb || pkg;
    // Calculate values
    const cod = parseFloat((awbPkg.codAmount != null ? awbPkg.codAmount : pkg.codAmount) || 0);
    const isShopify = (awbPkg.shopifyOrderId !== undefined && awbPkg.shopifyOrderId !== null && awbPkg.shopifyOrderId !== '');
    const itemsSum = (Array.isArray(awbPkg.Items) && awbPkg.Items.length > 0)
      ? awbPkg.Items.reduce((s, it) => s + (parseFloat(it.codAmount || 0) || 0), 0)
      : cod;
    let shippingValue = (awbPkg.shownDeliveryCost !== undefined && awbPkg.shownDeliveryCost !== null && awbPkg.shownDeliveryCost !== '')
      ? Number(awbPkg.shownDeliveryCost)
      : ((shopFees.shownShippingFees !== undefined && shopFees.shownShippingFees !== null && shopFees.shownShippingFees !== '')
        ? Number(shopFees.shownShippingFees)
        : Number(shopFees.shippingFees));
    if (!Number.isFinite(shippingValue) || shippingValue < 0) shippingValue = 0;
    
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
    const [shopNameDisplay, recipientNameDisplay, addressDisplay] = await Promise.all([
      formatEnglishWithArabic(shopFees.businessName || '-'),
      formatEnglishWithArabic(awbPkg.deliveryContactName || '-'),
      formatEnglishWithArabic(awbPkg.deliveryAddress || '-')
    ]);
    // Build content depending on package type
    const isExchange = (awbPkg.type === 'exchange');
    // Normalize exchange details
    const exch = awbPkg.exchangeDetails || {};
    const takeItems = Array.isArray(exch.takeItems) ? exch.takeItems : [];
    const giveItems = Array.isArray(exch.giveItems) ? exch.giveItems : [];
    const cd = exch.cashDelta || {};
    const moneyAmount = Number.parseFloat(cd.amount || 0) || 0;
    const moneyType = cd.type || null; // 'take' | 'give' | null
    const moneyLabel = moneyType === 'give' ? 'Give to customer' : (moneyType === 'take' ? 'Take from customer' : 'Money');
    const shippingDisplay = Number(awbPkg.shownDeliveryCost ?? awbPkg.deliveryCost ?? shippingValue) || 0;

    const itemsSectionDefault = `
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
            <div class="awb-section">
              <b>Payment Method:</b> COD
            </div>
            <div class="awb-section" style="display:flex;justify-content:flex-end;">
              <table class="awb-info-table" style="width:300px;">
                ${totalsRows}
              </table>
            </div>`;

    const itemsSectionExchange = `
            <div class="awb-section">
              <table class="awb-table">
                <thead>
                  <tr><th colspan="2">Items to take from customer</th></tr>
                </thead>
                <tbody>
                  ${
                    takeItems.length > 0
                      ? takeItems.map(it => `
                          <tr>
                            <td>${(it.description || '-')}</td>
                            <td>Qty: ${(parseInt(it.quantity) || 0)}</td>
                          </tr>
                        `).join('')
                      : `<tr><td colspan="2">None</td></tr>`
                  }
                </tbody>
              </table>
              <table class="awb-table" style="margin-top:12px;">
                <thead>
                  <tr><th colspan="2">Items to give to customer</th></tr>
                </thead>
                <tbody>
                  ${
                    giveItems.length > 0
                      ? giveItems.map(it => `
                          <tr>
                            <td>${(it.description || '-')}</td>
                            <td>Qty: ${(parseInt(it.quantity) || 0)}</td>
                          </tr>
                        `).join('')
                      : `<tr><td colspan="2">None</td></tr>`
                  }
                </tbody>
              </table>
            </div>
            <div class="awb-section" style="display:flex;justify-content:flex-end;">
              <table class="awb-info-table" style="width:360px;">
                <tr><td>${moneyLabel}:</td><td>EGP ${moneyAmount.toFixed(2)}</td></tr>
                <tr><td>Shipping Fees:</td><td>EGP ${shippingDisplay.toFixed(2)}</td></tr>
              </table>
            </div>`;

    // Build AWB HTML
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
                  <div class="awb-shop-name">Shop Name: ${shopNameDisplay}</div>
                </td>
                  <td><b>Date:</b> ${awbPkg.createdAt ? new Date(awbPkg.createdAt).toLocaleDateString() : '-'}</td>
                </tr>
                <tr>
                  <td colspan="2">
                    <span class="awb-row"><b class="awb-recipient">Recipient: ${recipientNameDisplay}</b></span><br/>
                    <span class="awb-row"><b class="awb-phone">Phone: ${awbPkg.deliveryContactPhone || '-'}</b></span><br/>
                    <span class="awb-row"><b class="awb-address">Address: ${addressDisplay}</b></span>
                    ${isShopify ? `<div><b>Shopify Order:</b> ${awbPkg.shopifyOrderName || awbPkg.shopifyOrderId}</div>` : ''}
                  </td>
                </tr>
              </table>
            </div>
            <div class="awb-section">
              <b>Description:</b> ${awbPkg.packageDescription || '-'}
            </div>
            ${awbPkg.shopNotes ? `<div class="awb-section"><b>Shop Notes:</b> ${awbPkg.shopNotes}</div>` : ''}
            ${isExchange ? itemsSectionExchange : itemsSectionDefault}
            <div class="awb-footer">Thank you for your order!</div>
          </div>
        </body>
      </html>
    `;
    // Open new tab and write AWB HTML
    const printWindow = window.open('', '_blank');
    printWindow.document.open();
    printWindow.document.write(awbHtml);
    printWindow.document.close();
  };

  const allSelectablePackages = filterPackages().filter(pkg =>
    pkg.status !== 'cancelled' && pkg.status !== 'delivered' && pkg.status !== 'cancelled-returned' && pkg.status !== 'cancelled-awaiting-return' && pkg.status !== 'rejected'
  );
  const allSelected = allSelectablePackages.length > 0 && allSelectablePackages.every(pkg => selectedPackages.includes(pkg.id));
  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedPackages([]);
    } else {
      setSelectedPackages(allSelectablePackages.map(pkg => pkg.id));
    }
  };
  const toggleSelectPackage = (id) => {
    setSelectedPackages(prev =>
      prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]
    );
  };
  const handleBulkPrintAWB = async () => {
    const pkgsToPrint = packages.filter(pkg => selectedPackages.includes(pkg.id));
    if (pkgsToPrint.length === 0) return;

    const awbSections = [];
    for (let i = 0; i < pkgsToPrint.length; i++) {
      const pkg = pkgsToPrint[i];
      const logoUrl = window.location.origin + '/assets/images/logo.jpg';

      // Ensure we have Items data
      let packageData = pkg;
      try {
        if (!pkg?.Items || !Array.isArray(pkg.Items)) {
          const resp = await packageService.getPackageById(pkg.id);
          if (resp && resp.data) packageData = resp.data;
        }
      } catch (e) {
        // fallback silently
      }

      const qrDataUrl = await QRCode.toDataURL((packageData.trackingNumber || pkg.trackingNumber) || '');

      const cod = parseFloat((packageData.codAmount != null ? packageData.codAmount : pkg.codAmount) || 0);
      const isShopify = (packageData.shopifyOrderId !== undefined && packageData.shopifyOrderId !== null && packageData.shopifyOrderId !== '');
      const itemsSum = (Array.isArray(packageData.Items) && packageData.Items.length > 0)
        ? packageData.Items.reduce((s, it) => s + (parseFloat(it.codAmount || 0) || 0), 0)
        : cod;
      let shippingValue = (packageData.shownDeliveryCost !== undefined && packageData.shownDeliveryCost !== null && packageData.shownDeliveryCost !== '')
        ? Number(packageData.shownDeliveryCost)
        : ((shopFees.shownShippingFees !== undefined && shopFees.shownShippingFees !== null && shopFees.shownShippingFees !== '')
          ? Number(shopFees.shownShippingFees)
          : Number(shopFees.shippingFees));
      if (!Number.isFinite(shippingValue) || shippingValue < 0) shippingValue = 0;

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

      const [shopNameDisplay, packageRecipientDisplay, packageAddressDisplay] = await Promise.all([
        formatEnglishWithArabic(shopFees.businessName || '-'),
        formatEnglishWithArabic(packageData.deliveryContactName || '-'),
        formatEnglishWithArabic(packageData.deliveryAddress || '-')
      ]);
      const breakStyle = (i < pkgsToPrint.length - 1) ? 'page-break-after: always; break-after: page;' : '';

      const isExchange = (packageData.type === 'exchange');
      const exch = packageData.exchangeDetails || {};
      const takeItems = Array.isArray(exch.takeItems) ? exch.takeItems : [];
      const giveItems = Array.isArray(exch.giveItems) ? exch.giveItems : [];
      const cd = exch.cashDelta || {};
      const moneyAmount = Number.parseFloat(cd.amount || 0) || 0;
      const moneyType = cd.type || null;
      const moneyLabel = moneyType === 'give' ? 'Give to customer' : (moneyType === 'take' ? 'Take from customer' : 'Money');
      const shippingDisplay = Number(packageData.shownDeliveryCost ?? packageData.deliveryCost ?? shippingValue) || 0;

      const itemsSectionDefault = `
          <table class="awb-table">
            <thead>
              <tr><th>Item</th><th>Qty</th><th>COD Per Unit</th><th>Total COD</th></tr>
            </thead>
            <tbody>
              ${
                packageData.Items && packageData.Items.length > 0
                  ? packageData.Items.map(item => `
                    <tr>
                      <td>${item.description || '-'}</td>
                      <td>${item.quantity}</td>
                      <td>${item.codAmount && item.quantity ? (item.codAmount / item.quantity).toFixed(2) : '0.00'} EGP</td>
                      <td>${parseFloat(item.codAmount || 0).toFixed(2)} EGP</td>
                    </tr>
                  `).join('')
                  : `<tr>
                      <td>${packageData.packageDescription || '-'}</td>
                      <td>${packageData.itemsNo ?? 1}</td>
                      <td>${cod.toFixed(2)} EGP</td>
                      <td>${cod.toFixed(2)} EGP</td>
                    </tr>`
              }
            </tbody>
          </table>
          <div class="awb-section">
            <b>Payment Method:</b> COD
          </div>
          <div class="awb-section" style="display:flex;justify-content:flex-end;">
            <table class="awb-info-table" style="width:300px;">
              ${totalsRows}
            </table>
          </div>`;

      const itemsSectionExchange = `
          <div class="awb-section">
            <table class="awb-table">
              <thead>
                <tr><th colspan="2">Items to take from customer</th></tr>
              </thead>
              <tbody>
                ${
                  takeItems.length > 0
                    ? takeItems.map(it => `
                        <tr>
                          <td>${(it.description || '-')}</td>
                          <td>Qty: ${(parseInt(it.quantity) || 0)}</td>
                        </tr>
                      `).join('')
                    : `<tr><td colspan="2">None</td></tr>`
                }
              </tbody>
            </table>
            <table class="awb-table" style="margin-top:12px;">
              <thead>
                <tr><th colspan="2">Items to give to customer</th></tr>
              </thead>
              <tbody>
                ${
                  giveItems.length > 0
                    ? giveItems.map(it => `
                        <tr>
                          <td>${(it.description || '-')}</td>
                          <td>Qty: ${(parseInt(it.quantity) || 0)}</td>
                        </tr>
                      `).join('')
                    : `<tr><td colspan="2">None</td></tr>`
                }
              </tbody>
            </table>
          </div>
          <div class="awb-section" style="display:flex;justify-content:flex-end;">
            <table class="awb-info-table" style="width:360px;">
              <tr><td>${moneyLabel}:</td><td>EGP ${moneyAmount.toFixed(2)}</td></tr>
              <tr><td>Shipping Fees:</td><td>EGP ${shippingDisplay.toFixed(2)}</td></tr>
            </table>
          </div>`;

      awbSections.push(`
        <div class="awb-container" style="${breakStyle}">
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
                  <span class="awb-row"><b class="awb-tracking">Tracking #:</b><span class="awb-tracking awb-data">${packageData.trackingNumber || pkg.trackingNumber || '-'}</span></span>
                  <div class="awb-shop-name">Shop Name: ${shopNameDisplay}</div>
                </td>
                <td><b>Date:</b> ${packageData.createdAt ? new Date(packageData.createdAt).toLocaleDateString() : (pkg.createdAt ? new Date(pkg.createdAt).toLocaleDateString() : '-')}</td>
              </tr>
              <tr>
                <td colspan="2">
                  <span class="awb-row"><b class="awb-recipient">Recipient:</b><span class="awb-recipient awb-data">${packageRecipientDisplay}</span></span><br/>
                  <span class="awb-row"><b class="awb-phone">Phone:</b><span class="awb-phone awb-data">${packageData.deliveryContactPhone || '-'}</span></span><br/>
                  <span class="awb-row"><b class="awb-address">Address:</b><span class="awb-address awb-data">${packageAddressDisplay}</span></span>
                </td>
              </tr>
            </table>
          </div>
          <div class="awb-section">
            <b>Description:</b> ${packageData.packageDescription || '-'}
          </div>
          ${packageData.shopNotes ? `<div class="awb-section"><b>Shop Notes:</b> ${packageData.shopNotes}</div>` : ''}
          ${isExchange ? itemsSectionExchange : itemsSectionDefault}
          <div class="awb-footer">Thank you for your order!</div>
        </div>
      `);
    }

    const fullHtml = `
      <html>
        <head>
          <title>Droppin Bulk AWB</title>
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
            @media print {
              .awb-container { page-break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          ${awbSections.join('\n')}
          <script>
            (function(){
              function deferPrint(){
                try { window.focus(); } catch(e) {}
                setTimeout(function(){ try { window.print(); } catch(e) {} }, 50);
              }
              function onReady(){
                var imgs = Array.prototype.slice.call(document.images || []);
                var pending = imgs.filter(function(img){ return !img.complete; });
                if (pending.length === 0) return deferPrint();
                var done = 0;
                pending.forEach(function(img){
                  var mark = function(){ done++; if (done === pending.length) deferPrint(); };
                  img.addEventListener('load', mark);
                  img.addEventListener('error', mark);
                });
              }
              if (document.readyState === 'complete') { onReady(); }
              else { window.addEventListener('load', onReady); }
            })();
          </script>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(fullHtml);
      printWindow.document.close();
    }
  };

  const addRow = (setter) => setter(prev => [...prev, { description: '', quantity: 1 }]);
  const updateRow = (setter, idx, key, value) => setter(prev => prev.map((r, i) => i === idx ? { ...r, [key]: value } : r));
  const removeRow = (setter, idx) => setter(prev => prev.filter((_, i) => i !== idx));

  // Simple validation helpers for enabling submit
  const hasValidItems = (arr) => Array.isArray(arr) && arr.some(r => (r.description || '').trim() !== '' && (parseInt(r.quantity) || 0) > 0);
  const canSubmitExchange = hasValidItems(takeItems) || hasValidItems(giveItems) || (moneyAmount !== '' && Number.isFinite(parseFloat(moneyAmount)) && parseFloat(moneyAmount) >= 0);

  const submitExchangeRequest = async () => {
    if (!selectedPackage) return;
    setRequestingExchange(true);
    setExchangeError('');
    try {
      const payload = {
        takeItems: takeItems.filter(r => (r.description || '').trim() !== '' && (parseInt(r.quantity) || 0) > 0).map(r => ({ description: r.description.trim(), quantity: parseInt(r.quantity) || 1 })),
        giveItems: giveItems.filter(r => (r.description || '').trim() !== '' && (parseInt(r.quantity) || 0) > 0).map(r => ({ description: r.description.trim(), quantity: parseInt(r.quantity) || 1 })),
        cashDelta: parseFloat(moneyAmount || 0) || 0,
        moneyType
      };
      await packageService.requestExchange(selectedPackage.id, payload);
      setShowExchangeModal(false);
      setShowPackageDetailsModal(false);
      setSelectedPackage(null);
      setTakeItems([{ description: '', quantity: 1 }]);
      setGiveItems([{ description: '', quantity: 1 }]);
      setMoneyAmount('');
      setMoneyType('give');
      notification.success({ message: 'Exchange requested', description: 'Exchange request submitted successfully!', placement: 'topRight', duration: 3 });
      try {
        const res = await packageService.getPackages({ limit: 10000 });
        setPackages(res.data.packages || res.data || []);
      } catch (e) {}
      setTimeout(() => {
        try { window.location.reload(); } catch (_) {}
      }, 800);
    } catch (err) {
      setExchangeError(err.response?.data?.message || t('shop.packages.errors.exchangeFailed'));
      notification.error({ message: t('shop.packages.notifications.exchangeFailedTitle'), description: err.response?.data?.message || t('shop.packages.errors.exchangeFailed'), placement: 'topRight', duration: 4 });
    } finally {
      setRequestingExchange(false);
    }
  };

  const submitReturnRequest = async () => {
    if (!selectedPackage) return;
    setRequestingReturn(true);
    setReturnError('');
    try {
      const payload = {
        items: Object.entries(returnItems).map(([itemId, details]) => ({
          itemId: Number(itemId),
          quantity: details.quantity
        })),
        refundAmount: parseFloat(returnRefund) || 0
      };
      await packageService.requestReturn(selectedPackage.id, payload);
      setShowReturnModal(false);
      setShowPackageDetailsModal(false);
      setSelectedPackage(null);
      setReturnItems({});
      setReturnRefund('');
      setReturnError('');
      notification.success({ message: t('shop.packages.notifications.returnRequestedTitle'), description: t('shop.packages.notifications.returnRequestedDescription'), placement: 'topRight', duration: 3 });
      // Refresh list without full page reload
      // Prefer staying on the same tab
      try {
        // Refresh with full list for accuracy
        const res = await packageService.getPackages({ page: 1, limit: 10000 });
        setPackages(res.data?.packages || res.data || []);
      } catch (e) {
        // Silent fallback
      }
      // Ensure UI reflects latest state; fallback to a hard refresh shortly after
      setTimeout(() => {
        try { window.location.reload(); } catch (_) {}
      }, 800);
    } catch (err) {
      setReturnError(err.response?.data?.message || t('shop.packages.errors.returnFailed'));
      notification.error({ message: t('shop.packages.notifications.returnFailedTitle'), description: err.response?.data?.message || t('shop.packages.errors.returnFailed'), placement: 'topRight', duration: 4 });
    } finally {
      setRequestingReturn(false);
    }
  };

  return (
    <div className="container-fluid px-3 px-md-4 py-4" style={{ maxWidth: '1400px' }}>
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2 mb-3">
        <h2 className="h4 fw-bold mb-0">{t('shop.packages.title')}</h2>
        <button
          className="btn btn-primary"
          onClick={() => window.open('/shop/packages/bulk-import', '_blank')}
          style={{ whiteSpace: 'nowrap' }}
        >
          {t('shop.packages.actions.importExcel')}
        </button>
      </div>
      {/* Print AWB for selected packages button at the top */}
      {selectedPackages.length > 0 && (
        <button className="btn btn-primary mb-3" onClick={handleBulkPrintAWB}>
          {t('shop.packages.actions.printAwbSelected', { count: selectedPackages.length })}
        </button>
      )}
      <div className="rounded-4 shadow-sm p-3 mb-3" style={{ background: '#fffaf5' }}>
        <div className="position-relative mb-2">
          {isMobile && (
            <>
              <div className="position-absolute top-0 start-0 h-100" style={{ width: '20px', background: 'linear-gradient(90deg, #fffaf5 10%, rgba(255,250,245,0))', pointerEvents: 'none', zIndex: 2 }} />
              <div className="position-absolute top-0 end-0 h-100" style={{ width: '24px', background: 'linear-gradient(270deg, #fffaf5 10%, rgba(255,250,245,0))', pointerEvents: 'none', zIndex: 2 }} />
            </>
          )}
          <div
            className={isMobile ? 'd-flex flex-nowrap gap-2 overflow-auto pb-1' : 'd-flex flex-wrap gap-2'}
            style={isMobile ? { scrollbarWidth: 'thin' } : undefined}
          >
            {TABS.map(tab => (
              <button
                key={tab.value}
                className={activeTab === tab.value ? 'btn btn-primary btn-sm' : 'btn btn-outline-secondary btn-sm'}
                onClick={() => setActiveTab(tab.value)}
                style={isMobile ? { whiteSpace: 'nowrap', flex: '0 0 auto' } : undefined}
              >
                {t(`shop.packages.tabs.${tab.value}`)}
              </button>
            ))}
          </div>
        </div>
        <input
          className="form-control"
          type="text"
          placeholder={t('shop.packages.searchPlaceholder')}
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>
      {activeTab === 'pickups' ? (
        pickupLoading ? (
          <div>{t('shop.packages.loadingPickups')}</div>
        ) : pickups.length === 0 ? (
          <div>{t('shop.packages.emptyPickups')}</div>
        ) : (
          <div className="table-responsive rounded-4 shadow-sm p-2" style={{ background: '#fffaf5' }}>
            <table className="table align-middle mb-0">
              <thead>
                <tr>
                  <th>{t('shop.packages.pickups.pickupDate')}</th>
                  <th>{t('shop.packages.pickups.address')}</th>
                  <th>{t('shop.packages.pickups.status')}</th>
                  <th>{t('shop.packages.pickups.action')}</th>
                </tr>
              </thead>
              <tbody>
                {pickups.map(pickup => (
                  <tr key={pickup.id}>
                    <td>{new Date(pickup.scheduledTime).toLocaleString()}</td>
                    <td>{pickup.pickupAddress}</td>
                    <td>{getPickupStatusBadge(pickup.status)}</td>
                    <td>
                      <div className="d-flex gap-2 flex-wrap">
                      <button className="btn btn-primary btn-sm" onClick={() => handlePickupClick(pickup)}>
                        {t('shop.packages.actions.viewPackages')}
                      </button>
                      {pickup.status === 'scheduled' && (
                        <button className="btn btn-danger btn-sm" onClick={() => { setPickupToCancel(pickup); setShowPickupCancelModal(true); }}>
                          {t('shop.packages.actions.cancel')}
                        </button>
                      )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : loading ? (
        <div>{t('shop.packages.loadingPackages')}</div>
      ) : error ? (
        <div className="alert alert-danger">{error}</div>
      ) : (
        <>
          {showCancelModal && (
            <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3" style={{ zIndex: 1200, backgroundColor: 'rgba(0,0,0,0.35)' }} onClick={() => { setShowCancelModal(false); setCancelError(null); }}>
              <div className="bg-white rounded-4 shadow p-4" style={{ width: '100%', maxWidth: '460px' }} onClick={e => e.stopPropagation()}>
                <h3 className="h5 fw-bold mb-2">{t('shop.packages.modals.cancelPackage.title')}</h3>
                <p className="mb-3">{t('shop.packages.modals.cancelPackage.confirm')}</p>
                {cancelError && <div style={{color:'#dc3545',marginBottom:'0.5rem'}}>{cancelError}</div>}
                <div className="d-flex justify-content-end gap-2">
                  <button className="btn btn-outline-secondary" onClick={() => { setShowCancelModal(false); setCancelError(null); }}>{t('shop.packages.actions.no')}</button>
                  <button className="btn btn-danger" onClick={handleCancel}>{t('shop.packages.actions.yesCancel')}</button>
                </div>
              </div>
            </div>
          )}
          {isMobile ? (
            <div className="rounded-4 shadow-sm p-3" style={{ background: '#fffaf5' }}>
              {filterPackages().length === 0 ? (
                <div style={{textAlign:'center', padding: '2rem', color: '#888'}}>{t('shop.packages.emptyPackages')}</div>
              ) : (
                <>
                  {allSelectablePackages.length > 0 && (
                    <div style={{ 
                      background: '#f8f9fa', 
                      padding: '10px 12px', 
                      borderRadius: '6px', 
                      marginBottom: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      border: '1px solid #e9ecef'
                    }}>
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={toggleSelectAll}
                        style={{ width: '16px', height: '16px' }}
                      />
                      <span style={{ fontSize: '12px', fontWeight: '600', color: '#495057' }}>
                        {allSelected ? t('shop.packages.actions.deselectAll') : t('shop.packages.actions.selectAll')} ({allSelectablePackages.length})
                      </span>
                    </div>
                  )}
                  <div className="row g-3">
                    {filterPackages().map(pkg => (
                    <div
                      key={pkg.id}
                      className="col-12"
                      role="button"
                      tabIndex={0}
                      onClick={() => openDetailsModal(pkg)}
                      onKeyDown={(e) => { if (e.key === 'Enter') openDetailsModal(pkg); }}
                    >
                      <div className="card border-0 shadow-sm rounded-4 h-100">
                      <div className="card-body">
                      <div className="d-flex justify-content-between align-items-start gap-2">
                        <span className="fw-semibold text-dark small">{pkg.trackingNumber || t('shop.packages.na')}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>{getStatusBadge(pkg.status)}</span>
                          <input
                            type="checkbox"
                            checked={selectedPackages.includes(pkg.id)}
                            onChange={(e) => {
                              e.stopPropagation();
                              toggleSelectPackage(pkg.id);
                            }}
                            disabled={pkg.status === 'cancelled' || pkg.status === 'delivered' || pkg.status === 'cancelled-returned' || pkg.status === 'cancelled-awaiting-return' || pkg.status === 'rejected'}
                            style={{ width: '16px', height: '16px' }}
                          />
                        </div>
                      </div>
                      <div className="fw-semibold mt-2">{pkg.packageDescription || t('shop.packages.noDescription')}</div>
                      <div className="text-secondary small mt-1">{pkg.deliveryAddress || t('shop.packages.noAddress')}</div>
                      {(pkg.deliveryContactName || pkg.deliveryContactPhone) && (
                        <div className="text-muted small mt-1">
                          {pkg.deliveryContactName || t('shop.packages.na')}{pkg.deliveryContactPhone ? ` · ${pkg.deliveryContactPhone}` : ''}
                        </div>
                      )}
                      <div className="d-flex justify-content-between align-items-center mt-3 pt-2 border-top">
                        <span className="small fw-semibold">EGP {parseFloat(pkg.codAmount || 0).toFixed(2)} {getCodBadge(pkg.isPaid)}</span>
                        <span className="text-muted small">{new Date(pkg.createdAt).toLocaleDateString()}</span>
                      </div>
                      {activeTab === 'return-requests' && (
                        <div style={{ marginTop: '4px' }}>
                          <span className="special-badge" style={{background: '#f55247', color: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '10px'}}>{t('shop.packages.badges.returnRequest')}</span>
                        </div>
                      )}
                      {activeTab === 'exchange-requests' && (
                        <div style={{ marginTop: '4px' }}>
                          <span className="special-badge" style={{background: '#7b1fa2', color: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '10px'}}>{t('shop.packages.badges.exchangeRequest')}</span>
                        </div>
                      )}
                      {activeTab !== 'cancelled' && activeTab !== 'return-to-shop' && pkg.status !== 'cancelled' && pkg.status !== 'delivered' && pkg.status !== 'delivered-returned' && pkg.status !== 'cancelled-returned' && pkg.status !== 'cancelled-awaiting-return' && pkg.status !== 'rejected' && pkg.status !== 'rejected-awaiting-return' && pkg.status !== 'rejected-returned' && pkg.status !== 'return-requested' && pkg.status !== 'return-in-transit' && pkg.status !== 'return-pending' && pkg.status !== 'return-completed' && (
                        <div style={{ marginTop: '6px', borderTop: '1px solid #eee', paddingTop: '6px' }}>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPackageToCancel(pkg);
                              setShowCancelModal(true);
                            }}
                            style={{ fontSize: '11px', padding: '4px 8px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px' }}
                          >
                            {t('shop.packages.actions.cancel')}
                          </button>
                        </div>
                      )}
                      </div>
                      </div>
                    </div>
                  ))}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="table-responsive rounded-4 shadow-sm p-2" style={{ background: '#fffaf5' }}>
              <table className="table align-middle mb-0">
                <thead>
                  <tr>
                    <th>
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={toggleSelectAll}
                      />
                    </th>
                    <th>{t('shop.packages.table.trackingNumber')}</th>
                    <th>{t('shop.packages.table.description')}</th>
                    <th>{t('shop.packages.table.recipient')}</th>
                    <th>{t('shop.packages.table.status')}</th>
                    <th>{t('shop.packages.table.cod')}</th>
                    <th>{t('shop.packages.table.date')}</th>
                    {activeTab !== 'cancelled' && activeTab !== 'return-to-shop' && <th>{t('shop.packages.table.actions')}</th>}
                  </tr>
                </thead>
                <tbody>
                  {filterPackages().length === 0 ? (
                    <tr><td colSpan={8} style={{textAlign:'center'}}>{t('shop.packages.emptyPackages')}</td></tr>
                  ) : filterPackages().map(pkg => (
                    <tr key={pkg.id} style={{cursor:'pointer'}} onClick={e => {
                      if (e.target.closest('button') || e.target.type === 'checkbox') return;
                      openDetailsModal(pkg);
                    }}>
                      <td data-label="Select">
                        <input
                          type="checkbox"
                          checked={selectedPackages.includes(pkg.id)}
                          onChange={() => toggleSelectPackage(pkg.id)}
                          disabled={pkg.status === 'cancelled' || pkg.status === 'delivered' || pkg.status === 'cancelled-returned' || pkg.status === 'cancelled-awaiting-return' || pkg.status === 'rejected'}
                        />
                      </td>
                      <td className="fw-semibold" data-label="Tracking #">{pkg.trackingNumber}</td>
                      <td data-label="Description">
                        <div className="fw-semibold">{pkg.packageDescription}</div>
                        <div className="text-secondary small mt-1">{pkg.deliveryAddress}</div>
                        {(pkg.deliveryContactName || pkg.deliveryContactPhone) && (
                          <div className="text-muted small mt-1">
                            {pkg.deliveryContactName || t('shop.packages.na')}{pkg.deliveryContactPhone ? ` · ${pkg.deliveryContactPhone}` : ''}
                          </div>
                        )}
                      </td>
                      <td data-label="Recipient">{pkg.deliveryContactName}</td>
                      <td data-label="Status">
                        {getStatusBadge(pkg.status)}
                        {activeTab === 'return-requests' && (
                          <span className="special-badge" style={{background: '#f55247', marginLeft: '5px'}}>{t('shop.packages.badges.return')}</span>
                        )}
                        {activeTab === 'exchange-requests' && (
                          <span className="special-badge" style={{background: '#7b1fa2', marginLeft: '5px'}}>{t('shop.packages.badges.exchange')}</span>
                        )}
                      </td>
                      <td data-label="COD">
                        <span className="fw-semibold">EGP {parseFloat(pkg.codAmount || 0).toFixed(2)}</span>{' '}
                        {getCodBadge(pkg.isPaid)}
                      </td>
                      <td className="text-muted" data-label="Date">{new Date(pkg.createdAt).toLocaleDateString()}</td>
                      {activeTab !== 'cancelled' && (
                        <td data-label="Actions">
                          {pkg.status !== 'cancelled' && pkg.status !== 'delivered' && pkg.status !== 'delivered-returned' && pkg.status !== 'cancelled-returned' && pkg.status !== 'cancelled-awaiting-return' && pkg.status !== 'rejected' && pkg.status !== 'rejected-awaiting-return' && pkg.status !== 'rejected-returned' && pkg.status !== 'return-requested' && pkg.status !== 'return-in-transit' && pkg.status !== 'return-pending' && pkg.status !== 'return-completed' &&(
                            <>
                              <button
                                className="btn btn-sm btn-outline-danger"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPackageToCancel(pkg);
                                  setShowCancelModal(true);
                                }}
                              >
                                {t('shop.packages.actions.cancel')}
                              </button>

                            </>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
      {/* Pickup Modal - always render so it works in any tab */}
      {showPickupModal && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3" style={{ zIndex: 1200, backgroundColor: 'rgba(0,0,0,0.35)' }} onClick={() => setShowPickupModal(false)}>
          <div className="bg-white rounded-4 shadow p-4" style={{ width: '100%', maxWidth: '560px' }} onClick={e => e.stopPropagation()}>
            <h3 className="h5 fw-bold mb-3">{t('shop.packages.modals.pickupPackages.title')}</h3>
            {pickupPackagesLoading ? (
              <div>{t('shop.packages.loadingPackages')}</div>
            ) : pickupPackages.length === 0 ? (
              <div>{t('shop.packages.modals.pickupPackages.empty')}</div>
            ) : (
              <ul style={{paddingLeft:0}}>
                {pickupPackages.map(pkg => (
                  <li key={pkg.id} style={{marginBottom:'0.5rem',listStyle:'none'}}>
                    <b>{pkg.trackingNumber}</b> - {pkg.packageDescription}
                  </li>
                ))}
              </ul>
            )}
            <button className="btn btn-outline-secondary mt-3" onClick={() => setShowPickupModal(false)}>{t('shop.packages.actions.close')}</button>
          </div>
        </div>
      )}
      {/* Pickup Cancel Modal */}
      {showPickupCancelModal && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3" style={{ zIndex: 1200, backgroundColor: 'rgba(0,0,0,0.35)' }} onClick={() => { setShowPickupCancelModal(false); setPickupCancelError(null); }}>
          <div className="bg-white rounded-4 shadow p-4" style={{ width: '100%', maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
            <h3 className="h5 fw-bold mb-2">{t('shop.packages.modals.cancelPickup.title')}</h3>
            <p className="mb-3">{t('shop.packages.modals.cancelPickup.confirm')}</p>
            {pickupCancelError && <div style={{color:'#dc3545',marginBottom:'0.5rem'}}>{pickupCancelError}</div>}
            <div className="d-flex justify-content-end gap-2">
              <button className="btn btn-outline-secondary" onClick={() => { setShowPickupCancelModal(false); setPickupCancelError(null); }}>{t('shop.packages.actions.no')}</button>
              <button className="btn btn-danger" onClick={handleCancelPickup}>{t('shop.packages.actions.yesCancel')}</button>
            </div>
          </div>
        </div>
      )}
      {/* Package Details Modal */}
      {showPackageDetailsModal && selectedPackage && ReactDOM.createPortal(
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3" style={{ zIndex: 1200, backgroundColor: 'rgba(0,0,0,0.4)' }} onClick={() => setShowPackageDetailsModal(false)}>
          <div className="bg-white rounded-4 shadow p-3 p-md-4" style={{ width: 'min(1100px, 96vw)', maxHeight: '92vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
              <h2 className="h5 fw-bold mb-0">{t('shop.packages.modals.packageDetails.title')}</h2>
              <div className="d-flex align-items-center gap-2">
              {canEditThisPackage(selectedPackage) && !isEditingDetails && (
                <button className="btn btn-primary" onClick={() => openEditDetails(selectedPackage)}>
                  {t('shop.packages.actions.edit')}
                </button>
              )}
              <button className="btn btn-outline-secondary" onClick={() => handlePrintAWB(selectedPackage)}>
                {t('shop.packages.actions.printAwb')}
              </button>
              <button className="btn btn-outline-secondary" onClick={() => setShowPackageDetailsModal(false)}>&times;</button>
              </div>
            </div>
            <div>
              
              {isEditingDetails && (
                <div className="edit-details-panel" style={{ border: '1px solid #eaeaea', borderRadius: 12, padding: '1rem', marginBottom: '1rem', background: '#ffffff', boxShadow: '0 1px 2px rgba(16,24,40,0.06)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <h4 style={{ margin: 0, fontSize: '1.1rem' }}>Edit Package (pre-pickup)</h4>
                    <span style={{ fontSize: 12, background: '#eef2ff', color: '#3949ab', padding: '4px 8px', borderRadius: 999 }}>Awaiting pickup</span>
                  </div>
                  {saveDetailsError && <div style={{ color: '#dc3545', marginBottom: 10, background:'#fdecea', border: '1px solid #f5c2c7', padding: '8px 10px', borderRadius: 8 }}>{saveDetailsError}</div>}

                  {/* General */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', background:'#fafafa', border:'1px solid #f1f1f1', borderRadius: 10, padding: 12, marginBottom: 12 }}>
                    <div>
                      <label style={{ display:'block', fontSize:12, color:'#555', marginBottom:4 }}>Description</label>
                      <input type="text" value={editDescription} onChange={e => setEditDescription(e.target.value)} style={{ width:'100%' }} />
                    </div>
                    <div>
                      <label style={{ display:'block', fontSize:12, color:'#555', marginBottom:4 }}>Priority</label>
                      <select value={editPriority} onChange={e => setEditPriority(e.target.value)} style={{ width:'100%' }}>
                        <option value="normal">Normal</option>
                        <option value="express">Express</option>
                        <option value="same-day">Same Day</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display:'block', fontSize:12, color:'#555', marginBottom:4 }}>Type</label>
                      <select value={editType} onChange={e => setEditType(e.target.value)} style={{ width:'100%' }}>
                        <option value="new">New Package</option>
                        <option value="return">Return</option>
                        <option value="exchange">Exchange</option>
                      </select>
                    </div>
                  </div>

                  {/* Recipient & Address */}
                  <div style={{ background:'#fafafa', border:'1px solid #f1f1f1', borderRadius: 10, padding: 12, marginBottom: 12 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                      <div>
                        <label style={{ display:'block', fontSize:12, color:'#555', marginBottom:4 }}>Recipient Name</label>
                        <input type="text" value={editRecipientName} onChange={e => setEditRecipientName(e.target.value)} style={{ width:'100%' }} />
                      </div>
                      <div>
                        <label style={{ display:'block', fontSize:12, color:'#555', marginBottom:4 }}>Recipient Phone</label>
                        <input type="tel" value={editRecipientPhone} onChange={e => setEditRecipientPhone(e.target.value.replace(/[^0-9]/g, ''))} style={{ width:'100%' }} />
                      </div>
                      <div>
                        <label style={{ display:'block', fontSize:12, color:'#555', marginBottom:4 }}>Street</label>
                        <input type="text" value={editStreet} onChange={e => setEditStreet(e.target.value)} style={{ width:'100%' }} />
                      </div>
                      <div>
                        <label style={{ display:'block', fontSize:12, color:'#555', marginBottom:4 }}>City</label>
                        <input type="text" value={editCity} onChange={e => setEditCity(e.target.value)} style={{ width:'100%' }} />
                      </div>
                      <div>
                        <label style={{ display:'block', fontSize:12, color:'#555', marginBottom:4 }}>State</label>
                        <input type="text" value={editState} onChange={e => setEditState(e.target.value)} style={{ width:'100%' }} />
                      </div>
                      <div>
                        <label style={{ display:'block', fontSize:12, color:'#555', marginBottom:4 }}>Zip Code</label>
                        <input type="text" value={editZip} onChange={e => setEditZip(e.target.value)} style={{ width:'100%' }} />
                      </div>
                      <div>
                        <label style={{ display:'block', fontSize:12, color:'#555', marginBottom:4 }}>Country</label>
                        <input type="text" value={editCountry} onChange={e => setEditCountry(e.target.value)} style={{ width:'100%' }} />
                      </div>
                    </div>
                  </div>

                  {/* Dimensions & Weight + Schedule */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: 12 }}>
                    <div style={{ background:'#fafafa', border:'1px solid #f1f1f1', borderRadius: 10, padding: 12 }}>
                      <label style={{ display:'block', fontSize:12, color:'#555', marginBottom:6 }}>Weight (kg)</label>
                      <input type="number" step="0.01" value={editWeight} onChange={e => setEditWeight(e.target.value)} style={{ width:'100%', marginBottom: 8 }} />
                      <label style={{ display:'block', fontSize:12, color:'#555', marginBottom:6 }}>Dimensions (L × W × H)</label>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <input type="number" placeholder="L" value={editLen} onChange={e => setEditLen(e.target.value)} style={{ width: '33%' }} />
                        <input type="number" placeholder="W" value={editWid} onChange={e => setEditWid(e.target.value)} style={{ width: '33%' }} />
                        <input type="number" placeholder="H" value={editHei} onChange={e => setEditHei(e.target.value)} style={{ width: '33%' }} />
                      </div>
                    </div>
                    <div style={{ background:'#fafafa', border:'1px solid #f1f1f1', borderRadius: 10, padding: 12 }}>
                      <label style={{ display:'block', fontSize:12, color:'#555', marginBottom:6 }}>Schedule Pickup Time</label>
                      <input type="datetime-local" value={editSchedulePickupTime} onChange={e => setEditSchedulePickupTime(e.target.value)} style={{ width:'100%' }} />
                    </div>
                  </div>

                  {/* Items */}
                  <div style={{ background:'#fafafa', border:'1px solid #f1f1f1', borderRadius: 10, padding: 12, marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                      <h5 style={{ margin: 0 }}>Items</h5>
                      <button className="btn btn-info text-white" onClick={() => setEditItems(prev => [...prev, { description: '', quantity: 1, codPerUnit: '0' }])}>Add Item</button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {editItems.map((it, idx) => (
                        <div key={idx} style={{ border:'1px solid #eaeaea', borderRadius: 10, padding: 10, background:'#fff', boxShadow:'0 1px 1px rgba(16,24,40,0.04)' }}>
                          <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr auto', gap: 8, alignItems:'center' }}>
                            <input type="text" placeholder="Description" value={it.description} onChange={e => setEditItems(prev => prev.map((p,i)=> i===idx?{...p, description: e.target.value}:p))} />
                            <input type="number" placeholder="Qty" min="1" value={it.quantity} onChange={e => setEditItems(prev => prev.map((p,i)=> i===idx?{...p, quantity: e.target.value}:p))} />
                            <input type="number" placeholder="COD / unit" step="0.01" value={it.codPerUnit} onChange={e => setEditItems(prev => prev.map((p,i)=> i===idx?{...p, codPerUnit: e.target.value}:p))} />
                            <button className="btn btn-danger" onClick={() => setEditItems(prev => prev.filter((_,i)=> i!==idx))}>Remove</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Returned Items (view only) */}
                  {Array.isArray(selectedPackage.returnDetails) && selectedPackage.returnDetails.length > 0 && (
                    <div style={{ background:'#fafafa', border:'1px solid #f1f1f1', borderRadius: 10, padding: 12, marginBottom: 12 }}>
                      <h5 style={{ margin: 0 }}>Returned Items ({selectedPackage.returnDetails.length})</h5>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                        {selectedPackage.returnDetails.map((it, idx) => (
                          <div key={idx} style={{ display:'flex', justifyContent:'space-between', background:'#fff', border:'1px solid #eaeaea', borderRadius: 8, padding: '8px 10px' }}>
                            <span>{it.description || `Item ${it.itemId}`}</span>
                            <span>Qty: {it.quantity}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {(selectedPackage.returnRefundAmount !== null && selectedPackage.returnRefundAmount !== undefined) && (
                    <div style={{ background:'#fafafa', border:'1px solid #f1f1f1', borderRadius: 10, padding: 12, marginBottom: 12 }}>
                      <div style={{ display:'flex', justifyContent:'space-between' }}>
                        <span style={{ fontWeight: 600 }}>Return Refund Amount</span>
                        <span>EGP {parseFloat(selectedPackage.returnRefundAmount || 0).toFixed(2)}</span>
                      </div>
                    </div>
                  )}

                  {/* Shop Notes */}
                  <div style={{ background:'#fafafa', border:'1px solid #f1f1f1', borderRadius: 10, padding: 12 }}>
                    <label style={{ display:'block', fontSize:12, color:'#555', marginBottom:6 }}>Shop Notes</label>
                    <textarea rows={3} value={editShopNotes} onChange={e => setEditShopNotes(e.target.value)} style={{ width: '100%' }} />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: 12 }}>
                    <button className="btn btn-outline-secondary" onClick={() => setIsEditingDetails(false)} disabled={savingDetails}>Cancel</button>
                    <button className="btn btn-success" onClick={saveEditedDetails} disabled={savingDetails}>{savingDetails ? 'Saving...' : 'Save'}</button>
                  </div>
                </div>
              )}

              {!isEditingDetails && (
                <div className="row g-3">
                  <div className="col-md-6">
                    <span className="small text-muted d-block">Tracking #</span>
                    <span>{selectedPackage.trackingNumber}</span>
                  </div>
                  {selectedPackage.shopifyOrderId && (
                    <div className="col-md-6">
                      <span className="small text-muted d-block">Shopify Order</span>
                      <span>{selectedPackage.shopifyOrderName}</span>
                    </div>
                  )}
                  <div className="col-md-6">
                    <span className="small text-muted d-block">Status</span>
                    <span>{getStatusBadge(selectedPackage.status)}</span>
                  </div>
                  <div className="col-md-6">
                    <span className="small text-muted d-block">Created</span>
                    <span>{new Date(selectedPackage.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="col-12">
                    <span className="small text-muted d-block">Description</span>
                    <span>{selectedPackage.packageDescription || 'No description'}</span>
                  </div>
                  <div className="col-md-6">
                    <span className="small text-muted d-block">Recipient</span>
                    <span>{selectedPackage.deliveryContactName || 'N/A'}</span>
                  </div>
                  {selectedPackage.deliveryContactPhone && (
                    <div className="col-md-6">
                      <span className="small text-muted d-block">Recipient Phone</span>
                      <span>{selectedPackage.deliveryContactPhone}</span>
                    </div>
                  )}
                  {selectedPackage.deliveryAddress && (
                    <div className="col-12">
                      <span className="small text-muted d-block">Delivery Address</span>
                      <span>{selectedPackage.deliveryAddress}</span>
                    </div>
                  )}
                  <div className="col-md-6">
                    <span className="small text-muted d-block">COD</span>
                    <span>EGP {parseFloat(selectedPackage.codAmount || 0).toFixed(2)} {getCodBadge(selectedPackage.isPaid)}</span>
                  </div>
                  <div className="col-md-6">
                    <span className="small text-muted d-block">Type</span>
                    <span>{selectedPackage.type === 'return' ? 'Return' : (selectedPackage.type || 'new')}</span>
                  </div>
                  <div className="col-md-6">
                    <span className="small text-muted d-block">Delivery Cost</span>
                    <span>EGP {parseFloat(selectedPackage.deliveryCost || 0).toFixed(2)}</span>
                  </div>
                  {Array.isArray(selectedPackage.returnDetails) && selectedPackage.returnDetails.length > 0 && (
                    <div className="col-12">
                      <span className="small text-muted d-block">Returned Items</span>
                      <div className="d-flex flex-column gap-2 mt-2">
                        {selectedPackage.returnDetails.map((it, idx) => (
                          <div key={idx} className="d-flex justify-content-between border rounded-3 p-2 bg-light">
                            <span className="fw-semibold">{it.description || `Item ${it.itemId}`}:</span>
                            <span>Qty: {it.quantity}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {(selectedPackage.returnRefundAmount !== null && selectedPackage.returnRefundAmount !== undefined) && (
                    <div className="col-md-6">
                      <span className="small text-muted d-block">Return Refund</span>
                      <span>EGP {parseFloat(selectedPackage.returnRefundAmount || 0).toFixed(2)}</span>
                    </div>
                  )}
                  {selectedPackage.shownDeliveryCost !== undefined && selectedPackage.shownDeliveryCost !== null && (
                    <div className="col-md-6">
                      <span className="small text-muted d-block">Shown Delivery Cost</span>
                      {editingShownDeliveryCost ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <input
                            type="number"
                            value={newShownDeliveryCost}
                            onChange={e => {
                              setNewShownDeliveryCost(e.target.value);
                              if (parseFloat(e.target.value) > parseFloat(selectedPackage.deliveryCost)) {
                                setShownDeliveryCostError('Shown Delivery Cost cannot be greater than Delivery Cost.');
                              } else {
                                setShownDeliveryCostError('');
                              }
                            }}
                            style={{ width: 80, padding: '6px 10px', borderRadius: 4, border: '1px solid #ccc', fontSize: '1em' }}
                            min="0"
                          />
                          {shownDeliveryCostError && (
                            <span style={{ color: '#dc3545', fontSize: 13, marginLeft: 4 }}>{shownDeliveryCostError}</span>
                          )}
                          <button
                            onClick={async () => {
                              if (parseFloat(newShownDeliveryCost) > parseFloat(selectedPackage.deliveryCost)) {
                                setShownDeliveryCostError('Shown Delivery Cost cannot be greater than Delivery Cost.');
                                return;
                              }
                              setSavingShownDeliveryCost(true);
                              try {
                                await packageService.updatePackage(selectedPackage.id, { shownDeliveryCost: newShownDeliveryCost === '' ? null : parseFloat(newShownDeliveryCost) });
                                // Store the package ID to reopen modal after refresh
                                localStorage.setItem('reopenPackageModal', selectedPackage.id);
                                // Refresh the entire page to get fresh data
                                window.location.reload();
                              } catch (err) {
                                alert('Failed to update shown delivery cost');
                              } finally {
                                setSavingShownDeliveryCost(false);
                              }
                            }}
                            disabled={savingShownDeliveryCost || newShownDeliveryCost === '' || shownDeliveryCostError}
                            style={{ background: '#28a745', color: 'white', border: 'none', borderRadius: 4, padding: '6px 16px', fontWeight: 'bold', cursor: savingShownDeliveryCost ? 'not-allowed' : 'pointer', marginRight: 4 }}
                          >
                            {savingShownDeliveryCost ? 'Saving...' : 'Save'}
                          </button>
                          <button
                            onClick={() => setEditingShownDeliveryCost(false)}
                            style={{ background: '#f5f5f5', color: '#333', border: '1px solid #ccc', borderRadius: 4, padding: '6px 16px', fontWeight: 'bold', cursor: 'pointer' }}
                          >
                            Cancel
                          </button>
                        </span>
                      ) : (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontWeight: 500 }}>EGP {parseFloat(selectedPackage.shownDeliveryCost).toFixed(2)}</span>
                          {(['awaiting_schedule','scheduled_for_pickup'].includes((selectedPackage.status || '').toLowerCase())) && (
                            <button
                              style={{ background: '#fff', border: '1px solid #007bff', color: '#007bff', borderRadius: 4, padding: '4px 12px', marginLeft: 4, cursor: 'pointer', fontWeight: 'bold' }}
                              onClick={() => {
                                setEditingShownDeliveryCost(true);
                                setNewShownDeliveryCost(selectedPackage.shownDeliveryCost !== undefined && selectedPackage.shownDeliveryCost !== null ? String(selectedPackage.shownDeliveryCost) : '');
                              }}
                            >
                              Edit
                            </button>
                          )}
                        </span>
                      )}
                    </div>
                  )}
                  {selectedPackage.weight && (
                    <div className="col-md-6">
                      <span className="small text-muted d-block">Weight</span>
                      <span>{selectedPackage.weight} kg</span>
                    </div>
                  )}
                  {selectedPackage.dimensions && (
                    <div className="col-md-6">
                      <span className="small text-muted d-block">Dimensions</span>
                      <span>{selectedPackage.dimensions}</span>
                    </div>
                  )}
                  <div className="col-md-6">
                    <span className="small text-muted d-block">Number of Items</span>
                    <span>{selectedPackage.itemsNo ?? '-'}</span>
                  </div>

                  {/* Exchange Details */}
                  {(selectedPackage.type === 'exchange' || (selectedPackage.status || '').startsWith('exchange-')) && selectedPackage.exchangeDetails && (
                    <div className="col-12">
                      <span className="small text-muted d-block">Exchange Details</span>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <div>
                          <div style={{ fontWeight: 600, marginBottom: 6 }}>Items to take from customer</div>
                          {Array.isArray(selectedPackage.exchangeDetails.takeItems) && selectedPackage.exchangeDetails.takeItems.length > 0 ? (
                            <ul style={{ margin: 0, paddingLeft: 18 }}>
                              {selectedPackage.exchangeDetails.takeItems.map((it, idx) => (
                                <li key={`shop-xtake-${idx}`}>{(it.description || '-')} x {(parseInt(it.quantity) || 0)}</li>
                              ))}
                            </ul>
                          ) : (
                            <div style={{ color: '#666', fontSize: 12 }}>No items</div>
                          )}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, marginBottom: 6 }}>Items to give to customer</div>
                          {Array.isArray(selectedPackage.exchangeDetails.giveItems) && selectedPackage.exchangeDetails.giveItems.length > 0 ? (
                            <ul style={{ margin: 0, paddingLeft: 18 }}>
                              {selectedPackage.exchangeDetails.giveItems.map((it, idx) => (
                                <li key={`shop-xgive-${idx}`}>{(it.description || '-')} x {(parseInt(it.quantity) || 0)}</li>
                              ))}
                            </ul>
                          ) : (
                            <div style={{ color: '#666', fontSize: 12 }}>No items</div>
                          )}
                        </div>
                      </div>
                      {selectedPackage.exchangeDetails.cashDelta && (
                        <div style={{ marginTop: 8 }}>
                          <span style={{ fontWeight: 600 }}>Money: </span>
                          <span>
                            {(selectedPackage.exchangeDetails.cashDelta.type === 'take' ? 'Take from customer' : 'Give to customer')} · EGP {parseFloat(selectedPackage.exchangeDetails.cashDelta.amount || 0).toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Items Section */}
                  {selectedPackage.Items && selectedPackage.Items.length > 0 && (
                    <div className="col-12">
                      <span className="small text-muted d-block">Items</span>
                      <div style={{ 
                        backgroundColor: '#f8f9fa', 
                        padding: '1rem', 
                        borderRadius: '8px',
                        border: '1px solid #e0e0e0',
                        marginTop: '0.5rem'
                      }}>
                        {selectedPackage.Items.map((item, index) => {
                          return (
                            <div key={item.id} style={{ 
                              border: '1px solid #ddd', 
                              padding: '0.75rem', 
                              marginBottom: '0.5rem', 
                              borderRadius: '4px',
                              backgroundColor: 'white'
                            }}>
                              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '1rem', alignItems: 'center' }}>
                                <div>
                                  <strong>Description:</strong> {item.description}
                                </div>
                                <div>
                                  <strong>Quantity:</strong> {item.quantity}
                                </div>
                                <div>
                                  <strong>COD Per Unit:</strong> EGP {item.codAmount && item.quantity 
                                    ? (parseFloat(item.codAmount) / parseInt(item.quantity)).toFixed(2) 
                                    : '0.00'}
                                </div>
                              </div>
                              <div style={{ 
                                marginTop: '0.5rem', 
                                fontSize: '0.9em', 
                                color: '#666',
                                textAlign: 'right'
                              }}>
                                <strong>Total COD:</strong> EGP {parseFloat(item.codAmount || 0).toFixed(2)}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Delivered Items Section */}
                  {selectedPackage?.deliveredItems && Array.isArray(selectedPackage.deliveredItems) && selectedPackage.deliveredItems.length > 0 && (
                    <div className="col-12">
                      <span className="small text-muted d-block">Delivered Items</span>
                      <div style={{ 
                        backgroundColor: '#f8f9fa', 
                        padding: '1rem', 
                        borderRadius: '8px',
                        border: '1px solid #e0e0e0',
                        marginTop: '0.5rem'
                      }}>
                        {selectedPackage.deliveredItems.map((di, idx) => {
                          const match = (selectedPackage.Items || []).find(it => String(it.id) === String(di.itemId));
                          const label = match?.description || `Item ${di.itemId}`;
                          return (
                            <div key={idx} style={{ 
                              border: '1px solid #ddd', 
                              padding: '0.75rem', 
                              marginBottom: '0.5rem', 
                              borderRadius: '4px',
                              backgroundColor: 'white'
                            }}>
                              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', alignItems: 'center' }}>
                                <div>
                                  <strong>Description:</strong> {label}
                                </div>
                                <div>
                                  <strong>Delivered Quantity:</strong> {di.deliveredQuantity}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Returning Items Section */}
                  {Array.isArray(selectedPackage.Items) && selectedPackage.Items.length > 0 && Array.isArray(selectedPackage.deliveredItems) && selectedPackage.deliveredItems.length > 0 && (
                    (() => {
                      const dmap = new Map(selectedPackage.deliveredItems.map(di => [di.itemId, parseInt(di.deliveredQuantity, 10) || 0]));
                      const remaining = selectedPackage.Items
                        .map(it => {
                          const total = parseInt(it.quantity, 10) || 0;
                          const delivered = dmap.get(it.id) || 0;
                          const remain = Math.max(0, total - delivered);
                          return { id: it.id, description: it.description, quantity: remain };
                        })
                        .filter(r => r.quantity > 0);
                      
                      return remaining.length > 0 ? (
                        <div className="col-12">
                          <span className="small text-muted d-block">Returning Items</span>
                          <div style={{ 
                            backgroundColor: '#f8f9fa', 
                            padding: '1rem', 
                            borderRadius: '8px',
                            border: '1px solid #e0e0e0',
                            marginTop: '0.5rem'
                          }}>
                            {remaining.map((r, idx) => (
                              <div key={`ret-${idx}`} style={{ 
                                border: '1px solid #ddd', 
                                padding: '0.75rem', 
                                marginBottom: '0.5rem', 
                                borderRadius: '4px',
                                backgroundColor: 'white'
                              }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', alignItems: 'center' }}>
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

                  <div className="col-md-6">
                    <span className="small text-muted d-block">Paid Amount</span>
                    <span>EGP {parseFloat(selectedPackage.paidAmount || 0).toFixed(2)}</span>
                  </div>
                  
                  <div className="col-md-6">
                    <span className="small text-muted d-block">COD</span>
                    <span>EGP {parseFloat(selectedPackage.codAmount || 0).toFixed(2)} {getCodBadge(selectedPackage.isPaid)}</span>
                  </div>
                  
                  <div className="col-md-6">
                    <span className="small text-muted d-block">Type</span>
                    <span>{selectedPackage.type === 'return' ? 'Return' : (selectedPackage.type || 'new')}</span>
                  </div>
                  
                  <div className="col-md-6">
                    <span className="small text-muted d-block">Delivery Cost</span>
                    <span>EGP {parseFloat(selectedPackage.deliveryCost || 0).toFixed(2)}</span>
                  </div>
                </div>
              )}
              
              {/* Notes Log Section - moved above Close button and improved UI */}
              <div className="package-notes-log-section" style={{marginTop:'2rem', marginBottom:'1.5rem'}}>
                <h4 style={{marginBottom:'0.75rem'}}>Notes Log</h4>
                <div className="notes-log-list" style={{display:'flex', flexDirection:'column', gap:'0.75rem'}}>
                  {(() => {
                    let notesArr = [];
                    if (Array.isArray(selectedPackage?.notes)) {
                      notesArr = selectedPackage.notes;
                    } else if (typeof selectedPackage?.notes === 'string') {
                      try {
                        notesArr = JSON.parse(selectedPackage.notes);
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
              </div>
              <div className="d-flex justify-content-end gap-2 flex-wrap">
                {['delivered', 'delivered-returned'].includes(selectedPackage.status) && (
                  <>
                    <button
                      className="btn text-white"
                      style={{ background: '#ff8c00' }}
                      onClick={() => setShowReturnModal(true)}
                    >
                      {t('shop.packages.actions.requestReturn')}
                    </button>
                    <button
                      className="btn btn-primary"
                      onClick={() => setShowExchangeModal(true)}
                    >
                      {t('shop.packages.actions.requestExchange')}
                    </button>
                  </>
                )}
                <button className="btn btn-outline-secondary" onClick={() => setShowPackageDetailsModal(false)}>{t('shop.packages.actions.close')}</button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {showReturnModal && selectedPackage && ReactDOM.createPortal(
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3" style={{ zIndex: 1210, backgroundColor: 'rgba(0,0,0,0.4)' }} onClick={() => setShowReturnModal(false)}>
          <div className="bg-white rounded-4 shadow p-4" style={{ width: '100%', maxWidth: '620px' }} onClick={e => e.stopPropagation()}>
            <h3 className="h5 fw-bold mb-2">{t('shop.packages.modals.requestReturn.title')}</h3>
            <p className="mb-3">{t('shop.packages.modals.requestReturn.subtitle')}</p>
            <div style={{ maxHeight: 300, overflowY: 'auto', border: '1px solid #eee', borderRadius: 8, padding: 8, marginBottom: 8 }}>
              {(selectedPackage.Items || []).map((it, idx) => (
                <div key={it.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                  <div><b>{it.description}</b></div>
                  <div>{t('shop.packages.labels.qty')}: {it.quantity}</div>
                  <div>
                    <input
                      type="number"
                      min="0"
                      max={it.quantity}
                      value={(returnItems[it.id]?.quantity ?? 0)}
                      onChange={e => setReturnItems(prev => ({ ...prev, [it.id]: { quantity: Math.min(Math.max(0, parseInt(e.target.value || '0', 10)), it.quantity) } }))}
                      placeholder={t('shop.packages.modals.requestReturn.returnQty')}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 8 }}>
              <label>{t('shop.packages.modals.requestReturn.refundLabel')}</label>
              <input type="number" min="0" step="0.01" value={returnRefund} onChange={e => setReturnRefund(e.target.value)} />
            </div>
            {returnError && <div style={{ color: '#dc3545', marginTop: 8 }}>{returnError}</div>}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
              <button className="btn btn-outline-secondary" onClick={() => setShowReturnModal(false)}>{t('shop.packages.actions.cancel')}</button>
              <button className="btn btn-success" disabled={requestingReturn} onClick={submitReturnRequest}>
                {requestingReturn ? t('shop.packages.actions.submitting') : t('shop.packages.actions.submit')}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {showExchangeModal && selectedPackage && ReactDOM.createPortal(
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3" style={{ zIndex: 1210, backgroundColor: 'rgba(0,0,0,0.4)' }} onClick={() => setShowExchangeModal(false)}>
          <div className="bg-white rounded-4 shadow p-4" onClick={e => e.stopPropagation()} style={{ maxWidth: 900, width: '95vw', maxHeight: '92vh', overflowY: 'auto' }}>
            <h3 style={{ marginBottom: 12 }}>{t('shop.packages.modals.requestExchange.title')}</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'start' }}>
              <div style={{ background: '#fafafa', border: '1px solid #e9ecef', borderRadius: 8, padding: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <h4 style={{ margin: 0, fontSize: 16 }}>{t('shop.packages.modals.requestExchange.itemsTake')}</h4>
                  <button className="btn btn-outline-primary btn-sm" onClick={() => addRow(setTakeItems)} style={{ padding: '4px 10px' }}>{t('shop.packages.actions.addItem')}</button>
                </div>
                <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 220, overflowY: 'auto' }}>
                  {takeItems.map((row, idx) => (
                    <div key={`take-${idx}`} style={{ display: 'grid', gridTemplateColumns: '1fr 90px auto', gap: 8, alignItems: 'center' }}>
                      <input
                        type="text"
                        placeholder={t('shop.packages.placeholders.itemDescription')}
                        value={row.description}
                        onChange={e => updateRow(setTakeItems, idx, 'description', e.target.value)}
                        style={{ padding: '8px 10px', border: '1px solid #ced4da', borderRadius: 6 }}
                      />
                      <input
                        type="number"
                        min="1"
                        value={row.quantity}
                        onChange={e => updateRow(setTakeItems, idx, 'quantity', parseInt(e.target.value || '1', 10))}
                        style={{ padding: '8px 10px', border: '1px solid #ced4da', borderRadius: 6 }}
                      />
                      <button className="btn btn-outline-danger btn-sm" onClick={() => removeRow(setTakeItems, idx)} style={{ padding: '6px 10px' }}>{t('shop.packages.actions.remove')}</button>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ background: '#fafafa', border: '1px solid #e9ecef', borderRadius: 8, padding: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <h4 style={{ margin: 0, fontSize: 16 }}>{t('shop.packages.modals.requestExchange.itemsGive')}</h4>
                  <button className="btn btn-outline-primary btn-sm" onClick={() => addRow(setGiveItems)} style={{ padding: '4px 10px' }}>{t('shop.packages.actions.addItem')}</button>
                </div>
                <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 220, overflowY: 'auto' }}>
                  {giveItems.map((row, idx) => (
                    <div key={`give-${idx}`} style={{ display: 'grid', gridTemplateColumns: '1fr 90px auto', gap: 8, alignItems: 'center' }}>
                      <input
                        type="text"
                        placeholder={t('shop.packages.placeholders.itemDescription')}
                        value={row.description}
                        onChange={e => updateRow(setGiveItems, idx, 'description', e.target.value)}
                        style={{ padding: '8px 10px', border: '1px solid #ced4da', borderRadius: 6 }}
                      />
                      <input
                        type="number"
                        min="1"
                        value={row.quantity}
                        onChange={e => updateRow(setGiveItems, idx, 'quantity', parseInt(e.target.value || '1', 10))}
                        style={{ padding: '8px 10px', border: '1px solid #ced4da', borderRadius: 6 }}
                      />
                      <button className="btn btn-outline-danger btn-sm" onClick={() => removeRow(setGiveItems, idx)} style={{ padding: '6px 10px' }}>{t('shop.packages.actions.remove')}</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ marginTop: 16, background: '#f8f9fa', border: '1px solid #e9ecef', borderRadius: 8, padding: 12 }}>
              <h4 style={{ margin: '0 0 8px 0', fontSize: 16 }}>{t('shop.packages.labels.money')}</h4>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <input type="radio" name="moneyType" value="give" checked={moneyType === 'give'} onChange={() => setMoneyType('give')} />
                  {t('shop.packages.modals.requestExchange.moneyGive')}
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <input type="radio" name="moneyType" value="take" checked={moneyType === 'take'} onChange={() => setMoneyType('take')} />
                  {t('shop.packages.modals.requestExchange.moneyTake')}
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder={t('shop.packages.modals.requestExchange.amountPlaceholder')}
                  value={moneyAmount}
                  onChange={e => setMoneyAmount(e.target.value)}
                  style={{ padding: '8px 10px', border: '1px solid #ced4da', borderRadius: 6, width: 200 }}
                />
              </div>
              <div style={{ marginTop: 6, color: '#666', fontSize: 12 }}>{t('shop.packages.modals.requestExchange.moneyHint')}</div>
            </div>

            {exchangeError && <div style={{ color: '#dc3545', marginTop: 8 }}>{exchangeError}</div>}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14 }}>
              <button className="btn btn-outline-secondary" onClick={() => setShowExchangeModal(false)}>{t('shop.packages.actions.cancel')}</button>
              <button className="btn btn-primary" style={{ opacity: canSubmitExchange ? 1 : 0.6 }} disabled={requestingExchange || !canSubmitExchange} onClick={submitExchangeRequest}>
                {requestingExchange ? t('shop.packages.actions.submitting') : t('shop.packages.actions.submit')}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default ShopPackages; 