import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { driverService, packageService } from '../../services/api';
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

const getStatusBadge = (status, t) => (
  <span className={`mobile-status-badge status-${status}`}>{t(`driver.dashboard.status.${status}`, status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' '))}</span>
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

const getNextStatus = (status, t) => {
  switch (status) {
    case 'assigned': return { next: 'pickedup', label: t('driver.dashboard.actions.markAsPickedUp') };
    case 'pickedup': return { next: 'in-transit', label: t('driver.dashboard.actions.markInTransit') };
    case 'in-transit': return { next: 'delivered', label: t('driver.dashboard.actions.markAsDelivered') };
    default: return null;
  }
};

const MobileDriverDashboard = () => {
  const { currentUser } = useAuth();
  const { t } = useTranslation();
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

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const profileRes = await driverService.getDriverProfile();
        setDriverProfile(profileRes.data);
        setDriverStats(profileRes.data);
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

  if (loading) return <div className="mobile-driver-dashboard-loading">{t('common.loadingDriverDashboard')}</div>;
  if (error) return <div className="mobile-driver-dashboard-error">{t(error)}</div>;

  return (
    <div className="mobile-driver-dashboard" style={{marginTop: '1rem'}}>
      <div className="mobile-driver-dashboard-container">
        {/* Dashboard Header */}
        <div className="mobile-driver-dashboard-header">
          <div className="mobile-driver-dashboard-welcome">
            <h1 className="mobile-driver-dashboard-title">{t('driver.dashboard.title')}</h1>
            <p className="mobile-driver-dashboard-subtitle">
              {t('driver.dashboard.welcome', { name: driverProfile?.User?.name || t('driver.dashboard.driver') })}
            </p>
          </div>
          <div className="mobile-driver-dashboard-icon">🚚</div>
        </div>

        {/* Stats Overview */}
        <div className="mobile-driver-dashboard-stats-row">
          {[
            { label: t('driver.dashboard.stats.assignedToday'), value: driverStats?.assignedToday|| 0, color: '#007bff', icon: '📦' },
            { label: t('driver.dashboard.stats.totalAssigned'), value: driverStats?.totalAssigned || 0, color: '#28a745', icon: '📋' },
            { label: t('driver.dashboard.stats.totalDeliveries'), value: driverStats?.totalDeliveries || 0, color: '#4caf50', icon: '✅' },
            { label: t('driver.dashboard.stats.activeAssignments'), value: driverStats?.activeAssign || 0, color: '#ffc107', icon: '⏳' },
            { label: t('driver.dashboard.stats.cancelled'), value: driverStats?.totalCancelled || 0, color: '#dc3545', icon: '❌' },
          ].map((stat, idx) => (
            <div key={idx} className="mobile-driver-dashboard-stat-card" style={{ background: stat.color }}>
              <span className="mobile-driver-dashboard-stat-icon">{stat.icon}</span>
              <div className="mobile-driver-dashboard-stat-value">{stat.value}</div>
              <div className="mobile-driver-dashboard-stat-label">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Stats & Chart */}
        <div className="mobile-driver-dashboard-section" style={{ marginBottom: 16 }}>
          <h2 className="mobile-driver-dashboard-section-title">{t('driver.dashboard.deliveryStatistics')}</h2>
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
                {t(`driver.dashboard.tabs.${tab}`, tab.charAt(0).toUpperCase() + tab.slice(1))}
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
                const nextStatus = getNextStatus(pkg.status, t);
                const currentColor = getStatusColorHex(pkg.status);
                const nextColor = nextStatus ? getStatusColorHex(nextStatus.next) : '#bdbdbd';
                const gradient = `linear-gradient(90deg, ${currentColor} 0%, ${nextColor} 100%)`;
                return (
                  <div key={pkg.id} className="mobile-driver-dashboard-delivery">
                    <div className="mobile-driver-dashboard-delivery-header">
                      <div className="mobile-driver-dashboard-delivery-id">{pkg.trackingNumber}</div>
                      <div className="mobile-driver-dashboard-delivery-status" style={{ background: currentColor, color: '#fff' }}>
                        {getStatusBadge(pkg.status, t)}
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
                          {statusUpdating[pkg.id] ? t('driver.dashboard.actions.updating') : nextStatus.label}
                        </button>
                      ) : (
                        <span style={{ color: '#aaa', fontSize: 12 }}>{t('driver.dashboard.noActions')}</span>
                      )}
                      <button
                        className="mobile-driver-dashboard-delivery-track-btn"
                        onClick={() => openPackageDetailsModal(pkg)}
                      >
                        {t('driver.dashboard.actions.viewDetails')}
                      </button>
                      {/* Reject button: only show if not delivered, cancelled, or rejected */}
                      {![ 'delivered', 'cancelled', 'cancelled-awaiting-return', 'cancelled-returned', 'rejected' ].includes(pkg.status) && (
                        <button
                          className="mobile-driver-dashboard-delivery-reject-btn"
                          style={{ background: '#e53935', color: '#fff', border: 'none', marginLeft: 8, borderRadius: 18, padding: '7px 18px', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}
                          onClick={() => handleRejectPackage(pkg)}
                          disabled={statusUpdating[pkg.id]}
                        >
                          {statusUpdating[pkg.id] ? t('driver.dashboard.actions.cancelling') : t('driver.dashboard.actions.cancel')}
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
              <h3>{t('driver.dashboard.packageDetails.title')}</h3>
              <button className="mobile-modal-close" onClick={closePackageDetailsModal}>&times;</button>
            </div>
            <div className="mobile-modal-body">
              {modalLoading ? (
                <div className="loading-spinner-container"><div className="loading-spinner"></div></div>
              ) : modalError ? (
                <div className="mobile-error-message">{t('driver.dashboard.packageDetails.error')}</div>
              ) : selectedPackage ? (
                <div className="mobile-modal-details-grid">
                  <div className="mobile-modal-detail-item"><span className="label">{t('driver.dashboard.packageDetails.tracking')}</span><span>{selectedPackage.trackingNumber}</span></div>
                  <div className="mobile-modal-detail-item"><span className="label">{t('driver.dashboard.packageDetails.status')}</span><span className={`mobile-status-badge status-${selectedPackage.status}`}>{t(`driver.dashboard.status.${selectedPackage.status}`, selectedPackage.status)}</span></div>
                  <div className="mobile-modal-detail-item"><span className="label">{t('driver.dashboard.packageDetails.description')}</span><span>{selectedPackage.packageDescription}</span></div>
                  <div className="mobile-modal-detail-item"><span className="label">{t('driver.dashboard.packageDetails.pickupAddress')}</span><span>{selectedPackage.pickupAddress}</span></div>
                  <div className="mobile-modal-detail-item"><span className="label">{t('driver.dashboard.packageDetails.deliveryAddress')}</span><span>{selectedPackage.deliveryAddress}</span></div>
                  <div className="mobile-modal-detail-item"><span className="label">{t('driver.dashboard.packageDetails.codAmount')}</span><span>${parseFloat(selectedPackage.codAmount || 0).toFixed(2)}</span></div>
                  <div className="mobile-modal-detail-item"><span className="label">{t('driver.dashboard.packageDetails.recipientName')}</span><span>{selectedPackage.deliveryContactName}</span></div>
                  <div className="mobile-modal-detail-item"><span className="label">{t('driver.dashboard.packageDetails.recipientPhone')}</span><span>{selectedPackage.deliveryContactPhone}</span></div>
                  <div className="mobile-modal-detail-item full-width">
                    <span className="label">{t('driver.dashboard.packageDetails.notesLog')}</span>
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
                          <div className="notes-log-empty">{t('driver.dashboard.packageDetails.noNotes')}</div>
                        );
                      })()}
                    </div>
                    <textarea
                      value={editingNotes}
                      onChange={e => setEditingNotes(e.target.value)}
                      placeholder={t('driver.dashboard.packageDetails.addNotePlaceholder')}
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
                          setNotesError(t('driver.dashboard.packageDetails.saveNoteError'));
                        } finally {
                          setNotesSaving(false);
                        }
                      }}
                      disabled={notesSaving || !editingNotes.trim()}
                      style={{ marginTop: 8 }}
                    >
                      {notesSaving ? t('driver.dashboard.packageDetails.saving') : t('driver.dashboard.packageDetails.addNote')}
                    </button>
                    {notesError && <div className="mobile-error-message">{notesError}</div>}
                  </div>
                  {selectedPackage.shopNotes && (
                    <div className="mobile-modal-detail-item full-width"><span className="label">{t('driver.dashboard.packageDetails.shopNotes')}</span><span>{selectedPackage.shopNotes}</span></div>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
      {confirmAction && (
        <div className="mobile-modal-overlay" onClick={() => setConfirmAction(null)}>
          <div className="mobile-modal-content" onClick={e => e.stopPropagation()} style={{maxWidth: 340, textAlign: 'center'}}>
            <div className="mobile-modal-header">
              <h3>{t('driver.dashboard.confirmAction.title')}</h3>
              <button className="mobile-modal-close" onClick={() => setConfirmAction(null)}>&times;</button>
            </div>
            <div className="mobile-modal-body">
              {confirmAction.type === 'status' ? (
                <>
                  <p>{t('driver.dashboard.confirmAction.status', { status: confirmAction.nextStatus.replace('-', ' ') })}</p>
                  <button className="btn btn-primary" style={{marginRight: 10}} onClick={() => doStatusAction(confirmAction.pkg, confirmAction.nextStatus)}>{t('driver.dashboard.confirmAction.yesConfirm')}</button>
                </>
              ) : (
                <>
                  <p>{t('driver.dashboard.confirmAction.cancel')}</p>
                  <button className="btn btn-danger" style={{marginRight: 10}} onClick={() => doRejectPackage(confirmAction.pkg)}>{t('driver.dashboard.confirmAction.yesCancel')}</button>
                </>
              )}
              <button className="btn btn-secondary" onClick={() => setConfirmAction(null)}>{t('driver.dashboard.confirmAction.cancelBtn')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileDriverDashboard; 