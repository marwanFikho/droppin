/**
 * File Purpose:
 * - Details modal for a selected pickup.
 * - Shows pickup metadata and package list within the pickup, with package drill-down support.
 * - Used from pickups tab row actions.
 */

import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';

const PickupDetailsModal = ({
  showPickupModal,
  selectedPickup,
  pickupPackagesLoading,
  pickupPackages,
  onClose,
  onPackageClick,
}) => {
  if (!showPickupModal) return null;

  return (
    <div className={`modal-overlay ${showPickupModal ? 'show' : ''}`} onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Pickup Details</h3>
          <button className="modal-close" onClick={onClose}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
        <div className="modal-body">
          {selectedPickup ? (
            <>
              <div className="pickup-info">
                <p><strong>Shop:</strong> {selectedPickup.Shop?.businessName || 'N/A'}</p>
                <p><strong>Scheduled Time:</strong> {new Date(selectedPickup.scheduledTime).toLocaleString()}</p>
                <p><strong>Address:</strong> {selectedPickup.pickupAddress}</p>
                <p>
                  <strong>Status:</strong>
                  <span className={`status-badge status-${selectedPickup.status}`}>
                    {selectedPickup.status.charAt(0).toUpperCase() + selectedPickup.status.slice(1).replace('_', ' ')}
                  </span>
                </p>
                {selectedPickup.actualPickupTime && (
                  <p><strong>Actual Pickup Time:</strong> {new Date(selectedPickup.actualPickupTime).toLocaleString()}</p>
                )}
              </div>

              <div className="packages-section">
                <h4>Packages in this Pickup</h4>
                {pickupPackagesLoading ? (
                  <p>Loading packages...</p>
                ) : pickupPackages.length === 0 ? (
                  <p>No packages found in this pickup.</p>
                ) : (
                  <table className="packages-table">
                    <thead>
                      <tr>
                        <th>Tracking #</th>
                        <th>Description</th>
                        <th>Status</th>
                        <th>Address</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pickupPackages.map((pkg) => (
                        <tr key={pkg.id} style={{ cursor: 'pointer' }} onClick={() => onPackageClick(pkg)}>
                          <td>{pkg.trackingNumber}</td>
                          <td>{pkg.packageDescription}</td>
                          <td>
                            <span className={`status-badge status-${pkg.status}`}>
                              {pkg.status.charAt(0).toUpperCase() + pkg.status.slice(1).replace('-', ' ')}
                            </span>
                          </td>
                          <td>{pkg.deliveryAddress}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          ) : (
            <p>No pickup data available.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default PickupDetailsModal;
