import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { packageService } from '../../services/api';
import './MobileShopDashboard.css';
import QRCode from 'qrcode';
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
  { label: 'Cancelled', value: 'cancelled' },
  { label: 'Rejected', value: 'rejected' },
];
const inTransitStatuses = ['assigned', 'pickedup', 'in-transit'];
const returnToShopStatuses = ['cancelled-awaiting-return', 'cancelled-returned', 'rejected-awaiting-return', 'rejected-returned', 'return-requested', 'return-in-transit', 'return-pending', 'return-completed'];

const MobileShopPackages = () => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [packageToCancel, setPackageToCancel] = useState(null);
  const [cancelError, setCancelError] = useState(null);
  const [editingNotes, setEditingNotes] = useState('');
  const [notesSaving, setNotesSaving] = useState(false);
  const [notesError, setNotesError] = useState(null);

  // Selection for bulk AWB print
  const [selectedPackages, setSelectedPackages] = useState([]);

  const [shopFees, setShopFees] = useState({ shippingFees: null, shownShippingFees: null });
  const [editingShownDeliveryCost, setEditingShownDeliveryCost] = useState(false);
  const [newShownDeliveryCost, setNewShownDeliveryCost] = useState('');
  const [savingShownDeliveryCost, setSavingShownDeliveryCost] = useState(false);
  const [shownDeliveryCostError, setShownDeliveryCostError] = useState('');

  // Edit details (mobile) pre-pending
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

  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnItems, setReturnItems] = useState({});
  const [returnRefund, setReturnRefund] = useState('');
  const [returnError, setReturnError] = useState('');
  const [requestingReturn, setRequestingReturn] = useState(false);
  // Exchange modal (mobile)
  const [showExchangeModal, setShowExchangeModal] = useState(false);

  const prePendingStatuses = ['awaiting_schedule', 'scheduled_for_pickup'];
  const canEditThisPackage = (pkg) => prePendingStatuses.includes((pkg?.status || '').toLowerCase());

  function parseAddressToFields(addr) {
    if (!addr || typeof addr !== 'string') {
      return { street: '', city: '', state: '', zipCode: '', country: '' };
    }
    const parts = addr.split(',').map(s => s.trim());
    const street = parts[0] || '';
    let city = parts[1] || '';
    let state = '';
    let zipCode = '';
    if (parts.length >= 3) {
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
      if (Array.isArray(editItems)) {
        payload.items = editItems.map(it => ({
          description: it.description,
          quantity: parseInt(it.quantity) || 1,
          codPerUnit: parseFloat(it.codPerUnit) || 0
        }));
      }
      if (editShopNotes !== '') payload.shopNotes = editShopNotes;

      await packageService.updatePackage(selectedPackage.id, payload);
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
      setError(null);
      try {
        const res = await packageService.getPackages({ limit: 10000 });
        setPackages(res.data.packages || res.data || []);
        
        // Check if we need to reopen a package modal after refresh
        const reopenPackageId = localStorage.getItem('reopenPackageModal');
        if (reopenPackageId) {
          const packageToReopen = (res.data.packages || res.data || []).find(pkg => pkg.id == reopenPackageId);
          if (packageToReopen) {
            setSelectedPackage(packageToReopen);
            setShowDetailsModal(true);
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
    async function fetchShopFees() {
      try {
        const res = await packageService.getShopProfile();
        console.log('DEBUG: shop profile response:', res.data);
        setShopFees({
          shippingFees: res.data.shippingFees || 0,
          shownShippingFees: res.data.shownShippingFees ?? null,
          businessName: res.data.businessName || res.data.shop?.businessName || '-'
        });
      } catch {}
    }
    fetchShopFees();
  }, []);

  const filterPackages = () => {
    let filtered = [...packages];
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(pkg =>
        pkg.trackingNumber?.toLowerCase().includes(searchLower) ||
        pkg.packageDescription?.toLowerCase().includes(searchLower) ||
        pkg.deliveryContactName?.toLowerCase().includes(searchLower) ||
        pkg.status?.toLowerCase().includes(searchLower)
      );
    }
    if (activeTab === 'all') {
      return filtered;
    } else if (activeTab === 'in-transit') {
      return filtered.filter(pkg => inTransitStatuses.includes(pkg.status));
    } else if (activeTab === 'delivered') {
      // Sort delivered packages by actualDeliveryTime descending
      return filtered
        .filter(pkg => pkg.status === 'delivered')
        .slice()
        .sort((a, b) => {
          const aTime = a.actualDeliveryTime ? new Date(a.actualDeliveryTime).getTime() : 0;
          const bTime = b.actualDeliveryTime ? new Date(b.actualDeliveryTime).getTime() : 0;
          return bTime - aTime;
        });
    } else if (activeTab === 'return-to-shop') {
      return filtered.filter(pkg => returnToShopStatuses.includes(pkg.status));
    } else if (activeTab === 'cancelled') {
      return filtered.filter(pkg => ['cancelled', 'cancelled-awaiting-return', 'cancelled-returned'].includes(pkg.status));
    } else if (activeTab === 'rejected') {
      return filtered.filter(pkg => pkg.status === 'rejected');
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

  // Bulk selection helpers
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
      case 'cancelled':
      case 'cancelled-awaiting-return':
      case 'cancelled-returned':
        return '#dc3545';
      default:
        return '#6c757d';
    }
  };

  const openDetailsModal = async (pkg) => {
    // Normalize deliveredItems on initial object
    let initialDelivered = pkg.deliveredItems ?? pkg.delivereditems ?? null;
    if (typeof initialDelivered === 'string') {
      try { initialDelivered = JSON.parse(initialDelivered); } catch { initialDelivered = null; }
    }
    if (!Array.isArray(initialDelivered)) initialDelivered = [];
    setSelectedPackage({ ...pkg, deliveredItems: initialDelivered });
    setShowDetailsModal(true);
    try {
      // Fetch complete package details including items
      const response = await packageService.getPackageById(pkg.id);
      console.log('Shop - Fetched package details:', response.data);
      console.log('Shop - Items data:', response.data.Items);
      if (response.data.Items && response.data.Items.length > 0) {
        console.log('Shop - First item details:', response.data.Items[0]);
      }
      // Normalize deliveredItems on fetched response
      let fetchedDelivered = response.data.deliveredItems ?? response.data.delivereditems ?? null;
      if (typeof fetchedDelivered === 'string') { try { fetchedDelivered = JSON.parse(fetchedDelivered); } catch { fetchedDelivered = null; } }
      if (!Array.isArray(fetchedDelivered)) fetchedDelivered = [];
      setSelectedPackage({ ...response.data, deliveredItems: fetchedDelivered });
    } catch (err) {
      console.error('Failed to fetch complete package details:', err);
      // Keep the original package data if fetch fails
    }
  };

  const closeDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedPackage(null);
  };

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

  const handlePrintAWB = async (pkg) => {
    // Fetch full package with Items if missing
    let packageForAwb = pkg;
    try {
      if (!pkg?.Items || !Array.isArray(pkg.Items)) {
        const resp = await packageService.getPackageById(pkg.id);
        if (resp && resp.data) packageForAwb = resp.data;
      }
    } catch (e) {}

    // Fetch the latest shop profile for the most up-to-date businessName
    let shopName = '-';
    try {
      const profileRes = await packageService.getShopProfile();
      shopName = profileRes?.data?.businessName || '-';
    } catch (e) {}

    const logoUrl = window.location.origin + '/logo.jpg';
    const qrDataUrl = await QRCode.toDataURL((packageForAwb.trackingNumber || pkg.trackingNumber) || '');

    const cod = parseFloat((packageForAwb.codAmount != null ? packageForAwb.codAmount : pkg.codAmount) || 0);
    const isShopify = (packageForAwb.shopifyOrderId !== undefined && packageForAwb.shopifyOrderId !== null && packageForAwb.shopifyOrderId !== '');
    const itemsSum = (Array.isArray(packageForAwb.Items) && packageForAwb.Items.length > 0)
      ? packageForAwb.Items.reduce((sum, it) => sum + (parseFloat(it.codAmount || 0) || 0), 0)
      : cod;
    let shippingValue = (packageForAwb.shownDeliveryCost !== undefined && packageForAwb.shownDeliveryCost !== null && packageForAwb.shownDeliveryCost !== '')
      ? Number(packageForAwb.shownDeliveryCost)
      : ((shopFees.shownShippingFees !== undefined && shopFees.shownShippingFees !== null && shopFees.shownShippingFees !== '')
        ? Number(shopFees.shownShippingFees)
        : Number(shopFees.shippingFees));
    if (!Number.isFinite(shippingValue) || shippingValue < 0) shippingValue = 0;
    
    // For Shopify packages: Sub Total = COD - shownShippingFees, Delivery fees = shownShippingFees, Total = COD
    // For manually created packages: Sub Total = itemsSum, Delivery fees = shippingValue, Total = subTotal + shipping
    const subTotal = isShopify ? Math.max(0, cod - shippingValue) : itemsSum;
    const deliveryFees = isShopify ? shippingValue : shippingValue;
    const total = isShopify ? cod : (subTotal + shippingValue);

    const awbPkg = packageForAwb;
    const totalsRows = isShopify
      ? `<tr><td>Sub Total:</td><td>${subTotal.toFixed(2)} EGP</td></tr>`
        + `<tr><td>Delivery fees & Taxes:</td><td>${deliveryFees.toFixed(2)} EGP</td></tr>`
        + `<tr><td><b>Total:</b></td><td><b>${total.toFixed(2)} EGP</b></td></tr>`
      : `<tr><td>Sub Total:</td><td>${subTotal.toFixed(2)} EGP</td></tr>`
        + `<tr><td>Shipping:</td><td>${deliveryFees.toFixed(2)} EGP</td></tr>`
        + `<tr><td><b>Total:</b></td><td><b>${total.toFixed(2)} EGP</b></td></tr>`;

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
            <table class=\"awb-table\">\n              <thead>\n                <tr><th>Item</th><th>Qty</th><th>COD Per Unit</th><th>Total COD</th></tr>\n              </thead>\n              <tbody>\n                ${
                  awbPkg.Items && awbPkg.Items.length > 0
                    ? awbPkg.Items.map(item => `\n                      <tr>\n                        <td>${item.description || '-'}</td>\n                        <td>${item.quantity}</td>\n                        <td>${item.codAmount && item.quantity ? (item.codAmount / item.quantity).toFixed(2) : '0.00'} EGP</td>\n                        <td>${parseFloat(item.codAmount || 0).toFixed(2)} EGP</td>\n                      </tr>\n                    `).join('')
                    : `\n                      <tr>\n                        <td>${awbPkg.packageDescription || '-'}</td>\n                        <td>${awbPkg.itemsNo ?? 1}</td>\n                        <td>${cod.toFixed(2)} EGP</td>\n                        <td>${cod.toFixed(2)} EGP</td>\n                      </tr>`
                }\n              </tbody>\n            </table>\n            <div class=\"awb-section\">\n              <b>Payment Method:</b> COD\n            </div>\n            <div class=\"awb-section\" style=\"display:flex;justify-content:flex-end;\">\n              <table class=\"awb-info-table\" style=\"width:300px;\">\n                ${totalsRows}\n              </table>\n            </div>`;

    const itemsSectionExchange = `
            <div class=\"awb-section\">\n              <table class=\"awb-table\">\n                <thead>\n                  <tr><th colspan=\"2\">Items to take from customer</th></tr>\n                </thead>\n                <tbody>\n                  ${
                    takeItems.length > 0
                      ? takeItems.map(it => `\n                          <tr>\n                            <td>${(it.description || '-')}</td>\n                            <td>Qty: ${(parseInt(it.quantity) || 0)}</td>\n                          </tr>\n                        `).join('')
                      : `<tr><td colspan=\"2\">None</td></tr>`
                  }\n                </tbody>\n              </table>\n              <table class=\"awb-table\" style=\"margin-top:12px;\">\n                <thead>\n                  <tr><th colspan=\"2\">Items to give to customer</th></tr>\n                </thead>\n                <tbody>\n                  ${
                    giveItems.length > 0
                      ? giveItems.map(it => `\n                          <tr>\n                            <td>${(it.description || '-')}</td>\n                            <td>Qty: ${(parseInt(it.quantity) || 0)}</td>\n                          </tr>\n                        `).join('')
                      : `<tr><td colspan=\"2\">None</td></tr>`
                  }\n                </tbody>\n              </table>\n            </div>\n            <div class=\"awb-section\" style=\"display:flex;justify-content:flex-end;\">\n              <table class=\"awb-info-table\" style=\"width:360px;\">\n                <tr><td>${moneyLabel}:</td><td>EGP ${moneyAmount.toFixed(2)}</td></tr>\n                <tr><td>Shipping Fees:</td><td>EGP ${shippingDisplay.toFixed(2)}</td></tr>\n              </table>\n            </div>`;

    // Build AWB HTML (copied from desktop)
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
        <body>
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

    // Safari-friendly print: use a hidden iframe with srcdoc
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.setAttribute('aria-hidden', 'true');
    document.body.appendChild(iframe);
    const onLoad = () => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } finally {
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 1000);
      }
    };
    if ('srcdoc' in iframe) {
      iframe.onload = onLoad;
      iframe.srcdoc = awbHtml;
    } else {
      const idoc = iframe.contentWindow?.document;
      if (idoc) {
        idoc.open();
        idoc.write(awbHtml);
        idoc.close();
        iframe.onload = onLoad;
      }
    }
  };

  // Submit return request (moved/defined to fix scope)
  const submitReturnRequest = async () => {
    if (!selectedPackage) {
      console.error('No package selected');
      return;
    }

    setRequestingReturn(true);
    setReturnError('');

    const selectedItems = Object.entries(returnItems).filter(([_, details]) => (details.quantity || 0) > 0);
    if (selectedItems.length === 0) {
      setReturnError('Please select at least one item to return');
      setRequestingReturn(false);
      notification.error({
        message: 'Return request failed',
        description: 'Please select at least one item to return',
        placement: 'topRight',
        duration: 4
      });
      return;
    }

    try {
      const payload = {
        items: selectedItems.map(([itemId, details]) => ({
          itemId: Number(itemId),
          quantity: details.quantity
        })),
        refundAmount: parseFloat(returnRefund) || 0
      };

      await packageService.requestReturn(selectedPackage.id, payload);

      setShowReturnModal(false);
      setShowDetailsModal(false);
      setSelectedPackage(null);
      setReturnItems({});
      setReturnRefund('');
      setReturnError('');

      notification.success({
        message: 'Return requested',
        description: 'Return request submitted successfully!',
        placement: 'topRight',
        duration: 3
      });

      try {
        const res = await packageService.getPackages({ limit: 10000 });
        setPackages(res.data.packages || res.data || []);
      } catch (e) {}

      setTimeout(() => {
        try { window.location.reload(); } catch (_) {}
      }, 800);
    } catch (err) {
      setReturnError(err.response?.data?.message || 'Failed to submit return request.');
      notification.error({
        message: 'Return request failed',
        description: err.response?.data?.message || 'Failed to submit return request.',
        placement: 'topRight',
        duration: 4
      });
    } finally {
      setRequestingReturn(false);
    }
  };

  // Bulk print AWB for selected packages
  const handleBulkPrintAWB = async () => {
    const pkgsToPrint = packages.filter(pkg => selectedPackages.includes(pkg.id));
    if (pkgsToPrint.length === 0) return;

    const awbSections = [];
    for (let i = 0; i < pkgsToPrint.length; i++) {
      const pkg = pkgsToPrint[i];
      const logoUrl = window.location.origin + '/logo.jpg';

      // Ensure we have Items data
      let packageData = pkg;
      try {
        if (!pkg?.Items || !Array.isArray(pkg.Items)) {
          const resp = await packageService.getPackageById(pkg.id);
          if (resp && resp.data) packageData = resp.data;
        }
      } catch (e) {}

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
                  <div class="awb-shop-name">Shop Name: ${shopName}</div>
                </td>
                <td><b>Date:</b> ${packageData.createdAt ? new Date(packageData.createdAt).toLocaleDateString() : (pkg.createdAt ? new Date(pkg.createdAt).toLocaleDateString() : '-')}</td>
              </tr>
              <tr>
                <td colspan="2">
                  <span class="awb-row"><b class="awb-recipient">Recipient:</b><span class="awb-recipient awb-data">${packageData.deliveryContactName || '-'}</span></span><br/>
                  <span class="awb-row"><b class="awb-phone">Phone:</b><span class="awb-phone awb-data">${packageData.deliveryContactPhone || '-'}</span></span><br/>
                  <span class="awb-row"><b class="awb-address">Address:</b><span class="awb-address awb-data">${packageData.deliveryAddress || '-'}</span></span>
                  ${isShopify ? `<div><b>Shopify Order:</b> ${packageData.shopifyOrderName || packageData.shopifyOrderId}</div>` : ''}
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
            @media print { .awb-container { page-break-inside: avoid; } }
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

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.setAttribute('aria-hidden', 'true');
    document.body.appendChild(iframe);
    const cleanup = () => {
      try { document.body.removeChild(iframe); } catch(e) {}
    };
    if ('srcdoc' in iframe) {
      iframe.srcdoc = fullHtml;
      setTimeout(cleanup, 3000);
    } else {
      const idoc = iframe.contentWindow?.document;
      if (idoc) {
        idoc.open();
        idoc.write(fullHtml);
        idoc.close();
        setTimeout(cleanup, 3000);
      }
    }
  };

  function MobileExchangeForm({ selectedPackage, onSubmitted }) {
    const [takeItems, setTakeItems] = React.useState([{ description: '', quantity: 1 }]);
    const [giveItems, setGiveItems] = React.useState([{ description: '', quantity: 1 }]);
    const [moneyType, setMoneyType] = React.useState('give');
    const [moneyAmount, setMoneyAmount] = React.useState('');
    const [submitting, setSubmitting] = React.useState(false);
    const [error, setError] = React.useState('');

    const addRow = (setter) => setter(prev => [...prev, { description: '', quantity: 1 }]);
    const updateRow = (setter, idx, key, value) => setter(prev => prev.map((r, i) => i === idx ? { ...r, [key]: value } : r));
    const removeRow = (setter, idx) => setter(prev => prev.filter((_, i) => i !== idx));

    const hasValidItems = (arr) => Array.isArray(arr) && arr.some(r => (r.description || '').trim() !== '' && (parseInt(r.quantity) || 0) > 0);
    const canSubmit = hasValidItems(takeItems) || hasValidItems(giveItems) || (moneyAmount !== '' && Number.isFinite(parseFloat(moneyAmount)) && parseFloat(moneyAmount) >= 0);

    const submit = async () => {
      if (!canSubmit || submitting || !selectedPackage) return;
      setSubmitting(true);
      setError('');
      try {
        const payload = {
          takeItems: takeItems.filter(r => (r.description || '').trim() !== '' && (parseInt(r.quantity) || 0) > 0).map(r => ({ description: r.description.trim(), quantity: parseInt(r.quantity) || 1 })),
          giveItems: giveItems.filter(r => (r.description || '').trim() !== '' && (parseInt(r.quantity) || 0) > 0).map(r => ({ description: r.description.trim(), quantity: parseInt(r.quantity) || 1 })),
          cashDelta: parseFloat(moneyAmount || 0) || 0,
          moneyType
        };
        await packageService.requestExchange(selectedPackage.id, payload);
        onSubmitted && onSubmitted();
      } catch (err) {
        setError(err?.response?.data?.message || 'Failed to submit exchange request.');
      } finally {
        setSubmitting(false);
      }
    };

    return (
      <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 10, padding: 12, boxShadow: '0 1px 6px rgba(0,0,0,0.06)', overflowX: 'hidden' }}>
        {error && <div style={{ background: '#ffebee', color: '#c62828', border: '1px solid #ffcdd2', borderRadius: 6, padding: 8, marginBottom: 10 }}>{error}</div>}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Take from customer */}
          <div style={{ background: '#fafafa', border: '1px solid #eee', borderRadius: 8, padding: 10 }}>
            <div style={{ fontWeight: 700, color: '#333', marginBottom: 8 }}>Take from customer</div>
            {takeItems.map((row, idx) => (
              <div key={`t-${idx}`} style={{ display: 'grid', gridTemplateColumns: '1fr 90px 70px', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: '#555', marginBottom: 4 }}>Description</label>
                  <input placeholder="Item name" value={row.description} onChange={e => updateRow(setTakeItems, idx, 'description', e.target.value)} style={{ width: '100%', padding: '8px 10px', border: '1px solid #ddd', borderRadius: 6 }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: '#555', marginBottom: 4 }}>Qty</label>
                  <input type="number" min="1" value={row.quantity} onChange={e => updateRow(setTakeItems, idx, 'quantity', e.target.value)} style={{ width: '100%', padding: '8px 10px', border: '1px solid #ddd', borderRadius: 6 }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: 'transparent', marginBottom: 4 }}>Remove</label>
                  <button onClick={() => removeRow(setTakeItems, idx)} style={{ width: '100%', padding: '8px 10px', background: '#ffeaea', color: '#c62828', border: '1px solid #f5b5b5', borderRadius: 6 }}>Remove</button>
                </div>
              </div>
            ))}
            <button onClick={() => addRow(setTakeItems)} style={{ padding: '8px 12px', background: '#f5f5f5', border: '1px solid #ddd', borderRadius: 6, fontWeight: 600 }}>+ Add item</button>
          </div>

          {/* Give to customer */}
          <div style={{ background: '#fafafa', border: '1px solid #eee', borderRadius: 8, padding: 10 }}>
            <div style={{ fontWeight: 700, color: '#333', marginBottom: 8 }}>Give to customer</div>
            {giveItems.map((row, idx) => (
              <div key={`g-${idx}`} style={{ display: 'grid', gridTemplateColumns: '1fr 90px 70px', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: '#555', marginBottom: 4 }}>Description</label>
                  <input placeholder="Item name" value={row.description} onChange={e => updateRow(setGiveItems, idx, 'description', e.target.value)} style={{ width: '100%', padding: '8px 10px', border: '1px solid #ddd', borderRadius: 6 }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: '#555', marginBottom: 4 }}>Qty</label>
                  <input type="number" min="1" value={row.quantity} onChange={e => updateRow(setGiveItems, idx, 'quantity', e.target.value)} style={{ width: '100%', padding: '8px 10px', border: '1px solid #ddd', borderRadius: 6 }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: 'transparent', marginBottom: 4 }}>Remove</label>
                  <button onClick={() => removeRow(setGiveItems, idx)} style={{ width: '100%', padding: '8px 10px', background: '#ffeaea', color: '#c62828', border: '1px solid #f5b5b5', borderRadius: 6 }}>Remove</button>
                </div>
              </div>
            ))}
            <button onClick={() => addRow(setGiveItems)} style={{ padding: '8px 12px', background: '#f5f5f5', border: "1px solid #ddd", borderRadius: 6, fontWeight: 600 }}>+ Add item</button>
          </div>

          {/* Money section */}
          <div style={{ background: '#fafafa', border: '1px solid #eee', borderRadius: 8, padding: 10 }}>
            <div style={{ fontWeight: 700, color: '#333', marginBottom: 8 }}>Money</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#555', marginBottom: 4 }}>Type</label>
                <select value={moneyType} onChange={e => setMoneyType(e.target.value)} style={{ width: '100%', padding: '8px 10px', border: '1px solid #ddd', borderRadius: 6 }}>
                  <option value="give">Give to customer</option>
                  <option value="take">Take from customer</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#555', marginBottom: 4 }}>Amount</label>
                <input type="number" min="0" step="0.01" value={moneyAmount} onChange={e => setMoneyAmount(e.target.value)} style={{ width: '100%', padding: '8px 10px', border: '1px solid #ddd', borderRadius: 6 }} />
              </div>
            </div>
          </div>

          {/* Submit */}
          <button onClick={submit} disabled={!canSubmit || submitting} className="mobile-shop-package-details-btn" style={{ width: '100%', background: '#7b1fa2', color: '#fff', padding: '10px 14px', borderRadius: 8, fontWeight: 700 }}>
            {submitting ? 'Submitting...' : 'Request Exchange'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-shop-packages" style={{marginLeft: '1rem', marginRight: '1rem', marginTop: '6rem'}}>
      <h2 className="mobile-shop-packages-title">All Packages</h2>
      <div className="mobile-packages-tabs-modern">
        {TABS.map(tab => (
          <button
            key={tab.value}
            className={`mobile-packages-tab-modern${activeTab === tab.value ? ' active' : ''}`}
            onClick={() => setActiveTab(tab.value)}
          >
            {tab.label}
            <span className="mobile-packages-tab-count">
              {
                packages.filter(pkg => {
                  if (tab.value === 'all') return true;
                  if (tab.value === 'in-transit') return inTransitStatuses.includes(pkg.status);
                  if (tab.value === 'return-to-shop') return returnToShopStatuses.includes(pkg.status);
                  if (tab.value === 'cancelled') return ['cancelled', 'cancelled-awaiting-return', 'cancelled-returned'].includes(pkg.status);
                  if (tab.value === 'rejected') return ['rejected', 'rejected-awaiting-return', 'rejected-returned'].includes(pkg.status);
                  return pkg.status === tab.value;
                }).length
              }
            </span>
          </button>
        ))}
      </div>
      <div className="mobile-shop-dashboard-search">
        <input
          type="text"
          placeholder="Search packages..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>
      {/* Bulk controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, margin: '8px 0' }}>
        <button className="mobile-shop-package-details-btn" onClick={toggleSelectAll} style={{ background: '#f5f5f5', color: '#333' }}>
          {allSelected ? 'Deselect All' : 'Select All'}
        </button>
        <button className="mobile-shop-package-details-btn" onClick={handleBulkPrintAWB} disabled={selectedPackages.length === 0} style={{ background: '#6c757d', color: '#fff' }}>
          Print AWB for Selected ({selectedPackages.length})
        </button>
      </div>
      {loading ? (
        <div className="mobile-shop-dashboard-loading">Loading...</div>
      ) : error ? (
        <div className="mobile-shop-dashboard-error">{error}</div>
      ) : filterPackages().length === 0 ? (
        <div className="mobile-shop-dashboard-no-packages">No packages found.</div>
      ) : (
        <div className="mobile-shop-packages-list">
          {filterPackages().map(pkg => (
            <div key={pkg.id} className="mobile-shop-package-card">
              <div className="mobile-shop-package-header">
                                <input type="checkbox" checked={selectedPackages.includes(pkg.id)} onChange={() => toggleSelectPackage(pkg.id)} onClick={e => e.stopPropagation()} disabled={["cancelled","delivered","cancelled-returned","cancelled-awaiting-return","rejected"].includes(pkg.status)} style={{ marginRight: 8 }} />
                <span className={`mobile-shop-package-status-badge status-${pkg.status?.toLowerCase()}`}>
                  {pkg.status}
                  {activeTab === 'return-requests' && (
                    <span style={{ marginLeft: 5, padding: '2px 6px', fontSize: 10, borderRadius: 10, background: '#f55247', color: '#fff' }}>Return Request</span>
                  )}
                  {activeTab === 'exchange-requests' && (
                    <span style={{ marginLeft: 5, padding: '2px 6px', fontSize: 10, borderRadius: 10, background: '#7b1fa2', color: '#fff' }}>Exchange Request</span>
                  )}
                </span>
              </div>
              <div className="mobile-shop-package-info">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <div><strong>{pkg.trackingNumber || '-'}</strong></div>
                </div>
                <div><span className="mobile-shop-package-label">Description:</span> {pkg.packageDescription || '-'}</div>
                <div><span className="mobile-shop-package-label">Date:</span> {pkg.createdAt ? new Date(pkg.createdAt).toLocaleDateString() : '-'}</div>
                <div><span className="mobile-shop-package-label">Address:</span> {(pkg.deliveryAddress) || '-'}</div>
                {(pkg.deliveryContactName || pkg.deliveryContactPhone) && (
                  <div style={{ fontSize: 12, color: '#222', marginTop: 2 }}>
                    {pkg.deliveryContactName || 'N/A'}{pkg.deliveryContactPhone ? ` · ${pkg.deliveryContactPhone}` : ''}
                  </div>
                )}
                <div>
                  <span className="mobile-shop-package-label">COD:</span> EGP {parseFloat(pkg.codAmount || 0).toFixed(2)}
                  {pkg.isPaid ? (
                    <span className="mobile-cod-badge paid">Paid</span>
                  ) : (
                    <span className="mobile-cod-badge unpaid">Unpaid</span>
                  )}
                </div>
              </div>
              <div className="mobile-shop-package-actions">
                <button onClick={() => openDetailsModal(pkg)} className="mobile-shop-package-details-btn">View Details</button>

                {pkg.status !== 'delivered' && 
                  pkg.status !== 'cancelled' && 
                  pkg.status !== 'cancelled-awaiting-return' && 
                  pkg.status !== 'cancelled-returned' && 
                  pkg.status !== 'rejected' && 
                  pkg.status !== 'rejected-awaiting-return' && 
                  pkg.status !== 'rejected-returned' && 
                  pkg.status !== 'return-requested' && 
                  pkg.status !== 'return-in-transit' && 
                  pkg.status !== 'return-pending' && 
                  pkg.status !== 'return-completed' && (
                  <button onClick={() => { setPackageToCancel(pkg); setShowCancelModal(true); }} className="mobile-shop-package-cancel-btn">Cancel</button>
                )}
                {pkg.status === 'delivered' && (
                  <button
                    className="mobile-shop-package-details-btn"
                    style={{ background: '#ff8c00', color: '#fff' }}
                    onClick={async (e) => {
                      e.stopPropagation(); // Prevent opening the details modal
                      try {
                        // Fetch full package details to ensure we have items
                        const response = await packageService.getPackageById(pkg.id);
                        const fullPackage = response.data;
                        setSelectedPackage(fullPackage);
                        setShowReturnModal(true);
                        setReturnItems({});
                        setReturnRefund('');
                        setReturnError('');
                      } catch (err) {
                        console.error("Failed to fetch package details:", err);
                        notification.error({
                          message: 'Error',
                          description: 'Failed to load package details. Please try again.',
                          placement: 'topRight',
                          duration: 4
                        });
                      }
                    }}
                  >
                    Request Return
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Package Details Modal */}
      {showDetailsModal && selectedPackage && (
        <div className="mobile-modal-overlay" onClick={closeDetailsModal}>
          <div className="mobile-modal-content" onClick={e => e.stopPropagation()}>
            <div className="mobile-modal-header">
              <h3>Package Details</h3>
              {canEditThisPackage(selectedPackage) && !isEditingDetails && (
                <button className="mobile-shop-package-details-btn" onClick={() => openEditDetails(selectedPackage)} style={{ background: '#007bff', color: '#fff', marginRight: 8 }}>Edit</button>
              )}
              <button className="mobile-shop-package-details-btn" onClick={(e) => { e.stopPropagation(); handlePrintAWB(selectedPackage); }} style={{ background: '#6c757d', color: '#fff', marginRight: 8 }}>Print AWB</button>
              <button className="mobile-modal-close" onClick={closeDetailsModal}>&times;</button>
            </div>
            <div className="mobile-modal-body">
              
              {isEditingDetails && (
                <div style={{ background: '#ffffff', borderRadius: 12, padding: '0.75rem', marginBottom: '0.75rem', border: '1px solid #eee', boxShadow:'0 1px 2px rgba(16,24,40,0.06)' }}>
                  {saveDetailsError && <div className="mobile-shop-create-error" style={{ marginBottom: 8 }}>{saveDetailsError}</div>}

                  <div style={{ background:'#fafafa', border:'1px solid #f1f1f1', borderRadius: 10, padding: 10, marginBottom: 8 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.5rem' }}>
                      <div>
                        <label style={{ display:'block', fontSize:12, color:'#555', marginBottom:4 }}>Description</label>
                        <input type="text" value={editDescription} onChange={e => setEditDescription(e.target.value)} />
                      </div>
                      <div>
                        <label style={{ display:'block', fontSize:12, color:'#555', marginBottom:4 }}>Priority</label>
                        <select value={editPriority} onChange={e => setEditPriority(e.target.value)}>
                          <option value="normal">Normal</option>
                          <option value="express">Express</option>
                          <option value="same-day">Same Day</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div style={{ background:'#fafafa', border:'1px solid #f1f1f1', borderRadius: 10, padding: 10, marginBottom: 8 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.5rem' }}>
                      <div>
                        <label style={{ display:'block', fontSize:12, color:'#555', marginBottom:4 }}>Recipient Name</label>
                        <input type="text" value={editRecipientName} onChange={e => setEditRecipientName(e.target.value)} />
                      </div>
                      <div>
                        <label style={{ display:'block', fontSize:12, color:'#555', marginBottom:4 }}>Recipient Phone</label>
                        <input type="text" value={editRecipientPhone} onChange={e => setEditRecipientPhone(e.target.value)} />
                      </div>
                      <div>
                        <label style={{ display:'block', fontSize:12, color:'#555', marginBottom:4 }}>Street</label>
                        <input type="text" value={editStreet} onChange={e => setEditStreet(e.target.value)} />
                      </div>
                      <div>
                        <label style={{ display:'block', fontSize:12, color:'#555', marginBottom:4 }}>City</label>
                        <input type="text" value={editCity} onChange={e => setEditCity(e.target.value)} />
                      </div>
                      <div>
                        <label style={{ display:'block', fontSize:12, color:'#555', marginBottom:4 }}>State</label>
                        <input type="text" value={editState} onChange={e => setEditState(e.target.value)} />
                      </div>
                      <div>
                        <label style={{ display:'block', fontSize:12, color:'#555', marginBottom:4 }}>Zip</label>
                        <input type="text" value={editZip} onChange={e => setEditZip(e.target.value)} />
                      </div>
                      <div>
                        <label style={{ display:'block', fontSize:12, color:'#555', marginBottom:4 }}>Country</label>
                        <input type="text" value={editCountry} onChange={e => setEditCountry(e.target.value)} />
                      </div>
                    </div>
                  </div>

                  <div style={{ background:'#fafafa', border:'1px solid #f1f1f1', borderRadius: 10, padding: 10, marginBottom: 8 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                      <div>
                        <label style={{ display:'block', fontSize:12, color:'#555', marginBottom:4 }}>Weight (kg)</label>
                        <input type="number" value={editWeight} onChange={e => setEditWeight(e.target.value)} />
                      </div>
                      <div>
                        <label style={{ display:'block', fontSize:12, color:'#555', marginBottom:4 }}>Type</label>
                        <select value={editType} onChange={e => setEditType(e.target.value)}>
                          <option value="new">New</option>
                          <option value="exchange">Exchange</option>
                          <option value="return">Return</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div style={{ background:'#fafafa', border:'1px solid #f1f1f1', borderRadius: 10, padding: 10, marginBottom: 8 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.5rem' }}>
                      <div>
                        <label style={{ display:'block', fontSize:12, color:'#555', marginBottom:4 }}>Schedule Pickup Time</label>
                        <input type="text" value={editSchedulePickupTime} onChange={e => setEditSchedulePickupTime(e.target.value)} placeholder="e.g. ASAP" />
                      </div>
                    </div>
                  </div>

                  <div style={{ background:'#fafafa', border:'1px solid #f1f1f1', borderRadius: 10, padding: 10, marginBottom: 8 }}>
                    <div style={{ fontWeight: 700, marginBottom: 8 }}>Items</div>
                    {editItems.map((it, idx) => (
                      <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 90px 110px 70px', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                        <div>
                          <label style={{ display:'block', fontSize:12, color:'#555', marginBottom:4 }}>Description</label>
                          <input type="text" value={it.description} onChange={e => setEditItems(prev => prev.map((r, i) => i === idx ? { ...r, description: e.target.value } : r))} />
                        </div>
                        <div>
                          <label style={{ display:'block', fontSize:12, color:'#555', marginBottom:4 }}>Qty</label>
                          <input type="number" value={it.quantity} onChange={e => setEditItems(prev => prev.map((r, i) => i === idx ? { ...r, quantity: e.target.value } : r))} />
                        </div>
                        <div>
                          <label style={{ display:'block', fontSize:12, color:'#555', marginBottom:4 }}>COD Per Unit</label>
                          <input type="number" value={it.codPerUnit} onChange={e => setEditItems(prev => prev.map((r, i) => i === idx ? { ...r, codPerUnit: e.target.value } : r))} />
                        </div>
                        <div>
                          <label style={{ display:'block', fontSize:12, color:'transparent', marginBottom:4 }}>Remove</label>
                          <button onClick={() => setEditItems(prev => prev.filter((_, i) => i !== idx))} style={{ width: '100%', padding: '8px 10px', background: '#ffeaea', color: '#c62828', border: '1px solid #f5b5b5', borderRadius: 6 }}>Remove</button>
                        </div>
                      </div>
                    ))}
                    <button onClick={() => setEditItems(prev => [...prev, { description: '', quantity: 1, codPerUnit: 0 }])} style={{ padding: '8px 12px', background: '#f5f5f5', border: '1px solid #ddd', borderRadius: 6, fontWeight: 600 }}>+ Add item</button>
                  </div>

                  <div style={{ background:'#fafafa', border:'1px solid #f1f1f1', borderRadius: 10, padding: 10, marginBottom: 8 }}>
                    <div>
                      <label style={{ display:'block', fontSize:12, color:'#555', marginBottom:4 }}>Shop Notes</label>
                      <textarea value={editShopNotes} onChange={e => setEditShopNotes(e.target.value)} rows={3} />
                    </div>
                  </div>

                  <div className="mobile-modal-actions">
                    <button onClick={saveEditedDetails} disabled={savingDetails} className="mobile-shop-package-details-btn" style={{ background: '#16a34a', color: '#fff' }}>{savingDetails ? 'Saving...' : 'Save'}</button>
                    <button onClick={() => setIsEditingDetails(false)} className="mobile-shop-package-details-btn" style={{ background: '#f3f4f6', color: '#111' }}>Cancel</button>
                  </div>
                </div>
              )}

              {!isEditingDetails && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <div>
                      {selectedPackage.shopifyOrderId && (
                      <div style={{ marginBottom: 8 }}>
                        <div className="mobile-shop-package-label">Shopify Order</div>
                        <div style={{ fontSize: 14, color: '#222' }}>{selectedPackage.shopifyOrderName || selectedPackage.shopifyOrderId}</div>
                      </div>
                    )}
                    <div className="mobile-shop-package-label">Description</div>
                      <div style={{ fontSize: 14, color: '#222' }}>{selectedPackage.packageDescription || '-'}</div>
                    </div>
                    <div>
                      <div className="mobile-shop-package-label">Date</div>
                      <div style={{ fontSize: 14, color: '#222' }}>{selectedPackage.createdAt ? new Date(selectedPackage.createdAt).toLocaleDateString() : '-'}</div>
                    </div>
                  </div>

                  <div style={{ marginTop: 10 }}>
                    <div className="mobile-shop-package-label">Address</div>
                    <div style={{ fontSize: 14, color: '#222' }}>{selectedPackage.deliveryAddress || '-'}</div>
                  </div>

                  <div style={{ marginTop: 10 }}>
                    <div className="mobile-shop-package-label">Recipient</div>
                    <div style={{ fontSize: 14, color: '#222' }}>{selectedPackage.deliveryContactName || 'N/A'}{selectedPackage.deliveryContactPhone ? ` · ${selectedPackage.deliveryContactPhone}` : ''}</div>
                  </div>

                  {Array.isArray(selectedPackage.Items) && selectedPackage.Items.length > 0 && (
                    <div style={{ marginTop: 10 }}>
                      <div className="mobile-shop-package-label">Items</div>
                      <div style={{ marginTop: 6 }}>
                        {selectedPackage.Items.map((it, i) => (
                          <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 60px 90px', gap: 8, padding: '8px 0', borderBottom: '1px solid #f1f1f1' }}>
                            <div style={{ fontSize: 14 }}>{it.description || '-'}</div>
                            <div style={{ fontSize: 14, color: '#555' }}>x{it.quantity || 1}</div>
                            <div style={{ fontSize: 14, color: '#111', textAlign: 'right' }}>EGP {parseFloat(it.codAmount || 0).toFixed(2)}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mobile-modal-actions">
                    <button className="mobile-shop-package-details-btn" onClick={(e) => { e.stopPropagation(); handlePrintAWB(selectedPackage); }} style={{ background: '#6c757d', color: '#fff' }}>Print AWB</button>
                    <button className="mobile-shop-package-details-btn" onClick={closeDetailsModal} style={{ background: '#f3f4f6', color: '#111' }}>Close</button>
                  </div>
                </>
              )}

              {/* Return modal */}
              {showReturnModal && (
                <div style={{ marginTop: 16 }}>
                  <div style={{ fontWeight: 700, marginBottom: 8 }}>Request Return</div>
                  {/* Items selection UI for return */}
                  <div>
                    {Array.isArray(selectedPackage?.Items) && selectedPackage.Items.length > 0 ? (
                      selectedPackage.Items.map((item, idx) => (
                        <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 100px', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                          <div>
                            <div style={{ fontSize: 14 }}>{item.description || '-'}</div>
                            <div style={{ fontSize: 12, color: '#666' }}>Qty: {item.quantity || 1}</div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <label style={{ fontSize: 12, color: '#555' }}>Return Qty</label>
                            <input type="number" min="0" max={item.quantity || 1} value={returnItems[item.id]?.quantity || 0} onChange={(e) => setReturnItems(prev => ({ ...prev, [item.id]: { quantity: parseInt(e.target.value) || 0 } }))} style={{ width: 80, padding: '6px 8px', border: '1px solid #ddd', borderRadius: 6 }} />
                          </div>
                        </div>
                      ))
                    ) : (
                      <div style={{ fontSize: 14, color: '#666' }}>No items to return.</div>
                    )}
                  </div>

                  <div style={{ marginTop: 10 }}>
                    <label style={{ display:'block', fontSize: 12, color: '#555', marginBottom: 4 }}>Refund Amount (EGP)</label>
                    <input type="number" min="0" step="0.01" value={returnRefund} onChange={e => setReturnRefund(e.target.value)} style={{ width: '100%', padding: '8px 10px', border: '1px solid #ddd', borderRadius: 6 }} />
                  </div>

                  {returnError && <div className="mobile-shop-create-error" style={{ marginTop: 8 }}>{returnError}</div>}

                  <div className="mobile-modal-actions">
                    <button onClick={submitReturnRequest} disabled={requestingReturn} className="mobile-shop-package-details-btn" style={{ background: '#16a34a', color: '#fff' }}>{requestingReturn ? 'Submitting...' : 'Submit'}</button>
                    <button onClick={() => { setShowReturnModal(false); setReturnItems({}); setReturnRefund(''); setReturnError(''); }} className="mobile-shop-package-details-btn" style={{ background: '#f3f4f6', color: '#111' }}>Cancel</button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {showCancelModal && packageToCancel && (
        <div className="mobile-modal-overlay" onClick={() => setShowCancelModal(false)}>
          <div className="mobile-modal-content" onClick={e => e.stopPropagation()}>
            <div className="mobile-modal-header">
              <h3>Confirm Cancel</h3>
              <button className="mobile-modal-close" onClick={() => setShowCancelModal(false)}>&times;</button>
            </div>
            <div className="mobile-modal-body">
              {cancelError && <div className="mobile-shop-create-error" style={{ marginBottom: 8 }}>{cancelError}</div>}
              <p>Are you sure you want to cancel this package?</p>
              <div className="mobile-modal-actions">
                <button onClick={handleCancel} className="mobile-shop-package-details-btn" style={{ background: '#ef4444', color: '#fff' }}>Yes, Cancel</button>
                <button onClick={() => setShowCancelModal(false)} className="mobile-shop-package-details-btn" style={{ background: '#f3f4f6', color: '#111' }}>No, Keep</button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default MobileShopPackages; 