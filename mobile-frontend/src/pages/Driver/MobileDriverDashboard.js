import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { driverService, packageService, pickupService } from '../../services/api';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import './MobileDriverDashboard.css';
import { useTranslation } from 'react-i18next';
ChartJS.register(ArcElement, Tooltip, Legend);

const packageCategories = {
  current: ['assigned', 'pickedup', 'in-transit'],
  past: ['delivered', 'cancelled', 'returned'],
  delivered: ['delivered'],
  cancelled: ['cancelled'],
  all: ['assigned', 'pickedup', 'in-transit', 'delivered', 'cancelled', 'returned']
};

const pickupCategories = {
  notPickedUp: ['scheduled', 'pending', 'in_storage'],
  pickedUp: ['picked_up', 'completed'],
  all: ['scheduled', 'pending', 'in_storage', 'picked_up', 'completed', 'cancelled']
};

const getStatusBadge = (status) => (
  <span className={`mobile-status-badge status-${status}`}>{status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}</span>
);

const getStatusColorHex = (status) => {
  switch (status) {
    case 'assigned': return '#ff8c00';
    case 'pickedup': return '#ffd600';
    case 'in-transit': return '#ff9800';
    case 'delivered': return '#43a047';
    case 'cancelled': return '#dc3545';
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

const MobileDriverDashboard = () => {
  const { currentUser } = useAuth();
  const [driverProfile, setDriverProfile] = useState(null);
  const [driverStats, setDriverStats] = useState(null);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('current');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [showProfile, setShowProfile] = useState(false);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState(null);
  const [editingNotes, setEditingNotes] = useState('');
  const [notesSaving, setNotesSaving] = useState(false);
  const [notesError, setNotesError] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const { t, i18n } = useTranslation();
  const [lang, setLang] = useState(i18n.language || 'en');
  const [savingLang, setSavingLang] = useState(false);
  const [langError, setLangError] = useState(null);
  const [pickups, setPickups] = useState([]);
  const [pickupModalOpen, setPickupModalOpen] = useState(false);
  const [selectedPickup, setSelectedPickup] = useState(null);
  const [pickupActionLoading, setPickupActionLoading] = useState(false);
  const [pickupModalError, setPickupModalError] = useState(null);
  const [activePickupTab, setActivePickupTab] = useState('notPickedUp');

  const handleToggleLanguage = async () => {
    const newLang = lang === 'en' ? 'ar' : 'en';
    setSavingLang(true);
    setLangError(null);
    try {
      i18n.changeLanguage(newLang);
      setLang(newLang);
      localStorage.setItem('selectedLanguage', newLang);
      await driverService.updateLanguage(newLang);
    } catch (err) {
      setLangError(t('profile.languageSaveError') || 'Failed to save language preference.');
    } finally {
      setSavingLang(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const profileRes = await driverService.getDriverProfile();
        setDriverProfile(profileRes.data);
        setDriverStats(profileRes.data);
        // Set language from profile
        const userLang = (profileRes.data.User?.lang || profileRes.data.user?.lang || 'en').toLowerCase();
        if (userLang === 'ar' || userLang === 'AR') {
          i18n.changeLanguage('ar');
          setLang('ar');
          localStorage.setItem('selectedLanguage', 'ar');
        } else {
          i18n.changeLanguage('en');
          setLang('en');
          localStorage.setItem('selectedLanguage', 'en');
        }
        const packagesRes = await packageService.getPackages({ assignedToMe: true });
        setPackages(packagesRes.data.packages || packagesRes.data || []);
      } catch (err) {
        setError('Failed to load driver data.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchQuery(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    // Fetch assigned pickups for this driver
    const fetchDriverPickups = async () => {
      try {
        const res = await pickupService.getDriverPickups();
        setPickups(res.data || []);
      } catch (err) {
        setPickups([]);
      }
    };
    fetchDriverPickups();
  }, []);

  // Handler to open pickup modal
  const openPickupModal = (pickup) => {
    setSelectedPickup(pickup);
    setPickupModalOpen(true);
    setPickupModalError(null);
  };
  const closePickupModal = () => {
    setPickupModalOpen(false);
    setSelectedPickup(null);
    setPickupModalError(null);
  };
  // Handler to mark pickup as picked up
  const handleMarkPickupAsPickedUp = async (pickupId) => {
    setPickupActionLoading(true);
    setPickupModalError(null);
    try {
      await pickupService.markPickupAsPickedUp(pickupId);
      // Refresh pickups
      const res = await pickupService.getDriverPickups();
      setPickups(res.data || []);
      closePickupModal();
    } catch (err) {
      setPickupModalError('Failed to mark pickup as picked up.');
    } finally {
      setPickupActionLoading(false);
    }
  };

  const handleToggleAvailability = async () => {
    if (!driverProfile) return;
    setAvailabilityLoading(true);
    try {
      await driverService.updateAvailability(!driverProfile.isAvailable);
      setDriverProfile(prev => ({ ...prev, isAvailable: !prev.isAvailable }));
    } catch (err) {
      setError('Failed to update availability.');
    } finally {
      setAvailabilityLoading(false);
    }
  };

  const handleStatusAction = (pkg, nextStatus) => {
    setConfirmAction({ type: 'status', pkg, nextStatus });
  };

  const handleRejectPackage = (pkg) => {
    setConfirmAction({ type: 'reject', pkg });
  };

  const doStatusAction = async (pkg, nextStatus) => {
    setStatusUpdating((prev) => ({ ...prev, [pkg.id]: true }));
    try {
      await packageService.updatePackageStatus(pkg.id, { status: nextStatus });
      // Refresh packages
      const packagesRes = await packageService.getPackages({ assignedToMe: true });
      setPackages(packagesRes.data.packages || packagesRes.data || []);
    } catch (err) {
      setError('Failed to update package status.');
    } finally {
      setStatusUpdating((prev) => ({ ...prev, [pkg.id]: false }));
      setConfirmAction(null);
    }
  };

  const doRejectPackage = async (pkg) => {
    setStatusUpdating((prev) => ({ ...prev, [pkg.id]: true }));
    try {
      await packageService.updatePackageStatus(pkg.id, { status: 'rejected' });
      // Refresh packages
      const packagesRes = await packageService.getPackages({ assignedToMe: true });
      setPackages(packagesRes.data.packages || packagesRes.data || []);
    } catch (err) {
      setError('Failed to cancel package.');
    } finally {
      setStatusUpdating((prev) => ({ ...prev, [pkg.id]: false }));
      setConfirmAction(null);
    }
  };

  const openPackageDetailsModal = async (pkg) => {
    setModalLoading(true);
    setModalError(null);
    setSelectedPackage(pkg);
    setIsModalOpen(true);
    setEditingNotes('');
    try {
      const response = await packageService.getPackageById(pkg.id);
      setSelectedPackage(response.data);
      setEditingNotes('');
    } catch (err) {
      setModalError('Could not fetch complete package details.');
    } finally {
      setModalLoading(false);
    }
  };

  const closePackageDetailsModal = () => {
    setIsModalOpen(false);
    setSelectedPackage(null);
  };

  const handleSaveNotes = async () => {
    if (!selectedPackage) return;
    setNotesSaving(true);
    setNotesError(null);
    try {
      const res = await packageService.updatePackageNotes(selectedPackage.id, editingNotes);
      setSelectedPackage(prev => ({ ...prev, notes: res.data.notes }));
      setEditingNotes('');
    } catch (err) {
      setNotesError('Failed to save notes.');
    } finally {
      setNotesSaving(false);
    }
  };

  const getFilteredPackages = useCallback(() => {
    let filtered = packages;
    if (activeTab !== 'all') {
      filtered = filtered.filter(pkg => packageCategories[activeTab].includes(pkg.status));
    }
    if (debouncedSearchQuery.trim()) {
      const query = debouncedSearchQuery.toLowerCase().trim();
      filtered = filtered.filter(pkg =>
        (pkg.trackingNumber || '').toLowerCase().includes(query) ||
        (pkg.packageDescription || '').toLowerCase().includes(query) ||
        (pkg.deliveryAddress || '').toLowerCase().includes(query) ||
        (pkg.status || '').toLowerCase().includes(query)
      );
    }
    return filtered;
  }, [packages, activeTab, debouncedSearchQuery]);

  // Helper to filter pickups by tab
  const getFilteredPickups = useCallback(() => {
    let filtered = pickups;
    if (activePickupTab !== 'all') {
      filtered = filtered.filter(pickup => pickupCategories[activePickupTab].includes(pickup.status));
    }
    return filtered;
  }, [pickups, activePickupTab]);

  // Chart Data
  const chartData = {
    labels: ['Active Assigned', 'Delivered', 'Cancelled'],
    datasets: [
      {
        data: [driverStats?.activeAssign || 0, driverStats?.totalDeliveries || 0, driverStats?.totalCancelled || 0],
        backgroundColor: ['#ffd700', '#43a047', '#e53935'],
        borderColor: ['#ffd700', '#43a047', '#e53935'],
        borderWidth: 1,
      },
    ],
  };
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          boxWidth: 12,
          padding: 8,
          font: { size: 11 }
        }
      }
    }
  };

  // Sync editingNotes with selectedPackage.notes when modal opens or selectedPackage changes
  useEffect(() => {
    if (isModalOpen && selectedPackage) {
      setEditingNotes('');
    }
  }, [isModalOpen, selectedPackage]);

  if (loading) return <div className="mobile-driver-dashboard-loading">{t('driver.dashboard.loading')}</div>;
  if (error) return <div className="mobile-driver-dashboard-error">{t('driver.dashboard.error')}</div>;

  return (
    <div className="mobile-driver-dashboard" style={{marginTop: '1rem'}}>
      <div className="mobile-driver-dashboard-container">
        {/* Dashboard Header */}
        <div className="mobile-driver-dashboard-header">
          <div className="mobile-driver-dashboard-welcome">
            <h1 className="mobile-driver-dashboard-title">{t('driver.dashboard.title')}</h1>
            <p className="mobile-driver-dashboard-subtitle">
              {t('driver.dashboard.subtitle', { name: driverProfile?.User?.name || t('driver.profile.myProfile') })}
            </p>
          </div>
          <div className="mobile-driver-dashboard-icon">🚚</div>
        </div>

        {/* Stats Overview */}
        <div className="mobile-driver-dashboard-stats-row">
          {[
            { label: t('driver.dashboard.assignedToday'), value: driverStats?.assignedToday|| 0, color: '#007bff', icon: '📦' },
            { label: t('driver.dashboard.totalAssigned'), value: driverStats?.totalAssigned || 0, color: '#28a745', icon: '📋' },
            { label: t('driver.dashboard.totalDeliveries'), value: driverStats?.totalDeliveries || 0, color: '#4caf50', icon: '✅' },
            { label: t('driver.dashboard.activeAssignments'), value: driverStats?.activeAssign || 0, color: '#ffc107', icon: '⏳' },
            { label: t('driver.dashboard.cancelled'), value: driverStats?.totalCancelled || 0, color: '#dc3545', icon: '❌' },
          ].map((stat, idx) => (
            <div key={idx} className="mobile-driver-dashboard-stat-card" style={{ background: stat.color }}>
              <span className="mobile-driver-dashboard-stat-icon">{stat.icon}</span>
              <div className="mobile-driver-dashboard-stat-value">{stat.value}</div>
              <div className="mobile-driver-dashboard-stat-label">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Mark as Pickup button above Delivery Statistics Modal */}
        <div style={{ textAlign: 'center', margin: '1.5rem 0 1rem 0' }}>
          <button
            className="btn btn-primary"
            style={{ fontSize: 18, padding: '12px 32px', borderRadius: 24 }}
            onClick={() => window.open('/driver/scan-pickup', '_blank')}
          >
            {t('driver.dashboard.markAsPickup')}
          </button>
        </div>

        {/* Assigned Pickups Section with Tabs */}
        <div className="mobile-driver-dashboard-section">
          <h2 className="mobile-driver-dashboard-section-title">Assigned Pickups</h2>
          <div className="mobile-driver-dashboard-tabs-modern" style={{ marginBottom: 12 }}>
            {Object.keys(pickupCategories).map(tab => (
              <button
                key={tab}
                className={`mobile-driver-dashboard-tab-modern${activePickupTab === tab ? ' active' : ''}`}
                onClick={() => setActivePickupTab(tab)}
              >
                {t(`driver.dashboard.pickupTab_${tab}`, tab === 'notPickedUp' ? 'Not Picked Up' : tab === 'pickedUp' ? 'Picked Up' : 'All')}
                <span className="mobile-driver-dashboard-tab-count">
                  {pickups.filter(pickup => tab === 'all' ? true : pickupCategories[tab].includes(pickup.status)).length}
                </span>
              </button>
            ))}
          </div>
          {getFilteredPickups().length === 0 ? (
            <div style={{ color: '#888', textAlign: 'center', padding: '1rem' }}>No assigned pickups.</div>
          ) : (
            getFilteredPickups().map(pickup => (
              <div key={pickup.id} className="mobile-driver-dashboard-pickup-card" style={{marginBottom: 16, background: '#fff', borderRadius: 12, boxShadow: '0 2px 4px rgba(0,0,0,0.07)', padding: 16}}>
                <div><strong>Shop:</strong> {pickup.Shop?.businessName || 'N/A'}</div>
                <div><strong>Scheduled:</strong> {pickup.scheduledTime ? new Date(pickup.scheduledTime).toLocaleString() : '-'}</div>
                <div><strong>Status:</strong> {pickup.status}</div>
                <div><strong>Packages:</strong> {pickup.Packages?.length || 0}</div>
                <button className="btn btn-primary" style={{marginTop: 8}} onClick={() => openPickupModal(pickup)}>
                  View Details
                </button>
              </div>
            ))
          )}
        </div>

        {/* Stats & Chart */}
        <div className="mobile-driver-dashboard-section" style={{ marginBottom: 16 }}>
          <h2 className="mobile-driver-dashboard-section-title">{t('driver.dashboard.deliveryStats')}</h2>
          <div style={{ width: '100%', maxWidth: 260, margin: '0 auto', height: 180 }}>
            <Doughnut data={chartData} options={chartOptions} />
          </div>
        </div>

        {/* Package Tabs & Search */}
        <div className="mobile-driver-dashboard-section" style={{ marginBottom: 16 }}>
          <div className="mobile-driver-dashboard-tabs-modern">
            {Object.keys(packageCategories).map(tab => (
              <button
                key={tab}
                className={`mobile-driver-dashboard-tab-modern${activeTab === tab ? ' active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {t(`driver.dashboard.tab_${tab}`)}
                <span className="mobile-driver-dashboard-tab-count">
                  {packages.filter(pkg => tab === 'all' ? true : packageCategories[tab].includes(pkg.status)).length}
                </span>
              </button>
            ))}
          </div>
          <div className="mobile-driver-dashboard-search-bar">
            <input
              type="text"
              placeholder={t('driver.dashboard.searchPlaceholder')}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Packages List */}
        <div className="mobile-driver-dashboard-section">
          <h2 className="mobile-driver-dashboard-section-title">{t('driver.dashboard.myPackages')}</h2>
          <div className="mobile-driver-dashboard-deliveries">
            {getFilteredPackages().length === 0 ? (
              <div style={{ color: '#888', textAlign: 'center', padding: '1rem' }}>{t('driver.dashboard.noPackages')}</div>
            ) : (
              getFilteredPackages().map(pkg => {
                const nextStatus = getNextStatus(pkg.status);
                const currentColor = getStatusColorHex(pkg.status);
                const nextColor = nextStatus ? getStatusColorHex(nextStatus.next) : '#bdbdbd';
                const gradient = `linear-gradient(90deg, ${currentColor} 0%, ${nextColor} 100%)`;
                return (
                  <div key={pkg.id} className="mobile-driver-dashboard-delivery">
                    <div className="mobile-driver-dashboard-delivery-header">
                      <div className="mobile-driver-dashboard-delivery-id">{pkg.trackingNumber}</div>
                      <div className="mobile-driver-dashboard-delivery-status" style={{ background: currentColor, color: '#fff' }}>
                        {pkg.status.charAt(0).toUpperCase() + pkg.status.slice(1).replace('_', ' ')}
                      </div>
                    </div>
                    <div className="mobile-driver-dashboard-delivery-details">
                      <div className="mobile-driver-dashboard-delivery-tracking">
                        <strong>{t('driver.dashboard.description')}:</strong> {pkg.packageDescription || '-'}
                      </div>
                      <div className="mobile-driver-dashboard-delivery-address">
                        <strong>{t('driver.dashboard.address')}:</strong> {pkg.deliveryAddress || '-'}
                      </div>
                      <div className="mobile-driver-dashboard-delivery-time">
                        <strong>{t('driver.dashboard.cod')}:</strong> ${parseFloat(pkg.codAmount || 0).toFixed(2)}
                      </div>
                    </div>
                    <div className="mobile-driver-dashboard-delivery-actions">
                      {nextStatus ? (
                        <button
                          className="mobile-driver-dashboard-delivery-start-btn"
                          style={{ background: gradient, color: pkg.status === 'pickedup' ? '#333' : '#fff', border: 'none' }}
                          onClick={() => handleStatusAction(pkg, nextStatus.next)}
                          disabled={statusUpdating[pkg.id]}
                        >
                          {statusUpdating[pkg.id] ? t('driver.dashboard.updating') :
                            t(
                              getNextStatus(pkg.status)?.next === 'pickedup'
                                ? 'driver.dashboard.markAsPickedUp'
                                : getNextStatus(pkg.status)?.next === 'in-transit'
                                  ? 'driver.dashboard.markInTransit'
                                  : getNextStatus(pkg.status)?.next === 'delivered'
                                    ? 'driver.dashboard.markAsDelivered'
                                    : 'driver.dashboard.noActions'
                            )}
                        </button>
                      ) : (
                        <span style={{ color: '#aaa', fontSize: 12 }}>{t('driver.dashboard.noActions')}</span>
                      )}
                      <button
                        className="mobile-driver-dashboard-delivery-track-btn"
                        onClick={() => openPackageDetailsModal(pkg)}
                      >
                        {t('driver.dashboard.viewDetails')}
                      </button>
                      {/* Reject button: only show if not delivered, cancelled, or rejected */}
                      {![ 'delivered', 'cancelled', 'cancelled-awaiting-return', 'cancelled-returned', 'rejected' ].includes(pkg.status) && (
                        <button
                          className="mobile-driver-dashboard-delivery-reject-btn"
                          style={{ background: '#e53935', color: '#fff', border: 'none', marginLeft: 8, borderRadius: 18, padding: '7px 18px', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}
                          onClick={() => handleRejectPackage(pkg)}
                          disabled={statusUpdating[pkg.id]}
                        >
                          {statusUpdating[pkg.id] ? t('driver.dashboard.cancelling') : t('driver.dashboard.cancel')}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
      {isModalOpen && (
        <div className="mobile-modal-overlay" onClick={closePackageDetailsModal}>
          <div className="mobile-modal-content" onClick={e => e.stopPropagation()}>
            <div className="mobile-modal-header">
              <h3>{t('driver.dashboard.packageDetails')}</h3>
              <button className="mobile-modal-close" onClick={closePackageDetailsModal}>&times;</button>
            </div>
            <div className="mobile-modal-body">
              {modalLoading ? (
                <div className="loading-spinner-container"><div className="loading-spinner"></div></div>
              ) : modalError ? (
                <div className="mobile-error-message">{modalError}</div>
              ) : selectedPackage ? (
                <div className="mobile-modal-details-grid">
                  <div className="mobile-modal-detail-item"><span className="label">{t('driver.dashboard.trackingNumber')}</span><span>{selectedPackage.trackingNumber}</span></div>
                  <div className="mobile-modal-detail-item"><span className="label">{t('driver.dashboard.status')}</span><span className={`mobile-status-badge status-${selectedPackage.status}`}>{selectedPackage.status}</span></div>
                  <div className="mobile-modal-detail-item"><span className="label">{t('driver.dashboard.description')}</span><span>{selectedPackage.packageDescription}</span></div>
                  <div className="mobile-modal-detail-item"><span className="label">{t('driver.dashboard.pickupAddress')}</span><span>{selectedPackage.pickupAddress}</span></div>
                  <div className="mobile-modal-detail-item"><span className="label">{t('driver.dashboard.deliveryAddress')}</span><span>{selectedPackage.deliveryAddress}</span></div>
                  <div className="mobile-modal-detail-item"><span className="label">{t('driver.dashboard.codAmount')}</span><span>${parseFloat(selectedPackage.codAmount || 0).toFixed(2)}</span></div>
                  <div className="mobile-modal-detail-item"><span className="label">Delivery Cost</span><span>${parseFloat(selectedPackage.deliveryCost || 0).toFixed(2)}</span></div>
                  <div className="mobile-modal-detail-item"><span className="label">{t('driver.dashboard.recipientName')}</span><span>{selectedPackage.deliveryContactName}</span></div>
                  <div className="mobile-modal-detail-item"><span className="label">{t('driver.dashboard.recipientPhone')}</span><span>{selectedPackage.deliveryContactPhone}</span></div>
                  <div className="mobile-modal-detail-item"><span className="label">{t('driver.dashboard.itemsNo')}</span><span>{selectedPackage.itemsNo ?? '-'}</span></div>
                  <div className="mobile-modal-detail-item full-width">
                    <span className="label">{t('driver.dashboard.notesLog')}</span>
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
                          <div className="notes-log-empty">{t('driver.dashboard.noNotes')}</div>
                        );
                      })()}
                    </div>
                    <textarea
                      value={editingNotes}
                      onChange={e => setEditingNotes(e.target.value)}
                      placeholder={t('driver.dashboard.addNotePlaceholder')}
                      rows={2}
                      style={{ width: '100%', marginTop: 4 }}
                    />
                    <button
                      className="mobile-modal-save-notes-btn"
                      onClick={async () => {
                        if (!editingNotes.trim()) return;
                        setNotesSaving(true);
                        setNotesError(null);
                        try {
                          const res = await packageService.updatePackageNotes(selectedPackage.id, editingNotes);
                          setSelectedPackage(prev => ({ ...prev, notes: res.data.notes }));
                          setEditingNotes('');
                        } catch (err) {
                          setNotesError(t('driver.dashboard.failedSaveNote'));
                        } finally {
                          setNotesSaving(false);
                        }
                      }}
                      disabled={notesSaving || !editingNotes.trim()}
                      style={{ marginTop: 8 }}
                    >
                      {notesSaving ? t('driver.dashboard.saving') : t('driver.dashboard.addNote')}
                    </button>
                    {notesError && <div className="mobile-error-message">{notesError}</div>}
                  </div>
                  {selectedPackage.shopNotes && (
                    <div className="mobile-modal-detail-item full-width"><span className="label">{t('driver.dashboard.shopNotes')}</span><span>{selectedPackage.shopNotes}</span></div>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
      {pickupModalOpen && selectedPickup && (
        <div className="mobile-modal-overlay" onClick={closePickupModal}>
          <div className="mobile-modal-content" onClick={e => e.stopPropagation()} style={{maxWidth: 340}}>
            <div className="mobile-modal-header">
              <h3>Pickup Details</h3>
              <button className="mobile-modal-close" onClick={closePickupModal}>&times;</button>
            </div>
            <div className="mobile-modal-body">
              <div><strong>Shop:</strong> {selectedPickup.Shop?.businessName || 'N/A'}</div>
              <div><strong>Scheduled:</strong> {selectedPickup.scheduledTime ? new Date(selectedPickup.scheduledTime).toLocaleString() : '-'}</div>
              <div><strong>Status:</strong> {selectedPickup.status}</div>
              <div><strong>Packages:</strong> {selectedPickup.Packages?.length || 0}</div>
              <div style={{marginTop: 12}}>
                <strong>Packages in this Pickup:</strong>
                {selectedPickup.Packages && selectedPickup.Packages.length > 0 ? (
                  <ul style={{margin: 0, padding: 0, listStyle: 'none'}}>
                    {selectedPickup.Packages.map(pkg => (
                      <li key={pkg.id} style={{marginBottom: 6, fontSize: 14}}>
                        #{pkg.trackingNumber} - {pkg.packageDescription} - <span className={`status-badge status-${pkg.status}`}>{pkg.status}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div style={{fontSize: 14, color: '#888'}}>No packages in this pickup.</div>
                )}
              </div>
              {selectedPickup.status !== 'picked_up' && (
                <button className="btn btn-primary" style={{marginTop: 16, width: '100%'}} onClick={() => handleMarkPickupAsPickedUp(selectedPickup.id)} disabled={pickupActionLoading}>
                  {pickupActionLoading ? 'Marking...' : 'Mark as Picked Up'}
                </button>
              )}
              {pickupModalError && <div className="mobile-error-message" style={{marginTop: 8}}>{pickupModalError}</div>}
            </div>
          </div>
        </div>
      )}
      {confirmAction && (
        <div className="mobile-modal-overlay" onClick={() => setConfirmAction(null)}>
          <div className="mobile-modal-content" onClick={e => e.stopPropagation()} style={{maxWidth: 340, textAlign: 'center'}}>
            <div className="mobile-modal-header">
              <h3>{t('driver.dashboard.confirmAction')}</h3>
              <button className="mobile-modal-close" onClick={() => setConfirmAction(null)}>&times;</button>
            </div>
            <div className="mobile-modal-body">
              {confirmAction.type === 'status' ? (
                <>
                  <p dangerouslySetInnerHTML={{ __html: t('driver.dashboard.confirmStatus', {
                    status:
                      confirmAction.nextStatus === 'pickedup'
                        ? t('driver.dashboard.markAsPickedUp')
                        : confirmAction.nextStatus === 'in-transit'
                          ? t('driver.dashboard.markInTransit')
                          : confirmAction.nextStatus === 'delivered'
                            ? t('driver.dashboard.markAsDelivered')
                            : t('driver.dashboard.noActions')
                  }) }} />
                  <button className="btn btn-primary" style={{marginRight: 10}} onClick={() => doStatusAction(confirmAction.pkg, confirmAction.nextStatus)}>{t('driver.dashboard.yesConfirm')}</button>
                </>
              ) : (
                <>
                  <p>{t('driver.dashboard.confirmCancel')}</p>
                  <button className="btn btn-danger" style={{marginRight: 10}} onClick={() => doRejectPackage(confirmAction.pkg)}>{t('driver.dashboard.yesCancel')}</button>
                </>
              )}
              <button className="btn btn-secondary" onClick={() => setConfirmAction(null)}>{t('driver.dashboard.cancelBtn')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileDriverDashboard; 