import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { packageService } from '../../services/api';
import './MobileDriverDashboard.css';

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

const MobileDriverDeliveries = () => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('current');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [statusUpdating, setStatusUpdating] = useState({});

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

  const handleStatusAction = async (pkg, nextStatus) => {
    setStatusUpdating((prev) => ({ ...prev, [pkg.id]: true }));
    try {
      await packageService.updatePackageStatus(pkg.id, { status: nextStatus });
      await fetchPackages(); // Refetch all packages to get the updated list
    } catch (err) {
      setError('Failed to update package status.');
    } finally {
      setStatusUpdating((prev) => ({ ...prev, [pkg.id]: false }));
    }
  };

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
    <div className="mobile-driver-dashboard">
      <div className="mobile-driver-dashboard-container" style={{ paddingTop: 20 }}>
        <div className="mobile-shop-dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 className="mobile-shop-dashboard-title" style={{ margin: 0 }}>My Deliveries</h1>
          <Link to="/driver/dashboard" className="mobile-driver-dashboard-section-link">Back to Dashboard</Link>
        </div>

        {/* Package Tabs & Search */}
        <div className="mobile-driver-dashboard-section" style={{ marginTop: 16 }}>
          <div className="mobile-driver-dashboard-tabs-modern">
            {Object.keys(packageCategories).map(tab => (
              <button
                key={tab}
                className={`mobile-driver-dashboard-tab-modern${activeTab === tab ? ' active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)} Packages
                <span className="mobile-driver-dashboard-tab-count">
                  {packages.filter(pkg => packageCategories[tab].includes(pkg.status)).length}
                </span>
              </button>
            ))}
          </div>
          <div className="mobile-driver-dashboard-search-bar">
            <input
              type="text"
              placeholder="Search packages..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Packages List */}
        <div className="mobile-driver-dashboard-section">
          <h2 className="mobile-driver-dashboard-section-title">{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Packages</h2>
          {loading ? (
            <div className="loading-spinner-container"><div className="loading-spinner"></div></div>
          ) : error ? (
            <div className="mobile-error-message">{error}</div>
          ) : (
            <div className="mobile-driver-dashboard-deliveries">
              {getFilteredPackages().length === 0 ? (
                <div style={{ color: '#888', textAlign: 'center', padding: '1rem' }}>No packages found in this category.</div>
              ) : (
                getFilteredPackages().map(pkg => {
                  const nextStatus = getNextStatus(pkg.status);
                  const currentColor = getStatusColorHex(pkg.status);
                  const nextColor = nextStatus ? getStatusColorHex(nextStatus.next) : '#bdbdbd';
                  const gradient = `linear-gradient(90deg, ${currentColor} 0%, ${nextColor} 100%)`;
                  return (
                    <div key={pkg.id} className="mobile-driver-dashboard-delivery" style={{ background: currentColor }}>
                      <div className="mobile-driver-dashboard-delivery-header">
                        <div className="mobile-driver-dashboard-delivery-id">{pkg.trackingNumber}</div>
                        <div className="mobile-driver-dashboard-delivery-status" style={{ background: 'rgba(255, 255, 255, 0.2)', color: '#fff' }}>
                          {pkg.status.charAt(0).toUpperCase() + pkg.status.slice(1).replace('_', ' ')}
                        </div>
                      </div>
                      <div className="mobile-driver-dashboard-delivery-details">
                        <div><strong>Description:</strong> {pkg.packageDescription || '-'}</div>
                        <div><strong>Address:</strong> {pkg.deliveryAddress || '-'}</div>
                        {(pkg.deliveryContactName || pkg.deliveryContactPhone) && (
                          <div style={{ fontSize: 12, color: '#222', marginTop: 2 }}>
                            {pkg.deliveryContactName || 'N/A'}{pkg.deliveryContactPhone ? ` · ${pkg.deliveryContactPhone}` : ''}
                          </div>
                        )}
                        <div><strong>COD:</strong> ${parseFloat(pkg.codAmount || 0).toFixed(2)}</div>
                      </div>
                      <div className="mobile-driver-dashboard-delivery-actions">
                        {nextStatus && (
                          <button
                            className="mobile-driver-dashboard-delivery-start-btn"
                            style={{ background: gradient, color: pkg.status === 'pickedup' ? '#333' : '#fff', border: 'none' }}
                            onClick={() => handleStatusAction(pkg, nextStatus.next)}
                            disabled={statusUpdating[pkg.id]}
                          >
                            {statusUpdating[pkg.id] ? 'Updating...' : nextStatus.label}
                          </button>
                        )}
                        <Link to={`/track/${pkg.trackingNumber}`} className="mobile-driver-dashboard-delivery-track-btn">View Details</Link>
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

export default MobileDriverDeliveries; 