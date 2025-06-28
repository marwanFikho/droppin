import React, { useState, useEffect } from 'react';
import { packageService } from '../../services/api';
import { useLocation } from 'react-router-dom';
import './ShopDashboard.css';
import { useTranslation } from 'react-i18next';

const TABS = [
  { label: 'shop.packages.tabs.all', value: 'all' },
  { label: 'shop.packages.tabs.awaitingSchedule', value: 'awaiting_schedule' },
  { label: 'shop.packages.tabs.scheduledForPickup', value: 'scheduled_for_pickup' },
  { label: 'shop.packages.tabs.pending', value: 'pending' },
  { label: 'shop.packages.tabs.inTransit', value: 'in-transit' },
  { label: 'shop.packages.tabs.delivered', value: 'delivered' },
  { label: 'shop.packages.tabs.returnToShop', value: 'return-to-shop' },
  { label: 'shop.packages.tabs.cancelled', value: 'cancelled' },
  { label: 'shop.packages.tabs.rejected', value: 'rejected' },
  { label: 'shop.packages.tabs.pickups', value: 'pickups' },
];

const inTransitStatuses = ['assigned', 'pickedup', 'in-transit'];
const returnToShopStatuses = ['cancelled-awaiting-return', 'cancelled-returned'];

export function getStatusBadge(status, t) {
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
  return <span className={className}>{t(`shop.packages.statusLabels.${status}`, status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ').replace('-', ' '))}</span>;
}

export function getCodBadge(isPaid, t) {
  return isPaid
    ? <span className="cod-badge cod-paid">{t('shop.packages.paid')}</span>
    : <span className="cod-badge cod-unpaid">{t('shop.packages.unpaid')}</span>;
}

function getPickupStatusBadge(status, t) {
  let colorClass = 'status-badge';
  if (status === 'pending' || status === 'scheduled') colorClass += ' status-pending';
  else if (status === 'cancelled') colorClass += ' status-other';
  else if (status === 'completed' || status === 'pickedup') colorClass += ' status-delivered';
  else colorClass += ' status-other';
  return <span className={colorClass}>{t(`shop.packages.pickupStatusLabels.${status}`, status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' '))}</span>;
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
  const location = useLocation();
  const { t } = useTranslation();

  useEffect(() => {
    const fetchPackages = async () => {
      setLoading(true);
      try {
        const res = await packageService.getPackages({ limit: 10000 });
        setPackages(res.data.packages || res.data || []);
      } catch (err) {
        setError(t('shop.packages.loadError'));
      } finally {
        setLoading(false);
      }
    };
    fetchPackages();
  }, [t]);

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
        .catch(() => setError(t('shop.packages.loadPickupsError')))
        .finally(() => setPickupLoading(false));
    }
  }, [activeTab, t]);

  const handleCancel = async () => {
    if (!packageToCancel) return;
    try {
      await packageService.cancelPackage(packageToCancel.id);
      setPackages(prev => prev.map(p => p.id === packageToCancel.id ? { ...p, status: 'cancelled' } : p));
      setShowCancelModal(false);
      setPackageToCancel(null);
      setCancelError(null);
    } catch (err) {
      setCancelError(err.response?.data?.message || t('shop.packages.cancelError'));
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
      setPickupCancelError(err.response?.data?.message || t('shop.packages.cancelPickupError'));
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
      return filtered.filter(pkg => pkg.status === 'rejected');
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
      setCancelError(err.response?.data?.message || t('shop.packages.markReturnedError'));
    }
  };

  return (
    <div className="shop-packages-container">
      <div className="tabs-scroll-container" style={{ overflowX: 'auto', whiteSpace: 'nowrap', maxWidth: '100%' }}>
        {TABS.map(tab => (
          <button
            key={tab.value}
            className={`tab-btn${activeTab === tab.value ? ' active' : ''}`}
            onClick={() => setActiveTab(tab.value)}
            style={{ display: 'inline-block', minWidth: 120 }}
          >
            {t(tab.label)}
          </button>
        ))}
      </div>
      <div className="search-bar-container">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={t('shop.packages.searchPlaceholder', 'Search by tracking number, description, address, or status...')}
          className="search-bar"
        />
      </div>
      {activeTab === 'pickups' ? (
        pickupLoading ? (
          <div>{t('shop.packages.loadingPickups')}</div>
        ) : pickups.length === 0 ? (
          <div>{t('shop.packages.noPickups')}</div>
        ) : (
          <div className="pickups-table-wrapper">
            <table className="packages-table">
              <thead>
                <tr>
                  <th>{t('shop.packages.pickupDate')}</th>
                  <th>{t('shop.packages.address')}</th>
                  <th>{t('shop.packages.status')}</th>
                  <th>{t('shop.packages.action')}</th>
                </tr>
              </thead>
              <tbody>
                {pickups.map(pickup => (
                  <tr key={pickup.id}>
                    <td>{new Date(pickup.scheduledTime).toLocaleString()}</td>
                    <td>{pickup.pickupAddress}</td>
                    <td>{getPickupStatusBadge(pickup.status, t)}</td>
                    <td style={{display:'flex',gap:'0.5rem'}}>
                      <button className="btn btn-primary" onClick={() => handlePickupClick(pickup)}>
                        {t('shop.packages.viewPackages')}
                      </button>
                      {pickup.status === 'scheduled' && (
                        <button className="btn btn-danger" onClick={() => { setPickupToCancel(pickup); setShowPickupCancelModal(true); }}>
                          {t('shop.packages.cancel')}
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
        <div>{t('shop.packages.loading')}</div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : (
        <>
          {showCancelModal && (
            <div className="confirmation-overlay" onClick={() => { setShowCancelModal(false); setCancelError(null); }}>
              <div className="confirmation-dialog warning-dialog" onClick={e => e.stopPropagation()}>
                <h3>{t('shop.packages.cancelPackageTitle')}</h3>
                <p>{t('shop.packages.cancelPackageConfirm')}</p>
                {cancelError && <div style={{color:'#dc3545',marginBottom:'0.5rem'}}>{cancelError}</div>}
                <div className="confirmation-buttons">
                  <button className="btn-secondary" onClick={() => { setShowCancelModal(false); setCancelError(null); }}>{t('common.no')}</button>
                  <button className="btn-primary danger" onClick={handleCancel}>{t('shop.packages.yesCancel')}</button>
                </div>
              </div>
            </div>
          )}
          <div className="packages-table-wrapper">
            <table className="packages-table">
              <thead>
                <tr>
                  <th>{t('shop.packages.trackingNumber')}</th>
                  <th>{t('shop.packages.description')}</th>
                  <th>{t('shop.packages.recipient')}</th>
                  <th>{t('shop.packages.status')}</th>
                  <th>{t('shop.packages.cod')}</th>
                  <th>{t('shop.packages.date')}</th>
                  {activeTab !== 'cancelled' && activeTab !== 'return-to-shop' && <th>{t('shop.packages.action')}</th>}
                </tr>
              </thead>
              <tbody>
                {filterPackages().length === 0 ? (
                  <tr><td colSpan={7} style={{textAlign:'center'}}>{t('shop.packages.noPackagesFound')}</td></tr>
                ) : filterPackages().map(pkg => (
                  <tr key={pkg.id} style={{cursor:'pointer'}} onClick={e => {
                    if (e.target.closest('button')) return;
                    openDetailsModal(pkg);
                  }}>
                    <td data-label={t('shop.packages.trackingNumber')}>{pkg.trackingNumber}</td>
                    <td data-label={t('shop.packages.description')}>{pkg.packageDescription}</td>
                    <td data-label={t('shop.packages.recipient')}>{pkg.deliveryContactName}</td>
                    <td data-label={t('shop.packages.status')}>{getStatusBadge(pkg.status, t)}</td>
                    <td data-label={t('shop.packages.cod')} className="package-cod">${parseFloat(pkg.codAmount || 0).toFixed(2)} {getCodBadge(pkg.isPaid, t)}</td>
                    <td data-label={t('shop.packages.date')}>{new Date(pkg.createdAt).toLocaleDateString()}</td>
                    {activeTab !== 'cancelled' && (
                      <td data-label={t('shop.packages.action')} className="actions-cell">
                        {pkg.status !== 'cancelled' && pkg.status !== 'delivered' && pkg.status !== 'cancelled-returned' && pkg.status !== 'cancelled-awaiting-return' && pkg.status !== 'rejected' &&(
                          <button
                            className="action-button cancel-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPackageToCancel(pkg);
                              setShowCancelModal(true);
                            }}
                          >
                            {t('shop.packages.cancel')}
                          </button>
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
      {/* Pickup Modal */}
      {showPickupModal && (
        <div className="confirmation-overlay" onClick={() => setShowPickupModal(false)}>
          <div className="confirmation-dialog" onClick={e => e.stopPropagation()} style={{minWidth:'350px'}}>
            <h3>{t('shop.packages.pickupPackagesTitle')}</h3>
            {pickupPackagesLoading ? (
              <div>{t('shop.packages.loading')}</div>
            ) : pickupPackages.length === 0 ? (
              <div>{t('shop.packages.noPackagesForPickup')}</div>
            ) : (
              <ul style={{paddingLeft:0}}>
                {pickupPackages.map(pkg => (
                  <li key={pkg.id} style={{marginBottom:'0.5rem',listStyle:'none'}}>
                    <b>{pkg.trackingNumber}</b> - {pkg.packageDescription}
                  </li>
                ))}
              </ul>
            )}
            <button className="btn btn-secondary" onClick={() => setShowPickupModal(false)} style={{marginTop:'1rem'}}>{t('common.close')}</button>
          </div>
        </div>
      )}
      {/* Pickup Cancel Modal */}
      {showPickupCancelModal && (
        <div className="confirmation-overlay" onClick={() => { setShowPickupCancelModal(false); setPickupCancelError(null); }}>
          <div className="confirmation-dialog warning-dialog" onClick={e => e.stopPropagation()}>
            <h3>{t('shop.packages.cancelPickupTitle')}</h3>
            <p>{t('shop.packages.cancelPickupConfirm')}</p>
            {pickupCancelError && <div style={{color:'#dc3545',marginBottom:'0.5rem'}}>{pickupCancelError}</div>}
            <div className="confirmation-buttons">
              <button className="btn-secondary" onClick={() => { setShowPickupCancelModal(false); setPickupCancelError(null); }}>{t('common.no')}</button>
              <button className="btn-danger" onClick={handleCancelPickup}>{t('shop.packages.yesCancel')}</button>
            </div>
          </div>
        </div>
      )}
      {/* Package Details Modal */}
      {showPackageDetailsModal && selectedPackage && (
        <div className="confirmation-overlay" onClick={() => setShowPackageDetailsModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{t('shop.packages.packageDetailsTitle')}</h2>
              <button className="btn close-btn" onClick={() => setShowPackageDetailsModal(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="details-grid">
                <div className="detail-item">
                  <span className="label">{t('shop.packages.trackingNumber')}</span>
                  <span>{selectedPackage.trackingNumber}</span>
                </div>
                <div className="detail-item">
                  <span className="label">{t('shop.packages.status')}</span>
                  <span>{getStatusBadge(selectedPackage.status, t)}</span>
                </div>
                <div className="detail-item">
                  <span className="label">{t('shop.packages.created')}</span>
                  <span>{new Date(selectedPackage.createdAt).toLocaleString()}</span>
                </div>
                <div className="detail-item full-width">
                  <span className="label">{t('shop.packages.description')}</span>
                  <span>{selectedPackage.packageDescription || t('shop.packages.noDescription')}</span>
                </div>
                <div className="detail-item">
                  <span className="label">{t('shop.packages.recipient')}</span>
                  <span>{selectedPackage.deliveryContactName || t('common.notAvailable')}</span>
                </div>
                {selectedPackage.deliveryContactPhone && (
                  <div className="detail-item">
                    <span className="label">{t('shop.packages.recipientPhone')}</span>
                    <span>{selectedPackage.deliveryContactPhone}</span>
                  </div>
                )}
                {selectedPackage.deliveryAddress && (
                  <div className="detail-item full-width">
                    <span className="label">{t('shop.packages.deliveryAddress')}</span>
                    <span>{selectedPackage.deliveryAddress}</span>
                  </div>
                )}
                <div className="detail-item">
                  <span className="label">{t('shop.packages.cod')}</span>
                  <span className="package-cod">${parseFloat(selectedPackage.codAmount || 0).toFixed(2)} {getCodBadge(selectedPackage.isPaid, t)}</span>
                </div>
                {selectedPackage.weight && (
                  <div className="detail-item">
                    <span className="label">{t('shop.packages.weight')}</span>
                    <span>{selectedPackage.weight} kg</span>
                  </div>
                )}
                {selectedPackage.dimensions && (
                  <div className="detail-item">
                    <span className="label">{t('shop.packages.dimensions')}</span>
                    <span>{selectedPackage.dimensions}</span>
                  </div>
                )}
                {selectedPackage.shopNotes && (
                  <div className="detail-item full-width">
                    <span className="label">{t('shop.packages.shopNotes')}</span>
                    <span>{selectedPackage.shopNotes}</span>
                  </div>
                )}
              </div>
              {/* Shop actions for rejected packages */}
              {selectedPackage.status === 'rejected' && (
                <div className="modal-actions">
                  <button className="btn btn-primary" onClick={async () => {
                    await packageService.updatePackageStatus(selectedPackage.id, { status: 'pending' });
                    setShowPackageDetailsModal(false);
                    setPackages(prev => prev.map(p => p.id === selectedPackage.id ? { ...p, status: 'pending' } : p));
                  }}>{t('shop.packages.markAsPending')}</button>
                  <button className="btn btn-danger" onClick={async () => {
                    await packageService.updatePackageStatus(selectedPackage.id, { status: 'cancelled-awaiting-return' });
                    setShowPackageDetailsModal(false);
                    setPackages(prev => prev.map(p => p.id === selectedPackage.id ? { ...p, status: 'cancelled-awaiting-return' } : p));
                  }}>{t('shop.packages.markAsCancelledAwaitingReturn')}</button>
                </div>
              )}
              {/* Notes Log Section */}
              <div className="package-notes-log-section" style={{marginTop:'2rem', marginBottom:'1.5rem'}}>
                <h4 style={{marginBottom:'0.75rem'}}>{t('shop.packages.notesLog')}</h4>
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
                              {n.createdAt ? new Date(n.createdAt).toLocaleString() : t('shop.packages.unknownDate')}
                            </span>
                          </div>
                          <div className="notes-log-text" style={{whiteSpace:'pre-line', fontSize:'1.05em', color:'#222'}}>{n.text}</div>
                        </div>
                      ))
                    ) : (
                      <div className="notes-log-empty" style={{color:'#888', fontStyle:'italic'}}>{t('shop.packages.noNotesYet')}</div>
                    );
                  })()}
                </div>
              </div>
              <div className="modal-actions">
                <button className="btn close-btn" onClick={() => setShowPackageDetailsModal(false)}>{t('common.close')}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShopPackages; 