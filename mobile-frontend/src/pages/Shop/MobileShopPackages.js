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
    
    // For manually created packages, subtotal is just the itemsSum, not cod
    const subTotal = itemsSum;
    const shippingTaxes = isShopify ? Math.max(0, cod - itemsSum) : shippingValue;
    // Total should reflect COD for Shopify, otherwise subtotal + shipping
    const total = isShopify ? (subTotal + shippingTaxes) : (subTotal + shippingValue);

    const awbPkg = packageForAwb;
    const totalsRows = isShopify
      ? `<tr><td>Sub Total:</td><td>${subTotal.toFixed(2)} EGP</td></tr>`
        + `<tr><td>Shipping & Taxes:</td><td>${shippingTaxes.toFixed(2)} EGP</td></tr>`
        + `<tr><td><b>Total:</b></td><td><b>${total.toFixed(2)} EGP</b></td></tr>`
      : `<tr><td>Sub Total:</td><td>${subTotal.toFixed(2)} EGP</td></tr>`
        + `<tr><td>Shipping:</td><td>${shippingValue.toFixed(2)} EGP</td></tr>`
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

  const submitReturnRequest = async () => {
    if (!selectedPackage) {
      console.error("No package selected");
      return;
    }
    
    setRequestingReturn(true);
    setReturnError('');
    
    // Validate that at least one item is selected for return
    const selectedItems = Object.entries(returnItems).filter(([_, details]) => details.quantity > 0);
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
      
      console.log("Submitting return request:", payload);
      console.log("Package ID:", selectedPackage.id);
      
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
      
      // Refresh list without full page reload
      try {
        const res = await packageService.getPackages({ limit: 10000 });
        setPackages(res.data.packages || res.data || []);
      } catch (e) {
        console.error("Failed to refresh packages:", e);
      }
      
      // Ensure UI reflects latest state; fallback to a hard refresh shortly after
      setTimeout(() => {
        try { window.location.reload(); } catch (_) {}
      }, 800);
    } catch (err) {
      console.error("Return request failed:", err);
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
            <button onClick={() => addRow(setGiveItems)} style={{ padding: '8px 12px', background: '#f5f5f5', border: '1px solid #ddd', borderRadius: 6, fontWeight: 600 }}>+ Add item</button>
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
                <span className="mobile-shop-package-tracking">{pkg.trackingNumber}{pkg.type === 'return' && (<span style={{ marginLeft: 6, padding: '2px 6px', fontSize: 10, borderRadius: 10, background: '#ffe8cc', color: '#b45309' }}>Return</span>)}</span>
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
                <div><span className="mobile-shop-package-label">Descreption:</span> {pkg.packageDescription || '-'}</div>
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
                        <input type="tel" value={editRecipientPhone} onChange={e => setEditRecipientPhone(e.target.value.replace(/[^0-9]/g, ''))} />
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
                        <label style={{ display:'block', fontSize:12, color:'#555', marginBottom:4 }}>Zip Code</label>
                        <input type="text" value={editZip} onChange={e => setEditZip(e.target.value)} />
                      </div>
                      <div>
                        <label style={{ display:'block', fontSize:12, color:'#555', marginBottom:4 }}>Country</label>
                        <input type="text" value={editCountry} onChange={e => setEditCountry(e.target.value)} />
                      </div>
                    </div>
                  </div>

                  <div style={{ background:'#fafafa', border:'1px solid #f1f1f1', borderRadius: 10, padding: 10, marginBottom: 8 }}>
                    <label style={{ display:'block', fontSize:12, color:'#555', marginBottom:6 }}>Weight (kg)</label>
                    <input type="number" step="0.01" value={editWeight} onChange={e => setEditWeight(e.target.value)} style={{ width:'100%', marginBottom:6 }} />
                    <label style={{ display:'block', fontSize:12, color:'#555', marginBottom:6 }}>Dimensions (L × W × H)</label>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <input type="number" placeholder="L" value={editLen} onChange={e => setEditLen(e.target.value)} style={{ width: '33%' }} />
                      <input type="number" placeholder="W" value={editWid} onChange={e => setEditWid(e.target.value)} style={{ width: '33%' }} />
                      <input type="number" placeholder="H" value={editHei} onChange={e => setEditHei(e.target.value)} style={{ width: '33%' }} />
                    </div>
                  </div>

                  <div style={{ background:'#fafafa', border:'1px solid #f1f1f1', borderRadius: 10, padding: 10, marginBottom: 8 }}>
                    <label style={{ display:'block', fontSize:12, color:'#555', marginBottom:6 }}>Schedule Pickup Time</label>
                    <input type="datetime-local" value={editSchedulePickupTime} onChange={e => setEditSchedulePickupTime(e.target.value)} style={{ width:'100%' }} />
                  </div>

                  <div style={{ background:'#fafafa', border:'1px solid #f1f1f1', borderRadius: 10, padding: 10, marginBottom: 8 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                      <h5 style={{ margin: 0 }}>Items</h5>
                      <button className="mobile-shop-package-details-btn" style={{ background: '#17a2b8', color: '#fff' }} onClick={() => setEditItems(prev => [...prev, { description: '', quantity: 1, codPerUnit: '0' }])}>Add Item</button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {editItems.map((it, idx) => (
                        <div key={idx} style={{ border:'1px solid #eaeaea', borderRadius: 10, padding: 10, background:'#fff', boxShadow:'0 1px 1px rgba(16,24,40,0.04)' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: 6, alignItems: 'center' }}>
                            <input type="text" placeholder="Description" value={it.description} onChange={e => setEditItems(prev => prev.map((p,i)=> i===idx?{...p, description: e.target.value}:p))} />
                            <input type="number" placeholder="Qty" min="1" value={it.quantity} onChange={e => setEditItems(prev => prev.map((p,i)=> i===idx?{...p, quantity: e.target.value}:p))} />
                            <input type="number" placeholder="COD / unit" step="0.01" value={it.codPerUnit} onChange={e => setEditItems(prev => prev.map((p,i)=> i===idx?{...p, codPerUnit: e.target.value}:p))} />
                            <button className="mobile-shop-package-details-btn" style={{ background: '#dc3545', color: '#fff' }} onClick={() => setEditItems(prev => prev.filter((_,i)=> i!==idx))}>Remove</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div style={{ background:'#fafafa', border:'1px solid #f1f1f1', borderRadius: 10, padding: 10, marginTop: 8 }}>
                    <label style={{ display:'block', fontSize:12, color:'#555', marginBottom:6 }}>Type</label>
                    <select value={editType} onChange={e => setEditType(e.target.value)} style={{ width: '100%', padding: 8 }}>
                      <option value="new">New Package</option>
                      <option value="return">Return</option>
                      <option value="exchange">Exchange</option>
                    </select>
                  </div>

                  <div style={{ background:'#fafafa', border:'1px solid #f1f1f1', borderRadius: 10, padding: 10 }}>
                    <label style={{ display:'block', fontSize:12, color:'#555', marginBottom:6 }}>Shop Notes</label>
                    <textarea rows={3} value={editShopNotes} onChange={e => setEditShopNotes(e.target.value)} style={{ width: '100%' }} />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <button className="mobile-shop-package-details-btn" onClick={() => setIsEditingDetails(false)} style={{ background: '#6c757d', color: '#fff' }} disabled={savingDetails}>Cancel</button>
                    <button className="mobile-shop-package-details-btn" onClick={saveEditedDetails} style={{ background: '#28a745', color: '#fff' }} disabled={savingDetails}>{savingDetails ? 'Saving...' : 'Save'}</button>
                  </div>
                </div>
              )}
              <div className="mobile-modal-details-grid">
                <div className="mobile-modal-detail-item"><span className="label">Tracking #</span><span>{selectedPackage.trackingNumber}</span></div>
                <div className="mobile-modal-detail-item"><span className="label">Status</span><span>{selectedPackage.status}</span></div>
                <div className="mobile-modal-detail-item"><span className="label">Created</span><span>{new Date(selectedPackage.createdAt).toLocaleString()}</span></div>
                {selectedPackage.actualDeliveryTime && (
                  <div className="mobile-modal-detail-item"><span className="label">Delivery Time</span><span>{new Date(selectedPackage.actualDeliveryTime).toLocaleString()}</span></div>
                )}
                <div className="mobile-modal-detail-item full-width"><span className="label">Description</span><span>{selectedPackage.packageDescription || 'No description'}</span></div>
                <div className="mobile-modal-detail-item"><span className="label">Recipient</span><span>{selectedPackage.deliveryContactName || '-'}</span></div>
                {selectedPackage.deliveryContactPhone && (
                  <div className="mobile-modal-detail-item"><span className="label">Recipient Phone</span><span>{selectedPackage.deliveryContactPhone}</span></div>
                )}
                {selectedPackage.deliveryAddress && (
                  <div className="mobile-modal-detail-item full-width"><span className="label">Delivery Address</span><span>{selectedPackage.deliveryAddress?.address || selectedPackage.deliveryAddress}</span></div>
                )}
                <div className="mobile-modal-detail-item"><span className="label">COD</span><span>EGP {parseFloat(selectedPackage.codAmount || 0).toFixed(2)} {selectedPackage.isPaid ? 'Paid' : 'Unpaid'}</span></div>
                <div className="mobile-modal-detail-item"><span className="label">Type</span><span>{selectedPackage.type || 'new'}</span></div>
                <div className="mobile-modal-detail-item"><span className="label">Delivery Cost</span><span>EGP {parseFloat(selectedPackage.deliveryCost || 0).toFixed(2)}</span></div>
                {selectedPackage?.deliveredItems && Array.isArray(selectedPackage.deliveredItems) && selectedPackage.deliveredItems.length > 0 && (
                  <div className="mobile-modal-detail-item full-width">
                    <span className="label">Delivered Items</span>
                    <div style={{ backgroundColor: '#f9f9f9', padding: '0.5rem', borderRadius: '4px', border: '1px solid #e0e0e0', marginTop: '0.5rem' }}>
                      {selectedPackage.deliveredItems.map((it, idx) => {
                        const match = (selectedPackage.Items || []).find(x => String(x.id) === String(it.itemId));
                        const label = match?.description || `Item ${it.itemId}`;
                        return (
                          <div key={`mobile-shop-delivered-${idx}`} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 8px', background: '#fff', border: '1px solid #eaeaea', borderRadius: 6, marginBottom: 6 }}>
                            <span>{label}</span>
                            <span>Qty: {it.deliveredQuantity}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                {Array.isArray(selectedPackage.returnDetails) && selectedPackage.returnDetails.length > 0 && (
                  <div className="mobile-modal-detail-item full-width">
                    <span className="label">Returned Items</span>
                    <div style={{ backgroundColor: '#f9f9f9', padding: '0.5rem', borderRadius: '4px', border: '1px solid #e0e0e0', marginTop: '0.5rem' }}>
                      {selectedPackage.returnDetails.map((it, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 8px', background: '#fff', border: '1px solid #eaeaea', borderRadius: 6, marginBottom: 6 }}>
                          <span>{it.description || `Item ${it.itemId}`}</span>
                          <span>Qty: {it.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {selectedPackage.rejectionShippingPaidAmount !== undefined && selectedPackage.rejectionShippingPaidAmount !== null && (
                  <div className="mobile-modal-detail-item"><span className="label">Rejection Shipping Fees Paid</span><span>EGP {parseFloat(selectedPackage.rejectionShippingPaidAmount || 0).toFixed(2)}</span></div>
                )}
                {selectedPackage.weight && (
                  <div className="mobile-modal-detail-item"><span className="label">Weight</span><span>{selectedPackage.weight} kg</span></div>
                )}
                {selectedPackage.dimensions && (
                  <div className="mobile-modal-detail-item"><span className="label">Dimensions</span><span>{selectedPackage.dimensions}</span></div>
                )}
                <div className="mobile-modal-detail-item"><span className="label">Number of Items</span><span>{selectedPackage.itemsNo ?? '-'}</span></div>
                
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

                {Array.isArray(selectedPackage.returnDetails) && selectedPackage.returnDetails.length > 0 && (
                  <div className="mobile-modal-detail-item full-width">
                    <span className="label">Returned Items</span>
                    <div style={{ backgroundColor: '#f9f9f9', padding: '0.5rem', borderRadius: '4px', border: '1px solid #e0e0e0', marginTop: '0.5rem' }}>
                      {selectedPackage.returnDetails.map((it, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 8px', background: '#fff', border: '1px solid #eaeaea', borderRadius: 6, marginBottom: 6 }}>
                          <span>{it.description || `Item ${it.itemId}`}</span>
                          <span>Qty: {it.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Request Exchange (mobile) */}
                {(selectedPackage.status === 'delivered') && (
                  <div className="mobile-modal-detail-item full-width" style={{ marginTop: 8, display:'flex', justifyContent:'flex-end' }}>
                    <button className="mobile-shop-package-details-btn" style={{ background:'#7b1fa2', color:'#fff' }} onClick={() => setShowExchangeModal(true)}>
                      Request Exchange
                    </button>
                  </div>
                )}
                
                <div className="mobile-modal-detail-item full-width">
                  <span className="label">Notes Log</span>
                  <div className="notes-log-list">
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
                </div>
                {selectedPackage.shopNotes && (
                  <div className="mobile-modal-detail-item full-width"><span className="label">Shop notes</span><span>{selectedPackage.shopNotes}</span></div>
                )}
                {selectedPackage.shownDeliveryCost !== undefined && selectedPackage.shownDeliveryCost !== null && (
                  <div className="mobile-modal-detail-item">
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
                        <button
                          style={{ background: '#fff', border: '1px solid #007bff', color: '#007bff', borderRadius: 4, padding: '4px 12px', marginLeft: 4, cursor: 'pointer', fontWeight: 'bold' }}
                          onClick={() => {
                            setEditingShownDeliveryCost(true);
                            setNewShownDeliveryCost(selectedPackage.shownDeliveryCost !== undefined && selectedPackage.shownDeliveryCost !== null ? String(selectedPackage.shownDeliveryCost) : '');
                          }}
                        >
                          Edit
                        </button>
                      </span>
                    )}
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

      {showExchangeModal && selectedPackage && (
        <div className="mobile-modal-overlay" onClick={() => setShowExchangeModal(false)}>
          <div className="mobile-modal-content" onClick={e => e.stopPropagation()}>
            <div className="mobile-modal-header">
              <h3>Request Exchange</h3>
              <button className="mobile-modal-close" onClick={() => setShowExchangeModal(false)}>&times;</button>
            </div>
            <div className="mobile-modal-body">
              <MobileExchangeForm selectedPackage={selectedPackage} onSubmitted={async () => {
                setShowExchangeModal(false);
                setShowDetailsModal(false);
                try {
                  const res = await packageService.getPackages({ limit: 10000 });
                  setPackages(res.data.packages || res.data || []);
                } catch {}
              }} />
            </div>
          </div>
        </div>
      )}

      {/* Cancel Package Modal */}
      {showCancelModal && packageToCancel && (
        <div className="mobile-modal-overlay" onClick={() => { setShowCancelModal(false); setCancelError(null); }}>
          <div className="mobile-modal-content" onClick={e => e.stopPropagation()}>
            <div className="mobile-modal-header">
              <h3>Cancel Package</h3>
              <button className="mobile-modal-close" onClick={() => { setShowCancelModal(false); setCancelError(null); }}>&times;</button>
            </div>
            <div className="mobile-modal-body">
              <p>Are you sure you want to cancel this package?</p>
              {cancelError && <div className="mobile-shop-create-error">{cancelError}</div>}
              <div className="mobile-modal-actions">
                <button className="mobile-modal-close-btn" onClick={() => { setShowCancelModal(false); setCancelError(null); }}>No</button>
                <button className="mobile-shop-package-cancel-btn confirm" onClick={handleCancel}>Yes, Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showReturnModal && selectedPackage && (
        <div className="mobile-modal-overlay" onClick={() => setShowReturnModal(false)}>
          <div className="mobile-modal-content" onClick={e => e.stopPropagation()}>
            <div className="mobile-modal-header">
              <h3>Request Return</h3>
              <button className="mobile-modal-close" onClick={() => setShowReturnModal(false)}>&times;</button>
            </div>
            <div className="mobile-modal-body">
              <p>Select items to return and enter the refund to give to the customer (can be 0).</p>
              <div style={{ maxHeight: 300, overflowY: 'auto', border: '1px solid #eee', borderRadius: 8, padding: 8, marginBottom: 8 }}>
                {(selectedPackage.Items || []).map((it) => (
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
              <div className="mobile-modal-actions">
                <button className="mobile-modal-close-btn" onClick={() => setShowReturnModal(false)}>Cancel</button>
                <button className="mobile-shop-package-details-btn" style={{ background: '#28a745', color: '#fff' }} disabled={requestingReturn} onClick={submitReturnRequest}>
                  {requestingReturn ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


    </div>
  );
};

export default MobileShopPackages; 