/**
 * File Purpose:
 * - Driver assignment modal for a pickup.
 * - Displays pickup details and lets Admin search/select a driver for that pickup.
 * - Connected to pickup tab actions for scheduled pickup operations.
 */

import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';

const AssignPickupDriverModal = ({
  showAssignPickupDriverModal,
  selectedPickupForDriver,
  availableDrivers,
  pickupDriverSearchTerm,
  setPickupDriverSearchTerm,
  assignDriverToPickup,
  assigningPickupDriver,
  onClose,
}) => {
  if (!showAssignPickupDriverModal || !selectedPickupForDriver) return null;

  const filteredDrivers = availableDrivers.filter((driver) => (
    driver.name?.toLowerCase().includes(pickupDriverSearchTerm.toLowerCase()) ||
    driver.email?.toLowerCase().includes(pickupDriverSearchTerm.toLowerCase())
  ));

  return (
    <div className="modal-overlay show" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Assign Driver to Pickup</h3>
          <button className="modal-close" onClick={onClose}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
        <div className="modal-body">
          <p><strong>Shop:</strong> {selectedPickupForDriver.Shop?.businessName || 'N/A'}</p>
          <p><strong>Scheduled Time:</strong> {new Date(selectedPickupForDriver.scheduledTime).toLocaleString()}</p>
          <div className="search-section">
            <input
              type="text"
              placeholder="Search drivers..."
              value={pickupDriverSearchTerm}
              onChange={(e) => setPickupDriverSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <div className="drivers-list">
            {filteredDrivers.length === 0 ? (
              <p>No available drivers found.</p>
            ) : (
              filteredDrivers.map((driver) => (
                <div key={driver.id} className="driver-item">
                  <div className="driver-info">
                    <strong>{driver.name}</strong>
                    <span>{driver.email}</span>
                    <span>Phone: {driver.phone}</span>
                  </div>
                  <button
                    className="assign-btn"
                    onClick={() => assignDriverToPickup(driver.driverId)}
                    disabled={assigningPickupDriver}
                  >
                    {assigningPickupDriver ? 'Assigning...' : 'Assign'}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignPickupDriverModal;
