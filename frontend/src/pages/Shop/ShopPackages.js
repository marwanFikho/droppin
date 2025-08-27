import React, { useState, useEffect } from 'react';
import { packageService, shopService } from '../../services/api';
import { useLocation } from 'react-router-dom';
import './ShopDashboard.css';
import QRCode from 'qrcode';
import { useAuth } from '../../context/AuthContext';
import { notification } from 'antd';

const TABS = [
  { label: 'All', value: 'all' },
  { label: 'Awaiting Schedule', value: 'awaiting_schedule' },
  { label: 'Scheduled for Pickup', value: 'scheduled_for_pickup' },
  { label: 'Pending', value: 'pending' },
  { label: 'In Transit', value: 'in-transit' },
  { label: 'Delivered', value: 'delivered' },
  { label: 'Return to Shop', value: 'return-to-shop' },
  { label: 'Return Requests', value: 'return-requests' },
  { label: 'Exchange Requests', value: 'exchange-requests' },
  { label: 'Pickups', value: 'pickups' },
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

export function getStatusBadge(status) {
  let className = 'status-badge';
  if (status === 'awaiting_schedule') className += ' status-awaiting-schedule';
  else if (status === 'awaiting_pickup') className += ' status-awaiting-pickup';
  else if (status === 'scheduled_for_pickup') className += ' status-scheduled-for-pickup';
  else if (status === 'pending') className += ' status-pending';
  else if (status === 'assigned') className += ' status-assigned';
  else if (status === 'pickedup') className += ' status-pickedup';
  else if (status === 'in-transit') className += ' status-in-transit';
  else if (status === 'delivered') className += ' status-delivered';
  else if (status === 'cancelled') className += ' status-cancelled';
  else if (status === 'cancelled-awaiting-return') className += ' status-cancelled-awaiting-return';
  else if (status === 'cancelled-returned') className += ' status-cancelled-returned';
  else className += ' status-other';
  return <span className={className}>{status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ').replace('-', ' ')}</span>;
}

export function getCodBadge(isPaid) {
  return isPaid
    ? <span className="cod-badge cod-paid">Paid</span>
    : <span className="cod-badge cod-unpaid">Unpaid</span>;
}

function getPickupStatusBadge(status) {
  let colorClass = 'status-badge';
  if (status === 'pending' || status === 'scheduled') colorClass += ' status-pending';
  else if (status === 'cancelled') colorClass += ' status-other';
  else if (status === 'completed' || status === 'pickedup') colorClass += ' status-delivered';
  else colorClass += ' status-other';
  return <span className={colorClass}>{status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}</span>;
}

const ShopPackages = () => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [packageToCancel, setPackageToCancel] = useState(null);
  const [cancelError, setCancelError] = useState(null);
  const [pickups, setPickups] = useState([]);
  const [pickupLoading, setPickupLoading] = useState(false);
  const [showPickupModal, setShowPickupModal] = useState(false);
  const [selectedPickup, setSelectedPickup] = useState(null);
  const [pickupPackages, setPickupPackages] = useState([]);
  const [pickupPackagesLoading, setPickupPackagesLoading] = useState(false);
  const [showPickupCancelModal, setShowPickupCancelModal] = useState(false);
  const [pickupToCancel, setPickupToCancel] = useState(null);
  const [pickupCancelError, setPickupCancelError] = useState(null);
  const [showPackageDetailsModal, setShowPackageDetailsModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [editingNotes, setEditingNotes] = useState('');
  const [notesSaving, setNotesSaving] = useState(false);
  const [notesError, setNotesError] = useState(null);
  const [selectedPackages, setSelectedPackages] = useState([]);
  const [shippingFees, setShippingFees] = useState(null);
  const [shopFees, setShopFees] = useState({ shownShippingFees: null, shippingFees: null });
  const [editingShownDeliveryCost, setEditingShownDeliveryCost] = useState(false);
  const [newShownDeliveryCost, setNewShownDeliveryCost] = useState('');
  const [savingShownDeliveryCost, setSavingShownDeliveryCost] = useState(false);
  const [shownDeliveryCostError, setShownDeliveryCostError] = useState('');
  const location = useLocation();
  const { currentUser } = useAuth();

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
    const stateZip = cityAndState.includes(' ') ? cityAndState.split(' ') : [];
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
    const fetchPackages = async () => {
      setLoading(true);
      try {
        const res = await packageService.getPackages({ limit: 10000 });
        setPackages(res.data.packages || res.data || []);
        
        // Check if we need to reopen a package modal after refresh
        const reopenPackageId = localStorage.getItem('reopenPackageModal');
        if (reopenPackageId) {
          const packageToReopen = (res.data.packages || res.data || []).find(pkg => pkg.id == reopenPackageId);
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
    // Fetch the shop profile and get shippingFees directly
    async function fetchShopShippingFees() {
      try {
        const profileRes = await packageService.getShopProfile();
        console.log('DEBUG: shop profile response:', profileRes.data);
        setShippingFees(profileRes.data?.shippingFees ?? null);
      } catch (err) {
        console.error('DEBUG: error fetching shop shippingFees', err);
        setShippingFees(null);
      }
    }
    fetchShopShippingFees();
  }, []);

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

  const handleCancel = async () => {
    if (!packageToCancel) return;
    try {
      await packageService.cancelPackage(packageToCancel.id);
      setPackages(prev => prev.map(p => p.id === packageToCancel.id ? { ...p, status: 'cancelled' } : p));
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
        pkg.status?.toLowerCase().includes(searchLower)
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
      // Show delivered packages that have exchange requests
      return filtered.filter(pkg => 
        pkg.status === 'delivered' && 
        pkg.exchangeDetails !== null && 
        typeof pkg.exchangeDetails === 'object'
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

  const handleMarkAsReturned = async (pkg) => {
    try {
      await packageService.markAsReturned(pkg.id);
      setPackages(prev => prev.map(p => p.id === pkg.id ? { ...p, status: 'cancelled-returned' } : p));
      setShowCancelModal(false);
      setPackageToCancel(null);
      setCancelError(null);
    } catch (err) {
      setCancelError(err.response?.data?.message || 'Failed to mark as returned.');
    }
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
    
    // For manually created packages, subtotal is just the itemsSum, not cod
    const subTotal = itemsSum;
    const shippingTaxes = isShopify ? Math.max(0, cod - itemsSum) : shippingValue;
    // Total should reflect COD for Shopify, otherwise subtotal + shipping
    const total = isShopify ? (subTotal + shippingTaxes) : (subTotal + shippingValue);
    
    const totalsRows = isShopify
      ? `<tr><td>Sub Total:</td><td>${subTotal.toFixed(2)} EGP</td></tr>`
        + `<tr><td>Shipping & Taxes:</td><td>${shippingTaxes.toFixed(2)} EGP</td></tr>`
        + `<tr><td><b>Total:</b></td><td><b>${total.toFixed(2)} EGP</b></td></tr>`
      : `<tr><td>Sub Total:</td><td>${subTotal.toFixed(2)} EGP</td></tr>`
        + `<tr><td>Shipping:</td><td>${shippingValue.toFixed(2)} EGP</td></tr>`
        + `<tr><td><b>Total:</b></td><td><b>${total.toFixed(2)} EGP</b></td></tr>`;
    const shopName = shopFees.businessName || '-';
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
                  <div class="awb-shop-name">Shop Name: ${shopName}</div>
                </td>
                  <td><b>Date:</b> ${awbPkg.createdAt ? new Date(awbPkg.createdAt).toLocaleDateString() : '-'}</td>
                </tr>
                <tr>
                  <td colspan="2">
                    <span class="awb-row"><b class="awb-recipient">Recipient: ${awbPkg.deliveryContactName || '-'}</b></span><br/>
                    <span class="awb-row"><b class="awb-phone">Phone: ${awbPkg.deliveryContactPhone || '-'}</b></span><br/>
                    <span class="awb-row"><b class="awb-address">Address: ${awbPkg.deliveryAddress || '-'}</b></span>
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

      const subTotal = itemsSum;
      const shippingTaxes = isShopify ? Math.max(0, cod - itemsSum) : shippingValue;
      const total = isShopify ? (subTotal + shippingTaxes) : (subTotal + shippingValue);

      const totalsRows = isShopify
        ? `<tr><td>Sub Total:</td><td>${subTotal.toFixed(2)} EGP</td></tr>`
          + `<tr><td>Shipping & Taxes:</td><td>${shippingTaxes.toFixed(2)} EGP</td></tr>`
          + `<tr><td><b>Total:</b></td><td><b>${total.toFixed(2)} EGP</b></td></tr>`
        : `<tr><td>Sub Total:</td><td>${subTotal.toFixed(2)} EGP</td></tr>`
          + `<tr><td>Shipping:</td><td>${shippingValue.toFixed(2)} EGP</td></tr>`
          + `<tr><td><b>Total:</b></td><td><b>${total.toFixed(2)} EGP</b></td></tr>`;

      const shopName = shopFees.businessName || '-';
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
                    : `<tr><td colspan=\"2\">None</td></tr>`
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
                    : `<tr><td colspan=\"2\">None</td></tr>`
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
                  <div class="awb-shop-name">Shop Name: ${shopName}</div>
                </td>
                <td><b>Date:</b> ${packageData.createdAt ? new Date(packageData.createdAt).toLocaleDateString() : (pkg.createdAt ? new Date(pkg.createdAt).toLocaleDateString() : '-')}</td>
              </tr>
              <tr>
                <td colspan="2">
                  <span class="awb-row"><b class="awb-recipient">Recipient:</b><span class="awb-recipient awb-data">${packageData.deliveryContactName || '-'}</span></span><br/>
                  <span class="awb-row"><b class="awb-phone">Phone:</b><span class="awb-phone awb-data">${packageData.deliveryContactPhone || '-'}</span></span><br/>
                  <span class="awb-row"><b class="awb-address">Address:</b><span class="awb-address awb-data">${packageData.deliveryAddress || '-'}</span></span>
                </td>
              </tr>
            </table>
          </div>
          <div class="awb-section">
            <b>Description:</b> ${packageData.packageDescription || '-'}
          </div>
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

  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnItems, setReturnItems] = useState({});
  const [returnRefund, setReturnRefund] = useState('');
  const [returnError, setReturnError] = useState('');
  const [requestingReturn, setRequestingReturn] = useState(false);

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
      notification.success({ message: 'Return requested', description: 'Return request submitted successfully!', placement: 'topRight', duration: 3 });
      // Refresh list without full page reload
      // Prefer staying on the same tab
      try {
        const res = await packageService.getPackages({ limit: 10000 });
        setPackages(res.data.packages || res.data || []);
      } catch (e) {
        // Silent fallback
      }
      // Ensure UI reflects latest state; fallback to a hard refresh shortly after
      setTimeout(() => {
        try { window.location.reload(); } catch (_) {}
      }, 800);
    } catch (err) {
      setReturnError(err.response?.data?.message || 'Failed to submit return request.');
      notification.error({ message: 'Return request failed', description: err.response?.data?.message || 'Failed to submit return request.', placement: 'topRight', duration: 4 });
    } finally {
      setRequestingReturn(false);
    }
  };

  // Exchange modal state
  const [showExchangeModal, setShowExchangeModal] = useState(false);
  const [takeItems, setTakeItems] = useState([{ description: '', quantity: 1 }]);
  const [giveItems, setGiveItems] = useState([{ description: '', quantity: 1 }]);
  const [moneyType, setMoneyType] = useState('give'); // 'give' | 'take'
  const [moneyAmount, setMoneyAmount] = useState('');
  const [exchangeError, setExchangeError] = useState('');
  const [requestingExchange, setRequestingExchange] = useState(false);

  const addRow = (setter) => setter(prev => [...prev, { description: '', quantity: 1 }]);
  const updateRow = (setter, idx, key, value) => setter(prev => prev.map((r, i) => i === idx ? { ...r, [key]: value } : r));
  const removeRow = (setter, idx) => setter(prev => prev.filter((_, i) => i !== idx));

  const canEditExchange = (pkg) => !['exchange-in-process', 'exchange-in-transit', 'exchange-awaiting-return', 'exchange-returned'].includes(pkg?.status);

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
      setExchangeError(err.response?.data?.message || 'Failed to submit exchange request.');
      notification.error({ message: 'Exchange request failed', description: err.response?.data?.message || 'Failed to submit exchange request.', placement: 'topRight', duration: 4 });
    } finally {
      setRequestingExchange(false);
    }
  };

  return (
    <div className="shop-packages-page">
      <h2>Packages</h2>
      {/* Print AWB for selected packages button at the top */}
      {selectedPackages.length > 0 && (
        <button className="btn btn-primary" style={{marginBottom:'1rem'}} onClick={handleBulkPrintAWB}>
          Print AWB for Selected ({selectedPackages.length})
        </button>
      )}
      <div className="packages-tabs">
        {TABS.map(tab => (
          <button
            key={tab.value}
            className={`tab-btn${activeTab === tab.value ? ' active' : ''}`}
            onClick={() => setActiveTab(tab.value)}
          >
            {tab.label}
          </button>
        ))}
        <input
          className="package-search"
          type="text"
          placeholder="Search packages..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>
      {activeTab === 'pickups' ? (
        pickupLoading ? (
          <div>Loading pickups...</div>
        ) : pickups.length === 0 ? (
          <div>No pickups found.</div>
        ) : (
          <div className="pickups-table-wrapper">
            <table className="packages-table">
              <thead>
                <tr>
                  <th>Pickup Date</th>
                  <th>Address</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {pickups.map(pickup => (
                  <tr key={pickup.id}>
                    <td>{new Date(pickup.scheduledTime).toLocaleString()}</td>
                    <td>{pickup.pickupAddress}</td>
                    <td>{getPickupStatusBadge(pickup.status)}</td>
                    <td style={{display:'flex',gap:'0.5rem'}}>
                      <button className="btn btn-primary" onClick={() => handlePickupClick(pickup)}>
                        View Packages
                      </button>
                      {pickup.status === 'scheduled' && (
                        <button className="btn btn-danger" onClick={() => { setPickupToCancel(pickup); setShowPickupCancelModal(true); }}>
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : loading ? (
        <div>Loading packages...</div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : (
        <>
          {showCancelModal && (
            <div className="confirmation-overlay" onClick={() => { setShowCancelModal(false); setCancelError(null); }}>
              <div className="confirmation-dialog warning-dialog" onClick={e => e.stopPropagation()}>
                <h3>Cancel Package</h3>
                <p>Are you sure you want to cancel this package?</p>
                {cancelError && <div style={{color:'#dc3545',marginBottom:'0.5rem'}}>{cancelError}</div>}
                <div className="confirmation-buttons">
                  <button className="btn-secondary" onClick={() => { setShowCancelModal(false); setCancelError(null); }}>No</button>
                  <button className="btn-primary danger" onClick={handleCancel}>Yes, Cancel</button>
                </div>
              </div>
            </div>
          )}
          <div className="packages-table-wrapper">
            <table className="packages-table">
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th>Tracking #</th>
                  <th>Description</th>
                  <th>Recipient</th>
                  <th>Status</th>
                  <th>COD</th>
                  <th>Date</th>
                  {activeTab !== 'cancelled' && activeTab !== 'return-to-shop' && <th>Action</th>}
                </tr>
              </thead>
              <tbody>
                {filterPackages().length === 0 ? (
                  <tr><td colSpan={8} style={{textAlign:'center'}}>No packages found.</td></tr>
                ) : filterPackages().map(pkg => (
                  <tr key={pkg.id} style={{cursor:'pointer'}} onClick={e => {
                    if (e.target.closest('button') || e.target.type === 'checkbox') return;
                    openDetailsModal(pkg);
                  }}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedPackages.includes(pkg.id)}
                        onChange={() => toggleSelectPackage(pkg.id)}
                        disabled={pkg.status === 'cancelled' || pkg.status === 'delivered' || pkg.status === 'cancelled-returned' || pkg.status === 'cancelled-awaiting-return' || pkg.status === 'rejected'}
                      />
                    </td>
                    <td data-label="Tracking #">{pkg.trackingNumber}</td>
                    <td data-label="Description">
                      <div>{pkg.packageDescription}</div>
                      <div style={{ color: '#666', marginTop: 4 }}>{pkg.deliveryAddress}</div>
                      {(pkg.deliveryContactName || pkg.deliveryContactPhone) && (
                        <div style={{ fontSize: 12, color: '#555', marginTop: 2 }}>
                          {pkg.deliveryContactName || 'N/A'}{pkg.deliveryContactPhone ? ` · ${pkg.deliveryContactPhone}` : ''}
                        </div>
                      )}
                    </td>
                    <td data-label="Recipient">{pkg.deliveryContactName}</td>
                    <td data-label="Status">
                      {getStatusBadge(pkg.status)}
                      {activeTab === 'return-requests' && (
                        <span className="special-badge" style={{background: '#f55247', marginLeft: '5px'}}>Return</span>
                      )}
                      {activeTab === 'exchange-requests' && (
                        <span className="special-badge" style={{background: '#7b1fa2', marginLeft: '5px'}}>Exchange</span>
                      )}
                    </td>
                    <td data-label="COD">EGP {parseFloat(pkg.codAmount || 0).toFixed(2)} {getCodBadge(pkg.isPaid)}</td>
                    <td data-label="Date">{new Date(pkg.createdAt).toLocaleDateString()}</td>
                    {activeTab !== 'cancelled' && (
                      <td data-label="Actions" className="actions-cell">
                        {pkg.status !== 'cancelled' && pkg.status !== 'delivered' && pkg.status !== 'cancelled-returned' && pkg.status !== 'cancelled-awaiting-return' && pkg.status !== 'rejected' && pkg.status !== 'rejected-awaiting-return' && pkg.status !== 'rejected-returned' && pkg.status !== 'return-requested' && pkg.status !== 'return-in-transit' && pkg.status !== 'return-pending' && pkg.status !== 'return-completed' &&(
                          <>
                            <button
                              className="action-button cancel-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPackageToCancel(pkg);
                                setShowCancelModal(true);
                              }}
                            >
                              Cancel
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
        </>
      )}
      {/* Pickup Modal - always render so it works in any tab */}
      {showPickupModal && (
        <div className="confirmation-overlay" onClick={() => setShowPickupModal(false)}>
          <div className="confirmation-dialog" onClick={e => e.stopPropagation()} style={{minWidth:'350px'}}>
            <h3>Pickup Packages</h3>
            {pickupPackagesLoading ? (
              <div>Loading packages...</div>
            ) : pickupPackages.length === 0 ? (
              <div>No packages found for this pickup.</div>
            ) : (
              <ul style={{paddingLeft:0}}>
                {pickupPackages.map(pkg => (
                  <li key={pkg.id} style={{marginBottom:'0.5rem',listStyle:'none'}}>
                    <b>{pkg.trackingNumber}</b> - {pkg.packageDescription}
                  </li>
                ))}
              </ul>
            )}
            <button className="btn btn-secondary" onClick={() => setShowPickupModal(false)} style={{marginTop:'1rem'}}>Close</button>
          </div>
        </div>
      )}
      {/* Pickup Cancel Modal */}
      {showPickupCancelModal && (
        <div className="confirmation-overlay" onClick={() => { setShowPickupCancelModal(false); setPickupCancelError(null); }}>
          <div className="confirmation-dialog warning-dialog" onClick={e => e.stopPropagation()}>
            <h3>Cancel Pickup</h3>
            <p>Are you sure you want to cancel this pickup? All packages will be reset to pending.</p>
            {pickupCancelError && <div style={{color:'#dc3545',marginBottom:'0.5rem'}}>{pickupCancelError}</div>}
            <div className="confirmation-buttons">
              <button className="btn-secondary" onClick={() => { setShowPickupCancelModal(false); setPickupCancelError(null); }}>No</button>
              <button className="btn-danger" onClick={handleCancelPickup}>Yes, Cancel</button>
            </div>
          </div>
        </div>
      )}
      {/* Package Details Modal */}
      {showPackageDetailsModal && selectedPackage && (
        <div className="confirmation-overlay" onClick={() => setShowPackageDetailsModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Package Details</h2>
              {canEditThisPackage(selectedPackage) && !isEditingDetails && (
                <button className="btn" style={{ background: '#007bff', color: '#fff', marginRight: 8 }} onClick={() => openEditDetails(selectedPackage)}>
                  Edit
                </button>
              )}
              <button className="btn" style={{ background: '#6c757d', color: '#fff', marginRight: 8 }} onClick={() => handlePrintAWB(selectedPackage)}>
                Print AWB
              </button>
              <button className="btn close-btn" onClick={() => setShowPackageDetailsModal(false)}>&times;</button>
            </div>
            <div className="modal-body">
              
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
                      <button className="btn" style={{ background: '#17a2b8', color: '#fff' }} onClick={() => setEditItems(prev => [...prev, { description: '', quantity: 1, codPerUnit: '0' }])}>Add Item</button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {editItems.map((it, idx) => (
                        <div key={idx} style={{ border:'1px solid #eaeaea', borderRadius: 10, padding: 10, background:'#fff', boxShadow:'0 1px 1px rgba(16,24,40,0.04)' }}>
                          <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr auto', gap: 8, alignItems:'center' }}>
                            <input type="text" placeholder="Description" value={it.description} onChange={e => setEditItems(prev => prev.map((p,i)=> i===idx?{...p, description: e.target.value}:p))} />
                            <input type="number" placeholder="Qty" min="1" value={it.quantity} onChange={e => setEditItems(prev => prev.map((p,i)=> i===idx?{...p, quantity: e.target.value}:p))} />
                            <input type="number" placeholder="COD / unit" step="0.01" value={it.codPerUnit} onChange={e => setEditItems(prev => prev.map((p,i)=> i===idx?{...p, codPerUnit: e.target.value}:p))} />
                            <button className="btn" style={{ background: '#dc3545', color: '#fff' }} onClick={() => setEditItems(prev => prev.filter((_,i)=> i!==idx))}>Remove</button>
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
                    <button className="btn" style={{ background: '#6c757d', color: '#fff' }} onClick={() => setIsEditingDetails(false)} disabled={savingDetails}>Cancel</button>
                    <button className="btn" style={{ background: '#28a745', color: '#fff' }} onClick={saveEditedDetails} disabled={savingDetails}>{savingDetails ? 'Saving...' : 'Save'}</button>
                  </div>
                </div>
              )}
              <div className="details-grid">
                <div className="detail-item">
                  <span className="label">Tracking #</span>
                  <span>{selectedPackage.trackingNumber}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Status</span>
                  <span>{getStatusBadge(selectedPackage.status)}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Created</span>
                  <span>{new Date(selectedPackage.createdAt).toLocaleString()}</span>
                </div>
                <div className="detail-item full-width">
                  <span className="label">Description</span>
                  <span>{selectedPackage.packageDescription || 'No description'}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Recipient</span>
                  <span>{selectedPackage.deliveryContactName || 'N/A'}</span>
                </div>
                {selectedPackage.deliveryContactPhone && (
                  <div className="detail-item">
                    <span className="label">Recipient Phone</span>
                    <span>{selectedPackage.deliveryContactPhone}</span>
                  </div>
                )}
                {selectedPackage.deliveryAddress && (
                  <div className="detail-item full-width">
                    <span className="label">Delivery Address</span>
                    <span>{selectedPackage.deliveryAddress}</span>
                  </div>
                )}
                <div className="detail-item">
                  <span className="label">COD</span>
                  <span>EGP {parseFloat(selectedPackage.codAmount || 0).toFixed(2)} {getCodBadge(selectedPackage.isPaid)}</span>
                </div>
                {selectedPackage?.deliveredItems && Array.isArray(selectedPackage.deliveredItems) && selectedPackage.deliveredItems.length > 0 && (
                  <div className="detail-item full-width">
                    <span className="label">Delivered Items</span>
                    <div className="nested-details">
                      {selectedPackage.deliveredItems.map((di, idx) => {
                        const match = (selectedPackage.Items || []).find(it => String(it.id) === String(di.itemId));
                        const label = match?.description || `Item ${di.itemId}`;
                        return (
                          <div key={idx} className="nested-detail">
                            <span className="nested-label">{label}:</span>
                            <span>Qty: {di.deliveredQuantity}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Returning Items (derived) */}
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
                      <div className="detail-item full-width">
                        <span className="label">Returning Items</span>
                        <div className="nested-details">
                          {remaining.map((r, idx) => (
                            <div key={`ret-${idx}`} className="nested-detail">
                              <span className="nested-label">{r.description || `Item ${r.id}`}:</span>
                              <span>Qty: {r.quantity}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null;
                  })()
                )}
                <div className="detail-item">
                  <span className="label">Type</span>
                  <span>{selectedPackage.type === 'return' ? 'Return' : (selectedPackage.type || 'new')}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Delivery Cost</span>
                  <span>EGP {parseFloat(selectedPackage.deliveryCost || 0).toFixed(2)}</span>
                </div>
                {Array.isArray(selectedPackage.returnDetails) && selectedPackage.returnDetails.length > 0 && (
                  <div className="detail-item full-width">
                    <span className="label">Returned Items</span>
                    <div className="nested-details">
                      {selectedPackage.returnDetails.map((it, idx) => (
                        <div key={idx} className="nested-detail">
                          <span className="nested-label">{it.description || `Item ${it.itemId}`}:</span>
                          <span>Qty: {it.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {(selectedPackage.returnRefundAmount !== null && selectedPackage.returnRefundAmount !== undefined) && (
                  <div className="detail-item">
                    <span className="label">Return Refund</span>
                    <span>EGP {parseFloat(selectedPackage.returnRefundAmount || 0).toFixed(2)}</span>
                  </div>
                )}
                {selectedPackage.shownDeliveryCost !== undefined && selectedPackage.shownDeliveryCost !== null && (
                  <div className="detail-item">
                    <span className="label">Shown Delivery Cost</span>
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
                  <div className="detail-item">
                    <span className="label">Weight</span>
                    <span>{selectedPackage.weight} kg</span>
                  </div>
                )}
                {selectedPackage.dimensions && (
                  <div className="detail-item">
                    <span className="label">Dimensions</span>
                    <span>{selectedPackage.dimensions}</span>
                  </div>
                )}
                <div className="detail-item">
                  <span className="label">Number of Items</span>
                  <span>{selectedPackage.itemsNo ?? '-'}</span>
                </div>

                {/* Exchange Details */}
                {(selectedPackage.type === 'exchange' || (selectedPackage.status || '').startsWith('exchange-')) && selectedPackage.exchangeDetails && (
                  <div className="detail-item full-width">
                    <span className="label">Exchange Details</span>
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
                  <div className="detail-item full-width">
                    <span className="label">Items</span>
                    <div style={{ 
                      backgroundColor: '#f8f9fa', 
                      padding: '1rem', 
                      borderRadius: '8px',
                      border: '1px solid #e0e0e0',
                      marginTop: '0.5rem'
                    }}>
                      {selectedPackage.Items.map((item, index) => (
                        <div key={item.id} style={{ 
                          border: '1px solid #ddd', 
                          padding: '0.75rem', 
                          marginBottom: '0.5rem', 
                          borderRadius: '4px',
                          backgroundColor: 'white'
                        }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '1rem', alignItems: 'center' }}>
                            <div>
                              <strong>Description:</strong> {item.description}
                            </div>
                            <div>
                              <strong>Quantity:</strong> {item.quantity}
                            </div>
                            <div>
                              <strong>COD Per Unit:</strong> EGP {item.codAmount && item.quantity ? (parseFloat(item.codAmount) / parseInt(item.quantity)).toFixed(2) : '0.00'}
                            </div>
                            <div>
                              <strong>Total COD:</strong> EGP {parseFloat(item.codAmount || 0).toFixed(2)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {selectedPackage?.deliveredItems && Array.isArray(selectedPackage.deliveredItems) && selectedPackage.deliveredItems.length > 0 && (
                  <div className="detail-item full-width" style={{ marginTop: 8 }}>
                    <span className="label">Delivered Items</span>
                    <div className="nested-details">
                      {selectedPackage.deliveredItems.map((di, idx) => {
                        const match = (selectedPackage.Items || []).find(it => String(it.id) === String(di.itemId));
                        const label = match?.description || `Item ${di.itemId}`;
                        return (
                          <div key={`shop-under-items-delivered-${idx}`} className="nested-detail">
                            <span className="nested-label">{label}:</span>
                            <span>Qty: {di.deliveredQuantity}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
              
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
              <div className="modal-actions">
                {['delivered', 'delivered-returned'].includes(selectedPackage.status) && (
                  <>
                    <button
                      className="btn"
                      style={{ background: '#ff8c00', color: '#fff', marginRight: 8 }}
                      onClick={() => setShowReturnModal(true)}
                    >
                      Request Return
                    </button>
                    <button
                      className="btn"
                      style={{ background: '#0d6efd', color: '#fff', marginRight: 8 }}
                      onClick={() => setShowExchangeModal(true)}
                    >
                      Request Exchange
                    </button>
                  </>
                )}
                <button className="btn close-btn" onClick={() => setShowPackageDetailsModal(false)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showReturnModal && selectedPackage && (
        <div className="confirmation-overlay" onClick={() => setShowReturnModal(false)}>
          <div className="confirmation-dialog" onClick={e => e.stopPropagation()}>
            <h3>Request Return</h3>
            <p>Select items to return and enter the refund to give to the customer (can be 0).</p>
            <div style={{ maxHeight: 300, overflowY: 'auto', border: '1px solid #eee', borderRadius: 8, padding: 8, marginBottom: 8 }}>
              {(selectedPackage.Items || []).map((it, idx) => (
                <div key={it.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                  <div><b>{it.description}</b></div>
                  <div>Qty: {it.quantity}</div>
                  <div>
                    <input
                      type="number"
                      min="0"
                      max={it.quantity}
                      value={(returnItems[it.id]?.quantity ?? 0)}
                      onChange={e => setReturnItems(prev => ({ ...prev, [it.id]: { quantity: Math.min(Math.max(0, parseInt(e.target.value || '0', 10)), it.quantity) } }))}
                      placeholder="Return qty"
                    />
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 8 }}>
              <label>Returned items COD to customer (EGP)</label>
              <input type="number" min="0" step="0.01" value={returnRefund} onChange={e => setReturnRefund(e.target.value)} />
            </div>
            {returnError && <div style={{ color: '#dc3545', marginTop: 8 }}>{returnError}</div>}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
              <button className="btn" onClick={() => setShowReturnModal(false)}>Cancel</button>
              <button className="btn" style={{ background: '#28a745', color: '#fff' }} disabled={requestingReturn} onClick={submitReturnRequest}>
                {requestingReturn ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showExchangeModal && selectedPackage && (
        <div className="confirmation-overlay" onClick={() => setShowExchangeModal(false)}>
          <div className="confirmation-dialog" onClick={e => e.stopPropagation()} style={{ maxWidth: 900, width: '95vw', padding: 16 }}>
            <h3 style={{ marginBottom: 12 }}>Request Exchange</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'start' }}>
              <div style={{ background: '#fafafa', border: '1px solid #e9ecef', borderRadius: 8, padding: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <h4 style={{ margin: 0, fontSize: 16 }}>Items to take from customer</h4>
                  <button className="btn" onClick={() => addRow(setTakeItems)} style={{ padding: '4px 10px' }}>Add Item</button>
                </div>
                <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 220, overflowY: 'auto' }}>
                  {takeItems.map((row, idx) => (
                    <div key={`take-${idx}`} style={{ display: 'grid', gridTemplateColumns: '1fr 90px auto', gap: 8, alignItems: 'center' }}>
                      <input
                        type="text"
                        placeholder="Item description"
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
                      <button className="btn" onClick={() => removeRow(setTakeItems, idx)} style={{ padding: '6px 10px', background: '#fff', border: '1px solid #dc3545', color: '#dc3545' }}>Remove</button>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ background: '#fafafa', border: '1px solid #e9ecef', borderRadius: 8, padding: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <h4 style={{ margin: 0, fontSize: 16 }}>Items to give to customer</h4>
                  <button className="btn" onClick={() => addRow(setGiveItems)} style={{ padding: '4px 10px' }}>Add Item</button>
                </div>
                <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 220, overflowY: 'auto' }}>
                  {giveItems.map((row, idx) => (
                    <div key={`give-${idx}`} style={{ display: 'grid', gridTemplateColumns: '1fr 90px auto', gap: 8, alignItems: 'center' }}>
                      <input
                        type="text"
                        placeholder="Item description"
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
                      <button className="btn" onClick={() => removeRow(setGiveItems, idx)} style={{ padding: '6px 10px', background: '#fff', border: '1px solid #dc3545', color: '#dc3545' }}>Remove</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ marginTop: 16, background: '#f8f9fa', border: '1px solid #e9ecef', borderRadius: 8, padding: 12 }}>
              <h4 style={{ margin: '0 0 8px 0', fontSize: 16 }}>Money</h4>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <input type="radio" name="moneyType" value="give" checked={moneyType === 'give'} onChange={() => setMoneyType('give')} />
                  Money to give to customer
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <input type="radio" name="moneyType" value="take" checked={moneyType === 'take'} onChange={() => setMoneyType('take')} />
                  Money to take from customer
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Amount (EGP)"
                  value={moneyAmount}
                  onChange={e => setMoneyAmount(e.target.value)}
                  style={{ padding: '8px 10px', border: '1px solid #ced4da', borderRadius: 6, width: 200 }}
                />
              </div>
              <div style={{ marginTop: 6, color: '#666', fontSize: 12 }}>This will adjust your Total Collected accordingly when the exchange is completed.</div>
            </div>

            {exchangeError && <div style={{ color: '#dc3545', marginTop: 8 }}>{exchangeError}</div>}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14 }}>
              <button className="btn" onClick={() => setShowExchangeModal(false)} style={{ background: '#f1f3f5' }}>Cancel</button>
              <button className="btn" style={{ background: canSubmitExchange ? '#0d6efd' : '#9bbcf5', color: '#fff' }} disabled={requestingExchange || !canSubmitExchange} onClick={submitExchangeRequest}>
                {requestingExchange ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShopPackages; 