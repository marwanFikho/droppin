import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { packageService } from '../../services/api';
import './MobileShopDashboard.css';
import { useTranslation } from 'react-i18next';

const TABS = [
  { label: t('shop.packages.tabs.all'), value: 'all' },
  { label: t('shop.packages.tabs.awaitingSchedule'), value: 'awaiting_schedule' },
  { label: t('shop.packages.tabs.scheduledForPickup'), value: 'scheduled_for_pickup' },
  { label: t('shop.packages.tabs.pending'), value: 'pending' },
  { label: t('shop.packages.tabs.inTransit'), value: 'in-transit' },
  { label: t('shop.packages.tabs.delivered'), value: 'delivered' },
  { label: t('shop.packages.tabs.returnToShop'), value: 'return-to-shop' },
  { label: t('shop.packages.tabs.cancelled'), value: 'cancelled' },
  { label: t('shop.packages.tabs.rejected'), value: 'rejected' },
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
  const { t } = useTranslation();

  useEffect(() => {
    const fetchPackages = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await packageService.getPackages({ limit: 10000 });
        setPackages(res.data.packages || res.data || []);
      } catch (err) {
        setError(t('shop.packages.error.loadPackages'));
      } finally {
        setLoading(false);
      }
    };
    fetchPackages();
  }, [t]);

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

  return (
    <div className="mobile-shop-packages" style={{marginLeft: '1rem', marginRight: '1rem', marginTop: '6rem'}}>
      <h2 className="mobile-shop-packages-title">{t('shop.packages.title')}</h2>
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
                  if (tab.value === 'rejected') return pkg.status === 'rejected';
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
          placeholder={t('shop.packages.searchPlaceholder')}
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>
      {loading ? (
        <div className="mobile-shop-dashboard-loading">{t('shop.packages.loading')}</div>
      ) : error ? (
        <div className="mobile-shop-dashboard-error">{error}</div>
      ) : filterPackages().length === 0 ? (
        <div className="mobile-shop-dashboard-no-packages">{t('shop.packages.noPackages')}</div>
      ) : (
        <div className="mobile-shop-packages-list">
          {filterPackages().map(pkg => (
            <div key={pkg.id} className="mobile-shop-package-card">
              <div className="mobile-shop-package-header">
                <span className="mobile-shop-package-tracking">{pkg.trackingNumber}</span>
                <span className={`mobile-shop-package-status-badge status-${pkg.status?.toLowerCase()}`}>{pkg.status}</span>
              </div>
              <div className="mobile-shop-package-info">
                <div><span className="mobile-shop-package-label">{t('shop.packages.description')}:</span> {pkg.packageDescription || '-'}</div>
                <div><span className="mobile-shop-package-label">{t('shop.packages.date')}:</span> {pkg.createdAt ? new Date(pkg.createdAt).toLocaleDateString() : '-'}</div>
                <div>
                  <span className="mobile-shop-package-label">{t('shop.packages.cod')}:</span> ${parseFloat(pkg.codAmount || 0).toFixed(2)}
                  {pkg.isPaid ? (
                    <span className="mobile-cod-badge paid">{t('shop.packages.paid')}</span>
                  ) : (
                    <span className="mobile-cod-badge unpaid">{t('shop.packages.unpaid')}</span>
                  )}
                </div>
              </div>
              <div className="mobile-shop-package-actions">
                <button onClick={() => openDetailsModal(pkg)} className="mobile-shop-package-details-btn">{t('shop.packages.viewDetails')}</button>
                {pkg.status === 'rejected' ? (
                  <>
                    <button className="btn btn-primary" style={{marginBottom:8}} onClick={() => { setPackageToMark(pkg); setShowMarkPendingModal(true); }}>{t('shop.packages.markAsPending')}</button>
                    <button className="btn btn-danger" onClick={() => { setPackageToMark(pkg); setShowMarkCancelledAwaitingReturnModal(true); }}>{t('shop.packages.markAsCancelledAwaitingReturn')}</button>
                  </>
                ) : (
                  pkg.status !== 'delivered' && pkg.status !== 'cancelled' && pkg.status !== 'cancelled-awaiting-return' && pkg.status !== 'cancelled-returned' && (
                    <button onClick={() => { setPackageToCancel(pkg); setShowCancelModal(true); }} className="mobile-shop-package-cancel-btn">{t('shop.packages.cancel')}</button>
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
              <h3>{t('shop.packages.details.title')}</h3>
              <button className="mobile-modal-close" onClick={closeDetailsModal}>&times;</button>
            </div>
            <div className="mobile-modal-body">
              <div className="mobile-modal-details-grid">
                <div className="mobile-modal-detail-item"><span className="label">{t('shop.packages.details.tracking')}</span><span>{selectedPackage.trackingNumber}</span></div>
                <div className="mobile-modal-detail-item"><span className="label">{t('shop.packages.details.status')}</span><span>{selectedPackage.status}</span></div>
                <div className="mobile-modal-detail-item"><span className="label">{t('shop.packages.details.created')}</span><span>{new Date(selectedPackage.createdAt).toLocaleString()}</span></div>
                <div className="mobile-modal-detail-item full-width"><span className="label">{t('shop.packages.details.description')}</span><span>{selectedPackage.packageDescription || t('shop.packages.details.noDescription')}</span></div>
                <div className="mobile-modal-detail-item"><span className="label">{t('shop.packages.details.recipient')}</span><span>{selectedPackage.deliveryContactName || '-'}</span></div>
                {selectedPackage.deliveryContactPhone && (
                  <div className="mobile-modal-detail-item"><span className="label">{t('shop.packages.details.recipientPhone')}</span><span>{selectedPackage.deliveryContactPhone}</span></div>
                )}
                {selectedPackage.deliveryAddress && (
                  <div className="mobile-modal-detail-item full-width"><span className="label">{t('shop.packages.details.deliveryAddress')}</span><span>{selectedPackage.deliveryAddress?.address || selectedPackage.deliveryAddress}</span></div>
                )}
                <div className="mobile-modal-detail-item"><span className="label">{t('shop.packages.details.cod')}</span><span>${parseFloat(selectedPackage.codAmount || 0).toFixed(2)} {selectedPackage.isPaid ? t('shop.packages.paid') : t('shop.packages.unpaid')}</span></div>
                {selectedPackage.weight && (
                  <div className="mobile-modal-detail-item"><span className="label">{t('shop.packages.details.weight')}</span><span>{selectedPackage.weight} kg</span></div>
                )}
                {selectedPackage.dimensions && (
                  <div className="mobile-modal-detail-item"><span className="label">{t('shop.packages.details.dimensions')}</span><span>{selectedPackage.dimensions}</span></div>
                )}
                <div className="mobile-modal-detail-item full-width">
                  <span className="label">{t('shop.packages.details.notesLog')}</span>
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
              </div>
              {/* Shop actions for rejected packages */}
              {selectedPackage.status === 'rejected' && (
                <div className="mobile-modal-actions" style={{flexDirection:'column',gap:8}}>
                  <button className="btn btn-primary" style={{marginBottom:8}} onClick={async () => {
                    await packageService.updatePackageStatus(selectedPackage.id, { status: 'pending' });
                    setShowDetailsModal(false);
                    setPackages(prev => prev.map(p => p.id === selectedPackage.id ? { ...p, status: 'pending' } : p));
                  }}>{t('shop.packages.details.markAsPending')}</button>
                  <button className="btn btn-danger" onClick={async () => {
                    await packageService.updatePackageStatus(selectedPackage.id, { status: 'cancelled-awaiting-return' });
                    setShowDetailsModal(false);
                    setPackages(prev => prev.map(p => p.id === selectedPackage.id ? { ...p, status: 'cancelled-awaiting-return' } : p));
                  }}>{t('shop.packages.details.markAsCancelledAwaitingReturn')}</button>
                </div>
              )}
              <div className="mobile-modal-actions">
                <button className="mobile-modal-close-btn" onClick={closeDetailsModal}>{t('shop.packages.details.close')}</button>
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
              <h3>{t('shop.packages.cancel.title')}</h3>
              <button className="mobile-modal-close" onClick={() => { setShowCancelModal(false); setCancelError(null); }}>&times;</button>
            </div>
            <div className="mobile-modal-body">
              <p>{t('shop.packages.cancel.confirm')}</p>
              {cancelError && <div className="mobile-shop-create-error">{cancelError}</div>}
              <div className="mobile-modal-actions">
                <button className="mobile-modal-close-btn" onClick={() => { setShowCancelModal(false); setCancelError(null); }}>{t('shop.packages.cancel.no')}</button>
                <button className="mobile-shop-package-cancel-btn confirm" onClick={handleCancel}>{t('shop.packages.cancel.yes')}</button>
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
              <h3>{t('shop.packages.markAsPending.title')}</h3>
              <button className="mobile-modal-close" onClick={() => { setShowMarkPendingModal(false); setPackageToMark(null); }}>&times;</button>
            </div>
            <div className="mobile-modal-body">
              <p>{t('shop.packages.markAsPending.confirm')}</p>
              <div className="mobile-modal-actions">
                <button className="mobile-modal-close-btn" onClick={() => { setShowMarkPendingModal(false); setPackageToMark(null); }}>{t('shop.packages.markAsPending.no')}</button>
                <button className="btn btn-primary" onClick={async () => {
                  await packageService.updatePackageStatus(packageToMark.id, { status: 'pending' });
                  setShowMarkPendingModal(false);
                  setPackages(prev => prev.map(p => p.id === packageToMark.id ? { ...p, status: 'pending' } : p));
                  setPackageToMark(null);
                }}>{t('shop.packages.markAsPending.yes')}</button>
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
              <h3>{t('shop.packages.markAsCancelledAwaitingReturn.title')}</h3>
              <button className="mobile-modal-close" onClick={() => { setShowMarkCancelledAwaitingReturnModal(false); setPackageToMark(null); }}>&times;</button>
            </div>
            <div className="mobile-modal-body">
              <p>{t('shop.packages.markAsCancelledAwaitingReturn.confirm')}</p>
              <div className="mobile-modal-actions">
                <button className="mobile-modal-close-btn" onClick={() => { setShowMarkCancelledAwaitingReturnModal(false); setPackageToMark(null); }}>{t('shop.packages.markAsCancelledAwaitingReturn.no')}</button>
                <button className="btn btn-danger" onClick={async () => {
                  await packageService.updatePackageStatus(packageToMark.id, { status: 'cancelled-awaiting-return' });
                  setShowMarkCancelledAwaitingReturnModal(false);
                  setPackages(prev => prev.map(p => p.id === packageToMark.id ? { ...p, status: 'cancelled-awaiting-return' } : p));
                  setPackageToMark(null);
                }}>{t('shop.packages.markAsCancelledAwaitingReturn.yes')}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileShopPackages; 