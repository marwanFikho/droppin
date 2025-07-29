import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { packageService } from '../../services/api';
import './MobileShopDashboard.css';
import QRCode from 'qrcode';

const TABS = [
  { label: 'All', value: 'all' },
  { label: 'Awaiting Schedule', value: 'awaiting_schedule' },
  { label: 'Scheduled for Pickup', value: 'scheduled_for_pickup' },
  { label: 'Pending', value: 'pending' },
  { label: 'In Transit', value: 'in-transit' },
  { label: 'Delivered', value: 'delivered' },
  { label: 'Return to Shop', value: 'return-to-shop' },
  { label: 'Cancelled', value: 'cancelled' },
  { label: 'Rejected', value: 'rejected' },
];
const inTransitStatuses = ['assigned', 'pickedup', 'in-transit'];
const returnToShopStatuses = ['cancelled-awaiting-return'];

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
  const [showMarkPendingModal, setShowMarkPendingModal] = useState(false);
  const [showMarkCancelledAwaitingReturnModal, setShowMarkCancelledAwaitingReturnModal] = useState(false);
  const [packageToMark, setPackageToMark] = useState(null);
  const [shopFees, setShopFees] = useState({ shippingFees: 0, shownShippingFees: 0 });
  const [editingShownDeliveryCost, setEditingShownDeliveryCost] = useState(false);
  const [newShownDeliveryCost, setNewShownDeliveryCost] = useState('');
  const [savingShownDeliveryCost, setSavingShownDeliveryCost] = useState(false);
  const [shownDeliveryCostError, setShownDeliveryCostError] = useState('');

  useEffect(() => {
    const fetchPackages = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await packageService.getPackages({ limit: 10000 });
        setPackages(res.data.packages || res.data || []);
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
          shownShippingFees: res.data.shownShippingFees || 0,
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
    } else if (activeTab === 'return-to-shop') {
      return filtered.filter(pkg => returnToShopStatuses.includes(pkg.status));
    } else if (activeTab === 'cancelled') {
      return filtered.filter(pkg => ['cancelled', 'cancelled-awaiting-return', 'cancelled-returned'].includes(pkg.status));
    } else if (activeTab === 'rejected') {
      return filtered.filter(pkg => pkg.status === 'rejected');
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

  const openDetailsModal = (pkg) => {
    setSelectedPackage(pkg);
    setShowDetailsModal(true);
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
    // Fetch the latest shop profile for the most up-to-date businessName
    let shopName = '-';
    try {
      const res = await packageService.getShopProfile();
      shopName = res.data.businessName || res.data.shop?.businessName || '-';
    } catch {}
    // Generate QR code as data URL
    const qrDataUrl = await QRCode.toDataURL(pkg.trackingNumber || '');
    // Logo path (now in public directory)
    const logoUrl = 'http://localhost:3001/assets/images/logo.jpg';
    // Calculate values
    const cod = parseFloat(pkg.codAmount || 0);
    let shipping = (pkg.shownDeliveryCost !== undefined && pkg.shownDeliveryCost !== null && pkg.shownDeliveryCost !== '' && Number(pkg.shownDeliveryCost) > 0)
      ? Number(pkg.shownDeliveryCost)
      : ((shopFees.shownShippingFees !== undefined && shopFees.shownShippingFees !== null && shopFees.shownShippingFees !== '' && Number(shopFees.shownShippingFees) > 0)
        ? Number(shopFees.shownShippingFees)
        : Number(shopFees.shippingFees));
    if (!Number.isFinite(shipping) || shipping < 0) shipping = 0;
    const total = cod + shipping;
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
        </body>
      </html>
    `;
    // Open new tab and write AWB HTML
    const printWindow = window.open('', '_blank');
    printWindow.document.open();
    printWindow.document.write(awbHtml);
    printWindow.document.close();
  };

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
                <span className="mobile-shop-package-tracking">{pkg.trackingNumber}</span>
                <span className={`mobile-shop-package-status-badge status-${pkg.status?.toLowerCase()}`}>{pkg.status}</span>
              </div>
              <div className="mobile-shop-package-info">
                <div><span className="mobile-shop-package-label">Descreption:</span> {pkg.packageDescription || '-'}</div>
                <div><span className="mobile-shop-package-label">Date:</span> {pkg.createdAt ? new Date(pkg.createdAt).toLocaleDateString() : '-'}</div>
                <div>
                  <span className="mobile-shop-package-label">COD:</span> ${parseFloat(pkg.codAmount || 0).toFixed(2)}
                  {pkg.isPaid ? (
                    <span className="mobile-cod-badge paid">Paid</span>
                  ) : (
                    <span className="mobile-cod-badge unpaid">Unpaid</span>
                  )}
                </div>
              </div>
              <div className="mobile-shop-package-actions">
                <button onClick={() => openDetailsModal(pkg)} className="mobile-shop-package-details-btn">View Details</button>
                {pkg.status !== 'delivered' && (
                  <button onClick={() => handlePrintAWB(pkg)} className="mobile-shop-package-details-btn" style={{background:'#007bff',color:'#fff'}}>Print AWB</button>
                )}
                {pkg.status === 'rejected' ? (
                  <>
                    <button className="btn btn-primary" style={{marginBottom:8}} onClick={() => { setPackageToMark(pkg); setShowMarkPendingModal(true); }}>Mark as Pending</button>
                    <button className="btn btn-danger" onClick={() => { setPackageToMark(pkg); setShowMarkCancelledAwaitingReturnModal(true); }}>Mark as Cancelled Awaiting Return</button>
                  </>
                ) : (
                  pkg.status !== 'delivered' && pkg.status !== 'cancelled' && pkg.status !== 'cancelled-awaiting-return' && pkg.status !== 'cancelled-returned' && (
                    <button onClick={() => { setPackageToCancel(pkg); setShowCancelModal(true); }} className="mobile-shop-package-cancel-btn">Cancel</button>
                  )
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
              <button className="mobile-modal-close" onClick={closeDetailsModal}>&times;</button>
            </div>
            <div className="mobile-modal-body">
              <div className="mobile-modal-details-grid">
                <div className="mobile-modal-detail-item"><span className="label">Tracking #</span><span>{selectedPackage.trackingNumber}</span></div>
                <div className="mobile-modal-detail-item"><span className="label">Status</span><span>{selectedPackage.status}</span></div>
                <div className="mobile-modal-detail-item"><span className="label">Created</span><span>{new Date(selectedPackage.createdAt).toLocaleString()}</span></div>
                <div className="mobile-modal-detail-item full-width"><span className="label">Description</span><span>{selectedPackage.packageDescription || 'No description'}</span></div>
                <div className="mobile-modal-detail-item"><span className="label">Recipient</span><span>{selectedPackage.deliveryContactName || '-'}</span></div>
                {selectedPackage.deliveryContactPhone && (
                  <div className="mobile-modal-detail-item"><span className="label">Recipient Phone</span><span>{selectedPackage.deliveryContactPhone}</span></div>
                )}
                {selectedPackage.deliveryAddress && (
                  <div className="mobile-modal-detail-item full-width"><span className="label">Delivery Address</span><span>{selectedPackage.deliveryAddress?.address || selectedPackage.deliveryAddress}</span></div>
                )}
                <div className="mobile-modal-detail-item"><span className="label">COD</span><span>${parseFloat(selectedPackage.codAmount || 0).toFixed(2)} {selectedPackage.isPaid ? 'Paid' : 'Unpaid'}</span></div>
                <div className="mobile-modal-detail-item"><span className="label">Delivery Cost</span><span>${parseFloat(selectedPackage.deliveryCost || 0).toFixed(2)}</span></div>
                {selectedPackage.weight && (
                  <div className="mobile-modal-detail-item"><span className="label">Weight</span><span>{selectedPackage.weight} kg</span></div>
                )}
                {selectedPackage.dimensions && (
                  <div className="mobile-modal-detail-item"><span className="label">Dimensions</span><span>{selectedPackage.dimensions}</span></div>
                )}
                <div className="mobile-modal-detail-item"><span className="label">Number of Items</span><span>{selectedPackage.itemsNo ?? '-'}</span></div>
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
                              await packageService.updatePackage(selectedPackage.id, { shownDeliveryCost: parseFloat(newShownDeliveryCost) });
                              setSelectedPackage(prev => ({ ...prev, shownDeliveryCost: parseFloat(newShownDeliveryCost) }));
                              setEditingShownDeliveryCost(false);
                              setShownDeliveryCostError('');
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
              </div>
              {/* Shop actions for rejected packages */}
              {selectedPackage.status === 'rejected' && (
                <div className="mobile-modal-actions" style={{flexDirection:'column',gap:8}}>
                  <button className="btn btn-primary" style={{marginBottom:8}} onClick={async () => {
                    await packageService.updatePackageStatus(selectedPackage.id, { status: 'pending' });
                    setShowDetailsModal(false);
                    setPackages(prev => prev.map(p => p.id === selectedPackage.id ? { ...p, status: 'pending' } : p));
                  }}>Mark as Pending</button>
                  <button className="btn btn-danger" onClick={async () => {
                    await packageService.updatePackageStatus(selectedPackage.id, { status: 'cancelled-awaiting-return' });
                    setShowDetailsModal(false);
                    setPackages(prev => prev.map(p => p.id === selectedPackage.id ? { ...p, status: 'cancelled-awaiting-return' } : p));
                  }}>Mark as Cancelled Awaiting Return</button>
                </div>
              )}
              <div className="mobile-modal-actions">
                <button className="mobile-modal-close-btn" onClick={closeDetailsModal}>Close</button>
              </div>
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

      {/* Confirmation Modal for Mark as Pending */}
      {showMarkPendingModal && packageToMark && (
        <div className="mobile-modal-overlay" onClick={() => { setShowMarkPendingModal(false); setPackageToMark(null); }}>
          <div className="mobile-modal-content" onClick={e => e.stopPropagation()}>
            <div className="mobile-modal-header">
              <h3>Mark as Pending</h3>
              <button className="mobile-modal-close" onClick={() => { setShowMarkPendingModal(false); setPackageToMark(null); }}>&times;</button>
            </div>
            <div className="mobile-modal-body">
              <p>Are you sure you want to mark this package as Pending?</p>
              <div className="mobile-modal-actions">
                <button className="mobile-modal-close-btn" onClick={() => { setShowMarkPendingModal(false); setPackageToMark(null); }}>No</button>
                <button className="btn btn-primary" onClick={async () => {
                  await packageService.updatePackageStatus(packageToMark.id, { status: 'pending' });
                  setShowMarkPendingModal(false);
                  setPackages(prev => prev.map(p => p.id === packageToMark.id ? { ...p, status: 'pending' } : p));
                  setPackageToMark(null);
                }}>Yes, Mark as Pending</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Mark as Cancelled Awaiting Return */}
      {showMarkCancelledAwaitingReturnModal && packageToMark && (
        <div className="mobile-modal-overlay" onClick={() => { setShowMarkCancelledAwaitingReturnModal(false); setPackageToMark(null); }}>
          <div className="mobile-modal-content" onClick={e => e.stopPropagation()}>
            <div className="mobile-modal-header">
              <h3>Mark as Cancelled Awaiting Return</h3>
              <button className="mobile-modal-close" onClick={() => { setShowMarkCancelledAwaitingReturnModal(false); setPackageToMark(null); }}>&times;</button>
            </div>
            <div className="mobile-modal-body">
              <p>Are you sure you want to mark this package as Cancelled Awaiting Return?</p>
              <div className="mobile-modal-actions">
                <button className="mobile-modal-close-btn" onClick={() => { setShowMarkCancelledAwaitingReturnModal(false); setPackageToMark(null); }}>No</button>
                <button className="btn btn-danger" onClick={async () => {
                  await packageService.updatePackageStatus(packageToMark.id, { status: 'cancelled-awaiting-return' });
                  setShowMarkCancelledAwaitingReturnModal(false);
                  setPackages(prev => prev.map(p => p.id === packageToMark.id ? { ...p, status: 'cancelled-awaiting-return' } : p));
                  setPackageToMark(null);
                }}>Yes, Mark as Cancelled Awaiting Return</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileShopPackages; 