import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { packageService } from '../../services/api';
import './DriverDashboard.css';

const packageCategories = {
  current: ['assigned', 'pickedup', 'in-transit'],
  past: ['delivered', 'cancelled', 'returned'],
};

const getStatusColorHex = (status) => {
  switch (status) {
    case 'assigned': return '#ff8c00';
    case 'pickedup': return '#ffd600';
    case 'in-transit': return '#ff9800';
    case 'delivered': return '#43a047';
    case 'cancelled': return '#dc3545';
    case 'returned': return '#6c757d';
    default: return '#bdbdbd';
  }
};

const getNextStatus = (status) => {
  switch (status) {
    case 'assigned': return { next: 'pickedup', label: 'Mark as Picked Up' };
    case 'pickedup': return { next: 'in-transit', label: 'Mark In Transit' };
    case 'in-transit': return { next: 'delivered', label: 'Mark as Delivered' };
    default: return null;
  }
};

const DriverDeliveries = () => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('current');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [statusUpdating, setStatusUpdating] = useState({});

  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [modalPackage, setModalPackage] = useState(null);
  const [isPartial, setIsPartial] = useState(false);
  const [deliveredQuantities, setDeliveredQuantities] = useState({});

  const fetchPackages = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await packageService.getPackages({ assignedToMe: true, limit: 100 });
      setPackages(res.data.packages || res.data || []);
    } catch (err) {
      setError('Failed to load packages.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPackages();
  }, [fetchPackages]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchQuery(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Add/remove modal-open class to body when modal is open to prevent scrolling
  useEffect(() => {
    if (showDeliveryModal) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    
    // Cleanup function to remove class when component unmounts
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [showDeliveryModal]);

  const openDeliveryModal = (pkg) => {
    setModalPackage(pkg);
    setIsPartial(false);
    setDeliveredQuantities({});
    setShowDeliveryModal(true);
  };

  const buildDeliveryPayload = () => {
    if (!isPartial) return { status: 'delivered' };
    const items = Array.isArray(modalPackage?.Items) ? modalPackage.Items : [];
    const deliveredItems = items
      .map(it => {
        const maxQty = parseInt(it.quantity, 10) || 0;
        const qty = parseInt(deliveredQuantities[it.id], 10) || 0;
        const clamped = Math.min(Math.max(0, qty), maxQty);
        return clamped > 0 ? { itemId: it.id, deliveredQuantity: clamped } : null;
      })
      .filter(Boolean);
    return { status: 'delivered-awaiting-return', deliveredItems };
  };

  const handleStatusAction = async (pkg, nextStatus) => {
    setStatusUpdating((prev) => ({ ...prev, [pkg.id]: true }));
    try {
      if (nextStatus === 'delivered') {
        openDeliveryModal(pkg);
        return;
      }
      await packageService.updatePackageStatus(pkg.id, { status: nextStatus });
      await fetchPackages();
    } catch (err) {
      setError('Failed to update package status.');
    } finally {
      setStatusUpdating((prev) => ({ ...prev, [pkg.id]: false }));
    }
  };

  {showDeliveryModal && modalPackage && (
    <div className="modal-overlay" onClick={() => setShowDeliveryModal(false)}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Mark as Delivered</h3>
          <button className="modal-close" onClick={() => setShowDeliveryModal(false)}>×</button>
        </div>
        <div className="modal-body">
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <input type="checkbox" checked={isPartial} onChange={(e) => setIsPartial(e.target.checked)} />
            Partial delivery
          </label>
          {isPartial ? (
            Array.isArray(modalPackage.Items) && modalPackage.Items.length > 0 ? (
              <div>
                {modalPackage.Items.map((it) => {
                  const maxQty = parseInt(it.quantity, 10) || 0;
                  return (
                    <div key={it.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <div style={{ flex: 1, marginRight: 8 }}>
                        {it.description} (max {maxQty})
                        {typeof it.codAmount !== 'undefined' && (
                          <div style={{ fontSize: 12, color: '#555' }}>
                            Price: {(() => { const qty = parseInt(it.quantity, 10) || 0; const total = parseFloat(it.codAmount || 0) || 0; return (qty > 0 ? (total / qty) : 0).toFixed(2); })()}
                          </div>
                        )}
                      </div>
                      <input
                        type="number"
                        min="0"
                        max={maxQty}
                        value={deliveredQuantities[it.id] ?? ''}
                        onChange={(e) => setDeliveredQuantities(prev => ({ ...prev, [it.id]: e.target.value }))}
                        placeholder="0"
                        style={{ width: 80, padding: 6 }}
                      />
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ color: '#666' }}>No items available for partial selection. Uncheck partial to deliver completely.</div>
            )
          ) : (
            <div style={{ color: '#444' }}>Deliver package completely to the customer.</div>
          )}
        </div>
        <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button className="modal-btn" onClick={() => setShowDeliveryModal(false)}>Cancel</button>
          <button
            className="modal-btn primary"
            onClick={async () => {
              try {
                const payload = buildDeliveryPayload();
                await packageService.updatePackageStatus(modalPackage.id, payload);
                setShowDeliveryModal(false);
                await fetchPackages();
              } catch (e) {
                setError('Failed to update package status.');
              }
            }}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  )}

  const getFilteredPackages = useCallback(() => {
    const categoryPackages = packages.filter(pkg => packageCategories[activeTab].includes(pkg.status));
    if (!debouncedSearchQuery.trim()) {
      return categoryPackages;
    }
    const query = debouncedSearchQuery.toLowerCase().trim();
    return categoryPackages.filter(pkg =>
      (pkg.trackingNumber || '').toLowerCase().includes(query) ||
      (pkg.packageDescription || '').toLowerCase().includes(query) ||
      (pkg.deliveryAddress || '').toLowerCase().includes(query)
    );
  }, [packages, activeTab, debouncedSearchQuery]);

  return (
    <div className="driver-dashboard">
      <div className="driver-dashboard-container" style={{ paddingTop: 20 }}>
        <div className="shop-dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 className="shop-dashboard-title" style={{ margin: 0 }}>My Deliveries</h1>
          <Link to="/driver/dashboard" className="driver-dashboard-section-link">Back to Dashboard</Link>
        </div>

        {/* Package Tabs & Search */}
        <div className="driver-dashboard-section" style={{ marginTop: 16 }}>
          <div className="driver-dashboard-tabs-modern">
            {Object.keys(packageCategories).map(tab => (
              <button
                key={tab}
                className={`driver-dashboard-tab-modern${activeTab === tab ? ' active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)} Packages
                <span className="driver-dashboard-tab-count">
                  {packages.filter(pkg => packageCategories[tab].includes(pkg.status)).length}
                </span>
              </button>
            ))}
          </div>
          <div className="driver-dashboard-search-bar">
            <input
              type="text"
              placeholder="Search packages..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Packages List */}
        <div className="driver-dashboard-section">
          <h2 className="driver-dashboard-section-title">{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Packages</h2>
          {loading ? (
            <div className="loading-spinner-container"><div className="loading-spinner"></div></div>
          ) : error ? (
            <div className="error-message">{error}</div>
          ) : (
            <div className="driver-dashboard-deliveries">
              {getFilteredPackages().length === 0 ? (
                <div style={{ color: '#888', textAlign: 'center', padding: '1rem' }}>No packages found in this category.</div>
              ) : (
                getFilteredPackages().map(pkg => {
                  const nextStatus = getNextStatus(pkg.status);
                  const currentColor = getStatusColorHex(pkg.status);
                  const nextColor = nextStatus ? getStatusColorHex(nextStatus.next) : '#bdbdbd';
                  const gradient = `linear-gradient(90deg, ${currentColor} 0%, ${nextColor} 100%)`;
                  return (
                    <div key={pkg.id} className="driver-dashboard-delivery" style={{ background: currentColor }}>
                      <div className="driver-dashboard-delivery-header">
                        <div className="driver-dashboard-delivery-id">{pkg.trackingNumber}</div>
                        <div className="driver-dashboard-delivery-status" style={{ background: 'rgba(255, 255, 255, 0.2)', color: '#fff' }}>
                          {pkg.status.charAt(0).toUpperCase() + pkg.status.slice(1).replace('_', ' ')}
                        </div>
                      </div>
                      <div className="driver-dashboard-delivery-details">
                        <div><strong>Description:</strong> {pkg.packageDescription || '-'}</div>
                        <div><strong>Address:</strong> {pkg.deliveryAddress || '-'}</div>
                        {(pkg.deliveryContactName || pkg.deliveryContactPhone) && (
                          <div style={{ fontSize: 12, color: '#222', marginTop: 2 }}>
                            {pkg.deliveryContactName || 'N/A'}{pkg.deliveryContactPhone ? ` · ${pkg.deliveryContactPhone}` : ''}
                          </div>
                        )}
                        <div><strong>COD:</strong> EGP {parseFloat(pkg.codAmount || 0).toFixed(2)}</div>
                      </div>
                      <div className="driver-dashboard-delivery-actions">
                        {nextStatus && (
                          <button
                            className="driver-dashboard-delivery-start-btn"
                            style={{ background: gradient, color: pkg.status === 'pickedup' ? '#333' : '#fff', border: 'none' }}
                            onClick={() => handleStatusAction(pkg, nextStatus.next)}
                            disabled={statusUpdating[pkg.id]}
                          >
                            {statusUpdating[pkg.id] ? 'Updating...' : nextStatus.label}
                          </button>
                        )}
                        <Link to={`/track/${pkg.trackingNumber}`} className="driver-dashboard-delivery-track-btn">View Details</Link>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DriverDeliveries; 