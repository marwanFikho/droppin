/**
 * File Purpose:
 * - Pickups tab content renderer.
 * - Shows pending/picked-up pickups and exposes assignment, mark-picked-up, delete, and details actions.
 * - Provides operational pickup management UI for Admin.
 */

import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTruck, faCheck, faTrash, faEye } from '@fortawesome/free-solid-svg-icons';

const PickupsSection = ({
  activeTab,
  pickupTab,
  setPickupTab,
  pickupLoading,
  pickups,
  searchTerm,
  drivers,
  openAssignPickupDriverModal,
  handleMarkPickupAsPickedUp,
  pickupStatusUpdating,
  handleDeletePickup,
  deletingPickup,
  handlePickupClick
}) => {
  if (activeTab !== 'pickups') return null;

  const filteredPickups = pickups.filter((pickup) =>
    pickupTab === 'pending' ? pickup.status === 'scheduled' : pickup.status === 'picked_up'
  );

  return (
    <>
      <div className="pickups-header">
        <div className="pickups-sub-tabs d-flex gap-2 mb-3">
          <button
            className={`btn ${pickupTab === 'pending' ? 'btn-primary' : 'btn-outline-secondary'}`}
            onClick={() => setPickupTab('pending')}
          >
            Pending
          </button>
          <button
            className={`btn ${pickupTab === 'pickedup' ? 'btn-primary' : 'btn-outline-secondary'}`}
            onClick={() => setPickupTab('pickedup')}
          >
            Picked Up
          </button>
        </div>
      </div>

      {pickupLoading ? (
        <div className="loading-state">
          <p>Loading pickups...</p>
        </div>
      ) : filteredPickups.length === 0 ? (
        <div className="empty-state">
          <p>No pickups found{searchTerm ? ' matching your search' : ''}.</p>
        </div>
      ) : (
        <div className="table-responsive rounded-4 border">
        <table className="table table-hover align-middle mb-0">
          <thead className="table-light">
            <tr>
              <th>Shop</th>
              <th>Scheduled Time</th>
              <th>Address</th>
              <th>Status</th>
              <th>Package Count</th>
              <th>Driver</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredPickups.map((pickup) => (
              <tr key={pickup.id}>
                <td data-label="Shop">{pickup.Shop?.businessName || 'N/A'}</td>
                <td data-label="Scheduled Time">{new Date(pickup.scheduledTime).toLocaleString()}</td>
                <td data-label="Address">{pickup.pickupAddress}</td>
                <td data-label="Status">
                  <span className={`status-badge status-${pickup.status}`}>
                    {pickup.status.charAt(0).toUpperCase() + pickup.status.slice(1).replace('_', ' ')}
                  </span>
                </td>
                <td data-label="Package Count">{pickup.Packages?.length || 0}</td>
                <td data-label="Driver">
                  {(() => {
                    const driver = drivers.find((d) => d.driverId === pickup.driverId || d.id === pickup.driverId);
                    return driver ? driver.name : 'Unassigned';
                  })()}
                </td>
                <td data-label="Actions">
                  <div className="d-flex flex-wrap gap-1">
                  {pickup.status === 'scheduled' && (
                    <>
                      <button
                        className="btn btn-sm btn-outline-warning"
                        onClick={() => openAssignPickupDriverModal(pickup)}
                        title="Assign Driver"
                      >
                        <FontAwesomeIcon icon={faTruck} />
                      </button>
                      <button
                        className="btn btn-sm btn-outline-success"
                        onClick={() => handleMarkPickupAsPickedUp(pickup.id)}
                        title="Mark as Picked Up"
                        disabled={pickupStatusUpdating[pickup.id]}
                      >
                        <FontAwesomeIcon icon={faCheck} />
                      </button>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleDeletePickup(pickup)}
                        title="Delete Pickup"
                        disabled={deletingPickup}
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                      <button
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => handlePickupClick(pickup)}
                        title="View Packages"
                      >
                        <FontAwesomeIcon icon={faEye} />
                      </button>
                    </>
                  )}
                  {pickup.status !== 'scheduled' && (
                    <button
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => handlePickupClick(pickup)}
                      title="View Packages"
                    >
                      <FontAwesomeIcon icon={faEye} />
                    </button>
                  )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}
    </>
  );
};

export default PickupsSection;
