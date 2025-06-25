import React, { useState, useEffect } from 'react';
import { packageService } from '../../services/api';
import { useLocation } from 'react-router-dom';
import './ShopDashboard.css';

const TABS = [
  { label: 'All', value: 'all' },
  { label: 'Awaiting Schedule', value: 'awaiting_schedule' },
  { label: 'Scheduled for Pickup', value: 'scheduled_for_pickup' },
  { label: 'Pending', value: 'pending' },
  { label: 'In Transit', value: 'in-transit' },
  { label: 'Delivered', value: 'delivered' },
  { label: 'Return to Shop', value: 'return-to-shop' },
  { label: 'Cancelled', value: 'cancelled' },
  { label: 'Pickups', value: 'pickups' },
];

const inTransitStatuses = ['assigned', 'pickedup', 'in-transit'];
const returnToShopStatuses = ['cancelled-awaiting-return', 'cancelled-returned'];

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

function getCodBadge(isPaid) {
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
  const location = useLocation();

  useEffect(() => {
    const fetchPackages = async () => {
      setLoading(true);
      try {
        const res = await packageService.getPackages();
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
    // Set tab from query param if present
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab && TABS.some(t => t.value === tab)) {
      setActiveTab(tab);
    }
  }, [location.search]);

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
    } else if (activeTab === 'pickups') {
      return filtered; // This will be handled by the pickups tab
    } else {
      return filtered.filter(pkg => pkg.status === activeTab);
    }
  };

  return (
    <div className="shop-packages-page">
      <h2>Packages</h2>
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
                  <th>Tracking #</th>
                  <th>Description</th>
                  <th>Recipient</th>
                  <th>Status</th>
                  <th>COD</th>
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filterPackages().length === 0 ? (
                  <tr><td colSpan={7} style={{textAlign:'center'}}>No packages found.</td></tr>
                ) : filterPackages().map(pkg => (
                  <tr key={pkg.id}>
                    <td>{pkg.trackingNumber}</td>
                    <td>{pkg.packageDescription}</td>
                    <td>{pkg.deliveryContactName}</td>
                    <td>{getStatusBadge(pkg.status)}</td>
                    <td>${parseFloat(pkg.codAmount || 0).toFixed(2)} {getCodBadge(pkg.isPaid)}</td>
                    <td>{new Date(pkg.createdAt).toLocaleDateString()}</td>
                    <td>
                      {pkg.status !== 'delivered' && pkg.status !== 'cancelled' && (
                        <button
                          className="action-button"
                          style={{background:'#e53935',color:'#fff',padding:'0.3rem 0.7rem',fontSize:'0.85rem'}}
                          onClick={() => {
                            setPackageToCancel(pkg);
                            setShowCancelModal(true);
                          }}
                        >
                          Cancel
                        </button>
                      )}
                    </td>
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
    </div>
  );
};

export default ShopPackages; 