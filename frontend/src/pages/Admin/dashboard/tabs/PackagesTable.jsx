/**
 * File Purpose:
 * - Main package table renderer for Admin package workflows.
 * - Shows package rows, selection controls, and status-specific action buttons.
 * - Used with server-side filters/pagination to operate on package lifecycle states.
 */

import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faCheck } from '@fortawesome/free-solid-svg-icons';

const PackagesTable = ({
  filteredPackages,
  selectedPackages,
  packagesSubTab,
  packagesTab,
  packageShopFilter,
  handleShopFilterChange,
  availableShops,
  handleSelectAll,
  handleSelectPackage,
  searchTerm,
  drivers,
  viewDetails,
  handleMarkAsReturned,
  handleConfirmDeliveredReturned,
  handleOpenReturnCompleteDialog,
  handleOpenExchangeCompleteDialog,
  handleMoveExchangeToAwaitingReturn,
  handleForwardReturnToPending
}) => {
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth <= 768 : false);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const isAllSelected = filteredPackages.length > 0 && selectedPackages.length === filteredPackages.length;
  const selectionEnabled = (packagesSubTab === 'all' && ['ready-to-assign', 'in-transit', 'all'].includes(packagesTab)) || packagesTab === 'delivered';
  const baseColCount = 8 + (packagesTab === 'delivered' ? 1 : 0) + (packagesTab === 'in-transit' ? 1 : 0);
  const totalColSpan = baseColCount + (selectionEnabled ? 1 : 0);

  const getAssignedDate = (pkg) => {
    let history = pkg?.statusHistory;
    if (typeof history === 'string') {
      try {
        history = JSON.parse(history);
      } catch {
        history = [];
      }
    }
    if (!Array.isArray(history) || history.length === 0) return 'N/A';

    const assignmentEntry = history.find((entry) => {
      const note = String(entry?.note || '').toLowerCase();
      const status = String(entry?.status || '').toLowerCase();
      return (
        note.includes('assigned to driver') ||
        note.includes('driver changed') ||
        status === 'assigned' ||
        status === 'return-in-transit' ||
        status === 'exchange-in-transit'
      );
    });

    const timestamp = assignmentEntry?.timestamp || assignmentEntry?.createdAt || assignmentEntry?.date;
    if (!timestamp) return 'N/A';

    const parsed = new Date(timestamp);
    if (Number.isNaN(parsed.getTime())) return 'N/A';
    return parsed.toLocaleDateString();
  };

  const renderActions = (pkg, compact = false) => (
    <div className={compact ? 'd-flex flex-wrap gap-2 mt-2' : undefined}>
      <button
        className="btn btn-sm btn-outline-primary me-1"
        onClick={() => viewDetails(pkg, 'package')}
        title="View Details"
      >
        <FontAwesomeIcon icon={faEye} />
      </button>

      {packagesTab === 'return-to-shop' && pkg.status === 'cancelled-awaiting-return' && (
        <button className="btn btn-sm btn-outline-success me-1" onClick={() => handleMarkAsReturned(pkg)} title="Mark as Returned">
          <FontAwesomeIcon icon={faCheck} />
        </button>
      )}
      {packagesTab === 'return-to-shop' && pkg.status === 'rejected-awaiting-return' && (
        <button className="btn btn-sm btn-outline-success me-1" onClick={() => handleMarkAsReturned(pkg)} title="Mark as Rejected Returned">
          <FontAwesomeIcon icon={faCheck} />
        </button>
      )}
      {packagesTab === 'return-to-shop' && pkg.status === 'delivered-awaiting-return' && (
        <button className="btn btn-sm btn-outline-success me-1" onClick={() => handleConfirmDeliveredReturned(pkg)} title="Mark as Delivered Returned">
          <FontAwesomeIcon icon={faCheck} />
        </button>
      )}
      {packagesTab === 'return-to-shop' && pkg.status === 'return-pending' && (
        <button className="btn btn-sm btn-outline-success me-1" onClick={() => handleOpenReturnCompleteDialog(pkg)} title="Mark Return Completed">
          <FontAwesomeIcon icon={faCheck} />
        </button>
      )}
      {packagesTab === 'return-to-shop' && pkg.status === 'exchange-awaiting-return' && (
        <button className="btn btn-sm btn-outline-success me-1" onClick={() => handleOpenExchangeCompleteDialog(pkg)} title="Mark Exchange Completed">
          <FontAwesomeIcon icon={faCheck} />
        </button>
      )}
      {packagesTab === 'return-to-shop' && pkg.status === 'exchange-in-transit' && (
        <button className="btn btn-sm btn-outline-success me-1" onClick={() => handleMoveExchangeToAwaitingReturn(pkg)} title="Move to Exchange Awaiting Return">
          <FontAwesomeIcon icon={faCheck} />
        </button>
      )}
      {packagesTab === 'return-to-shop' && pkg.status === 'return-in-transit' && (
        <button className="btn btn-sm btn-outline-success" onClick={() => handleForwardReturnToPending(pkg)} title="Forward Return (to Pending)">
          <FontAwesomeIcon icon={faCheck} />
        </button>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <div className="rounded-4 shadow-sm p-3" style={{ background: '#fffaf5' }}>
        {filteredPackages.length === 0 ? (
          <div className="text-center py-4 text-muted">No packages found{searchTerm ? ' matching your search' : ''}.</div>
        ) : (
          <>
            {selectionEnabled && (
              <div className="d-flex align-items-center gap-2 p-2 rounded-3 border bg-light mb-3">
                <input
                  className="form-check-input"
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  title="Select All"
                />
                <span className="small fw-semibold text-secondary">
                  {isAllSelected ? 'Deselect all' : 'Select all'} ({filteredPackages.length})
                </span>
              </div>
            )}

            <div className="row g-3">
              {filteredPackages.map((pkg) => {
                const driver = drivers.find((d) => d.driverId === pkg.driverId || d.id === pkg.driverId);
                return (
                  <div key={pkg.id} className="col-12">
                    <div
                      className="card border-0 shadow-sm rounded-4 h-100"
                      role="button"
                      tabIndex={0}
                      onClick={() => viewDetails(pkg, 'package')}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          viewDetails(pkg, 'package');
                        }
                      }}
                    >
                      <div className="card-body p-3">
                        <div className="d-flex justify-content-between align-items-start gap-2">
                          <div className="fw-semibold text-dark small">{pkg.trackingNumber || 'N/A'}</div>
                          <div className="d-flex align-items-center gap-2">
                            <span className={`status-badge status-${pkg.status}`}>
                              {pkg.status.split('-').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                            </span>
                            {selectionEnabled && (
                              <input
                                className="form-check-input"
                                type="checkbox"
                                checked={selectedPackages.includes(pkg.id)}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => handleSelectPackage(pkg.id, e.target.checked)}
                              />
                            )}
                          </div>
                        </div>

                        <div className="fw-semibold mt-2">{pkg.packageDescription || 'No description'}</div>
                        <div className="text-secondary small mt-1">{pkg.deliveryAddress || 'No address'}</div>
                        {(pkg.deliveryContactName || pkg.deliveryContactPhone) && (
                          <div className="text-muted small mt-1">
                            {pkg.deliveryContactName || 'N/A'}{pkg.deliveryContactPhone ? ` · ${pkg.deliveryContactPhone}` : ''}
                          </div>
                        )}

                        <div className="d-flex justify-content-between align-items-center mt-3 pt-2 border-top">
                          <span className="small fw-semibold">EGP {parseFloat(pkg.codAmount || 0).toFixed(2)}</span>
                          <span className="small text-muted">{driver ? driver.name : 'Unassigned'}</span>
                        </div>
                        <div className="small text-muted mt-1">From: {pkg.shop?.businessName || 'N/A'}</div>
                        {packagesTab === 'delivered' && (
                          <div className="small text-muted mt-1">
                            Delivered: {pkg.actualDeliveryTime ? new Date(pkg.actualDeliveryTime).toLocaleDateString() : 'N/A'}
                          </div>
                        )}
                        {packagesTab === 'in-transit' && (
                          <div className="small text-muted mt-1">
                            Assigned: {getAssignedDate(pkg)}
                          </div>
                        )}

                        <div
                          className="mt-2"
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => e.stopPropagation()}
                        >
                          {renderActions(pkg, true)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="table-responsive rounded-4 border">
    <table className="table table-hover align-middle mb-0 admin-mobile-table">
      <thead className="table-light">
        <tr>
          {selectionEnabled && (
            <th>
              <input
                className="form-check-input"
                type="checkbox"
                checked={isAllSelected}
                onChange={(e) => handleSelectAll(e.target.checked)}
                title="Select All"
              />
            </th>
          )}
          <th>Tracking Number</th>
          <th>Description</th>
          <th>Status</th>
          {packagesTab === 'delivered' && <th>Delivery Date</th>}
          {packagesTab === 'in-transit' && <th>Assigned Date</th>}
          <th>
            From
            <select
              className="form-select form-select-sm d-inline-block ms-2"
              value={packageShopFilter}
              onChange={(e) => handleShopFilterChange(e.target.value)}
              style={{ width: '160px' }}
            >
              <option value="">All</option>
              {availableShops.map((shop) => (
                <option key={shop.id} value={shop.businessName}>{shop.businessName}</option>
              ))}
            </select>
          </th>
          <th>To</th>
          <th>COD Amount</th>
          <th>Driver</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {filteredPackages.length === 0 ? (
          <tr>
            <td colSpan={totalColSpan} style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div className="empty-state">
                <p>No packages found{searchTerm ? ' matching your search' : ''}.</p>
              </div>
            </td>
          </tr>
        ) : (
          filteredPackages.map((pkg) => (
            <tr key={pkg.id}>
              {selectionEnabled && (
                <td data-label="Select">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    checked={selectedPackages.includes(pkg.id)}
                    onChange={(e) => handleSelectPackage(pkg.id, e.target.checked)}
                  />
                </td>
              )}
              <td data-label="Tracking Number">{pkg.trackingNumber}</td>
              <td data-label="Description">{pkg.packageDescription}</td>
              <td data-label="Status">
                <span className={`status-badge status-${pkg.status}`}>
                  {pkg.status.split('-').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                </span>
              </td>
              {packagesTab === 'delivered' && (
                <td data-label="Delivery Date">
                  {pkg.actualDeliveryTime ? new Date(pkg.actualDeliveryTime).toLocaleDateString() : 'N/A'}
                </td>
              )}
              {packagesTab === 'in-transit' && (
                <td data-label="Assigned Date">{getAssignedDate(pkg)}</td>
              )}
              <td data-label="From">{pkg.shop?.businessName || 'N/A'}</td>
              <td data-label="To">
                <div>{pkg.deliveryAddress}</div>
                {(pkg.deliveryContactName || pkg.deliveryContactPhone) && (
                  <div style={{ fontSize: 12, color: '#555', marginTop: 4 }}>
                    {pkg.deliveryContactName || 'N/A'}{pkg.deliveryContactPhone ? ` · ${pkg.deliveryContactPhone}` : ''}
                  </div>
                )}
              </td>
              <td data-label="COD Amount">EGP {parseFloat(pkg.codAmount || 0).toFixed(2)}</td>
              <td data-label="Driver">
                {(() => {
                  const driver = drivers.find((d) => d.driverId === pkg.driverId || d.id === pkg.driverId);
                  return driver ? driver.name : 'Unassigned';
                })()}
              </td>
              <td data-label="Actions">
                {renderActions(pkg)}
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
    </div>
  );
};

export default PackagesTable;
