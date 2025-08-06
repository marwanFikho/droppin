import React, { useState, useEffect } from 'react';
import { packageService, shopService } from '../../services/api';
import { useLocation } from 'react-router-dom';
import './ShopDashboard.css';
import QRCode from 'qrcode';
import { useAuth } from '../../context/AuthContext';

const TABS = [
  { label: 'All', value: 'all' },
  { label: 'Awaiting Schedule', value: 'awaiting_schedule' },
  { label: 'Scheduled for Pickup', value: 'scheduled_for_pickup' },
  { label: 'Pending', value: 'pending' },
  { label: 'In Transit', value: 'in-transit' },
  { label: 'Delivered', value: 'delivered' },
  { label: 'Return to Shop', value: 'return-to-shop' },
  { label: 'Pickups', value: 'pickups' },
];

const inTransitStatuses = ['assigned', 'pickedup', 'in-transit'];
const returnToShopStatuses = [
  'cancelled-awaiting-return',
  'cancelled-returned',
  'rejected-awaiting-return',
  'rejected-returned'
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
            setSelectedPackage(packageToReopen);
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
    } else {
      return filtered.filter(pkg => pkg.status === activeTab);
    }
  };

  const openDetailsModal = (pkg) => {
    setSelectedPackage(pkg);
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
    // Generate QR code as data URL
    const qrDataUrl = await QRCode.toDataURL(pkg.trackingNumber || '');
    // Logo path (now in public directory)
    const logoUrl = window.location.origin + '/assets/images/logo.jpg';
    // Calculate values
    const cod = parseFloat(pkg.codAmount || 0);
    let shipping = (pkg.shownDeliveryCost !== undefined && pkg.shownDeliveryCost !== null && pkg.shownDeliveryCost !== '')
      ? Number(pkg.shownDeliveryCost)
      : ((shopFees.shownShippingFees !== undefined && shopFees.shownShippingFees !== null && shopFees.shownShippingFees !== '')
        ? Number(shopFees.shownShippingFees)
        : Number(shopFees.shippingFees));
    if (!Number.isFinite(shipping) || shipping < 0) shipping = 0;
    const total = cod + shipping;
    const shopName = shopFees.businessName || '-';
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
                  <td><span class="awb-row"><b class="awb-tracking">Tracking #:</b><span class="awb-tracking awb-data">${pkg.trackingNumber || '-'}</span></span>
                  <div class="awb-shop-name">Shop Name: ${shopName}</div>
                </td>
                  <td><b>Date:</b> ${pkg.createdAt ? new Date(pkg.createdAt).toLocaleDateString() : '-'}</td>
                </tr>
                <tr>
                  <td colspan="2">
                    <span class="awb-row"><b class="awb-recipient">Recipient: ${pkg.deliveryContactName || '-'}</b></span><br/>
                    <span class="awb-row"><b class="awb-phone">Phone: ${pkg.deliveryContactPhone || '-'}</b></span><br/>
                    <span class="awb-row"><b class="awb-address">Address: ${pkg.deliveryAddress || '-'}</b></span>
                  </td>
                </tr>
              </table>
            </div>
            <div class="awb-section">
              <table class="awb-table">
                <thead>
                  <tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr>
                </thead>
                <tbody>
                  <tr>
                    <td>${pkg.packageDescription || '-'}</td>
                    <td>${pkg.itemsNo ?? 1}</td>
                    <td>${cod.toFixed(2)} EGP</td>
                    <td>${cod.toFixed(2)} EGP</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="awb-section">
              <b>Payment Method:</b> COD
            </div>
            <div class="awb-section" style="display:flex;justify-content:flex-end;">
              <table class="awb-info-table" style="width:300px;">
                <tr><td>Sub Total:</td><td>${cod.toFixed(2)} EGP</td></tr>
                <tr><td>Shipping:</td><td>${shipping.toFixed(2)} EGP</td></tr>
                <tr><td><b>Total:</b></td><td><b>${total.toFixed(2)} EGP</b></td></tr>
              </table>
            </div>
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
    let allAwbHtml = '';
    for (const pkg of pkgsToPrint) {
      const qrDataUrl = await QRCode.toDataURL(pkg.trackingNumber || '');
      const logoUrl = window.location.origin + '/assets/images/logo.jpg';
      const cod = parseFloat(pkg.codAmount || 0);
      let shipping = (pkg.shownDeliveryCost !== undefined && pkg.shownDeliveryCost !== null && pkg.shownDeliveryCost !== '')
        ? Number(pkg.shownDeliveryCost)
        : ((shopFees.shownShippingFees !== undefined && shopFees.shownShippingFees !== null && shopFees.shownShippingFees !== '')
          ? Number(shopFees.shownShippingFees)
          : Number(shopFees.shippingFees));
      if (!Number.isFinite(shipping) || shipping < 0) shipping = 0;
      const total = cod + shipping;
      const shopName = shopFees.businessName || '-';
      allAwbHtml += `
        <div class="awb-container" style="page-break-after: always;">
          <div class="awb-header">
            <img src="${logoUrl}" class="awb-logo" alt="Droppin Logo" style="height:80px;width:auto;" />
            <div>
              <img src="${qrDataUrl}" alt="QR Code" style="height:140px;width:140px;" />
            </div>
          </div>
          <div class="awb-section">
            <table class="awb-info-table">
              <tr>
                <td><span class="awb-row"><b class="awb-tracking">Tracking #:</b><span class="awb-tracking awb-data">${pkg.trackingNumber || '-'}</span></span>
                <div class="awb-shop-name">${shopName}</div>
              </td>
                <td><b>Date:</b> ${pkg.createdAt ? new Date(pkg.createdAt).toLocaleDateString() : '-'}</td>
              </tr>
              <tr>
                <td colspan="2">
                  <span class="awb-row"><b class="awb-recipient">Recipient:</b><span class="awb-recipient awb-data">${pkg.deliveryContactName || '-'}</span></span><br/>
                  <span class="awb-row"><b class="awb-phone">Phone:</b><span class="awb-phone awb-data">${pkg.deliveryContactPhone || '-'}</span></span><br/>
                  <span class="awb-row"><b class="awb-address">Address:</b><span class="awb-address awb-data">${pkg.deliveryAddress || '-'}</span></span>
                </td>
              </tr>
            </table>
          </div>
          <div class="awb-section">
            <table class="awb-table">
              <thead>
                <tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr>
              </thead>
              <tbody>
                <tr>
                  <td>${pkg.packageDescription || '-'}</td>
                  <td>${pkg.itemsNo ?? 1}</td>
                  <td>${cod.toFixed(2)} EGP</td>
                  <td>${cod.toFixed(2)} EGP</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="awb-section">
            <b>Payment Method:</b> COD
          </div>
          <div class="awb-section" style="display:flex;justify-content:flex-end;">
            <table class="awb-info-table" style="width:300px;">
              <tr><td>Sub Total:</td><td>${cod.toFixed(2)} EGP</td></tr>
              <tr><td>Shipping:</td><td>${shipping.toFixed(2)} EGP</td></tr>
              <tr><td><b>Total:</b></td><td><b>${total.toFixed(2)} EGP</b></td></tr>
            </table>
          </div>
          <div class="awb-footer">Thank you for your order!</div>
        </div>
      `;
    }
    const fullHtml = `
      <html>
        <head>
          <title>Droppin Air Waybills</title>
          <style>
            body { font-family: Arial, sans-serif; background: #fff; color: #111; margin: 0; padding: 0; }
            .awb-container { width: 800px; margin: 0 auto; padding: 32px; background: #fff; }
            .awb-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #111; padding-bottom: 16px; }
            .awb-logo { height: 80px; width: auto; }
            .awb-title { font-size: 2rem; font-weight: bold; }
            .awb-section { margin-top: 24px; }
            .awb-table { width: 100%; border-collapse: collapse; margin-top: 16px; }
            .awb-table th, .awb-table td { border: 1px solid #111; padding: 8px; text-align: left; }
            .awb-table th { background: #f5f5f5; }
            .awb-info-table { width: 100%; margin-top: 16px; }
            .awb-info-table td { padding: 4px 8px; }
            .awb-footer { margin-top: 32px; text-align: center; font-size: 1.1rem; font-weight: bold; }
            @media print { .awb-container { page-break-after: always; } }
          </style>
        </head>
        <body onload="window.print()">
          ${allAwbHtml}
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
                    <td data-label="Description">{pkg.packageDescription}</td>
                    <td data-label="Recipient">{pkg.deliveryContactName}</td>
                    <td data-label="Status">{getStatusBadge(pkg.status)}</td>
                    <td data-label="COD">${parseFloat(pkg.codAmount || 0).toFixed(2)} {getCodBadge(pkg.isPaid)}</td>
                    <td data-label="Date">{new Date(pkg.createdAt).toLocaleDateString()}</td>
                    {activeTab !== 'cancelled' && (
                      <td data-label="Actions" className="actions-cell">
                        {pkg.status !== 'cancelled' && pkg.status !== 'delivered' && pkg.status !== 'cancelled-returned' && pkg.status !== 'cancelled-awaiting-return' && pkg.status !== 'rejected' && pkg.status !== 'rejected-awaiting-return' && pkg.status !== 'rejected-returned' &&(
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
                            <button
                              className="action-button print-awb-btn"
                              style={{marginLeft:'0.5rem'}}
                              onClick={async (e) => {
                                e.stopPropagation();
                                await handlePrintAWB(pkg);
                              }}
                            >
                              Print AWB
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
              <button className="btn close-btn" onClick={() => setShowPackageDetailsModal(false)}>&times;</button>
            </div>
            <div className="modal-body">
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
                  <span>${parseFloat(selectedPackage.codAmount || 0).toFixed(2)} {getCodBadge(selectedPackage.isPaid)}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Delivery Cost</span>
                  <span>${parseFloat(selectedPackage.deliveryCost || 0).toFixed(2)}</span>
                </div>
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
                              await packageService.updatePackage(selectedPackage.id, { shownDeliveryCost: parseFloat(newShownDeliveryCost) });
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
                        <span style={{ fontWeight: 500 }}>${parseFloat(selectedPackage.shownDeliveryCost).toFixed(2)}</span>
                        <button
                          style={{ background: '#fff', border: '1px solid #007bff', color: '#007bff', borderRadius: 4, padding: '4px 12px', marginLeft: 4, cursor: 'pointer', fontWeight: 'bold' }}
                          onClick={() => {
                            setEditingShownDeliveryCost(true);
                            setNewShownDeliveryCost(selectedPackage.shownDeliveryCost !== undefined && selectedPackage.shownDeliveryCost !== null ? String(selectedPackage.shownDeliveryCost) : '0');
                          }}
                        >
                          Edit
                        </button>
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
                {selectedPackage.shopNotes && (
                  <div className="detail-item full-width">
                    <span className="label">Shop Notes</span>
                    <span>{selectedPackage.shopNotes}</span>
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
                <button className="btn close-btn" onClick={() => setShowPackageDetailsModal(false)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShopPackages; 