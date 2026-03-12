/**
 * File Purpose:
 * - Bulk assignment modal for multiple packages.
 * - Lists selected packages, filters available drivers, and applies one driver to all selected items.
 * - Used from package bulk action controls to speed dispatch operations.
 */

import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';

const BulkAssignModal = ({
  showBulkAssignModal,
  selectedPackages,
  packages,
  availableDrivers,
  driverSearchTerm,
  setDriverSearchTerm,
  bulkAssignDriverId,
  setBulkAssignDriverId,
  bulkAssigning,
  handleBulkAssign,
  onClose,
}) => {
  if (!showBulkAssignModal) return null;

  const selectedPackageDetails = packages.filter((pkg) => selectedPackages.includes(pkg.id));
  const filteredDrivers = availableDrivers.filter((driver) => (
    driver.name?.toLowerCase().includes(driverSearchTerm.toLowerCase()) ||
    driver.email?.toLowerCase().includes(driverSearchTerm.toLowerCase())
  ));

  return (
    <div className="modal-overlay show" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Bulk Assign Driver</h3>
          <button className="modal-close" onClick={onClose}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
        <div className="modal-body">
          <div className="selected-packages">
            <h4>Selected Packages ({selectedPackages.length})</h4>
            <div className="packages-list">
              {selectedPackageDetails.map((pkg) => (
                <div key={pkg.id} className="package-item">
                  <strong>{pkg.trackingNumber}</strong> - {pkg.packageDescription}
                  <br />
                  <small>From: {pkg.shop?.businessName || 'N/A'} | To: {pkg.deliveryAddress}</small>
                </div>
              ))}
            </div>
          </div>

          <div className="driver-selection">
            <h4>Select Driver</h4>
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
                  <div
                    key={driver.id}
                    className={`driver-item ${driver.isAvailable ? 'available' : 'unavailable'}`}
                  >
                    <div className="driver-info">
                      <span style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{driver.name}</span>
                      <span className={`driver-availability-status ${driver.isAvailable ? 'available' : 'unavailable'}`}>
                        {driver.isAvailable ? 'Available' : 'Unavailable'}
                      </span>
                      <br />
                      <span style={{ fontSize: '0.8rem' }}>Working Area: <span style={{ fontWeight: 'bold' }}>{driver.workingArea || 'N/A'}</span></span>
                      <span style={{ fontSize: '0.8rem' }}> | Active Assigns: <span style={{ fontWeight: 'bold' }}>{driver.activeAssign || '0'}</span></span>
                      <span style={{ fontSize: '0.8rem' }}> | Assigned Today: <span style={{ fontWeight: 'bold' }}>{driver.assignedToday || '0'}</span></span>
                    </div>
                    <button
                      className={`assign-btn ${bulkAssignDriverId === driver.driverId ? 'selected' : ''}`}
                      onClick={() => setBulkAssignDriverId(driver.driverId)}
                      disabled={!driver.isAvailable || bulkAssigning}
                    >
                      {!driver.isAvailable ? 'Unavailable' : bulkAssignDriverId === driver.driverId ? 'Selected' : 'Select'}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="modal-actions">
            <button className="btn-secondary" onClick={onClose} disabled={bulkAssigning}>
              Cancel
            </button>
            <button className="btn-primary" onClick={handleBulkAssign} disabled={!bulkAssignDriverId || bulkAssigning}>
              {bulkAssigning ? 'Assigning...' : `Assign to ${selectedPackages.length} Package${selectedPackages.length !== 1 ? 's' : ''}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkAssignModal;
