/**
 * File Purpose:
 * - Driver assignment modal for a single package.
 * - Shows package context, supports driver search/filtering, and exposes assign/change actions.
 * - Used in package details/actions when Admin needs to set or replace a package driver.
 */

import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';

const AssignDriverModal = ({
  showAssignDriverModal,
  selectedPackage,
  availableDrivers,
  driverSearchTerm,
  setDriverSearchTerm,
  drivers,
  assigningDriver,
  onClose,
  onAssign,
}) => {
  if (!showAssignDriverModal || !selectedPackage) return null;

  const filteredDrivers = availableDrivers.filter((driver) => (
    driver.name?.toLowerCase().includes(driverSearchTerm.toLowerCase()) ||
    driver.email?.toLowerCase().includes(driverSearchTerm.toLowerCase())
  ));

  return (
    <div className="modal-overlay show" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{selectedPackage.driverId ? 'Change Driver for Package' : 'Assign Driver to Package'}</h3>
          <button className="modal-close" onClick={onClose}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
        <div className="modal-body">
          <p><strong>Package:</strong> {selectedPackage.trackingNumber} - {selectedPackage.packageDescription}</p>
          <p><strong>From:</strong> {selectedPackage.shop?.businessName || 'N/A'}</p>
          <p><strong>To:</strong> {selectedPackage.deliveryContactName}</p>
          {selectedPackage.driverId && (
            <p>
              <strong>Current Driver:</strong> {
                (() => {
                  const currentDriver = drivers.find((d) => d.driverId === selectedPackage.driverId || d.id === selectedPackage.driverId);
                  return currentDriver ? currentDriver.name : 'Unknown Driver';
                })()
              }
            </p>
          )}

          <div className="search-section">
            <input
              type="text"
              placeholder="Search drivers..."
              value={driverSearchTerm}
              onChange={(e) => setDriverSearchTerm(e.target.value)}
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
                  <button className="assign-btn" onClick={() => onAssign(driver.driverId)} disabled={assigningDriver}>
                    {assigningDriver
                      ? (selectedPackage.driverId ? 'Changing...' : 'Assigning...')
                      : (selectedPackage.driverId ? 'Change to This Driver' : 'Assign')}
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

export default AssignDriverModal;
